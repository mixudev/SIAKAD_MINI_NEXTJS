import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://svqiwqhwhuovuhsbmzwv.supabase.co'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const results: string[] = []

  const adminClient = createClient(SUPABASE_URL, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Try to delete broken auth users
  const brokenIds = [
    'c1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
  ]

  for (const id of brokenIds) {
    const { error } = await adminClient.auth.admin.deleteUser(id)
    if (error) {
      results.push(`❌ Auth delete ${id}: ${error.message} (${error.status})`)
    } else {
      results.push(`✅ Auth delete ${id}: success`)
    }
  }

  // Try to create new users via Admin API
  const seedUsers = [
    {
      email: 'admin.siakad@internal.siakad.local',
      password: 'password',
      role: 'admin' as const,
      username: 'admin.siakad',
      nama_lengkap: 'Administrator SIAKAD',
    },
    {
      email: '0123456789@internal.siakad.local',
      password: 'password',
      role: 'dosen' as const,
      username: '0123456789',
      nama_lengkap: 'Dr. Budi Santoso, M.Kom',
      nidn: '0123456789',
      program_studi_id: 'a1000000-0000-0000-0000-000000000001',
      jabatan_akademik: 'Lektor Kepala',
    },
    {
      email: '2021310045@internal.siakad.local',
      password: 'password',
      role: 'mahasiswa' as const,
      username: '2021310045',
      nama_lengkap: 'Rina Aulia Putri',
      nim: '2021310045',
      program_studi_id: 'a1000000-0000-0000-0000-000000000001',
      angkatan: 2021,
    },
  ]

  for (const user of seedUsers) {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: { role: user.role },
      user_metadata: { nama_lengkap: user.nama_lengkap }
    })

    if (authError) {
      results.push(`❌ Auth create ${user.email}: ${authError.message} (${authError.status})`)
      continue
    }

    const userId = authData.user.id
    results.push(`✅ Auth create ${user.email}: ${userId}`)

    // Insert public.users
    const { error: pubError } = await adminClient.from('users').upsert({
      id: userId,
      role: user.role,
      username: user.username
    }, { onConflict: 'id' })
    if (pubError) {
      results.push(`❌ public.users ${user.username}: ${pubError.message}`)
      continue
    }
    results.push(`✅ public.users ${user.username}`)

    // Insert role-specific table
    if (user.role === 'dosen') {
      const { error: dsnError } = await adminClient.from('dosen').upsert({
        id: 'd1000000-0000-0000-0000-000000000001',
        user_id: userId,
        nidn: user.nidn!,
        nama_lengkap: user.nama_lengkap,
        program_studi_id: user.program_studi_id!,
        jabatan_akademik: user.jabatan_akademik,
      }, { onConflict: 'id' })
      results.push(dsnError ? `❌ dosen: ${dsnError.message}` : `✅ dosen ${user.nidn}`)
    }
    if (user.role === 'mahasiswa') {
      const { error: mhsError } = await adminClient.from('mahasiswa').upsert({
        id: 'e1000000-0000-0000-0000-000000000001',
        user_id: userId,
        nim: user.nim!,
        nama_lengkap: user.nama_lengkap,
        program_studi_id: user.program_studi_id!,
        angkatan: user.angkatan!,
        status: 'aktif',
        dosen_pa_id: 'd1000000-0000-0000-0000-000000000001',
      }, { onConflict: 'id' })
      results.push(mhsError ? `❌ mahasiswa: ${mhsError.message}` : `✅ mahasiswa ${user.nim}`)
    }
  }

  return NextResponse.json({ results }, { status: 200 })
}
