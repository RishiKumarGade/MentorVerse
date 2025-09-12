import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateMCQSuggestion } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.question || !body.correctAnswer || !body.userAnswer || !body.context) {
      return NextResponse.json(
        { error: 'Missing required fields: question, correctAnswer, userAnswer, context' },
        { status: 400 }
      );
    }

    // Generate AI suggestion for wrong answer
    const response = await generateMCQSuggestion({
      question: body.question,
      correctAnswer: body.correctAnswer,
      userAnswer: body.userAnswer,
      context: body.context,
    });

    return NextResponse.json({
      suggestion: response.suggestion,
    });

  } catch (error) {
    console.error('Error generating MCQ suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion. Please try again.' },
      { status: 500 }
    );
  }
}
