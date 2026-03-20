#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  EduFlow — One-shot setup script
#  Run: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

info()    { echo -e "${GREEN}✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $1${NC}"; }
section() { echo -e "\n${GREEN}━━━ $1 ━━━${NC}"; }

# ─── 1. Docker group fix ──────────────────────────────────────────────────────
section "Docker Setup"
if ! groups | grep -q docker; then
  echo "Adding $USER to docker group (requires your password once)..."
  sudo usermod -aG docker "$USER"
  warn "Docker group added. You need to log out and log back in OR run:"
  warn "  newgrp docker && bash setup.sh"
  warn "Re-run this script after that."
  exit 0
else
  info "Already in docker group"
fi

# ─── 2. Start PostgreSQL ──────────────────────────────────────────────────────
section "Starting PostgreSQL (Docker)"
docker compose up -d --wait 2>/dev/null || docker-compose up -d
sleep 3

# Verify DB is up
if docker compose exec -T db pg_isready -U eduflow -d eduflow -q 2>/dev/null; then
  info "PostgreSQL is ready on port 5433"
else
  warn "DB might need a few more seconds, continuing..."
  sleep 5
fi

# ─── 3. Prisma migrate ───────────────────────────────────────────────────────
section "Running Database Migrations"
npx prisma generate
npx prisma migrate dev --name init --skip-seed
info "Migrations applied"

# ─── 4. Seed database ────────────────────────────────────────────────────────
section "Seeding Demo Data"
npx prisma db seed
info "Demo data seeded"

# ─── 5. GitHub Remote Setup ──────────────────────────────────────────────────
section "GitHub Remote Setup"

REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE" ]; then
  info "Remote already set: $REMOTE"
else
  echo ""
  echo "To connect to GitHub, you need to:"
  echo ""
  echo "  Option A — Using GitHub CLI (recommended):"
  echo "    sudo snap install gh"
  echo "    gh auth login"
  echo "    gh repo create eduflow-cms --private --source=. --remote=origin --push"
  echo ""
  echo "  Option B — Manual (paste your GitHub repo URL):"
  echo "    git remote add origin https://github.com/YOUR_USERNAME/eduflow-cms.git"
  echo "    git push -u origin main"
  echo ""
  read -rp "Paste your GitHub repo URL now (or press Enter to skip): " REPO_URL
  if [ -n "$REPO_URL" ]; then
    git remote add origin "$REPO_URL"
    git push -u origin main
    info "Pushed to GitHub: $REPO_URL"
  else
    warn "Skipped GitHub setup — you can add it later with 'git remote add origin <url>'"
  fi
fi

# ─── 6. Done ─────────────────────────────────────────────────────────────────
section "All Done!"
echo ""
echo "  Start dev server:   npm run dev"
echo "  Open in browser:    http://localhost:3000"
echo ""
echo "  Demo Login:         admin@eduflow.com / Admin@123"
echo "  DB Studio:          npm run db:studio"
echo ""
info "EduFlow is ready 🎓"