import React from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { TicketPriority } from '../types'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter: TicketPriority | 'all'
  onPriorityChange: (priority: TicketPriority | 'all') => void
  sortField: 'created_at' | 'priority'
  sortDirection: 'asc' | 'desc'
  onSortChange: (field: 'created_at' | 'priority', direction: 'asc' | 'desc') => void
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  sortField,
  sortDirection,
  onSortChange
}) => {
  return (
    <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
      {/* Search */}
      <div className="flex-1 relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Priority Filter */}
      <div className="relative">
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority | 'all')}
          className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">All Priority</option>
          <option value="emergency">Emergency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      
      {/* Sort */}
      <div className="relative">
        <select
          value={`${sortField}-${sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split('-') as ['created_at' | 'priority', 'asc' | 'desc']
            onSortChange(field, direction)
          }}
          className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="created_at-desc">Newest</option>
          <option value="created_at-asc">Oldest</option>
          <option value="priority-desc">Priority ↓</option>
          <option value="priority-asc">Priority ↑</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

export default FilterBar
