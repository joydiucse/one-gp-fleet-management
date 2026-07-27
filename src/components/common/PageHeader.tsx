import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "next/link";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
      }}
    >
      <Box>
        {breadcrumbs && (
          <Breadcrumbs sx={{ mb: 0.5 }}>
            {breadcrumbs.map((b) =>
              b.href ? (
                <Link key={b.label} href={b.href} style={{ color: "inherit" }}>
                  <Typography variant="body2" color="text.secondary">
                    {b.label}
                  </Typography>
                </Link>
              ) : (
                <Typography key={b.label} variant="body2" color="text.secondary">
                  {b.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
