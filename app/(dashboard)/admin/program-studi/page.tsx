'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  Building2,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  getProdiAction,
  createProdiAction,
  updateProdiAction,
  deleteProdiAction,
} from '@/actions/akademik'
import { prodiSchema } from '@/lib/validations/akademik'
import { toast } from 'sonner'

interface ProgramStudi {
  id: string
  kode: string
  nama: string
}

export default function ProgramStudiPage() {
  const [data, setData] = useState<ProgramStudi[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const [formKode, setFormKode] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const res = await getProdiAction()
    if (res.success) setData(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormKode('')
    setFormNama('')
    setFormError('')
    setEditingId(null)
  }

  const openEdit = (item: ProgramStudi) => {
    setEditingId(item.id)
    setFormKode(item.kode)
    setFormNama(item.nama)
    setFormError('')
    setShowModal(true)
  }

  const handleSave = () => {
    const parsed = prodiSchema.safeParse({
      kode: formKode,
      nama: formNama,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message)
      return
    }
    setFormError('')

    startTransition(async () => {
      if (editingId) {
        const res = await updateProdiAction(editingId, parsed.data)
        if (res.success) {
          toast.success('Program studi berhasil diperbarui')
          setShowModal(false)
          resetForm()
          fetchData()
        } else {
          toast.error(res.error || 'Gagal memperbarui')
        }
      } else {
        const res = await createProdiAction(parsed.data)
        if (res.success) {
          toast.success('Program studi berhasil ditambahkan')
          setShowModal(false)
          resetForm()
          fetchData()
        } else {
          toast.error(res.error || 'Gagal menambah')
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteProdiAction(id)
      if (res.success) {
        toast.success('Program studi berhasil dihapus')
        setShowDelete(null)
        fetchData()
      } else {
        toast.error(res.error || 'Gagal menghapus')
      }
    })
  }

  return (
    <>
      <PageHeader
        title="Manajemen Program Studi"
        description="Kelola program studi yang tersedia"
        action={
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4">
            <Plus className="size-4 mr-1.5" />
            Tambah Prodi
          </Button>
        }
      />

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada program studi</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Tambahkan program studi baru</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kode</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Prodi</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="border-b border-[#ececee]">
                  <TableCell className="text-sm font-mono font-medium text-[#09090b]">{item.kode}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">{item.nama}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}
                        className="h-8 px-3 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px]"
                      >
                        <Pencil className="size-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDelete(item.id)}
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

      <Dialog open={showModal} onOpenChange={(v) => { if (!v) resetForm(); setShowModal(v) }}>
        <DialogContent className="sm:max-w-[480px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">
              {editingId ? 'Edit Program Studi' : 'Tambah Program Studi'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              {editingId ? 'Perbarui data program studi' : 'Buat program studi baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Kode</Label>
              <Input
                value={formKode}
                onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                placeholder="TI"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Lengkap</Label>
              <Input
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Teknik Informatika"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            {formError && (
              <p className="text-xs text-[#b91c1c]">{formError}</p>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => { setShowModal(false); resetForm() }}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete !== null} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Program Studi</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Apakah kamu yakin ingin menghapus program studi ini? Data terkait (mata kuliah, kelas) juga akan terpengaruh.
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
