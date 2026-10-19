'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PublicUser } from '@nagis/shared-types';
import {
  changePasswordFormSchema,
  updateProfileSchema,
  type ChangePasswordFormInput,
  type UpdateProfileInput,
} from '@nagis/shared-validation';
import { resolveValidationMessage, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Button } from '@/components/ui/Button';
import { Field, FormError, FormSuccess, Input, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/primitives';
import { useSession } from '@/components/auth/SessionProvider';

function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

/* ==========================================================================
 * Profile
 * ======================================================================== */

export function ProfileForm({ user }: { user: PublicUser }) {
  const router = useRouter();
  const { setUser } = useSession();
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      headline: user.headline ?? '',
      bio: user.bio ?? '',
    },
  });

  async function onSubmit(values: UpdateProfileInput) {
    setFormError('');
    setSuccess('');
    try {
      const updated = await api.patch<PublicUser>('/me', values);
      setUser(updated);
      setSuccess(t.dashboard.settings.profileSaved);
      // Re-render server components so the navbar picks up the new name.
      router.refresh();
    } catch (error) {
      setFormError(applyApiError(error, setError, ['fullName', 'headline', 'bio'] as const));
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-bold text-heading">{t.dashboard.settings.profileTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.dashboard.settings.profileSubtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <FormError message={formError} />
        <FormSuccess message={success} />

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
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('fullName')}
            />
          )}
        </Field>

        {/* Email is read-only: changing it needs a verification flow that
            does not exist yet, so the field states that plainly. */}
        <Field label={t.auth.fields.email} hint={t.dashboard.settings.emailReadonly}>
          {({ id }) => <Input id={id} type="email" value={user.email} readOnly disabled />}
        </Field>

        <Field label={t.dashboard.settings.headline} error={fieldMessage(errors.headline?.message)}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="text"
              placeholder={t.dashboard.settings.headlinePlaceholder}
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('headline')}
            />
          )}
        </Field>

        <Field label={t.dashboard.settings.bio} error={fieldMessage(errors.bio?.message)}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={4}
              placeholder={t.dashboard.settings.bioPlaceholder}
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('bio')}
            />
          )}
        </Field>

        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {isSubmitting ? t.common.saving : t.common.save}
        </Button>
      </form>
    </Card>
  );
}

/* ==========================================================================
 * Password
 * ======================================================================== */

/**
 * Changing the password revokes every session server-side, including this
 * one, so the form signs the user out afterwards instead of leaving them on a
 * page whose cookies are already dead.
 */
export function PasswordForm() {
  const router = useRouter();
  const { setUser } = useSession();
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ChangePasswordFormInput) {
    setFormError('');
    setSuccess('');
    try {
      await api.post<void>('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSuccess(t.dashboard.settings.passwordChanged);
      reset();

      // The API cleared the cookies; reflect that locally and send the user
      // to sign in again.
      setUser(null);
      setTimeout(() => {
        router.refresh();
        router.push('/login');
      }, 1500);
    } catch (error) {
      setFormError(
        applyApiError(error, setError, ['currentPassword', 'newPassword'] as const),
      );
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-bold text-heading">{t.dashboard.settings.passwordTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.dashboard.settings.passwordSubtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <FormError message={formError} />
        <FormSuccess message={success} />

        <Field
          label={t.auth.fields.currentPassword}
          error={fieldMessage(errors.currentPassword?.message)}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('currentPassword')}
            />
          )}
        </Field>

        <Field
          label={t.auth.fields.newPassword}
          error={fieldMessage(errors.newPassword?.message)}
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
              {...register('newPassword')}
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

        <Button type="submit" loading={isSubmitting}>
          {t.dashboard.settings.changePassword}
        </Button>
      </form>
    </Card>
  );
}
