import { test, expect } from './fixtures/auth'

test.describe('Calendar & Appointments', () => {
  test.beforeEach(async ({ authHelper }) => {
    await authHelper.login('admin')
  })

  test('should display calendar page', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Kalender' })).toBeVisible()
  })

  test('should display current month and year', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: /\w+ \d{4}/i })).toBeVisible()
  })

  test('should have navigation buttons for previous and next month', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('button', { name: '← Sebelumnya' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selanjutnya →' })).toBeVisible()
  })

  test('should display days of week', async ({ page }) => {
    await page.goto('/calendar')
    // Day names match multiple elements, use .first()
    await expect(page.getByText(/Min|Sen|Sel|Rab|Kam|Jum|Sab/i).first()).toBeVisible()
  })

  test('should display calendar days', async ({ page }) => {
    await page.goto('/calendar')
    // Check for numbered days
    await expect(page.locator('text=/^\\d+$/').first()).toBeVisible()
  })

  test('should display appointments on calendar', async ({ page }) => {
    await page.goto('/calendar')
    // Check for appointment indicators
    await expect(page.getByText(/Survei|Konsultasi|Follow Up|Tanda Tangan/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('should have "+ Janji Temu Baru" button', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('button', { name: '+ Janji Temu Baru' })).toBeVisible()
  })

  test('should be able to navigate to next month', async ({ page }) => {
    await page.goto('/calendar')
    const currentMonth = await page.getByRole('heading', { name: /\w+ \d{4}/i }).textContent()

    await page.getByRole('button', { name: 'Selanjutnya →' }).click()

    const newMonth = await page.getByRole('heading', { name: /\w+ \d{4}/i }).textContent()
    expect(newMonth).not.toBe(currentMonth)
  })

  test('should be able to navigate to previous month', async ({ page }) => {
    await page.goto('/calendar')
    const currentMonth = await page.getByRole('heading', { name: /\w+ \d{4}/i }).textContent()

    await page.getByRole('button', { name: '← Sebelumnya' }).click()

    const newMonth = await page.getByRole('heading', { name: /\w+ \d{4}/i }).textContent()
    expect(newMonth).not.toBe(currentMonth)
  })
})
