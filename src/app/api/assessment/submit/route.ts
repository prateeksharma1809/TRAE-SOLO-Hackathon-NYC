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
    const assessmentData = await request.json();

    const aiAnalysis = await AIAnalysisEngine.analyzeAssessment(assessmentData);

    const savedAssessment = await db.saveAssessment({
      userId,
      date: new Date().toISOString(),
      journalEntry: assessmentData.journalEntry,
      emotionalTheme: assessmentData.emotionalTheme,
      memorableMoment: assessmentData.memorableMoment,
      energyLevel: assessmentData.energyLevel,
      physicalTension: assessmentData.physicalTension,
      positiveExperience: assessmentData.positiveExperience,
      emotionalNeed: assessmentData.emotionalNeed,
      heartWeather: assessmentData.heartWeather,
      energyDrain: assessmentData.energyDrain,
      copingMechanism: assessmentData.copingMechanism,
      socialConnection: assessmentData.socialConnection
    });

    return NextResponse.json({
      assessment: savedAssessment,
      aiAnalysis
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}