"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/store/AuthContext";
import MobileShell from "@/components/mobile/MobileShell";

export default function InAppViewLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === "/in-app-view/login";

  React.useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace(`/in-app-view/login?from=${encodeURIComponent(pathname ?? "/in-app-view")}`);
    }
  }, [loading, user, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return <MobileShell>{children}</MobileShell>;
}
