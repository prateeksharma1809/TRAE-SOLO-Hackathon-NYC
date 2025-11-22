'use client';

import { useState, useEffect, useRef } from 'react';
import { DAILY_ASSESSMENT_QUESTIONS, AssessmentResponse } from '@/lib/assessmentQuestions'
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, Mic, MicOff } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {}, [user]);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Session check error:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f57f6] to-[#ffd9b3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7f57f6] to-[#ffd9b3]">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Mindline</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                  <a href="/reports" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Reports</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          

          <IntegratedAssessment user={user} />
        </div>
      </main>
    </div>
  );
}

function IntegratedAssessment({ user }: { user: User }) {
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<Partial<AssessmentResponse>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [suggestion, setSuggestion] = useState('')
  const [therapists, setTherapists] = useState<any[]>([])
  const [feeling, setFeeling] = useState(3)
  const [isListening, setIsListening] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  const current = DAILY_ASSESSMENT_QUESTIONS[index]
  const total = DAILY_ASSESSMENT_QUESTIONS.length

  const setValue = (id: keyof AssessmentResponse, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  const next = () => {
    if (index < total - 1) setIndex(index + 1)
    else submit()
  }

  const back = () => {
    if (index > 0) setIndex(index - 1)
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responses)
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data.aiAnalysis)
        const ind = data.aiAnalysis?.indicators || {}
        const emo = ind.emotionalWellbeing ?? 6
        const energy = ind.energyLevel ?? 5
        if (emo <= 4 || energy <= 3) setSuggestion('Based on today, consider speaking with a therapist.')
        else if (emo <= 6) setSuggestion('A quick chat with a friend could help today.')
        else setSuggestion('You seem balanced — keep up the self-care!')
        try {
          const resT = await fetch('/api/therapists?city=New%20York')
          const dataT = await resT.json()
          setTherapists(dataT.therapists || [])
        } catch {}
        toast.success('Assessment recorded')
      } else {
        toast.error('Error saving assessment')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const renderInput = () => {
    if (!current) return null
    if (current.id === 'emotionalTheme') {
      return (
        <div className="flex items-center justify-between text-3xl">
          {[
            { v: 1, e: '😭' },
            { v: 2, e: '☹️' },
            { v: 3, e: '😐' },
            { v: 4, e: '🙂' },
            { v: 5, e: '😄' },
          ].map(item => (
            <button
              key={item.v}
              type="button"
              onClick={() => {
                setFeeling(item.v)
                const map: any = { 1: 'Sad and melancholic', 2: 'Tired and drained', 3: 'Neutral', 4: 'Hopeful and optimistic', 5: 'Happy and joyful' }
                setValue('emotionalTheme' as any, map[item.v])
              }}
              className={`px-3 py-2 rounded-lg ${feeling===item.v ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-white'}`}
            >
              {item.e}
            </button>
          ))}
        </div>
      )
    }
    
    if (current.type === 'textarea') {
      return (
        <AutoTextarea
          value={(responses as any)[current.id] || ''}
          onChange={(e)=>setValue(current.id as any, e.target.value)}
          placeholder={current.placeholder}
          isListening={isListening}
          startVoiceRecognition={startVoiceRecognition}
          stopVoiceRecognition={stopVoiceRecognition}
        />
      )
    }
    if (current.type === 'scale') {
      const min = current.min || 1
      const max = current.max || 5
      const val = (responses as any)[current.id] ?? 3
      if (min === 1 && max === 5) {
        return (
          <div>
            <div className="flex items-center justify-between text-3xl mb-2">
              {[
                { v: 1, e: '😭' },
                { v: 2, e: '☹️' },
                { v: 3, e: '😐' },
                { v: 4, e: '🙂' },
                { v: 5, e: '😄' },
              ].map(item => (
                <button
                  key={item.v}
                  type="button"
                  onClick={() => {
                    if (current.id === 'emotionalTheme') {
                      setFeeling(item.v)
                      const map: any = { 1: 'Sad and melancholic', 2: 'Tired and drained', 3: 'Neutral', 4: 'Hopeful and optimistic', 5: 'Happy and joyful' }
                      setValue('emotionalTheme' as any, map[item.v])
                    } else {
                      setValue(current.id as any, item.v)
                    }
                  }}
                  className={`px-3 py-2 rounded-lg ${((current.id === 'emotionalTheme' ? feeling : (responses as any)[current.id]) || 3) === item.v ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-white'}`}
                >
                  {item.e}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{current.labels?.min}</span>
              <span>{current.labels?.max}</span>
            </div>
          </div>
        )
      }
      return (
        <div>
          <input type="range" min={min} max={max} value={val}
            onChange={(e)=>setValue(current.id as any, parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{current.labels?.min}</span>
            <span>{val}</span>
            <span>{current.labels?.max}</span>
          </div>
        </div>
      )
    }
    return null
  }

  const startVoiceRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e: any) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstart = () => { setIsListening(true) }
      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const form = new FormData()
          form.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          const text = data.text || ''
          if (current?.type === 'textarea' || current?.type === 'select') {
            setValue(current.id as any, text)
          }
        } catch {} finally {
          setIsListening(false)
          mediaRecorderRef.current = null
          try { stream.getTracks().forEach(t => t.stop()) } catch {}
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
    } catch {
      setIsListening(false)
    }
  }

  const stopVoiceRecognition = () => {
    const r = mediaRecorderRef.current
    if (r && r.state === 'recording') r.stop()
  }

  const cardStyle = () => {
    if (current?.type === 'scale') {
      const colorMap: any = {
        1: '#7f57f6',
        2: '#a78bfa',
        3: '#ffffff',
        4: '#fff3c4',
        5: '#fde047',
      }
      const val = current.id === 'emotionalTheme' ? feeling || 3 : (responses as any)[current.id] || 3
      const c = colorMap[val] || '#ffffff'
      return { background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.92))` }
    }
    return {}
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      {!result && (
        <div className="w-full max-w-2xl rounded-xl shadow-lg p-8 bg-white" style={cardStyle()}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Question {index+1} of {total}</span>
            <div className="h-2 bg-gray-200 rounded w-1/2 overflow-hidden">
              <div className="h-2 bg-purple-500" style={{ width: `${((index+1)/total)*100}%` }}></div>
            </div>
          </div>
          {(() => {
            const heading = current?.id==='emotionalTheme' ? 'How are you feeling right now?' : current?.question
            const inputEl = renderInput()
            return (
              <>
                {heading && <h3 className="text-xl font-semibold text-gray-900 mb-4">{heading}</h3>}
                {inputEl && <div className="mb-6">{inputEl}</div>}
              </>
            )
          })()}
          <div className="flex justify-between">
            <button onClick={back} disabled={index===0} className="px-4 py-2 rounded bg-gray-100 text-gray-700 disabled:opacity-50">Back</button>
            <button onClick={next} disabled={submitting} className="px-6 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">{index===total-1 ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      )}

      {result && (
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 mt-6 text-center">
          <h4 className="text-md font-medium text-gray-900 mb-3">Mood Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className="text-2xl font-bold text-green-700">{result.overallScore}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Emotional Wellbeing</p>
              <p className="text-2xl font-bold text-blue-700">{result.indicators?.emotionalWellbeing}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Social Connection</p>
              <p className="text-2xl font-bold text-purple-700">{result.indicators?.socialConnection}</p>
            </div>
          </div>
          <ul className="mt-4 list-disc list-inside text-gray-700 text-left">
            {(result.summary || []).map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-yellow-50 rounded text-left">
            <p className="text-sm text-gray-700"><span className="font-semibold">Suggested next step:</span> {suggestion}</p>
          </div>
          {therapists.length > 0 && (
            <div className="mt-6 text-left">
              <h5 className="text-md font-semibold text-gray-900 mb-2">Nearby Therapists (NYC)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {therapists.slice(0,4).map((t:any)=> (
                  <div key={t.id} className="p-3 border rounded">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-600">{t.specialty}</p>
                    <p className="text-sm text-gray-600">Insurance: {t.insuranceAccepted}</p>
                    <p className="text-sm text-gray-600">{t.address}</p>
                    <p className="text-sm text-gray-600">{t.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-6 text-gray-700">See you tomorrow!</p>
        </div>
      )}
    </div>
  )
}
function AutoTextarea({ value, onChange, placeholder, isListening, startVoiceRecognition, stopVoiceRecognition }: { value: string; onChange: (e: any)=>void; placeholder?: string; isListening: boolean; startVoiceRecognition: ()=>void; stopVoiceRecognition: ()=>void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useEffect(()=>{
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])
  return (
    <div className="relative">
      <textarea
        ref={ref}
        className="w-full px-4 py-2 border rounded-xl resize-none overflow-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
        rows={1}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onInput={(e:any)=>{ e.currentTarget.style.height='auto'; e.currentTarget.style.height=`${e.currentTarget.scrollHeight}px` }}
      />
      <div className="absolute bottom-2 right-2">
        <button
          type="button"
          onClick={()=>{ isListening ? stopVoiceRecognition() : startVoiceRecognition() }}
          className={`px-3 py-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}