import type { Metadata } from 'next';
import { t } from '@/i18n';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/PasswordResetForms';

export const metadata: Metadata = { title: t.auth.forgot.title };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title={t.auth.forgot.title} subtitle={t.auth.forgot.subtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
