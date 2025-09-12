import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { CourseModel, UserModel } from '@/lib/models';
import { generateTopicQuiz } from '@/lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; topicIndex: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { courseId, topicIndex } = resolvedParams;

    await connectDB();

    // Find the course and verify ownership
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user || !course.createdBy.equals(user._id)) {
      return NextResponse.json(
        { error: 'Unauthorized access to course' },
        { status: 403 }
      );
    }

    const topicIdx = parseInt(topicIndex);

    // Validate index
    if (topicIdx >= course.syllabus.length) {
      return NextResponse.json(
        { error: 'Invalid topic index' },
        { status: 400 }
      );
    }

    const topic = course.syllabus[topicIdx];

    // Check if quiz already generated
    if (topic.quizGenerated && topic.quizContent) {
      return NextResponse.json({
        quizContent: topic.quizContent,
        cached: true
      });
    }

    // Generate quiz using Gemini
    const quizResponse = await generateTopicQuiz({
      courseId,
      topicIndex: topicIdx,
      courseTitle: course.title,
      topicTitle: topic.topic,
      topicDescription: topic.description,
      subtopicTitles: topic.subtopics.map(st => st.name),
      userLevel: course.difficulty || 'beginner'
    });

    // Update the course with generated quiz
    course.syllabus[topicIdx].quizContent = quizResponse.quizContent;
    course.syllabus[topicIdx].quizGenerated = true;
    
    await course.save();

    return NextResponse.json({
      quizContent: quizResponse.quizContent,
      cached: false
    });

  } catch (error) {
    console.error('Error generating topic quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic quiz' },
      { status: 500 }
    );
  }
}
