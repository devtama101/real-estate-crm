import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to user management settings
  redirect('/settings/users')
}
