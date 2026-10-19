import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/* ==========================================================================
 * Card
 * ======================================================================== */

const cardVariants = cva(
  ['rounded-card border bg-surface transition-[box-shadow,border-color,transform]'],
  {
    variants: {
      tone: {
        default: 'border-hairline',
        muted: 'border-hairline bg-surface-muted',
        /** No border; used inside already-bordered containers. */
        flush: 'border-transparent',
      },
      elevation: {
        none: '',
        subtle: 'shadow-subtle',
        card: 'shadow-card',
      },
      interactive: {
        true: 'duration-250 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-lifted hover:border-ink-200 motion-reduce:hover:translate-y-0',
      },
    },
    defaultVariants: { tone: 'default', elevation: 'subtle' },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, tone, elevation, interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ tone, elevation, interactive }), className)}
      {...props}
    />
  );
});

/* ==========================================================================
 * Badge
 * ======================================================================== */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-pill font-medium',
    'whitespace-nowrap align-middle',
  ],
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-muted',
        outline: 'border border-hairline text-muted',
        accent: 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200',
        success:
          'bg-[var(--color-success-soft)] text-[var(--color-success)] dark:bg-[color-mix(in_srgb,var(--color-success)_22%,transparent)] dark:text-[#6fd3a2]',
        warning:
          'bg-[var(--color-warning-soft)] text-[var(--color-warning)] dark:bg-[color-mix(in_srgb,var(--color-warning)_22%,transparent)] dark:text-[#e8b45f]',
        danger:
          'bg-[var(--color-danger-soft)] text-[var(--color-danger)] dark:bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)] dark:text-[#f28b8b]',
        violet: 'bg-[#f1ecfe] text-[#5b3fd0] dark:bg-[#7c5cf0]/25 dark:text-[#c3b1fb]',
        ink: 'bg-ink-900 text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/* ==========================================================================
 * Section heading
 * ======================================================================== */

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Action rendered on the right at desktop widths. */
  action?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  /** Heading level, so page outlines stay correct. */
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
  as: Heading = 'h2',
}: SectionHeadingProps) {
  const centred = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        centred && 'sm:flex-col sm:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centred && 'text-center')}>
        {eyebrow && (
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-600 dark:text-accent-300">
            {eyebrow}
          </p>
        )}
        <Heading className="text-display-sm sm:text-display-md">{title}</Heading>
        {description && <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ==========================================================================
 * Skeleton
 * ======================================================================== */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton rounded-md', className)}
      {...props}
    />
  );
}

/* ==========================================================================
 * Progress bar
 * ======================================================================== */

interface ProgressProps {
  /** 0..100. Clamped. */
  value: number;
  className?: string;
  size?: 'sm' | 'md';
  tone?: 'accent' | 'success';
  /** Accessible label; falls back to a Qaraqalpaq percentage description. */
  label?: string;
}

export function Progress({ value, className, size = 'md', tone = 'accent', label }: ProgressProps) {
  const safe = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Ilgerilew: ${safe} procent`}
      className={cn(
        'w-full overflow-hidden rounded-pill bg-surface-muted',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      {/* Width transition rather than a layout animation. */}
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-700 ease-[var(--ease-out-soft)]',
          'motion-reduce:transition-none',
          tone === 'success'
            ? 'bg-[var(--color-success)]'
            : 'bg-gradient-to-r from-accent-500 to-violet-accent',
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

/* ==========================================================================
 * Empty / error states
 * ======================================================================== */

interface StateBlockProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'danger';
}

/**
 * Shared layout for empty, error and "nothing found" states, so they are
 * visually consistent wherever they appear.
 */
export function StateBlock({
  icon,
  title,
  description,
  action,
  className,
  tone = 'neutral',
}: StateBlockProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-panel border border-dashed px-6 py-14 text-center',
        tone === 'danger'
          ? 'border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[var(--color-danger-soft)]/40'
          : 'border-hairline bg-surface-muted/50',
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
            tone === 'danger'
              ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
              : 'bg-surface text-faint shadow-subtle',
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-heading">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ==========================================================================
 * Star rating (display only)
 * ======================================================================== */

interface StarsProps {
  /** 0..5, or null when the course has no reviews yet. */
  value: number | null;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
  /** Text shown when `value` is null. */
  emptyLabel?: string;
}

/**
 * Renders a real average only. When `value` is null the component says so
 * rather than drawing zero or five grey stars, which would imply a rating
 * that does not exist.
 */
export function Stars({ value, count, size = 'sm', className, emptyLabel }: StarsProps) {
  if (value === null) {
    return <span className={cn('text-xs text-faint', className)}>{emptyLabel ?? 'Bahalaw joq'}</span>;
  }

  const dimension = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const percentage = (Math.min(5, Math.max(0, value)) / 5) * 100;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {/* Two stacked star rows, the gold one clipped to the average. */}
      <span className="relative inline-flex" aria-hidden="true">
        <span className="inline-flex text-ink-200 dark:text-ink-600">
          {[0, 1, 2, 3, 4].map((index) => (
            <StarGlyph key={index} className={dimension} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex overflow-hidden text-[#f0a92b]"
          style={{ width: `${percentage}%` }}
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <StarGlyph key={index} className={dimension} />
          ))}
        </span>
      </span>
      <span className={cn('font-semibold text-heading', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {value.toFixed(1)}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-faint">({count})</span>
      )}
      <span className="sr-only">5 ten {value.toFixed(1)} bal</span>
    </span>
  );
}

function StarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={cn('shrink-0', className)}>
      <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.2l-4.94 2.6.94-5.49-4-3.9 5.53-.8z" />
    </svg>
  );
}

/* ==========================================================================
 * Divider with optional label
 * ======================================================================== */

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={cn('border-t border-hairline', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="h-px flex-1 bg-hairline" />
      <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
