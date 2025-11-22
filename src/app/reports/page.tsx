'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface User {
  id: string;
  email: string;
  name: string;
}

interface ReportData {
  assessments: any[];
  responses: any[];
  summary: {
    totalAssessments: number;
    averageScore: number;
    trend: string;
    keyInsights: string[];
    riskFactors: string[];
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, timeRange]);

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
    }
  };

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports/data?range=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      } else {
        toast.error('Error fetching report data');
      }
    } catch (error) {
      console.error('Fetch report data error:', error);
      toast.error('Error fetching reports');
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const prepareChartData = () => {
    if (!reportData?.assessments) return [];
    
    return reportData.assessments.slice(0, 30).reverse().map((assessment, index) => ({
      date: new Date(assessment.date).toLocaleDateString(),
      energy: (Number(assessment.energyLevel) / 5) * 10,
      emotional: getEmotionalScore(assessment.emotionalTheme)
    }));
  };

  const prepareEmotionalThemeData = () => {
    if (!reportData?.assessments) return [];
    
    const themes = reportData.assessments.reduce((acc, assessment) => {
      const theme = assessment.emotionalTheme;
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(themes).map(([theme, count]) => ({
      name: theme,
      value: count
    }));
  };

  const getEmotionalScore = (theme: string) => {
    const positiveThemes = ['Peaceful and calm', 'Happy and joyful', 'Hopeful and optimistic'];
    const negativeThemes = ['Chaotic and overwhelming', 'Anxious and worried', 'Sad and melancholic'];
    
    if (positiveThemes.includes(theme)) return 8;
    if (negativeThemes.includes(theme)) return 3;
    return 6;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f57f6] to-[#ffd9b3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!user || !reportData) {
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
                  <a href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                  <a href="#" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Reports</a>
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
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Mental Health Reports</h2>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalAssessments}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(reportData.summary.averageScore)}`}>
                    {reportData.summary.averageScore}/10
                  </p>
                </div>
                {getTrendIcon(reportData.summary.trend)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trend</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{reportData.summary.trend}</p>
                </div>
                {getTrendIcon(reportData.summary.trend)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Health Indicators Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="energy" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="emotional" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotional Themes Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareEmotionalThemeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareEmotionalThemeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Key Insights
              </h3>
              <ul className="space-y-3">
                {reportData.summary.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                improvment area
              </h3>
              <ul className="space-y-3">
                {reportData.summary.riskFactors.length > 0 ? (
                  reportData.summary.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No significant risk factors identified</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}