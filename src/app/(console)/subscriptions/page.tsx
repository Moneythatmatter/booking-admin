"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Button, Card, Empty, Field, Modal, Notice, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
}
interface PropertyOption {
  id: string;
  name: string;
}
interface Subscription {
  id: string;
  status: string;
  billing_interval: string;
  current_period_start: string;
  current_period_end: string;
  property: { id: string; name: string; slug: string } | null;
  plan: { name: string; price_monthly: number } | null;
}

export default function SubscriptionsPage() {
  const { token } = useShell();
  const [rows, setRows] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    property_id: "",
    plan_id: "",
    status: "active",
    billing_interval: "monthly",
    current_period_start: new Date().toISOString().slice(0, 10),
    current_period_end: "",
    record_payment: false,
  });

  async function load() {
    const [subs, planResult, propertyResult] = await Promise.all([
      api<{ data: { subscriptions: Subscription[] } }>("/api/super/subscriptions?limit=100", { token }),
      api<{ data: Plan[] }>("/api/super/plans", { token }),
      api<{ data: { properties: PropertyOption[] } }>("/api/super/properties?limit=100", { token }),
    ]);
    setRows(subs.data.subscriptions);
    setPlans(planResult.data);
    setProperties(propertyResult.data.properties);
    setForm((current) => ({
      ...current,
      plan_id: current.plan_id || planResult.data[0]?.id || "",
      property_id: current.property_id || propertyResult.data.properties[0]?.id || "",
    }));
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(errorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [token]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      await api("/api/super/subscriptions", { method: "POST", token, body: form });
      setOpen(false);
      setMessage("Subscription saved.");
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
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted">Renewals update the property subscription. Recording a payment stores subscription revenue only.</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          Update subscription
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      {message && <Notice>{message}</Notice>}
      <Modal open={open} title="Update subscription" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Select label="Property" value={form.property_id} onChange={(event) => setForm({ ...form, property_id: event.target.value })}>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
          <Select label="Plan" value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {money(plan.price_monthly)}/mo
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {["trialing", "active", "past_due", "cancelled", "expired"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <Select label="Interval" value={form.billing_interval} onChange={(event) => setForm({ ...form, billing_interval: event.target.value })}>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
            </Select>
            <Field label="Period start" type="date" value={form.current_period_start} onChange={(event) => setForm({ ...form, current_period_start: event.target.value })} />
            <Field label="Expiry" type="date" required value={form.current_period_end} onChange={(event) => setForm({ ...form, current_period_end: event.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.record_payment} onChange={(event) => setForm({ ...form, record_payment: event.target.checked })} />
            Record a paid subscription renewal
          </label>
          <Button className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
      {rows.length === 0 ? (
        <Empty title="No subscriptions" body="New hotels receive a Starter trial automatically." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Property</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3">{row.property?.name}</td>
                  <td>{row.plan?.name}</td>
                  <td>{row.status}</td>
                  <td>{row.current_period_end}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
