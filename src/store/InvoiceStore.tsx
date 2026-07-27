"use client";

import * as React from "react";
import { Invoice, InvoiceStatus } from "@/types";
import { useAuth } from "./AuthContext";

interface InvoiceStoreValue {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStatus: (id: string, status: InvoiceStatus, note?: string) => Promise<void>;
  addAdjustment: (id: string, note: string, amount: number) => Promise<void>;
}

const InvoiceStoreContext = React.createContext<InvoiceStoreValue | null>(null);

export function InvoiceStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load invoices.");
      setInvoices(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount is intentional
    refresh();
  }, [refresh]);

  const updateStatus = React.useCallback(
    async (id: string, status: InvoiceStatus, note?: string) => {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note, actor: user?.name ?? "System" }),
      });
      if (!res.ok) throw new Error("Failed to update invoice status.");
      const updated = (await res.json()) as Invoice;
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    },
    [user]
  );

  const addAdjustment = React.useCallback(
    async (id: string, note: string, amount: number) => {
      const res = await fetch(`/api/invoices/${id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, amount, actor: user?.name ?? "System" }),
      });
      if (!res.ok) throw new Error("Failed to apply adjustment.");
      const updated = (await res.json()) as Invoice;
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    },
    [user]
  );

  return (
    <InvoiceStoreContext.Provider value={{ invoices, loading, error, refresh, updateStatus, addAdjustment }}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  const ctx = React.useContext(InvoiceStoreContext);
  if (!ctx) throw new Error("useInvoiceStore must be used within InvoiceStoreProvider");
  return ctx;
}
