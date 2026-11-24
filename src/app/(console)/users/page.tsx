"use client";

import { useEffect, useState } from "react";
import { useShell } from "@/components/shell";
import { Banner, Button, Card, Empty, Field, ListFilters, Modal, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";

const pages = [
  ["overview", "Overview"],
  ["hoteliers", "Hoteliers"],
  ["properties", "Properties"],
  ["plans", "Plans"],
  ["subscriptions", "Subscriptions"],
  ["bookings", "Bookings"],
  ["reports", "Reports"],
  ["activity", "Activity"],
  ["users", "Users"],
] as const;

type Level = "none" | "read" | "write";
type Access = Record<string, Level>;

interface Staff {
  id: string;
  full_name: string;
  email: string;
  status: string;
  access_role: "administrator" | "user";
  page_access: Access;
}

const blank = () => Object.fromEntries(pages.map(([key]) => [key, "none"])) as Access;

export default function UsersPage() {
  const { token, pageAccess, userId } = useShell();
  const [users, setUsers] = useState<Staff[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", access_role: "user" as "administrator" | "user", page_access: blank() });
  const canWrite = (pageAccess.users ?? "write") === "write";

  function load() {
    return api<{ data: { users: Staff[] } }>("/api/super/staff", { token })
      .then((result) => setUsers(result.data.users))
      .catch((loadError) => setError(errorMessage(loadError)));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [token]);

  function openCreate() {
    setEditing(null);
    setError("");
    setForm({ full_name: "", email: "", password: "", access_role: "administrator", page_access: blank() });
    setOpen(true);
  }

  function openEdit(user: Staff) {
    setEditing(user.id);
    setError("");
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      access_role: user.access_role,
      page_access: { ...blank(), ...user.page_access },
    });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const body = {
        full_name: form.full_name,
        email: form.email,
        access_role: form.access_role,
        page_access: form.access_role === "administrator" ? undefined : form.page_access,
        ...(editing ? {} : { password: form.password }),
      };
      if (editing) await api(`/api/super/staff/${editing}`, { method: "PATCH", token, body });
      else await api("/api/super/staff", { method: "POST", token, body });
      setOpen(false);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  const staff = users.filter((user) => user.id !== userId).filter((user) => {
    const text = `${user.full_name} ${user.email}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (role && user.access_role !== role) return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted">Administrator can write every page. A user gets read, write, or no access on each page.</p>
        </div>
        {canWrite && <Button type="button" onClick={openCreate}>Add user</Button>}
      </div>
      {!open && error && <Banner>{error}</Banner>}
      <ListFilters
        query={draft}
        onQueryChange={setDraft}
        onSearch={() => setQ(draft.trim())}
        placeholder="Search name or email"
        status={role}
        onStatusChange={setRole}
        statusLabel="Role"
        statuses={[
          { value: "administrator", label: "Administrator" },
          { value: "user", label: "User" },
        ]}
      />
      {loading ? (
        <Spinner label="Loading users" />
      ) : staff.length === 0 ? (
        <Empty title="No platform users" body={q || role ? "Nothing matches this search." : "Add an administrator or a user with page access."} />
      ) : (
        <Card>
          <ul>
            {staff.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-0">
                <div>
                  <p className="text-sm font-medium">{user.full_name || user.email}</p>
                  <p className="text-xs text-muted">{user.email} · {user.access_role === "administrator" ? "Administrator" : "User"}</p>
                </div>
                {canWrite && (
                  <button type="button" className="text-sm font-medium text-pine" onClick={() => openEdit(user)}>
                    Access
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Modal open={open} title={editing ? "Update access" : "Add user"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          {error && <Banner>{error}</Banner>}
          <Field label="Name" required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Field label="Email" type="email" required value={form.email} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          {!editing && <Field label="Password" type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />}
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Role</span>
            <select className="w-full rounded-xl border border-line bg-white px-3 py-2.5" value={form.access_role} onChange={(event) => setForm({ ...form, access_role: event.target.value as "administrator" | "user" })}>
              <option value="administrator">Administrator — write on every page</option>
              <option value="user">User — choose page access</option>
            </select>
          </label>
          {form.access_role === "user" && (
            <div className="grid gap-2">
              {pages.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                  <span>{label}</span>
                  <select
                    className="rounded-lg border border-line bg-white px-2 py-1.5"
                    value={form.page_access[key] ?? "none"}
                    onChange={(event) => setForm({ ...form, page_access: { ...form.page_access, [key]: event.target.value as Level } })}
                  >
                    <option value="none">No access</option>
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </Modal>
    </div>
  );
}
