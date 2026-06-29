import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const PW = 'password'

function uid(type: string, seq: number): string {
  return `${type}000000-0000-0000-0000-${seq.toString().padStart(12, '0')}`
}

// ── Master Data ──
const PRODI = [
  { id: uid('a0', 1), nama: 'Teknik Informatika', kode: 'TI' },
  { id: uid('a0', 2), nama: 'Sistem Informasi', kode: 'SI' },
  { id: uid('a0', 3), nama: 'Manajemen Bisnis', kode: 'MB' },
]

const SEMESTER = [
  { id: uid('a1', 1), nama: 'Ganjil 2024/2025', ta: '2024/2025', mulai: '2024-09-01', selesai: '2025-01-31', aktif: false },
  { id: uid('a1', 2), nama: 'Genap 2024/2025', ta: '2024/2025', mulai: '2025-02-01', selesai: '2025-06-30', aktif: false },
  { id: uid('a1', 3), nama: 'Ganjil 2025/2026', ta: '2025/2026', mulai: '2025-09-01', selesai: '2026-01-31', aktif: true },
]

const AUTH_USERS = [
  { id: uid('a2', 1), username: 'admin.siakad', role: 'admin', nama: 'Administrator SIAKAD' },
  { id: uid('a2', 2), username: '0123456789', role: 'dosen', nama: 'Dr. Budi Santoso, M.Kom' },
  { id: uid('a2', 3), username: '2021310045', role: 'mahasiswa', nama: 'Rina Aulia Putri' },
  { id: uid('a2', 4), username: '9876543210', role: 'dosen', nama: 'Dra. Siti Rahmawati, M.Pd' },
  { id: uid('a2', 5), username: '1111111111', role: 'dosen', nama: 'Hendra Gunawan, S.Kom, M.Kom' },
  { id: uid('a2', 6), username: '2222222222', role: 'dosen', nama: 'Dr. Dewi Sartika, M.Si' },
  { id: uid('a2', 7), username: '3333333333', role: 'dosen', nama: 'Ahmad Fauzi, S.Si, M.T' },
  { id: uid('a2', 8), username: '2021310050', role: 'mahasiswa', nama: 'Dimas Ardiansyah' },
  { id: uid('a2', 9), username: '2022310010', role: 'mahasiswa', nama: 'Sarah Annisa' },
  { id: uid('a2', 10), username: '2022310015', role: 'mahasiswa', nama: 'Budi Prasetyo' },
  { id: uid('a2', 11), username: '2023310001', role: 'mahasiswa', nama: 'Citra Lestari' },
]

const DOSEN = [
  { id: uid('a3', 1), nidn: '0123456789', nama: 'Dr. Budi Santoso, M.Kom', prodi: uid('a0', 1), jabatan: 'Lektor Kepala' },
  { id: uid('a3', 2), nidn: '9876543210', nama: 'Dra. Siti Rahmawati, M.Pd', prodi: uid('a0', 2), jabatan: 'Lektor' },
  { id: uid('a3', 3), nidn: '1111111111', nama: 'Hendra Gunawan, S.Kom, M.Kom', prodi: uid('a0', 1), jabatan: 'Asisten Ahli' },
  { id: uid('a3', 4), nidn: '2222222222', nama: 'Dr. Dewi Sartika, M.Si', prodi: uid('a0', 3), jabatan: 'Lektor Kepala' },
  { id: uid('a3', 5), nidn: '3333333333', nama: 'Ahmad Fauzi, S.Si, M.T', prodi: uid('a0', 2), jabatan: 'Lektor' },
]

const MHS = [
  { id: uid('a4', 1), nim: '2021310045', nama: 'Rina Aulia Putri', prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 1) },
  { id: uid('a4', 2), nim: '2021310050', nama: 'Dimas Ardiansyah', prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 1) },
  { id: uid('a4', 3), nim: '2022310010', nama: 'Sarah Annisa', prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 2) },
  { id: uid('a4', 4), nim: '2022310015', nama: 'Budi Prasetyo', prodi: uid('a0', 3), angkatan: 2022, pa: uid('a3', 4) },
  { id: uid('a4', 5), nim: '2023310001', nama: 'Citra Lestari', prodi: uid('a0', 2), angkatan: 2023, pa: uid('a3', 5) },
]

// [id, kode, nama, sks, prodi_id, semester_ke]
const MATKUL = [
  [uid('a5', 1), 'TI101', 'Matematika Diskrit', 3, uid('a0', 1), 1],
  [uid('a5', 2), 'TI102', 'Algoritma & Pemrograman', 4, uid('a0', 1), 1],
  [uid('a5', 3), 'TI103', 'Basis Data', 3, uid('a0', 1), 2],
  [uid('a5', 4), 'TI104', 'Struktur Data', 3, uid('a0', 1), 2],
  [uid('a5', 5), 'TI105', 'Jaringan Komputer', 3, uid('a0', 1), 3],
  [uid('a5', 6), 'TI106', 'Sistem Operasi', 3, uid('a0', 1), 3],
  [uid('a5', 7), 'TI107', 'Rekayasa Perangkat Lunak', 3, uid('a0', 1), 4],
  [uid('a5', 8), 'TI108', 'Kecerdasan Buatan', 3, uid('a0', 1), 5],
  [uid('a5', 9), 'SI101', 'Pengantar Sistem Informasi', 3, uid('a0', 2), 1],
  [uid('a5', 10), 'SI102', 'Pemrograman Web', 4, uid('a0', 2), 2],
  [uid('a5', 11), 'SI103', 'Analisis Proses Bisnis', 3, uid('a0', 2), 3],
  [uid('a5', 12), 'SI104', 'Manajemen Proyek SI', 3, uid('a0', 2), 4],
  [uid('a5', 13), 'MB101', 'Pengantar Manajemen', 3, uid('a0', 3), 1],
  [uid('a5', 14), 'MB102', 'Akuntansi Dasar', 3, uid('a0', 3), 2],
  [uid('a5', 15), 'MB103', 'Manajemen Keuangan', 3, uid('a0', 3), 3],
  [uid('a5', 16), 'MB104', 'Perilaku Organisasi', 3, uid('a0', 3), 4],
]

// Pretty names for mata kuliah
const MK_NAMES = Object.fromEntries(MATKUL.map(m => [m[0] as string, m[1] as string]))

// Prerequisites [matkul_id, prereq_id]
const PREREQ = [
  [uid('a5', 3), uid('a5', 2)],  // Basis Data ← Algoritma
  [uid('a5', 4), uid('a5', 2)],  // Struktur Data ← Algoritma
  [uid('a5', 5), uid('a5', 3)],  // Jarkom ← Basis Data
  [uid('a5', 7), uid('a5', 4)],  // RPL ← Struktur Data
  [uid('a5', 8), uid('a5', 5)],  // AI ← Jarkom
  [uid('a5', 8), uid('a5', 4)],  // AI ← Struktur Data
  [uid('a5', 11), uid('a5', 9)], // Analisis Bisnis ← Pengantar SI
  [uid('a5', 15), uid('a5', 14)],// Manajemen Keuangan ← Akuntansi
]

// ── Kelas per semester ──
// Smt 1 (Ganjil 2024/25): 4 kelas
const SMT1_KLS = [
  { id: uid('a6', 1), matkul: uid('a5', 1), dosen: uid('a3', 1), nama: 'A', kap: 40 },
  { id: uid('a6', 2), matkul: uid('a5', 2), dosen: uid('a3', 3), nama: 'A', kap: 40 },
  { id: uid('a6', 3), matkul: uid('a5', 9), dosen: uid('a3', 2), nama: 'A', kap: 40 },
  { id: uid('a6', 4), matkul: uid('a5', 13), dosen: uid('a3', 4), nama: 'A', kap: 40 },
]

// Smt 2 (Genap 2024/25): 4 kelas
const SMT2_KLS = [
  { id: uid('a6', 5), matkul: uid('a5', 3), dosen: uid('a3', 1), nama: 'A', kap: 40 },
  { id: uid('a6', 6), matkul: uid('a5', 4), dosen: uid('a3', 3), nama: 'A', kap: 40 },
  { id: uid('a6', 7), matkul: uid('a5', 10), dosen: uid('a3', 5), nama: 'A', kap: 40 },
  { id: uid('a6', 8), matkul: uid('a5', 14), dosen: uid('a3', 4), nama: 'A', kap: 40 },
]

// Smt 3 (Ganjil 2025/26 - active): 8 kelas
const SMT3_KLS = [
  { id: uid('a6', 9), matkul: uid('a5', 5), dosen: uid('a3', 1), nama: 'A', kap: 40 },
  { id: uid('a6', 10), matkul: uid('a5', 6), dosen: uid('a3', 3), nama: 'A', kap: 40 },
  { id: uid('a6', 11), matkul: uid('a5', 7), dosen: uid('a3', 3), nama: 'A', kap: 40 },
  { id: uid('a6', 12), matkul: uid('a5', 8), dosen: uid('a3', 1), nama: 'A', kap: 40 },
  { id: uid('a6', 13), matkul: uid('a5', 11), dosen: uid('a3', 2), nama: 'A', kap: 40 },
  { id: uid('a6', 14), matkul: uid('a5', 12), dosen: uid('a3', 5), nama: 'A', kap: 40 },
  { id: uid('a6', 15), matkul: uid('a5', 15), dosen: uid('a3', 4), nama: 'A', kap: 40 },
  { id: uid('a6', 16), matkul: uid('a5', 16), dosen: uid('a3', 4), nama: 'A', kap: 40 },
]

const ALL_KELAS = [...SMT1_KLS, ...SMT2_KLS, ...SMT3_KLS]

// helper: find semester ID for a class
function semesterOfKelas(kelasId: string): string {
  const n = parseInt(kelasId.slice(-12))
  if (n <= 4) return uid('a1', 1)
  if (n <= 8) return uid('a1', 2)
  return uid('a1', 3)
}

const JADWAL = [
  { hari: 'Senin', mulai: '07:00', selesai: '09:30', ruang: 'R101' },
  { hari: 'Senin', mulai: '10:00', selesai: '12:30', ruang: 'R102' },
  { hari: 'Selasa', mulai: '07:00', selesai: '09:30', ruang: 'R103' },
  { hari: 'Selasa', mulai: '10:00', selesai: '12:30', ruang: 'R104' },
  { hari: 'Rabu', mulai: '07:00', selesai: '09:30', ruang: 'R101' },
  { hari: 'Rabu', mulai: '10:00', selesai: '12:30', ruang: 'R102' },
  { hari: 'Kamis', mulai: '07:00', selesai: '09:30', ruang: 'R103' },
  { hari: 'Kamis', mulai: '10:00', selesai: '12:30', ruang: 'R104' },
  { hari: 'Senin', mulai: '07:00', selesai: '09:30', ruang: 'R201' },
  { hari: 'Senin', mulai: '10:00', selesai: '12:30', ruang: 'R202' },
  { hari: 'Selasa', mulai: '07:00', selesai: '09:30', ruang: 'R201' },
  { hari: 'Selasa', mulai: '10:00', selesai: '12:30', ruang: 'R202' },
  { hari: 'Rabu', mulai: '07:00', selesai: '09:30', ruang: 'R203' },
  { hari: 'Rabu', mulai: '10:00', selesai: '12:30', ruang: 'R204' },
  { hari: 'Kamis', mulai: '07:00', selesai: '09:30', ruang: 'R203' },
  { hari: 'Kamis', mulai: '10:00', selesai: '12:30', ruang: 'R204' },
]

// ── Helpers ──
function angkaKeHuruf(a: number): string {
  if (a >= 85) return 'A'
  if (a >= 75) return 'B'
  if (a >= 65) return 'C'
  if (a >= 50) return 'D'
  return 'E'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchedUpsert(admin: any, table: string, rows: any[], conflictColumn = 'id') {
  if (rows.length === 0) return
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await admin.from(table).upsert(rows.slice(i, i + 50), { onConflict: conflictColumn })
    if (error) throw new Error(`[${table}] ${error.message}`)
  }
}

function genPertemuan(kelasId: string, namaMatkul: string, startDate: string, offset: number): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i * 7)
    result.push({
      id: uid('b0', offset + i + 1),
      kelas_id: kelasId,
      pertemuan_ke: i + 1,
      tanggal: d.toISOString().split('T')[0],
      materi: `${namaMatkul} — Pertemuan ${i + 1}`,
    })
  }
  return result
}

// ── Seed Logic ──
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const log: string[] = []

  try {
    // 1. Master data
    await batchedUpsert(admin, 'program_studi', PRODI, 'kode')
    log.push(`✅ ${PRODI.length} program studi`)

    await batchedUpsert(admin, 'semester', SEMESTER.map(s => ({
      id: s.id, nama: s.nama, tahun_akademik: s.ta,
      tanggal_mulai: s.mulai, tanggal_selesai: s.selesai, is_active: s.aktif,
    })))
    log.push(`✅ ${SEMESTER.length} semester`)

    await batchedUpsert(admin, 'mata_kuliah', MATKUL.map(m => ({
      id: m[0], kode_matkul: m[1], nama: m[2], sks: m[3], program_studi_id: m[4], semester_ke: m[5],
    })), 'kode_matkul')
    log.push(`✅ ${MATKUL.length} mata kuliah`)

    try {
      await batchedUpsert(admin, 'mata_kuliah_prerequisite', PREREQ.map((p, i) => ({
        id: uid('b4', i + 1), mata_kuliah_id: p[0], prerequisite_id: p[1],
      })))
      log.push(`✅ ${PREREQ.length} prerequisites`)
    } catch {
      log.push(`⚠️  prerequisites skipped (table mata_kuliah_prerequisite belum ada)`)
    }

    // 2. Auth users
    const userIdMap = new Map<string, string>()
    // Try to find existing shadow-email users first
    const { data: existingAuthList } = await admin.auth.admin.listUsers()
    const existingByEmail = new Map(
      (existingAuthList?.users ?? []).map(u => [u.email, u.id])
    )

    for (const u of AUTH_USERS) {
      const email = `${u.username}@internal.siakad.local`
      const existingId = existingByEmail.get(email)
      if (existingId) {
        userIdMap.set(u.username, existingId)
        continue
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: PW,
        email_confirm: true,
        app_metadata: { role: u.role },
        user_metadata: { nama_lengkap: u.nama },
      })
      if (error && !error.message.includes('already been registered')) {
        log.push(`❌ ${email}: ${error.message}`)
      }
      userIdMap.set(u.username, data?.user?.id ?? u.id)
    }
    log.push(`✅ ${AUTH_USERS.length} auth users`)

    await batchedUpsert(admin, 'users', AUTH_USERS.map(u => ({
      id: userIdMap.get(u.username)!,
      role: u.role,
      username: u.username,
    })), 'username')
    log.push(`✅ users profile`)

    await batchedUpsert(admin, 'dosen', DOSEN.map(d => ({
      id: d.id,
      user_id: userIdMap.get(d.nidn)!,
      nidn: d.nidn,
      nama_lengkap: d.nama,
      program_studi_id: d.prodi,
      jabatan_akademik: d.jabatan,
    })), 'nidn')
    log.push(`✅ ${DOSEN.length} dosen`)

    await batchedUpsert(admin, 'mahasiswa', MHS.map(m => ({
      id: m.id,
      user_id: userIdMap.get(m.nim)!,
      nim: m.nim,
      nama_lengkap: m.nama,
      program_studi_id: m.prodi,
      angkatan: m.angkatan,
      status: 'aktif',
      dosen_pa_id: m.pa,
    })), 'nim')
    log.push(`✅ ${MHS.length} mahasiswa`)

    // 3. Kelas
    await batchedUpsert(admin, 'kelas', ALL_KELAS.map(k => ({
      id: k.id,
      mata_kuliah_id: k.matkul,
      semester_id: semesterOfKelas(k.id),
      dosen_id: k.dosen,
      nama_kelas: k.nama,
      kapasitas: k.kap,
    })))
    log.push(`✅ ${ALL_KELAS.length} kelas`)

    // 4. Jadwal
    await batchedUpsert(admin, 'jadwal', ALL_KELAS.map((k, i) => ({
      id: uid('a7', i + 1),
      kelas_id: k.id,
      hari: JADWAL[i].hari,
      jam_mulai: JADWAL[i].mulai,
      jam_selesai: JADWAL[i].selesai,
      ruangan: JADWAL[i].ruang,
    })))
    log.push(`✅ ${ALL_KELAS.length} jadwal`)

    // 5. Pertemuan (16 kelas × 14 = 224)
    const allPertemuan: Record<string, unknown>[] = []
    let pOffset = 0
    for (const k of ALL_KELAS) {
      const startDate = semesterOfKelas(k.id) === uid('a1', 1) ? '2024-09-02'
        : semesterOfKelas(k.id) === uid('a1', 2) ? '2025-02-03' : '2025-09-01'
      const matkulName = MK_NAMES[k.matkul] || ''
      const pert = genPertemuan(k.id, matkulName, startDate, pOffset)
      allPertemuan.push(...pert)
      pOffset += 14
    }
    await batchedUpsert(admin, 'pertemuan', allPertemuan)
    log.push(`✅ ${allPertemuan.length} pertemuan`)

    // 6. Komponen Nilai (16 kelas × 3 = 48)
    const allKomp: Record<string, unknown>[] = []
    for (let i = 0; i < ALL_KELAS.length; i++) {
      const base = i * 3
      allKomp.push({ id: uid('b1', base + 1), kelas_id: ALL_KELAS[i].id, nama_komponen: 'Tugas', bobot_persen: 30 })
      allKomp.push({ id: uid('b1', base + 2), kelas_id: ALL_KELAS[i].id, nama_komponen: 'UTS', bobot_persen: 35 })
      allKomp.push({ id: uid('b1', base + 3), kelas_id: ALL_KELAS[i].id, nama_komponen: 'UAS', bobot_persen: 35 })
    }
    await batchedUpsert(admin, 'komponen_nilai', allKomp)
    log.push(`✅ ${allKomp.length} komponen nilai`)

    // Map: kelas → {tugas_id, uts_id, uas_id}
    const kompMap = new Map<string, { tugas: string; uts: string; uas: string }>()
    for (let i = 0; i < ALL_KELAS.length; i++) {
      const base = i * 3
      kompMap.set(ALL_KELAS[i].id, {
        tugas: uid('b1', base + 1),
        uts: uid('b1', base + 2),
        uas: uid('b1', base + 3),
      })
    }

    // ──────────────────────────────────────────────
    // 7. Past semester: KRS + KRS Detail + Nilai + Nilai Akhir
    // ──────────────────────────────────────────────
    // Enrollment data:
    // Rina(TI): smt1→kls1,2(sks:3+4=7) | smt2→kls5,6(sks:3+3=6)
    // Dimas(TI): smt1→kls1,2 | smt2→kls5,6
    // Sarah(SI): smt1→kls3(sks:3) | smt2→kls7(sks:3)
    // BudiP(MB): smt1→kls4(sks:3)
    // Citra: no past semesters (angkatan 2023)

    // [mhsId, smt, kelasIndices [], nilai [{tugas, uts, uas} per kelas]]
    type PastEnr = [string, number, number[], { tugas: number; uts: number; uas: number }[]]
    const PAST: PastEnr[] = [
      [uid('a4', 1), 1, [0, 1], [{ tugas: 90, uts: 88, uas: 92 }, { tugas: 85, uts: 82, uas: 87 }]], // Rina smt1
      [uid('a4', 1), 2, [4, 5], [{ tugas: 88, uts: 90, uas: 86 }, { tugas: 80, uts: 78, uas: 85 }]], // Rina smt2
      [uid('a4', 2), 1, [0, 1], [{ tugas: 72, uts: 68, uas: 75 }, { tugas: 65, uts: 70, uas: 68 }]], // Dimas smt1
      [uid('a4', 2), 2, [4, 5], [{ tugas: 60, uts: 55, uas: 65 }, { tugas: 75, uts: 70, uas: 72 }]], // Dimas smt2
      [uid('a4', 3), 1, [2], [{ tugas: 88, uts: 92, uas: 90 }]], // Sarah smt1
      [uid('a4', 3), 2, [6], [{ tugas: 90, uts: 85, uas: 88 }]], // Sarah smt2
      [uid('a4', 4), 1, [3], [{ tugas: 60, uts: 55, uas: 58 }]], // BudiP smt1
    ]

    let krsSeq = 0
    let detailSeq = 0
    const allNilai: Record<string, unknown>[] = []
    const allNA: Record<string, unknown>[] = []
    let nSeq = 0
    let naSeq = 0

    for (const [mhsId, smt, kIndices, nilaiArr] of PAST) {
      krsSeq++
      const krsSemester = smt === 1 ? uid('a1', 1) : uid('a1', 2)
      const offset = smt === 1 ? 0 : SMT1_KLS.length
      const kelasLst = smt === 1 ? SMT1_KLS : SMT2_KLS

      await batchedUpsert(admin, 'krs', [{
        id: uid('a8', krsSeq),
        mahasiswa_id: mhsId,
        semester_id: krsSemester,
        status: 'disetujui',
        tanggal_pengajuan: '2024-09-01T00:00:00Z',
        disetujui_oleh: uid('a3', 1),
      }])

      const details: Record<string, unknown>[] = []
      for (const ki of kIndices) {
        detailSeq++
        details.push({
          id: uid('a9', detailSeq),
          krs_id: uid('a8', krsSeq),
          kelas_id: kelasLst[ki - offset].id,
        })
      }
      await batchedUpsert(admin, 'krs_detail', details)

      // Nilai per komponen
      for (let vi = 0; vi < nilaiArr.length; vi++) {
        const kid = kIndices[vi]
        const kId = kelasLst[kid - offset].id
        const komp = kompMap.get(kId)!
        const n = nilaiArr[vi]
        const score = Math.round((n.tugas * 0.3 + n.uts * 0.35 + n.uas * 0.35) * 10) / 10

        nSeq++
        allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.tugas, mahasiswa_id: mhsId, nilai_angka: n.tugas })
        nSeq++
        allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uts, mahasiswa_id: mhsId, nilai_angka: n.uts })
        nSeq++
        allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uas, mahasiswa_id: mhsId, nilai_angka: n.uas })

        naSeq++
        allNA.push({
          id: uid('b3', naSeq),
          mahasiswa_id: mhsId,
          kelas_id: kId,
          nilai_angka_akhir: score,
          nilai_huruf: angkaKeHuruf(score),
        })
      }
    }

    await batchedUpsert(admin, 'nilai', allNilai)
    await batchedUpsert(admin, 'nilai_akhir', allNA)
    log.push(`✅ ${allNilai.length} nilai, ${allNA.length} nilai akhir (past semesters)`)

    // ──────────────────────────────────────────────
    // 8. Active semester: KRS + KRS Detail
    // ──────────────────────────────────────────────
    type ActiveEnr = [string, number[], string] // [mhsId, kelasIndices[], status]
    const ACTIVE: ActiveEnr[] = [
      [uid('a4', 1), [8, 9, 10, 11], 'disetujui'],  // Rina: MK005,006,007,008
      [uid('a4', 2), [8, 9, 10], 'diajukan'],         // Dimas: MK005,006,007
      [uid('a4', 3), [12, 13], 'disetujui'],          // Sarah: SI103, SI104
      [uid('a4', 4), [14, 15], 'draft'],              // BudiP: MB103, MB104
      [uid('a4', 5), [12, 13], 'diajukan'],           // Citra: SI103, SI104
    ]

    for (const [mhsId, kIndices, status] of ACTIVE) {
      krsSeq++
      await batchedUpsert(admin, 'krs', [{
        id: uid('a8', krsSeq),
        mahasiswa_id: mhsId,
        semester_id: uid('a1', 3),
        status,
        tanggal_pengajuan: status !== 'draft' ? '2025-09-10T00:00:00Z' : null,
        disetujui_oleh: status === 'disetujui' ? uid('a3', 1) : null,
      }])

      const details: Record<string, unknown>[] = []
      for (const ki of kIndices) {
        detailSeq++
        details.push({
          id: uid('a9', detailSeq),
          krs_id: uid('a8', krsSeq),
          kelas_id: SMT3_KLS[ki - 8].id, // indices 0-based in SMT3_KLS
        })
      }
      await batchedUpsert(admin, 'krs_detail', details)
    }
    log.push(`✅ ${ACTIVE.length} KRS aktif`)

    // ──────────────────────────────────────────────
    // 9. Absensi for active semester
    // ──────────────────────────────────────────────
    // Map kelas → list of pertemuan IDs
    const pertemuanByKelas = new Map<string, string[]>()
    for (const p of allPertemuan) {
      const kId = p.kelas_id as string
      if (!pertemuanByKelas.has(kId)) pertemuanByKelas.set(kId, [])
      pertemuanByKelas.get(kId)!.push(p.id as string)
    }

    // Attendance patterns (14 pertemuan): G=good, B=bad (Dimas), M=moderate (BudiP)
    const ATT_G = ['hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','izin','hadir','hadir','sakit','hadir','hadir']
    const ATT_B = ['hadir','alpa','hadir','alpa','alpa','hadir','izin','alpa','alpa','hadir','alpa','hadir','sakit','alpa']
    const ATT_M = ['hadir','hadir','izin','hadir','alpa','hadir','hadir','izin','hadir','alpa','hadir','hadir','izin','hadir']

    const attMap = new Map<string, string[]>()
    attMap.set(uid('a4', 1), ATT_G) // Rina
    attMap.set(uid('a4', 2), ATT_B) // Dimas
    attMap.set(uid('a4', 3), ATT_G) // Sarah
    attMap.set(uid('a4', 4), ATT_M) // BudiP
    attMap.set(uid('a4', 5), ATT_G) // Citra

    const allAbsensi: Record<string, unknown>[] = []
    let absSeq = 0

    for (const [mhsId, kIndices] of ACTIVE.map(a => [a[0], a[1]] as [string, number[]])) {
      const pattern = attMap.get(mhsId) || ATT_G
      for (const ki of kIndices) {
        const kId = SMT3_KLS[ki - 8].id
        const pertIds = pertemuanByKelas.get(kId) || []
        for (let pi = 0; pi < pertIds.length; pi++) {
          absSeq++
          allAbsensi.push({
            id: uid('b5', absSeq),
            pertemuan_id: pertIds[pi],
            mahasiswa_id: mhsId,
            status: pattern[pi] || 'hadir',
          })
        }
      }
    }
    await batchedUpsert(admin, 'absensi', allAbsensi)
    log.push(`✅ ${allAbsensi.length} absensi`)

    // ── Summary ──
    return NextResponse.json({
      message: '🎉 Comprehensive seed berhasil!',
      ringkasan: log.join('\n'),
      credentials: AUTH_USERS.map(u => ({
        identifier: u.username, password: PW, role: u.role, nama: u.nama,
      })),
      jumlah: {
        prodi: PRODI.length,
        semester: SEMESTER.length,
        matkul: MATKUL.length,
        users: AUTH_USERS.length,
        dosen: DOSEN.length,
        mahasiswa: MHS.length,
        kelas: ALL_KELAS.length,
        jadwal: JADWAL.length,
        pertemuan: allPertemuan.length,
        komponenNilai: allKomp.length,
        nilai: allNilai.length,
        nilaiAkhir: allNA.length,
        krs: krsSeq,
        absensi: allAbsensi.length,
      },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg, log }, { status: 500 })
  }
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const deleted: string[] = []

  try {
    const tables = [
      'absensi', 'nilai', 'nilai_akhir', 'komponen_nilai', 'pertemuan',
      'jadwal', 'krs_detail', 'krs', 'kelas', 'mata_kuliah_prerequisite',
      'mata_kuliah', 'mahasiswa', 'dosen', 'users', 'semester', 'program_studi',
    ]

    for (const t of tables) {
      const { count } = await admin.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (count) deleted.push(`${t}: ${count} deleted`)
    }

    const { data: authUsers } = await admin.auth.admin.listUsers()
    const seedUsers = authUsers?.users?.filter(u => u.email?.endsWith('@internal.siakad.local')) ?? []
    for (const u of seedUsers) {
      await admin.auth.admin.deleteUser(u.id)
      deleted.push(`auth: ${u.email}`)
    }

    return NextResponse.json({ message: '🗑️ Seed cleanup selesai', deleted })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg, deleted }, { status: 500 })
  }
}
