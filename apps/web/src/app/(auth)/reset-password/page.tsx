import { Suspense } from 'react';
import type { Metadata } from 'next';
import { t } from '@/i18n';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/PasswordResetForms';

export const metadata: Metadata = { title: t.auth.reset.title };

export default function ResetPasswordPage() {
  return (
    <AuthShell title={t.auth.reset.title} subtitle={t.auth.reset.subtitle}>
      {/* Reads the ?token= query parameter. */}
      <Suspense fallback={<div className="skeleton h-64 rounded-card" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
