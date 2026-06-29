'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Calendar, GraduationCap, CheckSquare, Clock, Loader2 } from 'lucide-react'
import { getMahasiswaDashboardAction } from '@/actions/dashboard'

const statusColor: Record<string, string> = {
  draft: 'text-[#71717a]',
  diajukan: 'text-[#ff5a00]',
  disetujui: 'text-[#30d158]',
  ditolak: 'text-[#b91c1c]',
}

export default function MahasiswaDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getMahasiswaDashboardAction()
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
        title="Mahasiswa Dashboard"
        description="Portal Akademik Mandiri. Ajukan KRS semester baru, pantau jadwal perkuliahan, presensi kelas, dan rekap KHS."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Status KRS
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] rounded-[10000px]">
              <FileSpreadsheet className="size-4 text-[#09090b]" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className={`text-3xl font-extrabold tracking-tight ${statusColor[data?.krsStatus || 'draft']}`}>
              {data?.krsStatus ? (
                data.krsStatus === 'diajukan' ? 'Menunggu' :
                data.krsStatus === 'disetujui' ? 'Disetujui' :
                data.krsStatus === 'ditolak' ? 'Ditolak' : 'Draft'
              ) : '—'}
            </div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Oleh Dosen Wali (PA)</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              SKS Diambil
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalSks || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Batas maksimal: 24 SKS</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              IPK Kumulatif
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] rounded-[10000px]">
              <GraduationCap className="size-4 text-[#09090b]" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.ipk?.toFixed(2) || '0.00'}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">IPK kumulatif semua semester</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Kehadiran
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <CheckSquare className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.kehadiranPersen?.toFixed(1) || '0'}%</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Minimum syarat ujian: 75%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[36px] p-8 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
        <CardHeader className="p-0 pb-4 border-b border-[#ececee] flex flex-row items-center gap-2">
          <Clock className="size-4 text-[#09090b]" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#09090b]">Jadwal Kuliah Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          {!data?.jadwalHariIni?.length ? (
            <div className="text-xs text-[#71717a] py-6 text-center border border-dashed border-[#ececee] rounded-[14px] font-medium">
              Tidak ada jadwal kuliah untuk hari ini.
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
