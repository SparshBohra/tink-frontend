import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export default function CopyButton({ 
  text, 
  label = 'Text', 
  size = 'md',
  showLabel = false 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const iconSize = size === 'sm' ? 12 : 14
  
  return (
    <button
      onClick={handleCopy}
      className={`copy-button ${size} ${copied ? 'copied' : ''}`}
      title={copied ? 'Copied!' : `Copy ${label}`}
      type="button"
    >
      {copied ? (
        <>
          <Check size={iconSize} />
          {showLabel && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Copy size={iconSize} />
          {showLabel && <span>Copy</span>}
        </>
      )}
      
      <style jsx>{`
        .copy-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .copy-button:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #64748b;
        }

        .copy-button.copied {
          background: #d1fae5;
          border-color: #a7f3d0;
          color: #059669;
        }

        .copy-button.sm {
          padding: 4px 6px;
        }

        .copy-button span {
          margin-left: 2px;
        }

        /* Animation */
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .copy-button.copied :global(svg) {
          animation: pulse 0.3s ease;
        }
      `}</style>
    </button>
  )
}

// Standalone copy utility function for use outside the component
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}
