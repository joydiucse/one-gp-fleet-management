import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const TOPBAR_HEIGHT = 64;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f9bd7",
      dark: "#0b7ca8",
      light: "#3fb2e6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1b2a4a",
    },
    background: {
      default: "#f2f4f7",
      paper: "#ffffff",
    },
    success: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    error: { main: "#d32f2f" },
    text: {
      primary: "#1b2a4a",
      secondary: "#5b6b85",
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 7,
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    fontSize: 13,
    h1: { fontWeight: 700, fontSize: "2.4rem" },
    h2: { fontWeight: 700, fontSize: "1.9rem" },
    h3: { fontWeight: 700, fontSize: "1.6rem" },
    h4: { fontWeight: 700, fontSize: "1.35rem" },
    h5: { fontWeight: 600, fontSize: "1.15rem" },
    h6: { fontWeight: 600, fontSize: "1rem" },
    subtitle1: { fontSize: "0.9rem" },
    subtitle2: { fontSize: "0.82rem" },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.7rem" },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.8125rem" },
  },
  components: {
    MuiButton: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiIconButton: {
      defaultProps: { size: "small" },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiFormControl: {
      defaultProps: { size: "small" },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiToggleButton: {
      defaultProps: { size: "small" },
    },
    MuiTable: {
      defaultProps: { size: "small" },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(27,42,74,0.08)",
          border: "1px solid rgba(27,42,74,0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: "0.8125rem" },
        head: {
          fontWeight: 700,
          backgroundColor: "#f8fafc",
          color: "#1b2a4a",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { fontSize: "0.8125rem" },
      },
    },
  },
});
