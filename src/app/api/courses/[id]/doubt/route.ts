import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { clarifyDoubt } from '@/lib/gemini';
import { DoubtRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: DoubtRequest = await request.json();
    
    if (!body.doubt || body.doubt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Doubt question is required' },
        { status: 400 }
      );
    }

    if (!body.context || body.context.length === 0) {
      return NextResponse.json(
        { error: 'Context is required for doubt clarification' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    
    // Generate doubt clarification using Gemini
    const response = await clarifyDoubt({
      courseId: resolvedParams.id,
      context: body.context,
      doubt: body.doubt.trim(),
    });

    return NextResponse.json({
      message: 'Doubt clarified successfully',
      answer: response.answer,
    });

  } catch (error) {
    console.error('Error clarifying doubt:', error);
    return NextResponse.json(
      { error: 'Failed to clarify doubt. Please try again.' },
      { status: 500 }
    );
  }
}
