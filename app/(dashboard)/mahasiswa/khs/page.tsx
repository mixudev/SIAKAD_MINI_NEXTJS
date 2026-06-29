'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Printer,
} from 'lucide-react'
import { getKhsAction } from '@/actions/nilai'
import { getTranskripAction } from '@/actions/dashboard'
import { exportKhsPdf, exportTranskripPdf } from '@/lib/export'

const hurufStyle: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-[#f0fdf4]', text: 'text-[#15803d]' },
  B: { bg: 'bg-[#fefce8]', text: 'text-[#a16207]' },
  C: { bg: 'bg-[#fff7ed]', text: 'text-[#c2410c]' },
  D: { bg: 'bg-[#fef2f2]', text: 'text-[#b91c1c]' },
  E: { bg: 'bg-[#faf5ff]', text: 'text-[#6b21a8]' },
}

export default function KhsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [semester, setSemester] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transkrip, setTranskrip] = useState<any[]>([])
  const [ipkKumulatif, setIpkKumulatif] = useState(0)
  const [totalSksKum, setTotalSksKum] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showTranskrip, setShowTranskrip] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [khsRes, transkripRes] = await Promise.all([
      getKhsAction(),
      getTranskripAction(),
    ])
    if (khsRes.success) {
      setData(khsRes.data || [])
      setSemester(khsRes.semester || null)
    }
    if (transkripRes.success) {
      setTranskrip(transkripRes.transkrip || [])
      setIpkKumulatif(transkripRes.ipkKumulatif || 0)
      setTotalSksKum(transkripRes.totalSksKumulatif || 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalSks = data.reduce((sum, item) => sum + (item.mata_kuliah?.sks || 0), 0)
  const totalMutu = data.reduce((sum, item) => {
    if (!item.nilai_akhir?.huruf) return sum
    const bobotMutu: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, E: 0 }
    const sks = item.mata_kuliah?.sks || 0
    return sum + (bobotMutu[item.nilai_akhir.huruf] || 0) * sks
  }, 0)
  const ip = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : '0.00'

  const transkripSorted = [...transkrip].sort((a, b) => {
    const aName = a.semester?.nama || ''
    const bName = b.semester?.nama || ''
    const aNum = parseInt(aName.replace(/\D/g, '')) || 0
    const bNum = parseInt(bName.replace(/\D/g, '')) || 0
    return aNum - bNum
  })

  const handleCetakKhs = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = data.map((item: any) => ({
      nama: item.mata_kuliah?.nama || '',
      kode: item.mata_kuliah?.kode_matkul || '',
      sks: item.mata_kuliah?.sks || 0,
      nilai_angka: item.nilai_akhir?.angka ?? null,
      nilai_huruf: item.nilai_akhir?.huruf || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      komponen: (item.komponen || []).map((k: any) => ({
        nama: k.nama,
        bobot: k.bobot,
        nilai: k.nilai,
      })),
    }))
    exportKhsPdf(semester?.nama || 'Semester Ini', items, ip, totalSks)
  }

  const handleCetakTranskrip = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const semesters = transkripSorted.map((sem: any) => ({
      nama: sem.semester?.nama || '',
      tahun: sem.semester?.tahun_akademik || '',
      ips: sem.ips ?? 0,
      sks: sem.totalSks || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matkul: (sem.matkul || []).map((m: any) => ({
        kode: m.kode_matkul || '',
        nama: m.nama_matkul || '',
        sks: m.sks || 0,
        nilai: m.nilai_huruf || '-',
      })),
    }))
    exportTranskripPdf(ipkKumulatif, totalSksKum, semesters)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-[#71717a]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 py-6">
      <PageHeader
        title="KHS & Transkrip"
        description={semester ? `${semester.nama} ${semester.tahun_akademik}` : 'Kartu Hasil Studi'}
      />

      {data.length === 0 && transkrip.length === 0 ? (
        <Card className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="size-10 text-[#d4d4d8] mb-3" />
            <p className="text-sm font-medium text-[#52525b]">Belum ada data nilai</p>
            <p className="text-xs text-[#a1a1aa] mt-1">Nilai akan muncul setelah dosen menginput nilai</p>
          </div>
        </Card>
      ) : (
        <>
          {/* KHS Semester Ini */}
          {data.length > 0 && (
            <>
              <div className="flex items-center justify-between px-5 py-4 bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
                    Indeks Prestasi {semester?.nama || 'Semester Ini'}
                  </p>
                  <p className="text-2xl font-bold text-[#09090b] mt-1">{ip}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCetakKhs}
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                  >
                    <Printer className="size-3.5" />
                    Cetak KHS
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] text-[#71717a]">Total SKS: <strong className="text-[#09090b]">{totalSks}</strong></p>
                    <p className="text-[10px] text-[#71717a] mt-0.5">Total Mata Kuliah: <strong className="text-[#09090b]">{data.length}</strong></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.map((item: any) => {
                  const isExpanded = expanded === item.kelas_id
                  return (
                    <Card
                      key={item.kelas_id}
                      className="bg-white border border-[#ececee] rounded-[8px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors"
                        onClick={() => setExpanded(isExpanded ? null : item.kelas_id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#09090b]">{item.mata_kuliah?.nama}</p>
                          <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">
                            {item.mata_kuliah?.kode_matkul} &middot; {item.mata_kuliah?.sks} SKS &middot; {item.nama_kelas}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.nilai_akhir ? (
                            <div className="text-right">
                              <span className="text-sm font-semibold text-[#09090b]">{item.nilai_akhir.angka?.toFixed(1)}</span>
                              <span className={`ml-1.5 inline-flex items-center justify-center w-6 h-6 rounded-[4px] text-[10px] font-bold ${
                                hurufStyle[item.nilai_akhir.huruf]?.bg || 'bg-[#f4f4f5]'
                              } ${
                                hurufStyle[item.nilai_akhir.huruf]?.text || 'text-[#71717a]'
                              }`}>
                                {item.nilai_akhir.huruf || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#d4d4d8]">Belum diisi</span>
                          )}
                          {isExpanded ? <ChevronUp className="size-4 text-[#a1a1aa]" /> : <ChevronDown className="size-4 text-[#a1a1aa]" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#ececee]">
                          {item.komponen && item.komponen.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#f4f4f5]">
                                  <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Komponen</TableHead>
                                  <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase text-center">Bobot</TableHead>
                                  <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase text-center">Nilai</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {item.komponen.map((k: any) => (
                                  <TableRow key={k.id} className="border-b border-[#ececee]">
                                    <TableCell className="text-xs font-medium text-[#09090b]">{k.nama}</TableCell>
                                    <TableCell className="text-xs text-[#52525b] text-center">{k.bobot}%</TableCell>
                                    <TableCell className="text-center">
                                      {k.nilai !== null ? (
                                        <span className="text-sm font-semibold text-[#09090b]">{k.nilai}</span>
                                      ) : (
                                        <span className="text-[#d4d4d8] text-[10px]">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="px-5 py-6 text-center">
                              <p className="text-xs text-[#a1a1aa]">Komponen nilai belum didefinisikan</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* Transkrip Kumulatif */}
          <Card className="bg-white border border-[#ececee] rounded-[12px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
              onClick={() => setShowTranskrip(!showTranskrip)}
            >
              <div className="flex items-center gap-3">
                <Award className="size-5 text-[#09090b]" />
                <div>
                  <p className="text-sm font-bold text-[#09090b]">Transkrip Akademik</p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">
                    IPK Kumulatif: <strong>{ipkKumulatif.toFixed(2)}</strong> &middot; Total SKS: <strong>{totalSksKum}</strong> &middot; {transkripSorted.length} Semester
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCetakTranskrip() }}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                >
                  <Printer className="size-3.5" />
                  Cetak Transkrip
                </button>
                {showTranskrip ? <ChevronUp className="size-4 text-[#a1a1aa]" /> : <ChevronDown className="size-4 text-[#a1a1aa]" />}
            </div>
          </div>

            {showTranskrip && (
              <div className="border-t border-[#ececee] divide-y divide-[#ececee]">
                {transkripSorted.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <BookOpen className="size-8 text-[#d4d4d8] mx-auto mb-2" />
                    <p className="text-xs text-[#a1a1aa]">Belum ada data transkrip</p>
                  </div>
                ) : (
                  (transkripSorted as any[]).map((sem: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={idx} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-[#09090b]">{sem.semester?.nama}</p>
                          <p className="text-[10px] text-[#71717a]">{sem.semester?.tahun_akademik}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[#09090b]">IPS: {sem.ips?.toFixed(2) || '0.00'}</p>
                          <p className="text-[10px] text-[#71717a]">SKS: {sem.totalSks}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {sem.matkul.map((m: any, mi: number) => (
                          <div key={mi} className="flex items-center justify-between py-1 text-[12px]">
                            <div className="min-w-0 flex-1">
                              <span className="text-[#09090b] font-medium">{m.nama_matkul}</span>
                              <span className="text-[#a1a1aa] ml-2">{m.kode_matkul}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              <span className="text-[#71717a]">{m.sks} SKS</span>
                              {m.nilai_huruf ? (
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-[3px] text-[9px] font-bold ${
                                  hurufStyle[m.nilai_huruf]?.bg || 'bg-[#f4f4f5]'
                                } ${
                                  hurufStyle[m.nilai_huruf]?.text || 'text-[#71717a]'
                                }`}>
                                  {m.nilai_huruf}
                                </span>
                              ) : (
                                <span className="text-[#d4d4d8] text-[10px]">—</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
