"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase";
import { IconLogout, navIcons } from "./icons";
import { Spinner, initials } from "./ui";

interface ShellState {
  token: string;
  name: string;
  userId: string;
  pageAccess: Record<string, "none" | "read" | "write">;
  signOut: () => Promise<void>;
}

const ShellContext = createContext<ShellState | null>(null);
export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("Missing admin shell.");
  return value;
}

const links = [
  ["/", "Overview", "overview"],
  ["/hoteliers", "Hoteliers", "hoteliers"],
  ["/properties", "Properties", "properties"],
  ["/plans", "Plans", "plans"],
  ["/subscriptions", "Subscriptions", "subscriptions"],
  ["/bookings", "Bookings", "bookings"],
  ["/reports", "Reports", "reports"],
  ["/logs", "Activity", "activity"],
  ["/users", "Users", "users"],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [pageAccess, setPageAccess] = useState<Record<string, "none" | "read" | "write">>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const sessionToken = data.session?.access_token;
        if (!sessionToken) {
          router.replace("/login");
          return;
        }
        const me = await api<{ data: { profile: { id: string; full_name: string; email: string; platform_role: string }; page_access?: Record<string, "none" | "read" | "write"> } }>("/api/auth/me", { token: sessionToken });
        if (me.data.profile.platform_role !== "super_admin") {
          throw new Error("This account is not a platform admin.");
        }
        if (!active) return;
        setToken(sessionToken);
        setUserId(me.data.profile.id);
        setName(me.data.profile.full_name || me.data.profile.email);
        setPageAccess(me.data.page_access ?? {});
        setLoading(false);
      } catch {
        if (!active) return;
        try {
          await createClient().auth.signOut();
        } catch {
          // The session cannot be used.
        }
        router.replace("/login");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  if (loading || !token) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Opening platform admin" />
      </div>
    );
  }

  return (
    <ShellContext.Provider value={{ token, name, userId, pageAccess, signOut }}>
      <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-line bg-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-5 py-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine text-sm font-bold text-white">B</span>
            <div>
              <p className="text-sm font-bold leading-none">Booking</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Admin panel</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {links.filter(([, , page]) => (pageAccess[page] ?? "write") !== "none").map(([href, label]) => {
              const Icon = navIcons[href];
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-[#eef3ff] font-semibold text-pine" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50" onClick={signOut}>
            <IconLogout />
            Log out
          </button>
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 lg:justify-end lg:border-0 lg:bg-transparent lg:px-8 lg:pt-5">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-sm font-bold text-white">B</span>
              <p className="text-sm font-bold">Booking</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{name}</p>
                <p className="text-xs text-muted">Super admin</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-pine text-sm font-semibold text-white">{initials(name)}</span>
            </div>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden">
            {links.filter(([, , page]) => (pageAccess[page] ?? "write") !== "none").map(([href, label]) => (
              <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${pathname === href ? "bg-[#eef3ff] text-pine" : "text-slate-600"}`}>
                {label}
              </Link>
            ))}
            <button className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600" onClick={signOut}>
              Log out
            </button>
          </nav>
          <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
