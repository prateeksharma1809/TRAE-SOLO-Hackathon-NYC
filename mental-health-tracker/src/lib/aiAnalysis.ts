import { MentalIllnessDetector } from './mentalIllnessDetector'

type CheckinAnalysis = {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  emotionalIndicators: string[]
  suggestedFollowUps: string[]
}

type AssessmentInput = {
  journalEntry: string
  emotionalTheme: string
  memorableMoment: string
  energyLevel: number
  physicalTension: string
  positiveExperience: string
  emotionalNeed: string
  heartWeather: string
  energyDrain: string
  copingMechanism: string
  socialConnection: number
}

type AssessmentAnalysis = {
  overallScore: number
  indicators: {
    emotionalWellbeing: number
    energyLevel: number
    socialConnection: number
  }
  summary: string[]
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY || (process.env as any).openai_api_key
  if (!key) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return strictly valid JSON. No prose.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return null
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

function heuristicSentiment(text: string): CheckinAnalysis {
  const t = text.toLowerCase()
  const positives = ['good', 'great', 'happy', 'calm', 'peaceful', 'hopeful', 'joy']
  const negatives = ['sad', 'depressed', 'anxious', 'worried', 'overwhelmed', 'angry', 'hopeless']
  let score = 0
  const indicators: string[] = []
  for (const w of positives) if (t.includes(w)) { score += 1; indicators.push(w) }
  for (const w of negatives) if (t.includes(w)) { score -= 1; indicators.push(w) }
  const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
  const confidence = Math.min(Math.abs(score) / 5 + 0.3, 0.9)
  const detector = new MentalIllnessDetector()
  const result = detector.analyzeText(text)
  const suggestedFollowUps: string[] = []
  if (sentiment === 'negative') {
    suggestedFollowUps.push('Would you like to share what feels most difficult now?')
    suggestedFollowUps.push('What has helped you even a little in similar moments?')
    suggestedFollowUps.push('Is there someone you would like to reach out to today?')
  } else if (sentiment === 'positive') {
    suggestedFollowUps.push('What contributed most to feeling this way today?')
    suggestedFollowUps.push('How can you carry this into tomorrow?')
  } else {
    suggestedFollowUps.push('What feeling stands out to you right now?')
    suggestedFollowUps.push('What small step could improve your day?')
  }
  return { sentiment, confidence, emotionalIndicators: [...new Set(indicators)], suggestedFollowUps }
}

function heuristicAssessment(input: AssessmentInput): AssessmentAnalysis {
  const emotionalWellbeing = ['Peaceful and calm', 'Happy and joyful', 'Hopeful and optimistic'].includes(input.emotionalTheme) ? 8 : ['Chaotic and overwhelming', 'Anxious and worried', 'Sad and melancholic', 'Angry and frustrated'].includes(input.emotionalTheme) ? 3 : 6
  const energyLevel = input.energyLevel ?? 5
  const socialConnection = input.socialConnection ?? 5
  const overallScore = Math.round(((emotionalWellbeing + energyLevel + socialConnection) / 3) * 10) / 10
  const summary: string[] = []
  if (energyLevel < 5) summary.push('Energy appears low; consider sleep and gentle activity.')
  if (socialConnection < 5) summary.push('Social connection is limited; small reaches can help.')
  if (emotionalWellbeing <= 4) summary.push('Emotional tone leans negative; grounding may help.')
  if (summary.length === 0) summary.push('Patterns look balanced overall.')
  return { overallScore, indicators: { emotionalWellbeing, energyLevel, socialConnection }, summary }
}

export class AIAnalysisEngine {
  static async analyzeResponse(text: string): Promise<CheckinAnalysis> {
    const prompt = `Analyze the user's check-in text and return JSON with keys: sentiment one of [positive, neutral, negative]; confidence number 0-1; emotionalIndicators array of strings; suggestedFollowUps array of 2-3 brief questions. Text: ${text}`
    const ai = await callOpenAI(prompt)
    if (ai && typeof ai.sentiment === 'string') return ai as CheckinAnalysis
    return heuristicSentiment(text)
  }

  static async analyzeAssessment(input: AssessmentInput): Promise<AssessmentAnalysis> {
    const prompt = `Given assessment fields, return JSON with keys: overallScore number 0-10; indicators object with emotionalWellbeing, energyLevel, socialConnection; summary array of brief insights. Input: ${JSON.stringify(input)}`
    const ai = await callOpenAI(prompt)
    if (ai && typeof ai.overallScore === 'number') return ai as AssessmentAnalysis
    return heuristicAssessment(input)
  }
  static async generateSupportiveReply(text: string): Promise<string> {
    const prompt = `Compose a brief, empathetic, supportive 2-3 sentence reply to the user's message. Avoid medical claims; encourage self-care and seeking support when appropriate. Reply only with the message text. Message: ${text}`
    const ai = await callOpenAI(prompt)
    if (ai && typeof ai === 'string') return ai as string
    const t = text.toLowerCase()
    if (t.includes('anxious') || t.includes('overwhelmed')) {
      return 'Thank you for sharing this. It sounds heavy—try a few slow breaths and a short break. You’re not alone, and reaching out to someone you trust can help.'
    }
    if (t.includes('sad') || t.includes('depressed')) {
      return 'I’m sorry you’re feeling this way. A small, gentle step—like a brief walk or texting a friend—can help. If it feels intense, consider contacting a professional or a crisis line.'
    }
    return 'Thanks for sharing. Noticing what helps—even small things—can make a difference. What’s one simple action that could support you today?'
  }
}