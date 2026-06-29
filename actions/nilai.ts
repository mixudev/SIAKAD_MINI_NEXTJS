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

// ============================================================
// DOSEN — GET KELAS DIAJAR (semester aktif)
// ============================================================

export async function getDosenKelasAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: dosen } = await adminClient
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dosen) return { success: false, error: 'Data dosen tidak ditemukan', data: [] }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: [] }

    const { data: kelasList } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*), semester(*), jadwal(*)')
      .eq('dosen_id', dosen.id)
      .eq('semester_id', sem.id)
      .order('nama_kelas', { ascending: true })

    const enriched = await Promise.all((kelasList || []).map(async (k) => {
      const { count: enrolled } = await adminClient
        .from('krs_detail')
        .select('*, krs!inner(status)', { count: 'exact', head: true })
        .eq('kelas_id', k.id)
        .eq('krs.status', 'disetujui')

      const { count: totalKomponen } = await adminClient
        .from('komponen_nilai')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const { count: nilaiFilled } = await adminClient
        .from('nilai_akhir')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      return {
        ...k,
        enrolled_count: enrolled || 0,
        total_komponen: totalKomponen || 0,
        nilai_filled: nilaiFilled || 0,
      }
    }))

    return { success: true, data: enriched, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// DOSEN — GET KOMPONEN NILAI per KELAS
// ============================================================

export async function getKomponenNilaiAction(kelasId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: komponen } = await adminClient
      .from('komponen_nilai')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('nama_komponen', { ascending: true })

    const totalBobot = (komponen || []).reduce((sum, k) => sum + Number(k.bobot_persen), 0)

    return { success: true, data: komponen || [], total_bobot: totalBobot }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], total_bobot: 0 }
  }
}

// ============================================================
// DOSEN — UPSERT KOMPONEN NILAI
// ============================================================

export async function upsertKomponenNilaiAction(formData: FormData) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const kelasId = formData.get('kelas_id') as string
    const nama = formData.get('nama_komponen') as string
    const bobot = parseFloat(formData.get('bobot_persen') as string)

    if (!kelasId || !nama || isNaN(bobot)) {
      return { success: false, error: 'Semua field wajib diisi' }
    }
    if (bobot < 1 || bobot > 100) {
      return { success: false, error: 'Bobot harus 1-100' }
    }

    // Check total bobot
    const { data: existing } = await adminClient
      .from('komponen_nilai')
      .select('bobot_persen')
      .eq('kelas_id', kelasId)

    const currentTotal = (existing || []).reduce((sum, k) => sum + Number(k.bobot_persen), 0)
    if (currentTotal + bobot > 100) {
      return { success: false, error: `Total bobot akan melebihi 100% (saat ini ${currentTotal}% + ${bobot}% = ${currentTotal + bobot}%)` }
    }

    const { data, error } = await adminClient
      .from('komponen_nilai')
      .insert({ kelas_id: kelasId, nama_komponen: nama, bobot_persen: bobot })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dosen/input-nilai/${kelasId}`)
    return { success: true, data, total_bobot_baru: currentTotal + bobot }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// DOSEN — DELETE KOMPONEN NILAI
// ============================================================

export async function deleteKomponenNilaiAction(komponenId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    // Check if there are nilai entries using this komponen
    const { count } = await adminClient
      .from('nilai')
      .select('*', { count: 'exact', head: true })
      .eq('komponen_nilai_id', komponenId)

    const { data: komponen } = await adminClient
      .from('komponen_nilai')
      .select('kelas_id')
      .eq('id', komponenId)
      .maybeSingle()

    // Delete the komponen (CASCADE will delete related nilai)
    const { error } = await adminClient
      .from('komponen_nilai')
      .delete()
      .eq('id', komponenId)

    if (error) throw error

    // Recalculate all nilai_akhir for this class
    if (komponen) {
      await recalculateNilaiAkhir(komponen.kelas_id)
      revalidatePath(`/dosen/input-nilai/${komponen.kelas_id}`)
    }

    return { success: true, deleted_nilai_count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// DOSEN — GET NILAI INPUT MATRIX
// ============================================================

export async function getNilaiInputAction(kelasId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: null }

  try {
    const { data: kelas } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*), semester(*)')
      .eq('id', kelasId)
      .maybeSingle()
    if (!kelas) return { success: false, error: 'Kelas tidak ditemukan', data: null }

    const { data: komponen } = await adminClient
      .from('komponen_nilai')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('nama_komponen', { ascending: true })

    // Get enrolled mahasiswa
    const { data: enrolled } = await adminClient
      .from('krs_detail')
      .select('krs!inner(mahasiswa_id)')
      .eq('kelas_id', kelasId)
      .eq('krs.status', 'disetujui')

    const mhsIds = [...new Set((enrolled || []).map((e: any) => e.krs.mahasiswa_id))]

    const { data: mahasiswaList } = await adminClient
      .from('mahasiswa')
      .select('id, nim, nama_lengkap')
      .in('id', mhsIds)
      .order('nim', { ascending: true })

    // Get existing nilai values
    const komponenIds = (komponen || []).map(k => k.id)
    const { data: existingNilai } = await adminClient
      .from('nilai')
      .select('*')
      .in('komponen_nilai_id', komponenIds)
      .in('mahasiswa_id', mhsIds)

    // Build nilai map: komponen_id -> mahasiswa_id -> nilai_angka
    const nilaiMap: Record<string, Record<string, number>> = {}
    for (const n of existingNilai || []) {
      if (!nilaiMap[n.komponen_nilai_id]) nilaiMap[n.komponen_nilai_id] = {}
      nilaiMap[n.komponen_nilai_id][n.mahasiswa_id] = n.nilai_angka
    }

    // Get existing nilai_akhir
    const { data: nilaiAkhir } = await adminClient
      .from('nilai_akhir')
      .select('*')
      .eq('kelas_id', kelasId)
      .in('mahasiswa_id', mhsIds)

    const nilaiAkhirMap: Record<string, { nilai_angka_akhir: number | null; nilai_huruf: string | null }> = {}
    for (const na of nilaiAkhir || []) {
      nilaiAkhirMap[na.mahasiswa_id] = {
        nilai_angka_akhir: na.nilai_angka_akhir,
        nilai_huruf: na.nilai_huruf,
      }
    }

    const matrix = (mahasiswaList || []).map(m => {
      const komponenNilai: Record<string, number | null> = {}
      for (const k of komponen || []) {
        komponenNilai[k.id] = nilaiMap[k.id]?.[m.id] ?? null
      }
      return {
        mahasiswa_id: m.id,
        nim: m.nim,
        nama_lengkap: m.nama_lengkap,
        komponen_nilai: komponenNilai,
        nilai_akhir: nilaiAkhirMap[m.id] || null,
      }
    })

    return { success: true, data: { matrix, komponen, kelas } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: null }
  }
}

// ============================================================
// DOSEN — SAVE NILAI (BULK UPSERT)
// ============================================================

export async function saveNilaiAction(kelasId: string, nilaiData: Array<{
  komponen_nilai_id: string
  mahasiswa_id: string
  nilai_angka: number
}>) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    // Validate
    if (nilaiData.length === 0) return { success: false, error: 'Tidak ada data nilai' }

    for (const d of nilaiData) {
      if (d.nilai_angka < 0 || d.nilai_angka > 100) {
        return { success: false, error: `Nilai ${d.nilai_angka} tidak valid (0-100)` }
      }
    }

    // Upsert each nilai record
    for (const d of nilaiData) {
      const { error } = await adminClient
        .from('nilai')
        .upsert(
          {
            komponen_nilai_id: d.komponen_nilai_id,
            mahasiswa_id: d.mahasiswa_id,
            nilai_angka: d.nilai_angka,
          },
          { onConflict: 'komponen_nilai_id, mahasiswa_id' }
        )
      if (error) throw error
    }

    // Recalculate nilai_akhir for all affected mahasiswa
    await recalculateNilaiAkhir(kelasId)

    revalidatePath(`/dosen/input-nilai/${kelasId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// INTERNAL — RECALCULATE NILAI AKHIR
// ============================================================

async function recalculateNilaiAkhir(kelasId: string) {
  const adminClient = getAdminClient()

  // Get komponen + bobot
  const { data: komponen } = await adminClient
    .from('komponen_nilai')
    .select('*')
    .eq('kelas_id', kelasId)

  if (!komponen || komponen.length === 0) return

  // Get enrolled mahasiswa
  const { data: enrolled } = await adminClient
    .from('krs_detail')
    .select('krs!inner(mahasiswa_id)')
    .eq('kelas_id', kelasId)
    .eq('krs.status', 'disetujui')

  const mhsIds = [...new Set((enrolled || []).map((e: any) => e.krs.mahasiswa_id))]

  const komponenIds = komponen.map(k => k.id)

  // Get all nilai for this class
  const { data: allNilai } = await adminClient
    .from('nilai')
    .select('*')
    .in('komponen_nilai_id', komponenIds)
    .in('mahasiswa_id', mhsIds)

  // Group nilai by mahasiswa
  const nilaiByMhs: Record<string, Record<string, number>> = {}
  for (const n of allNilai || []) {
    if (!nilaiByMhs[n.mahasiswa_id]) nilaiByMhs[n.mahasiswa_id] = {}
    nilaiByMhs[n.mahasiswa_id][n.komponen_nilai_id] = n.nilai_angka
  }

  // Calculate for each mahasiswa
  for (const mhsId of mhsIds) {
    const mhsNilai = nilaiByMhs[mhsId] || {}
    let total = 0
    let allFilled = true
    let totalBobot = 0

    for (const k of komponen) {
      const score = mhsNilai[k.id]
      if (score === undefined) {
        allFilled = false
        break
      }
      total += score * Number(k.bobot_persen)
      totalBobot += Number(k.bobot_persen)
    }

    if (allFilled && totalBobot > 0) {
      const nilaiAkhir = Math.round((total / totalBobot) * 100) / 100
      const nilaiHuruf = konversiHuruf(nilaiAkhir)

      await adminClient
        .from('nilai_akhir')
        .upsert(
          {
            mahasiswa_id: mhsId,
            kelas_id: kelasId,
            nilai_angka_akhir: nilaiAkhir,
            nilai_huruf: nilaiHuruf,
          },
          { onConflict: 'mahasiswa_id, kelas_id' }
        )
    } else {
      // Clear nilai_akhir if not all filled
      await adminClient
        .from('nilai_akhir')
        .delete()
        .eq('mahasiswa_id', mhsId)
        .eq('kelas_id', kelasId)
    }
  }
}

// ============================================================
// HELPER — KONVERSI NILAI KE HURUF
// ============================================================

function konversiHuruf(nilai: number): string {
  if (nilai >= 85) return 'A'
  if (nilai >= 75) return 'B'
  if (nilai >= 65) return 'C'
  if (nilai >= 50) return 'D'
  return 'E'
}

// ============================================================
// ADMIN — GET MONITORING PENILAIAN
// ============================================================

export async function getAdminPenilaianAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: [] }

    const { data: kelasList } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*, program_studi(id, nama, singkatan)), semester(*), dosen(id, nidn, nama_lengkap)')
      .eq('semester_id', sem.id)
      .order('nama_kelas', { ascending: true })

    const enriched = await Promise.all((kelasList || []).map(async (k) => {
      const { count: totalKomponen } = await adminClient
        .from('komponen_nilai')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const { data: bobotData } = await adminClient
        .from('komponen_nilai')
        .select('bobot_persen')
        .eq('kelas_id', k.id)
      const totalBobot = (bobotData || []).reduce((s, b) => s + Number(b.bobot_persen), 0)

      const { count: enrolled } = await adminClient
        .from('krs_detail')
        .select('*, krs!inner(status)', { count: 'exact', head: true })
        .eq('kelas_id', k.id)
        .eq('krs.status', 'disetujui')

      const { count: nilaiFilled } = await adminClient
        .from('nilai_akhir')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      return {
        ...k,
        total_komponen: totalKomponen || 0,
        total_bobot: totalBobot,
        enrolled_count: enrolled || 0,
        nilai_filled: nilaiFilled || 0,
        is_bobot_valid: totalBobot === 100,
        is_lengkap: (totalKomponen || 0) > 0 && totalBobot === 100 && (nilaiFilled || 0) >= (enrolled || 0),
      }
    }))

    return { success: true, data: enriched, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// MAHASISWA — GET KHS
// ============================================================

export async function getKhsAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id, nim, nama_lengkap, program_studi(nama, singkatan)')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan', data: [] }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: [] }

    // Get approved KRS
    const { data: krs } = await adminClient
      .from('krs')
      .select('id')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .eq('status', 'disetujui')
      .maybeSingle()
    if (!krs) return { success: true, data: [], mahasiswa: mhs, semester: sem }

    // Get all enrolled kelas
    const { data: krsDetails } = await adminClient
      .from('krs_detail')
      .select('kelas_id')
      .eq('krs_id', krs.id)

    const kelasIds = (krsDetails || []).map(d => d.kelas_id)
    if (kelasIds.length === 0) return { success: true, data: [], mahasiswa: mhs, semester: sem }

    // Get kelas + matkul
    const { data: kelasList } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*)')
      .in('id', kelasIds)

    // Get nilai_akhir for this mahasiswa
    const { data: nilaiAkhir } = await adminClient
      .from('nilai_akhir')
      .select('*, kelas!inner(mata_kuliah(*))')
      .eq('mahasiswa_id', mhs.id)
      .in('kelas_id', kelasIds)

    // Get komponen + nilai for detail
    const result = await Promise.all((kelasList || []).map(async (kelas) => {
      const { data: komponen } = await adminClient
        .from('komponen_nilai')
        .select('*')
        .eq('kelas_id', kelas.id)
        .order('nama_komponen', { ascending: true })

      const komponenIds = (komponen || []).map(k => k.id)
      const { data: nilaiDetail } = await adminClient
        .from('nilai')
        .select('*')
        .in('komponen_nilai_id', komponenIds)
        .eq('mahasiswa_id', mhs.id)

      const nilaiMap: Record<string, number> = {}
      for (const n of nilaiDetail || []) {
        nilaiMap[n.komponen_nilai_id] = n.nilai_angka
      }

      const na = nilaiAkhir?.find(n => n.kelas_id === kelas.id)

      return {
        kelas_id: kelas.id,
        nama_kelas: kelas.nama_kelas,
        mata_kuliah: kelas.mata_kuliah,
        komponen: (komponen || []).map(k => ({
          id: k.id,
          nama: k.nama_komponen,
          bobot: k.bobot_persen,
          nilai: nilaiMap[k.id] ?? null,
        })),
        nilai_akhir: na ? {
          angka: na.nilai_angka_akhir,
          huruf: na.nilai_huruf,
        } : null,
      }
    }))

    return { success: true, data: result, mahasiswa: mhs, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}
