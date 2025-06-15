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
  Stack,
  Paper,
  TextField,
  FormControlLabel,
  Menu,
  Checkbox,
  Button,
  InputAdornment,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import { flexRender, type ColumnDef } from '@tanstack/react-table';

import type { Package } from '@app/types/spdx.d.ts';
import { useTableManager } from '@app/hooks/useTableManager';
import { TablePagination } from './TablePagination';

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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const columns = usePackageColumns();

    const { table } = useTableManager<Package>({
      data: packages,
      columns,
      initialState: {
        sorting: [{ id: 'name', desc: false }],
        columnVisibility: {
          downloadLocation: false,
          copyrightText: false,
          licenseConcluded: false,
          purl: false,
        },
      },
      state: { globalFilter },
      onGlobalFilterChange,
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

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
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
            <TablePagination
              table={table}
              totalRowCount={table.getFilteredRowModel().rows.length}
              entityName="packages"
            />
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      <TableCell sx={{ width: '1%' }} />
                      {headerGroup.headers.map(header => {
                        const sortDirection = header.column.getIsSorted();

                        return (
                          <TableCell key={header.id} sortDirection={sortDirection}>
                            {header.isPlaceholder ? null : (
                              <TableSortLabel
                                active={!!sortDirection}
                                direction={sortDirection || 'asc'}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </TableSortLabel>
                            )}
                          </TableCell>
                        );
                      })}
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
