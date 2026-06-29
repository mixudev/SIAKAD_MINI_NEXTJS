---
name: fase-03-user-management
description: "Fase ketiga project SIAKAD. Gunakan skill ini untuk membangun CRUD manajemen user (mahasiswa & dosen) khusus area admin. Membutuhkan schema dan auth dari fase-02-database-auth sudah selesai."
---

# Fase 3: User Management (Admin)

## Tujuan Fase Ini

Admin bisa mengelola seluruh data mahasiswa dan dosen: tambah, lihat, edit, nonaktifkan. Ini adalah modul operasional pertama yang dipakai sehari-hari oleh admin.

## Checklist Tugas

### 1. Manajemen Mahasiswa (`/admin/mahasiswa`)
- [ ] Halaman list mahasiswa: tabel dengan kolom NIM, nama, program studi, angkatan, status, dosen PA — dengan search (by nama/NIM), filter (by program studi, status, angkatan), dan pagination
- [ ] Form tambah mahasiswa baru: input NIM, nama lengkap, program studi, angkatan, dosen PA (dropdown dari list dosen), password awal. Saat submit, ini memanggil `registerUser` dari fase 2 dengan role `mahasiswa`
- [ ] Halaman/modal edit mahasiswa: bisa ubah data kecuali NIM (NIM immutable setelah dibuat — kalau perlu ganti, harus lewat proses khusus, bukan edit biasa)
- [ ] Aksi ubah status mahasiswa (aktif/cuti/lulus/do) — dengan konfirmasi dialog sebelum eksekusi
- [ ] Validasi: NIM harus unique, format NIM bisa disesuaikan [TANYA USER: ada format NIM standar kampus, misal harus 10 digit angka? Jika belum ditentukan, terima string apapun yang unique]

### 2. Manajemen Dosen (`/admin/dosen`)
- [ ] Halaman list dosen: tabel dengan kolom NIDN, nama, program studi, jabatan akademik, jumlah kelas diampu — dengan search dan filter serupa mahasiswa
- [ ] Form tambah dosen baru: input NIDN, nama lengkap, program studi (opsional), jabatan akademik, password awal
- [ ] Halaman/modal edit dosen
- [ ] Tandai dosen mana yang berperan sebagai Dosen PA (bisa banyak dosen jadi PA, masing-masing punya daftar mahasiswa bimbingan — relasi ini sudah ada di kolom `dosen_pa_id` pada tabel `mahasiswa`)

### 3. Manajemen Akun Umum
- [ ] Fitur reset password (admin bisa reset password mahasiswa/dosen yang lupa, generate password baru)
- [ ] Fitur nonaktifkan akun (bukan hapus permanen — soft delete dengan flag, supaya data historis seperti nilai/KRS tidak hilang)

### 4. Import Massal (opsional tapi sangat direkomendasikan untuk kampus)
- [ ] Fitur import mahasiswa/dosen via file CSV/Excel (kolom: NIM/NIDN, nama, program studi, dst) — berguna untuk onboarding mahasiswa baru per angkatan sekaligus
- [ ] Validasi tiap baris saat import, tampilkan error per baris kalau ada data tidak valid (misal NIM duplikat), jangan gagal total kalau hanya sebagian baris error — laporkan baris mana yang gagal dan kenapa

## Yang TIDAK Dikerjakan di Fase Ini

- Belum ada manajemen matkul/kelas/jadwal (itu fase 4)
- Mahasiswa/dosen belum bisa edit profil sendiri (kalau dibutuhkan, ini fitur kecil yang bisa ditambah belakangan, scope-nya beda dari admin mengelola data)

## Definisi "Selesai" untuk Fase Ini

Admin bisa melakukan seluruh siklus CRUD untuk mahasiswa dan dosen lewat UI, termasuk reset password dan nonaktifkan akun. Setelah ini, lanjut ke `fase-04-master-akademik`.
