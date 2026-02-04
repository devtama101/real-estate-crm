# Real Estate CRM - Project Summary

Complete summary of project setup, deployment, bug fixes, and testing.

## Project Overview

Indonesian Real Estate CRM built with:
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma 7
- **Auth**: NextAuth v5 (Credentials + JWT)
- **UI**: Shadcn/ui + Tailwind CSS v4
- **Testing**: Playwright E2E (98 tests, all passing)

## Deployment

### VPS Setup
- **Location**: CommitQuest VPS (see `projects/commitquest/vps-credentials.md`)
- **Proxy**: Shared Caddy reverse proxy
- **Deployment**: GitHub Actions → Docker → VPS

### Deployment Files
| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for production Next.js app |
| `docker-compose.yml` | Container orchestration with Caddy |
| `Caddyfile` | Reverse proxy with HTTPS |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `.env.production.template` | Production environment variables template |

### Build Commands
```bash
npm run build            # Production build
docker-compose up -d     # Start containers
```

## Bug Fixes Applied

### 1. BigInt Serialization
**Issue**: Prisma BigInt fields caused RSC serialization errors in server actions
**Fix**: Convert BigInt to Number in all server action returns
```typescript
// Before: return { total: BigInt(123) }
// After:  return { total: Number(bigIntValue) }
```
**Files**: All actions in `src/app/actions/`

### 2. User Menu Skeleton
**Issue**: `/api/user/me` used internal HTTP fetch broken by missing `NEXTAUTH_URL`
**Fix**: Use `auth()` directly instead of internal fetch
**Files**: `src/app/api/user/me/route.ts`

### 3. Hardcoded User IDs
**Issue**: Activity creation used `'system'` as `createdById` causing FK constraint errors
**Fix**: Use `session.user.id` from `auth()`
**Files**: All server actions that create activities

### 4. Admin Page Access Control
**Issue**: Server Component `redirect()` in Next.js 16 produces blank page for non-admin users
**Status**: Security met (content blocked), UX could be improved
**Note**: Middleware-level role check has edge runtime compatibility issues with NextAuth v5

## E2E Testing

### Test Coverage: 98/98 Passing

| Module | Tests | File |
|--------|-------|------|
| Auth | 8 | `tests/auth.spec.ts` |
| Dashboard | 7 | `tests/dashboard.spec.ts` |
| Leads | 13 | `tests/leads.spec.ts` |
| Properties | 15 | `tests/properties.spec.ts` |
| Pipeline | 10 | `tests/pipeline.spec.ts` |
| Calendar | 9 | `tests/calendar.spec.ts` |
| Commissions | 11 | `tests/commissions.spec.ts` |
| Documents | 12 | `tests/documents.spec.ts` |
| Admin | 12 | `tests/admin.spec.ts` |

### Running Tests
```bash
npm run test             # Headless mode
npm run test:headed      # Visible browser
npm run test:ui          # Interactive UI mode
npm run test:debug       # Debug mode
npm run test:report      # View HTML report
```

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@realestate-crm.com` | `admin123` |
| Agent | `agent@realestate-crm.com` | `password123` |

### Test Configuration
- **Framework**: Playwright (Chromium)
- **Workers**: 2 (reduced from auto to prevent dev server overload)
- **Timeouts**: 30s login, 15s data loading waits
- **Fixture**: `tests/fixtures/auth.ts` - reusable auth helpers

## Common Test Patterns

### Waiting for Async Data
```typescript
await page.waitForSelector('table tbody tr', { timeout: 15000 })
```

### Strict Mode Violations
When sidebar + page headings share text, use `.first()` or `exact: true`:
```typescript
await expect(page.getByRole('heading', { name: 'Komisi', exact: true })).toBeVisible()
await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
```

### Currency Format Matching
Indonesian Rupiah may use non-breaking space:
```typescript
await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
```

## Environment Variables

Required for production deployment:
```bash
DATABASE_URL=              # PostgreSQL connection string
AUTH_SECRET=               # Generate with: openssl rand -base64 32
RESEND_API_KEY=            # Transactional emails
NEXT_PUBLIC_GOOGLE_MAPS_KEY=  # Map features
AUTH_GOOGLE_ID=            # Google OAuth (optional)
AUTH_GOOGLE_SECRET=        # Google OAuth secret (optional)
```

## Database Schema Key Models

- `User` - Admin/Agent users with NextAuth relations
- `Lead` - Customer leads with status workflow (NEW → CLOSED/LOST)
- `Property` - Listings with pricing, location, Google Maps Place ID
- `Appointment` - Calendar events with Google Calendar sync
- `Commission` - Agent commissions on closed deals
- `Document` - Files with e-signature status (DocuSign)
- `Activity` - Activity log for tracking lead changes
- `EmailTemplate` - Personalized email templates
- `EmailLog` - Email delivery tracking via Resend

## Git Commits

### Recent Work
1. `d6c1dd2` - Add comprehensive Playwright E2E test suite (98 tests, all passing)
2. `12f3450` - Add TESTING.md with E2E test suite documentation
3. `deb88dd` - first commit (initial setup)

## Known Issues

1. **Admin Redirect UX**: Server Component `redirect('/dashboard')` in Next.js 16 produces blank page for non-admin users instead of HTTP redirect. Security requirement is met (content blocked) but UX could be improved with middleware-level role checks once NextAuth v5 edge runtime compatibility is resolved.

## External Integrations

- **Google Calendar** - OAuth-based sync via `src/lib/api/google-calendar.ts`
- **Google Maps** - Property location display via `src/lib/api/google-maps.ts`
- **Resend** - Transactional emails via `src/lib/api/resend.ts`
- **Mock MLS** - Simulated MLS data import in `src/lib/api/mock-mls.ts`

## Localization

App designed for Indonesian market:
- Cities/provinces: `INDONESIAN_CITIES`, `INDONESIAN_PROVINCES`
- Lead status labels in Indonesian (Baru, Dihubungi, Survei, etc.)
- Currency: Indonesian Rupiah (IDR) via `formatIDR()`
- Phone format: +62 Indonesian format

---
*Last updated: 2025-02-04*
