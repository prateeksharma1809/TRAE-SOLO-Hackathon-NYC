## Auth Flow Fixes
- Update `src/app/login/page.tsx` to send `isRegister: showRegistration` with the POST body so the API knows when to register (`mental-health-tracker/src/app/login/page.tsx:46-50`).
- Enhance `src/app/api/auth/login/route.ts` to respond with `{ needsRegistration: true }` when a user is not found and `isRegister` is false; keep existing name handling for success (`mental-health-tracker/src/app/api/auth/login/route.ts:69-76`).
- Store and return `name` for users by extending the CSV schema and `createUser` to accept `name` so dashboard shows the user’s actual name instead of the email prefix (`mental-health-tracker/src/lib/csvDatabase.ts:5-10, 90-109`).

## Session Usage Fixes
- In `check-in` and `assessment` API routes, stop `JSON.parse` on the `session` cookie; read the session ID string and load the session via `getSession(sessionId)` (`mental-health-tracker/src/app/api/responses/checkin/route.ts:18-19`, `mental-health-tracker/src/app/api/assessment/submit/route.ts:18-19`).

## AI Analysis Module
- Create `src/lib/aiAnalysis.ts` providing `AIAnalysisEngine.analyzeResponse(text)` and `AIAnalysisEngine.analyzeAssessment(payload)` used by routes (`mental-health-tracker/src/app/api/responses/checkin/route.ts:28`, `mental-health-tracker/src/app/api/assessment/submit/route.ts:21`).
- Implement OpenAI-powered analysis when `process.env.OPENAI_API_KEY` is present:
  - For check-ins: sentiment (positive/neutral/negative), confidence, emotional indicators, and 2–3 suggested follow-up questions.
  - For assessments: normalized scores and summary insights.
- Include a safe fallback using the existing rule-based `MentalIllnessDetector` (`mental-health-tracker/src/lib/mentalIllnessDetector.ts`) if the key is absent or the API fails.

## Database Alignment
- Align `CSVDatabase` with route and test expectations (unit tests reference `saveResponse`/`saveAssessment`):
  - Add methods `saveResponse({...})`, `getUserResponses(userId)`, `saveAssessment({...})`, `getUserAssessments(userId)` matching fields used in routes and tests (`mental-health-tracker/tests/unit.test.ts:44-59, 68-89`).
  - Update CSV headers initialized in `initializeCSV` to include `responses.csv`: `id,userId,date,questionType,question,response,sentiment,aiAnalysis,followUpQuestions` and `assessments.csv`: `id,userId,date,emotionalTheme,memorableMoment,energyLevel,physicalTension,positiveExperience,emotionalNeed,heartWeather,energyDrain,copingMechanism,socialConnection` (`mental-health-tracker/src/lib/csvDatabase.ts:51-54`).
  - Keep existing analytics helpers compatible or add adapters as needed.

## Environment and Dependencies
- Add `OPENAI_API_KEY` to a `.env.local` in the app root; do not log or expose it.
- Add the `openai` npm package (or use `fetch` to OpenAI’s API if you prefer no dependency).

## Verification
- Run unit tests and fix failures: `npm run test:unit` (tests reference `aiAnalysis` and database methods).
- Start dev server and validate flows:
  - Sign-up with name → cookie set → redirected to `dashboard` (`mental-health-tracker/src/app/dashboard/page.tsx:42-58`).
  - Login for existing user → redirected to `dashboard`.
  - Submit a check-in → response saved and AI analysis returned (`mental-health-tracker/src/app/api/responses/checkin/route.ts:30-44`).
  - Submit an assessment → assessment saved and AI analysis returned (`mental-health-tracker/src/app/api/assessment/submit/route.ts:23-41`).
- Confirm `reports` and `assessment` pages can fetch session and data without redirect loops (`mental-health-tracker/src/app/reports/page.tsx:29-44`, `mental-health-tracker/src/app/assessment/page.tsx:165-174`).

If you approve, I will implement these changes, wire up OpenAI, and verify end-to-end login/signup and AI response generation.