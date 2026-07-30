"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PageHeader from "@/components/common/PageHeader";
import { exportSimpleReportExcel, ReportExcelColumn } from "@/lib/reportExcel";

const ALL_VALUE = "__all__";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface FilterOption {
  id: string;
  label: string;
}

interface AppliedFilters {
  selectedIds: string[];
  billingMonth: string;
  monthLabel: string;
}

interface FilterableReportPageProps<Row extends { id: string | number }> {
  title: string;
  subtitle: string;
  filterLabel: string;
  filterOptions: FilterOption[];
  years: number[];
  loading?: boolean;
  computeRows: (selectedIds: string[], billingMonth: string) => Row[];
  columns: GridColDef[];
  excelColumns?: ReportExcelColumn[];
  exportFileNamePrefix: string;
}

export default function FilterableReportPage<Row extends { id: string | number }>({
  title,
  subtitle,
  filterLabel,
  filterOptions,
  years,
  loading,
  computeRows,
  columns,
  excelColumns,
  exportFileNamePrefix,
}: FilterableReportPageProps<Row>) {
  const now = React.useMemo(() => new Date(), []);
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [appliedFilters, setAppliedFilters] = React.useState<AppliedFilters | null>(null);

  const billingMonth = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  React.useEffect(() => {
    if (filterOptions.length > 0 && selectedIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- default the filter to "all" once options arrive from the API
      setSelectedIds(filterOptions.map((o) => o.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed selection once options arrive
  }, [filterOptions]);

  const rows = React.useMemo(
    () => (appliedFilters ? computeRows(appliedFilters.selectedIds, appliedFilters.billingMonth) : []),
    [appliedFilters, computeRows]
  );

  const handleFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const next = typeof value === "string" ? value.split(",") : value;
    if (next.includes(ALL_VALUE)) {
      setSelectedIds(selectedIds.length === filterOptions.length ? [] : filterOptions.map((o) => o.id));
      return;
    }
    setSelectedIds(next);
  };

  const handleSearch = () => {
    setAppliedFilters({ selectedIds, billingMonth, monthLabel });
  };

  const handleExport = async () => {
    if (!appliedFilters || rows.length === 0) {
      setToast("Run a search first to load the report before exporting.");
      return;
    }
    setExporting(true);
    try {
      const cols: ReportExcelColumn[] =
        excelColumns ??
        columns.map((c) => ({ field: c.field, headerName: typeof c.headerName === "string" ? c.headerName : c.field }));
      await exportSimpleReportExcel(
        rows as unknown as Record<string, unknown>[],
        cols,
        title,
        appliedFilters.monthLabel,
        exportFileNamePrefix
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: title }]}
        action={
          <Button variant="contained" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="report-filter-label">{filterLabel}</InputLabel>
              <Select
                labelId="report-filter-label"
                label={filterLabel}
                multiple
                value={selectedIds}
                onChange={handleFilterChange}
                renderValue={(selected) =>
                  selected.length === filterOptions.length
                    ? `All ${filterLabel}s`
                    : `${selected.length} selected`
                }
              >
                <MenuItem value={ALL_VALUE}>
                  <Checkbox
                    checked={filterOptions.length > 0 && selectedIds.length === filterOptions.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filterOptions.length}
                  />
                  <ListItemText primary="Select All" />
                </MenuItem>
                {filterOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    <Checkbox checked={selectedIds.indexOf(o.id) > -1} />
                    <ListItemText primary={o.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 3.5 }}>
            <TextField select fullWidth size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, idx) => (
                <MenuItem key={m} value={idx + 1}>{m}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField select fullWidth size="small" label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 1 }}>
            <Button variant="contained" fullWidth startIcon={<SearchRoundedIcon />} onClick={handleSearch} sx={{ height: 40 }}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {appliedFilters ? (
        <Card>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: "none" }}
          />
        </Card>
      ) : (
        <Card sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Select {filterLabel.toLowerCase()}(s), month and year, then click Search to generate the report.
        </Card>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity="warning" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
