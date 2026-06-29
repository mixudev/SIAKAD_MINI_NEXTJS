'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Presentation, Users, GraduationCap, CheckSquare, Loader2, Clock, MapPin, ArrowRight } from 'lucide-react'
import { getDosenKelasAction } from '@/actions/nilai'

export default function DosenKelasSayaPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-6 animate-spin text-[#71717a]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 py-6">
      <PageHeader
        title="Kelas Saya"
        description={semester ? `Daftar kelas yang diajar pada semester ${semester.nama} — ${semester.tahun_akademik}` : 'Daftar kelas yang diajar'}
      />

      {!data.length ? (
        <Card className="bg-white border border-[#ececee] rounded-[36px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Presentation className="size-10 text-[#d4d4d8] mb-4" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada kelas</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Anda belum memiliki kelas untuk semester aktif</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.map((kelas: any) => (
            <Card key={kelas.id} className="bg-white border border-[#ececee] rounded-[12px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] p-5 hover:shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px] transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#09090b] truncate">{kelas.mata_kuliah?.nama || '—'}</p>
                  <p className="text-[11px] text-[#71717a] mt-0.5">
                    {kelas.mata_kuliah?.kode_matkul} &middot; {kelas.nama_kelas}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 text-[10px] font-semibold bg-[#f4f4f5] text-[#52525b] border-0 shrink-0">
                  {kelas.mata_kuliah?.sks || '?'} SKS
                </Badge>
              </div>

              <div className="space-y-1.5 mb-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(kelas.jadwal || []).map((j: any) => (
                  <div key={j.id} className="flex items-center gap-2 text-[11px] text-[#52525b]">
                    <Clock className="size-3 text-[#a1a1aa]" />
                    <span className="font-medium">{j.hari}</span>
                    <span>{j.jam_mulai?.slice(0, 5)} &ndash; {j.jam_selesai?.slice(0, 5)}</span>
                    <MapPin className="size-3 text-[#a1a1aa] ml-1" />
                    <span>{j.ruangan || '—'}</span>
                  </div>
                ))}
                {!kelas.jadwal?.length && (
                  <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                    <Clock className="size-3" />
                    <span>Jadwal belum ditentukan</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 py-2 border-t border-[#ececee] text-[11px] text-[#71717a]">
                <div className="flex items-center gap-1">
                  <Users className="size-3" />
                  <span>{kelas.enrolled_count} mhs</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="size-3" />
                  <span>Nilai: {kelas.nilai_filled}/{kelas.enrolled_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="size-3" />
                  <span>{kelas.total_komponen} komp.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#ececee]">
                <Link
                  href={`/dosen/absensi/${kelas.id}`}
                  className="inline-flex items-center justify-center h-8 px-3 text-[11px] font-semibold text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                >
                  <CheckSquare className="size-3.5 mr-1.5" />
                  Absensi
                </Link>
                <Link
                  href={`/dosen/input-nilai/${kelas.id}`}
                  className="inline-flex items-center justify-center h-8 px-3 text-[11px] font-semibold text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                >
                  <GraduationCap className="size-3.5 mr-1.5" />
                  Nilai
                </Link>
                <div className="flex-1" />
                <Link
                  href={`/dosen/absensi/${kelas.id}/rekap`}
                  className="inline-flex items-center justify-center h-8 px-2 text-[11px] font-semibold text-[#71717a] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                >
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
