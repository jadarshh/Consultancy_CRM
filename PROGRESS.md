# EduFlow — Build Progress

## MVP Status

### ✅ Completed
- [x] Git initialized
- [x] Next.js 14 + TypeScript + Tailwind
- [x] All npm dependencies installed
- [x] Prisma schema (18+ entities, all enums)
- [x] Global CSS with Deep Ocean theme
- [x] `src/lib/db.ts` — Prisma singleton
- [x] `src/lib/utils.ts` — date, currency, stage helpers
- [x] `src/lib/auth.ts` — NextAuth with credentials + JWT + roles
- [x] `src/lib/permissions.ts` — full RBAC engine
- [x] `src/components/ui/badge.tsx`
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/layout/Sidebar.tsx`
- [x] `src/components/layout/Topbar.tsx`
- [x] `src/app/(auth)/login/page.tsx` — split-panel login
- [x] `src/app/(dashboard)/layout.tsx` — sidebar + topbar shell
- [x] `src/app/(dashboard)/dashboard/page.tsx` — full dashboard with stats + widgets
- [x] `src/app/(dashboard)/students/page.tsx` — student list with search + filters
- [x] `src/app/(dashboard)/students/[id]/page.tsx` — tabbed student profile

### 🔄 In Progress / Next
- [ ] `src/app/(dashboard)/pipeline/page.tsx` — Kanban board
- [ ] `src/app/(dashboard)/students/new/page.tsx` — add student form
- [ ] `docker-compose.yml` — PostgreSQL local setup
- [ ] `prisma/seed.ts` — demo data (users, countries, students)
- [ ] `src/app/page.tsx` — root redirect
- [ ] `src/middleware.ts` — auth middleware
- [ ] `package.json` additions — bcryptjs
- [ ] `.gitignore` — ensure .env excluded

### 📋 Phase 2 (Post-MVP)
- [ ] Pipeline Kanban with drag-and-drop
- [ ] Add Student multi-step form
- [ ] Communication log form
- [ ] Application management
- [ ] Country/University catalog
- [ ] Reports & Analytics
- [ ] Task management
- [ ] Settings / User management
- [ ] GitHub remote connection
- [ ] File upload (S3/local)

## Running the App

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Seed demo data
npx prisma db seed

# 4. Start dev server
npm run dev
```

Open: http://localhost:3000
Login: admin@eduflow.com / Admin@123

## Architecture Notes
- Next.js App Router with route groups: (auth) and (dashboard)
- All dashboard pages are server components — data fetched directly via Prisma
- Auth via NextAuth.js credentials + JWT; role stored in JWT token
- CSS variables for theming; no Tailwind JIT conflicts
- RBAC: hasPermission() utility used in both server and client components
