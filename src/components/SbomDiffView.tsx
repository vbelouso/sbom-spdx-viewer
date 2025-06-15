import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  TableSortLabel,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import type { SbomDiff } from '@app/hooks/useSbomDiff';
import type { Package } from '@app/types/spdx';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

type ChangeStatus = 'Added' | 'Removed' | 'Modified';
type ChangeItem = {
  status: ChangeStatus;
  name: string;
  oldVersion?: string;
  newVersion?: string;
  changeSummary?: string;
  rawData: { old?: Package; new?: Package };
};

interface DiffCardProps {
  title: string;
  count: number;
  icon: React.ReactElement;
  color: 'success' | 'error' | 'warning';
}

const DiffCard: React.FC<DiffCardProps> = ({ title, count, icon, color }) => (
  <Card>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip icon={icon} label={title} color={color} size="small" />
        <Typography variant="h4">{count.toLocaleString()}</Typography>
      </Stack>
    </CardContent>
  </Card>
);
const PER_PAGE_OPTIONS = [20, 50, 100];

export const SbomDiffView: React.FC<{ diff: SbomDiff }> = ({ diff }) => {
  if (!diff || !diff.summary || !diff.packages) {
    return <Alert severity="warning">Diff data is incomplete or still loading. Cannot render view.</Alert>;
  }

  const { summary, packages } = diff;
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const allChanges = useMemo((): ChangeItem[] => {
    const added: ChangeItem[] = packages.added.map(p => ({
      status: 'Added',
      name: p.name,
      newVersion: p.versionInfo,
      rawData: { new: p },
    }));
    const removed: ChangeItem[] = packages.removed.map(p => ({
      status: 'Removed',
      name: p.name,
      oldVersion: p.versionInfo,
      rawData: { old: p },
    }));
    const modified: ChangeItem[] = packages.modified.map(m => ({
      status: 'Modified',
      name: m.new.name,
      oldVersion: m.old.versionInfo,
      newVersion: m.new.versionInfo,
      changeSummary: m.changeSummary,
      rawData: { old: m.old, new: m.new },
    }));
    return [...added, ...removed, ...modified];
  }, [packages]);

  const columns = useMemo<ColumnDef<ChangeItem>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <IconButton size="small" onClick={row.getToggleExpandedHandler()}>
            {row.getIsExpanded() ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        ),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => {
          const s = info.getValue() as ChangeStatus;
          return (
            <Chip label={s} color={s === 'Added' ? 'success' : s === 'Removed' ? 'error' : 'warning'} size="small" />
          );
        },
      },
      { header: 'Package Name', accessorKey: 'name' },
      { header: 'Change', accessorKey: 'changeSummary', cell: info => info.getValue() || '—' },
      { header: 'Old Version', accessorKey: 'oldVersion', cell: info => info.getValue() || '—' },
      { header: 'New Version', accessorKey: 'newVersion', cell: info => info.getValue() || '—' },
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return allChanges;
    return allChanges.filter(change => change.status === statusFilter);
  }, [allChanges, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DiffCard title="Added OCI" count={summary.added} icon={<AddCircleIcon />} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DiffCard title="Removed OCI" count={summary.removed} icon={<RemoveCircleIcon />} color="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DiffCard title="Modified OCI" count={summary.modified} icon={<ChangeHistoryIcon />} color="warning" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={`Search ${filteredData.length} OCI package changes...`}
            sx={{ flexGrow: 1 }}
            InputProps={{
              endAdornment: globalFilter ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setGlobalFilter('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_e, val) => {
              if (val) setStatusFilter(val);
            }}
            size="small"
            aria-label="Filter by change status"
          >
            <ToggleButton value="all">All ({allChanges.length})</ToggleButton>
            <ToggleButton value="Added">Added ({summary.added})</ToggleButton>
            <ToggleButton value="Modified">Modified ({summary.modified})</ToggleButton>
            <ToggleButton value="Removed">Removed ({summary.removed})</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableCell key={h.id} sx={{ width: h.getSize() }}>
                      {h.isPlaceholder ? null : (
                        <TableSortLabel
                          active={h.column.getIsSorted() !== false}
                          direction={h.column.getIsSorted() || 'asc'}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </TableSortLabel>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <React.Fragment key={`${row.id}-${row.original.name}`}>
                  <TableRow hover>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} sx={{ p: 0, border: 0 }}>
                        <Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1, bgcolor: 'action.hover' }}>
                            <Box
                              component="pre"
                              sx={{ m: 0, p: 2, overflowX: 'auto', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}
                            >
                              {JSON.stringify(
                                row.original.status === 'Added' ? row.original.rawData.new : row.original.rawData.old,
                                null,
                                2
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
            {table.getFilteredRowModel().rows.length} total rows)
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rows per page</InputLabel>
              <Select
                value={table.getState().pagination.pageSize}
                label="Rows per page"
                onChange={e => table.setPageSize(Number(e.target.value))}
              >
                {PER_PAGE_OPTIONS.map(ps => (
                  <MenuItem key={ps} value={ps}>
                    {ps}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Pagination
              count={table.getPageCount()}
              page={table.getState().pagination.pageIndex + 1}
              onChange={(_e, v) => table.setPageIndex(v - 1)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
