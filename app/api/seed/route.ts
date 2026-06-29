import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const PW = 'password'

function uid(type: string, seq: number): string {
  return `${type}000000-0000-0000-0000-${seq.toString().padStart(12, '0')}`
}

// ── MASTER DATA ──
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

// ── MATA KULIAH ──
// [id, kode, nama, sks, prodi_id, semester_ke]
const MATKUL: [string, string, string, number, string, number][] = [
  // TI - Teknik Informatika (8 matkul)
  [uid('a5', 1), 'TI101', 'Matematika Diskrit', 3, uid('a0', 1), 1],
  [uid('a5', 2), 'TI102', 'Algoritma & Pemrograman', 4, uid('a0', 1), 1],
  [uid('a5', 3), 'TI103', 'Basis Data', 3, uid('a0', 1), 2],
  [uid('a5', 4), 'TI104', 'Struktur Data', 3, uid('a0', 1), 2],
  [uid('a5', 5), 'TI105', 'Jaringan Komputer', 3, uid('a0', 1), 3],
  [uid('a5', 6), 'TI106', 'Sistem Operasi', 3, uid('a0', 1), 3],
  [uid('a5', 7), 'TI107', 'Rekayasa Perangkat Lunak', 3, uid('a0', 1), 4],
  [uid('a5', 8), 'TI108', 'Kecerdasan Buatan', 3, uid('a0', 1), 5],
  // SI - Sistem Informasi (8 matkul)
  [uid('a5', 9), 'SI101', 'Pengantar Sistem Informasi', 3, uid('a0', 2), 1],
  [uid('a5', 10), 'SI102', 'Pemrograman Web', 4, uid('a0', 2), 2],
  [uid('a5', 11), 'SI103', 'Analisis Proses Bisnis', 3, uid('a0', 2), 3],
  [uid('a5', 12), 'SI104', 'Manajemen Proyek SI', 3, uid('a0', 2), 4],
  [uid('a5', 13), 'SI105', 'Interaksi Manusia Komputer', 3, uid('a0', 2), 3],
  [uid('a5', 14), 'SI106', 'E-Bisnis', 3, uid('a0', 2), 4],
  [uid('a5', 15), 'SI107', 'Data Mining', 3, uid('a0', 2), 5],
  [uid('a5', 16), 'SI108', 'Sistem Pendukung Keputusan', 3, uid('a0', 2), 5],
  // MB - Manajemen Bisnis (8 matkul)
  [uid('a5', 17), 'MB101', 'Pengantar Manajemen', 3, uid('a0', 3), 1],
  [uid('a5', 18), 'MB102', 'Akuntansi Dasar', 3, uid('a0', 3), 2],
  [uid('a5', 19), 'MB103', 'Manajemen Keuangan', 3, uid('a0', 3), 3],
  [uid('a5', 20), 'MB104', 'Perilaku Organisasi', 3, uid('a0', 3), 4],
  [uid('a5', 21), 'MB105', 'Manajemen SDM', 3, uid('a0', 3), 3],
  [uid('a5', 22), 'MB106', 'Manajemen Pemasaran', 3, uid('a0', 3), 4],
  [uid('a5', 23), 'MB107', 'Manajemen Operasi', 3, uid('a0', 3), 5],
  [uid('a5', 24), 'MB108', 'Kewirausahaan', 3, uid('a0', 3), 5],
]

const MK_NAMES = Object.fromEntries(MATKUL.map(m => [m[0] as string, m[1] as string]))

const PREREQ: [string, string][] = [
  [uid('a5', 3), uid('a5', 2)],  // Basis Data ← Algoritma
  [uid('a5', 4), uid('a5', 2)],  // Struktur Data ← Algoritma
  [uid('a5', 5), uid('a5', 3)],  // Jarkom ← Basis Data
  [uid('a5', 7), uid('a5', 4)],  // RPL ← Struktur Data
  [uid('a5', 8), uid('a5', 5)],  // KAB ← Jarkom
  [uid('a5', 8), uid('a5', 4)],  // KAB ← Struktur Data
  [uid('a5', 11), uid('a5', 9)], // Analisis Bisnis ← Pengantar SI
  [uid('a5', 19), uid('a5', 18)],// Manajemen Keuangan ← Akuntansi
]

// ── DOSEN ──
const DOSEN = [
  { id: uid('a3', 1), nidn: '0123456789', nama: 'Dr. Budi Santoso, M.Kom', prodi: uid('a0', 1), jabatan: 'Lektor Kepala' },
  { id: uid('a3', 2), nidn: '9876543210', nama: 'Dra. Siti Rahmawati, M.Pd', prodi: uid('a0', 2), jabatan: 'Lektor' },
  { id: uid('a3', 3), nidn: '1111111111', nama: 'Hendra Gunawan, S.Kom, M.Kom', prodi: uid('a0', 1), jabatan: 'Asisten Ahli' },
  { id: uid('a3', 4), nidn: '2222222222', nama: 'Dr. Dewi Sartika, M.Si', prodi: uid('a0', 3), jabatan: 'Lektor Kepala' },
  { id: uid('a3', 5), nidn: '3333333333', nama: 'Ahmad Fauzi, S.Si, M.T', prodi: uid('a0', 2), jabatan: 'Lektor' },
  { id: uid('a3', 6), nidn: '4444444444', nama: 'Rudi Hermawan, S.E., M.M', prodi: uid('a0', 3), jabatan: 'Lektor' },
]

// ── MAHASISWA (30) ──
const MHS: { id: string; nim: string; nama: string; prodi: string; angkatan: number; pa: string }[] = [
  // TI (10)
  { id: uid('a4', 1), nim: '2021310045', nama: 'Rina Aulia Putri',    prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 1) },
  { id: uid('a4', 2), nim: '2021310050', nama: 'Dimas Ardiansyah',    prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 1) },
  { id: uid('a4', 3), nim: '2021310060', nama: 'Fajar Ramadhan',      prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 3) },
  { id: uid('a4', 4), nim: '2021310070', nama: 'Dewi Lestari',        prodi: uid('a0', 1), angkatan: 2021, pa: uid('a3', 3) },
  { id: uid('a4', 5), nim: '2022310020', nama: 'Adi Nugroho',         prodi: uid('a0', 1), angkatan: 2022, pa: uid('a3', 1) },
  { id: uid('a4', 6), nim: '2022310030', nama: 'Sari Wulandari',      prodi: uid('a0', 1), angkatan: 2022, pa: uid('a3', 3) },
  { id: uid('a4', 7), nim: '2023310010', nama: 'Rizky Pratama',       prodi: uid('a0', 1), angkatan: 2023, pa: uid('a3', 1) },
  { id: uid('a4', 8), nim: '2023310020', nama: 'Maya Anggraini',      prodi: uid('a0', 1), angkatan: 2023, pa: uid('a3', 3) },
  { id: uid('a4', 9), nim: '2024310001', nama: 'Dani Permana',        prodi: uid('a0', 1), angkatan: 2024, pa: uid('a3', 1) },
  { id: uid('a4', 10), nim: '2024310002', nama: 'Putri Maharani',     prodi: uid('a0', 1), angkatan: 2024, pa: uid('a3', 3) },
  // SI (10)
  { id: uid('a4', 11), nim: '2022310010', nama: 'Sarah Annisa',       prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 2) },
  { id: uid('a4', 12), nim: '2022310040', nama: 'Bagas Pramono',      prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 2) },
  { id: uid('a4', 13), nim: '2022310050', nama: 'Intan Permata',      prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 5) },
  { id: uid('a4', 14), nim: '2022320010', nama: 'Andi Kusuma',        prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 2) },
  { id: uid('a4', 15), nim: '2022320020', nama: 'Winda Safitri',      prodi: uid('a0', 2), angkatan: 2022, pa: uid('a3', 5) },
  { id: uid('a4', 16), nim: '2023310001', nama: 'Citra Lestari',      prodi: uid('a0', 2), angkatan: 2023, pa: uid('a3', 5) },
  { id: uid('a4', 17), nim: '2023320010', nama: 'Eko Prasetyo',       prodi: uid('a0', 2), angkatan: 2023, pa: uid('a3', 2) },
  { id: uid('a4', 18), nim: '2023320020', nama: 'Lina Marlina',       prodi: uid('a0', 2), angkatan: 2023, pa: uid('a3', 5) },
  { id: uid('a4', 19), nim: '2024320001', nama: 'Teguh Setiawan',     prodi: uid('a0', 2), angkatan: 2024, pa: uid('a3', 2) },
  { id: uid('a4', 20), nim: '2024320002', nama: 'Nita Sari',          prodi: uid('a0', 2), angkatan: 2024, pa: uid('a3', 5) },
  // MB (10)
  { id: uid('a4', 21), nim: '2022310015', nama: 'Budi Prasetyo',      prodi: uid('a0', 3), angkatan: 2022, pa: uid('a3', 4) },
  { id: uid('a4', 22), nim: '2022320030', nama: 'Ratna Sari',         prodi: uid('a0', 3), angkatan: 2022, pa: uid('a3', 4) },
  { id: uid('a4', 23), nim: '2022320040', nama: 'Hendra Wijaya',      prodi: uid('a0', 3), angkatan: 2022, pa: uid('a3', 6) },
  { id: uid('a4', 24), nim: '2023320030', nama: 'Anita Kusuma',       prodi: uid('a0', 3), angkatan: 2023, pa: uid('a3', 4) },
  { id: uid('a4', 25), nim: '2023320040', nama: 'Reza Pratama',       prodi: uid('a0', 3), angkatan: 2023, pa: uid('a3', 6) },
  { id: uid('a4', 26), nim: '2023320050', nama: 'Fitri Handayani',    prodi: uid('a0', 3), angkatan: 2023, pa: uid('a3', 4) },
  { id: uid('a4', 27), nim: '2024320003', nama: 'Agus Supriyadi',     prodi: uid('a0', 3), angkatan: 2024, pa: uid('a3', 6) },
  { id: uid('a4', 28), nim: '2024320004', nama: 'Dwi Lestari',        prodi: uid('a0', 3), angkatan: 2024, pa: uid('a3', 4) },
  { id: uid('a4', 29), nim: '2024320005', nama: 'Chandra Wijaya',     prodi: uid('a0', 3), angkatan: 2024, pa: uid('a3', 6) },
  { id: uid('a4', 30), nim: '2024320006', nama: 'Indah Permata',      prodi: uid('a0', 3), angkatan: 2024, pa: uid('a3', 4) },
]

// ── AUTH USERS ──
const AUTH_USERS = [
  ...(() => {
    const admins = [
      { id: uid('a2', 1), username: 'admin.siakad', role: 'admin' as const, nama: 'Administrator SIAKAD' },
      { id: uid('a2', 2), username: 'admin.utama', role: 'admin' as const, nama: 'Admin Utama' },
    ]
    const dosens = DOSEN.map((d, i) => ({
      id: uid('a2', i + 3), username: d.nidn, role: 'dosen' as const, nama: d.nama,
    }))
    const mhss = MHS.map((m, i) => ({
      id: uid('a2', i + 9), username: m.nim, role: 'mahasiswa' as const, nama: m.nama,
    }))
    return [...admins, ...dosens, ...mhss]
  })(),
]

// ── KELAS ──
// Smt 1 (Ganjil 2024/25) - 4 kelas
const SMT1_KLS = [
  { id: uid('a6', 1), matkul: uid('a5', 1), dosen: uid('a3', 1), nama: 'A', kap: 40 }, // TI101
  { id: uid('a6', 2), matkul: uid('a5', 2), dosen: uid('a3', 3), nama: 'A', kap: 40 }, // TI102
  { id: uid('a6', 3), matkul: uid('a5', 9), dosen: uid('a3', 2), nama: 'A', kap: 40 }, // SI101
  { id: uid('a6', 4), matkul: uid('a5', 17), dosen: uid('a3', 4), nama: 'A', kap: 40 }, // MB101
]
// Smt 2 (Genap 2024/25) - 4 kelas
const SMT2_KLS = [
  { id: uid('a6', 5), matkul: uid('a5', 3), dosen: uid('a3', 1), nama: 'A', kap: 40 }, // TI103
  { id: uid('a6', 6), matkul: uid('a5', 4), dosen: uid('a3', 3), nama: 'A', kap: 40 }, // TI104
  { id: uid('a6', 7), matkul: uid('a5', 10), dosen: uid('a3', 5), nama: 'A', kap: 40 }, // SI102
  { id: uid('a6', 8), matkul: uid('a5', 18), dosen: uid('a3', 6), nama: 'A', kap: 40 }, // MB102
]
// Smt 3 (Ganjil 2025/26 - active) - 10 kelas
const SMT3_KLS = [
  { id: uid('a6', 9), matkul: uid('a5', 5), dosen: uid('a3', 1), nama: 'A', kap: 40 },  // TI105
  { id: uid('a6', 10), matkul: uid('a5', 6), dosen: uid('a3', 3), nama: 'A', kap: 40 }, // TI106
  { id: uid('a6', 11), matkul: uid('a5', 7), dosen: uid('a3', 3), nama: 'A', kap: 40 }, // TI107
  { id: uid('a6', 12), matkul: uid('a5', 8), dosen: uid('a3', 1), nama: 'A', kap: 40 }, // TI108
  { id: uid('a6', 13), matkul: uid('a5', 11), dosen: uid('a3', 2), nama: 'A', kap: 40 }, // SI103
  { id: uid('a6', 14), matkul: uid('a5', 12), dosen: uid('a3', 5), nama: 'A', kap: 40 }, // SI104
  { id: uid('a6', 15), matkul: uid('a5', 13), dosen: uid('a3', 2), nama: 'A', kap: 40 }, // SI105
  { id: uid('a6', 16), matkul: uid('a5', 14), dosen: uid('a3', 5), nama: 'A', kap: 40 }, // SI106
  { id: uid('a6', 17), matkul: uid('a5', 19), dosen: uid('a3', 4), nama: 'A', kap: 40 }, // MB103
  { id: uid('a6', 18), matkul: uid('a5', 20), dosen: uid('a3', 6), nama: 'A', kap: 40 }, // MB104
]

const ALL_KELAS = [...SMT1_KLS, ...SMT2_KLS, ...SMT3_KLS]

function semesterOfKelas(kelasId: string): string {
  const n = parseInt(kelasId.slice(-12))
  if (n <= 4) return uid('a1', 1)
  if (n <= 8) return uid('a1', 2)
  return uid('a1', 3)
}

// ── JADWAL TEMPLATES ──
const JADWAL_TEMPLATES = [
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
  { hari: 'Jumat', mulai: '07:00', selesai: '09:30', ruang: 'R101' },
  { hari: 'Jumat', mulai: '07:00', selesai: '09:30', ruang: 'R102' },
]

// ── HELPERS ──
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

function genNilaiRandom(profile: 'high' | 'avg' | 'low'): { tugas: number; uts: number; uas: number } {
  const r = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10
  if (profile === 'high') return { tugas: r(82, 98), uts: r(78, 95), uas: r(80, 98) }
  if (profile === 'avg') return { tugas: r(65, 82), uts: r(60, 78), uas: r(62, 82) }
  return { tugas: r(45, 65), uts: r(40, 60), uas: r(42, 62) }
}

// Student grade profiles (deterministic: use index)
const GRADE_PROFILES: ('high' | 'avg' | 'low')[] = [
  'high', 'avg', 'high', 'avg', 'avg', 'high', 'avg', 'low', 'avg', 'high',
  'high', 'avg', 'avg', 'low', 'avg', 'avg', 'avg', 'low', 'avg', 'avg',
  'avg', 'high', 'avg', 'high', 'low', 'avg', 'low', 'avg', 'low', 'avg',
]

// Attendance patterns
const ATT_FULL = ['hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir']
const ATT_GOOD = ['hadir','hadir','hadir','hadir','hadir','izin','hadir','hadir','sakit','hadir','hadir','hadir','hadir','izin']
const ATT_MOD = ['hadir','hadir','izin','hadir','alpa','hadir','hadir','izin','hadir','alpa','hadir','hadir','izin','hadir']
// ──────────────────────────────────────────────
// SEED LOGIC
// ──────────────────────────────────────────────
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
    // ════════════════════════════════════════
    // 1. MASTER DATA
    // ════════════════════════════════════════
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
      log.push('⚠️  prerequisites skipped')
    }

    // ════════════════════════════════════════
    // 2. AUTH USERS
    // ════════════════════════════════════════
    const userIdMap = new Map<string, string>()
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

    // public.users
    await batchedUpsert(admin, 'users', AUTH_USERS.map(u => ({
      id: userIdMap.get(u.username)!,
      role: u.role,
      username: u.username,
    })), 'username')
    log.push(`✅ users profile`)

    // ════════════════════════════════════════
    // 3. DOSEN & MAHASISWA
    // ════════════════════════════════════════
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

    // ════════════════════════════════════════
    // 4. KELAS & JADWAL
    // ════════════════════════════════════════
    await batchedUpsert(admin, 'kelas', ALL_KELAS.map(k => ({
      id: k.id,
      mata_kuliah_id: k.matkul,
      semester_id: semesterOfKelas(k.id),
      dosen_id: k.dosen,
      nama_kelas: k.nama,
      kapasitas: k.kap,
    })))
    log.push(`✅ ${ALL_KELAS.length} kelas`)

    await batchedUpsert(admin, 'jadwal', ALL_KELAS.map((k, i) => ({
      id: uid('a7', i + 1),
      kelas_id: k.id,
      hari: JADWAL_TEMPLATES[i].hari,
      jam_mulai: JADWAL_TEMPLATES[i].mulai,
      jam_selesai: JADWAL_TEMPLATES[i].selesai,
      ruangan: JADWAL_TEMPLATES[i].ruang,
    })))
    log.push(`✅ ${ALL_KELAS.length} jadwal`)

    // ════════════════════════════════════════
    // 5. PERTEMUAN (18 kelas × 14 = 252)
    // ════════════════════════════════════════
    const allPertemuan: Record<string, unknown>[] = []
    let pOffset = 0
    for (const k of ALL_KELAS) {
      const startDate =
        semesterOfKelas(k.id) === uid('a1', 1) ? '2024-09-02'
        : semesterOfKelas(k.id) === uid('a1', 2) ? '2025-02-03'
        : '2025-09-01'
      const matkulName = MK_NAMES[k.matkul] || ''
      allPertemuan.push(...genPertemuan(k.id, matkulName, startDate, pOffset))
      pOffset += 14
    }
    await batchedUpsert(admin, 'pertemuan', allPertemuan)
    log.push(`✅ ${allPertemuan.length} pertemuan`)

    // ════════════════════════════════════════
    // 6. KOMPONEN NILAI (18 kelas × 3 = 54)
    // ════════════════════════════════════════
    const allKomp: Record<string, unknown>[] = []
    for (let i = 0; i < ALL_KELAS.length; i++) {
      const base = i * 3
      allKomp.push({ id: uid('b1', base + 1), kelas_id: ALL_KELAS[i].id, nama_komponen: 'Tugas', bobot_persen: 30 })
      allKomp.push({ id: uid('b1', base + 2), kelas_id: ALL_KELAS[i].id, nama_komponen: 'UTS', bobot_persen: 35 })
      allKomp.push({ id: uid('b1', base + 3), kelas_id: ALL_KELAS[i].id, nama_komponen: 'UAS', bobot_persen: 35 })
    }
    await batchedUpsert(admin, 'komponen_nilai', allKomp)
    log.push(`✅ ${allKomp.length} komponen nilai`)

    // Map: kelas → {tugas, uts, uas}
    const kompMap = new Map<string, { tugas: string; uts: string; uas: string }>()
    for (let i = 0; i < ALL_KELAS.length; i++) {
      const base = i * 3
      kompMap.set(ALL_KELAS[i].id, {
        tugas: uid('b1', base + 1),
        uts: uid('b1', base + 2),
        uas: uid('b1', base + 3),
      })
    }

    // Map: pertemuan per kelas
    const pertemuanByKelas = new Map<string, string[]>()
    for (const p of allPertemuan) {
      const kId = p.kelas_id as string
      if (!pertemuanByKelas.has(kId)) pertemuanByKelas.set(kId, [])
      pertemuanByKelas.get(kId)!.push(p.id as string)
    }

    // ════════════════════════════════════════
    // 7. PAST SEMESTERS: KRS + NILAI + ABSENSI
    // ════════════════════════════════════════
    // Students with past data: first 15 MHS (index 0-14: 10 TI + 5 SI)
    // Sem 1: TI → matdis(TI101) + algo(TI102) [kelas 0,1]; SI → pengantar SI(SI101) [kelas 2]
    // Sem 2: TI → basis data(TI103) + struktur data(TI104) [kelas 4,5]; SI → web(SI102) [kelas 6]

    interface PastEnr {
      mhsIdx: number
      kelasIndices: number[]  // index in SMT1_KLS or SMT2_KLS
    }

    const PAST_SMT1: PastEnr[] = []
    const PAST_SMT2: PastEnr[] = []

    // TI students (index 0-9): sem 1 → kls 0,1; sem 2 → kls 0,1 (relative to SMT1/SMT2)
    for (let i = 0; i < 10; i++) {
      PAST_SMT1.push({ mhsIdx: i, kelasIndices: [0, 1] })
      PAST_SMT2.push({ mhsIdx: i, kelasIndices: [0, 1] })
    }
    // SI students (index 10-14): sem 1 → kls 2; sem 2 → kls 2
    for (let i = 10; i < 15; i++) {
      PAST_SMT1.push({ mhsIdx: i, kelasIndices: [2] })
      PAST_SMT2.push({ mhsIdx: i, kelasIndices: [2] })
    }

    let krsSeq = 0
    let detailSeq = 0
    const allNilai: Record<string, unknown>[] = []
    const allNA: Record<string, unknown>[] = []
    const allAbsensi: Record<string, unknown>[] = []
    let nSeq = 0
    let naSeq = 0
    let absSeq = 0

    // SEMESTER 1
    krsSeq = 0
    for (const en of PAST_SMT1) {
      krsSeq++
      const mhs = MHS[en.mhsIdx]
      const mhsId = mhs.id
      const krsId = uid('a8', krsSeq)

      await admin.from('krs').upsert({
        id: krsId,
        mahasiswa_id: mhsId,
        semester_id: uid('a1', 1),
        status: 'disetujui',
        tanggal_pengajuan: '2024-09-01T00:00:00Z',
        disetujui_oleh: DOSEN.find(d => d.id === mhs.pa)?.id || DOSEN[0].id,
      }, { onConflict: 'id' })

      for (let vi = 0; vi < en.kelasIndices.length; vi++) {
        const ki = en.kelasIndices[vi]
        const kId = SMT1_KLS[ki].id
        detailSeq++
        await admin.from('krs_detail').upsert({
          id: uid('a9', detailSeq),
          krs_id: krsId,
          kelas_id: kId,
        }, { onConflict: 'id' })

        const profile = GRADE_PROFILES[en.mhsIdx]
        const n = genNilaiRandom(profile)
        const komp = kompMap.get(kId)!
        const score = Math.round((n.tugas * 0.3 + n.uts * 0.35 + n.uas * 0.35) * 10) / 10

        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.tugas, mahasiswa_id: mhsId, nilai_angka: n.tugas })
        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uts, mahasiswa_id: mhsId, nilai_angka: n.uts })
        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uas, mahasiswa_id: mhsId, nilai_angka: n.uas })
        naSeq++; allNA.push({ id: uid('b3', naSeq), mahasiswa_id: mhsId, kelas_id: kId, nilai_angka_akhir: score, nilai_huruf: angkaKeHuruf(score) })
      }
    }

    // SEMESTER 2
    for (const en of PAST_SMT2) {
      krsSeq++
      const mhs = MHS[en.mhsIdx]
      const mhsId = mhs.id
      const krsId = uid('a8', krsSeq)

      await admin.from('krs').upsert({
        id: krsId,
        mahasiswa_id: mhsId,
        semester_id: uid('a1', 2),
        status: 'disetujui',
        tanggal_pengajuan: '2025-02-01T00:00:00Z',
        disetujui_oleh: DOSEN.find(d => d.id === mhs.pa)?.id || DOSEN[0].id,
      }, { onConflict: 'id' })

      for (let vi = 0; vi < en.kelasIndices.length; vi++) {
        const ki = en.kelasIndices[vi]
        const kId = SMT2_KLS[ki].id
        detailSeq++
        await admin.from('krs_detail').upsert({
          id: uid('a9', detailSeq),
          krs_id: krsId,
          kelas_id: kId,
        }, { onConflict: 'id' })

        const profile = GRADE_PROFILES[en.mhsIdx]
        const n = genNilaiRandom(profile)
        const komp = kompMap.get(kId)!
        const score = Math.round((n.tugas * 0.3 + n.uts * 0.35 + n.uas * 0.35) * 10) / 10

        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.tugas, mahasiswa_id: mhsId, nilai_angka: n.tugas })
        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uts, mahasiswa_id: mhsId, nilai_angka: n.uts })
        nSeq++; allNilai.push({ id: uid('b2', nSeq), komponen_nilai_id: komp.uas, mahasiswa_id: mhsId, nilai_angka: n.uas })
        naSeq++; allNA.push({ id: uid('b3', naSeq), mahasiswa_id: mhsId, kelas_id: kId, nilai_angka_akhir: score, nilai_huruf: angkaKeHuruf(score) })
      }
    }

    await batchedUpsert(admin, 'nilai', allNilai)
    await batchedUpsert(admin, 'nilai_akhir', allNA)
    log.push(`✅ ${allNilai.length} nilai, ${allNA.length} nilai akhir (past)`)

    // ════════════════════════════════════════
    // 8. PAST SEMESTER: ABSENSI (all hadir)
    // ════════════════════════════════════════
    for (const enroll of PAST_SMT1) {
      const mhsId = MHS[enroll.mhsIdx].id
      for (const ki of enroll.kelasIndices) {
        const kId = SMT1_KLS[ki].id
        const pertIds = pertemuanByKelas.get(kId) || []
        for (const pId of pertIds) {
          absSeq++
          allAbsensi.push({ id: uid('b5', absSeq), pertemuan_id: pId, mahasiswa_id: mhsId, status: 'hadir' })
        }
      }
    }
    for (const enroll of PAST_SMT2) {
      const mhsId = MHS[enroll.mhsIdx].id
      for (const ki of enroll.kelasIndices) {
        const kId = SMT2_KLS[ki].id
        const pertIds = pertemuanByKelas.get(kId) || []
        for (const pId of pertIds) {
          absSeq++
          allAbsensi.push({ id: uid('b5', absSeq), pertemuan_id: pId, mahasiswa_id: mhsId, status: 'hadir' })
        }
      }
    }

    // ════════════════════════════════════════
    // 9. ACTIVE SEMESTER: KRS
    // ════════════════════════════════════════
    type ActiveEnr = { mhsIdx: number; kelasIndices: number[]; status: 'draft' | 'diajukan' | 'disetujui' }

    // SMT3_KLS indices:
    //   0:TI105, 1:TI106, 2:TI107, 3:TI108, 4:SI103,
    //   5:SI104, 6:SI105, 7:SI106, 8:MB103, 9:MB104

    const ACTIVE: ActiveEnr[] = [
      // — disetujui (10) —
      { mhsIdx: 0,  kelasIndices: [0, 1, 2, 3], status: 'disetujui' },  // Rina → TI105-108
      { mhsIdx: 2,  kelasIndices: [0, 1, 2, 3], status: 'disetujui' },  // Fajar → TI105-108
      { mhsIdx: 5,  kelasIndices: [0, 2],       status: 'disetujui' },  // Sari → TI105, TI107
      { mhsIdx: 10, kelasIndices: [4, 5, 6],     status: 'disetujui' },  // Sarah → SI103-105
      { mhsIdx: 11, kelasIndices: [4, 5],        status: 'disetujui' },  // Bagas → SI103, SI104
      { mhsIdx: 12, kelasIndices: [4, 6],        status: 'disetujui' },  // Intan → SI103, SI105
      { mhsIdx: 21, kelasIndices: [8, 9],        status: 'disetujui' },  // Ratna → MB103, MB104
      { mhsIdx: 22, kelasIndices: [8],           status: 'disetujui' },  // HendraW → MB103
      { mhsIdx: 23, kelasIndices: [8, 9],        status: 'disetujui' },  // Anita → MB103, MB104
      { mhsIdx: 25, kelasIndices: [8],           status: 'disetujui' },  // Fitri → MB103
      // — diajukan (10) —
      { mhsIdx: 1,  kelasIndices: [0, 1],        status: 'diajukan' },  // Dimas → TI105, TI106
      { mhsIdx: 3,  kelasIndices: [1, 2],        status: 'diajukan' },  // DewiL → TI106, TI107
      { mhsIdx: 4,  kelasIndices: [0],           status: 'diajukan' },  // Adi → TI105
      { mhsIdx: 6,  kelasIndices: [0, 1],        status: 'diajukan' },  // Rizky → TI105, TI106
      { mhsIdx: 15, kelasIndices: [4, 5],        status: 'diajukan' },  // Citra → SI103, SI104
      { mhsIdx: 13, kelasIndices: [4],           status: 'diajukan' },  // Andi → SI103
      { mhsIdx: 14, kelasIndices: [5],           status: 'diajukan' },  // Winda → SI104
      { mhsIdx: 20, kelasIndices: [8],           status: 'diajukan' },  // BudiP → MB103
      { mhsIdx: 24, kelasIndices: [8, 9],        status: 'diajukan' },  // Reza → MB103, MB104
      { mhsIdx: 26, kelasIndices: [8],           status: 'diajukan' },  // Agus → MB103
      // — draft (10) —
      { mhsIdx: 7,  kelasIndices: [],            status: 'draft' },     // Maya
      { mhsIdx: 8,  kelasIndices: [],            status: 'draft' },     // Dani
      { mhsIdx: 9,  kelasIndices: [],            status: 'draft' },     // Putri
      { mhsIdx: 16, kelasIndices: [],            status: 'draft' },     // Eko
      { mhsIdx: 17, kelasIndices: [],            status: 'draft' },     // Lina
      { mhsIdx: 18, kelasIndices: [],            status: 'draft' },     // Teguh
      { mhsIdx: 19, kelasIndices: [],            status: 'draft' },     // Nita
      { mhsIdx: 27, kelasIndices: [],            status: 'draft' },     // DwiL
      { mhsIdx: 28, kelasIndices: [],            status: 'draft' },     // Chandra
      { mhsIdx: 29, kelasIndices: [],            status: 'draft' },     // Indah
    ]

    for (const en of ACTIVE) {
      krsSeq++
      const mhs = MHS[en.mhsIdx]
      const mhsId = mhs.id
      const krsId = uid('a8', krsSeq)

      await admin.from('krs').upsert({
        id: krsId,
        mahasiswa_id: mhsId,
        semester_id: uid('a1', 3),
        status: en.status,
        tanggal_pengajuan: en.status !== 'draft' ? '2025-09-10T00:00:00Z' : null,
        disetujui_oleh: en.status === 'disetujui' ? (DOSEN.find(d => d.id === mhs.pa)?.id || DOSEN[0].id) : null,
      }, { onConflict: 'id' })

      for (const ki of en.kelasIndices) {
        detailSeq++
        await admin.from('krs_detail').upsert({
          id: uid('a9', detailSeq),
          krs_id: krsId,
          kelas_id: SMT3_KLS[ki].id,
        }, { onConflict: 'id' })
      }
    }
    log.push(`✅ ${ACTIVE.length} KRS aktif (${ACTIVE.filter(e => e.status === 'disetujui').length} disetujui, ${ACTIVE.filter(e => e.status === 'diajukan').length} diajukan, ${ACTIVE.filter(e => e.status === 'draft').length} draft)`)

    // ════════════════════════════════════════
    // 10. ACTIVE SEMESTER: ABSENSI (for disetujui students only)
    // ════════════════════════════════════════
    const ATT_MAP = new Map<number, string[]>()
    ATT_MAP.set(0, ATT_FULL)  // Rina
    ATT_MAP.set(2, ATT_GOOD)  // Fajar
    ATT_MAP.set(5, ATT_MOD)   // Sari
    ATT_MAP.set(10, ATT_FULL) // Sarah
    ATT_MAP.set(11, ATT_GOOD) // Bagas
    ATT_MAP.set(12, ATT_MOD)  // Intan
    ATT_MAP.set(21, ATT_GOOD) // Ratna
    ATT_MAP.set(22, ATT_MOD)  // HendraW
    ATT_MAP.set(23, ATT_GOOD) // Anita
    ATT_MAP.set(25, ATT_MOD)  // Fitri

    for (const en of ACTIVE.filter(e => e.status === 'disetujui')) {
      const mhsId = MHS[en.mhsIdx].id
      const pattern = ATT_MAP.get(en.mhsIdx) || ATT_GOOD
      for (const ki of en.kelasIndices) {
        const kId = SMT3_KLS[ki].id
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

    // ════════════════════════════════════════
    // 11. SUMMARY
    // ════════════════════════════════════════
    const credentials = AUTH_USERS.map(u => ({
      username: u.username, password: PW, role: u.role, nama: u.nama,
    }))

    return NextResponse.json({
      message: '🎉 Seed berhasil! Data siap untuk simulasi.',
      ringkasan: log.join('\n'),
      credentials,
      jumlah: {
        prodi: PRODI.length,
        semester: SEMESTER.length,
        matkul: MATKUL.length,
        prereq: PREREQ.length,
        users: AUTH_USERS.length,
        dosen: DOSEN.length,
        mahasiswa: MHS.length,
        kelas: ALL_KELAS.length,
        jadwal: JADWAL_TEMPLATES.length,
        pertemuan: allPertemuan.length,
        komponenNilai: allKomp.length,
        nilai: allNilai.length,
        nilaiAkhir: allNA.length,
        krs: krsSeq,
        absensi: allAbsensi.length,
      },
      simulasi: {
        krs: 'Login sebagai mahasiswa draft (Maya/Dani/Putri/dll) untuk tambah kelas KRS. Login sebagai Dosen PA untuk approve KRS.',
        absensi: 'Login sebagai dosen pengampu, buka kelas, isi absensi untuk mahasiswa yang belum diisi.',
        nilai: 'Login sebagai dosen pengampu, input/ubah nilai komponen, lihat kalkulasi otomatis nilai akhir.',
        khs: 'Login sebagai mahasiswa dengan status disetujui (Rina/Fajar/Sarah/dll), lihat KHS semester aktif.',
      },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg, log }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════
// DELETE — Hapus semua data seed
// ════════════════════════════════════════════════════════════════
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

    return NextResponse.json({ message: '🗑️ Cleanup selesai', deleted })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg, deleted }, { status: 500 })
  }
}
