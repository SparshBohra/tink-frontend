import React from 'react'
import { 
  Snowflake, 
  Wrench, 
  Zap, 
  Plug, 
  Key, 
  Bug, 
  ClipboardList,
  Thermometer
} from 'lucide-react'
import { TicketCategory } from '../types'

interface CategoryIconProps {
  category: TicketCategory | null
  size?: number
  className?: string
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 16,
  className = ''
}) => {
  const getIcon = () => {
    if (!category) return <ClipboardList size={size} className={className} />
    
    const cat = category.toLowerCase()
    
    switch (cat) {
      case 'hvac':
      case 'heating':
        return <Snowflake size={size} className={`text-blue-500 ${className}`} />
      case 'cooling':
        return <Thermometer size={size} className={`text-cyan-500 ${className}`} />
      case 'plumbing':
        return <Wrench size={size} className={`text-slate-600 ${className}`} />
      case 'electrical':
        return <Zap size={size} className={`text-yellow-500 ${className}`} />
      case 'appliance':
        return <Plug size={size} className={`text-slate-500 ${className}`} />
      case 'access_control':
        return <Key size={size} className={`text-amber-600 ${className}`} />
      case 'pest':
        return <Bug size={size} className={`text-green-600 ${className}`} />
      default:
        return <ClipboardList size={size} className={className} />
    }
  }
  
  return getIcon()
}

export default CategoryIcon
