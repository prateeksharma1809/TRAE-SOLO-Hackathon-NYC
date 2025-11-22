import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabase } from '@/lib/csvDatabase';
import { AIAnalysisEngine } from '@/lib/aiAnalysis';

const db = new CSVDatabase();

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = sessionCookie.value;
    const { question, response } = await request.json();

    if (!question || !response) {
      return NextResponse.json(
        { error: 'Question and response are required' },
        { status: 400 }
      );
    }

    const aiAnalysis = await AIAnalysisEngine.analyzeResponse(response);
    const aiReply = await AIAnalysisEngine.generateSupportiveReply(response);

    const savedResponse = await db.saveResponse({
      userId,
      date: new Date().toISOString(),
      questionType: 'checkin',
      question,
      response,
      sentiment: aiAnalysis.sentiment,
      aiAnalysis: JSON.stringify(aiAnalysis),
      followUpQuestions: JSON.stringify(aiAnalysis.suggestedFollowUps)
    });

    await db.saveConversation({
      userId,
      date: new Date().toISOString(),
      userMessage: response,
      aiReply,
    });

    return NextResponse.json({
      response: savedResponse,
      aiAnalysis,
      aiReply
    });
  } catch (error) {
    console.error('Checkin response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}