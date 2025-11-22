import fs from 'fs';
import path from 'path';

export interface MentalIllness {
  illness: string;
  definition: string;
  symptoms: string[];
  keywords: string[];
  severity: 'mild' | 'moderate' | 'severe';
}

export class MentalIllnessDetector {
  private mentalIllnesses: MentalIllness[] = [];

  constructor() {
    this.loadMentalIllnesses();
  }

  private loadMentalIllnesses() {
    const csvPath = path.join(process.cwd(), 'mental_illnesses.csv');
    
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').slice(1); // Skip header

      this.mentalIllnesses = lines
        .filter(line => line.trim())
        .map(line => {
          const [illness, definition] = line.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
          
          if (!illness || !definition) return null;

          return {
            illness,
            definition,
            symptoms: this.extractSymptoms(definition),
            keywords: this.extractKeywords(illness, definition),
            severity: this.assessSeverity(illness)
          };
        })
        .filter(Boolean) as MentalIllness[];
    }
  }

  private extractSymptoms(definition: string): string[] {
    const symptomKeywords = [
      'sadness', 'anxiety', 'worry', 'panic', 'fear', 'depression', 'mania', 'mood',
      'hallucinations', 'delusions', 'disorganized', 'intrusive thoughts', 'compulsions',
      'hyperactivity', 'inattention', 'impulsivity', 'social withdrawal', 'communication',
      'eating', 'sleep', 'substance', 'trauma', 'stress', 'personality', 'behavior'
    ];

    return symptomKeywords.filter(keyword => 
      definition.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private extractKeywords(illness: string, definition: string): string[] {
    const keywords = [
      // Depression
      'depressed', 'sad', 'hopeless', 'worthless', 'empty', 'crying', 'tears', 'loss of interest',
      // Anxiety
      'anxious', 'worried', 'panic', 'fear', 'nervous', 'restless', 'overwhelmed', 'stress',
      // Bipolar
      'manic', 'euphoric', 'irritable', 'racing thoughts', 'impulsive', 'grandiose', 'elevated',
      // PTSD
      'trauma', 'flashback', 'nightmare', 'triggered', 'hypervigilant', 'avoidance', 'intrusive',
      // OCD
      'obsessive', 'compulsive', 'rituals', 'checking', 'contamination', 'intrusive thoughts',
      // ADHD
      'distracted', 'hyperactive', 'impulsive', 'inattentive', 'restless', 'disorganized', 'focus',
      // Eating disorders
      'binge', 'purge', 'restrict', 'body image', 'weight', 'food guilt', 'eating',
      // Personality disorders
      'unstable relationships', 'identity crisis', 'manipulation', 'emptiness', 'abandonment',
      // Psychosis
      'hallucination', 'delusion', 'paranoid', 'disorganized', 'catatonic', 'psychotic',
      // Sleep disorders
      'insomnia', 'hypersomnia', 'nightmare', 'sleep paralysis', 'restless sleep', 'fatigue'
    ];

    const text = `${illness} ${definition}`.toLowerCase();
    return keywords.filter(keyword => text.includes(keyword.toLowerCase()));
  }

  private assessSeverity(illness: string): 'mild' | 'moderate' | 'severe' {
    const severeKeywords = [
      'schizophrenia', 'bipolar i', 'severe', 'psychotic', 'delusional',
      'substance use disorder', 'anorexia nervosa', 'borderline personality'
    ];

    const moderateKeywords = [
      'major depressive', 'panic disorder', 'ptsd', 'ocd', 'bulimia',
      'adhd', 'autism', 'narcissistic'
    ];

    const illnessLower = illness.toLowerCase();

    if (severeKeywords.some(keyword => illnessLower.includes(keyword))) {
      return 'severe';
    } else if (moderateKeywords.some(keyword => illnessLower.includes(keyword))) {
      return 'moderate';
    } else {
      return 'mild';
    }
  }

  analyzeText(text: string): {
    detectedConditions: Array<{
      illness: string;
      definition: string;
      confidence: number;
      severity: string;
      matchedSymptoms: string[];
    }>;
    overallRisk: 'low' | 'moderate' | 'high';
    recommendations: string[];
  } {
    const textLower = text.toLowerCase();
    const detectedConditions = [];

    for (const condition of this.mentalIllnesses) {
      let confidence = 0;
      const matchedSymptoms = [];

      // Check for direct mentions of the illness
      if (textLower.includes(condition.illness.toLowerCase())) {
        confidence += 0.5;
      }

      // Check for symptom matches
      for (const symptom of condition.symptoms) {
        if (textLower.includes(symptom.toLowerCase())) {
          confidence += 0.1;
          matchedSymptoms.push(symptom);
        }
      }

      // Check for keyword matches
      for (const keyword of condition.keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          confidence += 0.05;
        }
      }

      if (confidence >= 0.2) {
        detectedConditions.push({
          illness: condition.illness,
          definition: condition.definition,
          confidence: Math.min(confidence, 1),
          severity: condition.severity,
          matchedSymptoms: [...new Set(matchedSymptoms)]
        });
      }
    }

    // Sort by confidence
    detectedConditions.sort((a, b) => b.confidence - a.confidence);

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(detectedConditions);
    const recommendations = this.generateRecommendations(detectedConditions, overallRisk);

    return {
      detectedConditions: detectedConditions.slice(0, 3), // Top 3 most likely
      overallRisk,
      recommendations
    };
  }

  private calculateOverallRisk(detectedConditions: any[]): 'low' | 'moderate' | 'high' {
    if (detectedConditions.length === 0) return 'low';
    
    const highConfidenceConditions = detectedConditions.filter(c => c.confidence > 0.7);
    const severeConditions = detectedConditions.filter(c => c.severity === 'severe');
    
    if (highConfidenceConditions.length > 0 || severeConditions.length > 0) {
      return 'high';
    } else if (detectedConditions.length > 1) {
      return 'moderate';
    } else {
      return 'low';
    }
  }

  private generateRecommendations(detectedConditions: any[], overallRisk: string): string[] {
    const recommendations = [];

    if (overallRisk === 'high') {
      recommendations.push('Consider seeking professional mental health support');
      recommendations.push('Reach out to a trusted friend or family member');
      recommendations.push('Consider contacting a mental health crisis line if needed');
    } else if (overallRisk === 'moderate') {
      recommendations.push('Monitor your symptoms and consider professional consultation');
      recommendations.push('Practice self-care and stress management techniques');
      recommendations.push('Consider journaling to track your mood patterns');
    } else {
      recommendations.push('Continue maintaining good mental health habits');
      recommendations.push('Practice regular self-care and mindfulness');
      recommendations.push('Stay connected with supportive people in your life');
    }

    // Add specific recommendations based on detected conditions
    for (const condition of detectedConditions) {
      if (condition.illness.toLowerCase().includes('depression')) {
        recommendations.push('Focus on activities that bring you joy and meaning');
        recommendations.push('Maintain regular sleep and meal schedules');
      } else if (condition.illness.toLowerCase().includes('anxiety')) {
        recommendations.push('Practice deep breathing and relaxation techniques');
        recommendations.push('Consider mindfulness or meditation practices');
      } else if (condition.illness.toLowerCase().includes('bipolar')) {
        recommendations.push('Monitor your mood patterns and energy levels');
        recommendations.push('Maintain a consistent daily routine');
      }
    }

    return [...new Set(recommendations)].slice(0, 3);
  }

  getAllConditions(): MentalIllness[] {
    return this.mentalIllnesses;
  }
}