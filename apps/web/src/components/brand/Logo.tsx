import { cn } from '@/lib/cn';

/**
 * The NAG'IS mark.
 *
 * Geometry: a rising stair of three bars inside a rounded square, crossed by
 * an ascending stroke. It reads as progress (the steps) and as a connection
 * or path (the stroke) — learning and advancement, which is what the brand is
 * about. Built from primitives so it stays crisp from a 16px favicon to a
 * footer lockup, with no raster asset to request.
 *
 * `currentColor` is used for the stroke so the mark inherits the surrounding
 * text colour in both themes.
 */

interface LogoMarkProps {
  className?: string;
  /** Renders flat in a single colour, for favicons and print. */
  monochrome?: boolean;
}

export function LogoMark({ className, monochrome = false }: LogoMarkProps) {
  const gradientId = monochrome ? undefined : 'nagis-mark-gradient';

  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      {!monochrome && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f66f6" />
            <stop offset="55%" stopColor="#7c5cf0" />
            <stop offset="100%" stopColor="#0e9f8f" />
          </linearGradient>
        </defs>
      )}

      {/* Container */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="11"
        fill={monochrome ? 'currentColor' : `url(#${gradientId})`}
      />

      {/* Rising stair: three bars of increasing height. */}
      <g fill={monochrome ? 'none' : '#ffffff'} opacity={monochrome ? 0 : 1}>
        <rect x="10" y="23.5" width="4.5" height="7" rx="1.5" />
        <rect x="17.75" y="18" width="4.5" height="12.5" rx="1.5" />
        <rect x="25.5" y="11.5" width="4.5" height="19" rx="1.5" />
      </g>

      {/* Ascending stroke across the stair. */}
      <path
        d="M10.5 21.5 L19.5 15 L29 8.5"
        fill="none"
        stroke={monochrome ? 'none' : '#ffffff'}
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Node at the apex. */}
      <circle cx="29" cy="8.5" r="2.75" fill={monochrome ? 'none' : '#ffffff'} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Size of the mark and wordmark together. */
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark, leaving only the mark. */
  markOnly?: boolean;
  /** Force the wordmark colour (used on dark footers). */
  tone?: 'default' | 'inverted';
}

const SIZES = {
  sm: { mark: 'h-7 w-7', text: 'text-base', tracking: 'tracking-[-0.02em]' },
  md: { mark: 'h-9 w-9', text: 'text-xl', tracking: 'tracking-[-0.025em]' },
  lg: { mark: 'h-12 w-12', text: 'text-3xl', tracking: 'tracking-[-0.03em]' },
} as const;

/**
 * Full lockup: mark plus wordmark.
 *
 * The apostrophe in "NAG'IS" is rendered as a modifier letter (U+02BC) rather
 * than a typewriter quote, which is the correct character for the Qaraqalpaq
 * Latin digraph and stops browsers from treating it as a quotation mark.
 */
export function Logo({ className, size = 'md', markOnly = false, tone = 'default' }: LogoProps) {
  const dimensions = SIZES[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={dimensions.mark} />
      {!markOnly && (
        <span
          className={cn(
            'font-display font-extrabold',
            dimensions.text,
            dimensions.tracking,
            tone === 'inverted' ? 'text-white' : 'text-heading',
          )}
        >
          NAG{'ʼ'}IS
        </span>
      )}
      <span className="sr-only">NAG{'ʼ'}IS — onlayn IT bilim beriw platformasi</span>
    </span>
  );
}
