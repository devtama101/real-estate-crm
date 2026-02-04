import { test, expect } from './fixtures/auth'

test.describe('Pipeline Board', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display pipeline board', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible()
  })

  test('should display all pipeline columns', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline to load
    await page.waitForSelector('.pipeline-container', { timeout: 15000 })
    await expect(page.getByText('Baru').first()).toBeVisible()
    await expect(page.getByText('Dihubungi').first()).toBeVisible()
    await expect(page.getByText('Survei').first()).toBeVisible()
    await expect(page.getByText('Negosiasi').first()).toBeVisible()
    await expect(page.getByText('Closing').first()).toBeVisible()
  })

  test('should display lead counts in each column', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline to load
    await page.waitForSelector('.pipeline-container', { timeout: 15000 })
    // Check that pipeline count badges exist
    await expect(page.locator('.pipeline-count').first()).toBeVisible()
  })

  test('should display lead cards in columns', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline cards to load
    await page.waitForSelector('.pipeline-card', { timeout: 15000 })
    // Should have lead cards with names
    await expect(page.getByText(/Budi Santoso|Andi Pratama|Doni Kusuma|Siti Rahayu|Agus Wijaya|Maya Sari|Rina Wati|Dewi Lestari/i).first()).toBeVisible()
  })

  test('should display lead information on cards', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline cards to load
    await page.waitForSelector('.pipeline-card', { timeout: 15000 })
    // Check for lead card content (property type)
    await expect(page.getByText(/Rumah|Apartemen|Villa|Townhouse|Ruko|Studio/i).first()).toBeVisible()
    // Check for budget display
    await expect(page.getByText(/Rp \d+ - \d+/i).first()).toBeVisible()
  })

  test('should have action buttons on lead cards', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline cards to load
    await page.waitForSelector('.pipeline-card', { timeout: 15000 })
    // Check for view and email buttons using title attribute
    await expect(page.locator('button[title="Lihat Detail"]').first()).toBeVisible()
    await expect(page.locator('button[title="Kirim Email"]').first()).toBeVisible()
  })

  test('should navigate to lead detail when clicking view button', async ({ page }) => {
    await page.goto('/pipeline')
    // Wait for pipeline cards to load
    await page.waitForSelector('.pipeline-card', { timeout: 15000 })
    // Click first view button to navigate to lead detail
    await page.locator('button[title="Lihat Detail"]').first().click()
    await expect(page).toHaveURL(/\/leads\/.+/)
  })

  test('should have "+ Tambah Lead" button', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.getByRole('button', { name: '+ Tambah Lead' })).toBeVisible()
  })

  test('should display archive section for lost leads', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.getByText(/Lead Batal/i)).toBeVisible()
  })

  test('should have "+ Tambah ke [stage]" buttons in each column', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForSelector('.pipeline-container', { timeout: 15000 })
    await expect(page.getByRole('button', { name: /\+ Tambah ke/ }).first()).toBeVisible()
  })
})
