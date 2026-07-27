"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "./navConfig";
import { useAuth } from "@/store/AuthContext";

function pageTitle(pathname: string): string {
  for (const item of navItems) {
    if (item.href && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) {
      return item.label;
    }
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.href)) return child.label;
      }
    }
  }
  return "Dashboard";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter((p) => p && p !== "Md." && p !== "Md")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    router.push("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid rgba(27,42,74,0.08)",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {pageTitle(pathname)}
        </Typography>

        <IconButton>
          <Badge badgeContent={3} color="error">
            <NotificationsRoundedIcon />
          </Badge>
        </IconButton>
        <IconButton sx={{ display: { xs: "none", sm: "inline-flex" } }}>
          <AppsRoundedIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1, cursor: "pointer" }} onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            {user ? initials(user.name) : "?"}
          </Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {user?.name ?? "Guest"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role ?? ""}
            </Typography>
          </Box>
        </Box>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
