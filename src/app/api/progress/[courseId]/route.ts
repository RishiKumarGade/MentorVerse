import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { ProgressModel, UserModel } from '@/lib/models';
import { Checkpoint } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const checkpoint: Checkpoint = body.checkpoint;

    if (!checkpoint || typeof checkpoint.topicIndex !== 'number' || 
        typeof checkpoint.subtopicIndex !== 'number' || 
        typeof checkpoint.position !== 'number') {
      return NextResponse.json(
        { error: 'Invalid checkpoint data' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;

    // Update or create progress
    const existingProgress = await ProgressModel.findOne({
      userId: user._id,
      courseId: resolvedParams.courseId
    });

    if (existingProgress) {
      existingProgress.checkpoint = checkpoint;
      await existingProgress.save();
    } else {
      await ProgressModel.create({
        userId: user._id,
        courseId: resolvedParams.courseId,
        checkpoint: checkpoint
      });
    }

    return NextResponse.json({
      message: 'Progress saved successfully',
      checkpoint: checkpoint
    });

  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;

    // Get progress
    const progress = await ProgressModel.findOne({
      userId: user._id,
      courseId: resolvedParams.courseId
    });

    return NextResponse.json({
      progress: progress || null
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
