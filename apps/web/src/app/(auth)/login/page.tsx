import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/i18n';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: t.meta.loginTitle };

export default function LoginPage() {
  return (
    <AuthShell
      title={t.auth.login.title}
      subtitle={t.auth.login.subtitle}
      footer={
        <>
          {t.auth.login.noAccount}{' '}
          <Link
            href="/register"
            className="font-medium text-accent-600 underline-offset-4 hover:underline"
          >
            {t.auth.login.registerLink}
          </Link>
        </>
      }
    >
      {/* The form reads useSearchParams for ?next=, so it needs a boundary. */}
      <Suspense fallback={<div className="skeleton h-64 rounded-card" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
