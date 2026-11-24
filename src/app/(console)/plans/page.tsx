"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Button, Card, Field, ListFilters, Modal, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage, money } from "@/lib/format";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_properties: number;
  max_rooms: number;
  features: string[];
  is_active: boolean;
}

const blank = { name: "", description: "", price_monthly: 49, price_yearly: 490, max_properties: 1, max_rooms: 20, features: "", is_active: true };

export default function PlansPage() {
  const { token } = useShell();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    const result = await api<{ data: Plan[] }>("/api/super/plans", { token });
    setPlans(result.data);
  }

  useEffect(() => {
    load().catch((loadError) => setError(errorMessage(loadError)));
  }, [token]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const body = { ...form, features: form.features.split(",").map((item) => item.trim()).filter(Boolean) };
      const path = editing ? `/api/super/plans/${editing}` : "/api/super/plans";
      await api(path, { method: editing ? "PATCH" : "POST", token, body });
      setForm(blank);
      setEditing(null);
      setOpen(false);
      setMessage("Plan saved.");
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="mt-1 text-sm text-muted">Subscription plans offered to hotels</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(blank);
            setError("");
            setOpen(true);
          }}
        >
          Add plan
        </Button>
      </div>
      {!open && error && <Banner>{error}</Banner>}
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search plan name"
        status={status}
        onStatusChange={setStatus}
        statuses={[
          { value: "active", label: "Active" },
          { value: "hidden", label: "Hidden" },
        ]}
      />
      {message && <Notice>{message}</Notice>}
      <Modal open={open} title={editing ? "Edit plan" : "Add plan"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Field label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Field label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly" type="number" min={0} value={form.price_monthly} onChange={(event) => setForm({ ...form, price_monthly: Number(event.target.value) })} />
            <Field label="Yearly" type="number" min={0} value={form.price_yearly} onChange={(event) => setForm({ ...form, price_yearly: Number(event.target.value) })} />
            <Field label="Max properties" type="number" min={1} value={form.max_properties} onChange={(event) => setForm({ ...form, max_properties: Number(event.target.value) })} />
            <Field label="Max rooms" type="number" min={1} value={form.max_rooms} onChange={(event) => setForm({ ...form, max_rooms: Number(event.target.value) })} />
          </div>
          <Field label="Features, comma separated" value={form.features} onChange={(event) => setForm({ ...form, features: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Active
          </label>
          <Button className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
      <div className="grid gap-3">
        {plans
          .filter((plan) => {
            if (q && !`${plan.name} ${plan.description}`.toLowerCase().includes(q.toLowerCase())) return false;
            if (status === "active" && !plan.is_active) return false;
            if (status === "hidden" && plan.is_active) return false;
            return true;
          })
          .map((plan) => (
          <Card key={plan.id} className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="font-medium">
                {plan.name} {plan.is_active ? "" : "· hidden"}
              </p>
              <p className="text-sm text-muted">
                {money(plan.price_monthly)}/mo · {plan.max_properties} properties · {plan.max_rooms} rooms
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(plan.id);
                setError("");
                setOpen(true);
                setForm({
                  name: plan.name,
                  description: plan.description,
                  price_monthly: Number(plan.price_monthly),
                  price_yearly: Number(plan.price_yearly),
                  max_properties: plan.max_properties,
                  max_rooms: plan.max_rooms,
                  features: (plan.features || []).join(", "),
                  is_active: plan.is_active,
                });
              }}
            >
              Edit
            </Button>
          </Card>
        ))}
        {plans.filter((plan) => {
          if (q && !`${plan.name} ${plan.description}`.toLowerCase().includes(q.toLowerCase())) return false;
          if (status === "active" && !plan.is_active) return false;
          if (status === "hidden" && plan.is_active) return false;
          return true;
        }).length === 0 && <p className="text-sm text-muted">{q || status ? "Nothing matches this search." : "No plans yet. Use Add plan."}</p>}
      </div>
    </div>
  );
}
