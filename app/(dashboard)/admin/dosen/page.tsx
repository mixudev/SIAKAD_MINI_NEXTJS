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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  UserPlus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserX,
  KeyRound,
  Edit,
  Loader2,
  Users,
} from 'lucide-react'
import {
  getLecturersAction,
  getDropdownOptionsAction,
  updateLecturerAction,
  resetPasswordAction,
  toggleUserBanAction,
} from '@/actions/admin'
import { registerUserAction } from '@/actions/auth'
import { toast } from 'sonner'

interface ProgramStudi { id: string; nama: string; kode: string }

interface Dosen {
  id: string
  user_id: string
  nidn: string
  nama_lengkap: string
  program_studi_id: string | null
  program_studi?: ProgramStudi | null
  jabatan_akademik: string | null
  users?: { username: string | null } | null
}

export default function DosenManagementPage() {
  const [lecturers, setLecturers] = useState<Dosen[]>([])
  const [prodis, setProdis] = useState<ProgramStudi[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [filterProdi, setFilterProdi] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [selectedLecturer, setSelectedLecturer] = useState<Dosen | null>(null)

  const [formData, setFormData] = useState({
    nidn: '', nama_lengkap: '', program_studi_id: '',
    jabatan_akademik: '', password: '', username: '', status: 'aktif',
  })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    async function loadOptions() {
      const res = await getDropdownOptionsAction()
      if (res.success) setProdis(res.prodi)
    }
    loadOptions()
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const res = await getLecturersAction({ search, prodiId: filterProdi, page, limit })
    setIsLoading(false)
    if (res.success) {
      setLecturers(res.data as Dosen[])
      setCount(res.count)
    } else {
      toast.error('Gagal memuat data dosen: ' + res.error)
    }
  }, [search, filterProdi, page, limit])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setFormData({
      nidn: '', nama_lengkap: '', program_studi_id: prodis[0]?.id || '',
      jabatan_akademik: 'Lektor', password: 'password', username: '', status: 'aktif',
    })
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await registerUserAction({
        role: 'dosen', nidn: formData.nidn, nama_lengkap: formData.nama_lengkap,
        program_studi_id: formData.program_studi_id || undefined,
        jabatan_akademik: formData.jabatan_akademik || undefined,
        password: formData.password || 'password', username: formData.username || undefined,
      })
      if (res.success) {
        toast.success('Dosen baru berhasil ditambahkan!')
        setIsAddOpen(false); resetForm(); loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLecturer) return
    startTransition(async () => {
      const res = await updateLecturerAction(selectedLecturer.user_id, {
        nama_lengkap: formData.nama_lengkap,
        program_studi_id: formData.program_studi_id || null,
        jabatan_akademik: formData.jabatan_akademik || null,
        username: formData.username,
      })
      if (res.success) {
        toast.success('Data dosen berhasil diperbarui!')
        setIsEditOpen(false); loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLecturer || !newPassword) return
    startTransition(async () => {
      const res = await resetPasswordAction(selectedLecturer.user_id, newPassword)
      if (res.success) {
        toast.success(`Password untuk ${selectedLecturer.nama_lengkap} berhasil di-reset!`)
        setIsResetOpen(false); setNewPassword('')
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleToggleBan = async (lecturer: Dosen, shouldBan: boolean) => {
    const actionText = shouldBan ? 'menonaktifkan' : 'mengaktifkan'
    const res = await toggleUserBanAction(lecturer.user_id, shouldBan)
    if (res.success) {
      toast.success(`Berhasil ${actionText} akun ${lecturer.nama_lengkap}`)
      loadData()
    } else {
      toast.error(`Gagal ${actionText} akun: ` + res.error)
    }
  }

  const openEditModal = (lecturer: Dosen) => {
    setSelectedLecturer(lecturer)
    setFormData({
      nidn: lecturer.nidn, nama_lengkap: lecturer.nama_lengkap,
      program_studi_id: lecturer.program_studi_id || '',
      jabatan_akademik: lecturer.jabatan_akademik || '',
      password: '', username: lecturer.users?.username || '', status: 'aktif',
    })
    setIsEditOpen(true)
  }

  const openResetModal = (lecturer: Dosen) => {
    setSelectedLecturer(lecturer)
    setNewPassword('password')
    setIsResetOpen(true)
  }

  const totalPages = Math.ceil(count / limit)

  return (
    <>
      <PageHeader
        title="Manajemen Dosen"
        description="Kelola data tenaga pengajar (dosen), program studi keahlian, jabatan fungsional, dan reset password."
        action={
          <Button
            onClick={() => { resetForm(); setIsAddOpen(true) }}
            className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4"
          >
            <UserPlus className="size-4 mr-1.5" />
            Tambah Dosen
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a1a1aa]" />
          <Input
            placeholder="Cari NIDN atau nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="bg-white border-[#d4d4d8] text-sm rounded-[6px] h-9 pl-9 pr-4 focus:border-[#09090b]"
          />
        </div>
        <select
          value={filterProdi}
          onChange={(e) => { setFilterProdi(e.target.value); setPage(1) }}
          className="border border-[#d4d4d8] bg-white text-sm rounded-[6px] h-9 px-3 outline-none focus:border-[#09090b]"
        >
          <option value="all">Semua Prodi</option>
          {prodis.map((p) => (
            <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
          ))}
        </select>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : lecturers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data dosen</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {search || filterProdi !== 'all' ? 'Coba ubah filter pencarian' : 'Tambahkan dosen baru'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">NIDN</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Lengkap</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Program Studi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Jabatan Akademik</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers.map((lecturer) => (
                  <TableRow key={lecturer.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-mono font-medium text-[#09090b]">{lecturer.nidn}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{lecturer.nama_lengkap}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">
                      {lecturer.program_studi ? `${lecturer.program_studi.kode} - ${lecturer.program_studi.nama}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#52525b]">{lecturer.jabatan_akademik || '—'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="size-8 rounded-[6px] text-[#71717a] hover:bg-[#f4f4f5]">
                            <MoreVertical className="size-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="border-[#ececee] rounded-[8px] p-1 shadow-md bg-white min-w-[140px]">
                          <DropdownMenuItem onClick={() => openEditModal(lecturer)} className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2 cursor-pointer text-[#09090b] hover:bg-[#f4f4f5]">
                            <Edit className="size-3.5" />
                            Edit Profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openResetModal(lecturer)} className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2 cursor-pointer text-[#09090b] hover:bg-[#f4f4f5]">
                            <KeyRound className="size-3.5" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleBan(lecturer, true)}
                            className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2 cursor-pointer text-[#b91c1c] hover:bg-[#fef2f2]"
                          >
                            <UserX className="size-3.5" />
                            Nonaktifkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#ececee]">
                <p className="text-xs text-[#71717a]">
                  Menampilkan {lecturers.length} dari {count} dosen
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost" size="icon" disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="size-8 rounded-[6px] text-[#71717a] hover:bg-[#f4f4f5] disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs font-semibold text-[#09090b] px-3">{page} / {totalPages}</span>
                  <Button
                    variant="ghost" size="icon" disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="size-8 rounded-[6px] text-[#71717a] hover:bg-[#f4f4f5] disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tambah Dosen Baru</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Daftarkan tenaga pengajar baru di database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="px-6 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">NIDN</Label>
                  <Input
                    required value={formData.nidn}
                    onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                    placeholder="0123456789"
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="budi.santoso"
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Lengkap</Label>
                <Input
                  required value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Dr. Budi Santoso, M.Kom"
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Program Studi</Label>
                  <select
                    value={formData.program_studi_id}
                    onChange={(e) => setFormData({ ...formData, program_studi_id: e.target.value })}
                    className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                  >
                    <option value="">— Non Prodi (Umum) —</option>
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Jabatan Akademik</Label>
                  <select
                    value={formData.jabatan_akademik}
                    onChange={(e) => setFormData({ ...formData, jabatan_akademik: e.target.value })}
                    className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                  >
                    <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                    <option value="Asisten Ahli">Asisten Ahli</option>
                    <option value="Lektor">Lektor</option>
                    <option value="Lektor Kepala">Lektor Kepala</option>
                    <option value="Guru Besar">Guru Besar</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Password Awal</Label>
                <Input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="password"
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
              <Button
                type="button" variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
              >
                Batal
              </Button>
              <Button
                type="submit" disabled={isPending}
                className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
              >
                {isPending ? 'Menyimpan...' : 'Simpan & Daftarkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Edit Data Dosen</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              NIDN tidak dapat dirubah setelah pendaftaran.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="px-6 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">NIDN (Tidak bisa diubah)</Label>
                <Input value={formData.nidn} disabled className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 opacity-50 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Lengkap</Label>
                <Input
                  required value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Program Studi</Label>
                  <select
                    value={formData.program_studi_id}
                    onChange={(e) => setFormData({ ...formData, program_studi_id: e.target.value })}
                    className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                  >
                    <option value="">— Non Prodi (Umum) —</option>
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Jabatan Akademik</Label>
                  <select
                    value={formData.jabatan_akademik}
                    onChange={(e) => setFormData({ ...formData, jabatan_akademik: e.target.value })}
                    className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                  >
                    <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                    <option value="Asisten Ahli">Asisten Ahli</option>
                    <option value="Lektor">Lektor</option>
                    <option value="Lektor Kepala">Lektor Kepala</option>
                    <option value="Guru Besar">Guru Besar</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
              <Button
                type="button" variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
              >
                Batal
              </Button>
              <Button
                type="submit" disabled={isPending}
                className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Reset Password</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Generate password baru untuk dosen ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit}>
            <div className="px-6 pb-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Password Baru</Label>
                <Input
                  required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="password"
                  className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
              <Button
                type="button" variant="outline"
                onClick={() => setIsResetOpen(false)}
                className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
              >
                Batal
              </Button>
              <Button
                type="submit" disabled={isPending}
                className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
              >
                {isPending ? 'Mereset...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
