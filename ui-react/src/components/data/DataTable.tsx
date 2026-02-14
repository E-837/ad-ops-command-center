import { useMemo } from 'react';
import type { ReactNode } from 'react';

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

type SortDirection = 'asc' | 'desc';

export type SortState<T> = {
  key: keyof T;
  direction: SortDirection;
};

type DataTableProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: Column<T>[];
  rowId?: (row: T, index: number) => string;
  sortState?: SortState<T>;
  onSort?: (next: SortState<T>) => void;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowId,
  sortState,
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: DataTableProps<T>) {
  const ids = useMemo(() => data.map((row, index) => (rowId ? rowId(row, index) : String(index))), [data, rowId]);
  const selected = selectedIds ?? [];
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <table className='w-full text-left'>
      <thead>
        <tr>
          {onToggleRow && onToggleAll ? (
            <th className='p-2 w-10'>
              <input
                type='checkbox'
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => onToggleAll(ids)}
              />
            </th>
          ) : null}
          {columns.map((column) => {
            const isSorted = sortState?.key === column.key;
            const arrow = isSorted ? (sortState?.direction === 'asc' ? ' ↑' : ' ↓') : '';
            const sortable = column.sortable !== false;
            return (
              <th key={String(column.key)} className='p-2 text-white/70'>
                {sortable && onSort ? (
                  <button
                    type='button'
                    className='hover:text-white'
                    onClick={() => {
                      const direction: SortDirection = isSorted && sortState?.direction === 'asc' ? 'desc' : 'asc';
                      onSort({ key: column.key, direction });
                    }}
                  >
                    {column.header}
                    {arrow}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const id = rowId ? rowId(row, index) : String(index);
          return (
            <tr key={id} className='border-t border-white/10'>
              {onToggleRow ? (
                <td className='p-2'>
                  <input type='checkbox' checked={selected.includes(id)} onChange={() => onToggleRow(id)} />
                </td>
              ) : null}
              {columns.map((column) => (
                <td key={String(column.key)} className='p-2'>
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
