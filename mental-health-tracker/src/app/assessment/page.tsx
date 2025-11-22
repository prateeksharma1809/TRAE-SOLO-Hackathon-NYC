'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, Mic, MicOff, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { DAILY_ASSESSMENT_QUESTIONS, AssessmentResponse } from '@/lib/assessmentQuestions';

interface User {
  id: string;
  email: string;
  name: string;
}

export default function AssessmentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Partial<AssessmentResponse>>({});
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeling, setFeeling] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

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

  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < DAILY_ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const startVoiceRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak now');
      };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const form = new FormData();
          form.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          const text = data.text || '';
          const currentQ = DAILY_ASSESSMENT_QUESTIONS[currentQuestion];
          if (currentQ.type === 'textarea' || currentQ.type === 'select') {
            handleResponseChange(currentQ.id, text);
          }
          toast.success('Voice input captured');
        } catch {
          toast.error('Error transcribing audio');
        } finally {
          setIsListening(false);
          mediaRecorderRef.current = null;
          stream.getTracks().forEach(t => t.stop());
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopVoiceRecognition = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state === 'recording') r.stop();
  };

  const handleSubmit = async () => {
    const currentQ = DAILY_ASSESSMENT_QUESTIONS[currentQuestion];
    const response = responses[currentQ.id as keyof AssessmentResponse];
    
    if (currentQ.type === 'scale' && (response === undefined || response === '')) {
      toast.error('Please select a value');
      return;
    }
    
    if ((currentQ.type === 'textarea' || currentQ.type === 'select') && !response) {
      toast.error('Please provide a response');
      return;
    }

    if (currentQuestion === DAILY_ASSESSMENT_QUESTIONS.length - 1) {
      setIsSubmitting(true);
      
      try {
        const responseData = await fetch('/api/assessment/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(responses),
        });

        if (responseData.ok) {
          toast.success('Assessment completed successfully!');
          router.push('/dashboard');
        } else {
          toast.error('Error submitting assessment');
        }
      } catch (error) {
        console.error('Submit assessment error:', error);
        toast.error('Error submitting assessment');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      nextQuestion();
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

  const currentQ = DAILY_ASSESSMENT_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / DAILY_ASSESSMENT_QUESTIONS.length) * 100;
  const cardStyle = () => {
    if (currentQ?.type === 'scale') {
      const val = currentQ.id === 'emotionalTheme'
        ? (feeling ?? 3)
        : (((responses[currentQ.id as keyof AssessmentResponse] as number | undefined) ?? 3));
      const colorMap: any = {
        1: '#7f57f6',
        2: '#a78bfa',
        3: '#ffffff',
        4: '#fff3c4',
        5: '#fde047',
      };
      const c = colorMap[val];
      if (c) return { background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.92))` };
    }
    return {};
  };

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
                  <a href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-6" style={cardStyle()}>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentQuestion + 1} of {DAILY_ASSESSMENT_QUESTIONS.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQ.question}
              </h2>

              

              {currentQ.type === 'textarea' && (
                <div className="relative">
                  <textarea
                    value={responses[currentQ.id as keyof AssessmentResponse] as string || ''}
                    onChange={(e) => handleResponseChange(currentQ.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    rows={4}
                    placeholder={currentQ.placeholder}
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      type="button"
                      onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                      className={`p-2 rounded-full transition-colors ${
                        isListening
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {currentQ.type === 'scale' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{currentQ.labels?.min}</span>
                    <span>{currentQ.labels?.max}</span>
                  </div>
                  {currentQ.min === 1 && currentQ.max === 5 ? (
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
                            if (currentQ.id === 'emotionalTheme') {
                              setFeeling(item.v);
                              const map: any = { 1: 'Sad and melancholic', 2: 'Tired and drained', 3: 'Neutral', 4: 'Hopeful and optimistic', 5: 'Happy and joyful' };
                              handleResponseChange(currentQ.id, map[item.v]);
                            } else {
                              handleResponseChange(currentQ.id, item.v);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg ${((currentQ.id === 'emotionalTheme' ? feeling : (responses[currentQ.id as keyof AssessmentResponse] as number)) || 3) === item.v ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-white'}`}
                        >
                          {item.e}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="range"
                        min={currentQ.min}
                        max={currentQ.max}
                        value={responses[currentQ.id as keyof AssessmentResponse] as number || currentQ.min}
                        onChange={(e) => handleResponseChange(currentQ.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        {Array.from({ length: (currentQ.max! - currentQ.min! + 1) }, (_, i) => (
                          <span key={i}>{currentQ.min! + i}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0 || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : currentQuestion === DAILY_ASSESSMENT_QUESTIONS.length - 1 ? (
                  <>
                    Complete Assessment
                    <Send className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}