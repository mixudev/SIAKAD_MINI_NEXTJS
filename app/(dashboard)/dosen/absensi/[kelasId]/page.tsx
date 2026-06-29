'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ChevronLeft,
  ClipboardCheck,
  TrendingUp,
  CalendarPlus,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
} from 'lucide-react'
import { getPertemuanAction, createPertemuanAction } from '@/actions/absensi'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PertemuanListPage() {
  const params = useParams()
  const router = useRouter()
  const kelasId = params.kelasId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pertemuan, setPertemuan] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kelas, setKelas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [tanggal, setTanggal] = useState('')
  const [materi, setMateri] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getPertemuanAction(kelasId)
    if (res.success) {
      setPertemuan(res.data || [])
      setKelas(res.kelas || null)
    }
    setLoading(false)
  }, [kelasId])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = () => {
    if (!tanggal) { toast.error('Tanggal wajib diisi'); return }
    startTransition(async () => {
      const fd = new FormData()
      fd.append('kelas_id', kelasId)
      fd.append('tanggal', tanggal)
      fd.append('materi', materi)
      const res = await createPertemuanAction(fd)
      if (res.success) {
        toast.success(`Pertemuan ke-${res.data?.pertemuan_ke} berhasil dibuat`)
        setShowCreate(false)
        setTanggal('')
        setMateri('')
        loadData()
      } else {
        toast.error(res.error || 'Gagal membuat pertemuan')
      }
    })
  }

  const lastKe = pertemuan.length > 0 ? Math.max(...pertemuan.map(p => p.pertemuan_ke)) : 0
  const canCreate = lastKe < 14

  return (
    <>
      <PageHeader
        title={kelas?.mata_kuliah?.nama || 'Pertemuan Kelas'}
        description={kelas ? `${kelas.mata_kuliah?.kode_matkul} — ${kelas.nama_kelas} — ${kelas.semester?.nama}` : 'Memuat...'}
      />

      {/* Info bar */}
      {kelas && (
        <div className="flex items-center justify-between px-5 py-3 bg-white border border-[#ececee] rounded-[8px] mb-4 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dosen/absensi')} className="text-[#71717a] hover:text-[#09090b] transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <div>
              <p className="text-xs font-medium text-[#52525b]">{kelas.dosen?.nama_lengkap || 'Dosen'}</p>
              {kelas.jadwal?.[0] && (
                <p className="text-[10px] text-[#a1a1aa]">{kelas.jadwal[0].hari}, {kelas.jadwal[0].jam_mulai.slice(0,5)}-{kelas.jadwal[0].jam_selesai.slice(0,5)} &middot; {kelas.jadwal[0].ruangan}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dosen/absensi/${kelasId}/rekap`}>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px]">
                <TrendingUp className="size-3 mr-1" />
                Rekap Absensi
              </Button>
            </Link>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => { setTanggal(''); setMateri(''); setShowCreate(true) }}
                className="h-7 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] px-2.5 hover:bg-[#18181b]"
              >
                <CalendarPlus className="size-3 mr-1" />
                Buat Pertemuan ({lastKe + 1}/14)
              </Button>
            )}
          </div>
        </div>
      )}

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : pertemuan.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada pertemuan</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Buat pertemuan pertama untuk mulai mengisi absensi</p>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="mt-4 h-8 text-xs font-semibold bg-[#09090b] text-white rounded-[6px]"
              >
                <CalendarPlus className="size-3 mr-1.5" />
                Buat Pertemuan 1
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider w-16">#</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Tanggal</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Materi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pertemuan.map((p: any) => (
                  <TableRow key={p.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-semibold text-[#09090b]">{p.pertemuan_ke}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{p.tanggal}</TableCell>
                    <TableCell className="text-sm text-[#52525b] max-w-[200px] truncate">{p.materi || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`rounded-[4px] text-[10px] font-semibold ${
                        p.is_filled
                          ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                          : 'bg-[#fefce8] text-[#a16207] border border-[#fef08a]'
                      }`}>
                        {p.is_filled ? (
                          <><CheckCircle className="size-3 mr-1" /> Terisi</>
                        ) : (
                          <><XCircle className="size-3 mr-1" /> Belum Diisi</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dosen/absensi/${kelasId}/${p.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px]"
                        >
                          <ClipboardCheck className="size-3 mr-1" />
                          {p.is_filled ? 'Edit' : 'Isi'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {lastKe < 14 && (
              <div className="px-5 py-3 border-t border-[#ececee]">
                <p className="text-[10px] text-[#a1a1aa]">
                  Pertemuan {lastKe} dari maksimal 14 pertemuan
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Pertemuan Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">
              Buat Pertemuan {lastKe + 1}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              {kelas?.mata_kuliah?.nama} — {kelas?.nama_kelas}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#52525b]">Tanggal</Label>
              <Input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="h-9 text-xs rounded-[6px] border-[#d4d4d8]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#52525b]">
                Materi <span className="text-[#a1a1aa] font-normal">(opsional)</span>
              </Label>
              <Input
                placeholder="Contoh: Pengenalan Algoritma"
                value={materi}
                onChange={e => setMateri(e.target.value)}
                className="h-9 text-xs rounded-[6px] border-[#d4d4d8]"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !tanggal}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
