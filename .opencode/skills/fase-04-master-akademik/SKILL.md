---
name: fase-04-master-akademik
description: "Fase keempat project SIAKAD. Gunakan skill ini untuk membangun manajemen mata kuliah, kelas, jadwal, semester, dan ruangan. Ini adalah master data yang dipakai KRS, absensi, dan penilaian di fase-fase berikutnya."
---

# Fase 4: Master Data Akademik

## Tujuan Fase Ini

Admin bisa mengelola seluruh master data akademik: mata kuliah, kelas per semester, jadwal, dan periode semester aktif. Modul ini adalah prasyarat untuk KRS (fase 5) — mahasiswa tidak bisa ambil KRS kalau belum ada kelas yang dibuka.

## Checklist Tugas

### 1. Manajemen Semester (`/admin/semester`)
- [ ] List semester (Ganjil/Genap per tahun akademik) dengan status aktif/tidak
- [ ] Form tambah semester baru: nama, tahun akademik, tanggal mulai, tanggal selesai
- [ ] Aksi "Aktifkan Semester" — saat satu semester diaktifkan, semester lain otomatis nonaktif (hanya 1 semester aktif pada satu waktu, karena ini menentukan semester mana yang dipakai untuk KRS, absensi, dan input nilai berjalan)
- [ ] Konfirmasi sebelum ganti semester aktif (karena ini aksi berdampak luas — KRS baru akan terikat ke semester yang baru diaktifkan)

### 2. Manajemen Program Studi (`/admin/program-studi`)
- [ ] CRUD sederhana: nama, kode program studi
- [ ] [TANYA USER kalau belum jelas: apakah kampus ini multi-prodi/multi-fakultas, atau hanya satu prodi? Ini menentukan apakah perlu level "fakultas" di atas "program studi"]

### 3. Manajemen Mata Kuliah (`/admin/matkul`)
- [ ] List matkul dengan kolom: kode, nama, SKS, program studi, semester ke- (di kurikulum), dengan search & filter by program studi
- [ ] Form tambah/edit matkul
- [ ] Validasi: kode matkul unique

### 4. Manajemen Kelas (`/admin/kelas`)
- [ ] List kelas: kolom matkul, nama kelas (A/B/dst), dosen pengampu, semester, jumlah mahasiswa terdaftar / kapasitas
- [ ] Form tambah kelas: pilih matkul, pilih dosen (dropdown), set kapasitas, set semester (default ke semester aktif)
- [ ] Validasi: kombinasi matkul + nama kelas + semester harus unique (tidak boleh ada "Matkul X Kelas A" dobel di semester yang sama)
- [ ] Tampilkan indikator kalau kelas sudah penuh (jumlah KRS masuk = kapasitas) — relevan untuk fase 5 nanti

### 5. Manajemen Jadwal (`/admin/jadwal`)
- [ ] Form set jadwal per kelas: hari, jam mulai, jam selesai, ruangan
- [ ] **Validasi bentrok jadwal**: cek apakah ruangan yang sama dipakai di hari & jam yang overlap oleh kelas lain — tolak/warning kalau bentrok
- [ ] **Validasi bentrok dosen**: cek apakah dosen yang sama dijadwalkan mengajar 2 kelas di hari & jam yang overlap — tolak/warning kalau bentrok
- [ ] Tampilan jadwal dalam bentuk kalender mingguan (opsional, tapi sangat membantu admin) selain tabel biasa

## Yang TIDAK Dikerjakan di Fase Ini

- Mahasiswa belum bisa melihat atau mengambil kelas-kelas ini (itu fase 5 — KRS)
- Belum ada logic terkait kapasitas kelas yang menolak pendaftaran otomatis (validasi kapasitas penuh baru benar-benar dipakai saat proses KRS di fase 5, di sini cukup ditampilkan sebagai info)

## Definisi "Selesai" untuk Fase Ini

Admin bisa membuat semester aktif, menambah matkul, membuka kelas untuk matkul tersebut di semester aktif, dan menyusun jadwal tanpa bentrok ruangan/dosen. Setelah ini, lanjut ke `fase-05-krs`.
