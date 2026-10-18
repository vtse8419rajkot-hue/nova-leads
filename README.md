# Nova Leads 🇮🇳

A multilingual lead-management CRM PWA (HelloLeads-style) for Indian small businesses — built with **Next.js 16 + TypeScript + Prisma (SQLite) + Tailwind 4 + shadcn/ui**.

## Features

- 📇 **Leads** — capture from WhatsApp, Facebook, Instagram, website, phone, walk-in, referral, QR & more
- 📊 **Pipeline Kanban** — drag & drop between stages
- 🔔 **Follow-up Alarms** — full-screen alarm with complete lead details, 8 alarm sounds, snooze, notification permissions
- 💬 **WhatsApp Message Templates** — save your own default messages in Settings, pick one when you open any lead, placeholders (`{name}`, `{company}`, `{city}`, `{value}`, `{business}`, `{date}`) auto-fill, one tap to WhatsApp
- 🤖 **AI** — lead scoring + follow-up message generation
- 🧾 **Quotes & Invoices** — GST items, payment tracking, WhatsApp share
- 👥 **Contacts, Products, Team, Tasks, Reports** — full CRM toolkit
- 🌐 **13 Indian languages** — ગુજરાતી, हिंदी, मराठी, বাংলা, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو (RTL), English
- 📱 **Installable PWA** — works offline, install on Android / iPhone / desktop
- 🌙 Dark mode · CSV export · global search

## Run locally

```bash
bun install            # or: npm install
bun run db:push        # create SQLite database (prisma/schema.prisma)
bun run dev            # http://localhost:3000
```

Optional demo data: open the app → Settings → "Load demo data".

`.env` is optional; without it the app uses `db/custom.db` (see `.env.example`).

## Deploy to Vercel (auto-deploy on every push)

1. Push this repo to GitHub (or fork it).
2. Open **[vercel.com/new](https://vercel.com/new)** → import the repo.
3. Framework preset is auto-detected (Next.js). **No environment variables needed** — on Vercel the app bootstraps a SQLite demo database into `/tmp` automatically on cold start (see `src/lib/db.ts`).
4. Click **Deploy** → done. Every `git push` to the connected branch now auto-deploys.

> ℹ️ SQLite lives on the serverless filesystem, so data resets when instances recycle — perfect for a demo. For production use, point Prisma at a hosted Postgres/MySQL or Turso.

## Tech notes

- `postinstall` runs `prisma generate` so Vercel builds work out of the box.
- `outputFileTracingIncludes` ships `db/custom.db` inside API routes' serverless bundles.
- Service worker + manifest make it an installable offline PWA.
