'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { absensiItemSchema } from '@/lib/validations/absensi'
import { z } from 'zod'

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

      const { count: totalPertemuan } = await adminClient
        .from('pertemuan')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const { count: filledPertemuan } = await adminClient
        .from('pertemuan')
        .select('*, absensi!inner(id)', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      return {
        ...k,
        enrolled_count: enrolled || 0,
        total_pertemuan: totalPertemuan || 0,
        filled_pertemuan: filledPertemuan || 0,
      }
    }))

    return { success: true, data: enriched, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// DOSEN — GET PERTEMUAN per KELAS
// ============================================================

export async function getPertemuanAction(kelasId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: pertemuan } = await adminClient
      .from('pertemuan')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('pertemuan_ke', { ascending: true })

    const enriched = await Promise.all((pertemuan || []).map(async (p) => {
      const { count: absenCount } = await adminClient
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .eq('pertemuan_id', p.id)

      return { ...p, is_filled: (absenCount || 0) > 0 }
    }))

    const { data: kelas } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*), semester(*), jadwal(*)')
      .eq('id', kelasId)
      .maybeSingle()

    return { success: true, data: enriched, kelas }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// DOSEN — CREATE PERTEMUAN
// ============================================================

export async function createPertemuanAction(formData: FormData) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const kelasId = formData.get('kelas_id') as string
    const tanggal = formData.get('tanggal') as string
    const materi = formData.get('materi') as string || null

    if (!kelasId || !tanggal) {
      return { success: false, error: 'Kelas dan tanggal wajib diisi' }
    }

    // Auto-increment pertemuan_ke
    const { data: last } = await adminClient
      .from('pertemuan')
      .select('pertemuan_ke')
      .eq('kelas_id', kelasId)
      .order('pertemuan_ke', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextKe = (last?.pertemuan_ke || 0) + 1
    if (nextKe > 14) {
      return { success: false, error: 'Maksimal 14 pertemuan per kelas per semester' }
    }

    const { data, error } = await adminClient
      .from('pertemuan')
      .insert({ kelas_id: kelasId, pertemuan_ke: nextKe, tanggal, materi })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dosen/absensi/${kelasId}`)
    return { success: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// DOSEN — GET MAHASISWA + ABSENSI STATUS per PERTEMUAN
// ============================================================

export async function getMahasiswaForAbsensiAction(pertemuanId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: pertemuan } = await adminClient
      .from('pertemuan')
      .select('*, kelas!inner(*)')
      .eq('id', pertemuanId)
      .maybeSingle()
    if (!pertemuan) return { success: false, error: 'Pertemuan tidak ditemukan', data: [] }

    // Get enrolled mahasiswa from approved KRS
    const { data: enrolled } = await adminClient
      .from('krs_detail')
      .select('*, krs!inner(mahasiswa_id), mahasiswa!inner(id, nim, nama_lengkap)')
      .eq('kelas_id', pertemuan.kelas_id)
      .eq('krs.status', 'disetujui')

    if (!enrolled || enrolled.length === 0) {
      return { success: true, data: [], pertemuan, kelas: pertemuan.kelas }
    }

    // Get existing absensi for this pertemuan
    const mhsIds = [...new Set(enrolled.map(e => e.krs.mahasiswa_id))]
    const { data: existingAbsensi } = await adminClient
      .from('absensi')
      .select('*')
      .eq('pertemuan_id', pertemuanId)
      .in('mahasiswa_id', mhsIds)

    const absensiMap = new Map((existingAbsensi || []).map(a => [a.mahasiswa_id, a]))

    // Also get mahasiswa details
    const { data: mahasiswaList } = await adminClient
      .from('mahasiswa')
      .select('id, nim, nama_lengkap')
      .in('id', mhsIds)
      .order('nim', { ascending: true })

    const result = (mahasiswaList || []).map(m => ({
      mahasiswa_id: m.id,
      nim: m.nim,
      nama_lengkap: m.nama_lengkap,
      status: absensiMap.get(m.id)?.status || null,
      keterangan: absensiMap.get(m.id)?.keterangan || null,
    }))

    return { success: true, data: result, pertemuan, kelas: pertemuan.kelas }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// DOSEN — SAVE ABSENSI (BULK UPSERT)
// ============================================================

export async function saveAbsensiAction(pertemuanId: string, absensiData: Array<{ mahasiswa_id: string; status: string; keterangan?: string }>) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    // Validate with Zod
    const bulkSchema = z.object({
      pertemuan_id: z.string().min(1),
      data: z.array(absensiItemSchema).min(1),
    })
    const parsed = bulkSchema.safeParse({ pertemuan_id: pertemuanId, data: absensiData })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') }
    }

    // Upsert each record (delete existing then insert fresh)
    const mhsIds = absensiData.map(d => d.mahasiswa_id)

    // Delete existing for this pertemuan + these mahasiswa
    await adminClient
      .from('absensi')
      .delete()
      .eq('pertemuan_id', pertemuanId)
      .in('mahasiswa_id', mhsIds)

    // Insert new records
    const records = absensiData.map(d => ({
      pertemuan_id: pertemuanId,
      mahasiswa_id: d.mahasiswa_id,
      status: d.status,
      keterangan: d.keterangan || null,
    }))

    const { error } = await adminClient.from('absensi').insert(records)
    if (error) throw error

    // Get summary
    const summary = {
      hadir: records.filter(r => r.status === 'hadir').length,
      izin: records.filter(r => r.status === 'izin').length,
      sakit: records.filter(r => r.status === 'sakit').length,
      alpa: records.filter(r => r.status === 'alpa').length,
    }

    // Get kelas_id from pertemuan for correct revalidation path
    const { data: pertemuan } = await adminClient
      .from('pertemuan')
      .select('kelas_id')
      .eq('id', pertemuanId)
      .maybeSingle()

    revalidatePath(`/dosen/absensi/${pertemuan?.kelas_id || ''}`)
    return { success: true, summary }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// DOSEN — GET REKAP ABSENSI per KELAS
// ============================================================

export async function getRekapAbsensiAction(kelasId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: kelas } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*), semester(*)')
      .eq('id', kelasId)
      .maybeSingle()
    if (!kelas) return { success: false, error: 'Kelas tidak ditemukan' }

    // Get all pertemuan for this kelas
    const { data: pertemuan } = await adminClient
      .from('pertemuan')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('pertemuan_ke', { ascending: true })

    if (!pertemuan || pertemuan.length === 0) {
      return { success: true, data: [], pertemuan: [], kelas }
    }

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

    // Get all absensi records for this kelas's pertemuan
    const pertemuanIds = pertemuan.map(p => p.id)
    const { data: absensiList } = await adminClient
      .from('absensi')
      .select('*')
      .in('pertemuan_id', pertemuanIds)

    // Build matrix
    const absensiByMhs: Record<string, Record<string, string>> = {}
    for (const a of absensiList || []) {
      if (!absensiByMhs[a.mahasiswa_id]) absensiByMhs[a.mahasiswa_id] = {}
      absensiByMhs[a.mahasiswa_id][a.pertemuan_id] = a.status
    }

    const totalPertemuan = pertemuan.length
    const result = (mahasiswaList || []).map(m => {
      const rekap: Record<string, string> = {}
      let hadir = 0
      for (const p of pertemuan) {
        const status = absensiByMhs[m.id]?.[p.id] || ''
        rekap[`p_${p.pertemuan_ke}`] = status
        if (status === 'hadir') hadir++
      }
      const persentase = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 0
      return {
        mahasiswa_id: m.id,
        nim: m.nim,
        nama_lengkap: m.nama_lengkap,
        rekap,
        hadir,
        total_pertemuan: totalPertemuan,
        persentase,
        is_below_75: persentase < 75,
      }
    })

    return { success: true, data: result, pertemuan, kelas }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// MAHASISWA — GET MY ABSENSI
// ============================================================

export async function getMyAbsensiAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan', data: [] }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: [] }

    // Get approved KRS with kelas
    const { data: krs } = await adminClient
      .from('krs')
      .select('id')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .eq('status', 'disetujui')
      .maybeSingle()
    if (!krs) return { success: true, data: [], semester: sem }

    const { data: krsDetails } = await adminClient
      .from('krs_detail')
      .select('kelas_id')
      .eq('krs_id', krs.id)

    const kelasIds = (krsDetails || []).map(d => d.kelas_id)
    if (kelasIds.length === 0) return { success: true, data: [], semester: sem }

    const { data: kelasList } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*)')
      .in('id', kelasIds)

    const result = await Promise.all((kelasList || []).map(async (kelas) => {
      const { data: pertemuan } = await adminClient
        .from('pertemuan')
        .select('*')
        .eq('kelas_id', kelas.id)
        .order('pertemuan_ke', { ascending: true })

      const pertemuanIds = (pertemuan || []).map(p => p.id)
      const { data: absensi } = await adminClient
        .from('absensi')
        .select('*')
        .in('pertemuan_id', pertemuanIds)
        .eq('mahasiswa_id', mhs.id)

      const absensiMap = new Map((absensi || []).map(a => [a.pertemuan_id, a]))
      const detail = (pertemuan || []).map(p => ({
        pertemuan_ke: p.pertemuan_ke,
        tanggal: p.tanggal,
        materi: p.materi,
        status: absensiMap.get(p.id)?.status || null,
        keterangan: absensiMap.get(p.id)?.keterangan || null,
      }))

      const hadir = detail.filter(d => d.status === 'hadir').length
      const total = detail.length
      const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0

      return {
        kelas_id: kelas.id,
        nama_kelas: kelas.nama_kelas,
        mata_kuliah: kelas.mata_kuliah,
        total_pertemuan: total,
        hadir,
        izin: detail.filter(d => d.status === 'izin').length,
        sakit: detail.filter(d => d.status === 'sakit').length,
        alpa: detail.filter(d => d.status === 'alpa').length,
        persentase,
        detail,
      }
    }))

    return { success: true, data: result, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// ADMIN — GET ALL ABSENSI MONITORING
// ============================================================

export async function getAdminAbsensiAction(params?: {
  prodiId?: string
  semesterId?: string
  dosenId?: string
}) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const semId = params?.semesterId
    if (!semId) {
      const { data: sem } = await adminClient
        .from('semester')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()
      if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: [], semester: null }
      return await getAdminAbsensiAction({ ...params, semesterId: sem.id })
    }

    let query = adminClient
      .from('kelas')
      .select('*, mata_kuliah(*, program_studi(id, nama, kode)), semester(*), dosen(id, nidn, nama_lengkap)')
      .eq('semester_id', semId)

    if (params?.prodiId) {
      query = query.eq('mata_kuliah.program_studi_id', params.prodiId)
    }
    if (params?.dosenId) {
      query = query.eq('dosen_id', params.dosenId)
    }

    const { data: kelasList } = await query.order('nama_kelas', { ascending: true })

    const enriched = await Promise.all((kelasList || []).map(async (k) => {
      const { count: totalPertemuan } = await adminClient
        .from('pertemuan')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const { count: filled } = await adminClient
        .from('pertemuan')
        .select('*, absensi!inner(id)', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const { data: lastPertemuan } = await adminClient
        .from('pertemuan')
        .select('tanggal')
        .eq('kelas_id', k.id)
        .order('pertemuan_ke', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...k,
        total_pertemuan: totalPertemuan || 0,
        filled_pertemuan: filled || 0,
        last_pertemuan_tanggal: lastPertemuan?.tanggal || null,
        is_complete: filled === totalPertemuan && (totalPertemuan || 0) > 0,
      }
    }))

    return { success: true, data: enriched }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}
