'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReducedMotion } from 'motion/react';
import { formatUzs } from '@nagis/shared-types';
import { formatDayMonth, t } from '@/i18n';

interface TrendPoint {
  date: string;
  value: number;
}

/**
 * Generic 30-day bar trend for the admin overview.
 *
 * Shared by the enrollment and revenue charts, which differ only in their
 * value formatting. Days with nothing recorded read zero — the series is
 * zero-filled by the API, not padded here to look fuller.
 */
export function TrendChart({
  data,
  label,
  kind = 'count',
  colour = 'var(--color-accent-500)',
}: {
  data: TrendPoint[];
  /** Series name, shown in the tooltip and the hidden table. */
  label: string;
  /** `money` formats values as UZS so`m. */
  kind?: 'count' | 'money';
  colour?: string;
}) {
  const reduceMotion = useReducedMotion();

  const series = useMemo(
    () => data.map((point) => ({ ...point, axis: formatDayMonth(point.date) })),
    [data],
  );

  const total = useMemo(() => data.reduce((sum, point) => sum + point.value, 0), [data]);

  const render = (value: number) => (kind === 'money' ? formatUzs(value) : String(value));

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-card border border-dashed border-hairline bg-surface-muted/40 px-6 text-center">
        <p className="text-sm text-muted">{t.admin.overview.noData}</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--surface-hairline)"
              vertical={false}
            />
            <XAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
              stroke="var(--surface-hairline)"
              interval={4}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
              stroke="var(--surface-hairline)"
              allowDecimals={false}
              tickLine={false}
              width={kind === 'money' ? 64 : 36}
              tickFormatter={(value: number) =>
                kind === 'money' ? compactUzs(value) : String(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--surface-hairline)',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                boxShadow: 'var(--shadow-lifted)',
                color: 'var(--text-body)',
              }}
              labelStyle={{ color: 'var(--text-heading)', fontWeight: 600 }}
              formatter={(value) => [render(Number(value ?? 0)), label]}
            />
            <Bar
              dataKey="value"
              fill={colour}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reduceMotion}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Same data, reachable without reading the chart. */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{t.common.date}</th>
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((point) => point.value > 0)
            .map((point) => (
              <tr key={point.date}>
                <th scope="row">{point.date}</th>
                <td>{render(point.value)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

/** Axis labels: 1 200 000 -> "1.2 mln", 450 000 -> "450 mıń". */
function compactUzs(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mln`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} mıń`;
  return String(value);
}
