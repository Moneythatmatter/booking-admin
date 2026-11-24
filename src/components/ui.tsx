import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-pine focus:ring-4 focus:ring-pine/15";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-pine text-white hover:bg-[#1d4ed8]",
    ghost: "border border-line bg-white text-ink hover:bg-paper",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <input className={fieldClass} {...props} />
    </label>
  );
}

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <select className={fieldClass} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{children}</div>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{children}</div>;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-pine" />
      {label}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    bad: "bg-red-50 text-red-800 ring-1 ring-red-200/80",
    warn: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}>{children}</span>;
}

export function statusTone(status: string): "neutral" | "good" | "bad" | "warn" {
  if (["active", "confirmed", "paid", "checked_in", "trialing", "checked_out"].includes(status)) return "good";
  if (["blocked", "cancelled", "failed", "expired", "no_show"].includes(status)) return "bad";
  if (["suspended", "pending", "past_due", "maintenance"].includes(status)) return "warn";
  return "neutral";
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="currentColor">
      <path d="M4 7h4M4 17h2M4 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M18 7h2M10 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function FilterSelect({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className={`relative block min-w-[10.5rem] ${className}`}>
      {label ? <span className="sr-only">{label}</span> : null}
      <select
        className="h-[42px] w-full cursor-pointer appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-9 text-sm font-medium text-ink shadow-sm outline-none transition hover:border-pine/40 focus:border-pine focus:ring-4 focus:ring-pine/12"
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center">{<ChevronDown />}</span>
    </label>
  );
}

export function ListFilters({
  query,
  onQueryChange,
  onSearch,
  placeholder,
  status,
  onStatusChange,
  statuses,
  statusLabel = "Status",
  className = "",
  advancedOpen,
  onAdvancedToggle,
  advancedActiveCount = 0,
  advancedChildren,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
  status?: string;
  onStatusChange?: (value: string) => void;
  statuses?: Array<{ value: string; label: string }>;
  statusLabel?: string;
  className?: string;
  advancedOpen?: boolean;
  onAdvancedToggle?: () => void;
  advancedActiveCount?: number;
  advancedChildren?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${className}`}>
      <form
        className="flex flex-wrap items-center gap-2 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <div className="relative min-w-[min(100%,220px)] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{<SearchIcon />}</span>
          <input
            className="h-[42px] w-full rounded-xl border border-line bg-paper/50 py-2 pl-10 pr-3 text-sm outline-none transition placeholder:text-muted focus:border-pine focus:bg-white focus:ring-4 focus:ring-pine/12"
            placeholder={placeholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        {statuses && onStatusChange && (
          <FilterSelect label={statusLabel} value={status ?? ""} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">All {statusLabel.toLowerCase()}</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </FilterSelect>
        )}
        <Button type="submit" variant="primary" className="h-[42px] min-w-[5.5rem]">
          Search
        </Button>
        {onAdvancedToggle && (
          <Button
            type="button"
            variant="ghost"
            className={`relative h-[42px] gap-2 px-4 ${advancedOpen ? "border-pine/50 bg-pine/5 ring-2 ring-pine/15" : ""}`}
            onClick={onAdvancedToggle}
          >
            {<SlidersIcon />}
            Advanced
            {advancedActiveCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pine px-1.5 text-[11px] font-bold text-white">{advancedActiveCount}</span>
            )}
          </Button>
        )}
      </form>
      {advancedOpen && advancedChildren ? <div className="border-t border-line bg-paper/30 px-3 py-4">{advancedChildren}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`data-card rounded-2xl border border-line bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="text-xl font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

export function StatCard({ label, value, tone, icon }: { label: string; value: ReactNode; tone: string; icon: ReactNode }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</p>
    </article>
  );
}

export function Modal({ open, title, onClose, children, large = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; large?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-40 lg:left-[248px]">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet-up absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl ${large ? "min-h-[60vh]" : ""}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-xl leading-none text-muted hover:bg-paper" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function initials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "U";
}
