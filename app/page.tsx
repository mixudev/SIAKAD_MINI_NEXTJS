import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight, Users, BookOpen, ClipboardCheck } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#09090b] flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white h-16 flex items-center border-b border-[#e4e4e7] sticky top-0 z-50">
        <div className="max-w-[1120px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#09090b] text-white rounded-[10px]">
              <GraduationCap className="size-4" />
            </div>
            <span className="font-bold text-[#09090b] text-base tracking-tight">SIAKAD MINI</span>
          </div>
          <Link href="/login">
            <Button className="bg-[#09090b] hover:bg-[#27272a] text-white text-sm font-medium rounded-[8px] h-9 px-5">
              Masuk
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1120px] w-full mx-auto px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#09090b] leading-[1.1] mb-5">
            Sistem Informasi Akademik Terpadu
          </h1>
          <p className="text-base sm:text-lg text-[#71717a] leading-relaxed mb-8">
            Portal akademik untuk mengelola KRS, absensi, dan penilaian.
            Digunakan oleh mahasiswa, dosen, dan administrator dalam satu platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button className="bg-[#09090b] hover:bg-[#27272a] text-white font-medium rounded-[8px] h-11 px-6">
                Masuk ke Portal <ArrowRight className="size-4 ml-1.5 inline" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="max-w-[1120px] w-full mx-auto px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">

          {/* Admin */}
          <div className="bg-white rounded-[12px] p-6 border border-[#e4e4e7]">
            <div className="p-2.5 bg-[#f4f4f5] rounded-[8px] w-fit mb-4">
              <Users className="size-5 text-[#09090b]" />
            </div>
            <h3 className="font-bold text-[#09090b] mb-1.5">Administrator</h3>
            <p className="text-sm text-[#71717a] leading-relaxed mb-4">
              Mengelola master data: program studi, mata kuliah, dosen, mahasiswa,
              kelas, jadwal, dan pengaturan semester.
            </p>
            <ul className="space-y-1 text-xs text-[#71717a]">
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> CRUD data mahasiswa & dosen</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Atur kelas dan jadwal perkuliahan</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Pantau seluruh KRS mahasiswa</li>
            </ul>
          </div>

          {/* Dosen */}
          <div className="bg-white rounded-[12px] p-6 border border-[#e4e4e7]">
            <div className="p-2.5 bg-[#f4f4f5] rounded-[8px] w-fit mb-4">
              <ClipboardCheck className="size-5 text-[#09090b]" />
            </div>
            <h3 className="font-bold text-[#09090b] mb-1.5">Dosen</h3>
            <p className="text-sm text-[#71717a] leading-relaxed mb-4">
              Mengelola perkuliahan: mengisi absensi, input nilai,
              dan menyetujui KRS bimbingan akademik mahasiswa.
            </p>
            <ul className="space-y-1 text-xs text-[#71717a]">
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Absensi per pertemuan kelas</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Input komponen nilai (tugas, UTS, UAS)</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Approve KRS mahasiswa bimbingan</li>
            </ul>
          </div>

          {/* Mahasiswa */}
          <div className="bg-white rounded-[12px] p-6 border border-[#e4e4e7]">
            <div className="p-2.5 bg-[#f4f4f5] rounded-[8px] w-fit mb-4">
              <BookOpen className="size-5 text-[#09090b]" />
            </div>
            <h3 className="font-bold text-[#09090b] mb-1.5">Mahasiswa</h3>
            <p className="text-sm text-[#71717a] leading-relaxed mb-4">
              Mengelola rencana studi, memantau kehadiran,
              dan melihat hasil nilai akhir setiap semester.
            </p>
            <ul className="space-y-1 text-xs text-[#71717a]">
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Ambil dan ajukan KRS online</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Lihat riwayat absensi perkuliahan</li>
              <li className="flex items-center gap-1.5"><span className="text-[#09090b]">-</span> Unduh KHS dan transkrip nilai</li>
            </ul>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e4e4e7] bg-white py-8 mt-auto">
        <div className="max-w-[1120px] w-full mx-auto px-6 flex items-center justify-between text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-3.5" />
            <span className="font-semibold text-[#71717a]">SIAKAD MINI</span>
          </div>
          <p>Next.js 15 &middot; Supabase &middot; shadcn/ui</p>
        </div>
      </footer>
    </div>
  )
}
