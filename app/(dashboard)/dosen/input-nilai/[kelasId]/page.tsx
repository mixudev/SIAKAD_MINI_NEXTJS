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
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Printer,
} from 'lucide-react'
import {
  getKomponenNilaiAction,
  upsertKomponenNilaiAction,
  deleteKomponenNilaiAction,
  getNilaiInputAction,
  saveNilaiAction,
} from '@/actions/nilai'
import { toast } from 'sonner'
import { exportDaftarNilaiPdf } from '@/lib/export'

export default function InputNilaiKelasPage() {
  const params = useParams()
  const router = useRouter()
  const kelasId = params.kelasId as string

  const [activeTab, setActiveTab] = useState<'komponen' | 'input'>('komponen')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [komponen, setKomponen] = useState<any[]>([])
  const [totalBobot, setTotalBobot] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matrix, setMatrix] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kelas, setKelas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [namaKomponen, setNamaKomponen] = useState('')
  const [bobotKomponen, setBobotKomponen] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [kompRes, nilaiRes] = await Promise.all([
      getKomponenNilaiAction(kelasId),
      getNilaiInputAction(kelasId),
    ])
    if (kompRes.success) {
      setKomponen(kompRes.data || [])
      setTotalBobot(kompRes.total_bobot || 0)
    }
    if (nilaiRes.success && nilaiRes.data) {
      setMatrix(nilaiRes.data.matrix || [])
      setKelas(nilaiRes.data.kelas || null)
    }
    setLoading(false)
  }, [kelasId])

  useEffect(() => { loadAll() }, [loadAll])

  const handleAddKomponen = () => {
    if (!namaKomponen || !bobotKomponen) { toast.error('Nama dan bobot wajib diisi'); return }
    const bobot = parseFloat(bobotKomponen)
    if (isNaN(bobot) || bobot < 1 || bobot > 100) { toast.error('Bobot harus 1-100'); return }

    startTransition(async () => {
      const fd = new FormData()
      fd.append('kelas_id', kelasId)
      fd.append('nama_komponen', namaKomponen)
      fd.append('bobot_persen', bobotKomponen)
      const res = await upsertKomponenNilaiAction(fd)
      if (res.success) {
        toast.success('Komponen nilai berhasil ditambahkan')
        setShowAdd(false)
        setNamaKomponen('')
        setBobotKomponen('')
        loadAll()
      } else {
        toast.error(res.error || 'Gagal menambah komponen')
      }
    })
  }

  const handleDelete = () => {
    if (!showDelete) return
    startTransition(async () => {
      const res = await deleteKomponenNilaiAction(showDelete)
      if (res.success) {
        toast.success('Komponen dan nilai terkait berhasil dihapus')
        setShowDelete(null)
        loadAll()
      } else {
        toast.error(res.error || 'Gagal menghapus komponen')
      }
    })
  }

  // Nilai state
  const [nilaiInputs, setNilaiInputs] = useState<Record<string, Record<string, string>>>({})

  const handleCetakNilai = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = matrix.map((m: any) => {
      const na = hitungNilaiAkhir(m.mahasiswa_id)
      return {
        nim: m.nim || '',
        nama: m.nama_lengkap || '',
        nilai_akhir: na?.angka ?? null,
        nilai_huruf: na?.huruf || null,
      }
    })
    const namaKelas = `${kelas?.kode_kelas || ''} ${kelas?.mata_kuliah?.nama || ''}`
    exportDaftarNilaiPdf(namaKelas, kelas?.mata_kuliah?.nama || '', rows)
  }

  // Sync nilaiInputs when matrix loads
  useEffect(() => {
    const inputs: Record<string, Record<string, string>> = {}
    for (const m of matrix) {
      for (const k of komponen) {
        const val = m.komponen_nilai?.[k.id]
        if (val !== null && val !== undefined) {
          if (!inputs[m.mahasiswa_id]) inputs[m.mahasiswa_id] = {}
          inputs[m.mahasiswa_id][k.id] = String(val)
        }
      }
    }
    setNilaiInputs(inputs)
  }, [matrix, komponen])

  const updateNilai = (mhsId: string, komponenId: string, value: string) => {
    setNilaiInputs(prev => ({
      ...prev,
      [mhsId]: { ...(prev[mhsId] || {}), [komponenId]: value },
    }))
  }

  const getNilai = (mhsId: string, komponenId: string): string => {
    return nilaiInputs[mhsId]?.[komponenId] ?? ''
  }

  const hitungNilaiAkhir = (mhsId: string): { angka: number | null; huruf: string | null } | null => {
    const entry = matrix.find(m => m.mahasiswa_id === mhsId)
    if (!entry || komponen.length === 0) return null

    let total = 0
    let allFilled = true
    let totalB = 0

    for (const k of komponen) {
      const val = getNilai(mhsId, k.id)
      if (!val) { allFilled = false; break }
      const num = parseFloat(val)
      if (isNaN(num) || num < 0 || num > 100) { allFilled = false; break }
      total += num * Number(k.bobot_persen)
      totalB += Number(k.bobot_persen)
    }

    if (allFilled && totalB > 0) {
      const angka = Math.round((total / totalB) * 100) / 100
      let huruf = ''
      if (angka >= 85) huruf = 'A'
      else if (angka >= 75) huruf = 'B'
      else if (angka >= 65) huruf = 'C'
      else if (angka >= 50) huruf = 'D'
      else huruf = 'E'
      return { angka, huruf }
    }
    return null
  }

  const handleSaveNilai = () => {
    const data: Array<{ komponen_nilai_id: string; mahasiswa_id: string; nilai_angka: number }> = []

    for (const m of matrix) {
      for (const k of komponen) {
        const val = getNilai(m.mahasiswa_id, k.id)
        if (val) {
          const num = parseFloat(val)
          if (isNaN(num) || num < 0 || num > 100) {
            toast.error(`Nilai tidak valid untuk ${m.nim}: ${val}`)
            return
          }
          data.push({ komponen_nilai_id: k.id, mahasiswa_id: m.mahasiswa_id, nilai_angka: num })
        }
      }
    }

    if (data.length === 0) { toast.error('Belum ada nilai yang diinput'); return }

    startTransition(async () => {
      const res = await saveNilaiAction(kelasId, data)
      if (res.success) {
        toast.success('Nilai berhasil disimpan')
        loadAll()
      } else {
        toast.error(res.error || 'Gagal menyimpan nilai')
      }
    })
  }

  return (
    <>
      <PageHeader
        title="Input Nilai"
        description={kelas ? `${kelas.mata_kuliah?.kode_matkul} — ${kelas.nama_kelas} — ${kelas.mata_kuliah?.nama}` : 'Memuat...'}
      />

      {/* Info bar */}
      {kelas && (
        <div className="flex items-center justify-between px-5 py-3 bg-white border border-[#ececee] rounded-[8px] mb-4 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dosen/input-nilai')} className="text-[#71717a] hover:text-[#09090b] transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-xs text-[#52525b]">{matrix.length} mahasiswa terdaftar</p>
          </div>

          {totalBobot > 0 && (
            <Badge className={`rounded-[4px] text-[10px] font-semibold ${
              totalBobot === 100
                ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                : 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
            }`}>
              {totalBobot === 100 ? <CheckCircle2 className="size-3 mr-1" /> : <AlertTriangle className="size-3 mr-1" />}
              Total Bobot: {totalBobot}%
            </Badge>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-[8px] p-1 w-fit">
          <button
            onClick={() => setActiveTab('komponen')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'komponen'
                ? 'bg-white text-[#09090b] shadow-sm'
                : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            Komponen Nilai
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'input'
                ? 'bg-white text-[#09090b] shadow-sm'
                : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            Input Nilai
          </button>
        </div>
        <button
          onClick={handleCetakNilai}
          className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
        >
          <Printer className="size-3.5" />
          Cetak Daftar Nilai
        </button>
      </div>

      {activeTab === 'komponen' && (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-5 animate-spin text-[#71717a]" />
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-[#ececee] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#52525b]">Daftar Komponen Nilai</span>
                  <Badge className={`rounded-[10px] text-[10px] font-semibold ${
                    totalBobot === 100
                      ? 'bg-[#f0fdf4] text-[#15803d]'
                      : totalBobot > 100
                        ? 'bg-[#fef2f2] text-[#b91c1c]'
                        : 'bg-[#fefce8] text-[#a16207]'
                  }`}>
                    {totalBobot} / 100%
                  </Badge>
                </div>
                <Button
                  size="sm"
                  disabled={totalBobot >= 100}
                  onClick={() => { setNamaKomponen(''); setBobotKomponen(''); setShowAdd(true) }}
                  className="h-7 px-2.5 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
                >
                  <Plus className="size-3 mr-1" />
                  Tambah Komponen
                </Button>
              </div>

              {komponen.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm font-medium text-[#52525b]">Belum ada komponen nilai</p>
                  <p className="text-xs text-[#a1a1aa] mt-1">Tambah komponen seperti Tugas, UTS, UAS dengan bobot masing-masing</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f4f4f5]">
                      <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Nama Komponen</TableHead>
                      <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider">Bobot</TableHead>
                      <TableHead className="text-[#71717a] text-xs font-semibold uppercase tracking-wider text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {komponen.map((k: any) => (
                      <TableRow key={k.id} className="border-b border-[#ececee]">
                        <TableCell className="text-sm font-medium text-[#09090b]">{k.nama_komponen}</TableCell>
                        <TableCell className="text-sm text-[#52525b]">{k.bobot_persen}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDelete(k.id)}
                            className="h-7 px-2 text-[10px] font-semibold text-[#b91c1c] hover:bg-[#fef2f2]"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {totalBobot < 100 && (
                <div className="px-5 py-3 border-t border-[#ececee]">
                  <p className="text-[10px] text-[#a1a1aa]">
                    Total bobot harus 100%. {totalBobot > 0 ? `Kurang ${100 - totalBobot}% lagi.` : 'Tambahkan komponen untuk memulai.'}
                  </p>
                </div>
              )}
              {totalBobot > 100 && (
                <div className="px-5 py-3 border-t border-[#ececee] bg-[#fef2f2]">
                  <p className="text-[10px] text-[#b91c1c] flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    Total bobot melebihi 100%! Kurangi atau hapus beberapa komponen.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {activeTab === 'input' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-5 animate-spin text-[#71717a]" />
            </div>
          ) : komponen.length === 0 ? (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-medium text-[#52525b]">Komponen nilai belum ditentukan</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Definisikan komponen nilai terlebih dahulu di tab &quot;Komponen Nilai&quot;</p>
              </div>
            </Card>
          ) : matrix.length === 0 ? (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-medium text-[#52525b]">Tidak ada mahasiswa terdaftar</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Belum ada mahasiswa dengan KRS disetujui di kelas ini</p>
              </div>
            </Card>
          ) : (
            <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f4f4f5]">
                    <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider sticky left-0 bg-[#f4f4f5] z-10 min-w-[60px]">NIM</TableHead>
                    <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase tracking-wider sticky left-[60px] bg-[#f4f4f5] z-10 min-w-[120px]">Nama</TableHead>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {komponen.map((k: any) => (
                      <TableHead key={k.id} className="text-center text-[10px] font-semibold text-[#71717a] min-w-[80px] px-1">
                        <div>{k.nama_komponen}</div>
                        <div className="text-[9px] text-[#a1a1aa]">({k.bobot_persen}%)</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-[10px] font-semibold text-[#15803d] min-w-[80px] px-1">Nilai Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {matrix.map((m: any) => {
                    const na = hitungNilaiAkhir(m.mahasiswa_id)
                    return (
                      <TableRow key={m.mahasiswa_id} className="border-b border-[#ececee]">
                        <TableCell className="text-xs font-mono font-medium text-[#09090b] sticky left-0 bg-white z-10">{m.nim}</TableCell>
                        <TableCell className="text-xs font-medium text-[#09090b] sticky left-[60px] bg-white z-10">{m.nama_lengkap}</TableCell>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {komponen.map((k: any) => (
                          <TableCell key={k.id} className="px-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={getNilai(m.mahasiswa_id, k.id)}
                              onChange={e => updateNilai(m.mahasiswa_id, k.id, e.target.value)}
                              className="h-8 w-[70px] text-xs text-center rounded-[6px] border-[#d4d4d8] mx-auto"
                              placeholder="0-100"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center px-1">
                          {na ? (
                            <div>
                              <span className="text-sm font-bold text-[#09090b]">{na.angka!.toFixed(1)}</span>
                              <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                                na.huruf === 'A' ? 'bg-[#f0fdf4] text-[#15803d]' :
                                na.huruf === 'B' ? 'bg-[#fefce8] text-[#a16207]' :
                                na.huruf === 'C' ? 'bg-[#fff7ed] text-[#c2410c]' :
                                na.huruf === 'D' ? 'bg-[#fef2f2] text-[#b91c1c]' :
                                'bg-[#faf5ff] text-[#6b21a8]'
                              }`}>{na.huruf}</span>
                            </div>
                          ) : (
                            <span className="text-[#d4d4d8] text-[10px]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="px-5 py-3 border-t border-[#ececee] flex items-center justify-between">
                <p className="text-[10px] text-[#71717a]">
                  Input nilai 0-100 per mahasiswa. Nilai akhir terhitung otomatis jika semua komponen terisi.
                </p>
                <Button
                  onClick={handleSaveNilai}
                  disabled={isPending}
                  className="h-8 px-3 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
                >
                  <Save className="size-3 mr-1.5" />
                  {isPending ? 'Menyimpan...' : 'Simpan Semua'}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Add Komponen Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Tambah Komponen Nilai</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Total bobot saat ini: {totalBobot}% — sisa: {100 - totalBobot}%
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#52525b]">Nama Komponen</Label>
              <Input
                placeholder="Contoh: Tugas, UTS, UAS"
                value={namaKomponen}
                onChange={e => setNamaKomponen(e.target.value)}
                className="h-9 text-xs rounded-[6px] border-[#d4d4d8]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#52525b]">Bobot (%)</Label>
              <Input
                type="number"
                min={1}
                max={100 - totalBobot}
                placeholder={`1 - ${100 - totalBobot}`}
                value={bobotKomponen}
                onChange={e => setBobotKomponen(e.target.value)}
                className="h-9 text-xs rounded-[6px] border-[#d4d4d8]"
              />
              {bobotKomponen && (totalBobot + parseFloat(bobotKomponen || '0')) > 100 && (
                <p className="text-[10px] text-[#b91c1c] flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Total bobot akan melebihi 100%
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]">
              Batal
            </Button>
            <Button
              onClick={handleAddKomponen}
              disabled={isPending || !namaKomponen || !bobotKomponen || (totalBobot + parseFloat(bobotKomponen || '0')) > 100}
              className="h-9 px-4 text-xs font-semibold bg-[#09090b] text-white rounded-[6px] hover:bg-[#18181b]"
            >
              {isPending ? 'Menambah...' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-sm font-bold text-[#09090b]">Hapus Komponen</DialogTitle>
            <DialogDescription className="text-xs text-[#71717a]">
              Semua nilai yang sudah diinput untuk komponen ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-[#ececee]">
            <Button variant="outline" onClick={() => setShowDelete(null)} className="h-9 px-4 text-xs font-semibold border-[#d4d4d8] rounded-[6px]">
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="h-9 px-4 text-xs font-semibold bg-[#b91c1c] text-white rounded-[6px] hover:bg-[#dc2626]"
            >
              {isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
