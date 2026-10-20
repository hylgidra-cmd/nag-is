import { cn } from '@/lib/cn';

/**
 * The NAG'IS mark.
 *
 * Geometry: a rising stair of three bars inside a rounded square, crossed by
 * an ascending stroke. It reads as progress (the steps) and as a path or
 * connection (the stroke) — learning and advancement, which is what the brand
 * is about.
 *
 * The brand gradient is a **CSS background on the wrapper**, not an SVG
 * `<linearGradient>` referenced by `url(#id)`. That is deliberate: the page
 * renders the logo several times (mobile navbar, desktop navbar, footer), and
 * a shared SVG gradient id means duplicate ids in one document. `url(#id)`
 * resolves to the first match in document order — which was inside the
 * `lg:hidden` mobile logo, and a gradient in a `display:none` subtree does not
 * paint, so the visible desktop mark rendered with no fill at all.
 *
 * CSS gradients have no id, so no collision is possible however many times
 * the mark appears.
 */

const BRAND_GRADIENT = 'linear-gradient(135deg, #2f66f6 0%, #7c5cf0 55%, #0e9f8f 100%)';

interface LogoMarkProps {
  className?: string;
  /** Flat single colour, for print and high-contrast contexts. */
  monochrome?: boolean;
}

export function LogoMark({ className, monochrome = false }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 overflow-hidden rounded-[27.5%]', className)}
      style={
        monochrome
          ? { backgroundColor: 'currentColor' }
          : { backgroundImage: BRAND_GRADIENT }
      }
    >
      {/* Only the white foreground; the tile behind it is the CSS gradient. */}
      <svg viewBox="0 0 40 40" role="img" focusable="false" className="h-full w-full">
        {/* Rising stair: three bars of increasing height. */}
        <g fill="#ffffff">
          <rect x="10" y="23.5" width="4.5" height="7" rx="1.5" />
          <rect x="17.75" y="18" width="4.5" height="12.5" rx="1.5" />
          <rect x="25.5" y="11.5" width="4.5" height="19" rx="1.5" />
        </g>

        {/* Ascending stroke across the stair. */}
        <path
          d="M10.5 21.5 L19.5 15 L29 8.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Node at the apex. */}
        <circle cx="29" cy="8.5" r="2.75" fill="#ffffff" />
      </svg>
    </span>
  );
}

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark, leaving only the mark. */
  markOnly?: boolean;
  /** Force the wordmark colour (used on dark surfaces). */
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
 * The apostrophe is a modifier letter (U+02BC), which is the correct
 * character for the Qaraqalpaq Latin digraph — a typewriter quote would be
 * treated as punctuation and could be rewritten by smart-quote tooling.
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
          aria-hidden="true"
        >
          NAG{'ʼ'}IS
        </span>
      )}
      <span className="sr-only">NAG{'ʼ'}IS — onlayn IT bilim beriw platformasi</span>
    </span>
  );
}
