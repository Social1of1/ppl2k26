# 🏆 Philippine Pro-Am League (PPL) — NBA 2K26

Full-stack esports league management platform built with Next.js 14, Firebase, and AI-powered box score processing.

---

## ✅ Features

- **Public Pages**: Home, Standings (Group A/B), Teams, Schedule, Stats/League Leaders
- **Team Portal**: Dashboard, Schedule viewer, Box score uploader
- **Admin Panel**: Manage teams, players, games, user accounts
- **AI Box Score Processing**: Upload image/PDF → Google Vision OCR → Claude AI parses stats → Auto-updates everything
- **Automated**: Player stats, team standings, and league leaders update instantly after upload

---

## 🚀 Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your keys
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔥 Firebase Setup

### Step 1 — Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: `ppl-nba2k26`
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** → Start in production mode
5. Enable **Storage**

### Step 2 — Get Client Config
Go to Project Settings → Your Apps → Web App → Config

Copy values to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Step 3 — Service Account (Admin SDK)
1. Project Settings → Service Accounts → Generate New Private Key
2. Download the JSON file
3. Copy values to `.env.local`:
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```
⚠️ Replace actual newlines in the private key with `\n`

### Step 4 — Firestore Rules
In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{id} { allow read: if true; }
    match /players/{id} { allow read: if true; }
    match /games/{id} { allow read: if true; }
    match /boxscores/{id} { allow read: if true; }
    match /users/{id} { allow read: if request.auth.uid == id; }
    match /{document=**} { allow write: if false; }
  }
}
```

### Step 5 — Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /boxscores/{file} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### Step 6 — Create Admin Account
Use the Admin Users page in the deployed app, OR run this once in Firebase Console:
1. Authentication → Add user manually (email/password)
2. Firestore → Create document in `users` collection with the UID:
```json
{
  "email": "admin@ppl.gg",
  "role": "admin",
  "teamId": null,
  "teamName": null
}
```

---

## 🤖 AI Box Score Setup

### Google Vision API (OCR)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Cloud Vision API**
3. Create API Key → restrict to Vision API
4. Add to `.env.local`: `GOOGLE_VISION_API_KEY=...`

### Anthropic API (Stat Parsing)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API Key
3. Add to `.env.local`: `ANTHROPIC_API_KEY=...`

**How it works:**
```
Team uploads image/PDF
    ↓
Google Vision extracts raw text (OCR)
    ↓
Claude parses text → structured JSON (player stats, scores)
    ↓
Firestore updated: game result, player stats, team standings
    ↓
League leaders auto-recalculated on next page load
```

---

## ☁️ Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial PPL app"
git remote add origin https://github.com/yourusername/ppl-app.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)

### Step 3 — Add Environment Variables
In Vercel Project → Settings → Environment Variables, add ALL keys from `.env.example`:
- All `NEXT_PUBLIC_*` Firebase keys
- All `FIREBASE_*` admin keys
- `GOOGLE_VISION_API_KEY`
- `ANTHROPIC_API_KEY`

### Step 4 — Deploy!
Click Deploy. Your site will be live at `https://your-project.vercel.app`

---

## 📊 Database Schema (Firestore)

```
/teams/{teamId}
  name, abbreviation, group (A|B), logoUrl,
  wins, losses, pointsFor, pointsAgainst, createdAt

/players/{playerId}
  name, number, position, teamId, teamName,
  gamesPlayed, totalPoints, totalRebounds, totalAssists,
  totalSteals, totalBlocks, totalFouls, totalTurnovers,
  totalFgm, totalFga, total3pm, total3pa, totalFtm, totalFta

/games/{gameId}
  homeTeamId, homeTeamName, awayTeamId, awayTeamName,
  group, scheduledDate, scheduledTime, week,
  status (scheduled|completed|cancelled),
  homeScore, awayScore,
  boxScoreUrl, boxScoreStatus (pending|processing|processed|failed),
  uploadedBy, uploadedAt

/boxscores/{gameId}
  gameId, homeTeamId, awayTeamId,
  homeScore, awayScore,
  homePlayerStats[], awayPlayerStats[],
  rawExtraction, processedAt

/users/{uid}
  email, role (admin|team), teamId, teamName, createdAt
```

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home
│   ├── standings/page.tsx          # Standings (Group A & B)
│   ├── teams/
│   │   ├── page.tsx                # All teams
│   │   └── [id]/page.tsx           # Team detail + roster
│   ├── schedule/page.tsx           # Full schedule
│   ├── stats/page.tsx              # Stats + league leaders
│   ├── login/page.tsx              # Login
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── teams/page.tsx          # Manage teams
│   │   ├── players/page.tsx        # Manage players
│   │   ├── games/page.tsx          # Manage games
│   │   └── users/page.tsx          # Create user accounts
│   ├── team/
│   │   ├── dashboard/page.tsx      # Team dashboard
│   │   ├── schedule/page.tsx       # Team's games
│   │   └── upload/page.tsx         # Box score upload
│   └── api/
│       ├── auth/create-user/       # Admin: create accounts
│       └── upload-boxscore/        # Upload + AI processing
├── components/
│   ├── layout/                     # Navbar, Footer, PublicLayout
│   ├── admin/                      # AdminLayout
│   └── team/                       # TeamLayout
├── lib/
│   ├── firebase.ts                 # Firebase client
│   ├── firebase-admin.ts           # Firebase Admin SDK
│   ├── auth.ts                     # Auth helpers
│   ├── auth-context.tsx            # React auth context
│   ├── db.ts                       # Firestore queries
│   └── utils.ts                    # Helpers
└── types/index.ts                  # TypeScript types
```

---

## 🛠️ Customization

**Add more teams:** Admin Panel → Teams → Add Team → assign to Group A or B

**Change league name:** Update `src/app/layout.tsx` metadata and `src/components/layout/Navbar.tsx`

**Adjust AI prompt:** Edit the prompt in `src/app/api/upload-boxscore/route.ts` to match your box score format

**Colors:** All in `tailwind.config.js` under `ppl` color keys and `src/app/globals.css`

---

## 📞 Support

For issues with deployment or Firebase setup, check the Vercel deployment logs and Firebase Console error logs first.
