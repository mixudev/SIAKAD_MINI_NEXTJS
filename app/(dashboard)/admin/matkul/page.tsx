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
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  getProdiAction,
  getMatkulAction,
  createMatkulAction,
  updateMatkulAction,
  deleteMatkulAction,
} from '@/actions/akademik'
import { matkulSchema } from '@/lib/validations/akademik'
import { toast } from 'sonner'

interface MataKuliah {
  id: string
  kode_matkul: string
  nama: string
  sks: number
  semester_ke: number
  program_studi_id: string
  program_studi: { kode: string; nama: string } | null
}

interface ProgramStudi {
  id: string
  kode: string
  nama: string
}

export default function MataKuliahPage() {
  const [data, setData] = useState<MataKuliah[]>([])
  const [programStudi, setProgramStudi] = useState<ProgramStudi[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterProdi, setFilterProdi] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const [formKodeMatkul, setFormKodeMatkul] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formSks, setFormSks] = useState('')
  const [formSemesterKe, setFormSemesterKe] = useState('')
  const [formProdiId, setFormProdiId] = useState('')
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [mkRes, prodiRes] = await Promise.all([
      getMatkulAction({}),
      getProdiAction(),
    ])
    if (mkRes.success) setData(mkRes.data)
    if (prodiRes.success) setProgramStudi(prodiRes.data)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormKodeMatkul('')
    setFormNama('')
    setFormSks('')
    setFormSemesterKe('')
    setFormProdiId('')
    setFormError('')
    setEditingId(null)
  }

  const openEdit = (item: MataKuliah) => {
    setEditingId(item.id)
    setFormKodeMatkul(item.kode_matkul)
    setFormNama(item.nama)
    setFormSks(String(item.sks))
    setFormSemesterKe(String(item.semester_ke))
    setFormProdiId(item.program_studi_id)
    setFormError('')
    setShowModal(true)
  }

  const handleSave = () => {
    const parsed = matkulSchema.safeParse({
      kode_matkul: formKodeMatkul,
      nama: formNama,
      sks: formSks || '0',
      program_studi_id: formProdiId,
      semester_ke: formSemesterKe || '0',
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message)
      return
    }
    setFormError('')

    startTransition(async () => {
      if (editingId) {
        const res = await updateMatkulAction(editingId, parsed.data)
        if (res.success) {
          toast.success('Mata kuliah berhasil diperbarui')
          setShowModal(false)
          resetForm()
          fetchData()
        } else {
          toast.error(res.error || 'Gagal memperbarui')
        }
      } else {
        const res = await createMatkulAction(parsed.data)
        if (res.success) {
          toast.success('Mata kuliah berhasil ditambahkan')
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
      const res = await deleteMatkulAction(id)
      if (res.success) {
        toast.success('Mata kuliah berhasil dihapus')
        setShowDelete(null)
        fetchData()
      } else {
        toast.error(res.error || 'Gagal menghapus')
      }
    })
  }

  const filteredData = data.filter((item) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      item.kode_matkul.toLowerCase().includes(q) ||
      item.nama.toLowerCase().includes(q)
    const matchesProdi = !filterProdi || item.program_studi_id === filterProdi
    return matchesSearch && matchesProdi
  })

  return (
    <>
      <PageHeader
        title="Manajemen Mata Kuliah"
        description="Kelola mata kuliah per program studi"
        action={
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4">
            <Plus className="size-4 mr-1.5" />
            Tambah Matkul
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a1a1aa]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama matkul..."
            className="bg-white border-[#d4d4d8] text-sm rounded-[6px] h-9 pl-9 pr-4 focus:border-[#09090b]"
          />
        </div>
        <select
          value={filterProdi}
          onChange={(e) => setFilterProdi(e.target.value)}
          className="border border-[#d4d4d8] bg-white text-sm rounded-[6px] h-9 px-3 outline-none focus:border-[#09090b]"
        >
          <option value="">Semua Prodi</option>
          {programStudi.map((p) => (
            <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
          ))}
        </select>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada mata kuliah</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {searchQuery || filterProdi ? 'Coba ubah filter pencarian' : 'Tambahkan mata kuliah baru'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kode</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Matkul</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">SKS</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Semester</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Program Studi</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="border-b border-[#ececee]">
                  <TableCell className="text-sm font-mono font-medium text-[#09090b]">{item.kode_matkul}</TableCell>
                  <TableCell className="text-sm font-medium text-[#09090b]">{item.nama}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">
                    <Badge className="bg-[#f4f4f5] text-[#71717a] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold px-2 py-0.5">
                      {item.sks} SKS
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#52525b]">Semester {item.semester_ke}</TableCell>
                  <TableCell className="text-sm text-[#52525b]">
                    {item.program_studi ? `${item.program_studi.kode} - ${item.program_studi.nama}` : '—'}
                  </TableCell>
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
        <DialogContent className="sm:max-w-[520px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">
              {editingId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              {editingId ? 'Perbarui data mata kuliah' : 'Buat mata kuliah baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Kode</Label>
                <Input
                  value={formKodeMatkul}
                  onChange={(e) => setFormKodeMatkul(e.target.value.toUpperCase())}
                  placeholder="TI101"
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">SKS</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={formSks}
                  onChange={(e) => setFormSks(e.target.value)}
                  placeholder="3"
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Mata Kuliah</Label>
              <Input
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Algoritma & Pemrograman"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Semester Ke-</Label>
                <select
                  value={formSemesterKe}
                  onChange={(e) => setFormSemesterKe(e.target.value)}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="">Pilih semester...</option>
                  {[1,2,3,4,5,6,7,8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Program Studi</Label>
                <select
                  value={formProdiId}
                  onChange={(e) => setFormProdiId(e.target.value)}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="">Pilih prodi...</option>
                  {programStudi.map((p) => (
                    <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                  ))}
                </select>
              </div>
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
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Mata Kuliah</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Apakah kamu yakin ingin menghapus mata kuliah ini? Data kelas terkait juga akan terpengaruh.
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
