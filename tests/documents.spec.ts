import { test, expect } from './fixtures/auth'

test.describe('Documents', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display documents page', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: 'Dokumen' })).toBeVisible()
  })

  test('should display document statistics', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByText(/Total Dokumen/i)).toBeVisible()
    await expect(page.getByText(/Terdetikasi/i)).toBeVisible()
    await expect(page.getByText(/Menunggu Tanda Tangan/i)).toBeVisible()
    await expect(page.getByText(/Permintaan E-Signature/i)).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/documents')
    const searchInput = page.getByPlaceholder('Cari dokumen...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Perjanjian')
  })

  test('should have document type filter', async ({ page }) => {
    await page.goto('/documents')
    const typeFilter = page.getByRole('combobox').first()
    await expect(typeFilter).toBeVisible()
  })

  test('should have status filter', async ({ page }) => {
    await page.goto('/documents')
    const statusFilter = page.locator('select').nth(1)
    await expect(statusFilter).toBeVisible()
  })

  test('should display documents table', async ({ page }) => {
    await page.goto('/documents')
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 15000 })
    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Dokumen' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Tipe' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Terkait Dengan' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('should display document rows', async ({ page }) => {
    await page.goto('/documents')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    const docRows = page.locator('table tbody tr')
    const count = await docRows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display document types', async ({ page }) => {
    await page.goto('/documents')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/CONTRACT|OFFER LETTER|INSPECTION REPORT/i).first()).toBeVisible()
  })

  test('should display e-signature status', async ({ page }) => {
    await page.goto('/documents')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/DocuSign/i).first()).toBeVisible()
  })

  test('should display file sizes', async ({ page }) => {
    await page.goto('/documents')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    await expect(page.getByText(/\d+\.\d+ KB/).first()).toBeVisible()
  })

  test('should have "+ Upload Dokumen" button', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('button', { name: '+ Upload Dokumen' })).toBeVisible()
  })

  test('should display document icons', async ({ page }) => {
    await page.goto('/documents')
    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 })
    // Check that table rows have content (document icons are emoji in cells)
    await expect(page.locator('table tbody tr td').first()).toBeVisible()
  })
})
