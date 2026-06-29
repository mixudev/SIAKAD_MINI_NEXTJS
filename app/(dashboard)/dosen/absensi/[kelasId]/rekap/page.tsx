'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Printer,
} from 'lucide-react'
import { getRekapAbsensiAction } from '@/actions/absensi'
import { exportRekapAbsensiPdf } from '@/lib/export'

const statusDisplay: Record<string, { label: string; bg: string; text: string }> = {
  hadir: { label: 'H', bg: 'bg-[#f0fdf4]', text: 'text-[#15803d]' },
  izin: { label: 'I', bg: 'bg-[#fefce8]', text: 'text-[#a16207]' },
  sakit: { label: 'S', bg: 'bg-[#fef2f2]', text: 'text-[#b91c1c]' },
  alpa: { label: 'A', bg: 'bg-[#faf5ff]', text: 'text-[#6b21a8]' },
}

export default function RekapAbsensiPage() {
  const params = useParams()
  const router = useRouter()
  const kelasId = params.kelasId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pertemuan, setPertemuan] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kelas, setKelas] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getRekapAbsensiAction(kelasId)
    if (res.success) {
      setData(res.data || [])
      setPertemuan(res.pertemuan || [])
      setKelas(res.kelas || null)
    }
    setLoading(false)
  }, [kelasId])

  useEffect(() => { loadData() }, [loadData])

  const handleCetak = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data.map((m: any) => {
      const rekap = m.rekap || {}
      let hadir = 0; let izin = 0; let sakit = 0; let alpa = 0
      for (const v of Object.values(rekap)) {
        if (v === 'hadir') hadir++
        else if (v === 'izin') izin++
        else if (v === 'sakit') sakit++
        else if (v === 'alpa') alpa++
      }
      return {
        nim: m.nim || '',
        nama: m.nama_lengkap || '',
        persen: m.persentase || 0,
        hadir, izin, sakit, alpa,
      }
    })
    exportRekapAbsensiPdf(kelas?.nama_kelas || '', rows)
  }

  return (
    <>
      <PageHeader
        title="Rekap Absensi"
        description={kelas ? `${kelas.mata_kuliah?.kode_matkul} — ${kelas.nama_kelas} — ${kelas.mata_kuliah?.nama}` : 'Memuat...'}
      />

      {kelas && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/dosen/absensi/${kelasId}`)} className="text-[#71717a] hover:text-[#09090b] transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-[10px] text-[#a1a1aa]">
              {pertemuan.length} pertemuan &middot; {data.length} mahasiswa
            </p>
          </div>
          <button
            onClick={handleCetak}
            className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
          >
            <Printer className="size-3.5" />
            Cetak Rekap
          </button>
        </div>
      )}

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : pertemuan.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-[#52525b]">Belum ada pertemuan</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Data rekap akan muncul setelah pertemuan dibuat dan absensi diisi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap sticky left-0 bg-[#f4f4f5] z-10">NIM</TableHead>
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap sticky left-[80px] bg-[#f4f4f5] z-10 min-w-[140px]">Nama</TableHead>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pertemuan.map((p: any) => (
                  <TableHead key={p.id} className="text-[#71717a] text-[10px] font-semibold text-center w-8 px-1">
                    {p.pertemuan_ke}
                  </TableHead>
                ))}
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider text-center px-2">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.map((m: any) => (
                <TableRow key={m.mahasiswa_id} className={`border-b border-[#ececee] ${m.is_below_75 ? 'bg-[#fef2f2]' : ''}`}>
                  <TableCell className="text-xs font-mono font-medium text-[#09090b] sticky left-0 bg-white z-10">{m.nim}</TableCell>
                  <TableCell className="text-xs font-medium text-[#09090b] sticky left-[80px] bg-white z-10">
                    <div className="flex items-center gap-1">
                      {m.nama_lengkap}
                      {m.is_below_75 && (
                        <AlertTriangle className="size-3 text-[#b91c1c] shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {pertemuan.map((p: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const status = (m.rekap as any)[`p_${p.pertemuan_ke}`] || ''
                    const disp = statusDisplay[status]
                    return (
                      <TableCell key={p.id} className="text-center px-1">
                        {disp ? (
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-[9px] font-bold ${disp.bg} ${disp.text}`}>
                            {disp.label}
                          </span>
                        ) : (
                          <span className="text-[#d4d4d8] text-[9px]">—</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center px-2">
                    <span className={`text-[10px] font-bold ${
                      m.is_below_75 ? 'text-[#b91c1c]' : 'text-[#15803d]'
                    }`}>
                      {m.persentase}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-[#71717a]">
        <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#f0fdf4] text-[#15803d] text-[8px] font-bold">H</span> Hadir</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#fefce8] text-[#a16207] text-[8px] font-bold">I</span> Izin</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#fef2f2] text-[#b91c1c] text-[8px] font-bold">S</span> Sakit</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#faf5ff] text-[#6b21a8] text-[8px] font-bold">A</span> Alpa</span>
        <span className="flex items-center gap-1"><AlertTriangle className="size-3 text-[#b91c1c]" /> &lt; 75% kehadiran</span>
      </div>
    </>
  )
}
