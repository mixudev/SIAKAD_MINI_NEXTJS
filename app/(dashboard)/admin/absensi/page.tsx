'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { getAdminAbsensiAction } from '@/actions/absensi'

export default function AdminAbsensiPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getAdminAbsensiAction()
    if (res.success) setData(res.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const belumDiisi = data.filter(k =>
    k.total_pertemuan > 0 && k.total_pertemuan > k.filled_pertemuan
  )
  const kosongTotal = data.filter(k => k.total_pertemuan === 0)

  const filtered = data.filter(k => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      k.mata_kuliah?.nama?.toLowerCase().includes(s) ||
      k.mata_kuliah?.kode_matkul?.toLowerCase().includes(s) ||
      k.dosen?.nama_lengkap?.toLowerCase().includes(s) ||
      k.nama_kelas?.toLowerCase().includes(s)
    )
  })

  return (
    <>
      <PageHeader
        title="Monitoring Absensi"
        description="Pantau pengisian absensi semua kelas"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Total Kelas</p>
          <p className="text-2xl font-bold text-[#09090b] mt-1">{data.length}</p>
        </Card>
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Absensi Belum Lengkap</p>
          <p className="text-2xl font-bold text-[#a16207] mt-1">{belumDiisi.length}</p>
        </Card>
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Belum Ada Pertemuan</p>
          <p className="text-2xl font-bold text-[#b91c1c] mt-1">{kosongTotal.length}</p>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#a1a1aa]" />
          <Input
            placeholder="Cari kelas, matkul, atau dosen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-9 pr-3 text-xs rounded-[6px] border-[#d4d4d8] bg-white"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { startTransition(() => loadData()) }}
          disabled={isPending}
          className="h-9 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
        >
          <RefreshCw className="size-3 mr-1.5" />
          Refresh
        </Button>
        <p className="text-[10px] text-[#a1a1aa] ml-auto">{filtered.length} kelas</p>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data</p>
            <p className="text-xs text-[#a1a1aa] mt-1">{search ? 'Coba ubah pencarian' : 'Belum ada kelas di semester aktif'}</p>
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
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Prodi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Pertemuan</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Terisi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filtered.map((k: any) => (
                  <TableRow key={k.id} className="border-b border-[#ececee]">
                    <TableCell className="text-xs font-mono font-medium text-[#09090b]">{k.mata_kuliah?.kode_matkul || '—'}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{k.mata_kuliah?.nama || '—'}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{k.nama_kelas}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{k.dosen?.nama_lengkap || '—'}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{k.mata_kuliah?.program_studi?.kode || '—'}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-[#09090b]">{k.total_pertemuan}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-[#09090b]">{k.filled_pertemuan}</TableCell>
                    <TableCell className="text-center">
                      {k.total_pertemuan === 0 ? (
                        <Badge className="bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold">
                          <XCircle className="size-3 mr-1" />
                          Belum Ada
                        </Badge>
                      ) : k.is_complete ? (
                        <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-[4px] text-[10px] font-semibold">
                          <CheckCircle2 className="size-3 mr-1" />
                          Lengkap
                        </Badge>
                      ) : (
                        <Badge className="bg-[#fefce8] text-[#a16207] border border-[#fef08a] rounded-[4px] text-[10px] font-semibold">
                          <AlertTriangle className="size-3 mr-1" />
                          {k.total_pertemuan - k.filled_pertemuan} belum
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
