'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReducedMotion } from 'motion/react';
import type { ActivityPoint } from '@nagis/shared-types';
import { formatDayMonth, t } from '@/i18n';

/**
 * Thirty-day learning activity.
 *
 * The series comes straight from LessonProgress rows. Days with no study
 * genuinely read zero — the shape is honest, not smoothed to look busy.
 *
 * Accessibility: the SVG is `aria-hidden` and the same numbers are published
 * as a visually hidden table, so the data is reachable without reading a
 * chart. Entry animation is disabled under `prefers-reduced-motion`.
 */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const reduceMotion = useReducedMotion();

  const series = useMemo(
    () => data.map((point) => ({ ...point, label: formatDayMonth(point.date) })),
    [data],
  );

  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.completedLessons, 0),
    [data],
  );

  // With nothing recorded there is no shape to draw, so say so instead of
  // rendering a flat line that looks like a broken chart.
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card border border-dashed border-hairline bg-surface-muted/40 px-6 text-center">
        <p className="text-sm text-muted">{t.dashboard.activityEmpty}</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--surface-hairline)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
              stroke="var(--surface-hairline)"
              // Only every fifth label, otherwise 30 days overlap on mobile.
              interval={4}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
              stroke="var(--surface-hairline)"
              allowDecimals={false}
              tickLine={false}
              width={40}
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
              // Recharts types the value as ValueType | undefined, so it is
              // normalised here rather than asserted.
              formatter={(value) => [String(value ?? 0), t.dashboard.activityLessons]}
            />
            <Area
              type="monotone"
              dataKey="completedLessons"
              stroke="var(--color-accent-600)"
              strokeWidth={2}
              fill="url(#activity-fill)"
              isAnimationActive={!reduceMotion}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* The same data, for assistive technology. */}
      <table className="sr-only">
        <caption>
          {t.dashboard.activityTitle} — {t.dashboard.activitySubtitle}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t.common.date}</th>
            <th scope="col">{t.dashboard.activityLessons}</th>
            <th scope="col">{t.dashboard.activityMinutes}</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((point) => point.completedLessons > 0)
            .map((point) => (
              <tr key={point.date}>
                <th scope="row">{point.date}</th>
                <td>{point.completedLessons}</td>
                <td>{point.minutes}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}
