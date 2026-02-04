import { test, expect } from './fixtures/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display dashboard with statistics', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Check statistics cards
    await expect(page.getByText(/Total Properti/i)).toBeVisible()
    await expect(page.getByText(/Total Leads/i)).toBeVisible()
    await expect(page.getByText('Janji Temu', { exact: true })).toBeVisible()
    await expect(page.getByText(/Komisi Pending/i).first()).toBeVisible()
  })

  test('should display upcoming appointments section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Janji Temu Mendatang/i })).toBeVisible()
  })

  test('should display pending commissions section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Komisi Pending/i })).toBeVisible()
  })

  test('should display recent leads table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Lead Terbaru/i })).toBeVisible()

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Kontak' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Minat' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Budget' })).toBeVisible()
  })

  test('should display featured properties', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Properti Terbaru/i })).toBeVisible()

    // Check for property cards with prices (Rp format: Rp123.456.789)
    await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
  })

  test('should navigate to leads page when clicking "+ Tambah Lead" button', async ({ page }) => {
    await page.getByRole('link', { name: '+ Tambah Lead' }).click()
    await expect(page).toHaveURL('/leads/new')
  })

  test('should navigate to properties page when clicking "+ Properti Baru" button', async ({ page }) => {
    await page.getByRole('link', { name: '+ Properti Baru' }).click()
    await expect(page).toHaveURL('/properties/new')
  })
})
