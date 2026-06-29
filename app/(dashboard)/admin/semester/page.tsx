'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  Calendar,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import {
  getSemestersAction,
  createSemesterAction,
  activateSemesterAction,
  deleteSemesterAction,
} from '@/actions/akademik'
import { semesterSchema } from '@/lib/validations/akademik'
import { toast } from 'sonner'

interface Semester {
  id: string
  nama: string
  tahun_akademik: string
  tanggal_mulai: string
  tanggal_selesai: string
  is_active: boolean
}

export default function SemesterPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showActivateConfirm, setShowActivateConfirm] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [formNama, setFormNama] = useState('')
  const [formTahun, setFormTahun] = useState('')
  const [formMulai, setFormMulai] = useState('')
  const [formSelesai, setFormSelesai] = useState('')
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const res = await getSemestersAction()
    if (res.success) setSemesters(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormNama('')
    setFormTahun('')
    setFormMulai('')
    setFormSelesai('')
    setFormError('')
  }

  const handleAdd = () => {
    const parsed = semesterSchema.safeParse({
      nama: formNama,
      tahun_akademik: formTahun,
      tanggal_mulai: formMulai,
      tanggal_selesai: formSelesai,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message)
      return
    }
    setFormError('')

    startTransition(async () => {
      const res = await createSemesterAction(parsed.data)
      if (res.success) {
        toast.success('Semester berhasil ditambahkan')
        setShowAddModal(false)
        resetForm()
        fetchData()
      } else {
        toast.error(res.error || 'Gagal menambah semester')
      }
    })
  }

  const handleActivate = (id: string) => {
    startTransition(async () => {
      const res = await activateSemesterAction(id)
      if (res.success) {
        toast.success('Semester aktif berhasil diubah')
        setShowActivateConfirm(null)
        fetchData()
      } else {
        toast.error(res.error || 'Gagal mengubah semester aktif')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSemesterAction(id)
      if (res.success) {
        toast.success('Semester berhasil dihapus')
        setShowDeleteConfirm(null)
        fetchData()
      } else {
        toast.error(res.error || 'Gagal menghapus semester')
      }
    })
  }

  const activeSemester = semesters.find(s => s.is_active)

  return (
    <>
      <PageHeader
        title="Manajemen Semester"
        description="Kelola periode semester akademik"
        action={
          <Button onClick={() => { resetForm(); setShowAddModal(true) }} className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4">
            <Plus className="size-4 mr-1.5" />
            Tambah Semester
          </Button>
        }
      />

      {activeSemester && (
        <div className="flex items-center gap-2 px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] text-xs font-medium text-[#15803d] mb-4">
          <CheckCircle2 className="size-4 shrink-0" />
          Semester aktif saat ini: <strong>{activeSemester.nama} ({activeSemester.tahun_akademik})</strong>
        </div>
      )}

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada semester</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Tambahkan semester baru untuk memulai</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Semester</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Tahun Akademik</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Tanggal Mulai</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Tanggal Selesai</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesters.map((s) => (
                <TableRow key={s.id} className="border-b border-[#ececee]">
                  <TableCell className="text-sm font-medium text-[#09090b]">{s.nama}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{s.tahun_akademik}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{s.tanggal_mulai}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{s.tanggal_selesai}</TableCell>
                  <TableCell>
                    {s.is_active ? (
                      <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-[4px] text-[10px] font-semibold px-2 py-0.5">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge className="bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold px-2 py-0.5">
                        Tidak Aktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!s.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowActivateConfirm(s.id)}
                          disabled={isPending}
                          className="h-8 px-3 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px]"
                        >
                          <CheckCircle2 className="size-3 mr-1" />
                          Aktifkan
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(s.id)}
                        disabled={isPending}
                        className="h-8 px-3 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px] text-[#b91c1c]"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[480px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tambah Semester Baru</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Buat periode semester akademik baru
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Semester</Label>
              <select
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                className="w-full border border-[#d4d4d8] bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
              >
                <option value="">Pilih semester...</option>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
                <option value="Pendek">Pendek (Antara)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Tahun Akademik</Label>
              <Input
                value={formTahun}
                onChange={(e) => setFormTahun(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={formMulai}
                  onChange={(e) => setFormMulai(e.target.value)}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={formSelesai}
                  onChange={(e) => setFormSelesai(e.target.value)}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            {formError && (
              <p className="text-xs text-[#b91c1c]">{formError}</p>
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

      <Dialog open={showActivateConfirm !== null} onOpenChange={() => setShowActivateConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Aktifkan Semester</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Semester lain akan otomatis dinonaktifkan. Aksi ini berdampak luas — KRS baru akan terikat ke semester yang diaktifkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setShowActivateConfirm(null)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={() => showActivateConfirm && handleActivate(showActivateConfirm)}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Mengaktifkan...' : 'Ya, Aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Semester</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Apakah kamu yakin ingin menghapus semester ini? Data terkait (kelas, KRS) juga akan terpengaruh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
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
