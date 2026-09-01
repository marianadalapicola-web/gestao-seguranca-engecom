import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Item {
  name: string;
  value: number;
}

const COLORS = ['#1f5fa3', '#3b7fc4', '#7aa9db', '#0f2a4a', '#17497e'];

export function SectorBarChart({ data, height = 260 }: { data: Item[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ed" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={{ stroke: '#e2e6ed' }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e6ed', fontSize: 12 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
