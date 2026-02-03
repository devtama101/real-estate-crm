# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real Estate CRM for Indonesian market, built with Next.js 15+ (App Router), Prisma, PostgreSQL, and NextAuth v5. The app manages leads, properties, appointments, commissions, documents, and includes Google Calendar integration and email communication via Resend.

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:seed          # Seed database with sample data

# Testing
npm run test             # Run Playwright tests
npm run test:ui          # Run tests with interactive UI
npm run test:headed      # Run tests in visible browser mode
npm run test:debug       # Run tests in debug mode
npm run test:report      # View HTML test report

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `RESEND_API_KEY` - For transactional emails
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` - For map features
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - For Google OAuth (Calendar sync)

## Architecture

### App Router Structure (`src/app/`)
- `actions/` - Server actions for database operations (leads, properties, appointments, commissions, documents, activities)
- `api/` - API routes for auth and user operations
- `auth/` - Authentication pages
- `dashboard/` - Admin dashboard
- `leads/` - Lead management (listing, detail, new)
- `properties/` - Property listings (listing, detail, new)
- `pipeline/` - Kanban-style pipeline board
- `calendar/` - Appointment calendar
- `commissions/` - Commission tracking
- `documents/` - Document management with e-signature status
- `communication/` - Email template management
- `admin/` - Admin-only routes
- `settings/` - Settings pages (users, profile)
- `profile/` - User profile page

### Key Directories
- `src/lib/auth.ts` - NextAuth v5 configuration with Credentials provider
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/constants.ts` - Indonesian-specific constants (cities, provinces, lead statuses with Indonesian labels, currency formatter)
- `src/lib/api/` - External service integrations (Google Calendar, Google Maps, Resend email, mock MLS)
- `src/components/ui/` - Shadcn/ui components (Radix UI + Tailwind)
- `prisma/schema.prisma` - Complete database schema

### Authentication & Authorization
- NextAuth v5 with JWT strategy
- Two roles: `ADMIN` and `AGENT`
- `src/middleware.ts` - Protects routes and redirects unauthenticated users
- Admin role checks done at page level (not middleware)
- Session available via `auth()` from `@/lib/auth`

### Database Patterns
- Server actions in `src/app/actions/` use `'use server'` directive
- Prisma queries include relations where needed
- Role-based filtering: agents see only their leads, admins see all
- Activity logging via `Activity` model for tracking lead changes

### UI Patterns
- Shadcn/ui components with Tailwind CSS v4
- Indonesian language labels throughout (`constants.ts`)
- Currency: `formatIDR()` from `@/lib/constants`
- Phone formatting for Indonesian format (+62)

## Key Schema Models

- `User` - Admin/Agent users with NextAuth Account/Session relations
- `Lead` - Customer leads with status workflow (NEW → CONTACTED → VIEWING → NEGOTIATION → CLOSED/LOST)
- `Property` - Listings with type, status, pricing, location (includes Google Maps Place ID)
- `Appointment` - Calendar events with Google Calendar sync (`googleEventId`)
- `Commission` - Agent commissions on closed deals
- `Document` - Files with e-signature status tracking (DocuSign integration)
- `Activity` - Activity log for leads
- `EmailTemplate` - Email templates with variables for personalization
- `EmailLog` - Email delivery tracking via Resend

## External Integrations

- **Google Calendar** - OAuth-based sync via `src/lib/api/google-calendar.ts`
- **Google Maps** - Property location display via `src/lib/api/google-maps.ts`
- **Resend** - Transactional emails via `src/lib/api/resend.ts`
- **Mock MLS** - Simulated MLS data import in `src/lib/api/mock-mls.ts`

## TypeScript Configuration

- Path alias: `@/*` maps to `src/*`
- Next-auth types extended in `src/types/next-auth.d.ts` (adds `id` and `role` to Session)

## Localization

The app is designed for Indonesian market:
- Cities/provinces in `INDONESIAN_CITIES` and `INDONESIAN_PROVINCES`
- Lead status labels in Indonesian (Baru, Dihubungi, Survei, etc.)
- Currency formatting: Indonesian Rupiah (IDR)
- Sample data uses Indonesian names and addresses

## Testing

The project uses Playwright for end-to-end testing:

### Test Structure
- `tests/fixtures/auth.ts` - Auth helper fixture with login/logout methods
- `tests/auth.spec.ts` - Authentication flow tests
- `tests/dashboard.spec.ts` - Dashboard features tests
- `tests/leads.spec.ts` - Lead management tests
- `tests/properties.spec.ts` - Property listing tests
- `tests/pipeline.spec.ts` - Pipeline kanban tests
- `tests/calendar.spec.ts` - Calendar/appointment tests
- `tests/commissions.spec.ts` - Commission tracking tests
- `tests/documents.spec.ts` - Document management tests
- `tests/admin.spec.ts` - Admin dashboard tests

### Test Credentials
- Admin: `admin@realestate-crm.com` / `admin123`
- Agent: `agent@realestate-crm.com` / `password123`

### Configuration
- `playwright.config.ts` - Playwright configuration with automatic dev server startup
- Tests run against `http://localhost:3000`
- HTML reporter generates reports in `playwright-report/`
