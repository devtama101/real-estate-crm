import { test, expect } from './fixtures/auth'

test.describe('Leads Management', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display leads listing page', async ({ page }) => {
    await page.goto('/leads')
    await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible()
  })

  test('should display leads statistics', async ({ page }) => {
    await page.goto('/leads')
    await expect(page.getByText(/Total Leads/i)).toBeVisible()
    await expect(page.getByText(/Leads Baru/i)).toBeVisible()
    await expect(page.getByText(/Aktif/i)).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/leads')
    const searchInput = page.getByPlaceholder('Cari leads...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Test')
  })

  test('should have status filter', async ({ page }) => {
    await page.goto('/leads')
    const statusFilter = page.getByRole('combobox').first()
    await expect(statusFilter).toBeVisible()
  })

  test('should have source filter', async ({ page }) => {
    await page.goto('/leads')
    const filters = page.getByRole('combobox').all()
    const sourceFilter = (await filters)[1]
    await expect(sourceFilter).toBeVisible()
  })

  test('should display leads table with proper columns', async ({ page }) => {
    await page.goto('/leads')
    // Wait for data to load
    await page.waitForSelector('table', { timeout: 15000 })
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Kontak' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Budget' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('should display lead rows', async ({ page }) => {
    await page.goto('/leads')
    // Wait for loading to complete and data to appear
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    const leadRows = page.locator('table tbody tr')
    const count = await leadRows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to lead detail page', async ({ page }) => {
    await page.goto('/leads')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    // Click first "Lihat" link
    await page.getByRole('link', { name: 'Lihat' }).first().click()
    await expect(page).toHaveURL(/\/leads\/.+/)
  })

  test('should display lead detail with information', async ({ page }) => {
    await page.goto('/leads/lead-001')
    // Wait for lead data to load
    await page.waitForSelector('h1', { timeout: 15000 })
    await expect(page.getByText(/Informasi Lead/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Riwayat Aktivitas/i })).toBeVisible()
  })

  test('should have status dropdown in detail page', async ({ page }) => {
    await page.goto('/leads/lead-001')
    const statusDropdown = page.getByRole('combobox')
    await expect(statusDropdown).toBeVisible()
  })

  test('should have quick activity log buttons', async ({ page }) => {
    await page.goto('/leads/lead-001')
    // Wait for lead data to load
    await page.waitForSelector('h1', { timeout: 15000 })
    await expect(page.getByRole('button', { name: /📞 Telepon/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /📧 Email/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /🤝 Meeting/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /📝 Catatan/i })).toBeVisible()
  })

  test('should navigate back to leads list', async ({ page }) => {
    await page.goto('/leads/lead-001')
    await page.getByRole('link', { name: '← Kembali' }).click()
    await expect(page).toHaveURL('/leads')
  })

  test('should have "+ Tambah Lead" button', async ({ page }) => {
    await page.goto('/leads')
    await expect(page.getByRole('button', { name: '+ Tambah Lead' })).toBeVisible()
  })
})
