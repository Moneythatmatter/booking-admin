"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Button, Card, Field, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

interface Detail {
  profile: { id: string; full_name: string; email: string; phone: string | null; status: string };
  memberships: Array<{ role: string; property: { id: string; name: string; slug: string; status: string; subscription: { status: string; current_period_end: string } | null } | null }>;
}

export default function HotelierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useShell();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const result = await api<{ data: Detail }>(`/api/super/users/${id}`, { token });
    setDetail(result.data);
    setName(result.data.profile.full_name);
    setPhone(result.data.profile.phone || "");
  }

  useEffect(() => {
    load().catch((loadError) => setError(errorMessage(loadError)));
  }, [id, token]);

  async function save(status?: "active" | "blocked" | "suspended") {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/super/users/${id}`, { method: "PATCH", token, body: { full_name: name, phone, ...(status ? { status } : {}) } });
      setMessage(status ? `Account ${status}.` : "Profile saved.");
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  if (error && !detail) return <Banner>{error}</Banner>;
  if (!detail) return <Spinner />;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted">{detail.profile.email}</p>
        <h1 className="font-serif text-4xl">{detail.profile.full_name || "Hotelier"}</h1>
        <p className="mt-1 text-sm">Status: {detail.profile.status}</p>
      </div>
      {error && <Banner>{error}</Banner>}
      {message && <Notice>{message}</Notice>}
      <Card className="grid gap-4">
        <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => save()}>
            Save
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => save("active")}>
            Activate
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => save("suspended")}>
            Suspend
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => save("blocked")}>
            Block
          </Button>
        </div>
        <p className="text-sm text-muted">Blocking also bans the Supabase login. Suspending keeps login read-only and pauses properties they own. Activating restores those properties.</p>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl">Properties</h2>
        {detail.memberships.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No properties yet.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {detail.memberships.map((membership) => (
              <li key={membership.property?.id} className="border-t border-line pt-3">
                <p className="font-medium">
                  {membership.property?.name} · {membership.role}
                </p>
                <p className="text-muted">
                  /h/{membership.property?.slug} · property {membership.property?.status} · subscription {membership.property?.subscription?.status || "none"} until{" "}
                  {membership.property?.subscription?.current_period_end || "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
