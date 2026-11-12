"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Card, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Reports {
  bookings_by_status: Record<string, number>;
  properties_by_status: Record<string, number>;
  subscriptions_by_status: Record<string, number>;
  monthly: Array<{ month: string; bookings: number; guest_volume: number }>;
  subscription_revenue: number;
  guest_payment_volume: number;
}

export default function ReportsPage() {
  const { token } = useShell();
  const [report, setReport] = useState<Reports | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: Reports }>("/api/super/reports", { token })
      .then((result) => setReport(result.data))
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [token]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!report) return <Spinner label="Building the report" />;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Reports</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Subscription revenue</p>
          <p className="mt-2 font-serif text-3xl">{money(report.subscription_revenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Guest card payments</p>
          <p className="mt-2 font-serif text-3xl">{money(report.guest_payment_volume)}</p>
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <CountCard title="Bookings" counts={report.bookings_by_status} />
        <CountCard title="Properties" counts={report.properties_by_status} />
        <CountCard title="Subscriptions" counts={report.subscriptions_by_status} />
      </div>
      <Card>
        <h2 className="font-serif text-2xl">Last six months</h2>
        {(report.monthly || []).length === 0 ? (
          <p className="mt-3 text-sm text-muted">No reservation volume yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Month</th>
                <th>Bookings</th>
                <th>Stay volume</th>
              </tr>
            </thead>
            <tbody>
              {report.monthly.map((row) => (
                <tr key={row.month} className="border-t border-line">
                  <td className="py-2">{row.month}</td>
                  <td>{row.bookings}</td>
                  <td>{money(row.guest_volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CountCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts || {});
  return (
    <Card>
      <h2 className="font-medium">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">None yet.</p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {entries.map(([key, value]) => (
            <li key={key} className="flex justify-between">
              <span>{key.replaceAll("_", " ")}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
