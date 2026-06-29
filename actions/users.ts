'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getAllUsersAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .order('role', { ascending: true })
      .order('username', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (!['admin', 'dosen', 'mahasiswa'].includes(newRole)) {
    return { success: false, error: 'Role tidak valid' }
  }

  try {
    const { error } = await adminClient
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function toggleBanUserAction(userId: string, shouldBan: boolean) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const banDuration = shouldBan ? '604800s' : 'none'

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: banDuration }
    )
    if (authError) throw authError

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter' }
  }

  try {
    const { error } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )
    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function getUserDetailAction(userId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: userData, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!userData) return { success: false, error: 'User tidak ditemukan' }

    let detail: Record<string, unknown> = {}

    if (userData.role === 'mahasiswa') {
      const { data: mhs } = await adminClient
        .from('mahasiswa')
        .select('*, program_studi(*)')
        .eq('user_id', userId)
        .maybeSingle()
      detail = mhs || {}
    } else if (userData.role === 'dosen') {
      const { data: dsn } = await adminClient
        .from('dosen')
        .select('*, program_studi(*)')
        .eq('user_id', userId)
        .maybeSingle()
      detail = dsn || {}
    }

    return { success: true, user: userData, detail }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
