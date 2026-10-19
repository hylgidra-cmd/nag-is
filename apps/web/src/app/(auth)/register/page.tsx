import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/i18n';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: t.meta.registerTitle };

export default function RegisterPage() {
  return (
    <AuthShell
      title={t.auth.register.title}
      subtitle={t.auth.register.subtitle}
      footer={
        <>
          {t.auth.register.haveAccount}{' '}
          <Link
            href="/login"
            className="font-medium text-accent-600 underline-offset-4 hover:underline"
          >
            {t.auth.register.loginLink}
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton h-96 rounded-card" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
