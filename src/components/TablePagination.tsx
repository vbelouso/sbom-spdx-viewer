import { Stack, FormControl, InputLabel, Select, MenuItem, Pagination, Typography } from '@mui/material';
import type { Table } from '@tanstack/react-table';

export const PER_PAGE_OPTIONS = [10, 20, 50, 100, 200];

interface TablePaginationProps<T> {
  table: Table<T>;
  totalRowCount: number;
  entityName?: string;
}

export const TablePagination = <T extends object>({
  table,
  totalRowCount,
  entityName = 'items',
}: TablePaginationProps<T>) => {
  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Page {pageIndex + 1} of {table.getPageCount()} ({totalRowCount.toLocaleString()} matching {entityName})
      </Typography>
      <Stack direction="row" alignItems="center" spacing={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Rows per page</InputLabel>
          <Select value={pageSize} label="Rows per page" onChange={e => table.setPageSize(Number(e.target.value))}>
            {PER_PAGE_OPTIONS.map(size => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Pagination
          count={table.getPageCount()}
          page={pageIndex + 1}
          onChange={(_e, value) => table.setPageIndex(value - 1)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Stack>
    </Stack>
  );
};
