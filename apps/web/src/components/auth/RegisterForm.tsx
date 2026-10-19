'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { registerFormSchema, type RegisterFormInput } from '@nagis/shared-validation';
import type { AuthSession } from '@nagis/shared-types';
import { resolveValidationMessage, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, FormError, Input } from '@/components/ui/Field';
import { useSession } from './SessionProvider';

const FIELDS = ['fullName', 'email', 'password'] as const;

/**
 * Registration form.
 *
 * Uses `registerFormSchema`, which adds the confirm-password and
 * terms-acceptance checks on top of the API's `registerSchema`. Those two
 * fields are browser-only and are stripped before the request — the API never
 * receives them, and it would reject them if it did.
 *
 * The role is never sent: the API always creates a STUDENT.
 */
export function RegisterForm() {
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
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  async function onSubmit(values: RegisterFormInput) {
    setFormError('');
    try {
      // Only the three fields the API's schema accepts.
      const session = await api.post<AuthSession>('/auth/register', {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      setUser(session.user);

      const next = safeNext(params.get('next'));
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
        label={t.auth.fields.fullName}
        error={fieldMessage(errors.fullName?.message)}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="text"
            autoComplete="name"
            placeholder={t.auth.fields.fullNamePlaceholder}
            aria-describedby={describedBy}
            invalid={invalid}
            {...register('fullName')}
          />
        )}
      </Field>

      <Field label={t.auth.fields.email} error={fieldMessage(errors.email?.message)} required>
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
        hint={t.auth.passwordHint}
        required
      >
        {({ id, describedBy, invalid }) => (
          <div className="relative">
            <Input
              id={id}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t.auth.fields.passwordPlaceholder}
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

      <Field
        label={t.auth.fields.confirmPassword}
        error={fieldMessage(errors.confirmPassword?.message)}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
            {...register('confirmPassword')}
          />
        )}
      </Field>

      <Checkbox
        label={
          <>
            <Link
              href="/terms"
              className="font-medium text-accent-600 underline-offset-4 hover:underline"
            >
              {t.auth.register.termsLink}
            </Link>
            {' hám '}
            <Link
              href="/privacy"
              className="font-medium text-accent-600 underline-offset-4 hover:underline"
            >
              {t.auth.register.privacyLink}
            </Link>
            {'ni qabıl etemen'}
          </>
        }
        error={fieldMessage(errors.acceptTerms?.message)}
        {...register('acceptTerms')}
      />

      <Button type="submit" size="lg" full loading={isSubmitting}>
        {isSubmitting ? t.auth.register.submitting : t.auth.register.submit}
      </Button>
    </form>
  );
}

function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

function safeNext(value: string | null): string {
  if (!value) return '/dashboard';
  if (!value.startsWith('/')) return '/dashboard';
  if (value.startsWith('//')) return '/dashboard';
  return value;
}
