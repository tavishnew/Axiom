'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  columnWidths?: string[];
}

export function TableSkeleton({ columns = 6, rows = 5, columnWidths }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className={`px-4 py-3 ${columnWidths?.[i] || ''}`}>
                <Skeleton className="h-4 w-3/4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="transition-colors hover:bg-surface-2/50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className={`px-4 py-3 ${columnWidths?.[colIndex] || ''}`}>
                  <Skeleton className="h-4 w-3/4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EntityTableSkeleton() {
  return (
    <TableSkeleton
      columns={6}
      rows={5}
      columnWidths={['', '', 'hidden md:table-cell', 'hidden md:table-cell', 'hidden md:table-cell', '']}
    />
  );
}

export function PolicyTableSkeleton() {
  return (
    <TableSkeleton
      columns={8}
      rows={5}
      columnWidths={['', '', 'hidden md:table-cell', '', 'hidden md:table-cell', 'hidden md:table-cell', 'hidden md:table-cell', '']}
    />
  );
}

export function ResourceTableSkeleton() {
  return (
    <TableSkeleton
      columns={5}
      rows={5}
      columnWidths={['', '', 'hidden md:table-cell', 'hidden md:table-cell', '']}
    />
  );
}

export function DecisionTableSkeleton() {
  return (
    <TableSkeleton
      columns={7}
      rows={5}
      columnWidths={['', '', 'hidden md:table-cell', 'hidden md:table-cell', '', 'hidden lg:table-cell', '']}
    />
  );
}