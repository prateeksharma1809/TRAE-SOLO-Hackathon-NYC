import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabase } from '@/lib/csvDatabase';

const db = new CSVDatabase();

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = sessionCookie.value;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';

    const assessments = await db.getUserAssessments(userId, 100);
    const responses = await db.getUserResponses(userId, 100);

    const filteredAssessments = filterByTimeRange(assessments, timeRange);
    const filteredResponses = filterByTimeRange(responses, timeRange);

    const mentalHealthData = await db.getMentalHealthData();

    return NextResponse.json({
      assessments: filteredAssessments,
      responses: filteredResponses,
      mentalHealthData,
      summary: generateSummary(filteredAssessments, filteredResponses)
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function filterByTimeRange(data: any[], timeRange: string) {
  const now = new Date();
  const days = parseInt(timeRange.replace('d', ''));
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return data.filter(item => new Date(item.date) >= cutoffDate);
}

function generateSummary(assessments: any[], responses: any[]) {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      averageScore: 0,
      trend: 'stable',
      keyInsights: ['No data available yet'],
      riskFactors: []
    };
  }

  const averageScore = assessments.reduce((sum, assessment) => {
    const energy = Number(assessment.energyLevel ?? 5)
    const energy10 = (energy / 5) * 10
    const emotional = getEmotionalScore(assessment.emotionalTheme)
    const per = (energy10 + emotional) / 2
    return sum + per
  }, 0) / assessments.length;

  const recentAssessments = assessments.slice(0, 7);
  const trend = calculateTrend(recentAssessments);

  const keyInsights = generateInsights(assessments, responses);
  const riskFactors = identifyRiskFactors(assessments);

  return {
    totalAssessments: assessments.length,
    averageScore: Math.min(10, Math.max(0, Math.round(averageScore * 10) / 10)),
    trend,
    keyInsights,
    riskFactors
  };
}

function getEmotionalScore(emotionalTheme: string): number {
  const positiveThemes = ['Peaceful and calm', 'Happy and joyful', 'Hopeful and optimistic'];
  const negativeThemes = ['Chaotic and overwhelming', 'Anxious and worried', 'Sad and melancholic', 'Angry and frustrated'];
  
  if (positiveThemes.includes(emotionalTheme)) return 8;
  if (negativeThemes.includes(emotionalTheme)) return 3;
  return 6;
}

// removed heart weather scoring due to simplified questionnaire

function calculateTrend(assessments: any[]): string {
  if (assessments.length < 2) return 'stable';
  
  const recent = assessments.slice(0, 3);
  const previous = assessments.slice(3, 6);
  
  if (previous.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, a) => sum + a.energyLevel, 0) / recent.length;
  const previousAvg = previous.reduce((sum, a) => sum + a.energyLevel, 0) / previous.length;
  
  if (recentAvg > previousAvg + 0.5) return 'improving';
  if (recentAvg < previousAvg - 0.5) return 'declining';
  return 'stable';
}

function generateInsights(assessments: any[], responses: any[]): string[] {
  const insights = [];
  
  const avgEnergy = assessments.reduce((sum, a) => sum + a.energyLevel, 0) / assessments.length;
  if (avgEnergy < 5) {
    insights.push('Low energy levels detected - consider improving sleep and nutrition');
  }
  
  // social connection removed from questionnaire
  
  const negativeEmotions = assessments.filter(a => 
    ['Chaotic and overwhelming', 'Anxious and worried', 'Sad and melancholic'].includes(a.emotionalTheme)
  ).length;
  
  if (negativeEmotions > assessments.length * 0.5) {
    insights.push('High frequency of negative emotions - consider stress management techniques');
  }
  
  if (insights.length === 0) {
    insights.push('Your mental health patterns appear balanced');
  }
  
  return insights;
}

function identifyRiskFactors(assessments: any[]): string[] {
  const riskFactors = [];
  
  const lowEnergyCount = assessments.filter(a => a.energyLevel < 4).length;
  if (lowEnergyCount > assessments.length * 0.3) {
    riskFactors.push('Persistent low energy levels');
  }
  
  // social connection removed from questionnaire
  
  const negativeThemes = assessments.filter(a => 
    ['Chaotic and overwhelming', 'Anxious and worried', 'Sad and melancholic'].includes(a.emotionalTheme)
  ).length;
  
  if (negativeThemes > assessments.length * 0.5) {
    riskFactors.push('Predominant negative emotional themes');
  }
  
  return riskFactors;
}