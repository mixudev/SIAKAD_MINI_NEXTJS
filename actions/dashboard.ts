'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

export async function getAdminDashboardAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()

    const { count: totalMahasiswa } = await adminClient
      .from('mahasiswa')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif')

    const { count: totalDosen } = await adminClient
      .from('dosen')
      .select('*', { count: 'exact', head: true })

    const { count: totalMatkul } = await adminClient
      .from('mata_kuliah')
      .select('*', { count: 'exact', head: true })

    let totalKelas = 0
    if (sem) {
      const { count } = await adminClient
        .from('kelas')
        .select('*', { count: 'exact', head: true })
        .eq('semester_id', sem.id)
      totalKelas = count || 0
    }

    const { data: recentKrs } = await adminClient
      .from('krs')
      .select('*, mahasiswa(nim, nama_lengkap), semester(nama)')
      .eq('status', 'diajukan')
      .order('tanggal_pengajuan', { ascending: false })
      .limit(5)

    return {
      success: true,
      totalMahasiswa: totalMahasiswa || 0,
      totalDosen: totalDosen || 0,
      totalMatkul: totalMatkul || 0,
      totalKelas,
      semester: sem,
      recentKrs: recentKrs || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function getDosenDashboardAction() {
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

    const { data: kelasList } = await adminClient
      .from('kelas')
      .select('id')
      .eq('dosen_id', dosen.id)
      .eq('semester_id', sem.id)

    const kelasIds = (kelasList || []).map(k => k.id)
    const totalKelas = kelasIds.length

    let totalMahasiswaAmpu = 0
    let totalPertemuan = 0
    let totalPertemuanTerisi = 0

    if (kelasIds.length > 0) {
      const { count: mhsCount } = await adminClient
        .from('krs_detail')
        .select('*, krs!inner(status)', { count: 'exact', head: true })
        .in('kelas_id', kelasIds)
        .eq('krs.status', 'disetujui')
      totalMahasiswaAmpu = mhsCount || 0

      const { data: pertemuanList } = await adminClient
        .from('pertemuan')
        .select('id')
        .in('kelas_id', kelasIds)
      totalPertemuan = (pertemuanList || []).length

      if (totalPertemuan > 0) {
        const pertemuanIds = (pertemuanList || []).map(p => p.id)
        const { data: absenData } = await adminClient
          .from('absensi')
          .select('pertemuan_id')
          .in('pertemuan_id', pertemuanIds)
        const unique = new Set((absenData || []).map(a => a.pertemuan_id))
        totalPertemuanTerisi = unique.size
      }
    }

    const { count: krsMenunggu } = await adminClient
      .from('mahasiswa')
      .select('*, krs!inner(id)', { count: 'exact', head: true })
      .eq('dosen_pa_id', dosen.id)
      .eq('krs.status', 'diajukan')
      .eq('krs.semester_id', sem.id)

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const todayName = days[new Date().getDay()]

    const { data: jadwalHariIni } = await adminClient
      .from('jadwal')
      .select('*, kelas!inner(*, mata_kuliah(*))')
      .in('kelas_id', kelasIds)
      .eq('hari', todayName)
      .order('jam_mulai', { ascending: true })

    return {
      success: true,
      totalKelas,
      totalMahasiswaAmpu,
      totalPertemuan,
      totalPertemuanTerisi,
      krsMenunggu: krsMenunggu || 0,
      jadwalHariIni: jadwalHariIni || [],
      semester: sem,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function getMahasiswaDashboardAction() {
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
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif' }

    const { data: krs } = await adminClient
      .from('krs')
      .select('id, status')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .maybeSingle()

    let totalSks = 0
    let kelasIds: string[] = []

    if (krs) {
      const { data: details } = await adminClient
        .from('krs_detail')
        .select('kelas_id')
        .eq('krs_id', krs.id)
      kelasIds = (details || []).map(d => d.kelas_id)

      if (kelasIds.length > 0) {
        const { data: kelasList } = await adminClient
          .from('kelas')
          .select('mata_kuliah(sks)')
          .in('id', kelasIds)
        totalSks = (kelasList || []).reduce((sum, k) => sum + ((k.mata_kuliah as any)?.sks || 0), 0)
      }
    }

    const { data: semuaNilaiAkhir } = await adminClient
      .from('nilai_akhir')
      .select('*, kelas!inner(mata_kuliah(sks))')
      .eq('mahasiswa_id', mhs.id)

    let totalNilaiBobot = 0
    let totalSksKumulatif = 0
    for (const na of semuaNilaiAkhir || []) {
      const sks = na.kelas?.mata_kuliah?.sks || 0
      if (na.nilai_angka_akhir !== null) {
        totalNilaiBobot += na.nilai_angka_akhir * sks
        totalSksKumulatif += sks
      }
    }
    const ipk = totalSksKumulatif > 0 ? totalNilaiBobot / totalSksKumulatif / 25 : 0

    let totalHadir = 0
    let totalAbsen = 0

    if (kelasIds.length > 0) {
      const { data: pertemuanIds } = await adminClient
        .from('pertemuan')
        .select('id')
        .in('kelas_id', kelasIds)
      const pIds = (pertemuanIds || []).map(p => p.id)

      if (pIds.length > 0) {
        const { data: absensi } = await adminClient
          .from('absensi')
          .select('status')
          .in('pertemuan_id', pIds)
          .eq('mahasiswa_id', mhs.id)
        totalHadir = (absensi || []).filter(a => a.status === 'hadir').length
        totalAbsen = (absensi || []).length
      }
    }

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const todayName = days[new Date().getDay()]

    const { data: jadwalHariIni } = await adminClient
      .from('jadwal')
      .select('*, kelas!inner(*, mata_kuliah(*))')
      .in('kelas_id', kelasIds)
      .eq('hari', todayName)
      .order('jam_mulai', { ascending: true })

    return {
      success: true,
      krsStatus: krs?.status || null,
      totalSks,
      ipk: Math.round(ipk * 100) / 100,
      kehadiranPersen: totalAbsen > 0 ? Math.round((totalHadir / totalAbsen) * 10000) / 100 : 0,
      jadwalHariIni: jadwalHariIni || [],
      semester: sem,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function getMahasiswaJadwalAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan', data: {} as Record<string, any[]> }

    const { data: sem } = await adminClient
      .from('semester')
      .select('id, nama, tahun_akademik')
      .eq('is_active', true)
      .maybeSingle()
    if (!sem) return { success: false, error: 'Tidak ada semester aktif', data: {} as Record<string, any[]> }

    const { data: krs } = await adminClient
      .from('krs')
      .select('id')
      .eq('mahasiswa_id', mhs.id)
      .eq('semester_id', sem.id)
      .eq('status', 'disetujui')
      .maybeSingle()
    if (!krs) return { success: true, data: {} as Record<string, any[]>, semester: sem }

    const { data: details } = await adminClient
      .from('krs_detail')
      .select('kelas_id')
      .eq('krs_id', krs.id)
    const kelasIds = (details || []).map(d => d.kelas_id)
    if (kelasIds.length === 0) return { success: true, data: {} as Record<string, any[]>, semester: sem }

    const { data: jadwal } = await adminClient
      .from('jadwal')
      .select('*, kelas!inner(*, mata_kuliah(*), dosen(id, nidn, nama_lengkap))')
      .in('kelas_id', kelasIds)
      .order('jam_mulai', { ascending: true })

    const sortedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const grouped: Record<string, any[]> = {}
    for (const day of sortedDays) grouped[day] = []
    for (const j of jadwal || []) {
      if (grouped[j.hari]) grouped[j.hari].push(j)
    }

    return { success: true, data: grouped as Record<string, any[]>, semester: sem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message, data: {} as Record<string, any[]> }
  }
}

export async function getTranskripAction() {
  const adminClient = getAdminClient()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const { data: mhs } = await adminClient
      .from('mahasiswa')
      .select('id, nim, nama_lengkap, program_studi(nama, singkatan)')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mhs) return { success: false, error: 'Data mahasiswa tidak ditemukan' }

    const { data: krsList } = await adminClient
      .from('krs')
      .select('id, semester_id, semester!inner(nama, tahun_akademik)')
      .eq('mahasiswa_id', mhs.id)
      .eq('status', 'disetujui')
      .order('semester_id', { ascending: false })

    const semesterData = await Promise.all((krsList || []).map(async (krs) => {
      const { data: details } = await adminClient
        .from('krs_detail')
        .select('kelas_id')
        .eq('krs_id', krs.id)
      const kelasIds = (details || []).map(d => d.kelas_id)

      if (kelasIds.length === 0) return null

      const { data: kelasList } = await adminClient
        .from('kelas')
        .select('*, mata_kuliah(*)')
        .in('id', kelasIds)

      const { data: nilaiAkhirList } = await adminClient
        .from('nilai_akhir')
        .select('*')
        .eq('mahasiswa_id', mhs.id)
        .in('kelas_id', kelasIds)

      let semesterSks = 0
      let semesterBobot = 0
      const matkulList = (kelasList || []).map(kelas => {
        const sks = kelas.mata_kuliah?.sks || 0
        const na = (nilaiAkhirList || []).find(n => n.kelas_id === kelas.id)
        const angka = na?.nilai_angka_akhir ?? null
        semesterSks += sks
        if (angka !== null) {
          semesterBobot += angka * sks
        }
        return {
          kode_matkul: kelas.mata_kuliah?.kode_matkul || '',
          nama_matkul: kelas.mata_kuliah?.nama || '',
          sks,
          nilai_angka: angka,
          nilai_huruf: na?.nilai_huruf || null,
        }
      })

      const ips = semesterSks > 0 ? semesterBobot / semesterSks / 25 : 0

      return {
        semester: krs.semester,
        ips: Math.round(ips * 100) / 100,
        totalSks: semesterSks,
        matkul: matkulList,
      }
    }))

    const filtered = (semesterData || []).filter(Boolean) as NonNullable<typeof semesterData[number]>[]

    let totalBobotKum = 0
    let totalSksKum = 0
    for (const sem of filtered) {
      for (const m of sem.matkul) {
        if (m.nilai_angka !== null) {
          totalBobotKum += m.nilai_angka * m.sks
          totalSksKum += m.sks
        }
      }
    }
    const ipkKumulatif = totalSksKum > 0 ? totalBobotKum / totalSksKum / 25 : 0

    return {
      success: true,
      mahasiswa: mhs,
      transkrip: filtered,
      ipkKumulatif: Math.round(ipkKumulatif * 100) / 100,
      totalSksKumulatif: totalSksKum,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
