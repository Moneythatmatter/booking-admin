"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Button, Card, Empty, Field, Modal, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface Hotelier {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export default function HoteliersPage() {
  const { token } = useShell();
  const [users, setUsers] = useState<Hotelier[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", property_name: "", city: "", country: "" });

  async function load(query = q) {
    const params = new URLSearchParams({ limit: "50" });
    if (query) params.set("q", query);
    const result = await api<{ data: { users: Hotelier[] } }>(`/api/super/users?${params}`, { token });
    setUsers(result.data.users);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      await api("/api/super/users", { method: "POST", token, body: { ...form, property_name: form.property_name || undefined } });
      setForm({ full_name: "", email: "", password: "", phone: "", property_name: "", city: "", country: "" });
      setOpen(false);
      setMessage("Hotelier created.");
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hoteliers</h1>
          <p className="mt-1 text-sm text-muted">Manage hotel accounts</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          Add hotelier
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      {message && <Notice>{message}</Notice>}
      <Modal open={open} title="Add hotelier" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Field label="Name" required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Field label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Temporary password" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Field label="First property" value={form.property_name} onChange={(event) => setForm({ ...form, property_name: event.target.value })} />
          <Field label="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <Button className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Save"}
          </Button>
        </form>
      </Modal>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load().catch((loadError) => setError(errorMessage(loadError)));
        }}
      >
        <input className="flex-1 rounded-xl border border-line px-3 py-2 text-sm" placeholder="Search name or email" value={q} onChange={(event) => setQ(event.target.value)} />
        <Button variant="ghost" type="submit">
          Search
        </Button>
      </form>
      {users.length === 0 ? (
        <Empty title="No hoteliers" body="Use Add hotelier to create the first hotel account." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Hotelier</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-line">
                  <td className="py-3">
                    <Link href={`/hoteliers/${user.id}`} className="font-medium text-pine">
                      {user.full_name || user.email}
                    </Link>
                    <p className="text-xs text-muted">{user.email}</p>
                  </td>
                  <td>{user.status}</td>
                  <td>{user.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
