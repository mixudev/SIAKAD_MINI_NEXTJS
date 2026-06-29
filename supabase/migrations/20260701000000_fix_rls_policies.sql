-- Fix: missing TO authenticated on mata_kuliah_prerequisite RLS policies
-- Original in 20260630000000_academic_rules.sql was missing TO authenticated clause

DROP POLICY IF EXISTS "admin_all_prerequisite" ON public.mata_kuliah_prerequisite;
CREATE POLICY "admin_all_prerequisite" ON public.mata_kuliah_prerequisite
  FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "select_prerequisite" ON public.mata_kuliah_prerequisite;
CREATE POLICY "select_prerequisite" ON public.mata_kuliah_prerequisite
  FOR SELECT TO authenticated USING (true);
