import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const audio = form.get('audio') as Blob | null
    if (!audio) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const key = process.env.OPENAI_API_KEY || (process.env as any).openai_api_key
    if (!key) {
      return NextResponse.json({ error: 'OpenAI key not configured' }, { status: 500 })
    }

    const oform = new FormData()
    oform.append('file', audio, 'recording.webm')
    oform.append('model', 'gpt-4o-mini-transcribe')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: oform,
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: 'Transcription failed', detail: errText }, { status: 502 })
    }

    const data = await res.json()
    const text = data.text || ''
    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}