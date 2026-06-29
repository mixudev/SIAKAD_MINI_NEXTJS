'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Clock,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  getKelasAction,
  getJadwalByKelasAction,
  upsertJadwalAction,
  deleteJadwalAction,
} from '@/actions/akademik'
import { jadwalSchema } from '@/lib/validations/akademik'
import { toast } from 'sonner'

interface KelasItem {
  id: string
  nama_kelas: string
  dosen: { nama_lengkap: string } | null
  mata_kuliah: { kode_matkul: string; nama: string } | null
}

interface Jadwal {
  id: string
  kelas_id: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  ruangan: string
}

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function JadwalPage() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [jadwal, setJadwal] = useState<Jadwal[]>([])
  const [isLoadingJadwal, setIsLoadingJadwal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const [formHari, setFormHari] = useState('')
  const [formJamMulai, setFormJamMulai] = useState('')
  const [formJamSelesai, setFormJamSelesai] = useState('')
  const [formRuangan, setFormRuangan] = useState('')
  const [formError, setFormError] = useState('')

  const fetchKelas = useCallback(async () => {
    const res = await getKelasAction({})
    if (res.success) setKelasList(res.data)
  }, [])

  useEffect(() => { fetchKelas() }, [fetchKelas])

  const fetchJadwal = useCallback(async (kelasId: string) => {
    setIsLoadingJadwal(true)
    const res = await getJadwalByKelasAction(kelasId)
    if (res.success) setJadwal(res.data)
    setIsLoadingJadwal(false)
  }, [])

  const handleKelasChange = (kelasId: string) => {
    setSelectedKelasId(kelasId)
    if (kelasId) fetchJadwal(kelasId)
    else setJadwal([])
  }

  const resetForm = () => {
    setFormHari('')
    setFormJamMulai('')
    setFormJamSelesai('')
    setFormRuangan('')
    setFormError('')
  }

  const handleAdd = () => {
    const parsed = jadwalSchema.safeParse({
      kelas_id: selectedKelasId,
      hari: formHari,
      jam_mulai: formJamMulai,
      jam_selesai: formJamSelesai,
      ruangan: formRuangan,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message)
      return
    }
    setFormError('')

    startTransition(async () => {
      const res = await upsertJadwalAction(parsed.data)
      if (res.success) {
        toast.success('Jadwal berhasil ditambahkan')
        setShowAddModal(false)
        resetForm()
        fetchJadwal(selectedKelasId)
      } else {
        toast.error(res.error || 'Gagal menambah jadwal')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteJadwalAction(id)
      if (res.success) {
        toast.success('Jadwal berhasil dihapus')
        setShowDelete(null)
        fetchJadwal(selectedKelasId)
      } else {
        toast.error(res.error || 'Gagal menghapus jadwal')
      }
    })
  }

  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId)

  const groupedJadwal = HARI_LIST.map((hari) => ({
    hari,
    items: jadwal
      .filter((j) => j.hari === hari)
      .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
  }))

  return (
    <>
      <PageHeader
        title="Manajemen Jadwal"
        description="Atur jadwal perkuliahan per kelas"
      />

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-5 mb-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Pilih Kelas</Label>
            <select
              value={selectedKelasId}
              onChange={(e) => handleKelasChange(e.target.value)}
              className="w-full border border-[#d4d4d8] bg-white text-sm rounded-[6px] h-10 px-3 outline-none focus:border-[#09090b]"
            >
              <option value="">— Pilih kelas —</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas} ({k.mata_kuliah?.kode_matkul || '—'} - {k.mata_kuliah?.nama || '—'})
                </option>
              ))}
            </select>
          </div>
          {selectedKelasId && (
            <Button
              onClick={() => { resetForm(); setShowAddModal(true) }}
              className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-10 px-4 shrink-0"
            >
              <Plus className="size-4 mr-1.5" />
              Tambah Jadwal
            </Button>
          )}
        </div>
        {selectedKelas && (
          <div className="flex items-center gap-3 mt-3 text-xs text-[#71717a]">
            <span><strong>Dosen:</strong> {selectedKelas.dosen?.nama_lengkap || 'Belum ditentukan'}</span>
            <span className="text-[#d4d4d8]">|</span>
            <span><strong>Matkul:</strong> {selectedKelas.mata_kuliah?.nama || '—'}</span>
          </div>
        )}
      </Card>

      {!selectedKelasId ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Pilih kelas terlebih dahulu</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Pilih kelas untuk melihat dan mengelola jadwal</p>
          </div>
        </Card>
      ) : isLoadingJadwal ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        </Card>
      ) : jadwal.length === 0 ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada jadwal</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Tambahkan jadwal untuk kelas ini</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedJadwal.map(({ hari, items }) => (
            <Card key={hari} className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
              <div className="bg-[#f4f4f5] px-4 py-2.5 border-b border-[#ececee]">
                <h3 className="text-xs font-bold text-[#09090b] uppercase tracking-wider">{hari}</h3>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-[#a1a1aa]">Tidak ada jadwal</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ececee]">
                  {items.map((j) => (
                    <div key={j.id} className="px-4 py-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#09090b] text-white rounded-[4px] text-[10px] font-semibold px-2 py-0.5 shrink-0">
                            {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                          </Badge>
                          <Badge className="bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold px-2 py-0.5">
                            {j.ruangan}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDelete(j.id)}
                        className="h-7 w-7 p-0 shrink-0 text-[#a1a1aa] hover:text-[#b91c1c]"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[480px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tambah Jadwal</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Atur jadwal untuk {selectedKelas?.nama_kelas}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Hari</Label>
              <select
                value={formHari}
                onChange={(e) => setFormHari(e.target.value)}
                className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
              >
                <option value="">Pilih hari...</option>
                {HARI_LIST.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Jam Mulai</Label>
                <Input
                  type="time"
                  value={formJamMulai}
                  onChange={(e) => setFormJamMulai(e.target.value)}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Jam Selesai</Label>
                <Input
                  type="time"
                  value={formJamSelesai}
                  onChange={(e) => setFormJamSelesai(e.target.value)}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Ruangan</Label>
              <Input
                value={formRuangan}
                onChange={(e) => setFormRuangan(e.target.value)}
                placeholder="Contoh: Lab. Komputer 1 / R. 201"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            {formError && (
              <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[6px]">
                <AlertTriangle className="size-4 text-[#b91c1c] shrink-0 mt-px" />
                <p className="text-xs text-[#b91c1c]">{formError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => { setShowAddModal(false); resetForm() }}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete !== null} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Jadwal</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Apakah kamu yakin ingin menghapus jadwal ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setShowDelete(null)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={() => showDelete && handleDelete(showDelete)}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#b91c1c] text-white rounded-[6px] hover:bg-[#991b1b]"
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
