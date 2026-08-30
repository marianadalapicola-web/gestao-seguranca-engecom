import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';

function toneColor(percent: number | null) {
  if (percent === null) return '#98a2b3';
  if (percent >= 100) return '#16a34a';
  if (percent >= 90) return '#2563eb';
  if (percent >= 70) return '#d97706';
  return '#dc2626';
}

export function GaugeChart({ percent, size = 200 }: { percent: number | null; size?: number }) {
  const clamped = percent === null ? 0 : Math.max(0, Math.min(120, percent));
  const data = [{ value: clamped, fill: toneColor(percent) }];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.62 }}>
      <RadialBarChart
        width={size}
        height={size * 0.62}
        cx="50%"
        cy="100%"
        innerRadius="120%"
        outerRadius="200%"
        barSize={16}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 120]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: '#eef1f6' }} dataKey="value" cornerRadius={8} angleAxisId={0} />
      </RadialBarChart>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-2xl font-bold text-[var(--color-ink-900)]">{percent !== null ? `${percent.toFixed(0)}%` : '—'}</span>
        <span className="text-[10px] text-[var(--color-ink-500)] uppercase tracking-wide">da meta</span>
      </div>
    </div>
  );
}
