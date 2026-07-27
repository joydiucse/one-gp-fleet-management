"use client";

import * as React from "react";
import { useAuth } from "@/store/AuthContext";

interface WithId {
  id: string;
}

export function useCollection<T extends WithId>(endpoint: string) {
  const { user } = useAuth();
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${endpoint}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount is intentional
    refresh();
  }, [refresh]);

  const create = React.useCallback(
    async (payload: Partial<T>) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, __actor: user?.name }),
      });
      if (!res.ok) throw new Error("Create failed.");
      const created = (await res.json()) as T;
      setData((d) => [...d, created]);
      return created;
    },
    [endpoint, user]
  );

  const update = React.useCallback(
    async (id: string, payload: Partial<T>) => {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, __actor: user?.name }),
      });
      if (!res.ok) throw new Error("Update failed.");
      const updated = (await res.json()) as T;
      setData((d) => d.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [endpoint, user]
  );

  const remove = React.useCallback(
    async (id: string) => {
      const url = new URL(`${endpoint}/${id}`, window.location.origin);
      if (user?.name) url.searchParams.set("actor", user.name);
      const res = await fetch(url.toString().replace(window.location.origin, ""), { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setData((d) => d.filter((item) => item.id !== id));
    },
    [endpoint, user]
  );

  return { data, setData, loading, error, refresh, create, update, remove };
}
