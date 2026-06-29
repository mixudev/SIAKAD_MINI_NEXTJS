---
name: project-overview
description: "WAJIB dibaca di awal setiap task, sebelum skill lain. Berisi gambaran besar sistem SIAKAD: apa yang dibangun, siapa penggunanya, role yang ada, dan batasan scope. Gunakan ini untuk memahami konteks sebelum membaca skill fase manapun."
---

# SIAKAD — Sistem Informasi Akademik Kampus

## Apa Ini

Sistem informasi akademik (SIAKAD) untuk kampus, mencakup manajemen mahasiswa & dosen, KRS (Kartu Rencana Studi), penilaian, manajemen mata kuliah, kelas, jadwal, dan absensi. Target: sistem yang **profesional dan production-ready**, bukan prototype/demo.

## Role yang Ada

Sistem punya 3 role utama, masing-masing dengan dashboard dan akses berbeda:

1. **Admin** — kelola seluruh master data (mahasiswa, dosen, matkul, kelas, jadwal, semester), approve/reject hal-hal administratif, akses penuh.
2. **Dosen** — input nilai untuk kelas yang diajar, kelola absensi pertemuan, lihat daftar mahasiswa di kelasnya. Sebagian dosen juga berperan sebagai **Dosen PA (Pembimbing Akademik)** yang approve KRS mahasiswa bimbingannya.
3. **Mahasiswa** — ajukan KRS, lihat jadwal, lihat KHS/transkrip, lihat presensi diri sendiri.

## Login Flexible (PENTING)

User bisa login pakai salah satu dari:
- **NIM** (untuk mahasiswa)
- **NIDN** (untuk dosen)
- **Username** (alternatif untuk semua role, termasuk admin)

Detail teknis implementasi ada di skill `fase-02-database-auth` — jangan asumsikan pola auth standar Supabase (email+password langsung), karena harus melalui mapping layer dulu.

## Modul/Fitur Utama

- Manajemen User (Mahasiswa, Dosen, Admin)
- Manajemen Mata Kuliah (matkul)
- Manajemen Kelas (kelas per matkul per semester, kapasitas, dosen pengampu)
- Manajemen Jadwal (hari, jam, ruangan per kelas)
- KRS & Pengajuan KRS (mahasiswa pilih matkul, ada proses approval)
- Manajemen Absensi (per pertemuan, per kelas)
- Penilaian (komponen nilai dengan bobot custom per matkul, kalkulasi otomatis)
- Dashboard & Reporting (KHS, transkrip, rekap kehadiran, rekap nilai)

## Non-Goals (Sengaja TIDAK Dikerjakan di Scope Ini)

Kecuali user secara eksplisit minta lain, JANGAN membangun hal-hal berikut tanpa konfirmasi dulu:
- Sistem pembayaran/keuangan (SPP, dll)
- Sistem perpustakaan
- Sistem skripsi/tugas akhir
- Mobile app native (scope ini web-only, responsive)
- Multi-kampus/multi-tenant (asumsikan satu kampus, satu instansi)
- Notifikasi real-time via WhatsApp/SMS (email saja jika dibutuhkan, dan itu pun opsional)

## Cara Kerja dengan Skill Fase

Project ini dipecah jadi 9 fase, masing-masing punya skill sendiri di `fase-0X-*`. **Kerjakan secara berurutan** — jangan mulai fase N+1 sebelum fase N selesai dan disetujui user, karena fase belakang depend on struktur yang dibuat di fase sebelumnya.

Urutan fase:
1. `fase-01-foundation` — Setup project, struktur folder, design system base
2. `fase-02-database-auth` — Schema database lengkap + RLS + auth flow
3. `fase-03-user-management` — CRUD admin untuk user (mahasiswa/dosen)
4. `fase-04-master-akademik` — Matkul, kelas, jadwal, ruangan, semester
5. `fase-05-krs` — KRS, pengajuan KRS, approval Dosen PA
6. `fase-06-absensi` — Manajemen absensi per pertemuan
7. `fase-07-penilaian` — Komponen nilai, input nilai, kalkulasi
8. `fase-08-dashboard-reporting` — KHS, transkrip, rekap per role
9. `fase-09-polish-hardening` — Validasi, error handling, security review

Selalu baca skill `tech-stack` dan `design-system` di samping skill fase yang sedang dikerjakan — keduanya berlaku di SEMUA fase.

## Filosofi Kerja

- Sistem ini **profesional**, bukan side-project asal jalan. Perlakukan validasi data, keamanan (RLS), dan UX dengan serius di setiap fase — jangan tunda semuanya ke fase 9.
- Kalau ada keputusan yang ambigu dan berdampak besar ke struktur data, **tanya dulu ke user**, jangan asumsi sendiri lalu lanjut.
- Kalau instruksi user di suatu fase bertentangan dengan apa yang sudah dibangun di fase sebelumnya, **flag dulu** sebelum override.
