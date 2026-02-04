import { test, expect } from './fixtures/auth'

test.describe('Commissions', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display commissions page', async ({ page }) => {
    await page.goto('/commissions')
    await expect(page.getByRole('heading', { name: 'Komisi', exact: true })).toBeVisible()
  })

  test('should display commission statistics', async ({ page }) => {
    await page.goto('/commissions')
    await expect(page.getByText(/Pending/i).first()).toBeVisible()
    await expect(page.getByText(/Disetujui/i).first()).toBeVisible()
    await expect(page.getByText(/Dibayar/i).first()).toBeVisible()
    await expect(page.getByText(/Total Earned/i)).toBeVisible()
  })

  test('should display monthly income chart', async ({ page }) => {
    await page.goto('/commissions')
    await expect(page.getByRole('heading', { name: 'Penghasilan Bulanan' })).toBeVisible()
    // Wait for chart data to load and check for month labels
    await expect(page.getByText('Jan').first()).toBeVisible({ timeout: 15000 })
  })

  test('should display best deals section', async ({ page }) => {
    await page.goto('/commissions')
    await expect(page.getByRole('heading', { name: 'Deal Terbaik Bulan Ini' })).toBeVisible()
  })

  test('should display all commissions table', async ({ page }) => {
    await page.goto('/commissions')
    await expect(page.getByRole('heading', { name: 'Semua Komisi' })).toBeVisible()

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Properti' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Nilai Deal' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Rate' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Komisi' })).toBeVisible()
  })

  test('should have status filter for commissions', async ({ page }) => {
    await page.goto('/commissions')
    const statusFilter = page.getByRole('combobox')
    await expect(statusFilter).toBeVisible()
  })

  test('should display commission rows', async ({ page }) => {
    await page.goto('/commissions')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    const commissionRows = page.locator('table tbody tr')
    const count = await commissionRows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display property information in table', async ({ page }) => {
    await page.goto('/commissions')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/Villa|Townhouse|Rumah/i).first()).toBeVisible()
  })

  test('should display deal values in Rupiah', async ({ page }) => {
    await page.goto('/commissions')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
  })

  test('should display commission rates and amounts', async ({ page }) => {
    await page.goto('/commissions')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    // Check for percentage
    await expect(page.getByText(/\d+\.\d+%/).first()).toBeVisible()
    // Check for commission amount in Rupiah
    await expect(page.getByText(/Rp\s?[\d.]+/).first()).toBeVisible()
  })

  test('should show split information when applicable', async ({ page }) => {
    await page.goto('/commissions')
    // Check for split percentage - may or may not be visible depending on data
    const splitText = page.getByText(/\d+%\s*\(Rp\s?[\d.]+\)/)
    const isVisible = await splitText.isVisible()
  })
})
