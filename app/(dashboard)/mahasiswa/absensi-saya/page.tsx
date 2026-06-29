'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
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
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { getMyAbsensiAction } from '@/actions/absensi'

const statusDisplay: Record<string, { label: string; bg: string; text: string }> = {
  hadir: { label: 'H', bg: 'bg-[#f0fdf4]', text: 'text-[#15803d]' },
  izin: { label: 'I', bg: 'bg-[#fefce8]', text: 'text-[#a16207]' },
  sakit: { label: 'S', bg: 'bg-[#fef2f2]', text: 'text-[#b91c1c]' },
  alpa: { label: 'A', bg: 'bg-[#faf5ff]', text: 'text-[#6b21a8]' },
}

export default function AbsensiSayaPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getMyAbsensiAction()
    if (res.success) setData(res.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <>
      <PageHeader
        title="Absensi Saya"
        description="Rekap kehadiran mata kuliah semester ini"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-[#71717a]" />
        </div>
      ) : data.length === 0 ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada data absensi</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Data akan muncul setelah dosen mengisi absensi pertemuan</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.map((item: any) => {
            const isExpanded = expanded === item.kelas_id
            const isBelow75 = item.persentase < 75

            return (
              <Card
                key={item.kelas_id}
                className={`bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden cursor-pointer transition-colors hover:border-[#d4d4d8]`}
                onClick={() => setExpanded(isExpanded ? null : item.kelas_id)}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#09090b]">{item.mata_kuliah?.nama}</p>
                      <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">{item.mata_kuliah?.kode_matkul} &middot; {item.nama_kelas}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`rounded-[4px] text-[10px] font-semibold ${
                        isBelow75
                          ? 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
                          : 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                      }`}>
                        {isBelow75 ? <AlertTriangle className="size-3 mr-1" /> : <CheckCircle2 className="size-3 mr-1" />}
                        {item.persentase}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#71717a]">
                    <span>Total: {item.total_pertemuan} pertemuan</span>
                    <span className="text-[#15803d]">H:{item.hadir}</span>
                    <span className="text-[#a16207]">I:{item.izin}</span>
                    <span className="text-[#b91c1c]">S:{item.sakit}</span>
                    <span className="text-[#6b21a8]">A:{item.alpa}</span>
                  </div>
                </div>

                {isExpanded && item.detail && item.detail.length > 0 && (
                  <div className="border-t border-[#ececee]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#f4f4f5]">
                          <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Pertemuan</TableHead>
                          <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Tanggal</TableHead>
                          <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Materi</TableHead>
                          <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {item.detail.map((d: any, i: number) => {
                          const disp = statusDisplay[d.status || '']
                          return (
                            <TableRow key={i} className="border-b border-[#ececee]">
                              <TableCell className="text-xs font-semibold text-[#09090b]">{d.pertemuan_ke}</TableCell>
                              <TableCell className="text-xs text-[#52525b]">{d.tanggal}</TableCell>
                              <TableCell className="text-xs text-[#52525b]">{d.materi || '—'}</TableCell>
                              <TableCell>
                                {disp ? (
                                  <Badge className={`${disp.bg} ${disp.text} border rounded-[4px] text-[10px] font-semibold`}>
                                    {disp.label}
                                  </Badge>
                                ) : (
                                  <span className="text-[#d4d4d8] text-[10px]">Belum diisi</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {isExpanded && (!item.detail || item.detail.length === 0) && (
                  <div className="px-5 py-8 text-center border-t border-[#ececee]">
                    <p className="text-xs text-[#a1a1aa]">Belum ada pertemuan yang tercatat</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
