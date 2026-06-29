import { z } from 'zod'

export const semesterSchema = z.object({
  nama: z.string().min(1, 'Nama semester wajib diisi'),
  tahun_akademik: z.string().min(1, 'Tahun akademik wajib diisi'),
  tanggal_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggal_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

export const prodiSchema = z.object({
  nama: z.string().min(1, 'Nama program studi wajib diisi'),
  kode: z.string().min(1, 'Kode program studi wajib diisi'),
})

export const matkulSchema = z.object({
  kode_matkul: z.string().min(1, 'Kode mata kuliah wajib diisi'),
  nama: z.string().min(1, 'Nama mata kuliah wajib diisi'),
  sks: z.coerce.number().min(1, 'SKS minimal 1').max(24, 'SKS maksimal 24'),
  program_studi_id: z.string().min(1, 'Program studi wajib dipilih'),
  semester_ke: z.coerce.number().min(1).max(14),
})

export const kelasSchema = z.object({
  mata_kuliah_id: z.string().min(1, 'Mata kuliah wajib dipilih'),
  dosen_id: z.string().min(1, 'Dosen pengampu wajib dipilih'),
  nama_kelas: z.string().min(1, 'Nama kelas wajib diisi'),
  kapasitas: z.coerce.number().min(1, 'Kapasitas minimal 1').max(500, 'Kapasitas maksimal 500'),
  semester_id: z.string().min(1, 'Semester wajib dipilih'),
})

export const jadwalSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih'),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
  jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
  ruangan: z.string().min(1, 'Ruangan wajib diisi'),
})

export const krsSubmitSchema = z.object({
  krs_id: z.string().min(1, 'KRS tidak valid'),
})

export const krsNoteSchema = z.object({
  catatan: z.string().min(1, 'Catatan wajib diisi untuk reject').optional(),
  action: z.enum(['approve', 'reject']),
})

export type SemesterFormData = z.infer<typeof semesterSchema>
export type ProdiFormData = z.infer<typeof prodiSchema>
export type MatkulFormData = z.infer<typeof matkulSchema>
export type KelasFormData = z.infer<typeof kelasSchema>
export type JadwalFormData = z.infer<typeof jadwalSchema>
