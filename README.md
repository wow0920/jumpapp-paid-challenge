# AI Email Sorter (Vite + React + Express + TypeScript)

Requirements: https://jumpapp.notion.site/Paid-Challenge-August-1-2025-23a5ee0c36548096b366f3e2a029cdc9

Production: https://jumpapp-paid-challenge.onrender.com/

This project is a full‑stack Vite React app with an Express (TypeScript) backend. It connects to Gmail via OAuth, auto‑categorizes incoming emails using AI, archives the originals in Gmail, and lets you bulk delete or unsubscribe via an automated headless browser.

## Features (scope/requirements)

- Google OAuth sign‑in
- Requests Gmail scopes (gmail.modify). This app is for development: you must add test users in your Google Cloud OAuth consent screen to skip the production security review.
- Dashboard with three sections:
  - Connect/link additional Gmail accounts
  - List of custom categories
  - Button to add a new category
- Add/Edit Category: form with name and description
- AI processing:
  - New emails are imported and categorized using AI, based on category descriptions
  - After importing, the email is archived in Gmail (not deleted)
  - Each email has an AI‑generated summary
- Email actions:
  - View all emails per category
  - Select one or many and delete or unsubscribe
  - Unsubscribe uses an AI agent and a headless browser to navigate to unsubscribe links and submit required forms
- View original email contents

## Tech stack

- Frontend: Vite 7, React 19, Tailwind CSS, HeroUI, TanStack Query, @react-oauth/google, Socket.IO client
- Backend: Express 5 (TypeScript), Vite‑Express integration, Socket.IO server
- Database/ORM: Prisma with SQLite (in-memory dev DB)
- AI: OpenAI API
- Gmail: googleapis (Gmail API)
- Automation: Puppeteer for unsubscribe flows
- Testing: Vitest (+ UI), Testing Library, JSDOM
- Linting: ESLint

## Prerequisites

- Node.js 20+ and npm
- Google Cloud project with:
  - OAuth 2.0 client (Web) for Google Sign‑In
  - Gmail API enabled
  - Test users added on the OAuth consent screen (at least the tester account you’ll use)
- OpenAI API key

## Environment variables

Create a .env file in the project root with the following values:

```
# Server
PORT=3000
JWT_SECRET=replace-with-a-long-random-string
OPENAI_API_KEY=sk-...

# Google OAuth / Gmail
# Note: The frontend also needs the client ID; Vite exposes vars that start with VITE_
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Gmail push notifications (watch). Used as the topicName value in gmail.users.watch
# Provide the full Pub/Sub topic name. Example: projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC
GOOGLE_CLOUD_PROJECT_ID=projects/your-project-id/topics/your-topic
```

Notes

- The same .env file is loaded by both Express and Vite (vars starting with VITE\_ are exposed to the client).
- The development DB is SQLite in-memory and is reset on server restart. Do not expect persistence between runs.

## Install and run (development)

1. Install dependencies

```
npm install
```

2. Create .env as above and ensure your Google Cloud OAuth setup is complete

- Enable Gmail API in Google Cloud
- Create OAuth 2.0 client (type Web)
- Add http://localhost:3000 to Authorized JavaScript origins
- Add yourself as a Test user under OAuth consent screen

3. Start the dev server (Express + Vite)

```
npm run dev
```

- The server starts on PORT (default 3000) and binds the Vite dev server via Vite‑Express
- Open http://localhost:3000

If you encounter Prisma client errors after modifying the schema, regenerate the client:

```
npx prisma generate
```

## Build and run (production)

- Build both backend and frontend and initialize Prisma:

```
npm run build
```

- Start the server in production mode:

```
npm run prod
```

- Alternatively, to preview the built frontend only:

```
npm run preview
```

## Available scripts

- dev: Nodemon + tsx runs src/server/index.ts (Vite is bound automatically)
- build: Generates Prisma client, resets and pushes schema, builds TS and Vite
- prod: Starts server with NODE_ENV=production
- lint: ESLint
- test:frontend: Vitest UI for frontend
- test:backend: Vitest for backend
- test: Combined frontend + backend tests
- coverage: Vitest coverage

## API overview (mounted at /api)

Auth

- POST /api/google-login: Exchanges OAuth code for tokens and logs the user in. Sets a JWT cookie
- GET /api/me: Returns current user (requires auth)
- GET /api/logout: Revokes Gmail watches and clears auth cookie (requires auth)

Categories

- GET /api/categories: List user categories
- GET /api/categories/:id: Get a category
- POST /api/categories: Create
- PUT /api/categories/:id: Update
- DELETE /api/categories/:id: Delete
- POST /api/categories-ai: Generate a category (AI)

Emails

- GET /api/emails/:cid: List emails for a category
- DELETE /api/emails-db: Delete emails from the app DB (selected IDs in body)
- DELETE /api/emails: Bulk unsubscribe (selected IDs in body)
- POST /api/gmail-sync: Triggers Gmail sync (imports, AI categorize + summarize, archive in Gmail)

Webhook

- POST /api/gmail-push: Endpoint for Gmail push notifications (wired to sync)

Sockets

- Socket.IO is attached to the same server. The client authenticates via JWT stored in an httpOnly cookie.

## Data model (Prisma)

- User: id, email
- Category: id, name, description, userId
- Email: id, messageId, threadId, subject, sender info, receivedAt, body, summary, categoryId, userId, processed, archived, hasUnsubscribeLink
- GmailAccount: id, email, name, picture, userId, accessToken, refreshToken

Dev DB is SQLite in-memory (file:dev1.db?mode=memory&cache=shared). build runs prisma migrate reset and db push. For local iterations, simply run dev; if you edit schema, run npx prisma generate.

## Gmail OAuth and scopes

- Scope used: https://www.googleapis.com/auth/gmail.modify
- The login flow uses @react-oauth/google with flow="auth-code" and an OAuth2 client using "postmessage". Ensure your OAuth client is type Web; Authorized JS origins must include your local origin (e.g., http://localhost:3000)

## Unsubscribe automation

- Bulk unsubscribe uses Puppeteer to open unsubscribe pages, follows AI instructions to submit forms or toggle controls
- Puppeteer downloads a compatible Chromium on install
  - If you need to use a system Chrome, set PUPPETEER_EXECUTABLE_PATH and PUPPETEER_SKIP_DOWNLOAD=1 before npm install

## Development notes

- Cookies: Server sets a JWT token cookie (httpOnly, SameSite=Lax, Secure in production)
- CORS: Enabled with credentials
- Vite‑Express binds the Vite dev server to the Express HTTP server, so one process drives both in development
- Tailwind is configured via @tailwindcss/vite and hero.ts plugin

## Running tests

- Frontend (UI runner):

```
npm run test:frontend
```

- Backend:

```
npm run test:backend
```

- All tests + coverage:

```
npm run test
npm run coverage
```

## Troubleshooting

- Google login fails: Verify VITE_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAuth consent screen test users, and origins
- OpenAI calls fail: Verify OPENAI_API_KEY
- Prisma errors: Run npx prisma generate; ensure Node version is 20+
- Puppeteer launch issues on macOS/Linux: Try setting PUPPETEER_EXECUTABLE_PATH to your installed Chrome and export PUPPETEER_SKIP_DOWNLOAD=1 before npm install

## License

For evaluation purposes only.
