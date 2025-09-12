import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { CourseModel, UserModel } from '@/lib/models';
import { generateSubtopicContent } from '@/lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; topicIndex: string; subtopicIndex: string }> }
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
    const { courseId, topicIndex, subtopicIndex } = resolvedParams;

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
    const subtopicIdx = parseInt(subtopicIndex);

    // Validate indices
    if (topicIdx >= course.syllabus.length || subtopicIdx >= course.syllabus[topicIdx].subtopics.length) {
      return NextResponse.json(
        { error: 'Invalid topic or subtopic index' },
        { status: 400 }
      );
    }

    const topic = course.syllabus[topicIdx];
    const subtopic = topic.subtopics[subtopicIdx];

    // Check if content already generated
    if (subtopic.contentGenerated && subtopic.content) {
      return NextResponse.json({
        content: subtopic.content,
        cached: true
      });
    }

    // Generate content using Gemini
    const contentResponse = await generateSubtopicContent({
      courseId,
      topicIndex: topicIdx,
      subtopicIndex: subtopicIdx,
      courseTitle: course.title,
      topicTitle: topic.topic,
      subtopicTitle: subtopic.name,
      subtopicDescription: subtopic.description,
      userLevel: course.difficulty || 'beginner'
    });

    // Update the course with generated content
    course.syllabus[topicIdx].subtopics[subtopicIdx].content = contentResponse.content;
    course.syllabus[topicIdx].subtopics[subtopicIdx].contentGenerated = true;
    
    await course.save();

    return NextResponse.json({
      content: contentResponse.content,
      cached: false
    });

  } catch (error) {
    console.error('Error generating subtopic content:', error);
    return NextResponse.json(
      { error: 'Failed to generate subtopic content' },
      { status: 500 }
    );
  }
}
