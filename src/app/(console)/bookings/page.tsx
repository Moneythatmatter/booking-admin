"use client";

import { useEffect, useMemo, useState } from "react";
import { useShell } from "@/components/shell";
import { Badge, Banner, Button, Card, Empty, Field, FilterSelect, ListFilters, Spinner, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Booking {
  id: string;
  confirmation_code: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  currency: string;
  category_name: string;
  nights: number;
  nightly_price: number;
  advance: number;
  remaining: number;
  property: { name: string; slug: string } | null;
}

const statuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"].map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));

const blankAdvanced = {
  hotel: "",
  checkInFrom: "",
  checkInTo: "",
  payment: "" as "" | "has_advance" | "pay_at_property" | "fully_paid",
  balance: "" as "" | "has_due" | "cleared",
};

function formatStayDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function countAdvanced(values: typeof blankAdvanced) {
  return Object.values(values).filter(Boolean).length;
}

function applyAdvanced(row: Booking, filters: typeof blankAdvanced) {
  if (filters.hotel && row.property?.slug !== filters.hotel) return false;
  if (filters.checkInFrom && row.check_in < filters.checkInFrom) return false;
  if (filters.checkInTo && row.check_in > filters.checkInTo) return false;
  if (filters.payment === "has_advance" && row.advance <= 0) return false;
  if (filters.payment === "pay_at_property" && (row.advance > 0 || row.remaining <= 0)) return false;
  if (filters.payment === "fully_paid" && row.remaining > 0) return false;
  if (filters.balance === "has_due" && row.remaining <= 0) return false;
  if (filters.balance === "cleared" && row.remaining > 0) return false;
  return true;
}

export default function BookingsPage() {
  const { token } = useShell();
  const [fetched, setFetched] = useState<Booking[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState(blankAdvanced);
  const [advanced, setAdvanced] = useState(blankAdvanced);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    api<{ data: { bookings: Booking[] } }>(`/api/super/bookings?${params}`, { token })
      .then((result) => {
        if (active) setFetched(result.data.bookings);
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
  }, [token, q, status]);

  const hotels = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of fetched) {
      if (row.property?.slug) map.set(row.property.slug, row.property.name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [fetched]);

  const rows = useMemo(() => fetched.filter((row) => applyAdvanced(row, advanced)), [fetched, advanced]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.bookings += 1;
        acc.revenue += row.total_amount;
        acc.collected += row.advance;
        acc.outstanding += row.remaining;
        return acc;
      },
      { bookings: 0, revenue: 0, collected: 0, outstanding: 0 },
    );
  }, [rows]);

  const currency = rows[0]?.currency ?? fetched[0]?.currency ?? "INR";
  const serverFiltered = Boolean(q || status);
  const advancedCount = countAdvanced(advanced);
  const filtered = serverFiltered || advancedCount > 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted">Guest reservations across every hotel on the platform.</p>
        </div>
        {!loading && rows.length > 0 && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pine shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            {rows.length} {rows.length === 1 ? "booking" : "bookings"}
            {filtered ? " matched" : ""}
          </span>
        )}
      </div>

      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search guest, hotel, booking id, or room"
        status={status}
        onStatusChange={setStatus}
        statuses={statuses}
        advancedOpen={advancedOpen}
        onAdvancedToggle={() => {
          setAdvancedOpen((open) => {
            if (!open) setAdvancedDraft(advanced);
            return !open;
          });
        }}
        advancedActiveCount={advancedCount}
        advancedChildren={
          <div className="grid gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Advanced filters</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Hotel</span>
                <FilterSelect aria-label="Hotel" value={advancedDraft.hotel} onChange={(event) => setAdvancedDraft({ ...advancedDraft, hotel: event.target.value })}>
                  <option value="">All hotels</option>
                  {hotels.map(([slug, name]) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </FilterSelect>
              </label>
              <Field
                label="Check-in from"
                type="date"
                value={advancedDraft.checkInFrom}
                onChange={(event) => setAdvancedDraft({ ...advancedDraft, checkInFrom: event.target.value })}
              />
              <Field
                label="Check-in to"
                type="date"
                value={advancedDraft.checkInTo}
                onChange={(event) => setAdvancedDraft({ ...advancedDraft, checkInTo: event.target.value })}
              />
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Payment</span>
                <FilterSelect
                  aria-label="Payment"
                  value={advancedDraft.payment}
                  onChange={(event) => setAdvancedDraft({ ...advancedDraft, payment: event.target.value as typeof blankAdvanced.payment })}
                >
                  <option value="">Any payment</option>
                  <option value="has_advance">Advance received</option>
                  <option value="pay_at_property">Pay at property</option>
                  <option value="fully_paid">Fully paid</option>
                </FilterSelect>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Balance</span>
                <FilterSelect
                  aria-label="Balance"
                  value={advancedDraft.balance}
                  onChange={(event) => setAdvancedDraft({ ...advancedDraft, balance: event.target.value as typeof blankAdvanced.balance })}
                >
                  <option value="">Any balance</option>
                  <option value="has_due">Amount due</option>
                  <option value="cleared">Nothing due</option>
                </FilterSelect>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setAdvanced(advancedDraft);
                  setAdvancedOpen(false);
                }}
              >
                Apply filters
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAdvancedDraft(blankAdvanced);
                  setAdvanced(blankAdvanced);
                }}
              >
                Clear advanced
              </Button>
            </div>
          </div>
        }
      />

      {advancedCount > 0 && !advancedOpen && (
        <p className="text-xs text-muted">
          Advanced: {advancedCount} filter{advancedCount === 1 ? "" : "s"} active.{" "}
          <button type="button" className="font-semibold text-pine hover:underline" onClick={() => setAdvancedOpen(true)}>
            Edit
          </button>
        </p>
      )}

      {error && <Banner>{error}</Banner>}

      {loading ? (
        <Spinner label="Loading bookings" />
      ) : rows.length === 0 ? (
        <Empty title="No bookings" body={filtered ? "Nothing matches this search." : "Guest reservations from every hotel appear here."} />
      ) : (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Hotel</th>
                  <th>Booking id</th>
                  <th>Room</th>
                  <th className="tabular">Nightly</th>
                  <th>Stay</th>
                  <th className="tabular">Total</th>
                  <th className="tabular">Advance</th>
                  <th className="tabular">Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-semibold text-ink">{row.guest_name}</p>
                    </td>
                    <td>
                      <p className="font-medium">{row.property?.name ?? "—"}</p>
                      {row.property?.slug && <p className="text-xs text-muted">/h/{row.property.slug}</p>}
                    </td>
                    <td>
                      <code className="rounded-lg bg-paper px-2 py-1 font-mono text-xs font-semibold tracking-wide text-pine">{row.confirmation_code}</code>
                    </td>
                    <td className="max-w-[10rem]">
                      <p className="truncate font-medium" title={row.category_name}>
                        {row.category_name}
                      </p>
                    </td>
                    <td className="tabular text-muted">{money(row.nightly_price, row.currency)}</td>
                    <td>
                      <p className="font-medium text-ink">
                        {row.nights} night{row.nights === 1 ? "" : "s"}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted">
                        {formatStayDate(row.check_in)}
                        <span className="mx-1 text-line">→</span>
                        {formatStayDate(row.check_out)}
                      </p>
                    </td>
                    <td className="tabular font-semibold">{money(row.total_amount, row.currency)}</td>
                    <td className={`tabular ${row.advance > 0 ? "font-medium text-emerald-800" : "text-muted"}`}>{money(row.advance, row.currency)}</td>
                    <td className={`tabular font-medium ${row.remaining > 0 ? "text-amber-900" : "text-muted"}`}>{money(row.remaining, row.currency)}</td>
                    <td>
                      <Badge tone={statusTone(row.status)}>{row.status.replaceAll("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-paper/80">
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Showing {totals.bookings}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">—</td>
                  <td className="tabular px-4 py-3 text-sm font-bold">{money(totals.revenue, currency)}</td>
                  <td className="tabular px-4 py-3 text-sm font-semibold text-emerald-800">{money(totals.collected, currency)}</td>
                  <td className="tabular px-4 py-3 text-sm font-semibold text-amber-900">{money(totals.outstanding, currency)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}