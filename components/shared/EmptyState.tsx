import React from 'react'
import { FileQuestion } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-[#ececee] bg-white rounded-[36px] shadow-[rgba(0,0,0,0.04)_0px_4px_12px_0px] font-sans">
      <div className="p-4 bg-[#f4f4f5] text-[#71717a] rounded-[40px] mb-4">
        <FileQuestion className="size-8" />
      </div>
      <h3 className="text-base font-bold text-[#09090b] uppercase mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#71717a] max-w-sm mb-6 leading-relaxed font-medium">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}
