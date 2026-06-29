import Sidebar from '@/components/shared/Sidebar'

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f5] flex flex-col lg:flex-row text-[#09090b]">
      <Sidebar role="dosen" />
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 w-full space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
