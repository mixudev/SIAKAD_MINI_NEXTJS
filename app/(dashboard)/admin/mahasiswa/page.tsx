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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserX,
  KeyRound,
  Edit,
  Loader2,
  GraduationCap,
} from 'lucide-react'
import {
  getStudentsAction,
  getDropdownOptionsAction,
  updateStudentAction,
  resetPasswordAction,
  toggleUserBanAction,
} from '@/actions/admin'
import { registerUserAction } from '@/actions/auth'
import { getActiveSemesterAction } from '@/actions/krs'
import { hitungSemesterMahasiswa } from '@/lib/semester-utils'
import { toast } from 'sonner'

interface ProgramStudi { id: string; nama: string; kode: string }
interface Dosen { id: string; user_id: string; nidn: string; nama_lengkap: string }

interface Mahasiswa {
  id: string
  user_id: string
  nim: string
  nama_lengkap: string
  program_studi_id: string
  program_studi?: ProgramStudi | null
  angkatan: number
  status: 'aktif' | 'cuti' | 'lulus' | 'do'
  dosen_pa_id: string | null
  dosen_pa?: Dosen | null
  users?: { username: string | null } | null
}

export default function MahasiswaManagementPage() {
  const [students, setStudents] = useState<Mahasiswa[]>([])
  const [prodis, setProdis] = useState<ProgramStudi[]>([])
  const [dosens, setDosens] = useState<Dosen[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [filterProdi, setFilterProdi] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAngkatan, setFilterAngkatan] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Mahasiswa | null>(null)
  const [semesterAktif, setSemesterAktif] = useState<{ nama: string; tahun_akademik: string } | null>(null)

  const [formData, setFormData] = useState({
    nim: '', nama_lengkap: '', program_studi_id: '',
    angkatan: new Date().getFullYear(), dosen_pa_id: '',
    password: '', username: '', status: 'aktif',
  })
  const [newPassword, setNewPassword] = useState('')
  const [csvText, setCsvText] = useState('')
  const [importLogs, setImportLogs] = useState<string[]>([])

  useEffect(() => {
    async function loadOptions() {
      const res = await getDropdownOptionsAction()
      if (res.success) {
        setProdis(res.prodi as ProgramStudi[])
        setDosens(res.dosen as Dosen[])
      }
      const sem = await getActiveSemesterAction()
      setSemesterAktif(sem)
    }
    loadOptions()
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const res = await getStudentsAction({
      search, prodiId: filterProdi, status: filterStatus,
      angkatan: filterAngkatan, page, limit,
    })
    setIsLoading(false)
    if (res.success) {
      setStudents(res.data as Mahasiswa[])
      setCount(res.count)
    } else {
      toast.error('Gagal memuat data mahasiswa: ' + res.error)
    }
  }, [search, filterProdi, filterStatus, filterAngkatan, page, limit])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setFormData({
      nim: '', nama_lengkap: '', program_studi_id: prodis[0]?.id || '',
      angkatan: new Date().getFullYear(), dosen_pa_id: '',
      password: 'password', username: '', status: 'aktif',
    })
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await registerUserAction({
        role: 'mahasiswa', nim: formData.nim, nama_lengkap: formData.nama_lengkap,
        program_studi_id: formData.program_studi_id,
        angkatan: Number(formData.angkatan), dosen_pa_id: formData.dosen_pa_id || null,
        password: formData.password || 'password', username: formData.username || undefined,
      })
      if (res.success) {
        toast.success('Mahasiswa baru berhasil ditambahkan!')
        setIsAddOpen(false); resetForm(); loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    startTransition(async () => {
      const res = await updateStudentAction(selectedStudent.user_id, {
        nama_lengkap: formData.nama_lengkap,
        program_studi_id: formData.program_studi_id,
        angkatan: Number(formData.angkatan),
        status: formData.status as 'aktif' | 'cuti' | 'lulus' | 'do',
        dosen_pa_id: formData.dosen_pa_id || null,
        username: formData.username,
      })
      if (res.success) {
        toast.success('Data mahasiswa berhasil diperbarui!')
        setIsEditOpen(false); loadData()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !newPassword) return
    startTransition(async () => {
      const res = await resetPasswordAction(selectedStudent.user_id, newPassword)
      if (res.success) {
        toast.success(`Password untuk ${selectedStudent.nama_lengkap} berhasil di-reset!`)
        setIsResetOpen(false); setNewPassword('')
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleToggleBan = async (student: Mahasiswa, shouldBan: boolean) => {
    const actionText = shouldBan ? 'menonaktifkan' : 'mengaktifkan'
    const res = await toggleUserBanAction(student.user_id, shouldBan)
    if (res.success) {
      toast.success(`Berhasil ${actionText} akun ${student.nama_lengkap}`)
      loadData()
    } else {
      toast.error(`Gagal ${actionText} akun: ` + res.error)
    }
  }

  const handleImportCSV = async () => {
    if (!csvText.trim()) {
      toast.error('Masukkan data CSV terlebih dahulu')
      return
    }
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1).filter(line => line.trim())
    setImportLogs([])
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',').map(c => c.trim())
      if (cols.length < headers.length) continue
      const nim = cols[0]
      const nama = cols[1]
      const prodiCode = cols[2]
      const angkatanStr = cols[3]
      const dosenNidn = cols[4]
      const matchedProdi = prodis.find(p => p.kode.toLowerCase() === prodiCode.toLowerCase())
      const matchedDosen = dosens.find(d => d.nidn === dosenNidn)

      if (!matchedProdi) {
        setImportLogs(prev => [...prev, `Baris ${i + 2}: Gagal (Kode Prodi ${prodiCode} tidak valid)`])
        failureCount++
        continue
      }

      const res = await registerUserAction({
        role: 'mahasiswa', nim, nama_lengkap: nama, program_studi_id: matchedProdi.id,
        angkatan: Number(angkatanStr) || new Date().getFullYear(),
        dosen_pa_id: matchedDosen?.id || null, password: 'password',
      })
      if (res.success) successCount++
      else {
        setImportLogs(prev => [...prev, `Baris ${i + 2} (${nim}): Gagal (${res.error})`])
        failureCount++
      }
    }

    toast.success(`Import selesai: ${successCount} berhasil, ${failureCount} gagal.`)
    setCsvText('')
    loadData()
  }

  const openEditModal = (student: Mahasiswa) => {
    setSelectedStudent(student)
    setFormData({
      nim: student.nim, nama_lengkap: student.nama_lengkap,
      program_studi_id: student.program_studi_id, angkatan: student.angkatan,
      status: student.status, dosen_pa_id: student.dosen_pa_id || '',
      password: '', username: student.users?.username || '',
    })
    setIsEditOpen(true)
  }

  const openResetModal = (student: Mahasiswa) => {
    setSelectedStudent(student)
    setNewPassword('password')
    setIsResetOpen(true)
  }

  const totalPages = Math.ceil(count / limit)

  return (
    <>
      <PageHeader
        title="Manajemen Mahasiswa"
        description="Kelola data mahasiswa aktif, nonaktif, pembagian dosen PA, hingga import CSV massal."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { resetForm(); setIsAddOpen(true) }}
              className="bg-[#09090b] hover:bg-[#18181b] text-white rounded-[8px] text-xs font-semibold h-9 px-4"
            >
              <UserPlus className="size-4 mr-1.5" />
              Tambah Mahasiswa
            </Button>
            <Button
              onClick={() => { setCsvText(''); setImportLogs([]); setIsImportOpen(true) }}
              variant="outline"
              className="border-[#d4d4d8] bg-white text-[#09090b] rounded-[8px] text-xs font-semibold h-9 px-4"
            >
              <FileSpreadsheet className="size-4 mr-1.5" />
              Import CSV
            </Button>
            <Button
              onClick={() => {
                const headers = ['NIM', 'Nama', 'Program Studi', 'Angkatan', 'Sem', 'Status', 'Dosen PA']
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rows = students.filter(Boolean).map((s: any) => [
                  s.nim || '',
                  s.nama_lengkap || '',
                  s.program_studi?.nama || '',
                  String(s.angkatan || ''),
                  hitungSemesterMahasiswa(s.angkatan, semesterAktif) !== null ? String(hitungSemesterMahasiswa(s.angkatan, semesterAktif)) : '',
                  s.status || '',
                  s.dosen_pa?.nama_lengkap || '',
                ])
                import('@/lib/export').then(m => m.exportCSV('data_mahasiswa', headers, rows))
              }}
              variant="outline"
              className="border-[#d4d4d8] bg-white text-[#09090b] rounded-[8px] text-xs font-semibold h-9 px-4"
            >
              <FileSpreadsheet className="size-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a1a1aa]" />
          <Input
            placeholder="Cari NIM atau nama..."
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
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="border border-[#d4d4d8] bg-white text-sm rounded-[6px] h-9 px-3 outline-none focus:border-[#09090b]"
        >
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="cuti">Cuti</option>
          <option value="lulus">Lulus</option>
          <option value="do">Drop Out</option>
        </select>
        <select
          value={filterAngkatan}
          onChange={(e) => { setFilterAngkatan(e.target.value); setPage(1) }}
          className="border border-[#d4d4d8] bg-white text-sm rounded-[6px] h-9 px-3 outline-none focus:border-[#09090b]"
        >
          <option value="all">Semua Angkatan</option>
          {Array.from({ length: 6 }).map((_, i) => {
            const year = new Date().getFullYear() - i
            return <option key={year} value={year}>{year}</option>
          })}
        </select>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-[#71717a]" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada data mahasiswa</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {search || filterProdi !== 'all' || filterStatus !== 'all' || filterAngkatan !== 'all'
                ? 'Coba ubah filter pencarian'
                : 'Tambahkan mahasiswa baru'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f5]">
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">NIM</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Lengkap</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Program Studi</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Angkatan</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Sem</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Dosen PA</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-mono font-medium text-[#09090b]">{student.nim}</TableCell>
                    <TableCell className="text-sm font-medium text-[#09090b]">{student.nama_lengkap}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{student.program_studi?.kode || '—'}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{student.angkatan}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{hitungSemesterMahasiswa(student.angkatan, semesterAktif) !== null ? `Semester ${hitungSemesterMahasiswa(student.angkatan, semesterAktif)}` : '—'}</TableCell>
                    <TableCell className="text-sm text-[#52525b]">{student.dosen_pa?.nama_lengkap || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-[4px] text-[10px] font-semibold px-2 py-0.5 border ${
                          student.status === 'aktif'
                            ? 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]'
                            : student.status === 'cuti'
                            ? 'bg-[#fefce8] text-[#a16207] border-[#fef08a]'
                            : student.status === 'lulus'
                            ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]'
                            : 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                        }`}
                      >
                        {student.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="size-8 rounded-[6px] text-[#71717a] hover:bg-[#f4f4f5]">
                            <MoreVertical className="size-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="border-[#ececee] rounded-[8px] p-1 shadow-md bg-white min-w-[140px]">
                          <DropdownMenuItem onClick={() => openEditModal(student)} className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2 cursor-pointer text-[#09090b] hover:bg-[#f4f4f5]">
                            <Edit className="size-3.5" />
                            Edit Profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openResetModal(student)} className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2 cursor-pointer text-[#09090b] hover:bg-[#f4f4f5]">
                            <KeyRound className="size-3.5" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleBan(student, true)}
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
                  Menampilkan {students.length} dari {count} mahasiswa
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
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tambah Mahasiswa Baru</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Daftarkan mahasiswa baru dan buat akun portal secara otomatis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="px-6 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">NIM</Label>
                  <Input
                    required value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="2021310045"
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="rina.aulia"
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Nama Lengkap</Label>
                <Input
                  required value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Rina Aulia Putri"
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
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Angkatan</Label>
                  <Input
                    type="number" required value={formData.angkatan}
                    onChange={(e) => setFormData({ ...formData, angkatan: parseInt(e.target.value) })}
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Dosen PA</Label>
                <select
                  value={formData.dosen_pa_id}
                  onChange={(e) => setFormData({ ...formData, dosen_pa_id: e.target.value })}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="">— Tanpa Pembimbing PA —</option>
                  {dosens.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama_lengkap}</option>
                  ))}
                </select>
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
            <DialogTitle className="text-sm font-bold text-[#09090b]">Edit Data Mahasiswa</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              NIM tidak dapat dirubah setelah pendaftaran.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="px-6 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">NIM (Tidak bisa diubah)</Label>
                <Input value={formData.nim} disabled className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 opacity-50 cursor-not-allowed" />
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
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.kode} - {p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Angkatan</Label>
                  <Input
                    type="number" required value={formData.angkatan}
                    onChange={(e) => setFormData({ ...formData, angkatan: parseInt(e.target.value) })}
                    className="bg-[#f4f4f5] border-transparent text-sm rounded-[6px] h-10 px-4 focus:bg-white focus:border-[#09090b]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Status Akademik</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="aktif">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="lulus">Lulus</option>
                  <option value="do">Drop Out (DO)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Dosen PA</Label>
                <select
                  value={formData.dosen_pa_id}
                  onChange={(e) => setFormData({ ...formData, dosen_pa_id: e.target.value })}
                  className="w-full border border-transparent bg-[#f4f4f5] text-sm rounded-[6px] h-10 px-3 focus:bg-white focus:border-[#09090b] outline-none"
                >
                  <option value="">— Tanpa Pembimbing PA —</option>
                  {dosens.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama_lengkap}</option>
                  ))}
                </select>
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
              Generate password baru untuk mahasiswa ini.
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

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Import Mahasiswa via CSV</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Format kolom: <code className="bg-[#f4f4f5] px-1 rounded">nim, nama, kode_prodi, angkatan, nidn_pa</code>
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Data CSV</Label>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'nim,nama,kode_prodi,angkatan,nidn_pa\n2021310050,Budi Santoso,TI,2021,0123456789\n2021310051,Ani Widya,SI,2021,'}
                className="w-full bg-[#f4f4f5] border-transparent text-sm rounded-[6px] p-4 focus:bg-white focus:border-[#09090b] outline-none font-mono"
              />
            </div>
            {importLogs.length > 0 && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[6px] p-4 text-xs font-mono max-h-32 overflow-y-auto space-y-1">
                <p className="font-bold text-[#b91c1c] border-b border-[#fecaca] pb-1 mb-1">Log:</p>
                {importLogs.map((log, idx) => (
                  <p key={idx} className="text-[#b91c1c]">{log}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]"
            >
              Tutup
            </Button>
            <Button
              onClick={handleImportCSV}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              Mulai Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
