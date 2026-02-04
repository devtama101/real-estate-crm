import { test as base, Page } from '@playwright/test'

export const testCredentials = {
  admin: {
    email: 'admin@realestate-crm.com',
    password: 'admin123',
    name: 'Admin User',
  },
  agent: {
    email: 'agent@realestate-crm.com',
    password: 'password123',
    name: 'Andi Pratama',
  },
} as const

type TestCredentials = typeof testCredentials

/**
 * Extended test fixture with authenticated state
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async login(role: keyof TestCredentials = 'admin') {
    const credentials = testCredentials[role]
    await this.page.goto('/login')
    await this.page.getByRole('textbox', { name: /nama@email\.com/i }).fill(credentials.email)
    await this.page.getByRole('textbox', { name: /••••••••/i }).fill(credentials.password)
    await this.page.getByRole('button', { name: 'Masuk' }).click()
    // All users are redirected to /dashboard by middleware
    await this.page.waitForURL('/dashboard', { timeout: 30000 })
  }

  async logout() {
    await this.page.goto('/api/auth/signout')
    await this.page.getByRole('button', { name: 'Sign out' }).click()
  }

  async verifyLoggedIn(expectedName: string) {
    await this.page.waitForSelector(`text=/Selamat Datang, ${expectedName}/i`)
  }
}

export const test = base.extend<{
  authHelper: AuthHelper
}>({
  authHelper: async ({ page }, use) => {
    const authHelper = new AuthHelper(page)
    await use(authHelper)
  },
})

export { expect } from '@playwright/test'
