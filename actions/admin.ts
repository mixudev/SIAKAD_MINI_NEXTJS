'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAuthorized } from '@/lib/auth-utils'

// Admin Client to bypass RLS for lookups and user management
const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Get all students with search and filter
 */
export async function getStudentsAction(params: {
  search?: string
  prodiId?: string
  status?: string
  angkatan?: string
  page?: number
  limit?: number
}) {
  const adminClient = getAdminClient()
  const { search = '', prodiId = '', status = '', angkatan = '', page = 1, limit = 10 } = params

  try {
    let query = adminClient
      .from('mahasiswa')
      .select('*, program_studi(*), dosen_pa:dosen(*), users(username)', { count: 'exact' })

    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,nim.ilike.%${search}%`)
    }
    if (prodiId && prodiId !== 'all') {
      query = query.eq('program_studi_id', prodiId)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (angkatan && angkatan !== 'all') {
      query = query.eq('angkatan', parseInt(angkatan))
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('nim', { ascending: true })
      .range(from, to)

    if (error) throw error

    return { success: true, data: data || [], count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], count: 0 }
  }
}

/**
 * Get all lecturers with search and filter
 */
export async function getLecturersAction(params: {
  search?: string
  prodiId?: string
  page?: number
  limit?: number
}) {
  const adminClient = getAdminClient()
  const { search = '', prodiId = '', page = 1, limit = 10 } = params

  try {
    let query = adminClient
      .from('dosen')
      .select('*, program_studi(*), users(username)', { count: 'exact' })

    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,nidn.ilike.%${search}%`)
    }
    if (prodiId && prodiId !== 'all') {
      query = query.eq('program_studi_id', prodiId)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('nidn', { ascending: true })
      .range(from, to)

    if (error) throw error

    return { success: true, data: data || [], count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], count: 0 }
  }
}

/**
 * Get options for dropdown (Prodi and Dosen PA)
 */
export async function getDropdownOptionsAction() {
  const adminClient = getAdminClient()

  try {
    const { data: prodiData, error: prodiError } = await adminClient
      .from('program_studi')
      .select('*')
      .order('nama', { ascending: true })

    if (prodiError) throw prodiError

    const { data: dosenData, error: dosenError } = await adminClient
      .from('dosen')
      .select('*')
      .order('nama_lengkap', { ascending: true })

    if (dosenError) throw dosenError

    return { success: true, prodi: prodiData || [], dosen: dosenData || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, prodi: [], dosen: [] }
  }
}

/**
 * Update Student Record
 */
export async function updateStudentAction(
  userId: string,
  data: {
    nama_lengkap: string
    program_studi_id: string
    angkatan: number
    status: 'aktif' | 'cuti' | 'lulus' | 'do'
    dosen_pa_id?: string | null
    username?: string
  }
) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {
    // 1. Update public.users (only if username provided)
    if (data.username) {
      const { error: userError } = await adminClient
        .from('users')
        .update({ username: data.username })
        .eq('id', userId)

      if (userError) throw userError
    }

    // 2. Update public.mahasiswa
    const { error: mhsError } = await adminClient
      .from('mahasiswa')
      .update({
        nama_lengkap: data.nama_lengkap,
        program_studi_id: data.program_studi_id,
        angkatan: data.angkatan,
        status: data.status,
        dosen_pa_id: data.dosen_pa_id || null,
      })
      .eq('user_id', userId)

    if (mhsError) throw mhsError

    revalidatePath('/admin/mahasiswa')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Update Lecturer Record
 */
export async function updateLecturerAction(
  userId: string,
  data: {
    nama_lengkap: string
    program_studi_id?: string | null
    jabatan_akademik?: string | null
    username?: string
  }
) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {
    // 1. Update public.users (only if username provided)
    if (data.username) {
      const { error: userError } = await adminClient
        .from('users')
        .update({ username: data.username })
        .eq('id', userId)

      if (userError) throw userError
    }

    // 2. Update public.dosen
    const { error: dosenError } = await adminClient
      .from('dosen')
      .update({
        nama_lengkap: data.nama_lengkap,
        program_studi_id: data.program_studi_id || null,
        jabatan_akademik: data.jabatan_akademik || null,
      })
      .eq('user_id', userId)

    if (dosenError) throw dosenError

    revalidatePath('/admin/dosen')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Reset User Password
 */
export async function resetPasswordAction(userId: string, newPassword: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Deactivate / Ban User from Supabase Auth
 */
export async function toggleUserBanAction(userId: string, shouldBan: boolean) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {
    if (shouldBan) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
      })
      if (error) throw error
    } else {
      // Unban: clear ban_duration by setting to empty string
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '',
      })
      if (error) throw error
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
