import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Collapse,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Paper,
  TextField,
  FormControlLabel,
  Menu,
  Checkbox,
  Button,
  Typography,
  InputAdornment,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ExpandedState,
} from '@tanstack/react-table';
import type { Package } from '../types/spdx.d.ts';

const PER_PAGE_OPTIONS = [10, 20, 50, 100, 200];

const usePackageColumns = (): ColumnDef<Package>[] =>
  useMemo(
    () => [
      { header: 'Name', accessorKey: 'name', enableHiding: false },
      { header: 'Version', accessorKey: 'versionInfo' },
      { header: 'Download Location', accessorKey: 'downloadLocation' },
      { header: 'Copyright', accessorKey: 'copyrightText' },
      { header: 'License Concluded', accessorKey: 'licenseConcluded' },
      {
        header: 'PURL',
        id: 'purl',
        accessorFn: row =>
          row.externalRefs?.find(r => r.referenceCategory === 'PACKAGE_MANAGER')?.referenceLocator || 'N/A',
      },
    ],
    []
  );

interface PackageListProps {
  packages: Package[];
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  onLoadNewFile: () => void;
  packageTypeFilter: string;
  onPackageTypeFilterChange: (type: string) => void;
  availablePackageTypes: string[];
}

export const PackageList: React.FC<PackageListProps> = React.memo(
  ({
    packages,
    globalFilter,
    onGlobalFilterChange,
    onLoadNewFile,
    packageTypeFilter,
    onPackageTypeFilterChange,
    availablePackageTypes,
  }) => {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
      downloadLocation: false,
      copyrightText: false,
      licenseConcluded: false,
      purl: false,
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const columns = usePackageColumns();

    const table = useReactTable({
      data: packages,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getRowCanExpand: () => true,
      state: {
        pagination,
        expanded,
        sorting,
        globalFilter,
        columnVisibility,
      },
      onPaginationChange: setPagination,
      onExpandedChange: setExpanded,
      onSortingChange: setSorting,
      onGlobalFilterChange: onGlobalFilterChange,
      onColumnVisibilityChange: setColumnVisibility,
      globalFilterFn: 'includesString',
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    return (
      <>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Global search ..."
              value={globalFilter}
              onChange={e => onGlobalFilterChange(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 300 }}
              InputProps={{
                endAdornment: globalFilter ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => onGlobalFilterChange('')} edge="end" size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Package Type</InputLabel>
                <Select
                  value={packageTypeFilter}
                  label="Package Type"
                  onChange={e => onPackageTypeFilterChange(e.target.value)}
                >
                  <MenuItem value="ALL">
                    <em>All Packages</em>
                  </MenuItem>
                  {availablePackageTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="outlined" startIcon={<ViewColumnIcon />} onClick={handleMenuOpen}>
                Columns
              </Button>
              <Button variant="contained" startIcon={<UploadFileIcon />} onClick={onLoadNewFile} color="secondary">
                New SBOM
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          {table.getAllLeafColumns().map(column => (
            <MenuItem key={column.id}>
              <FormControlLabel
                label={column.id}
                control={
                  <Checkbox
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                }
              />
            </MenuItem>
          ))}
        </Menu>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
                {table.getFilteredRowModel().rows.length.toLocaleString()} matching packages)
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Rows per page</InputLabel>
                  <Select
                    value={table.getState().pagination.pageSize}
                    label="Rows per page"
                    onChange={e => table.setPageSize(Number(e.target.value))}
                  >
                    {PER_PAGE_OPTIONS.map(pageSize => (
                      <MenuItem key={pageSize} value={pageSize}>
                        {pageSize}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Pagination
                  count={table.getPageCount()}
                  page={table.getState().pagination.pageIndex + 1}
                  onChange={(_e, value) => table.setPageIndex(value - 1)}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Stack>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      <TableCell sx={{ width: '1%' }} />
                      {headerGroup.headers.map(header => (
                        <TableCell
                          key={header.id}
                          sortDirection={header.column.getIsSorted() ? header.column.getIsSorted() : false}
                        >
                          {header.isPlaceholder ? null : (
                            <TableSortLabel
                              active={!!header.column.getIsSorted()}
                              direction={header.column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableSortLabel>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map(row => (
                    <React.Fragment key={row.id}>
                      <TableRow hover sx={{ cursor: 'pointer' }} onClick={row.getToggleExpandedHandler()}>
                        <TableCell>
                          <IconButton size="small">
                            {row.getIsExpanded() ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ padding: 0, border: 0 }} colSpan={row.getVisibleCells().length + 1}>
                          <Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
                            <Box
                              component="pre"
                              sx={{ m: 0, p: 2, bgcolor: 'action.hover', fontSize: '0.8rem', overflowX: 'auto' }}
                            >
                              {JSON.stringify(row.original, null, 2)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </>
    );
  }
);
