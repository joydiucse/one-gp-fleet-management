"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import { useAuth } from "@/store/AuthContext";

const SAMPLE_CREDENTIALS = [
  { role: "Fleet Administrator", email: "rezaul.karim@grameenphone.com", password: "Fleet@123" },
  { role: "Billing Administrator", email: "farhana.chowdhury@grameenphone.com", password: "Billing@123" },
  { role: "Finance", email: "nafisa.rahman@grameenphone.com", password: "Finance@123" },
  { role: "Approver", email: "shahriar.kabir@grameenphone.com", password: "Approve@123" },
  { role: "Read Only", email: "tasnia.ferdous@grameenphone.com", password: "ReadOnly@123" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.message ?? "Login failed.");
    }
  };

  const applySample = (sampleEmail: string, samplePassword: string) => {
    setEmail(sampleEmail);
    setPassword(samplePassword);
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(120% 120% at 15% 0%, #16264a 0%, #0f1b33 45%, #0a1425 100%)",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <GpsFixedRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Project Simplex
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Automated Fleet Billing System
              </Typography>
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Use your Fleet Management System credentials to continue.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || !email || !password}
                sx={{ py: 1.25 }}
              >
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              Sample Credentials (demo)
            </Typography>
          </Divider>

          <Stack spacing={0.75}>
            {SAMPLE_CREDENTIALS.map((cred) => (
              <Box
                key={cred.email}
                onClick={() => applySample(cred.email, cred.password)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "background-color 0.15s, border-color 0.15s",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Chip
                  size="small"
                  label={cred.role}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, flexShrink: 0 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                  title={`${cred.email} / ${cred.password}`}
                >
                  {cred.email}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
