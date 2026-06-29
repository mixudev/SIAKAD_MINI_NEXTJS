'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Loader2, User } from 'lucide-react'
import { getMahasiswaJadwalAction } from '@/actions/dashboard'

const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function MahasiswaJadwalPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jadwal, setJadwal] = useState<Record<string, any[]>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [semester, setSemester] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getMahasiswaJadwalAction()
    if (res.success) {
      setJadwal((res.data || {}) as Record<string, any[]>) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const totalJadwal = Object.values(jadwal).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-8 py-6">
      <PageHeader
        title="Jadwal Kuliah"
        description={semester ? `Jadwal perkuliahan semester ${semester.nama} — ${semester.tahun_akademik}` : 'Jadwal perkuliahan semester aktif'}
      />

      {!totalJadwal ? (
        <Card className="bg-white border border-[#ececee] rounded-[36px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="size-10 text-[#d4d4d8] mb-4" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada jadwal</p>
            <p className="text-xs text-[#a1a1aa] mt-1">KRS Anda belum disetujui atau belum ada jadwal yang ditentukan</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayNames.map(day => {
            const items = jadwal[day] || []
            if (!items.length) return null

            return (
              <Card key={day} className="bg-white border border-[#ececee] rounded-[12px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
                <CardHeader className="p-3 bg-[#f4f4f5] border-b border-[#ececee]">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-[#52525b]">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {items.map((j: any) => (
                    <div key={j.id} className="p-3 border-b border-[#ececee] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#09090b] truncate">{j.kelas?.mata_kuliah?.nama || '—'}</p>
                          <p className="text-[10px] text-[#71717a] mt-0.5">
                            {j.kelas?.mata_kuliah?.kode_matkul} &middot; {j.kelas?.nama_kelas}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d] border-0 shrink-0">
                          {j.kelas?.mata_kuliah?.sks} SKS
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#52525b] mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-[#a1a1aa]" />
                          <span>{j.jam_mulai?.slice(0, 5)} &ndash; {j.jam_selesai?.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-[#a1a1aa]" />
                          <span>{j.ruangan || '—'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#a1a1aa]">
                        <User className="size-3" />
                        <span>{j.kelas?.dosen?.nama_lengkap || '—'}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
