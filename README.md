# 🎨 Color Flood Online

A multiplayer real-time color flood-fill puzzle game. Create rooms, invite friends, and compete on a live leaderboard.

**Created by Htcode**

---

## ✨ Features

- 🏠 **Room system** — Create a room, share the 6-character code, others join instantly
- 👥 **Unique usernames per room** — No two players can share a name in the same room
- 🏆 **Live leaderboard** — Updates in real-time as players complete levels using Supabase Realtime
- 🎮 **101 progressive levels** — Grid sizes from 6×6 to 101×101
- ⏳ **2-month room persistence** — Rooms stay alive for 60 days, auto-deleted via pg_cron
- 📋 **Shareable links** — One-click copy of invite link or room code
- 📱 **Mobile responsive** — Works on any screen size
- 🎬 **Splash screen** — "Created by Htcode" on first load

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd color-flood-online
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, paste and run the entire contents of `supabase-schema.sql`
3. Go to **Database → Extensions** and enable **pg_cron**
4. Re-run the `cron.schedule(...)` line from the schema file after enabling pg_cron

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase credentials:
- **Project URL**: Supabase Dashboard → Project Settings → API → Project URL
- **Anon key**: Supabase Dashboard → Project Settings → API → `anon` `public` key
- **Service role key**: Supabase Dashboard → Project Settings → API → `service_role` key (keep secret!)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add the three environment variables in the Vercel dashboard
4. Click **Deploy**

That's it — one-click deploy, zero config needed.

---

## 🗄️ Database Schema

### `rooms`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | TEXT | 6-char unique room code (e.g. `XK92PL`) |
| creator_username | TEXT | Username of room creator |
| created_at | TIMESTAMPTZ | Creation timestamp |
| expires_at | TIMESTAMPTZ | Auto-set to 60 days from creation |
| is_active | BOOLEAN | False when creator closes room |

### `players`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| room_id | UUID | FK → rooms.id |
| username | TEXT | Unique per room |
| joined_at | TIMESTAMPTZ | When they joined |

### `scores`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| room_id | UUID | FK → rooms.id |
| username | TEXT | Player username |
| level | INTEGER | Level number (1–7) |
| moves_used | INTEGER | Moves taken to complete |
| stars | INTEGER | 1–3 stars earned |
| completed_at | TIMESTAMPTZ | Completion time |

---

## 🎮 How to Play

1. **Create a Room** — enter a username, get a 6-char room code
2. **Share the code** — send the link or code to friends
3. **Friends join** — they enter the code and pick a unique username
4. **Play** — tap colors to flood-fill the board from the top-left corner
5. **Win** — fill the entire board before running out of moves
6. **Compete** — the leaderboard ranks players by levels completed → stars → fewest moves

### Scoring
- ⭐⭐⭐ 3 stars — complete in ≤50% of allowed moves
- ⭐⭐ 2 stars — complete in ≤75% of allowed moves
- ⭐ 1 star — complete in >75% of allowed moves

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Scheduling | Supabase pg_cron |
| Styling | Tailwind CSS + inline styles |
| Fonts | Orbitron + Inter (Google Fonts) |
| Hosting | Vercel |

---

## 📁 Project Structure

```
color-flood-online/
├── app/
│   ├── layout.js               # Root layout, font imports
│   ├── globals.css             # Dark theme, animations
│   ├── page.js                 # Home screen with splash
│   ├── room/
│   │   ├── create/page.js      # Create room flow
│   │   ├── join/page.js        # Join room flow
│   │   └── [code]/page.js      # Game room + leaderboard
│   └── api/
│       ├── rooms/route.js      # POST create, GET fetch room
│       ├── join/route.js       # POST join room
│       ├── scores/route.js     # POST submit score
│       └── close-room/route.js # POST close room (creator)
├── components/
│   ├── SplashScreen.jsx        # Animated intro screen
│   ├── ColorFloodGame.jsx      # Core game (web React)
│   └── Leaderboard.jsx         # Live leaderboard with realtime
├── lib/
│   ├── supabase.js             # Supabase client setup
│   └── gameLogic.js            # Flood fill, grid gen, utils
├── supabase-schema.sql         # Full DB schema — run in Supabase
└── .env.example                # Environment variable template
```

---

## ⚙️ Room Lifecycle

```
Creator opens app
       ↓
Splash screen (Created by Htcode)
       ↓
Create Room → 6-char code generated
       ↓
Share code/link with friends
       ↓
Friends join → unique usernames enforced
       ↓
Everyone plays → scores submitted on level complete
       ↓
Leaderboard updates live for all players
       ↓
Room closes when:
  - Creator clicks "Close Room" (immediate, everyone redirected)
  - 60 days pass (pg_cron auto-deletes at midnight UTC)
```

---

*Created by Htcode*
