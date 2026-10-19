import type { Metadata } from 'next';
import { BadgeCheck, ShieldX } from 'lucide-react';
import { t, formatDateLong, formatDuration } from '@/i18n';
import { verifyCertificate } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { Card, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { VerifyForm } from '@/components/certificates/VerifyForm';

export const metadata: Metadata = { title: t.verify.title };
export const dynamic = 'force-dynamic';

/**
 * Public certificate verification.
 *
 * The code is read from the query string so a result is shareable. The API
 * returns `valid: false` rather than an error for an unknown code, so both
 * outcomes render as a clear answer.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const trimmed = code?.trim().toUpperCase() ?? '';

  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      <header className="text-center">
        <h1 className="text-display-sm sm:text-display-md">{t.verify.title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted">
          {t.verify.subtitle}
        </p>
      </header>

      <div className="mt-8">
        <VerifyForm initialCode={trimmed} />
      </div>

      {trimmed && <Result code={trimmed} />}
    </div>
  );
}

async function Result({ code }: { code: string }) {
  const result = await settle(() => verifyCertificate(code));

  if (!result.ok) {
    return (
      <div className="mt-8">
        <StateBlock tone="danger" title={t.errorPage.title} description={result.error} />
      </div>
    );
  }

  const { valid, certificate } = result.data;

  if (!valid || !certificate) {
    return (
      <div className="mt-8">
        <StateBlock
          tone="danger"
          icon={<ShieldX className="h-5 w-5" />}
          title={t.verify.invalidTitle}
          description={t.verify.invalidBody}
        />
      </div>
    );
  }

  return (
    <Card className="mt-8 overflow-hidden" elevation="card">
      <div className="flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--color-success)_30%,transparent)] bg-[var(--color-success-soft)] px-5 py-3.5">
        <BadgeCheck aria-hidden="true" className="h-5 w-5 text-[var(--color-success)]" />
        <div>
          <p className="text-sm font-bold text-[var(--color-success)]">{t.verify.validTitle}</p>
          <p className="text-xs text-[var(--color-success)]/85">{t.verify.validBody}</p>
        </div>
      </div>

      <div className="relative bg-ink-900 p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.17]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 100% at 85% 0%, #2f66f6 0%, transparent 60%)',
          }}
        />
        <div className="relative">
          <LogoMark className="h-9 w-9" />
          <h2 className="mt-4 font-display text-xl font-bold leading-snug text-white">
            {certificate.courseTitle}
          </h2>
          <p className="mt-2 text-sm text-ink-200">{certificate.recipientName}</p>
        </div>
      </div>

      <dl className="space-y-2.5 p-5 text-sm">
        <Row label={t.verify.recipient} value={certificate.recipientName} />
        <Row label={t.verify.course} value={certificate.courseTitle} />
        <Row label={t.verify.instructor} value={certificate.instructorName} />
        <Row label={t.verify.issuedAt} value={formatDateLong(certificate.issuedAt)} />
        <Row label={t.verify.duration} value={formatDuration(certificate.durationMinutes)} />
        <Row label={t.dashboard.certificates.code} value={certificate.verificationCode} mono />
      </dl>

      <div className="border-t border-hairline p-5">
        <Button href={`/courses/${certificate.courseSlug}`} variant="secondary" size="sm">
          {t.course.goToCourse}
        </Button>
      </div>
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd
        className={
          mono
            ? 'text-right font-mono text-sm font-semibold tracking-wide text-heading'
            : 'text-right font-medium text-heading'
        }
      >
        {value}
      </dd>
    </div>
  );
}
