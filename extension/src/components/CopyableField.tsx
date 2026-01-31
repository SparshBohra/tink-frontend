import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '../lib/clipboard'

interface CopyableFieldProps {
  label: string
  value: string | null | undefined
  showToast: (message: string) => void
}

const CopyableField: React.FC<CopyableFieldProps> = ({ label, value, showToast }) => {
  const [copied, setCopied] = useState(false)
  
  if (!value) return null
  
  const handleCopy = async () => {
    const success = await copyToClipboard(value)
    if (success) {
      setCopied(true)
      showToast('Copied!')
      setTimeout(() => setCopied(false), 1500)
    }
  }
  
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <button
        onClick={handleCopy}
        className="w-full flex items-start justify-between gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-left group"
      >
        <span className="text-sm text-slate-700 flex-1 break-words">
          {value}
        </span>
        <span className="flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors mt-0.5">
          {copied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} />
          )}
        </span>
      </button>
    </div>
  )
}

export default CopyableField
