import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface CheckinResponse {
  id: string;
  userId: string;
  date: string;
  questionType: 'checkin' | 'assessment';
  question: string;
  response: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  aiAnalysis?: string;
  followUpQuestions?: string;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  date: string;
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

export interface ConversationRecord {
  id: string;
  userId: string;
  date: string;
  userMessage: string;
  aiReply: string;
}

export class CSVDatabase {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.initializeDataDir();
  }

  private async initializeDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch {}
    await this.initializeCSV('users.csv', ['id', 'email', 'name', 'password', 'createdAt'])
    await this.initializeCSV('responses.csv', ['id', 'userId', 'date', 'questionType', 'question', 'response', 'sentiment', 'aiAnalysis', 'followUpQuestions'])
    await this.initializeCSV('assessments.csv', ['id', 'userId', 'date', 'journalEntry', 'emotionalTheme', 'memorableMoment', 'energyLevel', 'physicalTension', 'positiveExperience', 'emotionalNeed', 'heartWeather', 'energyDrain', 'copingMechanism', 'socialConnection'])
    await this.initializeCSV('conversations.csv', ['id', 'userId', 'date', 'userMessage', 'aiReply'])
    await this.initializeCSV('therapists.csv', ['id','name','city','specialty','insuranceAccepted','phone','email','address'])
  }

  private async initializeCSV(filename: string, headers: string[]) {
    const filePath = path.join(this.dataDir, filename);
    try {
      await fs.access(filePath);
    } catch {
      const csv = Papa.unparse([headers]);
      await fs.writeFile(filePath, csv);
    }
  }

  private async readCSV<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const result = Papa.parse(content, { header: true, skipEmptyLines: true });
      return result.data as T[];
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  private async writeCSV(filename: string, data: any[]) {
    try {
      const filePath = path.join(this.dataDir, filename)
      let csv: string
      if (filename === 'users.csv') {
        csv = Papa.unparse(data, { header: true, columns: ['id','email','name','password','createdAt'] })
      } else if (filename === 'responses.csv') {
        csv = Papa.unparse(data, { header: true, columns: ['id','userId','date','questionType','question','response','sentiment','aiAnalysis','followUpQuestions'] })
      } else if (filename === 'assessments.csv') {
        csv = Papa.unparse(data, { header: true, columns: ['id','userId','date','journalEntry','emotionalTheme','memorableMoment','energyLevel','physicalTension','positiveExperience','emotionalNeed','heartWeather','energyDrain','copingMechanism','socialConnection'] })
      } else if (filename === 'conversations.csv') {
        csv = Papa.unparse(data, { header: true, columns: ['id','userId','date','userMessage','aiReply'] })
      } else if (filename === 'therapists.csv') {
        csv = Papa.unparse(data, { header: true, columns: ['id','name','city','specialty','insuranceAccepted','phone','email','address'] })
      } else {
        csv = Papa.unparse(data)
      }
      await fs.writeFile(filePath, csv)
    } catch (error) {
      console.error(`Error writing ${filename}:`, error)
      throw error
    }
  }

  // User operations
  async createUser(email: string, name: string, password: string): Promise<User> {
    const users = await this.readCSV<User>('users.csv');
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await this.writeCSV('users.csv', users);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const users = await this.readCSV<User>('users.csv');
    return users.find(u => u.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const users = await this.readCSV<User>('users.csv');
    return users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.findUserByEmail(email)
  }

  async getUserById(id: string): Promise<User | null> {
    return this.findUserById(id)
  }

  // Response operations
  async saveResponse(data: Omit<CheckinResponse, 'id'>): Promise<CheckinResponse> {
    const responses = await this.readCSV<CheckinResponse>('responses.csv')
    const newResponse: CheckinResponse = {
      ...data,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    responses.push(newResponse)
    await this.writeCSV('responses.csv', responses)
    return newResponse
  }

  async getUserResponses(userId: string, limit = 100): Promise<CheckinResponse[]> {
    const responses = await this.readCSV<CheckinResponse>('responses.csv')
    return responses
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  // Assessment operations
  async saveAssessment(data: Omit<AssessmentRecord, 'id'>): Promise<AssessmentRecord> {
    const assessments = await this.readCSV<AssessmentRecord>('assessments.csv')
    const newAssessment: AssessmentRecord = {
      ...data,
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    assessments.push(newAssessment)
    await this.writeCSV('assessments.csv', assessments)
    return newAssessment
  }

  async getUserAssessments(userId: string, limit = 100): Promise<AssessmentRecord[]> {
    const assessments = await this.readCSV<AssessmentRecord>('assessments.csv')
    return assessments
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  // Analytics
  async getUserAnalytics(userId: string, days = 30) {
    const responses = await this.getUserResponses(userId, days * 10)
    const assessments = await this.getUserAssessments(userId, days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const recentResponses = responses.filter(r => new Date(r.date) >= cutoffDate)
    const recentAssessments = assessments.filter(a => new Date(a.date) >= cutoffDate)
    return {
      recentAssessments,
      totalCheckIns: recentResponses.length,
    }
  }

  async getMentalHealthData(): Promise<Array<{ illness: string; definition: string }>> {
    const csvPath = path.resolve(process.cwd(), '..', 'mental_illnesses.csv')
    try {
      const content = await fs.readFile(csvPath, 'utf-8')
      const parsed = Papa.parse(content, { header: false, skipEmptyLines: true })
      const rows = parsed.data as string[][]
      return rows.map(r => ({ illness: r[0], definition: r[1] }))
    } catch {
      return []
    }
  }
  async getTherapists(city?: string, insurance?: string): Promise<Array<{ id: string; name: string; city: string; specialty: string; insuranceAccepted: string; phone: string; email: string; address: string }>> {
    const therapists = await this.readCSV<any>('therapists.csv')
    const byCity = city ? therapists.filter((t: any) => (t.city || '').toLowerCase() === city.toLowerCase()) : therapists
    const byIns = insurance ? byCity.filter((t: any) => (t.insuranceAccepted || '').toLowerCase().includes(insurance.toLowerCase())) : byCity
    return byIns.slice(0, 10)
  }
  async saveConversation(data: Omit<ConversationRecord, 'id'>): Promise<ConversationRecord> {
    const conversations = await this.readCSV<ConversationRecord>('conversations.csv')
    const newConv: ConversationRecord = {
      ...data,
      id: `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    conversations.push(newConv)
    await this.writeCSV('conversations.csv', conversations)
    return newConv
  }

  async getUserConversations(userId: string, limit = 100): Promise<ConversationRecord[]> {
    const conversations = await this.readCSV<ConversationRecord>('conversations.csv')
    return conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }
}

export const csvDatabase = new CSVDatabase();