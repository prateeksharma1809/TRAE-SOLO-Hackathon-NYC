# Mental Health Tracker

A comprehensive mental health tracking application built with Next.js that helps users monitor their mental wellness through daily check-ins, assessments, and AI-powered analysis.

## Features

### 🔐 Authentication
- Secure login and registration system
- Session management with cookies
- Email validation and password requirements

### 📊 Daily Check-ins
- Personalized greeting with user's name
- Randomized check-in messages
- Text and voice input support (Web Speech API)
- AI analysis of responses with sentiment detection

### 📝 10-Question Daily Assessment
- Emotional theme identification
- Memorable moment capture
- Energy level tracking
- Physical tension mapping
- Positive experience logging
- Emotional need detection
- Heart weather metaphor
- Energy drain identification
- Coping mechanism tracking
- Social connection assessment

### 🤖 AI Analysis Engine
- Sentiment analysis (positive, negative, neutral)
- Mental health keyword detection
- Risk level assessment (low, medium, high)
- Personalized follow-up questions
- Mental illness pattern recognition

### 📈 Reporting Dashboard
- 10 mental health indicators with scoring
- Historical trends with date filtering
- Emotional pattern detection
- Comparative analysis (week-over-week, month-over-month)
- Color-coded status indicators
- Interactive charts and visualizations

### 🧠 Mental Illness Detection
- Analysis using mental_illnesses.csv data
- Symptom and keyword matching
- Confidence scoring
- Severity assessment
- Professional recommendations

### 📱 Technical Features
- Responsive UI design
- Accessibility compliance (WCAG 2.1 AA)
- CSV database implementation
- Secure data handling
- Performance optimization

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, CSV Database
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Testing**: Jest, Playwright

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mental-health-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Copy the mental_illnesses.csv file to the project root:
```bash
cp ../mental_illnesses.csv .
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication
1. Visit the login page
2. Enter your email and password
3. If you're a new user, complete the registration form
4. You'll be redirected to your personalized dashboard

### Daily Check-in
1. On your dashboard, you'll see a personalized greeting
2. Answer the check-in question via text or voice input
3. Your response will be analyzed by AI and stored securely

### Daily Assessment
1. Navigate to the Daily Assessment page
2. Complete all 10 questions about your mental state
3. Use voice input for longer responses if preferred
4. Submit your assessment for AI analysis

### Viewing Reports
1. Go to the Reports page
2. Select your preferred time range (7, 30, or 90 days)
3. View your mental health trends and insights
4. Check for any risk factors or recommendations

## Testing

### Unit Tests
```bash
npm run test:unit
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login/registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session status

### Responses
- `POST /api/responses/checkin` - Submit check-in response

### Assessment
- `POST /api/assessment/submit` - Submit daily assessment

### Reports
- `GET /api/reports/data?range={timeRange}` - Get report data

### Mental Health Analysis
- `POST /api/mental-health/analyze` - Analyze text for mental health indicators
- `GET /api/mental-health/analyze` - Get available mental health conditions

## Data Storage

The application uses CSV files for data storage:
- `data/users.csv` - User account information
- `data/responses.csv` - Check-in responses
- `data/assessments.csv` - Daily assessment data

## Security

- Passwords are hashed using SHA-256
- Sessions are managed with secure HTTP-only cookies
- Input validation on all API endpoints
- Rate limiting can be implemented if needed

## Accessibility

The application follows WCAG 2.1 AA guidelines:
- Proper heading structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Mental Health Disclaimer

This application is designed for mental wellness tracking and should not replace professional mental health care. If you're experiencing severe mental health issues, please contact a mental health professional or crisis helpline.

## License

This project is licensed under the MIT License.
