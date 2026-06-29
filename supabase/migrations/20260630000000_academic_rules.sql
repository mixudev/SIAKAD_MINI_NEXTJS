-- Fase 9: Academic Rules Enhancement
-- Prerequisite table, semester_ke check, schedule conflict prevention

-- 1. MATA KULIAH PREREQUISITE
CREATE TABLE IF NOT EXISTS public.mata_kuliah_prerequisite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_kuliah_id uuid NOT NULL REFERENCES public.mata_kuliah(id) ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES public.mata_kuliah(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(mata_kuliah_id, prerequisite_id),
  CHECK(mata_kuliah_id != prerequisite_id)
);

ALTER TABLE public.mata_kuliah_prerequisite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_prerequisite" ON public.mata_kuliah_prerequisite
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "select_prerequisite" ON public.mata_kuliah_prerequisite
  FOR SELECT USING (true);

-- 2. INDEXES for common KRS validation lookups
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_prerequisite_matkul ON public.mata_kuliah_prerequisite(mata_kuliah_id);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_prerequisite_prereq ON public.mata_kuliah_prerequisite(prerequisite_id);
CREATE INDEX IF NOT EXISTS idx_nilai_akhir_mahasiswa_kelas ON public.nilai_akhir(mahasiswa_id, kelas_id);
CREATE INDEX IF NOT EXISTS idx_krs_detail_kelas ON public.krs_detail(kelas_id);
CREATE INDEX IF NOT EXISTS idx_pertemuan_kelas ON public.pertemuan(kelas_id);
CREATE INDEX IF NOT EXISTS idx_absensi_pertemuan_mahasiswa ON public.absensi(pertemuan_id, mahasiswa_id);
