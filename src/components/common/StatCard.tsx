import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SvgIconComponent } from "@mui/icons-material";

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "primary.main",
  helperText,
}: {
  label: string;
  value: string | number;
  icon: SvgIconComponent;
  color?: string;
  helperText?: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: color,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
