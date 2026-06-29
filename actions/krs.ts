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
// KRS — GET OR CREATE (Mahasiswa)
// ============================================================

export async function getOrCreateKrsAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs, error: mhsErr } = await adminClient
      .from('mahasiswa')
      .select('id, program_studi_id, dosen_pa_id, nama_lengkap, nim')
      .eq('user_id', user.id)
      .maybeSingle()
    if (mhsErr) throw mhsErr
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    const { data: sem, error: semErr } = await adminClient
      .from('semester')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (semErr) throw semErr
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    let krs = await adminClient
      .from('krs')
      .select('*')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .maybeSingle()

    if (krs.error) throw krs.error

    if (!krs.data) {
      const { data: newKrs, error: createErr } = await adminClient
        .from('krs')
        .insert({
          mahasiswa_id: mhs.id,
          semester_id: sem.id,
          status: 'draft',
        })
        .select()
        .single()
      if (createErr) throw createErr
      krs.data = newKrs
    }

    return {
      success: true,
      data: {
        krs: krs.data,
        mahasiswa: mhs,
        semester_id: sem.id,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — GET AVAILABLE KELAS (Mahasiswa)
// ============================================================

export async function getAvailableKelasAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs, error: mhsErr } = await adminClient
      .from('mahasiswa')
      .select('id, program_studi_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (mhsErr) throw mhsErr
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    const { data: sem, error: semErr } = await adminClient
      .from('semester')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (semErr) throw semErr
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    const { data: krsData } = await adminClient
      .from('krs')
      .select('id')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .maybeSingle()

    const kelasTerdaftar = krsData
      ? (await adminClient.from('krs_detail').select('kelas_id').eq('krs_id', krsData.id)).data?.map(kd => kd.kelas_id) || []
      : []

    const { data: kelas, error: kelasErr } = await adminClient
      .from('kelas')
      .select('*, mata_kuliah(*), dosen(nama_lengkap), semester(*), jadwal(*)')
      .eq('semester_id', sem.id)
      .in('mata_kuliah.program_studi_id', [mhs.program_studi_id])
      .order('created_at', { ascending: true })

    if (kelasErr) throw kelasErr

    const enriched = await Promise.all((kelas || []).map(async (k) => {
      const { count } = await adminClient
        .from('krs_detail')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', k.id)

      const enrolled = count || 0
      const sudahDiambil = kelasTerdaftar.includes(k.id)
      const penuh = enrolled >= k.kapasitas

      return { ...k, enrolled_count: enrolled, sudah_diambil: sudahDiambil, penuh }
    }))

    return { success: true, data: enriched }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [] }
  }
}

// ============================================================
// KRS — ADD KELAS
// ============================================================

function getMaxSksByIpk(ipk: number | null): number {
  if (ipk === null) return 24
  if (ipk >= 3.0) return 24
  if (ipk >= 2.5) return 22
  if (ipk >= 2.0) return 20
  return 18
}

export async function addKelasToKrsAction(kelasId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs, error: mhsErr } = await adminClient
      .from('mahasiswa')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (mhsErr) throw mhsErr
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    // Student status guard
    if (mhs.status !== 'aktif') {
      return { success: false, error: 'Mahasiswa dengan status non-aktif tidak dapat mengambil KRS' }
    }

    const krsRes = await getOrCreateKrsAction()
    if (!krsRes.success || !krsRes.data) return { success: false, error: 'Gagal mendapatkan KRS' }
    const krsId = krsRes.data.krs.id
    const semesterId = krsRes.data.semester_id

    if (krsRes.data.krs.status !== 'draft' && krsRes.data.krs.status !== 'ditolak') {
      return { success: false, error: 'KRS sudah diajukan, tidak bisa diubah' }
    }

    const { data: detailExists } = await adminClient
      .from('krs_detail')
      .select('id')
      .eq('krs_id', krsId)
      .eq('kelas_id', kelasId)
      .maybeSingle()
    if (detailExists) return { success: false, error: 'Kelas sudah terdaftar di KRS' }

    // Capacity check
    const { data: kelasData } = await adminClient
      .from('kelas')
      .select('kapasitas')
      .eq('id', kelasId)
      .single()
    if (kelasData) {
      const { count } = await adminClient
        .from('krs_detail')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', kelasId)
      if (count && count >= kelasData.kapasitas) {
        return { success: false, error: 'Kelas sudah penuh' }
      }
    }

    // Get existing enrolled kelas
    const { data: allDetail } = await adminClient
      .from('krs_detail')
      .select('kelas_id')
      .eq('krs_id', krsId)
    const existingKelasIds = (allDetail || []).map(d => d.kelas_id)

    // Schedule conflict check
    const { data: jadwalBaru } = await adminClient
      .from('jadwal')
      .select('hari, jam_mulai, jam_selesai')
      .eq('kelas_id', kelasId)

    if (jadwalBaru && jadwalBaru.length > 0 && existingKelasIds.length > 0) {
      const { data: jadwalExisting } = await adminClient
        .from('jadwal')
        .select('hari, jam_mulai, jam_selesai')
        .in('kelas_id', existingKelasIds)

      if (jadwalExisting) {
        for (const baru of jadwalBaru) {
          for (const lama of jadwalExisting) {
            if (baru.hari !== lama.hari) continue
            const bMulai = baru.jam_mulai
            const bSelesai = baru.jam_selesai
            const lMulai = lama.jam_mulai
            const lSelesai = lama.jam_selesai
            if (bMulai < lSelesai && bSelesai > lMulai) {
              return { success: false, error: `Jadwal bentrok dengan kelas yang sudah diambil (${baru.hari} ${baru.jam_mulai?.slice(0,5)}-${baru.jam_selesai?.slice(0,5)})` }
            }
          }
        }
      }
    }

    // Total SKS calculation
    let totalSks = 0
    let newMatkulId: string | null = null
    let newSks = 0

    if (existingKelasIds.length > 0) {
      const { data: kelasSks } = await adminClient
        .from('kelas')
        .select('mata_kuliah_id')
        .in('id', existingKelasIds)
      if (kelasSks && kelasSks.length > 0) {
        const mkIds = kelasSks.map(k => k.mata_kuliah_id)
        const { data: mkSks } = await adminClient
          .from('mata_kuliah')
          .select('id, sks')
          .in('id', mkIds)
        totalSks = (mkSks || []).reduce((sum, m) => sum + m.sks, 0)
      }
    }

    const { data: newKelas } = await adminClient
      .from('kelas')
      .select('mata_kuliah_id')
      .eq('id', kelasId)
      .single()
    if (newKelas) {
      newMatkulId = newKelas.mata_kuliah_id
      const { data: mkBaru } = await adminClient
        .from('mata_kuliah')
        .select('sks')
        .eq('id', newMatkulId)
        .single()
      if (mkBaru) newSks = mkBaru.sks

      // Prerequisite check
      const { data: prereqs } = await adminClient
        .from('mata_kuliah_prerequisite')
        .select('prerequisite_id')
        .eq('mata_kuliah_id', newMatkulId)

      if (prereqs && prereqs.length > 0) {
        const prereqIds = prereqs.map(p => p.prerequisite_id)
        const { data: prereqMatkul } = await adminClient
          .from('mata_kuliah')
          .select('id, kode_matkul, nama')
          .in('id', prereqIds)

        for (const prereq of prereqMatkul || []) {
          const { data: nilaiLulus } = await adminClient
            .from('nilai_akhir')
            .select('nilai_huruf')
            .eq('mahasiswa_id', mhs.id)
            .in('kelas_id', (
              await adminClient.from('kelas').select('id').eq('mata_kuliah_id', prereq.id)
            ).data?.map(k => k.id) || [])
            .gte('nilai_angka_akhir', 60)
            .maybeSingle()

          if (!nilaiLulus) {
            return { success: false, error: `Mata kuliah prasyarat "${prereq.kode_matkul} - ${prereq.nama}" belum lulus` }
          }
        }
      }

      // IPK-based SKS limit
      const { data: nilaiAkhirAll } = await adminClient
        .from('nilai_akhir')
        .select('nilai_angka_akhir, kelas!inner(mata_kuliah(sks))')
        .eq('mahasiswa_id', mhs.id)
      let totalBobot = 0
      let totalSksKum = 0
      for (const na of nilaiAkhirAll || []) {
        const sks = (na.kelas as any)?.mata_kuliah?.sks || 0
        if (na.nilai_angka_akhir !== null && sks > 0) {
          totalBobot += na.nilai_angka_akhir * sks
          totalSksKum += sks
        }
      }
      const ipk = totalSksKum > 0 ? totalBobot / totalSksKum / 25 : null
      const maxSks = getMaxSksByIpk(ipk)

      if (totalSks + newSks > maxSks) {
        return { success: false, error: `Total SKS melebihi batas maksimal ${maxSks} (IPK ${ipk?.toFixed(2) || '—'}). Saat ini ${totalSks} + ${newSks} = ${totalSks + newSks}` }
      }
    }

    const { error: insertErr } = await adminClient
      .from('krs_detail')
      .insert({ krs_id: krsId, kelas_id: kelasId })
    if (insertErr) throw insertErr

    revalidatePath('/mahasiswa/krs')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — REMOVE KELAS
// ============================================================

export async function removeKelasFromKrsAction(detailId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: detail, error: detErr } = await adminClient
      .from('krs_detail')
      .select('krs_id')
      .eq('id', detailId)
      .single()
    if (detErr) throw detErr

    const { data: krs } = await adminClient
      .from('krs')
      .select('status')
      .eq('id', detail.krs_id)
      .single()

    if (krs && krs.status !== 'draft' && krs.status !== 'ditolak') {
      return { success: false, error: 'KRS sudah diajukan, tidak bisa diubah' }
    }

    const { error: delErr } = await adminClient
      .from('krs_detail')
      .delete()
      .eq('id', detailId)
    if (delErr) throw delErr

    revalidatePath('/mahasiswa/krs')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — SUBMIT (draft → diajukan)
// ============================================================

export async function submitKrsAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('id, status')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .maybeSingle()
    if (!krs) return { success: false, error: 'KRS tidak ditemukan' }
    if (krs.status !== 'draft' && krs.status !== 'ditolak') {
      return { success: false, error: 'KRS sudah diajukan' }
    }

    const { count } = await adminClient
      .from('krs_detail')
      .select('*', { count: 'exact', head: true })
      .eq('krs_id', krs.id)
    if (!count || count === 0) {
      return { success: false, error: 'KRS masih kosong, tambah minimal 1 kelas' }
    }

    const { error: updateErr } = await adminClient
      .from('krs')
      .update({ status: 'diajukan', tanggal_pengajuan: new Date().toISOString() })
      .eq('id', krs.id)
    if (updateErr) throw updateErr

    revalidatePath('/mahasiswa/krs')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — GET MY KRS DETAIL (Mahasiswa)
// ============================================================

export async function getMyKrsDetailAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id, dosen_pa_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('*, krs_detail(*, kelas!inner(*, mata_kuliah(*), dosen(nama_lengkap), jadwal(*)))')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .maybeSingle()

    if (!krs) {
      return { success: true, data: null }
    }

    let totalSks = 0
    for (const detail of krs.krs_detail || []) {
      if (detail.kelas?.mata_kuliah?.sks) {
        totalSks += detail.kelas.mata_kuliah.sks
      }
    }

    let dosenPaName = null
    if (mhs.dosen_pa_id) {
      const { data: d } = await adminClient
        .from('dosen')
        .select('nama_lengkap')
        .eq('id', mhs.dosen_pa_id)
        .single()
      dosenPaName = d?.nama_lengkap
    }

    return { success: true, data: { ...krs, total_sks: totalSks, dosen_pa_nama: dosenPaName } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS BIMBINGAN — GET LIST (Dosen PA)
// ============================================================

export async function getKrsBimbinganAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: dosen } = await adminClient
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dosen) return { success: false, error: 'Data dosen tidak ditemukan' }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    const { data: mahasiswaList } = await adminClient
      .from('mahasiswa')
      .select('id, nim, nama_lengkap, program_studi(kode, nama)')
      .eq('dosen_pa_id', dosen.id)
      .order('nim', { ascending: true })

    if (!mahasiswaList || mahasiswaList.length === 0) {
      return { success: true, data: [], semester: sem }
    }

    const mhsIds = mahasiswaList.map(m => m.id)

    const { data: krsList } = await adminClient
      .from('krs')
      .select('id, mahasiswa_id, status, tanggal_pengajuan, catatan_dosen_pa')
      .in('mahasiswa_id', mhsIds)
      .eq('semester_id', sem.id)

    const enriched = mahasiswaList.map(m => {
      const krs = krsList?.find(k => k.mahasiswa_id === m.id) || null
      return { ...m, krs }
    })

    return { success: true, data: enriched, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS BIMBINGAN — GET DETAIL (Dosen PA)
// ============================================================

export async function getKrsBimbinganDetailAction(krsId: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: dosen } = await adminClient
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dosen) return { success: false, error: 'Data dosen tidak ditemukan' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('*, mahasiswa(nim, nama_lengkap, program_studi(kode, nama)), krs_detail(*, kelas!inner(*, mata_kuliah(*), dosen(nama_lengkap), jadwal(*)))')
      .eq('id', krsId)
      .maybeSingle()

    if (!krs) return { success: false, error: 'KRS tidak ditemukan' }

    const { data: dosenBimbingan } = await adminClient
      .from('mahasiswa')
      .select('dosen_pa_id')
      .eq('id', krs.mahasiswa_id)
      .single()
    if (dosenBimbingan?.dosen_pa_id !== dosen.id) {
      return { success: false, error: 'Anda bukan PA mahasiswa ini' }
    }

    let totalSks = 0
    for (const detail of krs.krs_detail || []) {
      if (detail.kelas?.mata_kuliah?.sks) {
        totalSks += detail.kelas.mata_kuliah.sks
      }
    }

    return { success: true, data: { ...krs, total_sks: totalSks } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — APPROVE (Dosen PA)
// ============================================================

export async function approveKrsAction(krsId: string, catatan?: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: dosen } = await adminClient
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dosen) return { success: false, error: 'Data dosen tidak ditemukan' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('mahasiswa_id, status')
      .eq('id', krsId)
      .single()
    if (!krs) return { success: false, error: 'KRS tidak ditemukan' }
    if (krs.status !== 'diajukan') return { success: false, error: 'KRS belum diajukan atau sudah diproses' }

    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('dosen_pa_id')
      .eq('id', krs.mahasiswa_id)
      .single()
    if (mhs?.dosen_pa_id !== dosen.id) {
      return { success: false, error: 'Anda bukan PA mahasiswa ini' }
    }

    const { error: updateErr } = await adminClient
      .from('krs')
      .update({
        status: 'disetujui',
        disetujui_oleh: dosen.id,
        catatan_dosen_pa: catatan || null,
      })
      .eq('id', krsId)
    if (updateErr) throw updateErr

    revalidatePath('/dosen/krs-bimbingan')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS — REJECT (Dosen PA)
// ============================================================

export async function rejectKrsAction(krsId: string, catatan: string) {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (!catatan.trim()) return { success: false, error: 'Catatan wajib diisi untuk reject' }

  try {
    const { data: dosen } = await adminClient
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dosen) return { success: false, error: 'Data dosen tidak ditemukan' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('mahasiswa_id, status')
      .eq('id', krsId)
      .single()
    if (!krs) return { success: false, error: 'KRS tidak ditemukan' }
    if (krs.status !== 'diajukan') return { success: false, error: 'KRS belum diajukan atau sudah diproses' }

    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('dosen_pa_id')
      .eq('id', krs.mahasiswa_id)
      .single()
    if (mhs?.dosen_pa_id !== dosen.id) {
      return { success: false, error: 'Anda bukan PA mahasiswa ini' }
    }

    const { error: updateErr } = await adminClient
      .from('krs')
      .update({
        status: 'ditolak',
        disetujui_oleh: dosen.id,
        catatan_dosen_pa: catatan,
      })
      .eq('id', krsId)
    if (updateErr) throw updateErr

    revalidatePath('/dosen/krs-bimbingan')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ============================================================
// KRS ADMIN — GET ALL
// ============================================================

export async function getAllKrsAdminAction(params: {
  search?: string
  prodiId?: string
  status?: string
  semesterId?: string
  page?: number
  limit?: number
}) {
  const adminClient = getAdminClient()
  const { search, prodiId, status, semesterId, page = 1, limit = 20 } = params

  try {
    let semFilter = semesterId
    if (!semFilter) {
      const { data: sem } = await adminClient
        .from('semester')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()
      if (sem) semFilter = sem.id
    }

    let query = adminClient
      .from('krs')
      .select('*, mahasiswa!inner(nim, nama_lengkap, program_studi_id, program_studi(kode, nama), dosen_pa(nama_lengkap)), semester(nama, tahun_akademik)', { count: 'exact' })

    if (semFilter) query = query.eq('semester_id', semFilter)
    if (status && status !== 'all') query = query.eq('status', status)
    if (prodiId && prodiId !== 'all') query = query.eq('mahasiswa.program_studi_id', prodiId)
    if (search) {
      query = query.or(`mahasiswa.nama_lengkap.ilike.%${search}%,mahasiswa.nim.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const enriched = await Promise.all((data || []).map(async (krs) => {
      const { count: totalKelas } = await adminClient
        .from('krs_detail')
        .select('*', { count: 'exact', head: true })
        .eq('krs_id', krs.id)

      const { data: details } = await adminClient
        .from('krs_detail')
        .select('kelas_id')
        .eq('krs_id', krs.id)

      let totalSks = 0
      if (details && details.length > 0) {
        const kelasIds = details.map(d => d.kelas_id)
        const { data: kelasList } = await adminClient
          .from('kelas')
          .select('mata_kuliah_id')
          .in('id', kelasIds)
        if (kelasList && kelasList.length > 0) {
          const mkIds = kelasList.map(k => k.mata_kuliah_id)
          const { data: mkList } = await adminClient
            .from('mata_kuliah')
            .select('sks')
            .in('id', mkIds)
          totalSks = (mkList || []).reduce((sum, m) => sum + m.sks, 0)
        }
      }

      return { ...krs, total_kelas: totalKelas || 0, total_sks: totalSks }
    }))

    return { success: true, data: enriched, count: count || 0 }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: [], count: 0 }
  }
}

// ============================================================
// KRS ADMIN — GET DETAIL
// ============================================================

export async function getKrsAdminDetailAction(krsId: string) {
  const adminClient = getAdminClient()

  try {
    const { data: krs, error } = await adminClient
      .from('krs')
      .select('*, mahasiswa(nim, nama_lengkap, program_studi(kode, nama), dosen_pa(nama_lengkap)), semester(nama, tahun_akademik), krs_detail(*, kelas!inner(*, mata_kuliah(*), dosen(nama_lengkap), jadwal(*)))')
      .eq('id', krsId)
      .maybeSingle()

    if (error) throw error
    if (!krs) return { success: false, error: 'KRS tidak ditemukan' }

    let totalSks = 0
    for (const detail of krs.krs_detail || []) {
      if (detail.kelas?.mata_kuliah?.sks) totalSks += detail.kelas.mata_kuliah.sks
    }

    return { success: true, data: { ...krs, total_sks: totalSks } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
