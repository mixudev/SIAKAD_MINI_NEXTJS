-- ============================================================
-- SIAKAD MINI — Seed Data untuk Testing
-- Jalankan file ini di Supabase SQL Editor SETELAH
-- menjalankan migration 20260629000000_init_schema.sql
-- ============================================================

-- Enable pgcrypto untuk hashing password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. DATA MASTER: Program Studi
-- ============================================================
INSERT INTO public.program_studi (id, nama, kode) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Teknik Informatika', 'TI'),
  ('a1000000-0000-0000-0000-000000000002', 'Sistem Informasi', 'SI'),
  ('a1000000-0000-0000-0000-000000000003', 'Manajemen Bisnis', 'MB')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. DATA MASTER: Semester Aktif
-- ============================================================
INSERT INTO public.semester (id, nama, tahun_akademik, tanggal_mulai, tanggal_selesai, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Ganjil 2025/2026', '2025/2026', '2025-09-01', '2026-01-31', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. AKUN AUTH: Buat 3 user di auth.users dengan shadow email
-- Password untuk semua akun: password
-- ============================================================

-- User: Admin
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'c1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin.siakad@internal.siakad.local',
  crypt('password', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
  '{"nama_lengkap":"Administrator SIAKAD"}'::jsonb,
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- User: Dosen
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'c1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  '0123456789@internal.siakad.local',
  crypt('password', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"dosen"}'::jsonb,
  '{"nama_lengkap":"Dr. Budi Santoso, M.Kom"}'::jsonb,
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- User: Mahasiswa
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'c1000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  '2021310045@internal.siakad.local',
  crypt('password', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"mahasiswa"}'::jsonb,
  '{"nama_lengkap":"Rina Aulia Putri"}'::jsonb,
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. PROFIL PUBLIC: users table
-- ============================================================
INSERT INTO public.users (id, role, username, created_at, updated_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'admin',     'admin.siakad', now(), now()),
  ('c1000000-0000-0000-0000-000000000002', 'dosen',     '0123456789',   now(), now()),
  ('c1000000-0000-0000-0000-000000000003', 'mahasiswa', '2021310045',   now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. PROFIL DOSEN
-- ============================================================
INSERT INTO public.dosen (id, user_id, nidn, nama_lengkap, program_studi_id, jabatan_akademik) VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    '0123456789',
    'Dr. Budi Santoso, M.Kom',
    'a1000000-0000-0000-0000-000000000001',
    'Lektor Kepala'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. PROFIL MAHASISWA
-- ============================================================
INSERT INTO public.mahasiswa (id, user_id, nim, nama_lengkap, program_studi_id, angkatan, status, dosen_pa_id) VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    '2021310045',
    'Rina Aulia Putri',
    'a1000000-0000-0000-0000-000000000001',
    2021,
    'aktif',
    'd1000000-0000-0000-0000-000000000001' -- Dosen PA: Dr. Budi
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SELESAI! Akun siap digunakan:
--
-- Role      | Login Identifier     | Password
-- ----------|----------------------|------------------
-- Admin     | admin.siakad         | password
-- Dosen     | 0123456789 (NIDN)    | password
-- Mahasiswa | 2021310045 (NIM)     | password
-- ============================================================
