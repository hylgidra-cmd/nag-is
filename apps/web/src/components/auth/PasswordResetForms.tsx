'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, MailCheck } from 'lucide-react';
import {
  forgotPasswordSchema,
  resetPasswordFormSchema,
  type ForgotPasswordInput,
  type ResetPasswordFormInput,
} from '@nagis/shared-validation';
import { resolveValidationMessage, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Button } from '@/components/ui/Button';
import { Field, FormError, Input } from '@/components/ui/Field';
import { StateBlock } from '@/components/ui/primitives';

function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

/* ==========================================================================
 * Request a reset link
 * ======================================================================== */

/**
 * The API always answers 202 here, whether or not the address is registered,
 * so this form shows the same confirmation either way. Reporting "no such
 * account" would turn the endpoint into an account-enumeration oracle.
 */
export function ForgotPasswordForm() {
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError('');
    try {
      await api.post<{ accepted: true }>('/auth/forgot-password', values);
      setSent(true);
    } catch (error) {
      setFormError(applyApiError(error, setError, ['email'] as const));
    }
  }

  if (sent) {
    return (
      <StateBlock
        icon={<MailCheck className="h-5 w-5" />}
        title={t.auth.forgot.successTitle}
        description={t.auth.forgot.successBody}
        action={
          <Button href="/login" variant="secondary">
            {t.auth.forgot.backToLogin}
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />

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

      <Button type="submit" size="lg" full loading={isSubmitting}>
        {isSubmitting ? t.auth.forgot.submitting : t.auth.forgot.submit}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent-600 underline-offset-4 hover:underline"
        >
          {t.auth.forgot.backToLogin}
        </Link>
      </p>
    </form>
  );
}

/* ==========================================================================
 * Set a new password
 * ======================================================================== */

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordFormInput) {
    setFormError('');
    try {
      await api.post<void>('/auth/reset-password', {
        token: values.token,
        password: values.password,
      });
      setDone(true);
    } catch (error) {
      setFormError(applyApiError(error, setError, ['password', 'token'] as const));
    }
  }

  // A link with no token cannot work, so say so rather than showing a form
  // that is guaranteed to fail.
  if (!token) {
    return (
      <StateBlock
        tone="danger"
        title={t.auth.reset.invalidTitle}
        description={t.auth.reset.invalidBody}
        action={
          <Button href="/forgot-password" variant="primary">
            {t.auth.reset.requestNew}
          </Button>
        }
      />
    );
  }

  if (done) {
    return (
      <StateBlock
        icon={<CheckCircle2 className="h-5 w-5" />}
        title={t.auth.reset.successTitle}
        description={t.auth.reset.successBody}
        action={
          <Button onClick={() => router.push('/login')} variant="primary">
            {t.auth.login.submit}
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />
      <input type="hidden" {...register('token')} />

      <Field
        label={t.auth.fields.newPassword}
        error={fieldMessage(errors.password?.message)}
        hint={t.auth.passwordHint}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
            {...register('password')}
          />
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
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
            {...register('confirmPassword')}
          />
        )}
      </Field>

      <Button type="submit" size="lg" full loading={isSubmitting}>
        {isSubmitting ? t.auth.reset.submitting : t.auth.reset.submit}
      </Button>
    </form>
  );
}
