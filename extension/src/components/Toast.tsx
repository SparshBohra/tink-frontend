import React from 'react'
import { Check } from 'lucide-react'

interface ToastProps {
  message: string
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-enter">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg">
        <Check size={16} className="text-green-400" />
        {message}
      </div>
    </div>
  )
}

export default Toast
