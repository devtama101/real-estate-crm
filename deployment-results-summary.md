# Deployment Results Summary

## Project: Real Estate CRM
- **Live URL**: https://real-estate-crm.webartisan.id
- **Repository**: https://github.com/devtama101/real-estate-crm.git
- **VPS**: 103.189.234.117 (user: tamatopik)
- **Deploy Date**: February 2026

---

## Architecture

```
GitHub (push to main)
    |
GitHub Actions (build Docker image -> push to ghcr.io)
    |
VPS (SSH -> pull image -> restart containers -> db push)
    |
Docker Compose:
    +-- real-estate-crm-app (Next.js 16, port 3000)
    +-- real-estate-crm-postgres (PostgreSQL 16)

Shared Caddy Proxy (~/caddy):
    +-- caddy-proxy (ports 80/443, auto SSL)
        +-- commitquest.webartisan.id -> commitquest-app:3000
        +-- real-estate-crm.webartisan.id -> real-estate-crm-app:3000
```

---

## VPS Directory Structure

```
~/caddy/
    docker-compose.yml    # Shared Caddy reverse proxy
    Caddyfile             # Routes for all domains

~/commitquest/
    docker-compose.yml    # CommitQuest app + postgres
    .env                  # CommitQuest env vars
    deploy.sh
    commitquest-src/      # Source repo clone

~/real-estate-crm/
    docker-compose.yml    # Real Estate CRM app + postgres
    .env                  # Real Estate CRM env vars
    deploy.sh
    real-estate-crm-src/  # Source repo clone (for Prisma CLI)
```

---

## Problems Encountered & Solutions

### 1. Port Conflict: Multiple Caddy Instances

**Problem**: CommitQuest was already running on the VPS with its own Caddy container bound to ports 80/443. Starting a second Caddy for real-estate-crm caused a port conflict.

**Solution**: Created a shared Caddy reverse proxy setup:
- Created `~/caddy/` directory with a single Caddy instance handling all domains
- Created external Docker network `web-proxy`
- Both apps connect to `web-proxy` network so Caddy can reach them
- Removed Caddy service from individual app docker-compose files
- Caddyfile contains route blocks for each domain

**Key files on VPS**:
```
~/caddy/Caddyfile:
    commitquest.webartisan.id -> commitquest-app:3000
    real-estate-crm.webartisan.id -> real-estate-crm-app:3000

~/caddy/docker-compose.yml:
    caddy service on web-proxy external network
```

**Commands used**:
```bash
docker network create web-proxy
# Update each app's docker-compose.yml to add web-proxy network to app service
# Add networks: web-proxy: external: true
```

---

### 2. Docker Build Failure: BigInt TypeScript Errors

**Problem**: `npm run build` failed in GitHub Actions Docker build with 3 TypeScript errors related to Prisma BigInt fields.

**Error 1** - `commissions.ts:165`:
```
Type error: Operator '+=' cannot be applied to types 'number' and 'bigint'.
monthly[month].amount += c.commissionAmount
```

**Fix**: Convert BigInt to Number when accumulating:
```typescript
// Before
monthly[month].amount += c.commissionAmount
// After
monthly[month].amount += Number(c.commissionAmount)
```

**Error 2** - `commissions.ts:80` (getCommissionSummary):
```
Type error: Type 'bigint' is not assignable to type 'number'.
```

**Fix**: Wrap Prisma aggregate `_sum` results with `Number()`:
```typescript
// Before
pending: totalPending._sum.commissionAmount || 0,
// After
pending: Number(totalPending._sum.commissionAmount || 0),
```

**Error 3** - `page.tsx:19`:
```
Type error: BigInt literals are not available when targeting lower than ES2020.
sum + Number(p.price || 0n) * 0.03
```

**Fix**: Replace BigInt literal `0n` with regular `0`:
```typescript
// Before
.reduce((sum: number, p: any) => sum + Number(p.price || 0n) * 0.03, 0)
// After
.reduce((sum: number, p: any) => sum + Number(p.price || 0) * 0.03, 0)
```

**Error 4** - `prisma.ts:33`:
```
Type error: Property 'toJSON' does not exist on type 'BigInt'.
```

**Fix**: Add global type declaration:
```typescript
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
```

**Lesson**: When Prisma schema uses `BigInt` fields, always convert to `Number()` in application code. Run `npm run build` locally before pushing to catch these errors early.

---

### 3. Prisma 7: `url` No Longer Supported in Schema

**Problem**: `prisma db push` failed because the datasource block had no URL.

**First attempt** - Added `url = env("DATABASE_URL")` to schema:
```
Error: The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts`
```

**Solution**: Prisma 7 uses `prisma.config.ts` for the database URL, not the schema file. The project already had this file:
```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

Keep the schema datasource block minimal:
```prisma
datasource db {
  provider = "postgresql"
}
```

---

### 4. Prisma CLI Cannot Run Inside Standalone Container

**Problem**: The Next.js standalone Docker build only includes files needed to run the app. It does NOT include:
- `prisma.config.ts`
- `dotenv` module (used by prisma.config.ts)
- `tsx` (used for seed script)
- Full `node_modules` tree

Running `docker compose exec app npx prisma db push` fails inside the container.

**Solution**: Use a temporary Node container with the source code mounted:
```bash
docker run --rm \
  --network real-estate-crm_real-estate-crm-network \
  -e DATABASE_URL="postgresql://postgres:PASSWORD@real-estate-crm-postgres:5432/real_estate_crm" \
  -v $(pwd)/real-estate-crm-src:/app \
  -w /app \
  node:20-alpine \
  sh -c 'npx prisma generate && npx prisma db push --accept-data-loss'
```

This requires:
- The source repo cloned on VPS (`real-estate-crm-src/`)
- `npm install` run at least once in that directory
- Container connected to the app's Docker network to reach Postgres

**For seeding** (first time only):
```bash
docker run --rm \
  --network real-estate-crm_real-estate-crm-network \
  -e DATABASE_URL="..." \
  -v $(pwd)/real-estate-crm-src:/app \
  -w /app \
  node:20-alpine \
  sh -c 'npm install && npx prisma generate && npx prisma db seed'
```

Note: Seeding needs full `npm install` (not `--omit=dev`) because it requires `tsx`.

---

### 5. GitHub Actions Deploy Job Failing

**Problem**: The deploy job failed with SSH connection errors because the required secrets were not configured.

**Solution**: Set these 4 secrets via GitHub CLI:
```bash
gh secret set VPS_HOST --repo devtama101/real-estate-crm --body "103.189.234.117"
gh secret set VPS_USER --repo devtama101/real-estate-crm --body "tamatopik"
gh secret set VPS_PORT --repo devtama101/real-estate-crm --body "22"
cat ~/.ssh/id_ed25519 | gh secret set VPS_SSH_KEY --repo devtama101/real-estate-crm
```

**GitHub Actions deploy script** (in `.github/workflows/deploy.yml`):
```yaml
script: |
  cd ~/real-estate-crm
  docker compose pull
  docker compose up -d
  cd real-estate-crm-src && git pull && cd ..
  docker run --rm \
    --network real-estate-crm_real-estate-crm-network \
    -e DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2-)" \
    -v $(pwd)/real-estate-crm-src:/app \
    -w /app \
    node:20-alpine \
    sh -c 'npx prisma generate && npx prisma db push --accept-data-loss'
  echo "Deployment successful!"
```

---

### 6. Node.js Not Installed on VPS

**Problem**: VPS only has Docker installed, no system Node.js/npm. Cannot run `npx prisma` directly on the host.

**Solution**: All Node.js operations run inside Docker containers:
- App runs in `ghcr.io/devtama101/real-estate-crm:latest`
- Prisma CLI runs in temporary `node:20-alpine` container
- Source repo is volume-mounted into the container

---

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `Dockerfile` | Modified | Added `@prisma` module copy, `package.json`, `prisma.config.ts` |
| `docker-compose.yml` | Modified | Postgres healthcheck, env vars, web-proxy network, removed Caddy |
| `Caddyfile` | Modified | Use `{$DOMAIN}` variable (for local reference only) |
| `.dockerignore` | Created | Exclude dev files from Docker build context |
| `.github/workflows/deploy.yml` | Modified | Added VPS_PORT, fixed prisma command for v7 |
| `deploy.sh` | Created | Manual VPS deployment script |
| `DEPLOYMENT.md` | Created | Deployment documentation |
| `src/app/actions/commissions.ts` | Modified | BigInt to Number conversions |
| `src/app/page.tsx` | Modified | Replace `0n` BigInt literal |
| `src/lib/prisma.ts` | Modified | BigInt.toJSON type declaration |

---

## Useful Commands

### Check status
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && docker compose ps"
```

### View logs
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && docker compose logs app --tail 50"
```

### Restart app
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && docker compose restart app"
```

### Manual deploy
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && ./deploy.sh"
```

### Access database
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && docker compose exec postgres psql -U postgres -d real_estate_crm"
```

### Re-seed database
```bash
ssh tamatopik@103.189.234.117 "cd ~/real-estate-crm && docker run --rm \
  --network real-estate-crm_real-estate-crm-network \
  -e DATABASE_URL='postgresql://postgres:PASSWORD@real-estate-crm-postgres:5432/real_estate_crm' \
  -v \$(pwd)/real-estate-crm-src:/app -w /app \
  node:20-alpine sh -c 'npm install && npx prisma generate && npx prisma db seed'"
```

### Add a new app to this VPS
1. Create `~/newapp/` directory with `docker-compose.yml` and `.env`
2. Add `web-proxy` external network to the app service
3. Add new domain block to `~/caddy/Caddyfile`
4. Restart Caddy: `cd ~/caddy && docker compose restart caddy`

---

## Credentials Reference

### Login Credentials
- Admin: `admin@realestate-crm.com` / `admin123`
- Agent: `agent@realestate-crm.com` / `password123`

### GitHub Actions Secrets (devtama101/real-estate-crm)
- `VPS_HOST`: 103.189.234.117
- `VPS_USER`: tamatopik
- `VPS_PORT`: 22
- `VPS_SSH_KEY`: SSH private key (~/.ssh/id_ed25519)
