'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { getAdminPenilaianAction } from '@/actions/nilai'

export default function AdminPenilaianPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getAdminPenilaianAction()
    if (res.success) setData(res.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalKelas = data.length
  const komponenDefined = data.filter(k => k.total_komponen > 0).length
  const bobotValid = data.filter(k => k.is_bobot_valid).length
  const nilaiLengkap = data.filter(k => k.is_lengkap).length

  return (
    <>
      <PageHeader
        title="Monitoring Penilaian"
        description="Pantau pengisian nilai semua kelas"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Total Kelas</p>
          <p className="text-2xl font-bold text-[#09090b] mt-1">{totalKelas}</p>
        </Card>
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Komponen Defined</p>
          <p className="text-2xl font-bold text-[#a16207] mt-1">{komponenDefined}</p>
        </Card>
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Bobot 100%</p>
          <p className="text-2xl font-bold text-[#15803d] mt-1">{bobotValid}</p>
        </Card>
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nilai Lengkap</p>
          <p className="text-2xl font-bold text-[#09090b] mt-1">{nilaiLengkap}</p>
        </Card>
      </div>

      {/* Refresh button */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={loadData}
          className="flex items-center gap-1 text-[10px] text-[#71717a] hover:text-[#09090b] transition-colors"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Belum ada kelas di semester aktif</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kode</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Mata Kuliah</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kelas</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Dosen</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Prodi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Mhs</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Komponen</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Bobot</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Nilai Terisi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.map((k: any) => (
                  <TableRow key={k.id} className="border-b border-[#ececee]">
                    <TableCell className="text-xs font-mono font-medium text-[#09090b]">{k.mata_kuliah?.kode_matkul || '—'}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{k.mata_kuliah?.nama || '—'}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{k.nama_kelas}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{k.dosen?.nama_lengkap || '—'}</TableCell>
                    <TableCell className="text-center text-xs text-[#52525b]">{k.mata_kuliah?.program_studi?.singkatan || '—'}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-[#09090b]">{k.enrolled_count}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-[#09090b]">{k.total_komponen}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-semibold ${
                        k.is_bobot_valid ? 'text-[#15803d]' : 'text-[#b91c1c]'
                      }`}>
                        {k.total_bobot}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#52525b]">
                      {k.enrolled_count > 0 ? `${k.nilai_filled}/${k.enrolled_count}` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {k.total_komponen === 0 ? (
                        <Badge className="bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold">
                          <XCircle className="size-3 mr-1" />
                          No Setup
                        </Badge>
                      ) : !k.is_bobot_valid ? (
                        <Badge className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] rounded-[4px] text-[10px] font-semibold">
                          <AlertTriangle className="size-3 mr-1" />
                          Bobot {k.total_bobot}%
                        </Badge>
                      ) : k.is_lengkap ? (
                        <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-[4px] text-[10px] font-semibold">
                          <CheckCircle2 className="size-3 mr-1" />
                          Lengkap
                        </Badge>
                      ) : (
                        <Badge className="bg-[#fefce8] text-[#a16207] border border-[#fef08a] rounded-[4px] text-[10px] font-semibold">
                          <AlertTriangle className="size-3 mr-1" />
                          Sebagian
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  )
}
