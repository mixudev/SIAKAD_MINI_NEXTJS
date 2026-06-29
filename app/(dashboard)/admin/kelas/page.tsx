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
  Users,
  Pencil,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react'
import {
  getKelasAction,
  createKelasAction,
  updateKelasAction,
  deleteKelasAction,
  getMatkulAction,
  getProdiAction,
  getSemestersAction,
  getMasterDataOptionsAction,
} from '@/actions/akademik'
import { kelasSchema } from '@/lib/validations/akademik'
import { toast } from 'sonner'

interface KelasItem {
  id: string
  nama_kelas: string
  kapasitas: number
  semester_id: string
  mata_kuliah_id: string
  dosen_id: string
  mata_kuliah: { kode_matkul: string; nama: string; program_studi: { kode: string } | null } | null
  dosen: { nama_lengkap: string } | null
  semester: { nama: string; tahun_akademik: string } | null
  krs_detail: { count: number }[]
}

interface MataKuliah { id: string; kode_matkul: string; nama: string; program_studi_id: string }
interface ProgramStudi { id: string; kode: string; nama: string }
interface Semester { id: string; nama: string; tahun_akademik: string; is_active: boolean }
interface Dosen { id: string; nama_lengkap: string; nidn: string }

export default function KelasPage() {
  const [data, setData] = useState<KelasItem[]>([])
  const [mataKuliah, setMataKuliah] = useState<MataKuliah[]>([])
  const [programStudi, setProgramStudi] = useState<ProgramStudi[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [dosenList, setDosenList] = useState<Dosen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterProdi, setFilterProdi] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const [formNamaKelas, setFormNamaKelas] = useState('')
  const [formKapasitas, setFormKapasitas] = useState('')
  const [formProdiId, setFormProdiId] = useState('')
  const [formMatkulId, setFormMatkulId] = useState('')
  const [formSemesterId, setFormSemesterId] = useState('')
  const [formDosenId, setFormDosenId] = useState('')
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [kelasRes, mkRes, prodiRes, semRes, masterRes] = await Promise.all([
      getKelasAction({}),
      getMatkulAction({}),
      getProdiAction(),
      getSemestersAction(),
      getMasterDataOptionsAction(),
    ])
    if (kelasRes.success) setData(kelasRes.data)
    if (mkRes.success) setMataKuliah(mkRes.data)
    if (prodiRes.success) setProgramStudi(prodiRes.data)
    if (semRes.success) setSemesters(semRes.data)
    if (masterRes.success) setDosenList(masterRes.dosen || [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormNamaKelas('')
    setFormKapasitas('')
    setFormProdiId('')
    setFormMatkulId('')
    setFormSemesterId('')
    setFormDosenId('')
    setFormError('')
    setEditingId(null)
  }

  const filteredMK = mataKuliah.filter((mk) => !formProdiId || mk.program_studi_id === formProdiId)

  const openEdit = (item: KelasItem) => {
    setEditingId(item.id)
    setFormNamaKelas(item.nama_kelas)
    setFormKapasitas(String(item.kapasitas))
    setFormMatkulId(item.mata_kuliah_id)
    setFormSemesterId(item.semester_id)
    setFormDosenId(item.dosen_id || '')
    setFormProdiId(item.mata_kuliah?.program_studi?.kode || '')
    setFormError('')
    setShowModal(true)
  }

  const handleSave = () => {
    const parsed = kelasSchema.safeParse({
      nama_kelas: formNamaKelas,
      kapasitas: formKapasitas || '0',
      mata_kuliah_id: formMatkulId,
      semester_id: formSemesterId,
      dosen_id: formDosenId,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message)
      return
    }
    setFormError('')

    startTransition(async () => {
      if (editingId) {
        const res = await updateKelasAction(editingId, parsed.data)
        if (res.success) {
          toast.success('Kelas berhasil diperbarui')
          setShowModal(false)
          resetForm()
          fetchData()
        } else {
          toast.error(res.error || 'Gagal memperbarui')
        }
      } else {
        const res = await createKelasAction(parsed.data)
        if (res.success) {
          toast.success('Kelas berhasil ditambahkan')
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
      const res = await deleteKelasAction(id)
      if (res.success) {
        toast.success('Kelas berhasil dihapus')
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
      item.nama_kelas.toLowerCase().includes(q) ||
      (item.mata_kuliah?.nama || '').toLowerCase().includes(q) ||
      (item.mata_kuliah?.kode_matkul || '').toLowerCase().includes(q)
    const prodiKode = item.mata_kuliah?.program_studi?.kode
    const matchesProdi = !filterProdi || prodiKode === filterProdi
    return matchesSearch && matchesProdi
  })

  const availableSemesters = semesters.filter((s) => s.is_active)

  return (
    <>
      <PageHeader
        title="Manajemen Kelas"
        description="Kelola kelas perkuliahan per mata kuliah"
        action={
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4">
            <Plus className="size-4 mr-1.5" />
            Tambah Kelas
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a1a1aa]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kelas..."
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
            <option key={p.id} value={p.kode}>{p.kode} - {p.nama}</option>
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
            <Users className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada kelas</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {searchQuery || filterProdi ? 'Coba ubah filter pencarian' : 'Tambahkan kelas baru'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Kelas</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Matkul</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Dosen</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Prodi</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Semester</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Kapasitas</TableHead>
                <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const terdaftar = item.krs_detail?.[0]?.count ?? 0
                const kapasitasPct = item.kapasitas > 0 ? Math.round((terdaftar / item.kapasitas) * 100) : 0
                return (
                  <TableRow key={item.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-medium text-[#09090b]">{item.nama_kelas}</TableCell>
                    <TableCell className="text-sm text-[#52525b] max-w-[180px] truncate">
                      {item.mata_kuliah ? `${item.mata_kuliah.kode_matkul} - ${item.mata_kuliah.nama}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#52525b]">{item.dosen?.nama_lengkap || '—'}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{item.mata_kuliah?.program_studi?.kode || '—'}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">
                      {item.semester ? `${item.semester.nama} ${item.semester.tahun_akademik}` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              kapasitasPct >= 90 ? 'bg-[#b91c1c]' :
                              kapasitasPct >= 70 ? 'bg-[#f59e0b]' :
                              'bg-[#22c55e]'
                            }`}
                            style={{ width: `${Math.min(kapasitasPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-[#71717a]">
                          {terdaftar}/{item.kapasitas}
                        </span>
                      </div>
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
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showModal} onOpenChange={(v) => { if (!v) resetForm(); setShowModal(v) }}>
        <DialogContent className="sm:max-w-[520px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">
              {editingId ? 'Edit Kelas' : 'Tambah Kelas'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              {editingId ? 'Perbarui data kelas' : 'Buat kelas baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Kelas</Label>
              <Input
                value={formNamaKelas}
                onChange={(e) => setFormNamaKelas(e.target.value)}
                placeholder="Kelas A"
                className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Program Studi</Label>
              <select
                value={formProdiId}
                onChange={(e) => { setFormProdiId(e.target.value); setFormMatkulId('') }}
                className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
              >
                <option value="">Pilih prodi...</option>
                {programStudi.map((p) => (
                  <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Mata Kuliah</Label>
              <select
                value={formMatkulId}
                onChange={(e) => setFormMatkulId(e.target.value)}
                className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
              >
                <option value="">Pilih matkul...</option>
                {filteredMK.map((mk) => (
                  <option key={mk.id} value={mk.id}>{mk.kode_matkul} - {mk.nama}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Dosen Pengampu</Label>
                <select
                  value={formDosenId}
                  onChange={(e) => setFormDosenId(e.target.value)}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="">Pilih dosen...</option>
                  {dosenList.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama_lengkap} ({d.nidn})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Semester (Aktif)</Label>
                <select
                  value={formSemesterId}
                  onChange={(e) => setFormSemesterId(e.target.value)}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                  disabled={availableSemesters.length === 0}
                >
                  <option value="">{availableSemesters.length === 0 ? 'Tidak ada semester aktif' : 'Pilih semester...'}</option>
                  {availableSemesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama} {s.tahun_akademik}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Kapasitas</Label>
              <Input
                type="number"
                min={1}
                value={formKapasitas}
                onChange={(e) => setFormKapasitas(e.target.value)}
                placeholder="40"
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
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Kelas</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Apakah kamu yakin ingin menghapus kelas ini? Data KRS dan jadwal terkait juga akan terpengaruh.
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
