# E2E Testing Summary

## Test Suite: 98/98 Passing

Comprehensive Playwright end-to-end test suite covering all features of the Real Estate CRM.

Run: `npm run test`

## Test Coverage by Module

| Module | File | Tests | Description |
|--------|------|-------|-------------|
| Auth | `tests/auth.spec.ts` | 8 | Login, logout, role-based UI, route protection |
| Dashboard | `tests/dashboard.spec.ts` | 7 | Stats cards, recent leads, featured properties, navigation |
| Leads | `tests/leads.spec.ts` | 13 | Listing, search, filters, detail page, activity buttons |
| Properties | `tests/properties.spec.ts` | 15 | Listing, search, filters, detail page, amenities, actions |
| Pipeline | `tests/pipeline.spec.ts` | 10 | Kanban columns, lead cards, drag targets, navigation |
| Calendar | `tests/calendar.spec.ts` | 9 | Month view, day headers, appointments, month navigation |
| Commissions | `tests/commissions.spec.ts` | 11 | Stats, monthly chart, table, rates, split info |
| Documents | `tests/documents.spec.ts` | 12 | Table, filters, e-signature status, file sizes |
| Admin | `tests/admin.spec.ts` | 12 | Team stats, performance table, activity log, access control |
| **Total** | | **98** | |

## Test Infrastructure

- **Framework**: Playwright (Chromium)
- **Auth Fixture**: `tests/fixtures/auth.ts` — reusable login/logout helpers
- **Workers**: 2 (reduced from auto to prevent dev server overload)
- **Timeouts**: 30s login, 15s data loading waits
- **Dev Server**: Auto-started via `npm run dev` (configured in `playwright.config.ts`)

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@realestate-crm.com` | `admin123` |
| Agent | `agent@realestate-crm.com` | `password123` |

## Running Tests

```bash
npm run test             # Run all tests (headless)
npm run test:headed      # Run with visible browser
npm run test:ui          # Interactive UI mode
npm run test:debug       # Debug mode
npm run test:report      # View HTML report after run
```

## Common Patterns Used

### Waiting for async data
Client components fetch data via server actions. Tests use `waitForSelector` before asserting on dynamic content:
```typescript
await page.waitForSelector('table tbody tr', { timeout: 15000 })
```

### Avoiding strict mode violations
When a selector matches multiple elements (e.g., sidebar + page heading both contain "Komisi"), use `.first()` or `exact: true`:
```typescript
await expect(page.getByRole('heading', { name: 'Komisi', exact: true })).toBeVisible()
await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
```

### Dynamic navigation for detail pages
Instead of hardcoded IDs, navigate from listing to detail dynamically:
```typescript
await page.goto('/properties')
await page.waitForSelector('.property-card', { timeout: 15000 })
await page.locator('.property-card').first().click()
await expect(page).toHaveURL(/\/properties\/.+/)
```

### Currency format matching
Indonesian Rupiah formatting (`Intl.NumberFormat('id-ID')`) may use non-breaking space:
```typescript
// Flexible regex that handles both regular and non-breaking space
await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
```

## Issues Found During Testing

1. **BigInt serialization** — Server actions returning Prisma BigInt fields to client components caused RSC serialization errors. Fixed by converting with `Number()` in all return paths.
2. **User menu skeleton** — `/api/user/me` route used internal HTTP fetch that broke when `NEXTAUTH_URL` wasn't set. Fixed by using `auth()` directly.
3. **Hardcoded user IDs** — Activity creation used `'system'` as `createdById` causing FK constraint errors. Fixed by using `session.user.id` from `auth()`.
4. **Admin page access control** — Server Component `redirect()` in Next.js 16 produces a blank page instead of an HTTP redirect for non-admin users. Security requirement is met (content blocked), but UX could be improved with middleware-level role checks.
