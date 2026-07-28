"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useAuth } from "@/store/AuthContext";

const TABS = [
  { label: "Home", value: "/in-app-view", icon: <HomeRoundedIcon /> },
  { label: "Trips", value: "/in-app-view/requisitions", icon: <AltRouteRoundedIcon /> },
  { label: "Vehicles", value: "/in-app-view/vehicles", icon: <LocalShippingRoundedIcon /> },
  { label: "Profile", value: "/in-app-view/profile", icon: <PersonRoundedIcon /> },
];

const TITLES: Record<string, string> = {
  "/in-app-view": "Fleet Management",
  "/in-app-view/requisitions": "Trip Requisitions",
  "/in-app-view/vehicles": "Vehicles",
  "/in-app-view/profile": "Profile",
};

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isStaff = user?.role !== "Driver";
  const tabs = isStaff ? TABS : TABS.filter((t) => t.value !== "/in-app-view/vehicles");

  const activeTab = TABS.find((t) => t.value === pathname)?.value ?? false;
  const isSubPage = !activeTab && pathname !== "/in-app-view/login";
  const title =
    TITLES[pathname ?? ""] ?? (pathname?.startsWith("/in-app-view/requisitions/") ? "Trip Details" : "Fleet Management");

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        maxWidth: 480,
        mx: "auto",
        overflow: "hidden",
        boxShadow: { xs: "none", sm: "0 0 40px rgba(27,42,74,0.12)" },
      }}
    >
      <AppBar position="static" color="primary" elevation={0} sx={{ flexShrink: 0 }}>
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          {isSubPage && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => router.back()}
              sx={{ mr: 1 }}
              size="small"
            >
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          p: 2,
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {children}
      </Box>

      <Paper elevation={8} sx={{ flexShrink: 0, zIndex: 10 }} square>
        <BottomNavigation
          showLabels
          value={activeTab}
          onChange={(_e, newValue) => router.push(newValue)}
        >
          {tabs.map((tab) => (
            <BottomNavigationAction key={tab.value} label={tab.label} value={tab.value} icon={tab.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
