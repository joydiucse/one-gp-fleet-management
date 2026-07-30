"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import IconButton from "@mui/material/IconButton";
import { navItems } from "./navConfig";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "@/theme/theme";
import { useAuth } from "@/store/AuthContext";

const iconMap: Record<string, React.ReactElement> = {
  dashboard: <DashboardRoundedIcon fontSize="small" />,
  master: <DirectionsCarFilledRoundedIcon fontSize="small" />,
  trip: <AssignmentRoundedIcon fontSize="small" />,
  billing: <ReceiptLongRoundedIcon fontSize="small" />,
  reports: <BarChartRoundedIcon fontSize="small" />,
  audit: <FactCheckRoundedIcon fontSize="small" />,
  admin: <AdminPanelSettingsRoundedIcon fontSize="small" />,
};

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    "Master Data": true,
  });

  const toggleGroup = (label: string) =>
    setOpenGroups((s) => ({ ...s, [label]: !s[label] }));

  const isActive = (href?: string) => !!href && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const canAccess = (permissionKey?: string) => !permissionKey || !!user?.permissions?.includes(permissionKey);

  const visibleNavItems = navItems
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((c) => canAccess(c.permissionKey));
        return children.length ? { ...item, children } : null;
      }
      return canAccess(item.permissionKey) ? item : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#16213a",
        color: "#c9d3e6",
      }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: 2,
          gap: 1,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
            <GpsFixedRoundedIcon sx={{ color: "#0f9bd7" }} />
            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>
              Fleet Management
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{ color: "#c9d3e6", display: { xs: "none", md: "inline-flex" } }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <List
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 0.5,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(255,255,255,0.25)",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
        {visibleNavItems.map((item) => {
          if (item.children) {
            const open = openGroups[item.label] && !collapsed;
            const groupActive = item.children.some((c) => isActive(c.href));
            return (
              <Box key={item.label}>
                <Tooltip title={collapsed ? item.label : ""} placement="right">
                  <ListItemButton
                    onClick={() => (collapsed ? undefined : toggleGroup(item.label))}
                    sx={{
                      mx: 1,
                      py: 0.5,
                      minHeight: 36,
                      borderRadius: 1.5,
                      color: groupActive ? "#fff" : "#c9d3e6",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                      {iconMap[item.iconKey]}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />}
                    {!collapsed && (open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
                  </ListItemButton>
                </Tooltip>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.href}
                        component={Link}
                        href={child.href}
                        onClick={onMobileClose}
                        selected={isActive(child.href)}
                        sx={{
                          mx: 1,
                          py: 0.375,
                          pl: 4.5,
                          minHeight: 32,
                          borderRadius: 1.5,
                          color: isActive(child.href) ? "#fff" : "#a7b3ca",
                          "&.Mui-selected": {
                            bgcolor: "#0f9bd7",
                            color: "#fff",
                            "&:hover": { bgcolor: "#0f9bd7" },
                          },
                          "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                      >
                        <ListItemText
                          primary={child.label}
                          slotProps={{ primary: { sx: { fontSize: 13 } } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const active = isActive(item.href);
          return (
            <Tooltip key={item.label} title={collapsed ? item.label : ""} placement="right">
              <ListItemButton
                component={Link}
                href={item.href!}
                onClick={onMobileClose}
                selected={active}
                sx={{
                  mx: 1,
                  mb: 0.25,
                  py: 0.5,
                  minHeight: 36,
                  borderRadius: 1.5,
                  color: active ? "#fff" : "#c9d3e6",
                  "&.Mui-selected": {
                    bgcolor: "#0f9bd7",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0f9bd7" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                  {iconMap[item.iconKey]}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {!collapsed && (
        <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography variant="caption" sx={{ color: "#7c88a3" }}>
            Powered by Nex Secure
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          "& .MuiDrawer-paper": {
            width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
            boxSizing: "border-box",
            border: "none",
            overflowX: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box", border: "none" },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
