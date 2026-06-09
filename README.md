# 🏏 Floodlit — Cricket Pitch Booking System

A real-time cricket pitch booking platform. Users browse pitches, pick a date, see a
**live** hourly slot calendar, place a **2-minute hold** on a slot, and confirm — with
**guaranteed no double-bookings** even when many users race for the same slot.

> Built as a clean-architecture monorepo. **MySQL + Redis run in Docker**; the **backend
> and frontend run on your machine** with hot reload. Configuration comes from a single
> root `.env` (with small host overrides in `backend/.env`).

| | |
|---|---|
| **Backend** | Node 22, Express, TypeScript, Socket.io, **Prisma ORM** |
| **Database** | **MySQL 8** (transactions + `GET_LOCK` + composite unique index) |
| **Cache / realtime** | Redis (reservation TTL + keyspace expiry + Socket.io pub/sub adapter) |
| **Frontend** | React 18, Vite 6, TailwindCSS v4 |
| **Architecture** | Clean Architecture (domain → application → adapters) |

---

## Prerequisites

- **Docker** + Docker Compose — for MySQL and Redis.
- **Node.js 22** + **npm** — to run the backend and frontend.

---

## Setup & run

Four short steps. Step 1 is once; steps 3–4 are the two processes you keep running
(use two terminals).

### 1. Environment files

```bash
cp .env.example .env                  # root: DB credentials, JWT secret, ports, CORS…
cp backend/.env.example backend/.env  # host overrides: DATABASE_URL/REDIS_URL → localhost
```

The root `.env` configures everything. `backend/.env` is loaded first and only overrides
`DATABASE_URL`/`REDIS_URL` to point at `localhost` — the root values use the Docker service
names (`mysql`/`redis`), which don't resolve from your host. The defaults work as-is.

### 2. Start MySQL + Redis (Docker)

```bash
docker compose up -d mysql redis
```

This starts **MySQL** on `:3306` and **Redis** on `:6379` in the background. Verify they're
healthy with `docker compose ps`.

### 3. Backend — Terminal 1

```bash
cd backend
npm install          # first time only
npm run migrate      # apply Prisma migrations (creates the tables)
npm run seed         # insert the 3 pitches (first time only)
npm run dev          # API + WebSocket on http://localhost:4000
```

### 4. Frontend — Terminal 2

```bash
cd frontend
npm install          # first time only
npm run dev          # http://localhost:5200
```

### Open the app

Go to **http://localhost:5200**, create an account, and book a pitch. Open a second
browser tab on the same pitch + date to watch slots update **live** as you reserve/confirm.

| Service | URL / Port |
|---------|------------|
| Frontend | http://localhost:5200 |
| Backend API | http://localhost:4000 |
| MySQL | localhost:3306 (user `pitch` / password `pitch`) |
| Redis | localhost:6379 |

**Stop:** `Ctrl-C` the two `npm run dev` processes, then `docker compose down` (add `-v` to
also wipe the database volume and start clean next time).

---

## Verify the concurrency guarantee

The headline test fires 12 simultaneous confirmations at one slot and asserts exactly one
wins. With MySQL running (step 2 above):

```bash
cd backend
npm install   # if you haven't already
npm test      # connects to mysql://root:root@127.0.0.1:3306/pitch_booking
```

```
✓ booking concurrency > allows exactly one of many simultaneous confirmations
```

---

## API reference

All booking/slot endpoints require `Authorization: Bearer <jwt>`.

| Method | Route | Auth | Body / Query | Notes |
|--------|-------|------|--------------|-------|
| POST | `/auth/register` | – | `{ name, email, password }` | → `{ user, token }` |
| POST | `/auth/login` | – | `{ email, password }` | → `{ user, token }` |
| POST | `/auth/logout` | ✓ | – | stateless JWT — client discards token |
| GET | `/pitches` | – | – | list of pitches |
| GET | `/slots` | ✓ | `?pitchId=&date=YYYY-MM-DD` | `[{ startHour, startTime, endTime, status }]` |
| POST | `/reserve-slot` | ✓ | `{ pitchId, date, startHour }` | 2‑minute hold; → `{ reservedUntil, ttlSeconds }` |
| POST | `/release-slot` | ✓ | `{ pitchId, date, startHour }` | cancel your own hold early (frees it instantly); → 204 |
| POST | `/confirm-booking` | ✓ | `{ pitchId, date, startHour }` | accepts `Idempotency-Key` header |
| GET | `/my-bookings` | ✓ | – | the user's bookings |
| GET | `/health` | – | – | `{ status: "ok" }` |

`status` is one of `available` · `reserved` · `booked`.

### Socket.io events

Clients join the room `pitch:{pitchId}:{date}` and receive:

| Event | Payload | Meaning |
|-------|---------|---------|
| `slot:reserved` | `{ pitchId, date, startHour, until }` | someone placed a hold |
| `slot:booked` | `{ pitchId, date, startHour }` | a booking was confirmed |
| `slot:released` | `{ pitchId, date, startHour }` | a hold expired / was released |

---

## Project layout

```
.
├── docker-compose.yml        # MySQL + Redis + backend + frontend
├── .env.example              # single env file for the whole project (copy to .env)
├── backend/                  # Express + Socket.io API (clean architecture)
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma     # MySQL data model
│   │   └── migrations/       # Prisma migrations
│   └── src/
│       ├── domain/           # entities, value objects, errors  (no framework imports)
│       ├── application/      # use cases + ports (interfaces)
│       ├── infrastructure/   # Prisma, Redis, Socket.io, security adapters
│       ├── interfaces/       # HTTP controllers/routes + socket handlers
│       └── main.ts           # composition root (wires everything)
├── frontend/                 # React + Vite + Tailwind v4
│   ├── Dockerfile            # builds + serves via nginx
│   ├── nginx.conf
│   └── src/
│       ├── lib/              # api client, socket, types
│       ├── features/         # auth, booking (calendar, slots, reservation countdown)
│       └── app/              # router + layout
└── docs/
    ├── 00-overview.md        # plan overview + architecture diagram
    ├── ARCHITECTURE.md       # answers to the mandatory architecture questions
    ├── schema.sql            # database schema
    ├── research-notes.md     # findings that shaped the implementation
    └── phases/               # phase-by-phase build plan
```

---

## Available scripts (backend)

| Command | Description |
|---------|-------------|
| `npm run dev` | start API with hot reload |
| `npm run migrate` | apply Prisma migrations (`prisma migrate deploy`) |
| `npm run migrate:dev` | create a new migration from schema changes |
| `npm run prisma:generate` | regenerate the Prisma client |
| `npm run seed` | insert the 3 pitches |
| `npm run build` / `npm start` | compile to `dist/` and run |
| `npm test` | run the concurrency test |
| `npm run typecheck` | type-check only |

---

## How it works (short version)

- **Slots are generated dynamically** from each pitch's operating hours — never stored.
  Availability = confirmed bookings (MySQL) ∪ live holds (Redis).
- **Holds** use `SET NX EX 120` in Redis: atomic, auto-expiring. A Redis keyspace
  `expired` event pushes `slot:released` so the UI frees the slot instantly.
- **Confirmation** runs in a MySQL transaction behind a per-slot **`GET_LOCK`**, with a
  **composite unique index** (`pitch, date, start_time, status`) as the enforced backstop —
  so two simultaneous confirmations can never both succeed.

Full reasoning, including the answers to the mandatory architecture questions, is in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
