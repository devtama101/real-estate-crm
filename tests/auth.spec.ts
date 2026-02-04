import { test, expect } from './fixtures/auth'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page with demo credentials', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Real Estate CRM' })).toBeVisible()
    await expect(page.getByText('Akun demo:')).toBeVisible()
    await expect(page.getByText('agent@realestate-crm.com')).toBeVisible()
    await expect(page.getByText('password123')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByRole('textbox', { name: /nama@email\.com/i }).fill('invalid@test.com')
    await page.getByRole('textbox', { name: /••••••••/i }).fill('wrongpass')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page.getByText('Email atau password salah')).toBeVisible()
  })

  test('should login successfully with admin credentials', async ({ page, authHelper }) => {
    await authHelper.login('admin')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/Selamat datang kembali, Admin User/i)).toBeVisible()
  })

  test('should login successfully with agent credentials', async ({ page, authHelper }) => {
    await authHelper.login('agent')
    await expect(page).toHaveURL('/dashboard')
    // Verify user is logged in by checking we're not on login page
    await expect(page).not.toHaveURL('/login')
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login or show unauthorized
    await expect(page.getByRole('heading', { name: /Real Estate CRM/i })).toBeVisible()
  })

  test('should logout successfully', async ({ page, authHelper }) => {
    await authHelper.login('admin')
    await authHelper.logout()
    // After logout, should be at login page
    await expect(page).toHaveURL(/\/login|\/$/)
  })

  test('should show admin link for admin users', async ({ page, authHelper }) => {
    await authHelper.login('admin')
    await expect(page.getByRole('link', { name: /🔐 Admin/i })).toBeVisible()
  })

  test('should not show admin link for agent users', async ({ page, authHelper }) => {
    await authHelper.login('agent')
    await expect(page.getByRole('link', { name: /🔐 Admin/i })).not.toBeVisible()
  })
})
