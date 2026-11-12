"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Card, Empty, Spinner } from "@/components/ui";
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
  property: { name: string; slug: string } | null;
}

export default function BookingsPage() {
  const { token } = useShell();
  const [rows, setRows] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: { bookings: Booking[] } }>("/api/super/bookings?limit=50", { token })
      .then((result) => setRows(result.data.bookings))
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (rows.length === 0) return <Empty title="No bookings" body="Guest reservations from every hotel appear here." />;

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl">Bookings</h1>
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">Stay</th>
              <th>Hotel</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-3">
                  <p>{row.guest_name}</p>
                  <p className="text-xs text-muted">
                    {row.confirmation_code} · {row.check_in} → {row.check_out}
                  </p>
                </td>
                <td>{row.property?.name}</td>
                <td>{row.status}</td>
                <td>{money(row.total_amount, row.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
