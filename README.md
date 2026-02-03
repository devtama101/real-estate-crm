# Real Estate CRM Indonesia

A comprehensive Customer Relationship Management system for Indonesian real estate professionals. Built with Next.js 15, Prisma, PostgreSQL, and NextAuth v5.

## Features

- **Lead Management**: Track leads through pipeline (Baru → Dihubungi → Survei → Negosiasi → Closing)
- **Property Listings**: Manage property inventory with photos, amenities, and pricing
- **Pipeline Board**: Kanban-style visual lead tracking
- **Calendar & Appointments**: Schedule viewings with Google Calendar sync
- **Commission Tracking**: Monitor agent earnings and deal closures
- **Document Management**: Track contracts with e-signature status
- **Email Communication**: Transactional emails via Resend
- **Team Management**: Admin dashboard for user and performance management
- **Role-Based Access**: ADMIN and AGENT roles with appropriate permissions

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other secrets

# Set up database
npm run db:push    # Push schema to database
npm run db:seed    # Seed with sample data

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@realestate-crm.com | admin123 |
| Agent | agent@realestate-crm.com | password123 |

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
npm run test:ui          # Run tests with UI mode
npm run test:headed      # Run tests in headed mode
npm run test:report      # View HTML test report

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate with: openssl rand -base64 32"

# Optional (for integrations)
RESEND_API_KEY="re_..."                    # Transactional emails
NEXT_PUBLIC_GOOGLE_MAPS_KEY="..."         # Map features
AUTH_GOOGLE_ID="..."                      # Google OAuth
AUTH_GOOGLE_SECRET="..."
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (Credentials provider)
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **Testing**: Playwright

## Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions for DB operations
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Admin dashboard
│   ├── leads/            # Lead management
│   ├── properties/       # Property listings
│   ├── pipeline/         # Kanban board
│   ├── calendar/         # Appointment scheduling
│   ├── commissions/      # Commission tracking
│   ├── documents/        # Document management
│   ├── communication/    # Email templates
│   ├── admin/            # Admin panel
│   └── settings/         # User settings
├── components/
│   ├── ui/               # Shadcn/ui components
│   └── ...               # Other components
└── lib/
    ├── auth.ts           # NextAuth config
    ├── prisma.ts         # Prisma client
    ├── constants.ts      # Indonesian locales
    └── api/              # External integrations

tests/                    # Playwright test suite
prisma/
    └── schema.prisma     # Database schema
```

## Localization

Designed for Indonesian market with:
- Indonesian language UI
- Indonesian cities and provinces
- Rupiah (IDR) currency formatting
- Local phone number format (+62)

## License

MIT
