"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/store/AuthContext";

type LoginMode = "staff" | "driver";

const fieldSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)" },
  "& .MuiOutlinedInput-input": { color: "#fff" },
};
const labelSlot = { inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } };

export default function MobileLoginPage() {
  return (
    <Suspense fallback={null}>
      <MobileLoginForm />
    </Suspense>
  );
}

function MobileLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginAsDriver } = useAuth();
  const [mode, setMode] = React.useState<LoginMode>("staff");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [mobile, setMobile] = React.useState("");
  const [driverPassword, setDriverPassword] = React.useState("");
  const [showDriverPassword, setShowDriverPassword] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const goToDestination = () => {
    const from = searchParams.get("from");
    router.push(from && from.startsWith("/in-app-view") ? from : "/in-app-view");
    router.refresh();
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
    </Box>
  );
}
