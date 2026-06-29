'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Loader2, Search, Ban, KeyRound } from 'lucide-react'
import { getAllUsersAction, updateUserRoleAction, toggleBanUserAction, resetUserPasswordAction, getUserDetailAction } from '@/actions/users'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userDetail, setUserDetail] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getAllUsersAction()
    if (res.success) setData(res.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = data.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole)
      if (res.success) {
        toast.success('Role berhasil diubah')
        loadData()
      } else {
        toast.error(res.error || 'Gagal mengubah role')
      }
    })
  }

  const handleBan = (userId: string, isBanned: boolean) => {
    startTransition(async () => {
      const res = await toggleBanUserAction(userId, !isBanned)
      if (res.success) {
        toast.success(isBanned ? 'User diaktifkan kembali' : 'User dinonaktifkan')
        loadData()
      } else {
        toast.error(res.error || 'Gagal')
      }
    })
  }

  const handleResetPassword = (userId: string) => {
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId, resetPassword)
      if (res.success) {
        toast.success('Password berhasil direset')
        setResetOpen(false)
        setResetPassword('')
      } else {
        toast.error(res.error || 'Gagal reset password')
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDetail = async (u: any) => {
    setSelectedUser(u)
    setDetailOpen(true)
    const res = await getUserDetailAction(u.id)
    if (res.success) setUserDetail(res.detail)
    else setUserDetail(null)
  }

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
        title="Manajemen User"
        description="Kelola semua akun pengguna sistem — ubah role, reset password, dan nonaktifkan akun."
      />

      <Card className="bg-white border border-[#ececee] rounded-[12px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px]">
        <CardHeader className="p-4 border-b border-[#ececee] flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#f4f4f5] rounded-[6px]">
              <Users className="size-4 text-[#09090b]" />
            </div>
            <CardTitle className="text-sm font-bold text-[#09090b]">Daftar User</CardTitle>
            <Badge variant="outline" className="ml-1 text-[10px] font-medium bg-[#f4f4f5] border-0">
              {data.length} user
            </Badge>
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#a1a1aa]" />
            <Input
              placeholder="Cari username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs rounded-[6px] border-[#d4d4d8]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f5]">
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Username</TableHead>
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Role</TableHead>
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase">Detail</TableHead>
                <TableHead className="text-[#71717a] text-[10px] font-semibold uppercase text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-xs text-[#a1a1aa]">
                    Tidak ada user ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <TableRow key={u.id} className="border-b border-[#ececee]">
                    <TableCell className="text-sm font-medium text-[#09090b]">{u.username}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-28 text-[11px] rounded-[6px] border-[#d4d4d8]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                          <SelectItem value="dosen" className="text-xs">Dosen</SelectItem>
                          <SelectItem value="mahasiswa" className="text-xs">Mahasiswa</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(u)}
                        className="h-7 text-[11px] font-medium text-[#71717a]"
                      >
                        Lihat Detail
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedUser(u); setResetOpen(true); setResetPassword('') }}
                          className="h-7 w-7 text-[#71717a] hover:text-[#09090b]"
                          title="Reset Password"
                        >
                          <KeyRound className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBan(u.id, u.banned || false)}
                          className={`h-7 w-7 ${u.banned ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}
                          title={u.banned ? 'Aktifkan kembali' : 'Nonaktifkan'}
                          disabled={isPending}
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#09090b]">
              Detail User: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          {userDetail ? (
            <div className="space-y-2 text-sm">
              {Object.entries(userDetail).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-[#ececee] last:border-0">
                  <span className="text-[#71717a] text-xs">{key}</span>
                  <span className="text-[#09090b] text-xs font-medium">{String(val || '—')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#a1a1aa] text-center py-4">Detail tidak tersedia</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#09090b]">
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-[#71717a]">
              Masukkan password baru untuk user <strong>{selectedUser?.username}</strong>
            </p>
            <Input
              type="password"
              placeholder="Password baru (min. 6 karakter)"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              className="text-sm rounded-[6px] border-[#d4d4d8]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => handleResetPassword(selectedUser?.id)}
                disabled={resetPassword.length < 6 || isPending}
                className="text-xs"
              >
                {isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
