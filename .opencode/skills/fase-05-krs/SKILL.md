---
name: fase-05-krs
description: "Fase kelima project SIAKAD. Gunakan skill ini untuk membangun sistem KRS (Kartu Rencana Studi): mahasiswa memilih kelas, mengajukan, dan dosen PA melakukan approval. Membutuhkan master data dari fase-04-master-akademik sudah selesai."
---

# Fase 5: KRS & Pengajuan KRS

## Tujuan Fase Ini

Mahasiswa bisa menyusun rencana studi (pilih kelas-kelas yang mau diambil di semester aktif), mengajukan ke Dosen PA, dan Dosen PA bisa menyetujui atau menolak.

## Alur Bisnis KRS (pahami dulu sebelum implementasi)

1. Mahasiswa membuka halaman KRS di semester aktif → status awal `draft`
2. Mahasiswa menambah/menghapus kelas dari draft KRS-nya (lihat daftar kelas yang dibuka, dengan info jadwal, dosen, SKS, sisa kuota)
3. Mahasiswa klik "Ajukan KRS" → status berubah jadi `diajukan`, draft terkunci (tidak bisa diedit mahasiswa lagi sampai ada keputusan)
4. Dosen PA melihat daftar KRS mahasiswa bimbingannya yang berstatus `diajukan` → bisa **setujui** (status → `disetujui`) atau **tolak** (status → `ditolak`, dengan catatan alasan, mahasiswa bisa edit lagi dan ajukan ulang)
5. KRS yang `disetujui` mengunci mahasiswa ke kelas-kelas tersebut — dipakai sebagai basis absensi (fase 6) dan penilaian (fase 7)

## Checklist Tugas

### 1. Halaman KRS Mahasiswa (`/mahasiswa/krs`)
- [ ] Tampilkan semester aktif dan status KRS mahasiswa saat ini (draft/diajukan/disetujui/ditolak)
- [ ] Daftar kelas yang bisa diambil: tampilkan matkul, kelas, dosen, jadwal (hari/jam/ruangan), SKS, sisa kuota (kapasitas - jumlah yang sudah ambil)
- [ ] **Validasi maksimal SKS**: total SKS yang diambil tidak boleh melebihi batas [TANYA USER: berapa batas maksimal SKS per semester di kampus ini? umumnya 24 SKS, tapi bisa beda. Default ke 24 jika tidak ditentukan]
- [ ] **Validasi kelas penuh**: kelas dengan kuota habis tidak bisa ditambah ke KRS (tampilkan sebagai disabled/badge "Penuh")
- [ ] **Validasi bentrok jadwal**: tolak jika mahasiswa mencoba ambil 2 kelas dengan jadwal yang overlap
- [ ] Tampilkan ringkasan: total SKS yang sudah dipilih vs batas maksimal
- [ ] Tombol "Ajukan KRS" — hanya aktif kalau status masih `draft` dan minimal 1 kelas dipilih
- [ ] Setelah diajukan, tampilkan read-only view (tidak bisa edit) + status badge yang jelas

### 2. Halaman Approval KRS — Dosen PA (`/dosen/krs-bimbingan`)
- [ ] List mahasiswa bimbingan dengan status KRS masing-masing, filter by status (terutama yang `diajukan` perlu ditindak)
- [ ] Detail KRS per mahasiswa: lihat kelas-kelas yang diajukan, total SKS
- [ ] Aksi **Setujui** — ubah status ke `disetujui`
- [ ] Aksi **Tolak** — wajib isi catatan/alasan, ubah status ke `ditolak`, mahasiswa bisa edit dan ajukan ulang setelah ini
- [ ] [TANYA USER kalau relevan: apakah Dosen PA bisa approve sebagian kelas saja dan tolak sisanya (partial approval), atau approval selalu untuk keseluruhan KRS sekaligus? Default ke approval keseluruhan kalau tidak disebutkan, karena lebih sederhana]

### 3. Halaman Monitoring KRS — Admin (`/admin/krs`)
- [ ] List seluruh KRS semua mahasiswa di semester aktif, dengan filter by status, program studi, dosen PA
- [ ] Admin bisa override status KRS dalam kasus khusus (misal Dosen PA tidak merespons tepat waktu) — dengan log siapa yang melakukan override

### 4. Server Actions & Validasi Bisnis
- [ ] `addKelasKeKrs(krsId, kelasId)` — validasi kuota, bentrok jadwal, dan batas SKS sebelum insert ke `krs_detail`
- [ ] `removeKelasDariKrs(krsId, kelasId)` — hanya bisa kalau status masih `draft`
- [ ] `submitKrs(krsId)` — ubah status ke `diajukan`, validasi minimal 1 kelas
- [ ] `approveKrs(krsId, dosenId)` / `rejectKrs(krsId, dosenId, catatan)` — validasi bahwa dosen yang melakukan aksi memang dosen PA dari mahasiswa terkait (jangan andalkan UI saja, validasi juga di server action/RLS)

## Yang TIDAK Dikerjakan di Fase Ini

- Belum ada absensi atau penilaian terhadap kelas-kelas yang sudah di-KRS (itu fase 6 dan 7, tapi mereka akan query relasi dari `krs_detail` yang dibuat di fase ini)
- Belum ada periode "masa KRS" otomatis (buka/tutup tanggal tertentu) — kecuali user minta, anggap KRS bisa diajukan kapan saja selama semester aktif

## Definisi "Selesai" untuk Fase Ini

Mahasiswa bisa menyusun dan mengajukan KRS dengan semua validasi (SKS, kuota, bentrok jadwal) berjalan benar, dan Dosen PA bisa approve/reject dengan alur yang jelas. Setelah ini, lanjut ke `fase-06-absensi`.
