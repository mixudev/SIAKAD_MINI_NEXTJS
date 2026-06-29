'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { hitungSemesterMahasiswa } from '@/lib/semester-utils'
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react'
import {
  getAllKrsAdminAction,
  getKrsAdminDetailAction,
  approveKrsAction,
  rejectKrsAction,
} from '@/actions/krs'
import { toast } from 'sonner'

const filterStatus: { value: string; label: string }[] = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'diajukan', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'draft', label: 'Draft' },
]

const PAGE_SIZE = 15

export default function AdminKrsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('semua')
  const [page, setPage] = useState(1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const statusFilter = filter === 'semua' ? undefined : filter
    const res = await getAllKrsAdminAction({
      status: statusFilter,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    })
    if (res.success) {
      setData(res.data || [])
      setTotalCount(res.count || 0)
    }
    setLoading(false)
  }, [search, filter, page])

  useEffect(() => { loadData() }, [loadData])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const openDetail = async (krsId: string) => {
    setDetail(null)
    setShowDetail(true)
    const res = await getKrsAdminDetailAction(krsId)
    if (res.success) setDetail(res.data)
    else toast.error(res.error || 'Gagal memuat detail')
  }

  const handleApprove = () => {
    if (!detail) return
    startTransition(async () => {
      const res = await approveKrsAction(detail.id)
      if (res.success) {
        toast.success('KRS disetujui')
        setShowDetail(false)
        loadData()
      } else {
        toast.error(res.error || 'Gagal menyetujui')
      }
    })
  }

  const handleReject = () => {
    if (!detail) return
    startTransition(async () => {
      const res = await rejectKrsAction(detail.id, rejectNote)
      if (res.success) {
        toast.success('KRS ditolak')
        setShowReject(false)
        setShowDetail(false)
        setRejectNote('')
        loadData()
      } else {
        toast.error(res.error || 'Gagal menolak')
      }
    })
  }

  // Reset page when filter/search changes
  useEffect(() => { setPage(1) }, [search, filter])

  return (
    <>
      <PageHeader
        title="KRS — Admin"
        description="Kelola semua Kartu Rencana Studi mahasiswa"
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#a1a1aa]" />
          <Input
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-9 pr-3 text-xs rounded-[6px] border-[#d4d4d8] bg-white"
          />
        </div>
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="h-9 w-[155px] text-xs rounded-[6px] border-[#d4d4d8] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterStatus.map(s => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-[#a1a1aa] ml-auto">{totalCount} data</p>
        <button
          onClick={() => {
            const headers = ['NIM', 'Nama Mahasiswa', 'Prodi', 'Sem', 'Jumlah Kelas', 'Total SKS', 'Status', 'Dosen PA']
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = data.filter(Boolean).map((item: any) => [
              item.mahasiswa?.nim || '',
              item.mahasiswa?.nama_lengkap || '',
              item.mahasiswa?.program_studi?.kode || '',
              hitungSemesterMahasiswa(item.mahasiswa?.angkatan, item.semester) !== null ? String(hitungSemesterMahasiswa(item.mahasiswa?.angkatan, item.semester)) : '',
              String(item.total_kelas || 0),
              String(item.total_sks || 0),
              item.status || '',
              item.mahasiswa?.dosen_pa?.nama_lengkap || '',
            ])
            import('@/lib/export').then(m => m.exportCSV('krs_admin', headers, rows))
          }}
          className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
        >
          <FileSpreadsheet className="size-3.5" />
          Export CSV
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
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data KRS</p>
            <p className="text-xs text-[#a1a1aa] mt-1">{search ? 'Coba ubah pencarian' : 'Belum ada mahasiswa yang membuat KRS'}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">NIM</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Mahasiswa</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Prodi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Sem</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kelas</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">SKS</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Dosen PA</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.map((item: any) => (
                  <TableRow key={item.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-mono font-medium text-[#09090b]">{item.mahasiswa?.nim || '—'}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{item.mahasiswa?.nama_lengkap || '—'}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{item.mahasiswa?.program_studi?.kode || '—'}</TableCell>
                    <TableCell className="text-xs text-[#52525b]">{hitungSemesterMahasiswa(item.mahasiswa?.angkatan, item.semester) !== null ? `Semester ${hitungSemesterMahasiswa(item.mahasiswa?.angkatan, item.semester)}` : '—'}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{item.total_kelas || 0}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{item.total_sks || 0}</TableCell>
                    <TableCell>
                      <Badge className={`rounded-[4px] text-[10px] font-semibold ${
                        item.status === 'disetujui' ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' :
                        item.status === 'diajukan' ? 'bg-[#fefce8] text-[#a16207] border border-[#fef08a]' :
                        item.status === 'ditolak' ? 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]' :
                        'bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8]'
                      }`}>
                        {item.status === 'disetujui' ? 'Disetujui' :
                         item.status === 'diajukan' ? 'Menunggu' :
                         item.status === 'ditolak' ? 'Ditolak' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#52525b]">{item.mahasiswa?.dosen_pa?.nama_lengkap || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(item.id)}
                        className="h-7 px-2 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px]"
                      >
                        <Eye className="size-3 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#ececee]">
                <p className="text-[10px] text-[#a1a1aa]">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-7 px-2 text-[10px] border-[#d4d4d8] rounded-[6px]"
                  >
                    <ChevronLeft className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-7 px-2 text-[10px] border-[#d4d4d8] rounded-[6px]"
                  >
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[700px] rounded-[10px] p-0 gap-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Detail KRS</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              {detail ? `${detail.mahasiswa?.nim} — ${detail.mahasiswa?.nama_lengkap}` : 'Memuat...'}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="px-6 pb-6">
              {/* Info banner */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-medium mb-4 border ${
                detail.status === 'disetujui' ? 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]' :
                detail.status === 'diajukan' ? 'bg-[#fefce8] text-[#a16207] border-[#fef08a]' :
                detail.status === 'ditolak' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' :
                'bg-[#f4f4f5] text-[#71717a] border-[#d4d4d8]'
              }`}>
                {detail.status === 'disetujui' ? <CheckCircle2 className="size-4 shrink-0" /> :
                 detail.status === 'diajukan' ? <Loader2 className="size-4 shrink-0" /> :
                 detail.status === 'ditolak' ? <XCircle className="size-4 shrink-0" /> :
                 <BookOpen className="size-4 shrink-0" />}
                <span>
                  Status: <strong>{
                    detail.status === 'disetujui' ? 'Disetujui' :
                    detail.status === 'diajukan' ? 'Menunggu' :
                    detail.status === 'ditolak' ? 'Ditolak' : 'Draft'
                  }</strong>
                  {detail.catatan_dosen_pa && (
                    <span className="ml-2">— {detail.catatan_dosen_pa}</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-0.5">NIM</p>
                  <p className="text-sm font-semibold text-[#09090b]">{detail.mahasiswa?.nim || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-0.5">Nama</p>
                  <p className="text-sm font-semibold text-[#09090b]">{detail.mahasiswa?.nama_lengkap || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-0.5">Prodi</p>
                  <p className="text-sm text-[#52525b]">{detail.mahasiswa?.program_studi?.nama || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-0.5">Semester</p>
                  <p className="text-sm text-[#52525b]">{detail.semester?.nama || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-0.5">Dosen PA</p>
                  <p className="text-sm text-[#52525b]">{detail.mahasiswa?.dosen_pa?.nama_lengkap || '—'}</p>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] mb-2">Mata Kuliah</p>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f4f4f5]">
                    <TableHead className="text-[#71717a] text-[10px] font-semibold">Kode</TableHead>
                    <TableHead className="text-[#71717a] text-[10px] font-semibold">Mata Kuliah</TableHead>
                    <TableHead className="text-[#71717a] text-[10px] font-semibold">Kelas</TableHead>
                    <TableHead className="text-[#71717a] text-[10px] font-semibold">SKS</TableHead>
                    <TableHead className="text-[#71717a] text-[10px] font-semibold">Dosen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {detail.krs_detail?.map((det: any) => (
                    <TableRow key={det.id} className="border-b border-[#ececee]">
                      <TableCell className="text-xs font-mono font-medium">{det.kelas?.mata_kuliah?.kode_matkul || '—'}</TableCell>
                      <TableCell className="text-xs font-medium">{det.kelas?.mata_kuliah?.nama || '—'}</TableCell>
                      <TableCell className="text-xs text-[#52525b]">{det.kelas?.nama_kelas || '—'}</TableCell>
                      <TableCell className="text-xs">{det.kelas?.mata_kuliah?.sks || 0}</TableCell>
                      <TableCell className="text-xs text-[#52525b]">{det.kelas?.dosen?.nama_lengkap || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2 text-right">
                <span className="text-xs text-[#71717a]">Total SKS: <strong className="text-[#09090b]">{detail.total_sks || 0}</strong></span>
              </div>

              {/* Admin override */}
              {(detail.status === 'diajukan') && (
                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#ececee]">
                  <Button
                    variant="outline"
                    onClick={() => { setShowReject(true) }}
                    className="h-9 px-4 text-xs font-semibold border-[#b91c1c] text-[#b91c1c] rounded-[6px]"
                  >
                    <XCircle className="size-3 mr-1.5" />
                    Tolak
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
                  >
                    <CheckCircle2 className="size-3 mr-1.5" />
                    Setujui
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tolak KRS</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Berikan catatan penolakan.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4">
            <textarea
              className="w-full min-h-[80px] text-xs rounded-[6px] border border-[#d4d4d8] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#09090b]"
              placeholder="Catatan penolakan..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button variant="outline" onClick={() => setShowReject(false)} className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]">
              Batal
            </Button>
            <Button onClick={handleReject} disabled={isPending || !rejectNote.trim()} className="h-9 px-4 text-xs font-semibold bg-[#b91c1c] text-white rounded-[6px] hover:bg-[#dc2626]">
              {isPending ? 'Menolak...' : 'Tolak KRS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
