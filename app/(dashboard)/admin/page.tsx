'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Presentation, Activity, Loader2, FileSpreadsheet, Clock } from 'lucide-react'
import { getAdminDashboardAction } from '@/actions/dashboard'

export default function AdminDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getAdminDashboardAction()
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
        title="Admin Dashboard"
        description="Panel kontrol utama Biro Administrasi Akademik. Kelola data master civitas akademika."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Total Mahasiswa
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalMahasiswa?.toLocaleString() || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Mahasiswa aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Total Dosen
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalDosen || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Tenaga pengajar aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Mata Kuliah
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <BookOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalMatkul || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">Mata kuliah kurikulum aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#ececee] rounded-[36px] p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
              Kelas Berjalan
            </CardTitle>
            <div className="p-2 bg-[#f4f4f5] text-[#09090b] rounded-[10000px]">
              <Presentation className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#09090b]">{data?.totalKelas || 0}</div>
            <p className="text-[11px] text-[#71717a] font-medium mt-1">{data?.semester ? `Semester ${data.semester.nama}` : 'Kelas semester ini'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-[#ececee] rounded-[36px] p-8 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
        <CardHeader className="p-0 pb-4 border-b border-[#ececee] flex flex-row items-center gap-2">
          <FileSpreadsheet className="size-4 text-[#09090b]" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#09090b]">KRS Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          {!data?.recentKrs?.length ? (
            <div className="text-xs text-[#71717a] py-6 text-center border border-dashed border-[#ececee] rounded-[14px] font-medium">
              Tidak ada KRS yang menunggu persetujuan.
            </div>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(data.recentKrs as any[]).map((krs: any) => (
                <div key={krs.id} className="flex items-center justify-between py-2 border-b border-[#ececee] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#09090b]">{krs.mahasiswa?.nama_lengkap || '—'}</p>
                    <p className="text-xs text-[#71717a]">{krs.mahasiswa?.nim} &middot; {krs.semester?.nama}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold text-[#ff5a00] bg-[#fff7ed] border-0">
                    {krs.tanggal_pengajuan ? new Date(krs.tanggal_pengajuan).toLocaleDateString('id-ID') : '—'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border border-[#ececee] rounded-[36px] p-8 shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
        <CardHeader className="p-0 pb-4 border-b border-[#ececee] flex flex-row items-center gap-2">
          <Activity className="size-4 text-[#09090b]" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#09090b]">Informasi Semester</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          {data?.semester ? (
            <div className="flex items-center gap-2 text-sm text-[#52525b]">
              <Clock className="size-4" />
              <span>Semester aktif: <strong className="text-[#09090b]">{data.semester.nama}</strong> &mdash; {data.semester.tahun_akademik}</span>
            </div>
          ) : (
            <div className="text-xs text-[#71717a] py-6 text-center border border-dashed border-[#ececee] rounded-[14px] font-medium">
              Belum ada semester aktif.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
