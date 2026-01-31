import React from 'react'
import { 
  Snowflake, 
  Thermometer, 
  Wrench, 
  Zap, 
  Plug, 
  Key, 
  Bug, 
  ClipboardList,
  LucideIcon
} from 'lucide-react'
import { TicketCategory, getCategoryDisplayName } from '../lib/supabase-types'

interface CategoryIconProps {
  category: TicketCategory | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const getCategoryLucideIcon = (category: TicketCategory | null): LucideIcon => {
  if (!category) return ClipboardList
  
  const icons: Record<string, LucideIcon> = {
    hvac: Snowflake,
    heating: Thermometer,
    cooling: Snowflake,
    plumbing: Wrench,
    electrical: Zap,
    appliance: Plug,
    access_control: Key,
    pest: Bug,
    general: ClipboardList
  }
  return icons[category.toLowerCase()] || ClipboardList
}

// Category-specific background colors
const getCategoryColor = (cat: TicketCategory | null): string => {
  if (!cat) return '#64748b'
  
  const colors: Record<string, string> = {
    hvac: '#3b82f6',
    heating: '#ef4444',
    cooling: '#06b6d4',
    plumbing: '#6366f1',
    electrical: '#f59e0b',
    appliance: '#8b5cf6',
    access_control: '#eab308',
    pest: '#dc2626',
    general: '#64748b'
  }
  
  return colors[cat.toLowerCase()] || colors.general
}

export default function CategoryIcon({ 
  category, 
  showLabel = true,
  size = 'md' 
}: CategoryIconProps) {
  const IconComponent = getCategoryLucideIcon(category)
  const label = getCategoryDisplayName(category)
  const bgColor = getCategoryColor(category)

  const sizeStyles = {
    sm: { iconSize: 12, fontSize: 10, height: 24, padding: '0 10px', gap: 4 },
    md: { iconSize: 14, fontSize: 11, height: 28, padding: '0 12px', gap: 5 },
    lg: { iconSize: 16, fontSize: 12, height: 32, padding: '0 14px', gap: 6 }
  }

  const styles = sizeStyles[size]

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${styles.gap}px`,
        background: bgColor,
        color: 'white',
        padding: styles.padding,
        height: `${styles.height}px`,
        borderRadius: '6px',
        fontSize: `${styles.fontSize}px`,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap'
      }}
    >
      <IconComponent size={styles.iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}

// Export for inline icon usage
export { getCategoryLucideIcon }
