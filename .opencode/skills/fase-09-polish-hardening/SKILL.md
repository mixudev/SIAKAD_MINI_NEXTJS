---
name: fase-09-polish-hardening
description: "Fase kesembilan dan terakhir project SIAKAD. Gunakan skill ini untuk validasi menyeluruh, error handling, security review, dan optimasi sebelum sistem dianggap production-ready. Jalankan setelah semua fase fungsional (1-8) selesai."
---

# Fase 9: Polish & Hardening

## Tujuan Fase Ini

Mengubah sistem dari "fungsional" menjadi "siap produksi" — memastikan keamanan, validasi, penanganan error, dan pengalaman pengguna sudah matang di seluruh modul, bukan cuma di jalur "happy path".

## Checklist Tugas

### 1. Security Review
- [ ] Audit ulang SEMUA RLS policy dari fase 2 — pastikan tidak ada tabel yang bisa diakses lintas role secara tidak sengaja (misal mahasiswa A bisa lihat nilai mahasiswa B lewat manipulasi request)
- [ ] Pastikan `SUPABASE_SERVICE_ROLE_KEY` tidak pernah dipakai di client component atau ter-expose ke browser
- [ ] Cek semua Server Action — pastikan validasi role/permission dilakukan DI SERVER (jangan percaya saja pada UI yang menyembunyikan tombol), karena Server Action bisa dipanggil langsung
- [ ] Rate limiting dasar untuk halaman login (mencegah brute force NIM/NIDN/password)
- [ ] Pastikan semua input dari user disanitasi/divalidasi dengan Zod sebelum masuk ke database — tidak ada query yang menerima raw input tanpa validasi schema

### 2. Validasi & Error Handling
- [ ] Review semua form — pastikan ada pesan error yang jelas dan dalam Bahasa Indonesia untuk setiap kemungkinan kegagalan validasi (bukan pesan error teknis mentah dari database)
- [ ] Tangani edge case: apa yang terjadi kalau admin menghapus matkul yang sudah punya kelas berjalan? Kelas yang sudah punya KRS? Pastikan ada pencegahan (tidak bisa hapus data yang sudah punya relasi aktif) atau soft-delete, bukan cascade delete yang menghapus data historis
- [ ] Tangani race condition pada KRS: dua mahasiswa submit di waktu hampir sama untuk kelas dengan kuota tersisa 1 — pastikan validasi kuota dilakukan di level database (constraint/transaction), bukan hanya dicek di client sebelum submit
- [ ] Loading state & skeleton untuk semua halaman yang fetch data (jangan ada layar kosong/blank saat loading)
- [ ] Empty state yang jelas untuk semua list/tabel yang mungkin kosong (belum ada mahasiswa, belum ada matkul, dst)

### 3. Konsistensi UX
- [ ] Review seluruh sistem terhadap skill `design-system` — pastikan tidak ada halaman yang "lupa" styling konsisten (terutama halaman yang dibuat di fase-fase awal sebelum pola UI matang)
- [ ] Pastikan semua aksi destruktif (hapus, reject, nonaktifkan akun) selalu ada dialog konfirmasi
- [ ] Pastikan semua aksi yang berhasil/gagal memberi feedback (toast notification), tidak ada aksi "diam-diam" tanpa konfirmasi visual
- [ ] Cek responsive di semua halaman utama, terutama tabel-tabel besar (KHS, rekap absensi/nilai) di layar kecil

### 4. Performa
- [ ] Cek query yang berpotensi N+1 (misal load data mahasiswa lalu fetch nilai satu-satu per mahasiswa dalam loop) — ganti dengan join/batch query
- [ ] Pastikan tabel dengan banyak baris (mahasiswa, nilai, absensi) menggunakan pagination di level query (bukan fetch semua lalu paginate di client)
- [ ] Index database untuk kolom yang sering jadi filter/join: `mahasiswa.nim`, `dosen.nidn`, foreign key di semua tabel relasi

### 5. Data Integrity
- [ ] Pastikan constraint database (unique, foreign key, check constraint untuk bobot nilai 0-100, dst) sudah didefinisikan di level database, bukan hanya divalidasi di application layer — sebagai lapisan pertahanan kedua
- [ ] Review ulang flow "satu semester aktif" — pastikan tidak ada kondisi di mana 2 semester bisa aktif bersamaan akibat race condition saat admin toggle status

### 6. Dokumentasi Minimal untuk Handover
- [ ] README singkat: cara setup project (env vars, migration, seed data awal kalau ada)
- [ ] Daftar akun default/admin pertama (cara membuat admin pertama kali, karena tidak ada self-register)

## Yang TIDAK Dikerjakan di Fase Ini

- Tidak menambah fitur baru — fase ini murni mengeraskan (harden) apa yang sudah dibangun di fase 1-8
- Kalau saat review ditemukan fitur yang ternyata belum lengkap (bukan soal hardening tapi memang belum dibangun), catat dan informasikan ke user, jangan diam-diam menambah scope baru di fase ini

## Definisi "Selesai" untuk Fase Ini

Sistem sudah melewati review keamanan dan validasi, edge case-edge case penting sudah ditangani, dan secara keseluruhan terasa solid untuk dipakai sebagai sistem produksi kampus — bukan lagi terasa seperti prototype.
