'use client'

import React, { useState, useTransition } from 'react'
import { logoutAction } from '@/actions/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  Presentation, 
  Calendar, 
  CalendarRange,
  Building2,
  FileSpreadsheet, 
  CheckSquare, 
  GraduationCap, 
  LogOut,
  Landmark,
  Shield,
} from 'lucide-react'

type MenuItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type SidebarProps = {
  role: 'admin' | 'dosen' | 'mahasiswa'
}

const menuItemsByRole: Record<'admin' | 'dosen' | 'mahasiswa', MenuItem[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: Users },
    { title: 'Data Dosen', href: '/admin/dosen', icon: Users },
    { title: 'Semester', href: '/admin/semester', icon: CalendarRange },
    { title: 'Program Studi', href: '/admin/program-studi', icon: Building2 },
    { title: 'Mata Kuliah', href: '/admin/matkul', icon: BookOpen },
    { title: 'Kelas Kuliah', href: '/admin/kelas', icon: Presentation },
    { title: 'Jadwal Kuliah', href: '/admin/jadwal', icon: Calendar },
    { title: 'KRS Mahasiswa', href: '/admin/krs', icon: FileSpreadsheet },
    { title: 'Manajemen User', href: '/admin/users', icon: Shield },
    { title: 'Absensi', href: '/admin/absensi', icon: CheckSquare },
    { title: 'Penilaian', href: '/admin/penilaian', icon: GraduationCap },
  ],
  dosen: [
    { title: 'Dashboard', href: '/dosen', icon: LayoutDashboard },
    { title: 'Kelas Saya', href: '/dosen/kelas-saya', icon: Presentation },
    { title: 'Input Nilai', href: '/dosen/input-nilai', icon: GraduationCap },
    { title: 'Absensi Pertemuan', href: '/dosen/absensi', icon: CheckSquare },
    { title: 'KRS Bimbingan', href: '/dosen/krs-bimbingan', icon: UserCheck },
  ],
  mahasiswa: [
    { title: 'Dashboard', href: '/mahasiswa', icon: LayoutDashboard },
    { title: 'KRS Saya', href: '/mahasiswa/krs', icon: FileSpreadsheet },
    { title: 'Jadwal Kuliah', href: '/mahasiswa/jadwal', icon: Calendar },
    { title: 'KHS & Transkrip', href: '/mahasiswa/khs', icon: GraduationCap },
    { title: 'Absensi Saya', href: '/mahasiswa/absensi-saya', icon: CheckSquare },
  ],
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const menuItems = menuItemsByRole[role]

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between h-16 px-6 bg-[#09090b] text-white lg:hidden border-b border-[#18181b] w-full fixed top-0 left-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white text-[#09090b] rounded-[10000px] flex items-center justify-center">
            <Landmark className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-sm uppercase">SIAKAD MINI ({role})</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-white hover:bg-[#3f3f46]/50 rounded-[14px] size-9">
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-45 bg-[#09090b] text-[#fafafa] w-64 transform transition-transform duration-200 ease-in-out border-r border-[#18181b] flex flex-col pt-16 lg:pt-0 lg:translate-x-0 font-sans",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 px-6 h-16 border-b border-[#18181b]">
          <div className="p-2 bg-white text-[#09090b] rounded-[10000px] flex items-center justify-center">
            <Landmark className="size-4" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight leading-none">SIAKAD MINI</h1>
            <p className="text-[9px] text-[#a1a1aa] font-bold tracking-widest uppercase mt-1">{role} Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-[14px] text-xs font-semibold tracking-wider transition-colors",
                  isActive 
                    ? "bg-[#3f3f46]/50 text-white border border-[#3f3f46]/30" 
                    : "text-[#a1a1aa] hover:bg-[#3f3f46]/20 hover:text-white"
                )}
              >
                <Icon className="size-[18px] shrink-0 text-white/90" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#18181b]">
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}

// Isolated logout button component with loading state
function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors disabled:opacity-50"
    >
      <LogOut className="size-[18px] shrink-0" />
      <span>{isPending ? 'Keluar...' : 'Keluar Portal'}</span>
    </button>
  )
}

