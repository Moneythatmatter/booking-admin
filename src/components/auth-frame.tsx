export function AuthFrame({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#2563eb] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-bold text-[#2563eb]">B</span>
          <div>
            <p className="text-lg font-semibold leading-none">Booking</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Admin panel</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="text-4xl font-semibold leading-tight">{title}</p>
          <p className="mt-4 text-base leading-relaxed text-white/80">{subtitle}</p>
        </div>
        <p className="text-sm text-white/65">{kicker}</p>
      </section>
      <section className="grid place-items-center bg-[#f7f8fc] px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
