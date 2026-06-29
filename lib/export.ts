import jsPDF from 'jspdf'

export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportPDF(title: string, filename: string, generateContent: (doc: jsPDF) => void) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageW / 2, 20, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`SIAKAD MINI — Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 27, { align: 'center' })

  doc.line(15, 30, pageW - 15, 30)

  generateContent(doc)

  doc.save(`${filename}.pdf`)
}

export function exportKhsPdf(
  semesterName: string,
  items: { nama: string; kode: string; sks: number; nilai_angka: number | null; nilai_huruf: string | null; komponen: { nama: string; bobot: number; nilai: number | null }[] }[],
  ip: string,
  totalSks: number,
) {
  exportPDF(`KHS — ${semesterName}`, `khs_${semesterName.replace(/\s+/g, '_')}`, (doc) => {
    const pageW = doc.internal.pageSize.getWidth()
    let y = 38

    // Per-semester summary
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`IPS: ${ip}`, 15, y)
    doc.text(`Total SKS: ${totalSks}`, pageW - 15, y, { align: 'right' })
    y += 8

    // Table header
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const colX = [15, 45, 140, 165, 185]
    doc.text('Kode', colX[0], y)
    doc.text('Mata Kuliah', colX[1], y)
    doc.text('SKS', colX[2], y)
    doc.text('Nilai', colX[3], y)
    doc.text('Huruf', colX[4], y)
    y += 4
    doc.line(15, y, pageW - 15, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const item of items) {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(item.kode, colX[0], y)
      doc.text(item.nama.substring(0, 40), colX[1], y)
      doc.text(`${item.sks}`, colX[2], y)
      doc.text(item.nilai_angka !== null ? `${item.nilai_angka.toFixed(1)}` : '-', colX[3], y)
      doc.text(item.nilai_huruf || '-', colX[4], y)
      y += 6
    }

    y += 4
    doc.line(15, y, pageW - 15, y)
  })
}

export function exportTranskripPdf(
  ipk: number,
  totalSks: number,
  semesters: { nama: string; tahun: string; ips: number; sks: number; matkul: { kode: string; nama: string; sks: number; nilai: string | null }[] }[],
) {
  exportPDF(`Transkrip Akademik`, `transkrip_akademik`, (doc) => {
    const pageW = doc.internal.pageSize.getWidth()
    let y = 38

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`IPK Kumulatif: ${ipk.toFixed(2)}`, 15, y)
    doc.text(`Total SKS: ${totalSks}`, pageW - 15, y, { align: 'right' })
    y += 8

    for (const sem of semesters) {
      if (y > 255) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${sem.nama} — ${sem.tahun}`, 15, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`IPS: ${sem.ips.toFixed(2)} | SKS: ${sem.sks}`, pageW - 15, y, { align: 'right' })
      y += 5

      const colX = [15, 40, 160, 180]
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Kode', colX[0], y)
      doc.text('Mata Kuliah', colX[1], y)
      doc.text('SKS', colX[2], y)
      doc.text('Nilai', colX[3], y)
      y += 3
      doc.line(15, y, pageW - 15, y)
      y += 3

      doc.setFont('helvetica', 'normal')
      for (const m of sem.matkul) {
        if (y > 275) {
          doc.addPage()
          y = 20
        }
        doc.text(m.kode, colX[0], y)
        doc.text(m.nama.substring(0, 40), colX[1], y)
        doc.text(`${m.sks}`, colX[2], y)
        doc.text(m.nilai || '-', colX[3], y)
        y += 4
      }
      y += 4
      doc.line(15, y, pageW - 15, y)
      y += 4
    }
  })
}

export function exportDaftarNilaiPdf(
  kelasName: string,
  matkulName: string,
  rows: { nim: string; nama: string; nilai_akhir: number | null; nilai_huruf: string | null }[],
) {
  exportPDF(`Daftar Nilai — ${matkulName} (${kelasName})`, `daftar_nilai_${kelasName.replace(/\s+/g, '_')}`, (doc) => {
    const pageW = doc.internal.pageSize.getWidth()
    let y = 38

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${matkulName}`, 15, y)
    doc.text(`Kelas: ${kelasName}`, pageW - 15, y, { align: 'right' })
    y += 4
    doc.text(`Jumlah Mahasiswa: ${rows.length}`, 15, y)
    y += 8

    const colX = [15, 45, 160, 180]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('NIM', colX[0], y)
    doc.text('Nama', colX[1], y)
    doc.text('Nilai', colX[2], y)
    doc.text('Huruf', colX[3], y)
    y += 4
    doc.line(15, y, pageW - 15, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const r of rows) {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(r.nim, colX[0], y)
      doc.text(r.nama.substring(0, 35), colX[1], y)
      doc.text(r.nilai_akhir !== null ? `${r.nilai_akhir.toFixed(1)}` : '-', colX[2], y)
      doc.text(r.nilai_huruf || '-', colX[3], y)
      y += 6
    }
  })
}

export function exportRekapAbsensiPdf(
  kelasName: string,
  rows: { nim: string; nama: string; persen: number; hadir: number; izin: number; sakit: number; alpa: number }[],
) {
  exportPDF(`Rekap Absensi — ${kelasName}`, `rekap_absensi_${kelasName.replace(/\s+/g, '_')}`, (doc) => {
    let y = 38
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Kelas: ${kelasName}`, 15, y)
    y += 4
    doc.text(`Jumlah Mahasiswa: ${rows.length}`, 15, y)
    y += 8

    const colX = [15, 45, 120, 145, 163, 181]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('NIM', colX[0], y)
    doc.text('Nama', colX[1], y)
    doc.text('Hadir', colX[2], y)
    doc.text('Izin', colX[3], y)
    doc.text('Sakit', colX[4], y)
    doc.text('Alpa', colX[5], y)
    y += 4
    doc.line(15, y, pageW - 15, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const r of rows) {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(r.nim, colX[0], y)
      doc.text(r.nama.substring(0, 30), colX[1], y)
      doc.text(`${r.hadir}`, colX[2], y)
      doc.text(`${r.izin}`, colX[3], y)
      doc.text(`${r.sakit}`, colX[4], y)
      doc.text(`${r.alpa}`, colX[5], y)
      y += 6
    }
  })
}
