'use server'

import { createClient as createServerClientHelper } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Admin Client to bypass RLS for lookups and user management
const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Server Action: loginAction
 * Login flow using shadow email mapping
 */
type LoginState = { success: boolean; error: string; role?: string; userId?: string }

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = formData.get('identifier')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!identifier || !password) {
    return { success: false, error: 'Username/NIM/NIDN dan Password wajib diisi' }
  }

  try {
    const adminClient = getAdminClient()
    let shadowEmail = ''
    let role = ''

    // 1. Check if identifier matches Mahasiswa NIM
    const { data: mhsData } = await adminClient
      .from('mahasiswa')
      .select('nim, user_id')
      .eq('nim', identifier)
      .maybeSingle()

    if (mhsData) {
      shadowEmail = `${mhsData.nim.toLowerCase()}@internal.siakad.local`
      role = 'mahasiswa'
    } else {
      // 2. Check if identifier matches Dosen NIDN
      const { data: dosenData } = await adminClient
        .from('dosen')
        .select('nidn, user_id')
        .eq('nidn', identifier)
        .maybeSingle()

      if (dosenData) {
        shadowEmail = `${dosenData.nidn.toLowerCase()}@internal.siakad.local`
        role = 'dosen'
      } else {
        // 3. Check if identifier matches Username (Admin or other users)
        const { data: userData } = await adminClient
          .from('users')
          .select('id, role, username')
          .eq('username', identifier)
          .maybeSingle()

        if (userData) {
          role = userData.role
          shadowEmail = `${userData.username.toLowerCase()}@internal.siakad.local`
        }
      }
    }

    if (!shadowEmail) {
      return { success: false, error: 'Pengguna tidak ditemukan dalam sistem' }
    }

    // 4. Authenticate using shadow email in Supabase Auth
    const supabase = await createServerClientHelper()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: shadowEmail,
      password: password,
    })

    if (authError) {
      return { success: false, error: 'Password salah atau otentikasi gagal' }
    }

    return { success: true, error: '', role, userId: authData.user.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: 'Terjadi kesalahan sistem: ' + message }
  }
}

/**
 * Server Action: logoutAction
 */
export async function logoutAction() {
  const supabase = await createServerClientHelper()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Server Action: registerUserAction
 * Custom admin action to register students, lecturers, or admins
 */
export async function registerUserAction(userData: {
  role: 'admin' | 'dosen' | 'mahasiswa'
  username?: string
  password?: string
  nama_lengkap: string
  // Mahasiswa specific
  nim?: string
  program_studi_id?: string
  angkatan?: number
  dosen_pa_id?: string | null
  // Dosen specific
  nidn?: string
  jabatan_akademik?: string
}) {
  const adminClient = getAdminClient()
  const { role, username, password, nama_lengkap } = userData

  // Construct shadow email
  let shadowEmail = ''
  let identifier = ''
  if (role === 'mahasiswa') {
    if (!userData.nim) return { success: false, error: 'NIM wajib diisi untuk mahasiswa' }
    identifier = userData.nim.trim().toLowerCase()
  } else if (role === 'dosen') {
    if (!userData.nidn) return { success: false, error: 'NIDN wajib diisi untuk dosen' }
    identifier = userData.nidn.trim().toLowerCase()
  } else {
    if (!username) return { success: false, error: 'Username wajib diisi untuk admin' }
    identifier = username.trim().toLowerCase()
  }
  shadowEmail = `${identifier}@internal.siakad.local`

  const userPassword = password || 'SiakadPass123!' // Default fallback password

  // 1. Create Auth User using Admin Auth API (bypasses email confirm)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: shadowEmail,
    password: userPassword,
    email_confirm: true,
    app_metadata: { role: role },
    user_metadata: { nama_lengkap }
  })

  if (authError || !authData.user) {
    return { success: false, error: 'Gagal membuat akun auth: ' + authError?.message }
  }

  const userId = authData.user.id

  try {
    // 2. Insert into public.users profile
    const { error: userProfileError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        role: role,
        username: username || identifier
      })

    if (userProfileError) throw userProfileError

    // 3. Insert into role-specific tables
    if (role === 'mahasiswa') {
      const { error: mhsError } = await adminClient
        .from('mahasiswa')
        .insert({
          user_id: userId,
          nim: userData.nim!,
          nama_lengkap: nama_lengkap,
          program_studi_id: userData.program_studi_id!,
          angkatan: userData.angkatan || new Date().getFullYear(),
          status: 'aktif',
          dosen_pa_id: userData.dosen_pa_id || null
        })

      if (mhsError) throw mhsError
    } else if (role === 'dosen') {
      const { error: dosenError } = await adminClient
        .from('dosen')
        .insert({
          user_id: userId,
          nidn: userData.nidn!,
          nama_lengkap: nama_lengkap,
          program_studi_id: userData.program_studi_id || null,
          jabatan_akademik: userData.jabatan_akademik || null
        })

      if (dosenError) throw dosenError
    }

    return { success: true, userId }
  } catch (dbError: unknown) {
    // Simulated Transaction Rollback: delete auth user if DB insert fails
    await adminClient.auth.admin.deleteUser(userId)
    const message = dbError instanceof Error ? dbError.message : 'Unknown error'
    return { success: false, error: 'Gagal sinkronisasi data profil: ' + message }
  }
}
