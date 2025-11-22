import { CSVDatabase, User, Response, MentalHealthAssessment } from '../src/lib/csvDatabase';
import { AIAnalysisEngine } from '../src/lib/aiAnalysis';
import { MentalIllnessDetector } from '../src/lib/mentalIllnessDetector';

describe('Mindline - Unit Tests', () => {
  let db: CSVDatabase;
  let detector: MentalIllnessDetector;

  beforeEach(() => {
    db = new CSVDatabase();
    detector = new MentalIllnessDetector();
  });

  describe('CSV Database', () => {
    test('should create and retrieve user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const user = await db.createUser(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);

      const retrievedUser = await db.getUserByEmail(userData.email);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.email).toBe(userData.email);
    });

    test('should return null for non-existent user', async () => {
      const user = await db.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    test('should save and retrieve responses', async () => {
      const user = await db.createUser({
        email: 'response@test.com',
        name: 'Response User',
        password: 'password123'
      });

      const response = await db.saveResponse({
        userId: user.id,
        date: new Date().toISOString(),
        questionType: 'checkin',
        question: 'How are you feeling?',
        response: 'I am feeling good today',
        sentiment: 'positive'
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();

      const userResponses = await db.getUserResponses(user.id);
      expect(userResponses).toHaveLength(1);
      expect(userResponses[0].response).toBe('I am feeling good today');
    });

    test('should save and retrieve assessments', async () => {
      const user = await db.createUser({
        email: 'assessment@test.com',
        name: 'Assessment User',
        password: 'password123'
      });

      const assessment = await db.saveAssessment({
        userId: user.id,
        date: new Date().toISOString(),
        emotionalTheme: 'Peaceful and calm',
        memorableMoment: 'Had a great conversation with friend',
        energyLevel: 8,
        physicalTension: 'Low tension in shoulders',
        positiveExperience: 'Completed a challenging project',
        emotionalNeed: 'Connection and belonging',
        heartWeather: 'Sunny and bright',
        energyDrain: 'Long meeting in afternoon',
        copingMechanism: 'Deep breathing and short walk',
        socialConnection: 7
      });

      expect(assessment).toBeDefined();
      expect(assessment.id).toBeDefined();

      const userAssessments = await db.getUserAssessments(user.id);
      expect(userAssessments).toHaveLength(1);
      expect(userAssessments[0].emotionalTheme).toBe('Peaceful and calm');
    });
  });

  describe('AI Analysis Engine', () => {
    test('should analyze positive sentiment correctly', () => {
      const analysis = AIAnalysisEngine.analyzeResponse('I am feeling great today! Everything is going well and I am happy.');
      
      expect(analysis.sentiment).toBe('positive');
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.emotionalIndicators).toContain('great');
      expect(analysis.emotionalIndicators).toContain('happy');
    });

    test('should analyze negative sentiment correctly', () => {
      const analysis = AIAnalysisEngine.analyzeResponse('I am feeling very sad and hopeless today. Everything seems overwhelming.');
      
      expect(analysis.sentiment).toBe('negative');
      expect(analysis.emotionalIndicators).toContain('sad');
      expect(analysis.emotionalIndicators).toContain('hopeless');
      expect(analysis.emotionalIndicators).toContain('overwhelming');
    });

    test('should generate appropriate follow-up questions', () => {
      const analysis = AIAnalysisEngine.analyzeResponse('I am feeling anxious about my future');
      
      expect(analysis.suggestedFollowUps).toHaveLength(3);
      expect(analysis.suggestedFollowUps.some(q => q.toLowerCase().includes('anxiety'))).toBeTruthy();
    });

    test('should analyze assessment responses correctly', () => {
      const responses = {
        emotionalTheme: 'Peaceful and calm',
        memorableMoment: 'Had a great day with family',
        energyLevel: 8,
        physicalTension: 'Very relaxed',
        positiveExperience: 'Completed my goals',
        emotionalNeed: 'Connection',
        heartWeather: 'Sunny and bright',
        energyDrain: 'None really',
        copingMechanism: 'Meditation and exercise',
        socialConnection: 9
      };

      const analysis = AIAnalysisEngine.analyzeAssessment(responses);
      
      expect(analysis.overallScore).toBeGreaterThan(7);
      expect(analysis.indicators.emotionalWellbeing).toBeGreaterThan(6);
      expect(analysis.indicators.energyLevel).toBe(8);
      expect(analysis.indicators.socialConnection).toBe(9);
    });
  });

  describe('Mental Illness Detector', () => {
    test('should detect depression-related symptoms', () => {
      const text = 'I have been feeling very sad and depressed lately. I feel hopeless and worthless, and I cry often.';
      const result = detector.analyzeText(text);
      
      expect(result.detectedConditions.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBe('high');
      expect(result.detectedConditions.some(c => 
        c.illness.toLowerCase().includes('depression')
      )).toBeTruthy();
    });

    test('should detect anxiety-related symptoms', () => {
      const text = 'I feel anxious and worried all the time. I have panic attacks and feel overwhelmed by stress.';
      const result = detector.analyzeText(text);
      
      expect(result.detectedConditions.some(c => 
        c.illness.toLowerCase().includes('anxiety')
      )).toBeTruthy();
    });

    test('should provide appropriate recommendations for high risk', () => {
      const text = 'I am experiencing severe depression and suicidal thoughts. I feel completely hopeless.';
      const result = detector.analyzeText(text);
      
      expect(result.overallRisk).toBe('high');
      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('professional')
      )).toBeTruthy();
      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('crisis')
      )).toBeTruthy();
    });

    test('should return low risk for positive text', () => {
      const text = 'I am feeling great today! Life is good and I am happy with my progress.';
      const result = detector.analyzeText(text);
      
      expect(result.overallRisk).toBe('low');
      expect(result.detectedConditions.length).toBe(0);
    });

    test('should load mental health conditions from CSV', () => {
      const conditions = detector.getAllConditions();
      
      expect(conditions.length).toBeGreaterThan(40);
      expect(conditions.some(c => c.illness === 'Major Depressive Disorder')).toBeTruthy();
      expect(conditions.some(c => c.illness === 'Generalized Anxiety Disorder')).toBeTruthy();
      expect(conditions.some(c => c.illness === 'Bipolar I Disorder')).toBeTruthy();
    });
  });
});

describe('Integration Tests', () => {
  test('complete user flow: registration, check-in, assessment, and analysis', async () => {
    const db = new CSVDatabase();
    const detector = new MentalIllnessDetector();

    // 1. Create user
    const user = await db.createUser({
      email: 'integration@test.com',
      name: 'Integration User',
      password: 'password123'
    });

    expect(user).toBeDefined();

    // 2. Save check-in response
    const response = await db.saveResponse({
      userId: user.id,
      date: new Date().toISOString(),
      questionType: 'checkin',
      question: 'How are you feeling?',
      response: 'I am feeling anxious and overwhelmed today',
      sentiment: 'negative'
    });

    expect(response).toBeDefined();

    // 3. Analyze the response for mental health indicators
    const analysis = detector.analyzeText(response.response);
    expect(analysis.overallRisk).toBe('moderate');
    expect(analysis.detectedConditions.some(c => 
      c.illness.toLowerCase().includes('anxiety')
    )).toBeTruthy();

    // 4. Save assessment
    const assessment = await db.saveAssessment({
      userId: user.id,
      date: new Date().toISOString(),
      emotionalTheme: 'Anxious and worried',
      memorableMoment: 'Felt overwhelmed at work',
      energyLevel: 4,
      physicalTension: 'High tension in neck and shoulders',
      positiveExperience: 'Managed to complete one task',
      emotionalNeed: 'Comfort and reassurance',
      heartWeather: 'Stormy and turbulent',
      energyDrain: 'Work stress and overthinking',
      copingMechanism: 'Deep breathing but not very effective',
      socialConnection: 3
    });

    expect(assessment).toBeDefined();

    // 5. Verify data retrieval
    const userResponses = await db.getUserResponses(user.id);
    const userAssessments = await db.getUserAssessments(user.id);

    expect(userResponses).toHaveLength(1);
    expect(userAssessments).toHaveLength(1);
  });
});