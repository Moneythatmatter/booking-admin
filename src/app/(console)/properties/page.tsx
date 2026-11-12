"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Card, Empty, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  status: string;
  subscription: { status: string; current_period_end: string; plan: { name: string } | null } | null;
}

export default function PropertiesPage() {
  const { token } = useShell();
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const result = await api<{ data: { properties: PropertyRow[] } }>("/api/super/properties?limit=100", { token });
    setRows(result.data.properties);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token]);

  async function setStatus(id: string, status: string) {
    setError("");
    try {
      await api(`/api/super/properties/${id}`, { method: "PATCH", token, body: { status } });
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Properties</h1>
      {error && <Banner>{error}</Banner>}
      {rows.length === 0 ? (
        <Empty title="No hotels" body="Hotels appear when a hotelier provisions an account." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Hotel</th>
                <th>Subscription</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3">
                    <p>{row.name}</p>
                    <p className="text-xs text-muted">
                      /h/{row.slug}
                      {row.city ? ` · ${row.city}` : ""}
                    </p>
                  </td>
                  <td>
                    {row.subscription?.plan?.name || "None"} · {row.subscription?.status || "—"}
                    <p className="text-xs text-muted">until {row.subscription?.current_period_end || "—"}</p>
                  </td>
                  <td>
                    <select className="rounded-lg border border-line px-2 py-1" value={row.status} onChange={(event) => setStatus(row.id, event.target.value)}>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
