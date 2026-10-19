'use client';

import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Form field primitives.
 *
 * Each control wires its own label, description and error together with
 * `aria-describedby` / `aria-invalid`, so a validation message is announced
 * rather than only coloured red. Error text always appears alongside the
 * icon and the red border — colour is never the only signal.
 */

interface FieldShellProps {
  label: string;
  /** Qaraqalpaq error message, already resolved from its code. */
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-heading">
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-faint">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-[var(--color-danger)]"
        >
          <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const controlClasses = (invalid: boolean) =>
  cn(
    'w-full rounded-card border bg-surface px-3.5 text-sm text-body',
    'transition-[border-color,box-shadow] duration-200',
    'placeholder:text-faint',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
    invalid
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]'
      : 'border-hairline focus:border-accent-400 focus:ring-[color-mix(in_srgb,var(--color-accent-500)_22%,transparent)]',
  );

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses(invalid), 'h-11', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid = false, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses(invalid), 'resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid = false, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlClasses(invalid),
        'h-11 cursor-pointer appearance-none bg-no-repeat pr-10',
        className,
      )}
      style={{
        // Inline chevron, so there is no icon request and it follows the
        // text colour in both themes.
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%238597ad' stroke-width='1.75' stroke-linecap='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '1.125rem',
      }}
      {...props}
    >
      {children}
    </select>
  );
});

/** Accessible checkbox with its label as the hit target. */
export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    label: React.ReactNode;
    error?: string | undefined;
  }
>(function Checkbox({ className, label, error, ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-hairline text-accent-600',
            'focus:ring-2 focus:ring-accent-400 focus:ring-offset-0',
            error && 'border-[var(--color-danger)]',
          )}
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-body">
          {label}
        </label>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-[var(--color-danger)]"
        >
          <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

/** Banner for form-level (non-field) errors, e.g. INVALID_CREDENTIALS. */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-card border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[var(--color-danger-soft)] px-4 py-3"
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]"
      />
      <p className="text-sm font-medium text-[var(--color-danger)]">{message}</p>
    </div>
  );
}

/** Banner for a successful, non-navigating action. */
export function FormSuccess({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-card border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-soft)] px-4 py-3"
    >
      <p className="text-sm font-medium text-[var(--color-success)]">{message}</p>
    </div>
  );
}
