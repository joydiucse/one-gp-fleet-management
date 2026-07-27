"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import PageHeader from "@/components/common/PageHeader";

interface ReportPageLayoutProps {
  title: string;
  subtitle: string;
  rows: object[];
  columns: GridColDef[];
  loading?: boolean;
}

export default function ReportPageLayout({ title, subtitle, rows, columns, loading }: ReportPageLayoutProps) {
  const [toast, setToast] = React.useState<string | null>(null);

  const exportFile = (format: string) => setToast(`${title} exported as ${format}.`);

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: title }]}
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<FileDownloadRoundedIcon />} onClick={() => exportFile("Excel")}>
              Export Excel
            </Button>
            <Button startIcon={<PictureAsPdfRoundedIcon />} onClick={() => exportFile("PDF")}>
              Export PDF
            </Button>
          </Stack>
        }
      />

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

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
