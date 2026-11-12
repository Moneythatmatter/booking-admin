export function AreaChart({ points }: { points: Array<{ label: string; value: number }> }) {
  if (points.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">No reservation activity in the last six months.</p>;
  }
  const width = 640;
  const height = 220;
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length === 1 ? 0 : width / (points.length - 1);
  const coords = points.map((point, index) => ({
    ...point,
    x: index * step,
    y: height - 28 - (point.value / max) * (height - 56),
  }));
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${height - 8} L ${coords[0].x} ${height - 8} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Monthly bookings">
      <defs>
        <linearGradient id="booking-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#booking-area)" />
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
      {coords.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#2563eb" strokeWidth="2" />
          <text x={point.x} y={height - 6} textAnchor="middle" className="fill-muted" fontSize="11">
            {point.label.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Distribution">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2ff" strokeWidth="16" />
        {total > 0 &&
          segments.map((segment) => {
            const length = (segment.value / total) * circumference;
            const circle = (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += length;
            return circle;
          })}
        <text x="70" y="74" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">
          {total}
        </text>
      </svg>
      <ul className="grid gap-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
            {segment.label}
            <span className="font-medium text-ink">({segment.value})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
