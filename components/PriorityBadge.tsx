import { AlertTriangle } from 'lucide-react'
import { TicketPriority, getPriorityDisplayName, getPriorityColor } from '../lib/supabase-types'

interface PriorityBadgeProps {
  priority: TicketPriority
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PriorityBadge({ 
  priority, 
  showIcon = true,
  size = 'md' 
}: PriorityBadgeProps) {
  const colors = getPriorityColor(priority)
  const isEmergency = priority === 'emergency'

  const sizeStyles = {
    sm: { padding: '3px 8px', fontSize: '11px', iconSize: 10 },
    md: { padding: '5px 10px', fontSize: '12px', iconSize: 12 },
    lg: { padding: '6px 14px', fontSize: '13px', iconSize: 14 }
  }

  const styles = sizeStyles[size]

  return (
    <span 
      className={`priority-badge ${priority} ${isEmergency ? 'emergency' : ''}`}
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: styles.padding,
        fontSize: styles.fontSize
      }}
    >
      {showIcon && isEmergency && <AlertTriangle size={styles.iconSize} />}
      {getPriorityDisplayName(priority)}

      <style jsx>{`
        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 6px;
          font-weight: 600;
          white-space: nowrap;
        }

        .priority-badge.emergency {
          animation: emergencyPulse 2s infinite;
        }

        @keyframes emergencyPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </span>
  )
}
