import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Hanya aktif di development
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const password = 'password'
  const results: Record<string, string> = {}

  try {
    // ============================================================
    // 1. Master Data: Program Studi
    // ============================================================
    await adminClient.from('program_studi').upsert([
      { id: 'a1000000-0000-0000-0000-000000000001', nama: 'Teknik Informatika', kode: 'TI' },
      { id: 'a1000000-0000-0000-0000-000000000002', nama: 'Sistem Informasi', kode: 'SI' },
      { id: 'a1000000-0000-0000-0000-000000000003', nama: 'Manajemen Bisnis', kode: 'MB' },
    ], { onConflict: 'id' })
    results['program_studi'] = '✅ 3 prodi berhasil dibuat'

    // ============================================================
    // 2. Master Data: Semester Aktif
    // ============================================================
    await adminClient.from('semester').upsert([
      {
        id: 'b1000000-0000-0000-0000-000000000001',
        nama: 'Ganjil 2025/2026',
        tahun_akademik: '2025/2026',
        tanggal_mulai: '2025-09-01',
        tanggal_selesai: '2026-01-31',
        is_active: true
      }
    ], { onConflict: 'id' })
    results['semester'] = '✅ Semester aktif berhasil dibuat'

    // ============================================================
    // 3. Buat User Admin
    // ============================================================
    const adminId = 'c1000000-0000-0000-0000-000000000001'
    const { data: adminAuth, error: adminAuthError } = await adminClient.auth.admin.createUser({
      email: 'admin.siakad@internal.siakad.local',
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { nama_lengkap: 'Administrator SIAKAD' }
    })
    if (adminAuthError && !adminAuthError.message.includes('already been registered')) {
      results['admin_auth'] = `❌ ${adminAuthError.message}`
    } else {
      const userId = adminAuth?.user?.id ?? adminId
      await adminClient.from('users').upsert({
        id: userId,
        role: 'admin',
        username: 'admin.siakad',
      }, { onConflict: 'id' })
      results['admin'] = `✅ Admin berhasil — login: admin.siakad / ${password}`
    }

    // ============================================================
    // 4. Buat User Dosen
    // ============================================================
    const { data: dosenAuth, error: dosenAuthError } = await adminClient.auth.admin.createUser({
      email: '0123456789@internal.siakad.local',
      password,
      email_confirm: true,
      app_metadata: { role: 'dosen' },
      user_metadata: { nama_lengkap: 'Dr. Budi Santoso, M.Kom' }
    })
    if (dosenAuthError && !dosenAuthError.message.includes('already been registered')) {
      results['dosen_auth'] = `❌ ${dosenAuthError.message}`
    } else {
      const dosenUserId = dosenAuth?.user?.id ?? 'c1000000-0000-0000-0000-000000000002'
      await adminClient.from('users').upsert({
        id: dosenUserId,
        role: 'dosen',
        username: '0123456789',
      }, { onConflict: 'id' })
      await adminClient.from('dosen').upsert({
        id: 'd1000000-0000-0000-0000-000000000001',
        user_id: dosenUserId,
        nidn: '0123456789',
        nama_lengkap: 'Dr. Budi Santoso, M.Kom',
        program_studi_id: 'a1000000-0000-0000-0000-000000000001',
        jabatan_akademik: 'Lektor Kepala'
      }, { onConflict: 'id' })
      results['dosen'] = `✅ Dosen berhasil — login: 0123456789 (NIDN) / ${password}`
    }

    // ============================================================
    // 5. Buat User Mahasiswa
    // ============================================================
    const { data: mhsAuth, error: mhsAuthError } = await adminClient.auth.admin.createUser({
      email: '2021310045@internal.siakad.local',
      password,
      email_confirm: true,
      app_metadata: { role: 'mahasiswa' },
      user_metadata: { nama_lengkap: 'Rina Aulia Putri' }
    })
    if (mhsAuthError && !mhsAuthError.message.includes('already been registered')) {
      results['mhs_auth'] = `❌ ${mhsAuthError.message}`
    } else {
      const mhsUserId = mhsAuth?.user?.id ?? 'c1000000-0000-0000-0000-000000000003'
      await adminClient.from('users').upsert({
        id: mhsUserId,
        role: 'mahasiswa',
        username: '2021310045',
      }, { onConflict: 'id' })
      await adminClient.from('mahasiswa').upsert({
        id: 'e1000000-0000-0000-0000-000000000001',
        user_id: mhsUserId,
        nim: '2021310045',
        nama_lengkap: 'Rina Aulia Putri',
        program_studi_id: 'a1000000-0000-0000-0000-000000000001',
        angkatan: 2021,
        status: 'aktif',
        dosen_pa_id: 'd1000000-0000-0000-0000-000000000001'
      }, { onConflict: 'id' })
      results['mahasiswa'] = `✅ Mahasiswa berhasil — login: 2021310045 (NIM) / ${password}`
    }

    return NextResponse.json({
      message: '🎉 Seed berhasil! Akun siap digunakan.',
      credentials: {
        admin: { identifier: 'admin.siakad', password },
        dosen: { identifier: '0123456789', password },
        mahasiswa: { identifier: '2021310045', password },
      },
      results,
    }, { status: 200 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, results }, { status: 500 })
  }
}

// ============================================================
// DELETE /api/seed — Hapus semua data seed (dev only)
// ============================================================
export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const deleted: string[] = []

  try {
    // 1. Cari semua user auth dengan shadow email domain
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const seedUsers = authUsers?.users?.filter(u =>
      u.email?.endsWith('@internal.siakad.local')
    ) ?? []

    // 2. Hapus dari tabel public (cascade akan handle child tables)
    // Hapus mahasiswa, dosen, users (cascade dari FK)
    for (const u of seedUsers) {
      await adminClient.from('mahasiswa').delete().eq('user_id', u.id)
      await adminClient.from('dosen').delete().eq('user_id', u.id)
      await adminClient.from('users').delete().eq('id', u.id)
    }

    // 3. Hapus master data seed
    await adminClient.from('semester').delete()
      .eq('id', 'b1000000-0000-0000-0000-000000000001')
    await adminClient.from('program_studi').delete()
      .in('id', [
        'a1000000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000003',
      ])
    deleted.push(`master_data: semester & program_studi`)

    // 4. Hapus user dari auth.users
    for (const u of seedUsers) {
      await adminClient.auth.admin.deleteUser(u.id)
      deleted.push(`auth: ${u.email}`)
    }

    return NextResponse.json({
      message: `🗑️ Seed cleanup selesai. ${deleted.length} item dihapus.`,
      deleted,
    }, { status: 200 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, deleted }, { status: 500 })
  }
}

