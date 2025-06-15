import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ExpandedState,
  type PaginationState,
} from '@tanstack/react-table';

interface UseTableManagerProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  manualPagination?: boolean;
  rowCount?: number;
  initialState?: {
    sorting?: SortingState;
    pagination?: PaginationState;
    columnVisibility?: VisibilityState;
  };
  state?: {
    globalFilter?: string;
  };
  onGlobalFilterChange?: (filter: string) => void;
}

export function useTableManager<T extends object>({
  data,
  columns,
  manualPagination = false,
  rowCount,
  initialState = {},
  state: externalState = {},
  onGlobalFilterChange,
}: UseTableManagerProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>(
    initialState.pagination ?? { pageIndex: 0, pageSize: 20 }
  );
  const [sorting, setSorting] = useState<SortingState>(initialState.sorting ?? []);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialState.columnVisibility ?? {});

  const paginatedData = useMemo(() => {
    if (!manualPagination) return data;
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }, [manualPagination, data, pagination]);

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination,
    pageCount: manualPagination ? Math.ceil((rowCount ?? 0) / pagination.pageSize) : -1,
    state: {
      pagination,
      sorting,
      expanded,
      columnVisibility,
      ...externalState,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange,
    getRowCanExpand: () => true,
    globalFilterFn: 'includesString',
  });

  return { table };
}
