<div align="center">

# ⚜️ AURELIAN
### *Luxury Salon & Bespoke Grooming Platform*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://aurelian-phi-brown.vercel.app)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Upstash_Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Security-E5C378?style=for-the-badge)](https://better-auth.com/)

<p align="center">
  A state-of-the-art, full-stack appointment booking and management platform crafted with rich haute-horlogerie aesthetics, resilient serverless architecture, distributed concurrency locking, and seamless multi-channel authentication.
</p>

[**Live Demo »**](https://aurelian-phi-brown.vercel.app) · [**Report Bug »**](https://github.com/Virendra-Phirke/AURELIAN/issues) · [**Request Feature »**](https://github.com/Virendra-Phirke/AURELIAN/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Database Setup](#database-setup)
  - [Running the Development Server](#running-the-development-server)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## ✨ Overview

**Aurelian** is designed for upscale barbershops, luxury salons, and bespoke styling studios. It bridges client-facing luxury booking with a real-time administrative command center. 

The application is engineered with an obsession for micro-interactions, dark & light theme parity, serverless edge resilience, and bulletproof concurrency controls to prevent double-booking.

---

## 🌟 Key Features

### 👑 Client Experience
- **Interactive Booking Flow:** Dynamic week date navigation, real-time service selection, slot availability engine with live break and duration calculation.
- **Client Dashboard:** Real-time appointment timeline, status indicators (`PENDING`, `ACCEPTED`, `CANCELLED`, `COMPLETED`), search, and status filters.
- **Dynamic Cancellation Policy:** Automated countdown timers showing remaining cancellation cutoff windows based on salon policy.
- **Dual Luxury Themes:** Fluid transitions between **Noir Gold** (Dark) and **Warm Ivory** (Light) with interactive particle backdrops and custom view transitions.

### 🛡️ Authentication & Security
- **Multi-Factor Authentication:** Powered by **Better-Auth** with:
  - Email & Password with secure argon2 hashing.
  - **Email OTP Passcode** for passwordless login and verification.
  - **Google OAuth** with automatic popup fallback and origin resolution.
  - **TOTP Two-Factor Authentication (2FA)** support.
  - **Role-Based Access Control (RBAC):** Granular separation between `USER` and `ADMIN`.

### ⚡ Admin Command Center
- **Live Booking Feed:** Instant appointment approvals, rejections, and search with status management.
- **Service Catalog CRUD:** Create, update, toggle active state, and delete grooming packages with duration & price configuration in multiple currencies (`₹ INR`, `$`, `€`, `£`, `AED`).
- **Operating Hours & Break Scheduler:** Configure salon open/close hours, afternoon break windows, closed days, and auto-confirmation rules.
- **Shop Announcements:** Publish broadcast banners that appear across client booking screens.

### 🚀 Backend & Performance
- **Zero Double-Booking Guarantee:** Distributed concurrency locks with atomic Redis operations (`NX: true`, `EX: 5`) and database-level unique constraints.
- **Multi-Tiered Caching:** Upstash Cloud Redis (HTTP REST for Vercel Edge) + Docker Redis for local dev + In-memory fallback.
- **Branded Email Engine:** Resend SDK integration sending luxury gold HTML verification codes and appointment receipts.

---

## 🏗 Architecture & Tech Stack

```
                  ┌──────────────────────────────────────────────────┐
                  │                 CLIENT / BROWSER                 │
                  │  React 19 + TypeScript + Vite + Tailwind CSS v4  │
                  └─────────┬──────────────────────────────┬─────────┘
                            │                              │
                    Static SPA Pages               REST & Auth Requests
                            │                              │
                            ▼                              ▼
                 ┌──────────────────────┐      ┌─────────────────────────┐
                 │   Vercel Edge CDN    │      │ Vercel Serverless / API │
                 │  (dist/index.html)   │      │    (Express + Auth)     │
                 └──────────────────────┘      └────────────┬────────────┘
                                                            │
                            ┌───────────────────────────────┴───────────────────────────────┐
                            ▼                                                               ▼
                 ┌──────────────────────┐                                        ┌──────────────────────┐
                 │   Neon PostgreSQL    │                                        │  Upstash Cloud Redis │
                 │ (Drizzle ORM + Pool) │                                        │ (Caching & Mutexes)  │
                 └──────────────────────┘                                        └──────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 6, TypeScript | Core Single Page Application (SPA) |
| **Styling** | Tailwind CSS v4, CSS Variables | Responsive design, glassmorphism, luxury design tokens |
| **Animations** | Motion (Framer Motion), Canvas API | Micro-interactions, smooth page transitions |
| **Form & Validation** | React Hook Form, Zod | Type-safe form validation |
| **Server** | Express 5, Node.js | Modular REST API and Serverless Function handler |
| **Database** | Neon Serverless PostgreSQL | Relational ACID database with pooling |
| **ORM** | Drizzle ORM, Drizzle Kit | Type-safe SQL queries and schema migrations |
| **Authentication** | Better-Auth | Session management, OAuth, 2FA, Email OTP |
| **Caching & Mutex** | Upstash Redis, `@upstash/redis`, `redis` | Sub-millisecond cache, rate limiting, slot locks |
| **Email Deliverability** | Resend SDK | Branded transactional emails and OTP codes |

---

## 📂 Project Directory Structure

```text
├── api/                       # Vercel Serverless Functions entry point
│   └── index.ts               # Serverless Express handler
├── backend/                   # Backend application core
│   ├── app.ts                 # Express app initialization & middleware
│   ├── auth.ts                # Better-Auth server configuration & plugins
│   ├── redis.ts               # Unified Redis client (Upstash + Local + Fallback)
│   ├── server.ts              # Local development HTTP listener & DB seed
│   ├── db/
│   │   ├── index.ts           # Neon PostgreSQL connection pool
│   │   └── schema.ts          # Drizzle ORM database schemas
│   └── routes/
│       └── api.ts             # REST API endpoints (Bookings, Shop, Services)
├── public/                    # Static assets
│   └── favicon.svg            # Scalable luxury gold brand favicon
├── src/                       # Frontend application
│   ├── components/            # Reusable UI & Layout components
│   │   ├── Layout.tsx         # Sidebar, Header, Mobile Nav & User Profile
│   │   ├── ParticleBackground.tsx # Interactive ambient particle canvas
│   │   └── magicui/           # Custom animations (Theme toggler, Word rotate, etc.)
│   ├── lib/                   # Frontend helpers & utilities
│   │   ├── auth.ts            # Better-Auth client instance
│   │   └── oauthPopup.ts      # OAuth popup flow handler
│   ├── pages/                 # Application views
│   │   ├── Booking.tsx        # Client appointment booking flow
│   │   ├── Dashboard.tsx      # Client appointment timeline & manager
│   │   ├── Admin.tsx          # Admin control panel & salon settings
│   │   ├── Login.tsx          # Multi-method authentication screen
│   │   ├── Register.tsx       # New client onboarding
│   │   ├── ForgotPassword.tsx # Password recovery
│   │   ├── ResetPassword.tsx  # New password setup
│   │   └── Settings.tsx       # User profile & 2FA management
│   ├── App.tsx                # Route definitions & Auth guards
│   ├── index.css              # Global styles, typography & color palettes
│   └── main.tsx               # React application entry point
├── drizzle.config.ts          # Drizzle Kit configuration
├── vercel.json                # Vercel routing & build configuration
├── vite.config.ts             # Vite build configuration
└── package.json               # Dependencies & build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Docker Desktop** *(optional, for local Redis)*
- **PostgreSQL Database** *(or free cloud database on [Neon](https://neon.tech))*

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Virendra-Phirke/AURELIAN.git
   cd AURELIAN
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and fill in your database credentials, auth secrets, and API keys.*

---

### Database Setup

Push the Drizzle database schema to your PostgreSQL instance:
```bash
npm run db:push
```

---

### Running the Development Server

1. *(Optional)* Start local Docker Redis:
   ```bash
   docker run -d --name my-redis -p 6379:6379 redis:alpine
   ```

2. Start the unified development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

| Variable | Description | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | Neon / PostgreSQL connection string with SSL | **Yes** | `postgresql://user:pass@ep-xyz.neon.tech/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | 32+ character random secret for signing sessions | **Yes** | `ba_super_secret_session_key` |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | **Yes** | `http://localhost:3000` or `https://aurelian-phi-brown.vercel.app` |
| `VITE_APP_URL` | Frontend origin | Optional | `http://localhost:3000` |
| `RESEND_API_KEY` | Resend API key for transactional emails & OTP | Optional | `re_123456789_abcdefg` |
| `EMAIL_FROM` | Verified sender address in Resend | Optional | `Aurelian <onboarding@resend.dev>` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (for serverless edge) | Optional | `https://proper-gnat-157807.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | Optional | `gQAAAAAAAmhv...` |
| `REDIS_URL` | Local / Direct TCP Redis connection URL | Optional | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | Optional | `746469864617-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | Optional | `GOCSPX-xxx` |
| `VITE_GOOGLE_CLIENT_ID` | Google Client ID exposed to browser for One Tap | Optional | `746469864617-xxx.apps.googleusercontent.com` |

---

## 📡 API Reference

### Public & Client Endpoints
- `GET /api/shop` — Fetch salon profile, working hours, break times, currency, and active announcement.
- `GET /api/services` — List all active salon grooming services.
- `GET /api/availability?date=YYYY-MM-DD&serviceId=XYZ` — Get available booking slots with break and collision checks.
- `POST /api/bookings` — Create a new appointment with concurrency lock.
- `GET /api/bookings/my` — Fetch current user's appointments.
- `PATCH /api/bookings/:id/cancel` — Cancel an appointment (enforces salon cutoff policy).

### Admin Endpoints (Requires `role: "ADMIN"`)
- `GET /api/admin/bookings` — List all appointments across all clients.
- `PATCH /api/admin/bookings/:id/status` — Accept, cancel, or complete appointments.
- `POST /api/services` — Create a new service.
- `PUT /api/services/:id` — Edit an existing service.
- `DELETE /api/services/:id` — Delete a service.
- `PUT /api/admin/shop-settings` — Update operating hours, announcements, cutoff rules, and currency.

### Better Auth Endpoints
- `/api/auth/sign-in/email` — Email & password sign-in.
- `/api/auth/sign-up/email` — User registration.
- `/api/auth/sign-in/social` — Google / GitHub OAuth entry point.
- `/api/auth/email-otp/send-verification-otp` — Send one-time passcode.
- `/api/auth/forget-password` — Request password reset email.
- `/api/auth/get-session` — Validate active user session.

---

## 🌐 Production Deployment

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Project Settings → Environment Variables**, add the production keys from the [Environment Variables](#-environment-variables) section.
4. Set **Build Command** to `vite build` and **Output Directory** to `dist` (configured in `vercel.json`).
5. Click **Deploy**.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Crafted with precision for the modern luxury salon.</sub>
</div>
