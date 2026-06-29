---
name: fase-08-dashboard-reporting
description: "Fase kedelapan project SIAKAD. Gunakan skill ini untuk membangun dashboard ringkasan per role dan halaman reporting: KHS, transkrip, rekap kehadiran dan nilai. Membutuhkan semua fase sebelumnya (2-7) sudah selesai karena modul ini mengagregasi data dari semuanya."
---

# Fase 8: Dashboard & Reporting

## Tujuan Fase Ini

Menyajikan data yang sudah ada (dari fase 2-7) dalam bentuk yang mudah dibaca: dashboard ringkasan per role saat login, serta dokumen akademik formal (KHS, transkrip).

## Checklist Tugas

### 1. Dashboard Admin (`/admin`)
- [ ] Card ringkasan: total mahasiswa aktif, total dosen, total kelas berjalan di semester aktif, total KRS yang masih `diajukan` (perlu ditindak)
- [ ] Grafik/tabel sederhana: distribusi mahasiswa per program studi atau angkatan
- [ ] Daftar "perlu perhatian": kelas yang belum ada jadwal, kelas yang dosennya belum input nilai, KRS yang menunggu approval terlalu lama

### 2. Dashboard Dosen (`/dosen`)
- [ ] Card ringkasan: jumlah kelas yang diajar di semester aktif, jumlah mahasiswa bimbingan (jika jadi dosen PA) dengan KRS pending approval
- [ ] List kelas yang diajar dengan shortcut langsung ke input absensi/nilai kelas tersebut

### 3. Dashboard Mahasiswa (`/mahasiswa`)
- [ ] Card ringkasan: status KRS semester ini, total SKS diambil, IPK sementara/terakhir
- [ ] Jadwal kuliah hari ini/minggu ini (ringkas)
- [ ] Shortcut ke KRS, KHS, absensi

### 4. KHS — Kartu Hasil Studi (`/mahasiswa/khs`)
- [ ] Tampilkan per semester: daftar matkul yang diambil, SKS, nilai huruf, nilai angka
- [ ] Hitung **IP Semester** (Indeks Prestasi semester tersebut) = Σ(SKS × bobot_huruf) / Σ(SKS)
- [ ] [TANYA USER: konfirmasi tabel bobot huruf ke angka untuk hitung IP, misal A=4, B=3, C=2, D=1, E=0 — sesuaikan dengan skala resmi kampus]
- [ ] Dropdown/selector untuk pilih semester mana yang mau dilihat (histori semester lalu, bukan cuma semester aktif)
- [ ] Opsi cetak/export ke PDF (gunakan layout yang rapi dan formal, sesuai skill `design-system` untuk styling, tapi versi cetak boleh lebih sederhana/print-friendly)

### 5. Transkrip Akademik (`/mahasiswa/khs` atau halaman terpisah `/mahasiswa/transkrip`)
- [ ] Akumulasi seluruh semester yang sudah dijalani, hitung **IPK** (Indeks Prestasi Kumulatif) = Σ(SKS × bobot_huruf semua semester) / Σ(SKS semua semester)
- [ ] Tampilkan status kelulusan per matkul (lulus jika nilai huruf di atas batas minimum tertentu, [TANYA USER: nilai huruf apa yang dianggap "tidak lulus"/harus mengulang matkul, umumnya D atau E])
- [ ] Export PDF untuk transkrip ini juga

### 6. Reporting Admin Tambahan
- [ ] Rekap nilai per kelas (bisa diakses admin untuk semua kelas, bukan hanya dosen pengampu)
- [ ] Rekap kehadiran lintas kelas
- [ ] Export data ke Excel/CSV untuk kebutuhan pelaporan eksternal (akreditasi, dll) — [TANYA USER kalau ada format pelaporan spesifik yang dibutuhkan, misal format PDDikti]

## Yang TIDAK Dikerjakan di Fase Ini

- Tidak membuat ulang logic kalkulasi nilai/absensi — fase ini hanya MENAMPILKAN data yang sudah dihitung di fase 6 dan 7
- Belum ada fitur analytics/BI yang kompleks (prediksi, machine learning, dsb) kecuali diminta eksplisit

## Definisi "Selesai" untuk Fase Ini

Setiap role punya dashboard ringkasan yang informatif saat login, dan mahasiswa bisa melihat serta mengunduh KHS per semester dan transkrip kumulatif dengan kalkulasi IP/IPK yang akurat. Setelah ini, lanjut ke `fase-09-polish-hardening`.
