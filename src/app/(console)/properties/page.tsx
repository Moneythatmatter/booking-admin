"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Card, Empty, ListFilters, Spinner } from "@/components/ui";
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
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    api<{ data: { properties: PropertyRow[] } }>(`/api/super/properties?${params}`, { token })
      .then((result) => {
        if (active) setRows(result.data.properties);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, q, status, revision]);

  async function updateStatus(id: string, next: string) {
    setError("");
    try {
      await api(`/api/super/properties/${id}`, { method: "PATCH", token, body: { status: next } });
      setRevision((value) => value + 1);
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Properties</h1>
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search hotel, city, or link"
        status={status}
        onStatusChange={setStatus}
        statuses={[
          { value: "active", label: "Active" },
          { value: "suspended", label: "Suspended" },
          { value: "blocked", label: "Blocked" },
        ]}
      />
      {error && <Banner>{error}</Banner>}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty title="No hotels" body={q || status ? "Nothing matches this search." : "Hotels appear when a hotelier provisions an account."} />
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
                    <select className="rounded-lg border border-line px-2 py-1" value={row.status} onChange={(event) => updateStatus(row.id, event.target.value)}>
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
