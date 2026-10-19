import { forwardRef } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The one button in the system.
 *
 * Renders as a `<button>` or, when `href` is given, as a Next `<Link>` that
 * looks identical. That matters for accessibility: navigation should be a
 * link (middle-clickable, focusable, announced as a link) and an action
 * should be a button, without the two drifting apart visually.
 */

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium rounded-pill',
    'transition-[transform,box-shadow,background-color,border-color,color]',
    'duration-200 ease-[var(--ease-out-soft)]',
    'disabled:pointer-events-none disabled:opacity-55',
    // The lift is transform-only, so it never triggers layout.
    'active:translate-y-px motion-reduce:active:translate-y-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent-600 text-white shadow-subtle',
          'hover:bg-accent-700 hover:shadow-card',
          'focus-visible:outline-accent-600',
        ],
        secondary: [
          'bg-surface text-heading border border-hairline shadow-subtle',
          'hover:bg-surface-muted hover:border-ink-300',
        ],
        ghost: ['text-body hover:bg-surface-muted hover:text-heading'],
        subtle: ['bg-surface-muted text-heading hover:bg-ink-100 dark:hover:bg-ink-700'],
        danger: ['bg-[var(--color-danger)] text-white hover:brightness-95 shadow-subtle'],
        /** Dark pill used on light hero sections. */
        ink: ['bg-ink-900 text-white shadow-card hover:bg-ink-800'],
        /** For use on a dark/navy background. */
        inverted: ['bg-white text-ink-900 shadow-card hover:bg-ink-50'],
        link: ['text-accent-600 underline-offset-4 hover:underline p-0 h-auto'],
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
      full: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

interface CommonProps extends ButtonVariants {
  className?: string;
  /** Replaces the label with a spinner and blocks interaction. */
  loading?: boolean;
  children?: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof CommonProps | 'href'> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const { className, variant, size, full, loading, children, ...rest } = props;
    const classes = cn(buttonVariants({ variant, size, full }), className);

    if (rest.href !== undefined) {
      const { href, ...linkProps } = rest as ButtonAsLink;
      return (
        <Link
          ref={ref}
          href={href}
          className={classes}
          {...(loading ? { 'aria-busy': true } : {})}
          {...linkProps}
        >
          {loading ? <Spinner /> : children}
        </Link>
      );
    }

    const { disabled, type, ...buttonProps } = rest as ButtonAsButton;

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...buttonProps}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

function Spinner() {
  return <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />;
}

export { buttonVariants };
