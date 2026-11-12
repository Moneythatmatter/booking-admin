"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AreaChart, Donut } from "@/components/charts";
import { IconBuilding, IconCalendar, IconCard, IconUsers } from "@/components/icons";
import { useShell } from "@/components/shell";
import { Card, Modal, Spinner, StatCard, initials } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Stats {
  users: number;
  hoteliers: number;
  hotels: number;
  bookings: number;
  active_subscriptions: number;
  subscription_revenue: number;
}

interface Hotelier {
  id: string;
  full_name: string;
  email: string;
  status: string;
}

interface Booking {
  id: string;
  guest_name: string;
  status: string;
  property: { name: string } | null;
}

interface Activity {
  id: string;
  summary: string;
  created_at: string;
  actor: { full_name: string; email: string } | null;
  property: { name: string } | null;
  detail?: {
    kind: "added" | "updated" | "removed";
    title?: string;
    rows?: Array<{ field: string; from: string; to: string; value: string }>;
  };
}

interface Reports {
  monthly: Array<{ month: string; bookings: number; guest_volume: number }>;
  bookings_by_status: Record<string, number>;
}

const statusColors = ["#2563eb", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#64748b"];

export default function OverviewPage() {
  const { token } = useShell();
  const [stats, setStats] = useState<Stats | null>(null);
  const [hoteliers, setHoteliers] = useState<Hotelier[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [openActivity, setOpenActivity] = useState<Activity | null>(null);
  const [report, setReport] = useState<Reports | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ data: Stats }>("/api/super/stats", { token }),
      api<{ data: { users: Hotelier[] } }>("/api/super/users?limit=5", { token }),
      api<{ data: { bookings: Booking[] } }>("/api/super/bookings?limit=5", { token }),
      api<{ data: Reports }>("/api/super/reports", { token }),
      api<{ data: { logs: Activity[] } }>("/api/super/logs?limit=6", { token }),
    ])
      .then(([statsResult, usersResult, bookingsResult, reportsResult, logsResult]) => {
        setStats(statsResult.data);
        setHoteliers(usersResult.data.users);
        setBookings(bookingsResult.data.bookings);
        setReport(reportsResult.data);
        setActivity(logsResult.data.logs);
      })
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!stats || !report) return <Spinner label="Loading platform" />;

  const bookingSegments = Object.entries(report.bookings_by_status || {}).map(([label, value], index) => ({
    label: label.replaceAll("_", " "),
    value,
    color: statusColors[index % statusColors.length],
  }));
  const mix =
    bookingSegments.length > 0
      ? bookingSegments
      : [
          { label: "Hoteliers", value: stats.hoteliers, color: "#2563eb" },
          { label: "Hotels", value: stats.hotels, color: "#8b5cf6" },
          { label: "Active plans", value: stats.active_subscriptions, color: "#22c55e" },
        ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard overview</h1>
          <p className="mt-1 text-sm text-muted">Hotels, accounts, bookings, and subscription revenue.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.users} tone="bg-violet-100 text-violet-600" icon={<IconUsers />} />
        <StatCard label="Hoteliers" value={stats.hoteliers} tone="bg-emerald-100 text-emerald-600" icon={<IconUsers />} />
        <StatCard label="Hotels" value={stats.hotels} tone="bg-amber-100 text-amber-600" icon={<IconBuilding />} />
        <StatCard label="Bookings" value={stats.bookings} tone="bg-blue-100 text-blue-600" icon={<IconCalendar />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Booking activity</h2>
              <p className="text-sm text-muted">Last six months</p>
            </div>
            <p className="text-2xl font-bold text-pine">{stats.bookings}</p>
          </div>
          <div className="mt-4">
            <AreaChart points={(report.monthly || []).map((row) => ({ label: row.month, value: Number(row.bookings) }))} />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Booking mix</h2>
          <p className="text-sm text-muted">Distribution by status</p>
          <div className="mt-6">
            <Donut segments={mix} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Active subscriptions" value={stats.active_subscriptions} tone="bg-blue-100 text-blue-600" icon={<IconCard />} />
        <StatCard label="Subscription revenue" value={money(stats.subscription_revenue)} tone="bg-emerald-100 text-emerald-600" icon={<IconCard />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent hoteliers</h2>
            <Link href="/hoteliers" className="text-sm font-medium text-pine">
              View all
            </Link>
          </div>
          {hoteliers.length === 0 ? (
            <p className="py-6 text-sm text-muted">No hotelier accounts yet.</p>
          ) : (
            <ul>
              {hoteliers.map((user) => (
                <li key={user.id}>
                  <Link href={`/hoteliers/${user.id}`} className="flex items-center gap-3 rounded-xl px-1 py-3 hover:bg-paper">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-pine text-xs font-semibold text-white">{initials(user.full_name || user.email)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{user.full_name || user.email}</span>
                      <span className="block truncate text-xs text-muted">{user.email}</span>
                    </span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">Hotelier</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent bookings</h2>
            <Link href="/bookings" className="text-sm font-medium text-pine">
              View all
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-sm text-muted">Guest reservations will show up here.</p>
          ) : (
            <ul>
              {bookings.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 px-1 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{initials(booking.guest_name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{booking.guest_name}</span>
                    <span className="block truncate text-xs text-muted">{booking.property?.name || "Hotel"}</span>
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">{booking.status.replaceAll("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="text-sm text-muted">Changes and additions from the last year</p>
          </div>
          <Link href="/logs" className="text-sm font-semibold text-pine">
            View all
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="py-6 text-sm text-muted">Additions and changes from the last year show up here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr>
                  <th className="w-[24%]">Type</th>
                  <th className="w-[26%]">Property</th>
                  <th className="w-[28%]">Who</th>
                  <th className="w-[22%]">Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => {
                  const actor = item.actor?.full_name || item.actor?.email || "System";
                  const type = activityType(item);
                  return (
                    <tr key={item.id} className="cursor-pointer" onClick={() => setOpenActivity(item)}>
                      <td>
                        <span className="flex items-center gap-3 whitespace-nowrap">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-xs font-bold text-pine">{type.slice(0, 1)}</span>
                          <span className="font-semibold">{type}</span>
                        </span>
                      </td>
                      <td className="truncate">{item.property?.name || "Platform"}</td>
                      <td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#eef3ff] text-[10px] font-bold text-pine">{initials(actor)}</span>
                          <span className="truncate">{actor}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <time dateTime={item.created_at}>
                          {new Date(item.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal large open={Boolean(openActivity)} title={openActivity ? activityType(openActivity) : "Activity"} onClose={() => setOpenActivity(null)}>
        {openActivity && (
          <div className="grid gap-4">
            <p className="text-base font-semibold">{openActivity.detail?.title || openActivity.summary.split(/[.:]/)[0]}</p>
            <dl className="grid grid-cols-[5.5rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">When</dt>
              <dd>{new Date(openActivity.created_at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
              <dt className="text-muted">Property</dt>
              <dd>{openActivity.property?.name || "Platform"}</dd>
              <dt className="text-muted">Who</dt>
              <dd>
                {openActivity.actor?.full_name || "System"}
                {openActivity.actor?.email ? ` · ${openActivity.actor.email}` : ""}
              </dd>
            </dl>
            <PlatformRows detail={openActivity.detail} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function activityType(item: Activity) {
  if (item.detail?.kind === "updated") return "Update";
  if (/^Cancelled/.test(item.summary)) return "Cancel";
  if (item.detail?.kind === "removed") return "Delete";
  return "Create";
}

function PlatformRows({ detail }: { detail?: Activity["detail"] }) {
  const rows = detail?.rows ?? [];
  if (!detail || rows.length === 0) return <p className="text-sm text-muted">No field detail was stored for this event.</p>;
  const compared = detail.kind === "updated";
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead>
          <tr className="bg-[#2f5bff] text-white">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Field</th>
            {compared ? (
              <>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Previous</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">New</th>
              </>
            ) : (
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">Value</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const changed = compared && row.from !== row.to;
            return (
              <tr key={row.field} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{row.field}</td>
                {compared ? (
                  <>
                    <td className={`px-4 py-3 ${changed ? "text-slate-500" : ""}`}>{row.from}</td>
                    <td className={`px-4 py-3 ${changed ? "font-semibold" : ""}`}>{row.to}</td>
                  </>
                ) : (
                  <td className="px-4 py-3 font-medium">{row.value}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
