---
name: fase-07-penilaian
description: "Fase ketujuh project SIAKAD. Gunakan skill ini untuk membangun sistem penilaian dengan komponen nilai berbobot custom per kelas (tugas/UTS/UAS) dan kalkulasi nilai akhir otomatis. Membutuhkan KRS yang disetujui dari fase-05-krs sebagai basis daftar mahasiswa per kelas."
---

# Fase 7: Penilaian

## Tujuan Fase Ini

Dosen bisa mendefinisikan komponen nilai per kelas (dengan bobot custom, bukan fixed), input nilai per komponen per mahasiswa, dan sistem menghitung nilai akhir + konversi ke huruf secara otomatis.

## Alur Bisnis Penilaian

1. Dosen mendefinisikan komponen nilai untuk kelas yang diajar — misal "Tugas" 20%, "UTS" 30%, "UAS" 50% (bobot total HARUS 100%, divalidasi)
2. Dosen input nilai angka (0-100) per komponen, per mahasiswa
3. Begitu semua komponen terisi untuk seorang mahasiswa, sistem menghitung nilai akhir = Σ(nilai_komponen × bobot_komponen), lalu konversi ke huruf
4. Mahasiswa melihat nilai akhir (dan idealnya breakdown komponennya) di KHS

## Checklist Tugas

### 1. Setup Komponen Nilai — Dosen (`/dosen/input-nilai`)
- [ ] Per kelas yang diajar, dosen bisa menambah komponen nilai: nama komponen (bebas, misal "Tugas 1", "Kuis", "UTS", "UAS"), bobot persen
- [ ] **Validasi total bobot = 100%** sebelum komponen bisa "dikunci"/dipakai untuk input nilai — tampilkan running total saat dosen menambah komponen, beri warning jika belum/sudah lebih dari 100%
- [ ] Bisa edit/hapus komponen SELAMA belum ada nilai yang diinput untuk komponen itu. Setelah ada nilai masuk, hapus komponen harus konfirmasi tegas (karena akan menghapus nilai terkait)

### 2. Input Nilai per Komponen
- [ ] Halaman input nilai: tabel dengan baris = mahasiswa (dari KRS disetujui di kelas tersebut), kolom = komponen nilai yang sudah didefinisikan, cell = input angka 0-100
- [ ] Validasi range input (0-100), tolak input di luar range
- [ ] Bisa save sebagian (tidak harus isi semua mahasiswa sekaligus), dan kembali edit nanti
- [ ] Tampilkan kolom "Nilai Akhir" (read-only, terhitung otomatis) di ujung tabel yang update live/setelah save, hanya terisi kalau SEMUA komponen untuk mahasiswa itu sudah ada nilainya

### 3. Kalkulasi & Konversi Nilai Huruf
- [ ] Implementasikan function kalkulasi: `nilai_akhir = Σ(nilai_komponen_i × bobot_i / 100)`
- [ ] Implementasikan konversi ke huruf. [ASUMSI default jika belum ditentukan user]:
  - 85-100 → A
  - 75-84 → B
  - 65-74 → C
  - 50-64 → D
  - 0-49 → E
  - **[TANYA USER: apakah kampus ini punya skala konversi huruf resmi sendiri (termasuk apakah pakai A-, B+, dst)? Ganti tabel konversi ini sesuai aturan kampus yang sebenarnya]**
- [ ] Simpan hasil kalkulasi ke tabel `nilai_akhir` (cache) setiap kali ada perubahan nilai komponen terkait — jangan hitung ulang on-the-fly setiap render, supaya performa KHS/transkrip tetap cepat

### 4. Tampilan Nilai — Mahasiswa
- [ ] Mahasiswa bisa lihat nilai akhir per matkul di semester aktif (bagian dari KHS, detail lengkap di fase 8) — di fase ini cukup pastikan data nilai akhir bisa di-query dengan benar dari sisi mahasiswa (RLS-nya)

### 5. Monitoring Nilai — Admin
- [ ] Lihat status pengisian nilai per kelas (sudah lengkap / belum) untuk follow-up ke dosen yang belum input nilai mendekati akhir semester

## Yang TIDAK Dikerjakan di Fase Ini

- Tampilan KHS dan transkrip yang dirapikan untuk dicetak/diunduh ada di fase 8, di fase ini cukup pastikan data dan kalkulasinya benar
- Tidak ada revisi nilai oleh mahasiswa (pengajuan sanggah nilai) kecuali diminta eksplisit — proses ini dianggap manual/offline kecuali user minta dibuatkan sistemnya

## Definisi "Selesai" untuk Fase Ini

Dosen bisa setup komponen nilai dengan bobot custom, input nilai per komponen, dan sistem menghitung nilai akhir + huruf secara otomatis dan akurat. Setelah ini, lanjut ke `fase-08-dashboard-reporting`.
