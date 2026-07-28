import Chip from "@mui/material/Chip";

const colorMap: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  Active: "success",
  Completed: "success",
  Approved: "success",
  Paid: "success",
  Inactive: "default",
  Maintenance: "warning",
  "In Progress": "info",
  Started: "warning",
  "Pending Approval": "warning",
  Draft: "default",
  Suspended: "error",
  Cancelled: "error",
  Rejected: "error",
};

export default function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={colorMap[status] ?? "default"}
      variant={colorMap[status] ? "filled" : "outlined"}
    />
  );
}
