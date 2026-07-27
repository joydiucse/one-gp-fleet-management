import { createTheme } from "@mui/material/styles";

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
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
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
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "#f8fafc",
          color: "#1b2a4a",
        },
      },
    },
  },
});
