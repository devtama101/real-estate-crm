import { test, expect } from './fixtures/auth'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display admin dashboard for admin users', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
  })

  test('should display team statistics', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/Total Agents/i)).toBeVisible()
    await expect(page.getByText(/Total Leads/i).first()).toBeVisible()
    await expect(page.getByText(/Total Properties/i)).toBeVisible()
    await expect(page.getByText(/Pendapatan Bulan Ini/i)).toBeVisible()
  })

  test('should display team performance table', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Team Performance' })).toBeVisible()

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Agent' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Leads' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Closed' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Total Komisi' })).toBeVisible()
  })

  test('should display users in team table', async ({ page }) => {
    await page.goto('/admin')
    // Wait for table to render
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    const userRows = page.locator('table tbody tr')
    const count = await userRows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display role badges', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/ADMIN|AGENT/i).first()).toBeVisible()
  })

  test('should have edit and delete actions for users', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByRole('link', { name: 'Edit' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Hapus' }).first()).toBeVisible()
  })

  test('should have "+ Tambah User" button', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('link', { name: '+ Tambah User' })).toBeVisible()
  })

  test('should display recent activity section', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Aktivitas Terbaru' })).toBeVisible()
  })

  test('should display activity types', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/CALL|EMAIL_SENT|STATUS_CHANGE|NOTE|VIEWING_SCHEDULED/i).first()).toBeVisible()
  })
})

test.describe('Admin Access Control', () => {
  test('should allow admin users to access admin page', async ({ page, authHelper }) => {
    await authHelper.login('admin')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
  })

  test('should not show admin link for agent users', async ({ page, authHelper }) => {
    await authHelper.login('agent')
    await expect(page.getByRole('link', { name: /🔐 Admin/i })).not.toBeVisible()
  })

  test('should prevent agent users from viewing admin page', async ({ page, authHelper }) => {
    await authHelper.login('agent')
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 15000 })
    // Agent should not see admin dashboard content (server-side role check blocks access)
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible({ timeout: 5000 })
  })
})
