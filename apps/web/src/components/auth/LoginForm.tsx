'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginInput } from '@nagis/shared-validation';
import type { AuthSession } from '@nagis/shared-types';
import { t, resolveValidationMessage } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Button } from '@/components/ui/Button';
import { Field, FormError, Input } from '@/components/ui/Field';
import { useSession } from './SessionProvider';

const FIELDS = ['email', 'password'] as const;

/**
 * Sign-in form.
 *
 * Validation runs through the same Zod schema the API uses, so the rules
 * cannot drift. On success the API sets HttpOnly cookies; nothing is stored
 * by this component beyond publishing the returned user into the session
 * context.
 *
 * `?next=` is honoured so a visitor sent here from a course page returns to
 * it. The value is checked to be a local path, otherwise it is an open
 * redirect an attacker could use to bounce users off-site.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useSession();
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setFormError('');
    try {
      const session = await api.post<AuthSession>('/auth/login', values);
      setUser(session.user);

      const next = safeNext(params.get('next'));
      // refresh() re-renders server components so the navbar and any
      // session-dependent page pick up the new cookies.
      router.refresh();
      router.push(next);
    } catch (error) {
      setFormError(applyApiError(error, setError, FIELDS));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />

      <Field
        label={t.auth.fields.email}
        error={fieldMessage(errors.email?.message)}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t.auth.fields.emailPlaceholder}
            aria-describedby={describedBy}
            invalid={invalid}
            {...register('email')}
          />
        )}
      </Field>

      <Field
        label={t.auth.fields.password}
        error={fieldMessage(errors.password?.message)}
        required
      >
        {({ id, describedBy, invalid }) => (
          <div className="relative">
            <Input
              id={id}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-describedby={describedBy}
              invalid={invalid}
              className="pr-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-pill text-faint transition-colors hover:bg-surface-muted hover:text-body"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? t.auth.fields.hidePassword : t.auth.fields.showPassword}
              </span>
            </button>
          </div>
        )}
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-accent-600 underline-offset-4 hover:underline"
        >
          {t.auth.login.forgotPassword}
        </Link>
      </div>

      <Button type="submit" size="lg" full loading={isSubmitting}>
        {isSubmitting ? t.auth.login.submitting : t.auth.login.submit}
      </Button>
    </form>
  );
}

/** Zod messages are machine codes; resolve them to Qaraqalpaq. */
function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

/**
 * Only same-origin, absolute-path redirects are allowed. Anything else
 * (`//evil.com`, `https://evil.com`, a protocol-relative URL) falls back to
 * the dashboard.
 */
function safeNext(value: string | null): string {
  if (!value) return '/dashboard';
  if (!value.startsWith('/')) return '/dashboard';
  if (value.startsWith('//')) return '/dashboard';
  return value;
}
