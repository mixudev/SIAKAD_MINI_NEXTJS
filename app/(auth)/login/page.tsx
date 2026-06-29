'use client'

import React, { useActionState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Landmark, Loader2 } from 'lucide-react'
import { loginAction } from '@/actions/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const initialState = { success: false, error: '', role: '', userId: '' }

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(loginAction, initialState)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (state.success && state.role) {
      toast.success('Login berhasil! Mengalihkan ke dashboard...')
      const dashboardRoutes: Record<string, string> = {
        admin: '/admin',
        dosen: '/dosen',
        mahasiswa: '/mahasiswa',
      }
      const redirect = dashboardRoutes[state.role] ?? '/'
      router.push(redirect)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] text-[#09090b] font-sans p-4 selection:bg-[#09090b] selection:text-[#ffffff]">
      <Card className="w-full max-w-md border border-[#ececee] bg-white shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] rounded-[36px]">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-[#09090b] text-white rounded-[40px] flex items-center justify-center">
              <Landmark className="size-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight uppercase">SIAKAD MINI</CardTitle>
          <CardDescription className="text-xs text-[#71717a]">
            Portal Informasi Akademik Kampus — Masuk ke sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => startTransition(() => formAction(formData))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-[#71717a] ml-1">
                Username / NIM / NIDN
              </Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="Masukkan NIM, NIDN atau Username"
                required
                disabled={isPending}
                className="bg-[#f4f4f5] border-transparent text-[#09090b] placeholder:text-[#a1a1aa] rounded-[14px] focus:bg-white focus:border-[#09090b] focus-visible:ring-0 focus-visible:ring-offset-0 h-11 px-4"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
                  Password
                </Label>
                <span className="text-xs text-[#71717a]">[ Hubungi Admin jika lupa ]</span>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="bg-[#f4f4f5] border-transparent text-[#09090b] placeholder:text-[#a1a1aa] rounded-[14px] focus:bg-white focus:border-[#09090b] focus-visible:ring-0 focus-visible:ring-offset-0 h-11 px-4"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#09090b] hover:bg-[#18181b] text-white rounded-[36px] text-sm font-semibold h-11 mt-4 shadow-[rgba(255,255,255,0.5)_0px_0.5px_0px_0px_inset,rgba(117,123,133,0.4)_0px_9px_14px_-5px_inset,rgb(44,46,52)_0px_0px_0px_1.5px,rgba(0,0,0,0.14)_0px_4px_6px_0px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                'Masuk ke Sistem'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 justify-center text-center pb-8 border-t border-[#ececee] pt-6 mt-4">
          <p className="text-[10px] text-[#71717a] max-w-[280px]">
            Akun dibuat oleh admin kampus. Mahasiswa baru didaftarkan saat orientasi.
          </p>
          <Link href="/" className="text-xs text-[#09090b] font-semibold hover:underline">
            [ Kembali ke Beranda ]
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
