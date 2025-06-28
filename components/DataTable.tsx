import React, { ReactNode } from 'react';

interface Column {
  key: string;
  header: ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  compact?: boolean;
}

/**
 * DataTable - A component for displaying tabular data consistently across the platform
 */
export default function DataTable({
  columns,
  data,
  renderRow,
  emptyState,
  isLoading = false,
  compact = false
}: DataTableProps) {
  
  const isEmpty = data.length === 0;
  
  return (
    <div className="data-table-container">
      <table className={`data-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                className="table-header"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="table-loading">
                <div className="loading-indicator">
                  <div className="loading-spinner"></div>
                  Loading data...
                </div>
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyState || 'No data available'}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>

      <style jsx>{`
        .data-table-container {
          width: 100%;
          overflow-x: auto;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-body);
        }
        
        .data-table.compact {
          font-size: var(--text-small);
        }
        
        .table-header {
          text-align: center;
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 2px solid var(--gray-200);
          color: var(--gray-600);
          font-weight: 500;
          white-space: nowrap;
        }
        
        .data-table td {
          text-align: center;
          vertical-align: middle;
          padding: var(--spacing-md) var(--spacing-lg);
        }
        
        tbody tr {
          border-bottom: 1px solid var(--gray-100);
        }
        
        tbody tr:last-child {
          border-bottom: none;
        }
        
        tbody tr:hover {
          background-color: var(--gray-50);
        }
        
        .table-loading,
        .table-empty {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--gray-600);
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--gray-200);
          border-top-color: var(--primary-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .data-table.compact .table-header,
        .data-table.compact td {
          padding: var(--spacing-sm) var(--spacing-md);
        }
      `}</style>
    </div>
  );
} 