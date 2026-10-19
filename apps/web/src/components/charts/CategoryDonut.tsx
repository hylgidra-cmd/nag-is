'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useReducedMotion } from 'motion/react';
import type { DashboardSummary } from '@nagis/shared-types';
import { t } from '@/i18n';

type Breakdown = DashboardSummary['categoryBreakdown'];

/**
 * Completed lessons grouped by course category.
 *
 * Slice colours come from each category's stored accent, so the donut matches
 * the category tiles elsewhere in the product rather than inventing a
 * separate palette. Categories without an accent fall back to the brand
 * sequence.
 */
const FALLBACK_COLOURS = [
  'var(--color-accent-500)',
  'var(--color-violet-accent)',
  'var(--color-teal-accent)',
  '#0284c7',
  '#d97706',
];

export function CategoryDonut({ data }: { data: Breakdown }) {
  const reduceMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-card border border-dashed border-hairline bg-surface-muted/40 px-6 text-center">
        <p className="text-sm text-muted">{t.dashboard.breakdownEmpty}</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.lessons, 0);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="lessons"
              nameKey="categoryName"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={!reduceMotion}
              animationDuration={650}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.categoryName}
                  fill={item.accent ?? FALLBACK_COLOURS[index % FALLBACK_COLOURS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--surface-hairline)',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                boxShadow: 'var(--shadow-lifted)',
                color: 'var(--text-body)',
              }}
              formatter={(value, name) => [String(value ?? 0), String(name ?? '')]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-heading">{total}</span>
          <span className="text-[11px] text-faint">{t.course.lessonsLabel}</span>
        </div>
      </div>

      {/* Legend doubles as the accessible data list. */}
      <ul className="w-full space-y-2">
        {data.map((item, index) => (
          <li key={item.categoryName} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-pill"
              style={{
                backgroundColor:
                  item.accent ?? FALLBACK_COLOURS[index % FALLBACK_COLOURS.length],
              }}
            />
            <span className="min-w-0 flex-1 truncate text-body">{item.categoryName}</span>
            <span className="font-semibold text-heading">{item.lessons}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
