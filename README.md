![icon](https://github.com/[username]/[reponame]/blob/[branch]/image.jpg?raw=true)

# WeekPilot AI

**WeekPilot AI** turns Google Calendar data into a smart weekly action plan for students.

Instead of only showing events, WeekPilot helps users understand their week, detect overload, find realistic study time, and turn suggestions into actual calendar events.

## Quick pitch

WeekPilot AI helps students understand their weekly workload, find realistic study time, detect planning risks, and turn suggested study blocks into real Google Calendar events.

## Why I built this

As a student, I noticed that having a calendar does not automatically mean being organized.

A normal calendar shows events, but it does not explain:

- how stressful a week really is
- where free study time exists
- whether important deadlines are approaching without preparation
- how offline commitments affect real availability

That is why I built **WeekPilot AI**: a planning assistant that combines calendar analysis, availability settings, and AI-generated advice.

## What it does

WeekPilot AI connects to Google Calendar and helps students plan their week more intelligently.

### Core features

- Google Calendar login and event import
- Weekly calendar analysis
- Load / stress score
- Free study slot detection
- AI-generated week summary
- Availability settings:
  - sleep times
  - recurring offline commitments like training
- Smart warnings, such as:
  - no study block before a deadline
  - no study block before an exam
  - overloaded days
  - too few study opportunities
- Auto-plan my week:
  - generates study block suggestions
  - supports editing before saving
  - supports adding one or multiple study blocks to Google Calendar
- KPI strip and day-by-day weekly overview for fast understanding

## Demo highlights

- Connect Google Calendar
- Add sleep and recurring offline commitments
- Generate AI week summary
- Detect warnings and overloaded days
- Auto-plan study blocks
- Edit and add study blocks to Google Calendar

## How it works

WeekPilot follows this flow:

1. The user connects their Google Calendar.
2. The app fetches events for the selected week.
3. The user can add personal availability settings such as sleep and recurring offline activities.
4. WeekPilot merges calendar events with those recurring constraints.
5. The app analyzes:
   - total scheduled time
   - busiest day
   - free study opportunities
   - weekly load score
   - potential planning risks
6. AI summarizes the week in natural language.
7. The user can generate suggested study blocks and add them directly to Google Calendar.

## Tech stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth / Auth.js with Google OAuth
- **Calendar API:** Google Calendar API
- **AI providers:** Ollama, OpenAI, DeepSeek
- **State:** React hooks
- **Architecture:** App Router + API routes

## Key components

- **Dashboard:** central planning view
- **KPI strip:** quick weekly overview
- **Day overview:** day-by-day breakdown
- **Conflict warnings:** highlights risky planning situations
- **Study slot suggestions:** editable before saving
- **Availability settings:** sleep + recurring offline commitments

## Smart planning logic

WeekPilot does not just search for empty time.

It also prioritizes better study opportunities by considering:

- earlier days in the week
- longer free slots
- days close to exams or deadlines
- distribution across the week instead of stacking everything on one day

## Example use cases

- A student wants to know whether their week is overloaded.
- A student wants to find realistic study blocks around school, training, and sleep.
- A student wants warnings before important deadlines.
- A student wants to auto-plan study time and insert it into Google Calendar.

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Create a `.env.local` file with the required keys.

Example:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

You can generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 3. Google OAuth setup for local development

If you want to run WeekPilot AI locally, you need to create Google OAuth credentials so the app can access your calendar through your own Google account.

#### Create a Google Cloud project

Open the Google Cloud Console and create a new project for the app. Then enable the **Google Calendar API** for that project.

#### Configure the OAuth consent screen

In Google Cloud Console, open the OAuth consent configuration and fill in the app information.

For local testing, using an **External** app in **Testing** mode is enough. Add your own Google email address under **Test users**, otherwise login may fail during development.

#### Create OAuth credentials

Create a new **OAuth Client ID** and choose **Web application** as the application type.
For local development with NextAuth/Auth.js, set this redirect URI:

```txt
http://localhost:3000/api/auth/callback/google
```

#### Make sure the app requests the right calendar scope

WeekPilot needs Google Calendar permissions to read events and create study blocks. The Google provider setup in `lib/auth.ts` should request calendar access that allows both reading and creating events.

#### Why this setup matters

WeekPilot uses user-authorized OAuth instead of asking for passwords directly. That means users keep control over their Google account, and the app only receives the permissions it actually requests.

### 4. Start the development server

```bash
npm run dev
```

Then open:

```txt
http://localhost:3000
```

Click **Connect Google Calendar** and sign in with the Google account you added as a test user.

### 5. If login still fails

Common causes:

- the redirect URI in Google Cloud does not exactly match `http://localhost:3000/api/auth/callback/google`
- the Google account is not added as a test user
- the Calendar API is not enabled
- you changed scopes and need to sign out and sign in again so Google issues a new token with the updated permissions

### 6. Full local demo test flow

After setup, a local end-to-end demo can be tested like this:

1. Start the app and open the dashboard.
2. Connect a Google account.
3. Switch to a week that contains a few real calendar events.
4. Add sleep times and a recurring offline commitment such as training.
5. Generate the AI week summary.
6. Check the warnings and KPI strip.
7. Click **Auto-plan my week**.
8. Edit one suggested study block.
9. Add one block to Google Calendar.
10. Add multiple selected blocks to Google Calendar.
11. Verify that the new events appear both in WeekPilot and in Google Calendar.

This gives a complete local demonstration of the main product flow: connect calendar, analyze week, plan study time, and turn suggestions into action.

### 7. Build for production

```bash
npm run build
npm start
```

## Current status

The MVP currently supports:

- clean build
- working Google login
- real Google Calendar integration
- availability-aware week analysis
- AI summaries
- smart warnings
- editable study slot suggestions
- direct Google Calendar event creation

## Challenges I faced

Some of the biggest challenges were:

- handling Google OAuth and calendar scopes correctly
- distinguishing real free time from time that is technically empty but not realistically available
- avoiding hydration issues with client-only dashboard state
- designing AI output so it is structured and actually useful
- building a planning flow that is actionable, not just descriptive

## What I learned

This project taught me a lot about:

- working with real APIs and authentication
- calendar and time-based logic
- balancing deterministic rules with AI output
- building around a real user problem instead of adding AI for its own sake
- turning analysis into action

## Future improvements

- subject-specific study planning
- exam-aware prioritization
- recurring study habits
- better visual timeline or heatmap
- mobile optimization
- school-specific modes
- collaboration or parent/tutor visibility
- notifications before overloaded days

## Final idea

WeekPilot AI is built around one simple idea:

**Students should not just see their schedule - they should understand it, improve it, and act on it.**