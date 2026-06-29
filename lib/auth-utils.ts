import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.app_metadata?.role as string | null
}

export function isAuthorized(userRole: string | null | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
