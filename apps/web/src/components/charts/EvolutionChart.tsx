import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Series {
  key: string;
  label: string;
  color: string;
}

export function EvolutionChart<T extends { period: string }>({ data, series, height = 260 }: { data: T[]; series: Series[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ed" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#667085' }} axisLine={{ stroke: '#e2e6ed' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e6ed', fontSize: 12 }}
          labelStyle={{ fontWeight: 600, color: '#101828' }}
        />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
