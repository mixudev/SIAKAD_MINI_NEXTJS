import React from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-5 border-b border-[#ececee] font-sans">
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#09090b] uppercase">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[#71717a] leading-relaxed max-w-2xl font-medium">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
