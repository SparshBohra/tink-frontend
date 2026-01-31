import { TicketStatus, getStatusDisplayName, getStatusColor } from '../lib/supabase-types'

interface StatusBadgeProps {
  status: TicketStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = getStatusColor(status)

  const sizeStyles = {
    sm: { padding: '3px 8px', fontSize: '11px' },
    md: { padding: '5px 10px', fontSize: '12px' },
    lg: { padding: '6px 14px', fontSize: '13px' }
  }

  const styles = sizeStyles[size]

  return (
    <span 
      className="status-badge"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: styles.padding,
        fontSize: styles.fontSize
      }}
    >
      {getStatusDisplayName(status)}

      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          font-weight: 600;
          white-space: nowrap;
        }
      `}</style>
    </span>
  )
}
