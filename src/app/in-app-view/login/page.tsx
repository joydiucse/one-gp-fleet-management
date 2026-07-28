"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "@/store/AuthContext";

type LoginMode = "staff" | "driver";

const STAFF_DEMO_CREDENTIALS = [
  { role: "Fleet Administrator", email: "rezaul.karim@grameenphone.com", password: "Fleet@123" },
  { role: "Billing Administrator", email: "farhana.chowdhury@grameenphone.com", password: "Billing@123" },
  { role: "Finance", email: "nafisa.rahman@grameenphone.com", password: "Finance@123" },
  { role: "Approver", email: "shahriar.kabir@grameenphone.com", password: "Approve@123" },
  { role: "Read Only", email: "tasnia.ferdous@grameenphone.com", password: "ReadOnly@123" },
];

const DRIVER_DEMO_CREDENTIALS = [
  { role: "Md. Abdul Karim", mobile: "01711-223344" },
  { role: "Md. Shahidul Islam", mobile: "01812-334455" },
  { role: "Md. Rafiqul Alam", mobile: "01913-445566" },
  { role: "Md. Jahangir Alam", mobile: "01515-667788" },
  { role: "Md. Mizanur Rahman", mobile: "01716-778899" },
  { role: "Md. Shamsul Haque", mobile: "01817-889900" },
  { role: "Md. Delwar Hossain", mobile: "01619-001122" },
  { role: "Md. Fazlul Karim", mobile: "01720-112233" },
];

const fieldSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)" },
  "& .MuiOutlinedInput-input": { color: "#fff" },
};
const labelSlot = { inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } };

export default function MobileLoginPage() {
  const router = useRouter();
  const { login, loginAsDriver } = useAuth();
  const [mode, setMode] = React.useState<LoginMode>("driver");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [mobile, setMobile] = React.useState("");
  const [driverPassword, setDriverPassword] = React.useState("");
  const [showDriverPassword, setShowDriverPassword] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const goToDestination = () => {
    router.push("/in-app-view");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = mode === "staff" ? await login(email, password) : await loginAsDriver(mobile, driverPassword);
    setSubmitting(false);
    if (result.ok) {
      goToDestination();
    } else {
      setError(result.message ?? "Login failed.");
    }
  };

  const canSubmit = mode === "staff" ? !!email && !!password : !!mobile && !!driverPassword;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        maxWidth: 480,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "radial-gradient(120% 120% at 15% 0%, #16264a 0%, #0f1b33 45%, #0a1425 100%)",
        p: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 4, justifyContent: "center" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
          }}
        >
          <GpsFixedRoundedIcon sx={{ color: "#fff", fontSize: 26 }} />
        </Box>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, color: "#fff", textAlign: "center", mb: 0.5 }}>
        Fleet Management
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", textAlign: "center", mb: 3 }}>
        Sign in to continue
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        fullWidth
        onChange={(_e, value: LoginMode | null) => {
          if (value) {
            setMode(value);
            setError(null);
          }
        }}
        sx={{
          mb: 3,
          "& .MuiToggleButton-root": {
            color: "rgba(255,255,255,0.7)",
            borderColor: "rgba(255,255,255,0.15)",
            "&.Mui-selected": { color: "#fff", bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } },
          },
        }}
      >
        <ToggleButton value="staff">Staff Login</ToggleButton>
        <ToggleButton value="driver">Driver Login</ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {mode === "staff" ? (
            <>
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                slotProps={labelSlot}
                sx={fieldSx}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                slotProps={{
                  ...labelSlot,
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          size="small"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldSx}
              />
            </>
          ) : (
            <>
              <TextField
                label="Mobile Number"
                fullWidth
                autoFocus
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setError(null);
                }}
                placeholder="01711-223344"
                slotProps={labelSlot}
                sx={fieldSx}
              />
              <TextField
                label="Password"
                type={showDriverPassword ? "text" : "password"}
                fullWidth
                value={driverPassword}
                onChange={(e) => {
                  setDriverPassword(e.target.value);
                  setError(null);
                }}
                helperText="Your password is your mobile number."
                slotProps={{
                  ...labelSlot,
                  formHelperText: { sx: { color: "rgba(255,255,255,0.5)" } },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowDriverPassword((s) => !s)}
                          edge="end"
                          size="small"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {showDriverPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldSx}
              />
            </>
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting || !canSubmit}
            sx={{ py: 1.25, mt: 1 }}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 3, mb: 1 }}>
        <KeyRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }} />
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.3, color: "rgba(255,255,255,0.5)" }}>
          DEMO ACCOUNTS
        </Typography>
      </Box>

      {mode === "staff" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {STAFF_DEMO_CREDENTIALS.map((cred) => (
            <Tooltip key={cred.email} title={`${cred.email} · ${cred.password}`} arrow placement="top">
              <Chip
                size="small"
                label={cred.role}
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                  setError(null);
                }}
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "primary.main" },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
          {DRIVER_DEMO_CREDENTIALS.map((cred) => (
            <Box
              key={cred.mobile}
              onClick={() => {
                setMobile(cred.mobile);
                setDriverPassword(cred.mobile);
                setError(null);
              }}
              sx={{
                cursor: "pointer",
                borderRadius: 1.5,
                px: 1.25,
                py: 0.75,
                bgcolor: "rgba(255,255,255,0.08)",
                "&:hover": { bgcolor: "primary.main" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 600, color: "#fff", lineHeight: 1.4 }}
                noWrap
              >
                {cred.role}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}
              >
                {cred.mobile}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
