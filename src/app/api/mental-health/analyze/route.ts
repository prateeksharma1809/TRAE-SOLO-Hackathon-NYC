import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabase } from '@/lib/csvDatabase';
import { MentalIllnessDetector } from '@/lib/mentalIllnessDetector';

const db = new CSVDatabase();
const detector = new MentalIllnessDetector();

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
    const { text } = await request.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Text must be at least 10 characters long for meaningful analysis' },
        { status: 400 }
      );
    }

    const analysis = detector.analyzeText(text);

    return NextResponse.json({
      analysis,
      disclaimer: "This analysis is for informational purposes only and should not replace professional mental health evaluation."
    });
  } catch (error) {
    console.error('Mental illness detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const conditions = detector.getAllConditions();
    
    return NextResponse.json({
      conditions: conditions.map(condition => ({
        illness: condition.illness,
        definition: condition.definition,
        severity: condition.severity,
        symptoms: condition.symptoms
      }))
    });
  } catch (error) {
    console.error('Get conditions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}