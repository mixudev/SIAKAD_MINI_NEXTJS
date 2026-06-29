import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Landmark, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5] text-[#09090b] flex flex-col font-sans selection:bg-[#09090b] selection:text-[#ffffff]">
      
      {/* Announcement Banner */}
      <div className="w-full bg-[#09090b] text-white py-3 px-4 text-center z-50 text-xs sm:text-sm font-medium sticky top-0 flex items-center justify-center gap-2">
        <span className="bg-[#ff5a00] text-white px-2 py-0.5 rounded-[12px] text-[10px] font-bold tracking-wider">NEW</span>
        <span>Portal Akademik SIAKAD MINI v1.0.0 siap digunakan.</span>
        <Link href="/login" className="underline hover:text-[#fe45e2] transition-colors ml-1 font-bold">
          Masuk Sekarang →
        </Link>
      </div>

      {/* Navigation Header */}
      <header className="bg-[#f4f4f5] h-20 flex items-center border-b border-[#ececee]">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-[#09090b] text-white rounded-[40px] flex items-center justify-center">
              <Landmark className="size-5" />
            </div>
            <div>
              <span className="font-bold text-[#09090b] tracking-tight text-lg">SIAKAD MINI</span>
              <p className="text-[10px] text-[#71717a] font-semibold tracking-wider uppercase leading-none mt-0.5">Campus Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#71717a]">
            <a href="#portals" className="hover:text-[#09090b] transition-colors">Portal Role</a>
            <a href="#features" className="hover:text-[#09090b] transition-colors">Fitur Utama</a>
            <a href="#stats" className="hover:text-[#09090b] transition-colors">Statistik</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium hover:bg-[#ececee] rounded-[36px] px-5 h-10 text-[#3f3f46]">
                [ Login ]
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[#09090b] hover:bg-[#18181b] text-white text-sm font-medium rounded-[36px] px-6 h-10 shadow-[rgba(255,255,255,0.5)_0px_0.5px_0px_0px_inset,rgba(117,123,133,0.4)_0px_9px_14px_-5px_inset,rgb(44,46,52)_0px_0px_0px_1.5px,rgba(0,0,0,0.14)_0px_4px_6px_0px]">
                Mulai Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1200px] w-full mx-auto px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left: Headline & Call to Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[12px] bg-[#ececee] border border-[#d4d4d8] text-xs font-semibold text-[#3f3f46]">
              <span className="h-2 w-2 rounded-full bg-[#ff5a00]"></span>
              Sistem Informasi Akademik Terpadu
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#09090b] leading-[1.05] max-w-2xl">
              <span className="font-light text-[#71717a]">Mudahkan seluruh</span> <span className="font-bold text-[#09090b]">administrasi kampus</span> dalam satu portal.
            </h1>
            <p className="text-base sm:text-lg text-[#71717a] max-w-xl leading-relaxed">
              SIAKAD MINI mempertemukan mahasiswa, dosen, dan admin dalam sebuah workflow data-heavy yang cepat, responsif, dan bebas hambatan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login">
                <Button className="bg-[#09090b] hover:bg-[#18181b] text-white font-medium rounded-[36px] h-12 px-8 shadow-[rgba(255,255,255,0.5)_0px_0.5px_0px_0px_inset,rgba(117,123,133,0.4)_0px_9px_14px_-5px_inset,rgb(44,46,52)_0px_0px_0px_1.5px,rgba(0,0,0,0.14)_0px_4px_6px_0px]">
                  Masuk Portal <ArrowRight className="size-4 ml-2 inline" />
                </Button>
              </Link>
              <a href="#portals">
                <Button className="bg-white hover:bg-[#f4f4f5] text-[#3f3f46] border border-[#3f3f46] font-medium rounded-[36px] h-12 px-8">
                  Lihat Akses Peran
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Tactile Graphic Panel */}
          <div className="lg:col-span-5 relative">
            {/* Pink Orchid Flash Card Wash */}
            <div className="bg-[#fe45e2] text-white p-8 rounded-[36px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-[12px]">SYSTEM DASHBOARD</span>
                <span className="text-xs font-semibold text-white/80">SIAKAD v1</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold leading-tight">Kehadiran &amp; KRS Aman.</h3>
                <p className="text-sm font-light text-white/90">
                  Tidak ada lagi formulir fisik atau antrean panjang. Semua rencana studi disetujui secara digital oleh pembimbing.
                </p>
              </div>
              <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                <span className="text-[11px] font-bold">100% PRODUCTION READY</span>
                <span className="text-xs bg-[#09090b] text-white px-3 py-1 rounded-[36px] font-semibold">Active Portal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Numbers Section */}
      <section id="stats" className="bg-[#f4f4f5] py-20 border-t border-[#ececee] border-b border-[#ececee]">
        <div className="max-w-[1200px] w-full mx-auto px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#09090b]">1,200+</div>
              <div className="text-xs text-[#71717a] font-medium uppercase tracking-wider">Mahasiswa Aktif</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#09090b]">80+</div>
              <div className="text-xs text-[#71717a] font-medium uppercase tracking-wider">Dosen Pengampu</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#09090b]">98.6%</div>
              <div className="text-xs text-[#71717a] font-medium uppercase tracking-wider">KRS Terproses Instan</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#09090b]">12+</div>
              <div className="text-xs text-[#71717a] font-medium uppercase tracking-wider">Program Studi Terintegrasi</div>
            </div>

          </div>
        </div>
      </section>

      {/* Role Access Section */}
      <section id="portals" className="max-w-[1200px] w-full mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-[#09090b] uppercase">Akses Portal Peran</h2>
          <p className="text-sm text-[#71717a]">
            Workflow akademik dibagi menjadi tiga portal dengan otorisasi khusus. Uji layout sidebar untuk masing-masing peran di bawah ini:
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Admin Portal Card */}
          <div className="bg-white rounded-[36px] p-8 border border-[#ececee] flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-[#3f3f46] text-[#fafafa] text-[10px] font-bold px-2.5 py-1 rounded-[12px] uppercase">PORTAL 01</span>
                <span className="text-[10px] text-[#ff5a00] font-bold">YC BACKED</span>
              </div>
              <h3 className="text-xl font-bold text-[#09090b] uppercase">Administrator</h3>
              <p className="text-sm text-[#71717a] leading-relaxed">
                Kelola penuh master data akademik kampus: data mahasiswa, pengajar dosen, semester, ruang kelas, mata kuliah, jadwal kelas, dan alokasi KRS.
              </p>
            </div>
            <Link href="/admin">
              <Button className="w-full bg-[#09090b] hover:bg-[#18181b] text-white rounded-[36px] text-xs font-semibold h-10">
                Masuk Portal Admin
              </Button>
            </Link>
          </div>

          {/* Dosen Portal Card */}
          <div className="bg-white rounded-[36px] p-8 border border-[#ececee] flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-[#3f3f46] text-[#fafafa] text-[10px] font-bold px-2.5 py-1 rounded-[12px] uppercase">PORTAL 02</span>
                <span className="text-[10px] text-[#ff5a00] font-bold">YC BACKED</span>
              </div>
              <h3 className="text-xl font-bold text-[#09090b] uppercase">Dosen Pengajar</h3>
              <p className="text-sm text-[#71717a] leading-relaxed">
                Kelola kelas yang diampu, catat daftar presensi per pertemuan mahasiswa, input nilai komponen UTS/UAS, serta evaluasi KRS bimbingan akademik.
              </p>
            </div>
            <Link href="/dosen">
              <Button className="w-full bg-[#09090b] hover:bg-[#18181b] text-white rounded-[36px] text-xs font-semibold h-10">
                Masuk Portal Dosen
              </Button>
            </Link>
          </div>

          {/* Mahasiswa Portal Card */}
          <div className="bg-white rounded-[36px] p-8 border border-[#ececee] flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-[#3f3f46] text-[#fafafa] text-[10px] font-bold px-2.5 py-1 rounded-[12px] uppercase">PORTAL 03</span>
                <span className="text-[10px] text-[#ff5a00] font-bold">YC BACKED</span>
              </div>
              <h3 className="text-xl font-bold text-[#09090b] uppercase">Mahasiswa</h3>
              <p className="text-sm text-[#71717a] leading-relaxed">
                Ajukan KRS online tiap semester, pantau jadwal kuliah mingguan, lihat riwayat presensi kehadiran kelas, serta unduh transkrip nilai KHS.
              </p>
            </div>
            <Link href="/mahasiswa">
              <Button className="w-full bg-[#09090b] hover:bg-[#18181b] text-white rounded-[36px] text-xs font-semibold h-10">
                Masuk Portal Mahasiswa
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="bg-[#ececee] py-20 border-t border-[#d4d4d8]">
        <div className="max-w-[1200px] w-full mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#09090b] uppercase">Siklus Akademik Terpadu</h2>
            <p className="text-sm text-[#71717a] max-w-lg leading-relaxed">
              Workflow otomatisasi SIAKAD Mini mengintegrasikan proses akademik dari hulu ke hilir.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            <div className="bg-white rounded-[28px] p-6 flex gap-4 items-start border border-[#d4d4d8]">
              <div className="p-3 bg-[#f4f4f5] text-[#09090b] rounded-[40px] shrink-0 font-bold text-sm">01</div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#09090b]">Penyusunan Rencana Studi (KRS)</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Mahasiswa merencanakan studi semester secara interaktif. Sistem langsung memberikan validasi batas SKS berdasarkan IPK semester lalu dan prasyarat matkul.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 flex gap-4 items-start border border-[#d4d4d8]">
              <div className="p-3 bg-[#f4f4f5] text-[#09090b] rounded-[40px] shrink-0 font-bold text-sm">02</div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#09090b]">Persetujuan Dosen PA</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Dosen Wali (Pembimbing Akademik) secara real-time menerima notifikasi bimbingan, mengevaluasi usulan mahasiswa, dan memberikan approval KRS secara digital.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 flex gap-4 items-start border border-[#d4d4d8]">
              <div className="p-3 bg-[#f4f4f5] text-[#09090b] rounded-[40px] shrink-0 font-bold text-sm">03</div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#09090b]">Absensi Kelas Terintegrasi</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Dosen mengisi daftar kehadiran langsung di kelas. Mahasiswa dapat memantau akumulasi presensi diri guna menjamin batas minimal 75% kehadiran untuk ujian.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 flex gap-4 items-start border border-[#d4d4d8]">
              <div className="p-3 bg-[#f4f4f5] text-[#09090b] rounded-[40px] shrink-0 font-bold text-sm">04</div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#09090b]">Komponen Nilai &amp; IPS Otomatis</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Dosen mengunggah nilai tugas, kuis, UTS, dan UAS. Sistem menghitung bobot nilai akhir, menentukan grade huruf, serta memformulasikan Indeks Prestasi Semester (IPS).
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ececee] bg-white py-12 mt-auto">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[#71717a] text-xs">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-[#09090b]" />
            <span className="font-bold text-[#09090b] uppercase tracking-wider text-[10px]">SIAKAD MINI v1</span>
          </div>
          <p className="text-center md:text-right">
            &copy; {new Date().getFullYear()} SIAKAD MINI. Built with Next.js 15, Supabase, &amp; shadcn/ui.
          </p>
        </div>
      </footer>
    </div>
  )
}
