---
name: fase-06-absensi
description: "Fase keenam project SIAKAD. Gunakan skill ini untuk membangun sistem manajemen absensi per pertemuan kelas. Membutuhkan KRS yang disetujui dari fase-05-krs sebagai basis daftar mahasiswa per kelas."
---

# Fase 6: Manajemen Absensi

## Tujuan Fase Ini

Dosen bisa mencatat kehadiran mahasiswa per pertemuan kelas, dan mahasiswa bisa melihat rekap kehadirannya sendiri.

## Alur Bisnis Absensi

1. Dosen membuat/membuka "pertemuan" baru untuk kelas yang diajar (pertemuan ke-1, ke-2, dst, sesuai tanggal)
2. Sistem otomatis menampilkan daftar mahasiswa yang terdaftar di kelas tersebut (berdasarkan KRS yang `disetujui` dari fase 5)
3. Dosen menandai status kehadiran tiap mahasiswa: hadir/izin/sakit/alpa
4. Mahasiswa bisa melihat rekap kehadirannya sendiri per matkul

## Checklist Tugas

### 1. Manajemen Pertemuan — Dosen (`/dosen/absensi`)
- [ ] List kelas yang diajar dosen tersebut (di semester aktif)
- [ ] Per kelas, list pertemuan yang sudah dibuat (pertemuan ke-1, ke-2, dst) dengan status: belum diisi absensi / sudah diisi
- [ ] Form buat pertemuan baru: nomor pertemuan (auto-increment dari pertemuan terakhir), tanggal, materi (opsional)
- [ ] [TANYA USER: berapa total pertemuan standar per semester di kampus ini? Umumnya 14-16 pertemuan. Ini hanya untuk validasi/reminder, bukan hard limit, kecuali diminta jadi hard limit]

### 2. Input Absensi per Pertemuan
- [ ] Halaman input absensi: tampilkan daftar mahasiswa di kelas tersebut (dari KRS disetujui), dengan radio button/select per mahasiswa untuk pilih status (hadir/izin/sakit/alpa)
- [ ] Default status untuk mahasiswa yang belum ditandai: biarkan kosong/required, jangan default ke "hadir" otomatis (supaya dosen benar-benar memeriksa, bukan asal save)
- [ ] Bisa edit absensi yang sudah pernah diisi (misal salah input, koreksi belakangan)
- [ ] Tampilkan ringkasan setelah submit: jumlah hadir/izin/sakit/alpa untuk pertemuan tersebut

### 3. Rekap Absensi — Dosen
- [ ] Tabel rekap per kelas: baris = mahasiswa, kolom = pertemuan ke-1 sampai terakhir, isi = status (bisa pakai simbol/warna singkat: H/I/S/A)
- [ ] Hitung persentase kehadiran per mahasiswa (jumlah hadir / total pertemuan yang sudah dilaksanakan)
- [ ] [TANYA USER kalau relevan: apakah ada batas minimal persentase kehadiran untuk syarat ikut UAS (umumnya 75%)? Kalau ada, tampilkan flag/warning untuk mahasiswa yang di bawah batas tersebut]

### 4. Rekap Absensi — Mahasiswa (`/mahasiswa/absensi-saya`)
- [ ] Mahasiswa bisa lihat rekap kehadirannya sendiri per matkul yang diambil di semester aktif (read-only)
- [ ] Tampilkan persentase kehadiran per matkul

### 5. Rekap Absensi — Admin (`/admin/absensi`)
- [ ] Monitoring lintas kelas: kelas mana yang dosennya belum mengisi absensi sampai tanggal tertentu (untuk follow-up administratif)

## Yang TIDAK Dikerjakan di Fase Ini

- Tidak ada absensi mandiri oleh mahasiswa (misal scan QR/geolocation) kecuali diminta secara eksplisit — default-nya dosen yang input manual
- Belum terhubung ke syarat kelulusan/nilai (itu murni fase 7), absensi di fase ini hanya pencatatan dan rekap

## Definisi "Selesai" untuk Fase Ini

Dosen bisa membuat pertemuan dan mengisi absensi untuk semua mahasiswa di kelasnya, dengan rekap yang akurat dan bisa dilihat oleh dosen, mahasiswa terkait, dan admin. Setelah ini, lanjut ke `fase-07-penilaian`.
