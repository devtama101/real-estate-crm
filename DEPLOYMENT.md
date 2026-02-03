# Deployment Guide

## Live Instance

**URL**: https://real-estate-crm.webartisan.id

**Stack**:
- Next.js 16 (Docker)
- PostgreSQL 16
- Caddy (auto SSL)

## Architecture

```
GitHub (push to main)
    |
GitHub Action (build & push Docker image to ghcr.io)
    |
VPS (SSH + pull image)
    |
Docker Compose runs:
    - Next.js app (port 3000)
    - PostgreSQL (port 5432)
    - Caddy reverse proxy (ports 80/443) -> auto SSL
```

## Quick Deploy (From Local)

```bash
# Push to main branch - GitHub Actions auto-deploys
git push origin main
```

## Quick Deploy (From VPS)

```bash
# SSH into VPS
ssh webartisan

# Run deploy script
cd ~/real-estate-crm && ./deploy.sh
```

## What the deploy script does:

1. Pulls latest code from GitHub
2. Builds new Docker image
3. Restarts the app container
4. Updates database schema
5. Shows container status and logs

## GitHub Actions CI/CD

The `.github/workflows/deploy.yml` workflow:
1. Triggers on push to `main`
2. Builds Docker image
3. Pushes to `ghcr.io/devtama101/real-estate-crm:latest`
4. SSHs into VPS
5. Pulls new image
6. Restarts containers
7. Runs Prisma db push

## VPS Access

### SSH Configuration

Your local `~/.ssh/config` should have:
```
Host webartisan
    HostName 103.189.234.117
    User tamatopik
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

### Quick Commands

```bash
# SSH into VPS
ssh webartisan

# View all containers
cd ~/real-estate-crm && docker compose ps

# View app logs
cd ~/real-estate-crm && docker compose logs -f app

# Restart all services
cd ~/real-estate-crm && docker compose restart

# Stop all services
cd ~/real-estate-crm && docker compose down
```

## Environment Variables (on VPS)

Located in `~/real-estate-crm/.env`:

```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/real_estate_crm
AUTH_SECRET=your-secret-key
APP_URL=https://real-estate-crm.webartisan.id
DOMAIN=real-estate-crm.webartisan.id
POSTGRES_PASSWORD=your-postgres-password
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@real-estate-crm.webartisan.id
NEXT_PUBLIC_GOOGLE_MAPS_KEY=xxx
```

## Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| app | real-estate-crm-app | 3000 | Next.js application |
| postgres | real-estate-crm-postgres | 5432 | PostgreSQL database |
| caddy | real-estate-crm-caddy | 80, 443 | Reverse proxy with auto SSL |

## Database

- **Type**: PostgreSQL 16
- **Container**: real-estate-crm-postgres
- **Database**: real_estate_crm
- **User**: postgres

### Access Database

```bash
ssh webartisan
cd ~/real-estate-crm
docker compose exec postgres psql -U postgres -d real_estate_crm
```

### Seed Database

```bash
ssh webartisan
cd ~/real-estate-crm
docker compose exec app npx prisma db seed
```

## Troubleshooting

### App not responding

```bash
ssh webartisan
cd ~/real-estate-crm
docker compose logs app --tail 50
```

### Database issues

```bash
ssh webartisan
cd ~/real-estate-crm
docker compose restart postgres
docker compose logs postgres --tail 50
```

### Redeploy previous version

```bash
ssh webartisan
cd ~/real-estate-crm
docker images | grep real-estate-crm
# Edit docker-compose.yml to use specific image tag
docker compose pull
docker compose up -d
```

## SSL/TLS

Caddy automatically handles SSL certificates via Let's Encrypt. No manual configuration needed.

## GitHub Actions Secrets

Repository: `devtama101/real-estate-crm`

| Secret | Description |
|--------|-------------|
| VPS_HOST | 103.189.234.117 |
| VPS_USER | tamatopik |
| VPS_PORT | 22 |
| VPS_SSH_KEY | Private SSH key |
| APP_URL | https://real-estate-crm.webartisan.id |
| DOMAIN | real-estate-crm.webartisan.id |
| AUTH_SECRET | NextAuth secret |
| POSTGRES_PASSWORD | PostgreSQL password |
| AUTH_GOOGLE_ID | Google OAuth client ID |
| AUTH_GOOGLE_SECRET | Google OAuth client secret |
| RESEND_API_KEY | Resend API key |
| RESEND_FROM_EMAIL | From email address |
| NEXT_PUBLIC_GOOGLE_MAPS_KEY | Google Maps API key |

## VPS Initial Setup

On the VPS, run these commands to prepare the deployment directory:

```bash
# Create project directory
mkdir -p ~/real-estate-crm

# Copy docker-compose.yml and Caddyfile to VPS
# (or clone the repo for deploy.sh usage)

# Create .env file with all required variables
nano ~/real-estate-crm/.env

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u devtama101 --password-stdin

# Start all services
cd ~/real-estate-crm
docker compose up -d

# Push database schema
docker compose exec app npx prisma db push

# Seed database with initial data
docker compose exec app npx prisma db seed
```

## File Checklist

- [x] `Dockerfile`
- [x] `docker-compose.yml`
- [x] `.dockerignore`
- [x] `.github/workflows/deploy.yml`
- [x] `deploy.sh`
- [x] `Caddyfile`
- [x] `next.config.ts` (standalone output)
- [x] `prisma/schema.prisma` (PostgreSQL)
