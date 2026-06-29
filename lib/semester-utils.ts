export function hitungSemesterMahasiswa(
  angkatan: number,
  semesterAktif: { nama: string; tahun_akademik: string } | null
): number | null {
  if (!semesterAktif) return null
  const tahun = parseInt(semesterAktif.tahun_akademik.split('/')[0])
  if (angkatan > tahun) return null
  const isGanjil = semesterAktif.nama.includes('Ganjil')
  return (tahun - angkatan) * 2 + (isGanjil ? 1 : 2)
}
