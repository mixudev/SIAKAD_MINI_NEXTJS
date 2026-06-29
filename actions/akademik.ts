'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { semesterSchema, prodiSchema, matkulSchema, kelasSchema, jadwalSchema } from '@/lib/validations/akademik'
import { getCurrentUser, isAuthorized } from '@/lib/auth-utils'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================
// SEMESTER
// ============================================================

export async function getSemestersAction() {
  const adminClient = getAdminClient()
  try {
    const { data, error } = await adminClient
      .from('semester')
      .select('*')
      .order('tahun_akademik', { ascending: false })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

export async function getActiveSemesterAction() {
  const adminClient = getAdminClient()
  try {
    const { data, error } = await adminClient
      .from('semester')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    return { success: true, data: data || null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: null }
  }
}

export async function createSemesterAction(data: {
  nama: string
  tahun_akademik: string
  tanggal_mulai: string
  tanggal_selesai: string
}) {
  const parsed = semesterSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized: hanya admin yang dapat melakukan aksi ini' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('semester').insert({
      nama: data.nama,
      tahun_akademik: data.tahun_akademik,
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai,
      is_active: false,
    })
    if (error) throw error
    revalidatePath('/admin/semester')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function activateSemesterAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error: deactivateError } = await adminClient
      .from('semester')
      .update({ is_active: false })
      .neq('id', id)
    if (deactivateError) throw deactivateError

    const { error: activateError } = await adminClient
      .from('semester')
      .update({ is_active: true })
      .eq('id', id)
    if (activateError) throw activateError

    revalidatePath('/admin/semester')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function deleteSemesterAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('semester').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/semester')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// PROGRAM STUDI
// ============================================================

export async function getProdiAction() {
  const adminClient = getAdminClient()
  try {
    const { data, error } = await adminClient
      .from('program_studi')
      .select('*')
      .order('kode', { ascending: true })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

export async function createProdiAction(data: { nama: string; kode: string }) {
  const parsed = prodiSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('program_studi').insert({
      nama: data.nama,
      kode: data.kode,
    })
    if (error) throw error
    revalidatePath('/admin/program-studi')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function updateProdiAction(id: string, data: { nama: string; kode: string }) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient
      .from('program_studi')
      .update({ nama: data.nama, kode: data.kode })
      .eq('id', id)
    if (error) throw error
    revalidatePath('/admin/program-studi')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function deleteProdiAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('program_studi').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/program-studi')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// MATA KULIAH
// ============================================================

export async function getMatkulAction(params: {
  search?: string
  prodiId?: string
  page?: number
  limit?: number
}) {
  const adminClient = getAdminClient()
  const { search, prodiId, page = 1, limit = 10 } = params

  try {
    let query = adminClient
      .from('mata_kuliah')
      .select('*, program_studi(*)', { count: 'exact' })

    if (search) {
      query = query.or(`nama.ilike.%${search}%,kode_matkul.ilike.%${search}%`)
    }
    if (prodiId && prodiId !== 'all') {
      query = query.eq('program_studi_id', prodiId)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('kode_matkul', { ascending: true })
      .range(from, to)

    if (error) throw error
    return { success: true, data: data || [], count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], count: 0 }
  }
}

export async function createMatkulAction(data: {
  kode_matkul: string
  nama: string
  sks: number
  program_studi_id: string
  semester_ke: number
}) {
  const parsed = matkulSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('mata_kuliah').insert({
      kode_matkul: data.kode_matkul,
      nama: data.nama,
      sks: data.sks,
      program_studi_id: data.program_studi_id,
      semester_ke: data.semester_ke,
    })
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Kode mata kuliah sudah digunakan' }
      }
      throw error
    }
    revalidatePath('/admin/matkul')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function updateMatkulAction(
  id: string,
  data: {
    kode_matkul: string
    nama: string
    sks: number
    program_studi_id: string
    semester_ke: number
  }
) {
  const parsed = matkulSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient
      .from('mata_kuliah')
      .update(data)
      .eq('id', id)
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Kode mata kuliah sudah digunakan' }
      }
      throw error
    }
    revalidatePath('/admin/matkul')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function deleteMatkulAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('mata_kuliah').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/matkul')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KELAS
// ============================================================

export async function getKelasAction(params: {
  search?: string
  prodiId?: string
  semesterId?: string
  page?: number
  limit?: number
}) {
  const adminClient = getAdminClient()
  const { search, prodiId, semesterId, page = 1, limit = 10 } = params

  try {
    let query = adminClient
      .from('kelas')
      .select('*, mata_kuliah(*, program_studi(*)), dosen(*), semester(*), krs_detail(count)', { count: 'exact' })

    if (search) {
      query = query.or(`nama_kelas.ilike.%${search}%,mata_kuliah.nama.ilike.%${search}%`)
    }
    if (prodiId && prodiId !== 'all') {
      query = query.eq('mata_kuliah.program_studi_id', prodiId)
    }
    if (semesterId && semesterId !== 'all') {
      query = query.eq('semester_id', semesterId)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('nama_kelas', { ascending: true })
      .range(from, to)

    if (error) throw error
    return { success: true, data: data || [], count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], count: 0 }
  }
}

export async function createKelasAction(data: {
  mata_kuliah_id: string
  dosen_id: string
  nama_kelas: string
  kapasitas: number
  semester_id: string
}) {
  const parsed = kelasSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('kelas').insert(data)
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Kelas dengan nama ini sudah ada untuk mata kuliah dan semester yang sama' }
      }
      throw error
    }
    revalidatePath('/admin/kelas')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function updateKelasAction(
  id: string,
  data: {
    mata_kuliah_id: string
    dosen_id: string
    nama_kelas: string
    kapasitas: number
    semester_id: string
  }
) {
  const parsed = kelasSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient
      .from('kelas')
      .update(data)
      .eq('id', id)
    if (error) throw error
    revalidatePath('/admin/kelas')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function deleteKelasAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('kelas').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/kelas')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// JADWAL
// ============================================================

export async function getJadwalByKelasAction(kelasId: string) {
  const adminClient = getAdminClient()
  try {
    const { data, error } = await adminClient
      .from('jadwal')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('hari', { ascending: true })
      .order('jam_mulai', { ascending: true })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

export async function getAllKelasForJadwalAction(search?: string) {
  const adminClient = getAdminClient()
  try {
    let query = adminClient
      .from('kelas')
      .select('id, nama_kelas, mata_kuliah(nama, kode_matkul), dosen(nama_lengkap), semester(nama)')

    if (search) {
      query = query.or(`nama_kelas.ilike.%${search}%,mata_kuliah.nama.ilike.%${search}%`)
    }

    const { data, error } = await query
      .order('nama_kelas', { ascending: true })
      .limit(200)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

export async function upsertJadwalAction(data: {
  kelas_id: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  ruangan: string
}) {
  const parsed = jadwalSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
  }

  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('jadwal').insert({
      kelas_id: data.kelas_id,
      hari: data.hari,
      jam_mulai: data.jam_mulai,
      jam_selesai: data.jam_selesai,
      ruangan: data.ruangan,
    })
    if (error) throw error
    revalidatePath('/admin/jadwal')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function deleteJadwalAction(id: string) {
  const user = await getCurrentUser()
  if (!isAuthorized(user?.app_metadata?.role as string, ['admin'])) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()
  try {
    const { error } = await adminClient.from('jadwal').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/jadwal')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function checkBentrokAction(data: {
  kelas_id: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  ruangan: string
  excludeId?: string
}) {
  const adminClient = getAdminClient()
  try {
    const { data: kelasData, error: kelasError } = await adminClient
      .from('kelas')
      .select('dosen_id')
      .eq('id', data.kelas_id)
      .single()

    if (kelasError) throw kelasError

    let query = adminClient
      .from('jadwal')
      .select('*, kelas!inner(dosen_id, nama_kelas, mata_kuliah(nama))')
      .eq('hari', data.hari)
      .neq('kelas_id', data.kelas_id)

    if (data.excludeId) {
      query = query.neq('id', data.excludeId)
    }

    const { data: allJadwal, error } = await query
    if (error) throw error

    const bentrokRuangan: typeof allJadwal = []
    const bentrokDosen: typeof allJadwal = []

    const newStart = timeToMinutes(data.jam_mulai)
    const newEnd = timeToMinutes(data.jam_selesai)

    for (const j of allJadwal || []) {
      const existingStart = timeToMinutes(j.jam_mulai)
      const existingEnd = timeToMinutes(j.jam_selesai)
      const isOverlap = newStart < existingEnd && newEnd > existingStart

      if (!isOverlap) continue

      if (j.ruangan === data.ruangan) {
        bentrokRuangan.push(j)
      }

      const dosenId = (j.kelas as unknown as { dosen_id: string }).dosen_id
      if (dosenId === kelasData.dosen_id) {
        bentrokDosen.push(j)
      }
    }

    return { success: true, bentrokRuangan, bentrokDosen }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, bentrokRuangan: [], bentrokDosen: [] }
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// ============================================================
// DROPDOWN HELPERS
// ============================================================

export async function getMasterDataOptionsAction() {
  const adminClient = getAdminClient()
  try {
    const { data: prodi } = await adminClient
      .from('program_studi')
      .select('*')
      .order('kode', { ascending: true })

    const { data: dosen } = await adminClient
      .from('dosen')
      .select('*, users(username)')
      .order('nama_lengkap', { ascending: true })

    const { data: matkul } = await adminClient
      .from('mata_kuliah')
      .select('*, program_studi(*)')
      .order('kode_matkul', { ascending: true })

    const { data: semester } = await adminClient
      .from('semester')
      .select('*')
      .order('tahun_akademik', { ascending: false })

    return {
      success: true,
      prodi: prodi || [],
      dosen: dosen || [],
      matkul: matkul || [],
      semester: semester || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, prodi: [], dosen: [], matkul: [], semester: [] }
  }
}
