import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { CourseModel, UserModel } from '@/lib/models';
import { generateCourseOutline } from '@/lib/gemini';
import { CourseGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CourseGenerationRequest = await request.json();
    
    if (!body.topic || body.topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate course outline using Gemini
    const courseOutline = await generateCourseOutline({
      topic: body.topic.trim(),
      situation: body.situation?.trim(),
      level: body.level || 'beginner',
      userId: user._id.toString(),
    });

    // Validate generated course outline
    if (!courseOutline.courseTitle || !courseOutline.topics || !Array.isArray(courseOutline.topics)) {
      return NextResponse.json(
        { error: 'Failed to generate valid course outline' },
        { status: 500 }
      );
    }

    // Check for similar existing courses
    const existingCourse = await CourseModel.findOne({
      title: { $regex: new RegExp(courseOutline.courseTitle, 'i') },
      createdBy: user._id
    });

    if (existingCourse) {
      return NextResponse.json({
        message: 'Similar course already exists',
        course: existingCourse,
        isExisting: true
      });
    }

    // Transform outline topics to full topics with empty content
    const transformedTopics = courseOutline.topics.map(topicOutline => ({
      ...topicOutline,
      subtopics: topicOutline.subtopics.map(subtopicOutline => ({
        ...subtopicOutline,
        content: null,
        contentGenerated: false
      })),
      quizContent: null,
      quizGenerated: false
    }));

    // Create new course with outline structure
    const newCourse = new CourseModel({
      title: courseOutline.courseTitle,
      courseDescription: courseOutline.courseDescription || '',
      totalDuration: courseOutline.totalDuration || '',
      difficulty: courseOutline.difficulty || body.level || 'beginner',
      situation: body.situation || '',
      tags: courseOutline.tags || [],
      syllabus: transformedTopics,
      createdBy: user._id,
      upvotes: 0
    });

    await newCourse.save();

    // Update user's courses
    user.courses.push(newCourse._id);
    await user.save();

    return NextResponse.json({
      message: 'Course generated successfully',
      course: newCourse,
      isExisting: false
    });

  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: 'Failed to generate course' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await UserModel.findOne({ email: session.user.email }).populate('courses');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      courses: user.courses || []
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
