---
name: tech-stack
description: "WAJIB dibaca di setiap fase. Berisi stack teknis yang dipakai, struktur folder project, konvensi penamaan, dan library yang boleh/tidak boleh dipakai. Berlaku untuk seluruh fase tanpa terkecuali."
---

# Tech Stack & Konvensi Project

## Stack Utama

- **Framework**: Next.js 15 (App Router) — TypeScript, bukan JavaScript
- **Database & Backend**: Supabase (Postgres + Auth + Storage + Realtime jika dibutuhkan)
- **ORM/Query**: Supabase client (`@supabase/supabase-js` + `@supabase/ssr` untuk Next.js App Router)
- **Styling**: Tailwind CSS
- **Komponen UI**: shadcn/ui sebagai basis komponen (boleh dikustomisasi sesuai design-system)
- **Form handling**: React Hook Form + Zod untuk validasi schema
- **State management**: React Server Components + Server Actions sebagai default. Gunakan client state (`useState`/`zustand` jika perlu) HANYA untuk interaktivitas UI murni (modal, toggle, dsb), bukan untuk data yang bisa di-fetch di server.

## Library yang DILARANG Tanpa Konfirmasi

- Jangan menambah ORM lain (Prisma, Drizzle, dll) — kita pakai Supabase client langsung supaya konsisten dengan RLS policy
- Jangan menambah state management library berat (Redux, Recoil) — cukup React state + Server Components
- Jangan menambah library auth pihak ketiga (NextAuth, Clerk) — auth sepenuhnya lewat Supabase Auth
- Jangan menambah dependency baru yang belum ada di `package.json` tanpa menyebutkan ke user alasannya dan minta konfirmasi singkat

## Struktur Folder

```
/app
  /(auth)
    /login
  /(dashboard)
    /admin
      /mahasiswa
      /dosen
      /matkul
      /kelas
      /jadwal
      /krs
      /absensi
      /penilaian
    /dosen
      /kelas-saya
      /input-nilai
      /absensi
      /krs-bimbingan      # khusus dosen PA
    /mahasiswa
      /krs
      /jadwal
      /khs
      /absensi-saya
  /api                      # hanya jika butuh route handler di luar Server Action
/components
  /ui                       # shadcn components
  /shared                   # komponen reusable lintas role (table, card, dsb)
  /forms                    # form components per modul
/lib
  /supabase
    client.ts                # browser client
    server.ts                # server client
    middleware.ts            # session refresh middleware
  /validations               # Zod schema per modul
  /utils.ts
/types
  database.types.ts          # generated dari Supabase CLI (`supabase gen types`)
  index.ts                   # type tambahan custom
/actions                     # Server Actions, dikelompokkan per modul
  mahasiswa.ts
  dosen.ts
  krs.ts
  penilaian.ts
  absensi.ts
  ...
```

## Konvensi Penamaan

- **File & folder**: `kebab-case` (misal `input-nilai`, `krs-bimbingan`)
- **Komponen React**: `PascalCase` (misal `TabelMahasiswa.tsx`)
- **Server Actions & function**: `camelCase`, prefix kata kerja (misal `createMahasiswa`, `approveKrs`, `calculateNilaiAkhir`)
- **Tabel database**: `snake_case`, bentuk jamak (misal `mahasiswa`, `dosen`, `mata_kuliah`, `kelas`, `jadwal`, `krs`, `krs_detail`, `absensi`, `komponen_nilai`, `nilai`)
- **Kolom database**: `snake_case` (misal `created_at`, `dosen_id`, `nim`)
- **Environment variables**: `UPPER_SNAKE_CASE`, prefix `NEXT_PUBLIC_` hanya untuk yang memang harus exposed ke browser (URL & anon key Supabase)

## Aturan Server vs Client

- Default-kan komponen sebagai **Server Component**. Tambahkan `"use client"` HANYA kalau komponen butuh interaktivitas browser (event handler, hooks seperti `useState`/`useEffect`).
- Mutasi data (create/update/delete) HARUS lewat **Server Actions** di folder `/actions`, bukan lewat API route kecuali ada kebutuhan khusus (misal webhook).
- Fetch data untuk halaman dilakukan di Server Component langsung (async component), bukan di client dengan `useEffect`.

## Supabase Spesifik

- Selalu pakai **typed client** — generate types dari schema (`database.types.ts`) dan gunakan di semua query supaya type-safe.
- Semua tabel HARUS punya **Row Level Security (RLS)** aktif sejak fase 2. Tidak ada tabel yang dibiarkan tanpa RLS, bahkan untuk sementara.
- Gunakan Supabase **migration files** (folder `/supabase/migrations`) untuk setiap perubahan schema, jangan ubah schema langsung dari dashboard tanpa menuliskan migration-nya juga di kode, supaya schema bisa direplikasi dan ditrack di git.
