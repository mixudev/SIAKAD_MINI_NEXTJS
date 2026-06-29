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
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Send,
} from 'lucide-react'
import {
  getAvailableKelasAction,
  addKelasToKrsAction,
  removeKelasFromKrsAction,
  submitKrsAction,
  getMyKrsDetailAction,
} from '@/actions/krs'
import { toast } from 'sonner'

const MAX_SKS = 24

type KrsStatus = 'draft' | 'diajukan' | 'disetujui' | 'ditolak'

const statusLabel: Record<KrsStatus, string> = {
  draft: 'Draft',
  diajukan: 'Menunggu Approval',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

export default function KrsPage() {
  const [activeTab, setActiveTab] = useState<'tersedia' | 'krs-saya'>('tersedia')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [krsData, setKrsData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableKelas, setAvailableKelas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    const [krsRes, availRes] = await Promise.all([
      getMyKrsDetailAction(),
      getAvailableKelasAction(),
    ])
    if (krsRes.success) setKrsData(krsRes.data)
    if (availRes.success) setAvailableKelas(availRes.data || [])
    setIsLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleTambah = (kelasId: string) => {
    startTransition(async () => {
      const res = await addKelasToKrsAction(kelasId)
      if (res.success) {
        toast.success('Kelas berhasil ditambahkan')
        loadAll()
      } else {
        toast.error(res.error || 'Gagal menambah kelas')
      }
    })
  }

  const handleHapus = (detailId: string) => {
    startTransition(async () => {
      const res = await removeKelasFromKrsAction(detailId)
      if (res.success) {
        toast.success('Kelas berhasil dihapus')
        loadAll()
      } else {
        toast.error(res.error || 'Gagal menghapus kelas')
      }
    })
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitKrsAction()
      if (res.success) {
        toast.success('KRS berhasil diajukan')
        setShowSubmitConfirm(false)
        loadAll()
      } else {
        toast.error(res.error || 'Gagal mengajukan KRS')
      }
    })
  }

  const status = krsData?.status as KrsStatus | undefined
  const canEdit = !krsData || status === 'draft' || status === 'ditolak'
  const canSubmit = canEdit && (krsData?.krs_detail?.length || 0) > 0
  const sksTerisi = krsData?.total_sks || 0

  return (
    <>
      <PageHeader
        title="Kartu Rencana Studi"
        description="Atur rencana mata kuliah yang akan diambil semester ini"
      />

      {/* Status Banner */}
      {status && (
        <div className={`flex items-center gap-2 px-5 py-3 rounded-[8px] text-xs font-medium mb-4 border ${
          status === 'disetujui' ? 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]' :
          status === 'diajukan' ? 'bg-[#fefce8] text-[#a16207] border-[#fef08a]' :
          status === 'ditolak' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' :
          'bg-[#f4f4f5] text-[#71717a] border-[#d4d4d8]'
        }`}>
          {status === 'disetujui' ? <CheckCircle2 className="size-4 shrink-0" /> :
           status === 'diajukan' ? <Clock className="size-4 shrink-0" /> :
           status === 'ditolak' ? <XCircle className="size-4 shrink-0" /> :
           <AlertTriangle className="size-4 shrink-0" />}
          <span>
            Status KRS: <strong>{statusLabel[status]}</strong>
            {status === 'ditolak' && krsData?.catatan_dosen_pa && (
              <span className="ml-2">— {krsData.catatan_dosen_pa}</span>
            )}
          </span>
        </div>
      )}

      {/* SKS Progress */}
      {krsData && (
        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-[#ececee] rounded-[8px] mb-4 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">SKS Terisi</span>
              <span className="text-xs font-semibold text-[#09090b]">{sksTerisi} / {MAX_SKS}</span>
            </div>
            <div className="w-full h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sksTerisi >= MAX_SKS ? 'bg-[#b91c1c]' :
                  sksTerisi >= MAX_SKS * 0.8 ? 'bg-[#f59e0b]' :
                  'bg-[#22c55e]'
                }`}
                style={{ width: `${Math.min((sksTerisi / MAX_SKS) * 100, 100)}%` }}
              />
            </div>
          </div>
          {krsData?.dosen_pa_nama && (
            <div className="text-[10px] text-[#a1a1aa] shrink-0">
              Dosen PA: <span className="font-medium text-[#52525b]">{krsData.dosen_pa_nama}</span>
            </div>
          )}
          {canSubmit && (
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isPending}
              className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-8 px-3 shrink-0"
            >
              <Send className="size-3 mr-1.5" />
              Ajukan KRS
            </Button>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      {status !== 'disetujui' && (
        <div className="flex items-center gap-1 mb-4 bg-[#f4f4f5] rounded-[8px] p-1 w-fit">
          <button
            onClick={() => setActiveTab('tersedia')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'tersedia'
                ? 'bg-white text-[#09090b] shadow-sm'
                : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            Kelas Tersedia
          </button>
          <button
            onClick={() => setActiveTab('krs-saya')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'krs-saya'
                ? 'bg-white text-[#09090b] shadow-sm'
                : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            KRS Saya
          </button>
        </div>
      )}

      {activeTab === 'tersedia' && (
        <>
          {!canEdit && status === 'disetujui' ? (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="size-10 text-[#22c55e] mb-3" />
                <p className="text-sm font-medium text-[#52525b]">KRS sudah disetujui</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Tidak bisa menambah kelas lagi</p>
              </div>
            </Card>
          ) : isLoading ? (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-5 animate-spin text-[#71717a]" />
              </div>
            </Card>
          ) : availableKelas.length === 0 ? (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
                <p className="text-sm font-medium text-[#52525b]">Tidak ada kelas tersedia</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Semua kelas sudah penuh atau tidak ada kelas untuk prodi kamu</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {availableKelas.map((kelas: any) => {
                const jadwal = kelas.jadwal?.[0]
                return (
                  <Card key={kelas.id} className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#09090b] truncate">{kelas.mata_kuliah?.nama}</p>
                        <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">{kelas.mata_kuliah?.kode_matkul} &middot; {kelas.mata_kuliah?.sks} SKS</p>
                      </div>
                      {kelas.sudah_diambil ? (
                        <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-[4px] text-[10px] font-semibold shrink-0">
                          Terdaftar
                        </Badge>
                      ) : kelas.penuh ? (
                        <Badge className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] rounded-[4px] text-[10px] font-semibold shrink-0">
                          Penuh
                        </Badge>
                      ) : null}
                    </div>
                    <div className="space-y-1 text-[10px] text-[#71717a]">
                      <p><span className="font-medium text-[#52525b]">Kelas:</span> {kelas.nama_kelas}</p>
                      <p><span className="font-medium text-[#52525b]">Dosen:</span> {kelas.dosen?.nama_lengkap || '—'}</p>
                      {jadwal && (
                        <p><span className="font-medium text-[#52525b]">Jadwal:</span> {jadwal.hari}, {jadwal.jam_mulai.slice(0,5)} - {jadwal.jam_selesai.slice(0,5)} ({jadwal.ruangan})</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-[#f4f4f5] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              kelas.enrolled_count >= kelas.kapasitas ? 'bg-[#b91c1c]' :
                              kelas.enrolled_count >= kelas.kapasitas * 0.8 ? 'bg-[#f59e0b]' :
                              'bg-[#22c55e]'
                            }`}
                            style={{ width: `${Math.min((kelas.enrolled_count / kelas.kapasitas) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#a1a1aa]">{kelas.enrolled_count}/{kelas.kapasitas}</span>
                      </div>
                      {!kelas.sudah_diambil && !kelas.penuh && (
                        <Button
                          size="sm"
                          onClick={() => handleTambah(kelas.id)}
                          disabled={isPending || !canEdit}
                          className="h-7 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] px-2.5 hover:bg-[#18181b]"
                        >
                          <Plus className="size-3 mr-1" />
                          Ambil
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'krs-saya' && (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-5 animate-spin text-[#71717a]" />
            </div>
          ) : !krsData || !krsData.krs_detail || krsData.krs_detail.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
              <p className="text-sm font-medium text-[#52525b]">KRS masih kosong</p>
              <p className="text-xs text-[#a1a1aa] mt-1">Ambil kelas dari tab Kelas Tersedia</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f4f4f5]">
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kode</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Mata Kuliah</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kelas</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">SKS</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Dosen</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Jadwal</TableHead>
                    <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {krsData.krs_detail.map((detail: any) => {
                    const k = detail.kelas
                    const j = k?.jadwal?.[0]
                    return (
                      <TableRow key={detail.id} className="border-b border-[#ececee]">
                        <TableCell className="text-sm font-mono font-medium text-[#09090b]">{k?.mata_kuliah?.kode_matkul || '—'}</TableCell>
                        <TableCell className="text-sm font-medium text-[#09090b]">{k?.mata_kuliah?.nama || '—'}</TableCell>
                        <TableCell className="text-sm text-[#52525b]">{k?.nama_kelas || '—'}</TableCell>
                        <TableCell className="text-sm text-[#52525b]">{k?.mata_kuliah?.sks || 0}</TableCell>
                        <TableCell className="text-sm text-[#52525b]">{k?.dosen?.nama_lengkap || '—'}</TableCell>
                        <TableCell className="text-[10px] text-[#71717a]">
                          {j ? `${j.hari}, ${j.jam_mulai.slice(0,5)}-${j.jam_selesai.slice(0,5)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleHapus(detail.id)}
                              disabled={isPending}
                              className="h-7 px-2 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px] text-[#b91c1c]"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="px-5 py-3 border-t border-[#ececee] flex items-center justify-between">
                <p className="text-xs text-[#71717a]">
                  Total SKS: <strong className="text-[#09090b]">{sksTerisi}</strong> / {MAX_SKS}
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Ajukan KRS</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              KRS akan dikirim ke dosen PA untuk disetujui. Kelas tidak bisa diubah setelah diajukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Mengajukan...' : 'Ya, Ajukan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
