'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDosenKelasAction } from '@/actions/absensi'
import Link from 'next/link'
import { BookOpen, Loader2, Presentation, ClipboardCheck, TrendingUp } from 'lucide-react'

export default function DosenAbsensiPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [semester, setSemester] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getDosenKelasAction()
    if (res.success) {
      setData(res.data || [])
      setSemester(res.semester || null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <>
      <PageHeader
        title="Absensi Pertemuan"
        description={semester ? `Kelas yang diajar — ${semester.nama} ${semester.tahun_akademik}` : 'Kelas yang diajar'}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-[#71717a]" />
        </div>
      ) : data.length === 0 ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Presentation className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Tidak ada kelas di semester ini</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Belum ada kelas yang diampu untuk semester aktif</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.map((kelas: any) => (
            <Card key={kelas.id} className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#09090b] truncate">{kelas.mata_kuliah?.nama}</p>
                  <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">
                    {kelas.mata_kuliah?.kode_matkul} &middot; {kelas.nama_kelas} &middot; {kelas.mata_kuliah?.sks} SKS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#71717a] mb-3">
                <Badge className="bg-[#f4f4f5] text-[#52525b] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold">
                  <BookOpen className="size-3 mr-1" />
                  {kelas.enrolled_count} mhs
                </Badge>
                <Badge className="bg-[#f4f4f5] text-[#52525b] border border-[#d4d4d8] rounded-[4px] text-[10px] font-semibold">
                  {kelas.filled_pertemuan}/{kelas.total_pertemuan} terisi
                </Badge>
              </div>

              {kelas.jadwal?.[0] && (
                <p className="text-[10px] text-[#a1a1aa] mb-3">
                  {kelas.jadwal[0].hari}, {kelas.jadwal[0].jam_mulai.slice(0,5)}-{kelas.jadwal[0].jam_selesai.slice(0,5)} &middot; {kelas.jadwal[0].ruangan}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Link href={`/dosen/absensi/${kelas.id}`}>
                  <Button size="sm" className="h-7 text-[10px] font-semibold bg-[#09090b] text-white rounded-[6px] px-2.5 hover:bg-[#18181b]">
                    <ClipboardCheck className="size-3 mr-1" />
                    Absensi
                  </Button>
                </Link>
                <Link href={`/dosen/absensi/${kelas.id}/rekap`}>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-semibold border-[#d4d4d8] rounded-[6px] px-2.5">
                    <TrendingUp className="size-3 mr-1" />
                    Rekap
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
