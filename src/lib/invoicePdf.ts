import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/types";
import { formatBDT } from "./billing";

function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Fleet Management System — computer-generated document, no signature required.", 14, pageHeight - 12);
    doc.text(`Generated on ${generatedAt}`, 14, pageHeight - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
  }
}

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

  addFooter(doc);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export interface TripInvoiceDetails {
  invoiceNumber: string;
  ticketId: string;
  employeeName: string;
  department: string;
  vendor?: string;
  tripDate: string;
  vehicleNumber: string;
  vehicleCategory: string;
  driverName?: string;
  driverMobile?: string;
  pickupLocation?: string;
  destination?: string;
  distanceKm: number;
  kmRate: number;
  distanceCharge: number;
}

function buildTripInvoiceDoc(details: TripInvoiceDetails): jsPDF {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Fleet Management — Trip Invoice", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice Number: ${details.invoiceNumber}`, 14, 26);
  doc.text(`Trip Date: ${new Date(details.tripDate).toLocaleDateString()}`, 14, 32);

  doc.setTextColor(0);
  autoTable(doc, {
    startY: 40,
    theme: "plain",
    styles: { fontSize: 10 },
    body: [
      ["Employee", details.employeeName],
      ["Department", details.department],
      ["Vendor", details.vendor || "—"],
      ["Vehicle", `${details.vehicleNumber} — ${details.vehicleCategory}`],
      ["Driver", details.driverName ? `${details.driverName} (${details.driverMobile || "—"})` : "Unassigned"],
      ["Pickup Location", details.pickupLocation || "—"],
      ["Destination", details.destination || "—"],
    ],
  });

  const afterDetails = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: afterDetails + 8,
    head: [["Description", "Distance", "Rate / km", "Amount"]],
    body: [
      ["Distance Charge", `${details.distanceKm} km`, formatBDT(details.kmRate), formatBDT(details.distanceCharge)],
    ],
    foot: [["Total", "", "", formatBDT(details.distanceCharge)]],
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 155, 215] },
    footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
  });

  addFooter(doc);
  return doc;
}

export function downloadTripInvoicePdf(details: TripInvoiceDetails): void {
  const doc = buildTripInvoiceDoc(details);
  doc.save(`${details.invoiceNumber}.pdf`);
}

