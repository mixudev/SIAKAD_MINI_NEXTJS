import { z } from 'zod'

export const komponenNilaiSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih'),
  nama_komponen: z.string().min(1, 'Nama komponen wajib diisi'),
  bobot_persen: z.coerce.number().min(1, 'Bobot minimal 1').max(100, 'Bobot maksimal 100'),
})

export const nilaiItemSchema = z.object({
  komponen_nilai_id: z.string().min(1),
  mahasiswa_id: z.string().min(1),
  nilai_angka: z.coerce.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
})

export const nilaiBulkSchema = z.array(nilaiItemSchema).min(1)

export type KomponenNilaiFormData = z.infer<typeof komponenNilaiSchema>
export type NilaiItemData = z.infer<typeof nilaiItemSchema>
