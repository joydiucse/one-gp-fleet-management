import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/types";
import { formatBDT } from "./billing";

export function downloadInvoicePdf(invoice: Invoice): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Fleet Management — Invoice", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 26);
  doc.text(`Status: ${invoice.status}`, 14, 32);

  doc.setTextColor(0);
  autoTable(doc, {
    startY: 40,
    theme: "plain",
    styles: { fontSize: 10 },
    body: [
      ["Vehicle Number", invoice.vehicleNumber],
      ["Vehicle Category", invoice.vehicleCategory],
      ["Partner / Vendor", invoice.partner],
      ["Billing Month", invoice.billingMonth],
      ["Trip Count", String(invoice.tripCount)],
      ["Generated Date", new Date(invoice.generatedDate).toLocaleString()],
      ["Approved By", invoice.approvedBy ?? "—"],
      ["Approved Date", invoice.approvedDate ? new Date(invoice.approvedDate).toLocaleString() : "—"],
    ],
  });

  const chargeRows: [string, string][] = [
    ["Monthly Fixed Vehicle Rent (Body Rent)", formatBDT(invoice.charges.fixedRent)],
    ["Personal Usage Bill", formatBDT(invoice.charges.personalUsageBill)],
    [
      `Distance Charge (${invoice.charges.distanceKm} km x ${formatBDT(invoice.charges.kmRate)})`,
      formatBDT(invoice.charges.distanceCharge),
    ],
    [`Overtime Charge (${invoice.charges.otHours} hrs)`, formatBDT(invoice.charges.otCharge)],
    ["Toll Charge", formatBDT(invoice.charges.tollCharge)],
    ["Parking Charge", formatBDT(invoice.charges.parkingCharge)],
    ["Startup Fuel Charge", formatBDT(invoice.charges.startupFuelCharge)],
    ["Mobile Bill", formatBDT(invoice.charges.mobileBill)],
    ["Other Approved Charges", formatBDT(invoice.charges.otherCharges)],
  ];

  const afterDetails = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: afterDetails + 8,
    head: [["Charge Breakdown", "Amount"]],
    body: chargeRows,
    foot: [["Total Bill", formatBDT(invoice.totalBill)]],
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 155, 215] },
    footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
  });

  if (invoice.adjustmentNote) {
    const afterCharges = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.text(`Adjustment Note: ${invoice.adjustmentNote}`, 14, afterCharges + 10);
  }

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
