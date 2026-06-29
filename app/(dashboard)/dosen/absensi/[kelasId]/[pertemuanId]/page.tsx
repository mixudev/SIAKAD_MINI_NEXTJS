'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  Save,
  CheckCircle2,
} from 'lucide-react'
import { getMahasiswaForAbsensiAction, saveAbsensiAction } from '@/actions/absensi'
import { toast } from 'sonner'

export default function InputAbsensiPage() {
  const params = useParams()
  const router = useRouter()
  const kelasId = params.kelasId as string
  const pertemuanId = params.pertemuanId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mahasiswa, setMahasiswa] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pertemuan, setPertemuan] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kelas, setKelas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showSummary, setShowSummary] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getMahasiswaForAbsensiAction(pertemuanId)
    if (res.success) {
      setMahasiswa(res.data || [])
      setPertemuan(res.pertemuan || null)
      setKelas(res.kelas || null)
    }
    setLoading(false)
  }, [pertemuanId])

  useEffect(() => { loadData() }, [loadData])

  const updateStatus = (mahasiswaId: string, status: string) => {
    setMahasiswa(prev => prev.map(m => m.mahasiswa_id === mahasiswaId ? { ...m, status } : m))
  }

  const handleSave = () => {
    const data = mahasiswa.map(m => ({
      mahasiswa_id: m.mahasiswa_id,
      status: m.status || '',
      keterangan: m.keterangan || undefined,
    }))

    startTransition(async () => {
      const res = await saveAbsensiAction(pertemuanId, data)
      if (res.success) {
        setSummary(res.summary)
        setShowSummary(true)
        toast.success('Absensi berhasil disimpan')
        loadData()
      } else {
        toast.error(res.error || 'Gagal menyimpan absensi')
      }
    })
  }

  const statusCounts = {
    hadir: mahasiswa.filter(m => m.status === 'hadir').length,
    izin: mahasiswa.filter(m => m.status === 'izin').length,
    sakit: mahasiswa.filter(m => m.status === 'sakit').length,
    alpa: mahasiswa.filter(m => m.status === 'alpa').length,
    belum: mahasiswa.filter(m => !m.status).length,
  }

  const allFilled = mahasiswa.every(m => m.status)

  return (
    <>
      <PageHeader
        title={pertemuan ? `Pertemuan ${pertemuan.pertemuan_ke}` : 'Input Absensi'}
        description={kelas ? `${kelas.mata_kuliah?.kode_matkul} — ${kelas.nama_kelas}` : 'Memuat...'}
      />

      {/* Info bar */}
      {pertemuan && (
        <div className="flex items-center justify-between px-5 py-3 bg-white border border-[#ececee] rounded-[8px] mb-4 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/dosen/absensi/${kelasId}`)} className="text-[#71717a] hover:text-[#09090b] transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <div>
              <p className="text-xs font-medium text-[#52525b]">
                {pertemuan.tanggal} {pertemuan.materi ? `— ${pertemuan.materi}` : ''}
              </p>
              <p className="text-[10px] text-[#a1a1aa]">
                {mahasiswa.length} mahasiswa terdaftar
              </p>
            </div>
          </div>

          {showSummary && summary && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-[#22c55e]" />
              <div className="flex items-center gap-2 text-[10px] font-medium">
                <span className="text-[#15803d]">H:{summary.hadir}</span>
                <span className="text-[#a16207]">I:{summary.izin}</span>
                <span className="text-[#b91c1c]">S:{summary.sakit}</span>
                <span className="text-[#6b21a8]">A:{summary.alpa}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status ringkasan */}
      <div className="flex items-center gap-2 mb-4 text-[10px] font-medium">
        <span className="text-[#15803d] bg-[#f0fdf4] px-2 py-1 rounded-[4px] border border-[#bbf7d0]">Hadir: {statusCounts.hadir}</span>
        <span className="text-[#a16207] bg-[#fefce8] px-2 py-1 rounded-[4px] border border-[#fef08a]">Izin: {statusCounts.izin}</span>
        <span className="text-[#b91c1c] bg-[#fef2f2] px-2 py-1 rounded-[4px] border border-[#fecaca]">Sakit: {statusCounts.sakit}</span>
        <span className="text-[#6b21a8] bg-[#faf5ff] px-2 py-1 rounded-[4px] border border-[#e9d5ff]">Alpa: {statusCounts.alpa}</span>
        {statusCounts.belum > 0 && (
          <span className="text-[#71717a] bg-[#f4f4f5] px-2 py-1 rounded-[4px] border border-[#d4d4d8]">
            Belum: {statusCounts.belum}
          </span>
        )}
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : mahasiswa.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-[#52525b]">Tidak ada mahasiswa terdaftar</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Belum ada mahasiswa dengan KRS disetujui di kelas ini</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider w-20">NIM</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Mahasiswa</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status Absensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {mahasiswa.map((m: any) => (
                  <TableRow key={m.mahasiswa_id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-mono font-medium text-[#09090b]">{m.nim}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{m.nama_lengkap}</TableCell>
                    <TableCell>
                      <RadioGroup
                        value={m.status || ''}
                        onValueChange={(v) => updateStatus(m.mahasiswa_id, v)}
                        className="flex items-center gap-2"
                      >
                        {['hadir', 'izin', 'sakit', 'alpa'].map(s => (
                          <div key={s} className="flex items-center gap-1">
                            <RadioGroupItem
                              value={s}
                              id={`${m.mahasiswa_id}-${s}`}
                              className={`size-3.5 ${s === 'hadir' ? 'text-[#15803d]' : s === 'izin' ? 'text-[#a16207]' : s === 'sakit' ? 'text-[#b91c1c]' : 'text-[#6b21a8]'}`}
                            />
                            <Label
                              htmlFor={`${m.mahasiswa_id}-${s}`}
                              className={`text-[10px] font-medium cursor-pointer ${
                                m.status === s
                                  ? (s === 'hadir' ? 'text-[#15803d]' : s === 'izin' ? 'text-[#a16207]' : s === 'sakit' ? 'text-[#b91c1c]' : 'text-[#6b21a8]')
                                  : 'text-[#a1a1aa]'
                              }`}
                            >
                              {s === 'hadir' ? 'H' : s === 'izin' ? 'I' : s === 'sakit' ? 'S' : 'A'}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-5 py-3 border-t border-[#ececee] flex items-center justify-between">
              <p className="text-[10px] text-[#71717a]">
                {allFilled ? 'Semua mahasiswa sudah diisi' : `${statusCounts.belum} mahasiswa belum diisi`}
              </p>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="h-8 px-3 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
              >
                <Save className="size-3 mr-1.5" />
                {isPending ? 'Menyimpan...' : 'Simpan Absensi'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
