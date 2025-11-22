export const DAILY_ASSESSMENT_QUESTIONS = [
  {
    id: 'journalEntry',
    question: 'Describe your day: what happened? You may type or use voice.',
    type: 'textarea',
    placeholder: 'Share your journal entry for today...'
  },
  {
    id: 'emotionalTheme',
    question: 'How are you feeling right now?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: {
      min: 'Very sad',
      max: 'Very happy'
    }
  },
  {
    id: 'memorableMoment',
    question: 'What was the most memorable moment of your day, and why did it stand out?',
    type: 'textarea',
    placeholder: 'Describe a moment that made today unique...'
  },
  {
    id: 'energyLevel',
    question: 'How would you rate your energy level today compared to yesterday?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: {
      min: 'Much lower',
      max: 'Much higher'
    }
  },
  {
    id: 'positiveExperience',
    question: 'What made you smile today?',
    type: 'textarea',
    placeholder: 'No matter how small, what went well today?'
  },
  
];

export interface AssessmentResponse {
  journalEntry: string;
  emotionalTheme: string;
  memorableMoment: string;
  energyLevel: number;
  physicalTension: string;
  positiveExperience: string;
  emotionalNeed: string;
  heartWeather: string;
  energyDrain: string;
  copingMechanism: string;
  socialConnection: number;
}