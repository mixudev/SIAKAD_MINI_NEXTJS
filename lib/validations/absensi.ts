import { z } from 'zod'

export const statusAbsensi = ['hadir', 'izin', 'sakit', 'alpa'] as const

export const pertemuanSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih'),
  pertemuan_ke: z.coerce.number().min(1, 'Pertemuan minimal 1').max(14, 'Maksimal 14 pertemuan'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  materi: z.string().optional(),
})

export const absensiItemSchema = z.object({
  mahasiswa_id: z.string().min(1),
  status: z.enum(statusAbsensi),
  keterangan: z.string().optional(),
})

export const absensiBulkSchema = z.object({
  pertemuan_id: z.string().min(1),
  data: z.array(absensiItemSchema).min(1, 'Minimal 1 mahasiswa'),
})

export type PertemuanFormData = z.infer<typeof pertemuanSchema>
export type AbsensiItemData = z.infer<typeof absensiItemSchema>
export type AbsensiBulkData = z.infer<typeof absensiBulkSchema>
