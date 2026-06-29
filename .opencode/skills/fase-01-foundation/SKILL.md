---
name: fase-01-foundation
description: "Fase pertama project SIAKAD. Gunakan skill ini saat memulai project dari nol: setup Next.js, koneksi Supabase, struktur folder dasar, dan komponen UI dasar. Selesaikan fase ini sebelum lanjut ke fase-02-database-auth."
---

# Fase 1: Foundation & Setup

## Tujuan Fase Ini

Menyiapkan kerangka project yang solid sehingga fase-fase berikutnya bisa langsung fokus ke fitur, tanpa bolak-balik benerin setup dasar.

## Checklist Tugas

### 1. Inisialisasi Project
- [ ] Init Next.js 15 dengan App Router, TypeScript, Tailwind CSS, ESLint
- [ ] Install dependency inti: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`
- [ ] Setup shadcn/ui (`npx shadcn@latest init`)
- [ ] Buat struktur folder sesuai skill `tech-stack` (folder `/actions`, `/lib/supabase`, `/lib/validations`, `/types`, dll)

### 2. Koneksi Supabase
- [ ] Buat project Supabase (atau gunakan yang sudah ada jika user sudah punya)
- [ ] Setup environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (service role HANYA dipakai di server, jangan pernah expose ke client)
- [ ] Buat `lib/supabase/client.ts` (browser client) dan `lib/supabase/server.ts` (server client) sesuai pola `@supabase/ssr` resmi untuk Next.js App Router
- [ ] Buat middleware untuk refresh session (`middleware.ts` di root)
- [ ] Setup folder `/supabase/migrations` untuk tracking schema (kalau pakai Supabase CLI lokal)

### 3. Layout Dasar & Routing Skeleton
- [ ] Buat route group `(auth)` untuk halaman login (belum perlu logic auth penuh, cukup skeleton halaman)
- [ ] Buat route group `(dashboard)` dengan sub-folder `/admin`, `/dosen`, `/mahasiswa` — masing-masing dengan `layout.tsx` yang punya sidebar sesuai role-nya (boleh hardcode menu dulu, belum perlu data dinamis)
- [ ] Pastikan layout responsive dasar (sidebar collapse di mobile)

### 4. Komponen UI Dasar
- [ ] Install komponen shadcn yang pasti dipakai: `button`, `input`, `label`, `card`, `table`, `badge`, `form`, `select`, `dialog`, `dropdown-menu`, `sonner` (untuk toast notification)
- [ ] Terapkan design tokens dari skill `design-system` ke `globals.css` dan `tailwind.config`
- [ ] Buat 1-2 komponen shared dasar yang akan dipakai berulang: `PageHeader` (judul halaman + breadcrumb), `EmptyState` (tampilan saat data kosong)

### 5. Verifikasi
- [ ] Project bisa `npm run dev` tanpa error
- [ ] Koneksi ke Supabase berhasil (test dengan query sederhana, misal `select now()`)
- [ ] Ketiga layout role (admin/dosen/mahasiswa) bisa diakses dan menampilkan sidebar masing-masing

## Yang TIDAK Dikerjakan di Fase Ini

- Belum ada logic auth sungguhan (login masih skeleton/dummy)
- Belum ada tabel database selain yang Supabase generate default
- Belum ada data asli ditampilkan di manapun

## Definisi "Selesai" untuk Fase Ini

Project bisa di-run, struktur folder sudah sesuai konvensi, 3 layout role sudah ada (meski isinya kosong), dan koneksi Supabase terverifikasi jalan. Setelah ini, lanjut ke `fase-02-database-auth`.
