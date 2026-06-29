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
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
} from 'lucide-react'
import {
  getKrsBimbinganAction,
  getKrsBimbinganDetailAction,
  approveKrsAction,
  rejectKrsAction,
} from '@/actions/krs'
import { Input } from '@/components/ui/input'
import { hitungSemesterMahasiswa } from '@/lib/semester-utils'
import { toast } from 'sonner'

const filterStatus: { value: string; label: string }[] = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'diajukan', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'draft', label: 'Draft' },
]

export default function KrsBimbinganPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('semua')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any>(null)
  const [semesterAktif, setSemesterAktif] = useState<{ nama: string; tahun_akademik: string } | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getKrsBimbinganAction()
    if (res.success) {
      setData(res.data || [])
      if (res.semester) setSemesterAktif(res.semester)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openDetail = async (krsId: string) => {
    setDetail(null)
    setShowDetail(true)
    const res = await getKrsBimbinganDetailAction(krsId)
    if (res.success) setDetail(res.data)
    else toast.error(res.error || 'Gagal memuat detail')
  }

  const handleApprove = () => {
    if (!detail) return
    startTransition(async () => {
      const res = await approveKrsAction(detail.id)
      if (res.success) {
        toast.success('KRS disetujui')
        setShowApprove(false)
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

  const filtered = data.filter(item => {
    const status = item.status || 'belum'
    if (filter !== 'semua' && status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      const matchNama = item.nama_lengkap?.toLowerCase().includes(s)
      const matchNim = item.nim?.toLowerCase().includes(s)
      if (!matchNama && !matchNim) return false
    }
    return true
  })

  return (
    <>
      <PageHeader
        title="KRS Bimbingan"
        description="Lihat dan approve KRS mahasiswa bimbingan"
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#a1a1aa]" />
          <Input
            placeholder="Cari NIM atau nama..."
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
        <p className="text-[10px] text-[#a1a1aa] ml-auto">{filtered.length} data</p>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data KRS bimbingan</p>
            <p className="text-xs text-[#a1a1aa] mt-1">{search ? 'Coba ubah pencarian' : 'Belum ada mahasiswa yang mengajukan KRS'}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">NIM</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Sem</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kelas</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">SKS</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filtered.map((item: any) => (
                <TableRow key={item.id || item.nim} className="border-b border-[#ececee]">
                  <TableCell className="text-sm font-mono font-medium text-[#09090b]">{item.nim || '—'}</TableCell>
                  <TableCell className="text-sm font-medium text-[#09090b]">{item.nama_lengkap || '—'}</TableCell>
                  <TableCell className="text-xs text-[#52525b]">{hitungSemesterMahasiswa(item.angkatan, semesterAktif) !== null ? `Semester ${hitungSemesterMahasiswa(item.angkatan, semesterAktif)}` : '—'}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{item.total_kelas || 0}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{item.total_sks || 0}</TableCell>
                  <TableCell>
                    {!item.status ? (
                      <Badge className="rounded-[4px] text-[10px] font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                        Belum Ada KRS
                      </Badge>
                    ) : (
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
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!item.id}
                      onClick={() => item.id && openDetail(item.id)}
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
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[600px] rounded-[10px] p-0 gap-0 max-h-[80vh] overflow-y-auto">
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
                    detail.status === 'diajukan' ? 'Menunggu Approval' :
                    detail.status === 'ditolak' ? 'Ditolak' : 'Draft'
                  }</strong>
                  {detail.status === 'ditolak' && detail.catatan_dosen_pa && (
                    <span className="ml-2">— {detail.catatan_dosen_pa}</span>
                  )}
                </span>
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

              {/* Action Buttons */}
              {(detail.status === 'diajukan') && (
                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#ececee]">
                  <Button
                    variant="outline"
                    onClick={() => { setShowReject(true) }}
                    className="h-9 px-4 text-xs font-semibold border-[#b91c1c] text-[#b91c1c] rounded-[6px]"
                  >
                    <ThumbsDown className="size-3 mr-1.5" />
                    Tolak
                  </Button>
                  <Button
                    onClick={() => { setShowApprove(true) }}
                    className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
                  >
                    <ThumbsUp className="size-3 mr-1.5" />
                    Setujui
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Approve */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Setujui KRS</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Pastikan mata kuliah yang diambil sudah sesuai. Tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button variant="outline" onClick={() => setShowApprove(false)} className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]">
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={isPending} className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]">
              {isPending ? 'Menyetujui...' : 'Ya, Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reject */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tolak KRS</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Berikan catatan agar mahasiswa bisa memperbaiki KRS.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4">
            <textarea
              placeholder="Catatan penolakan..."
              value={rejectNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
              className="w-full min-h-[80px] text-xs rounded-[6px] border border-[#d4d4d8] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#09090b]"
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
