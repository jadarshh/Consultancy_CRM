# Project Structure — EduFlow Consultancy CRM

## How to Run

```bash
# 1. Start the database (PostgreSQL on port 5433)
docker-compose up -d

# 2. Install dependencies (first time only)
npm install

# 3. Sync database schema (run whenever schema.prisma changes)
npx prisma db push

# 4. (Optional) Seed the database with sample data
npx prisma db seed

# 5. Start the development server
npm run dev
# App runs at http://localhost:3000

# 6. (Optional) Open Prisma Studio to browse the database
npx prisma studio
```

---

## Root

```
demo_prj/
├── docker-compose.yml       # PostgreSQL container config (port 5433, db: eduflow)
├── prisma.config.ts         # Prisma config pointing to schema.prisma
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript config
├── setup.sh                 # One-shot setup script (docker + migrate + seed)
├── package.json             # Dependencies and scripts
├── CLAUDE.md / AGENTS.md    # AI agent instructions for this repo
└── PROGRESS.md              # Feature progress notes
```

---

## prisma/

```
prisma/
├── schema.prisma            # Full database schema — all models, enums, relations
└── seed.ts                  # Seeds initial users, countries, universities, etc.
```

**Key models in schema.prisma:**
- `User` — staff accounts with roles (ADMIN, MANAGER, COUNSELOR, RECEPTIONIST)
- `Student` — core student record with stage, priority, preferred countries
- `FamilyMember` — family members per student (relationship, income, sponsor flag)
- `StudentCourse` — courses per student (IELTS/SAT/PTE etc., status, score)
- `StudentDocument` — uploaded files with type, status, notes
- `CommunicationLog` — call/email/WhatsApp logs per student
- `Application` — university applications per student
- `Task` — tasks assigned to counselors

---

## src/

### app/ — Next.js App Router pages and API routes

```
src/app/
├── layout.tsx               # Root HTML layout (fonts, body)
├── globals.css              # Global CSS — design tokens, component classes (card, btn, badge, input-base)
├── page.tsx                 # Root redirect → /dashboard
├── favicon.ico
│
├── (auth)/                  # Auth route group (no sidebar)
│   ├── layout.tsx           # Centered auth layout
│   └── login/page.tsx       # Login form with NextAuth credentials
│
├── (dashboard)/             # Main app route group (sidebar + topbar)
│   ├── layout.tsx           # Dashboard shell — Sidebar + Topbar + <main>
│   ├── page.tsx             # Redirect /  → /dashboard
│   │
│   ├── dashboard/page.tsx   # Main dashboard — stats, pipeline chart, course counts,
│   │                        #   follow-ups, tasks, recent activity, leaderboard
│   ├── students/
│   │   ├── page.tsx         # Student list — search, stage filter, pagination
│   │   │                    #   Mobile: card layout | Desktop: table
│   │   ├── new/page.tsx     # Add new student form
│   │   └── [id]/
│   │       ├── page.tsx     # Student detail — tabbed layout:
│   │       │                #   Overview | Personal | Academic | Courses |
│   │       │                #   Documents | Applications | Communications | Notes
│   │       └── edit/page.tsx # Edit student form
│   │
│   ├── pipeline/page.tsx    # Kanban pipeline board by stage
│   ├── applications/
│   │   ├── page.tsx         # All applications list with status filter
│   │   ├── new/page.tsx     # Create new application
│   │   └── [id]/page.tsx    # Application detail
│   ├── communication/page.tsx  # Global communication log (all students)
│   ├── tasks/page.tsx       # Task list — pending + in-progress tasks
│   ├── countries/page.tsx   # Country management (ADMIN/MANAGER)
│   ├── universities/page.tsx # University management (ADMIN/MANAGER)
│   ├── reports/page.tsx     # Reports overview (ADMIN/MANAGER/COUNSELOR)
│   └── settings/page.tsx    # Settings — users, profile, password (ADMIN)
│
└── api/                     # REST API routes (all require auth)
    ├── auth/[...nextauth]/  # NextAuth v5 handler
    ├── students/
    │   ├── route.ts         # GET (list), POST (create student)
    │   └── [id]/
    │       ├── route.ts     # GET, PATCH, DELETE single student
    │       ├── stage/       # PATCH — change student pipeline stage
    │       ├── photo/       # POST — upload student photo
    │       ├── family/
    │       │   ├── route.ts          # GET, POST family members
    │       │   └── [memberId]/route.ts  # PATCH, DELETE family member
    │       ├── courses/
    │       │   ├── route.ts          # GET, POST student courses
    │       │   └── [courseId]/route.ts  # PATCH, DELETE course
    │       ├── documents/route.ts    # GET (list), POST (upload), DELETE
    │       └── communications/route.ts  # GET (list), POST (log new)
    ├── applications/
    │   ├── route.ts         # GET, POST applications
    │   └── [id]/route.ts    # PATCH, DELETE application
    ├── communications/
    │   ├── route.ts         # GET all comms (global view)
    │   └── [id]/route.ts    # PATCH, DELETE comm log
    ├── tasks/
    │   ├── route.ts         # GET, POST tasks
    │   └── [id]/route.ts    # PATCH, DELETE task
    ├── countries/
    │   ├── route.ts         # GET, POST countries
    │   └── [id]/route.ts    # PATCH, DELETE country
    ├── universities/
    │   ├── route.ts         # GET, POST universities
    │   └── [id]/route.ts    # PATCH, DELETE university
    │       └── programs/route.ts  # GET, POST programs for a university
    ├── programs/route.ts    # GET programs (with filters)
    ├── intakes/route.ts     # GET intake periods
    ├── users/route.ts       # GET users list (for counselor assignment)
    └── settings/
        ├── users/
        │   ├── route.ts     # GET, POST users (ADMIN only)
        │   └── [id]/route.ts  # PATCH, DELETE user
        └── password/route.ts  # POST — change own password
```

---

### components/ — Reusable React components

```
src/components/
│
├── layout/
│   ├── Sidebar.tsx          # Collapsible sidebar nav — desktop + mobile drawer
│   └── Topbar.tsx           # Top header — search bar, notifications, user menu
│
├── students/                # Components used inside the student detail tabs
│   ├── CommunicationSection.tsx  # Log + view communication history (calls, WhatsApp, email)
│   ├── CoursesSection.tsx        # Add/edit/delete courses (IELTS, SAT, PTE…) with status & score
│   ├── DocumentsSection.tsx      # Upload, view, delete student documents with notes
│   ├── FamilySection.tsx         # Add/edit/delete family members (relation, income, sponsor)
│   ├── PhotoUpload.tsx           # Student profile photo upload
│   └── StageChangeButton.tsx     # Inline pipeline stage change dropdown
│
├── applications/
│   └── StatusFilter.tsx     # Filter bar for application status
│
├── pipeline/
│   └── PipelineClientFilters.tsx  # Client-side filters for the kanban board
│
└── ui/                      # Generic UI primitives
    ├── card.tsx             # Card, CardHeader, StatCard components
    ├── badge.tsx            # Badge component
    ├── button.tsx           # Button component
    └── input.tsx            # Input component
```

---

### lib/ — Shared utilities and server-side helpers

```
src/lib/
├── auth.ts          # NextAuth v5 config — JWT strategy, Credentials provider,
│                    #   session/token callbacks, TypeScript session types
├── db.ts            # Prisma client singleton (shared across API routes)
├── permissions.ts   # RBAC — role permissions map, hasPermission(), ROLE_LABELS
└── utils.ts         # Shared helpers: formatDate, formatCurrency, snakeToTitle,
                     #   timeAgo, initials, STAGE_LABELS, STAGE_COLORS, cn()
```

---

### proxy.ts — Route middleware (RBAC)

```
src/proxy.ts         # Next.js middleware wrapper (NextAuth v5 auth())
                     # Enforces role-based route access:
                     #   /settings          → ADMIN only
                     #   /countries, /universities → ADMIN, MANAGER
                     #   /reports           → ADMIN, MANAGER, COUNSELOR
                     # Redirects unauthorized to /dashboard?error=access_denied
```

---

## public/

```
public/
└── uploads/         # Student-uploaded files stored here (documents, photos)
                     # Served as static files at /uploads/<studentId>/<filename>
```
