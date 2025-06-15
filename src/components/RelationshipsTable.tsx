import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { flexRender, type ColumnDef } from '@tanstack/react-table';

import type { Relationship } from '@app/types/spdx.d';
import { useTableManager } from '@app/hooks/useTableManager';
import { TablePagination } from './TablePagination';

const useRelationshipColumns = (): ColumnDef<Relationship>[] =>
  useMemo(
    () => [
      { header: 'SPDX Element ID', accessorKey: 'spdxElementId' },
      { header: 'Related SPDX Element', accessorKey: 'relatedSpdxElement' },
      { header: 'Relationship Type', accessorKey: 'relationshipType' },
    ],
    []
  );

interface RelationshipsTableProps {
  relationships: Relationship[];
  totalRelationshipCount: number;
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  relationshipTypeFilter: string;
  onRelationshipTypeFilterChange: (type: string) => void;
  availableRelationshipTypes: string[];
}

export const RelationshipsTable: React.FC<RelationshipsTableProps> = React.memo(
  ({
    relationships,
    totalRelationshipCount,
    globalFilter,
    onGlobalFilterChange,
    relationshipTypeFilter,
    onRelationshipTypeFilterChange,
    availableRelationshipTypes,
  }) => {
    const columns = useRelationshipColumns();

    const { table } = useTableManager<Relationship>({
      data: relationships,
      columns,
      manualPagination: true,
      rowCount: totalRelationshipCount,
      initialState: {
        sorting: [{ id: 'spdxElementId', desc: false }],
      },
    });

    return (
      <>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={2}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Global search..."
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
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={relationshipTypeFilter}
                label="Filter by Type"
                onChange={e => onRelationshipTypeFilterChange(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {availableRelationshipTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>
        <Card>
          <CardContent>
            <TablePagination table={table} totalRowCount={totalRelationshipCount} entityName="relationships" />
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        const sortDirection = header.column.getIsSorted();

                        return (
                          <TableCell key={header.id} sortDirection={sortDirection}>
                            <TableSortLabel
                              active={!!sortDirection}
                              direction={sortDirection || 'asc'}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableSortLabel>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
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
