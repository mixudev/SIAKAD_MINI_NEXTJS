---
name: fase-02-database-auth
description: "Fase kedua project SIAKAD, paling krusial. Gunakan skill ini untuk membangun seluruh schema database dan sistem auth dengan login flexible (NIM/NIDN/username). Semua fase berikutnya bergantung pada struktur yang dibuat di fase ini — jangan ubah schema inti di fase lain tanpa migration baru."
---

# Fase 2: Database Schema & Auth

## Tujuan Fase Ini

Membangun seluruh struktur tabel database (semua modul, bukan cuma auth) beserta RLS policy-nya, dan mengimplementasikan login flexible. Fase ini adalah fondasi — schema yang dibuat di sini dipakai oleh semua fase berikutnya.

## Prinsip Auth Flexible (PENTING — baca sebelum implementasi)

Supabase Auth secara native pakai email+password atau OAuth. Karena kita butuh login pakai NIM/NIDN/username, gunakan pola **shadow email**:

1. Setiap user (mahasiswa/dosen/admin) tetap punya row di `auth.users` (Supabase Auth) dengan email yang **di-generate sistem**, bukan email asli mereka. Format: `<identifier>@internal.siakad.local` (misal `2021310045@internal.siakad.local`).
2. Tabel `public.users` (custom) menyimpan mapping: `auth_user_id` (FK ke `auth.users.id`), `nim` (nullable), `nidn` (nullable), `username` (nullable, unique), `role` (`admin`/`dosen`/`mahasiswa`), `email_asli` (opsional, untuk notifikasi, BUKAN untuk login).
3. **Flow login**: user input identifier (bisa NIM/NIDN/username) → Server Action query tabel `public.users` untuk cari `auth_user_id` dan email shadow yang cocok → baru panggil `supabase.auth.signInWithPassword({ email: shadowEmail, password })` di server.
4. User TIDAK PERNAH melihat atau perlu tahu email shadow ini. Dari sisi UX, mereka cuma input "NIM/NIDN/Username" + password.

## Checklist Tugas

### 1. Tabel Inti: Users & Profile

- [ ] `users` — kolom: `id` (uuid, FK ke `auth.users`), `role` (enum: `admin`,`dosen`,`mahasiswa`), `username` (unique, nullable), `created_at`, `updated_at`
- [ ] `mahasiswa` — kolom: `id`, `user_id` (FK ke `users`), `nim` (unique), `nama_lengkap`, `program_studi_id` (FK), `angkatan`, `status` (enum: `aktif`,`cuti`,`lulus`,`do`), `dosen_pa_id` (FK ke `dosen`, nullable)
- [ ] `dosen` — kolom: `id`, `user_id` (FK ke `users`), `nidn` (unique), `nama_lengkap`, `program_studi_id` (FK, nullable), `jabatan_akademik` (nullable)

### 2. Tabel Master Akademik (struktur saja, detail logic di fase 4)

- [ ] `program_studi` — `id`, `nama`, `kode`
- [ ] `semester` — `id`, `nama` (misal "Ganjil 2025/2026"), `tahun_akademik`, `tanggal_mulai`, `tanggal_selesai`, `is_active` (boolean, hanya satu semester aktif pada satu waktu)
- [ ] `mata_kuliah` — `id`, `kode_matkul` (unique), `nama`, `sks`, `program_studi_id` (FK), `semester_ke` (semester ke berapa di kurikulum, misal 1-8)
- [ ] `kelas` — `id`, `mata_kuliah_id` (FK), `semester_id` (FK), `dosen_id` (FK), `nama_kelas` (misal "A", "B"), `kapasitas`
- [ ] `jadwal` — `id`, `kelas_id` (FK), `hari`, `jam_mulai`, `jam_selesai`, `ruangan`

### 3. Tabel KRS (struktur saja, detail logic di fase 5)

- [ ] `krs` — `id`, `mahasiswa_id` (FK), `semester_id` (FK), `status` (enum: `draft`,`diajukan`,`disetujui`,`ditolak`), `tanggal_pengajuan`, `disetujui_oleh` (FK ke dosen, nullable), `catatan_dosen_pa` (nullable)
- [ ] `krs_detail` — `id`, `krs_id` (FK), `kelas_id` (FK) — relasi many-to-many antara KRS dan kelas yang diambil

### 4. Tabel Absensi (struktur saja, detail logic di fase 6)

- [ ] `pertemuan` — `id`, `kelas_id` (FK), `pertemuan_ke` (int), `tanggal`, `materi` (nullable)
- [ ] `absensi` — `id`, `pertemuan_id` (FK), `mahasiswa_id` (FK), `status` (enum: `hadir`,`izin`,`sakit`,`alpa`), `keterangan` (nullable)

### 5. Tabel Penilaian (struktur saja, detail logic di fase 7)

- [ ] `komponen_nilai` — `id`, `kelas_id` (FK), `nama_komponen` (misal "Tugas", "UTS", "UAS"), `bobot_persen` (numeric, total bobot per kelas harus = 100, divalidasi di application layer)
- [ ] `nilai` — `id`, `komponen_nilai_id` (FK), `mahasiswa_id` (FK), `nilai_angka` (numeric 0-100)
- [ ] `nilai_akhir` — `id`, `mahasiswa_id` (FK), `kelas_id` (FK), `nilai_angka_akhir` (computed/cached), `nilai_huruf` (computed/cached), `created_at`, `updated_at` — tabel ini cache hasil kalkulasi supaya tidak perlu hitung ulang setiap kali ditampilkan (KHS, transkrip)

### 6. Row Level Security (RLS) — WAJIB untuk SEMUA tabel di atas

- [ ] Aktifkan RLS di semua tabel (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policy `admin`: full access ke semua tabel
- [ ] Policy `mahasiswa`: hanya bisa SELECT data miliknya sendiri (KRS sendiri, nilai sendiri, absensi sendiri) — TIDAK bisa lihat data mahasiswa lain
- [ ] Policy `dosen`: hanya bisa SELECT/UPDATE data terkait kelas yang dia ajar (nilai, absensi mahasiswa di kelasnya), dan kalau berperan sebagai dosen PA, bisa lihat & approve KRS mahasiswa bimbingannya
- [ ] Test setiap policy dengan minimal 1 skenario "harus bisa" dan 1 skenario "harus ditolak" sebelum lanjut

### 7. Implementasi Login Flow

- [ ] Buat Server Action `loginAction(identifier, password)` yang melakukan lookup shadow email lalu `signInWithPassword`
- [ ] Buat Server Action `registerUser` (dipakai admin, bukan self-register publik — mahasiswa/dosen didaftarkan oleh admin di fase 3) yang generate shadow email otomatis dan buat row di `auth.users` + `users` + `mahasiswa`/`dosen` dalam satu transaksi
- [ ] Buat halaman login dengan satu input field "NIM / NIDN / Username" + password
- [ ] Implementasikan redirect berdasarkan role setelah login berhasil (`admin` → `/admin`, `dosen` → `/dosen`, `mahasiswa` → `/mahasiswa`)
- [ ] Implementasikan logout dan proteksi route (middleware redirect ke `/login` kalau belum auth, dan redirect ke dashboard sesuai role kalau salah akses area)

## Yang TIDAK Dikerjakan di Fase Ini

- Belum ada UI CRUD untuk mengelola data (itu fase 3 dan seterusnya) — fase ini fokus ke schema + RLS + auth flow saja
- Belum ada logic kalkulasi nilai akhir (cukup siapkan strukturnya)
- Belum ada validasi bisnis kompleks (misal cek kapasitas kelas) — itu masuk fase terkait

## Definisi "Selesai" untuk Fase Ini

Semua tabel di atas sudah dibuat lewat migration file, RLS aktif dan tertest di semua tabel, dan user bisa login dengan NIM/NIDN/username lalu diarahkan ke dashboard sesuai role-nya. Setelah ini, lanjut ke `fase-03-user-management`.
