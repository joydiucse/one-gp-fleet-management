"use client";

import { useCollection } from "@/lib/useCollection";
import { useInvoiceStore } from "@/store/InvoiceStore";
import { Vehicle, Requisition } from "@/types";

export function useReportData() {
  const { invoices, loading: invoicesLoading } = useInvoiceStore();
  const { data: requisitions, loading: requisitionsLoading } = useCollection<Requisition>("/api/requisitions");
  const { data: vehicles, loading: vehiclesLoading } = useCollection<Vehicle>("/api/vehicles");

  return {
    invoices,
    requisitions,
    vehicles,
    loading: invoicesLoading || requisitionsLoading || vehiclesLoading,
  };
}
