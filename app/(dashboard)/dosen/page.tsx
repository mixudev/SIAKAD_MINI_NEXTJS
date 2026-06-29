'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Presentation, GraduationCap, CheckSquare, UserCheck, Calendar, Clock, Loader2 } from 'lucide-react'
import { getDosenDashboardAction } from '@/actions/dashboard'

export default function DosenDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getDosenDashboardAction()
    if (res.success) setData(res)
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
        title="Dosen Dashboard"
        description="Portal Pengajaran dan Bimbingan Akademik. Kelola jadwal kelas, rekap absensi, input nilai, dan persetujuan KRS."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Kelas Diajar
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <Presentation className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalKelas || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Kelas aktif mengajar</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Mahasiswa Ampu
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <GraduationCap className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalMahasiswaAmpu || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Tersebar di semua kelas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Presensi Terisi
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <CheckSquare className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalPertemuanTerisi || 0} / {data?.totalPertemuan || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Pertemuan selesai diaabsensi</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              KRS Menunggu
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#ff5a00] rounded-[10000px]">
              <UserCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#ff5a00]">{data?.krsMenunggu || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Mahasiswa bimbingan (PA)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[36px] p-8 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
        <CardHeader className="p-0 pb-4 border-b border-[#ececee] flex flex-row items-center gap-2">
          <Calendar className="size-4 text-[#09090b]" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#09090b]">Jadwal Mengajar Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          {!data?.jadwalHariIni?.length ? (
            <div className="text-xs text-[#71717a] py-6 text-center border border-dashed border-[#ececee] rounded-[14px] font-medium">
              Tidak ada jadwal mengajar untuk hari ini.
            </div>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(data.jadwalHariIni as any[]).map((j: any) => (
                <div key={j.id} className="flex items-center justify-between py-2 border-b border-[#ececee] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f4f4f5] rounded-[8px]">
                      <Clock className="size-4 text-[#09090b]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#09090b]">{j.kelas?.mata_kuliah?.nama || '—'}</p>
                      <p className="text-xs text-[#71717a]">{j.kelas?.nama_kelas} &middot; {j.ruangan || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#52525b]">
                    <p className="font-medium">{j.jam_mulai?.slice(0, 5)} &ndash; {j.jam_selesai?.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
