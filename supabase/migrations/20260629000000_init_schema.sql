-- Setup update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create PUBLIC USERS profile table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'dosen', 'mahasiswa')),
  username text UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON public.users 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Create PROGRAM STUDI table
CREATE TABLE IF NOT EXISTS public.program_studi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  kode text UNIQUE NOT NULL
);

-- 3. Create DOSEN table
CREATE TABLE IF NOT EXISTS public.dosen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nidn text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  program_studi_id uuid REFERENCES public.program_studi(id) ON DELETE SET NULL,
  jabatan_akademik text
);

-- 4. Create MAHASISWA table
CREATE TABLE IF NOT EXISTS public.mahasiswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nim text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  program_studi_id uuid REFERENCES public.program_studi(id) ON DELETE RESTRICT NOT NULL,
  angkatan integer NOT NULL,
  status text NOT NULL CHECK (status IN ('aktif', 'cuti', 'lulus', 'do')) DEFAULT 'aktif',
  dosen_pa_id uuid REFERENCES public.dosen(id) ON DELETE SET NULL
);

-- 5. Create SEMESTER table
CREATE TABLE IF NOT EXISTS public.semester (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  tahun_akademik text NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_selesai date NOT NULL,
  is_active boolean DEFAULT false NOT NULL
);

-- Index to enforce only ONE active semester at any time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_semester 
ON public.semester (is_active) 
WHERE (is_active = true);

-- 6. Create MATA KULIAH table
CREATE TABLE IF NOT EXISTS public.mata_kuliah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_matkul text UNIQUE NOT NULL,
  nama text NOT NULL,
  sks integer NOT NULL,
  program_studi_id uuid REFERENCES public.program_studi(id) ON DELETE CASCADE NOT NULL,
  semester_ke integer NOT NULL
);

-- 7. Create KELAS table
CREATE TABLE IF NOT EXISTS public.kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_kuliah_id uuid REFERENCES public.mata_kuliah(id) ON DELETE CASCADE NOT NULL,
  semester_id uuid REFERENCES public.semester(id) ON DELETE CASCADE NOT NULL,
  dosen_id uuid REFERENCES public.dosen(id) ON DELETE CASCADE NOT NULL,
  nama_kelas text NOT NULL,
  kapasitas integer NOT NULL
);

-- 8. Create JADWAL table
CREATE TABLE IF NOT EXISTS public.jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE NOT NULL,
  hari text NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  ruangan text NOT NULL
);

-- 9. Create KRS table
CREATE TABLE IF NOT EXISTS public.krs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid REFERENCES public.mahasiswa(id) ON DELETE CASCADE NOT NULL,
  semester_id uuid REFERENCES public.semester(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'diajukan', 'disetujui', 'ditolak')) DEFAULT 'draft',
  tanggal_pengajuan timestamp with time zone,
  disetujui_oleh uuid REFERENCES public.dosen(id) ON DELETE SET NULL,
  catatan_dosen_pa text,
  UNIQUE (mahasiswa_id, semester_id)
);

-- 10. Create KRS DETAIL table
CREATE TABLE IF NOT EXISTS public.krs_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  krs_id uuid REFERENCES public.krs(id) ON DELETE CASCADE NOT NULL,
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (krs_id, kelas_id)
);

-- 11. Create PERTEMUAN table
CREATE TABLE IF NOT EXISTS public.pertemuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE NOT NULL,
  pertemuan_ke integer NOT NULL,
  tanggal date NOT NULL,
  materi text
);

-- 12. Create ABSENSI table
CREATE TABLE IF NOT EXISTS public.absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pertemuan_id uuid REFERENCES public.pertemuan(id) ON DELETE CASCADE NOT NULL,
  mahasiswa_id uuid REFERENCES public.mahasiswa(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
  keterangan text,
  UNIQUE (pertemuan_id, mahasiswa_id)
);

-- 13. Create KOMPONEN NILAI table
CREATE TABLE IF NOT EXISTS public.komponen_nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE NOT NULL,
  nama_komponen text NOT NULL,
  bobot_persen numeric NOT NULL
);

-- 14. Create NILAI table
CREATE TABLE IF NOT EXISTS public.nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  komponen_nilai_id uuid REFERENCES public.komponen_nilai(id) ON DELETE CASCADE NOT NULL,
  mahasiswa_id uuid REFERENCES public.mahasiswa(id) ON DELETE CASCADE NOT NULL,
  nilai_angka numeric NOT NULL CHECK (nilai_angka >= 0 AND nilai_angka <= 100),
  UNIQUE (komponen_nilai_id, mahasiswa_id)
);

-- 15. Create NILAI AKHIR table
CREATE TABLE IF NOT EXISTS public.nilai_akhir (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid REFERENCES public.mahasiswa(id) ON DELETE CASCADE NOT NULL,
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE NOT NULL,
  nilai_angka_akhir numeric CHECK (nilai_angka_akhir >= 0 AND nilai_angka_akhir <= 100),
  nilai_huruf text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (mahasiswa_id, kelas_id)
);

CREATE TRIGGER update_nilai_akhir_updated_at 
BEFORE UPDATE ON public.nilai_akhir 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_studi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.krs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.krs_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pertemuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komponen_nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_akhir ENABLE ROW LEVEL SECURITY;


-- 1. USERS POLICIES
CREATE POLICY admin_all ON public.users 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_self ON public.users 
  FOR SELECT TO authenticated 
  USING (id = auth.uid());


-- 2. PROGRAM STUDI POLICIES
CREATE POLICY admin_all ON public.program_studi 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.program_studi 
  FOR SELECT TO authenticated 
  USING (true);


-- 3. DOSEN POLICIES
CREATE POLICY admin_all ON public.dosen 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.dosen 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY update_self ON public.dosen 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());


-- 4. MAHASISWA POLICIES
CREATE POLICY admin_all ON public.mahasiswa 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY mhs_select_self ON public.mahasiswa 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY dosen_select_students ON public.mahasiswa 
  FOR SELECT TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'dosen');


-- 5. SEMESTER POLICIES
CREATE POLICY admin_all ON public.semester 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.semester 
  FOR SELECT TO authenticated 
  USING (true);


-- 6. MATA KULIAH POLICIES
CREATE POLICY admin_all ON public.mata_kuliah 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.mata_kuliah 
  FOR SELECT TO authenticated 
  USING (true);


-- 7. KELAS POLICIES
CREATE POLICY admin_all ON public.kelas 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.kelas 
  FOR SELECT TO authenticated 
  USING (true);


-- 8. JADWAL POLICIES
CREATE POLICY admin_all ON public.jadwal 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY select_all ON public.jadwal 
  FOR SELECT TO authenticated 
  USING (true);


-- 9. KRS POLICIES
CREATE POLICY admin_all ON public.krs 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY mhs_access_own ON public.krs 
  FOR ALL TO authenticated 
  USING (mahasiswa_id IN (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid()));

CREATE POLICY dosen_access_bimbingan ON public.krs 
  FOR ALL TO authenticated 
  USING (
    mahasiswa_id IN (
      SELECT id FROM public.mahasiswa 
      WHERE dosen_pa_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );


-- 10. KRS DETAIL POLICIES
CREATE POLICY admin_all ON public.krs_detail 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY mhs_access_own ON public.krs_detail 
  FOR ALL TO authenticated 
  USING (
    krs_id IN (
      SELECT id FROM public.krs 
      WHERE mahasiswa_id IN (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid())
    )
  );

CREATE POLICY dosen_select_all ON public.krs_detail 
  FOR SELECT TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'dosen');


-- 11. PERTEMUAN POLICIES
CREATE POLICY admin_all ON public.pertemuan 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY dosen_access_own ON public.pertemuan 
  FOR ALL TO authenticated 
  USING (
    kelas_id IN (
      SELECT id FROM public.kelas 
      WHERE dosen_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );

CREATE POLICY mhs_select_enrolled ON public.pertemuan 
  FOR SELECT TO authenticated 
  USING (
    kelas_id IN (
      SELECT kd.kelas_id FROM public.krs_detail kd
      JOIN public.krs k ON k.id = kd.krs_id
      JOIN public.mahasiswa m ON m.id = k.mahasiswa_id
      WHERE m.user_id = auth.uid() AND k.status = 'disetujui'
    )
  );


-- 12. ABSENSI POLICIES
CREATE POLICY admin_all ON public.absensi 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY dosen_access_own ON public.absensi 
  FOR ALL TO authenticated 
  USING (
    pertemuan_id IN (
      SELECT p.id FROM public.pertemuan p
      JOIN public.kelas k ON k.id = p.kelas_id
      WHERE k.dosen_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );

CREATE POLICY mhs_select_own ON public.absensi 
  FOR SELECT TO authenticated 
  USING (mahasiswa_id IN (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid()));


-- 13. KOMPONEN NILAI POLICIES
CREATE POLICY admin_all ON public.komponen_nilai 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY dosen_access_own ON public.komponen_nilai 
  FOR ALL TO authenticated 
  USING (
    kelas_id IN (
      SELECT id FROM public.kelas 
      WHERE dosen_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );

CREATE POLICY mhs_select_enrolled ON public.komponen_nilai 
  FOR SELECT TO authenticated 
  USING (
    kelas_id IN (
      SELECT kd.kelas_id FROM public.krs_detail kd
      JOIN public.krs k ON k.id = kd.krs_id
      JOIN public.mahasiswa m ON m.id = k.mahasiswa_id
      WHERE m.user_id = auth.uid() AND k.status = 'disetujui'
    )
  );


-- 14. NILAI POLICIES
CREATE POLICY admin_all ON public.nilai 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY dosen_access_own ON public.nilai 
  FOR ALL TO authenticated 
  USING (
    komponen_nilai_id IN (
      SELECT kn.id FROM public.komponen_nilai kn
      JOIN public.kelas k ON k.id = kn.kelas_id
      WHERE k.dosen_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );

CREATE POLICY mhs_select_own ON public.nilai 
  FOR SELECT TO authenticated 
  USING (mahasiswa_id IN (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid()));


-- 15. NILAI AKHIR POLICIES
CREATE POLICY admin_all ON public.nilai_akhir 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY dosen_access_own ON public.nilai_akhir 
  FOR ALL TO authenticated 
  USING (
    kelas_id IN (
      SELECT id FROM public.kelas 
      WHERE dosen_id IN (SELECT id FROM public.dosen WHERE user_id = auth.uid())
    )
  );

CREATE POLICY mhs_select_own ON public.nilai_akhir 
  FOR SELECT TO authenticated 
  USING (mahasiswa_id IN (SELECT id FROM public.mahasiswa WHERE user_id = auth.uid()));
