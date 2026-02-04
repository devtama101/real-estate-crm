import { test, expect } from './fixtures/auth'

test.describe('Properties Management', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display properties listing page', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByRole('heading', { name: 'Properti' })).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/properties')
    const searchInput = page.getByPlaceholder('Cari properti...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Rumah')
  })

  test('should have status filter', async ({ page }) => {
    await page.goto('/properties')
    const statusFilter = page.getByRole('combobox').first()
    await expect(statusFilter).toBeVisible()
  })

  test('should have property type filter', async ({ page }) => {
    await page.goto('/properties')
    const typeFilter = page.locator('select').nth(1)
    await expect(typeFilter).toBeVisible()
  })

  test('should have grid view toggle', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByRole('button', { name: '⊞' })).toBeVisible()
    await expect(page.getByRole('button', { name: '☰' })).toBeVisible()
  })

  test('should display property cards with prices', async ({ page }) => {
    await page.goto('/properties')
    // Wait for property cards to load
    await page.waitForSelector('.property-card', { timeout: 15000 })
    // Check for property cards with Rp price format
    await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
  })

  test('should display property details like bedrooms, bathrooms, size', async ({ page }) => {
    await page.goto('/properties')
    // Wait for property cards to load
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await expect(page.getByText(/KT/).first()).toBeVisible()
    await expect(page.getByText(/KM/).first()).toBeVisible()
    await expect(page.getByText(/m²/).first()).toBeVisible()
  })

  test('should navigate to property detail page', async ({ page }) => {
    await page.goto('/properties')
    // Wait for property cards to load
    await page.waitForSelector('.property-card', { timeout: 15000 })
    // Click first property card
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
  })

  test('should display property detail with complete information', async ({ page }) => {
    await page.goto('/properties')
    // Navigate to first property dynamically
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    // Wait for detail to load
    await page.waitForSelector('h1', { timeout: 15000 })
    // Check price and specs
    await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
    await expect(page.getByText(/Kamar Tidur/i)).toBeVisible()
    await expect(page.getByText(/Kamar Mandi/i)).toBeVisible()
  })

  test('should have status dropdown in property detail', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    const statusDropdown = page.getByRole('combobox')
    await expect(statusDropdown).toBeVisible()
  })

  test('should display property amenities', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    await expect(page.getByText(/Fasilitas/i)).toBeVisible()
  })

  test('should display location information', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    await expect(page.getByRole('heading', { name: 'Lokasi' })).toBeVisible()
  })

  test('should have listing information', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    await expect(page.getByText(/Informasi Listing/i)).toBeVisible()
    await expect(page.getByText(/ID Listing/i)).toBeVisible()
  })

  test('should have quick action buttons', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    await expect(page.getByRole('button', { name: /📧 Bagikan via Email/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /🔗 Copy Link Properti/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /📄 Cetak Brosur/i }).first()).toBeVisible()
  })

  test('should navigate back to properties list', async ({ page }) => {
    await page.goto('/properties')
    await page.waitForSelector('.property-card', { timeout: 15000 })
    await page.locator('.property-card').first().click()
    await expect(page).toHaveURL(/\/properties\/.+/)
    await page.getByRole('link', { name: '← Kembali' }).click()
    await expect(page).toHaveURL('/properties')
  })

  test('should have "+ Tambah Properti" button', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByRole('button', { name: '+ Tambah Properti' })).toBeVisible()
  })
})
