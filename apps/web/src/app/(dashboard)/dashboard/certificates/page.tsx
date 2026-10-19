import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, ServerCrash } from 'lucide-react';
import { formatDateLong, formatDuration, t } from '@/i18n';
import { getMyCertificates } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { Card, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = { title: t.dashboard.certificates.title };
export const dynamic = 'force-dynamic';

/**
 * Certificates the student has earned.
 *
 * Each card shows the snapshotted values stored on the certificate at issue
 * time, so a later course rename or price change cannot alter what was
 * awarded. The verification code links to the public verifier.
 */
export default async function CertificatesPage() {
  const result = await settle(getMyCertificates);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.dashboard.certificates.title}</h1>
        <p className="mt-2 text-base text-muted">{t.dashboard.certificates.subtitle}</p>
      </header>

      {!result.ok ? (
        <StateBlock
          tone="danger"
          icon={<ServerCrash className="h-5 w-5" />}
          title={t.errorPage.title}
          description={result.error}
        />
      ) : result.data.length === 0 ? (
        <StateBlock
          icon={<Award className="h-5 w-5" />}
          title={t.dashboard.certificates.empty.title}
          description={t.dashboard.certificates.empty.description}
          action={
            <Button href="/courses" variant="primary">
              {t.dashboard.certificates.empty.action}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {result.data.map((certificate, index) => (
            <Reveal as="li" key={certificate.id} delay={stagger(index, 0.06)}>
              <Card className="overflow-hidden" elevation="card">
                {/* Certificate face */}
                <div className="relative border-b border-hairline bg-ink-900 p-6">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.17]"
                    style={{
                      backgroundImage:
                        'radial-gradient(ellipse 60% 100% at 85% 0%, #2f66f6 0%, transparent 60%), radial-gradient(ellipse 50% 100% at 10% 100%, #7c5cf0 0%, transparent 55%)',
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <LogoMark className="h-9 w-9" />
                      <Award aria-hidden="true" className="h-6 w-6 text-accent-300" />
                    </div>

                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">
                      {t.dashboard.certificates.title}
                    </p>
                    <h2 className="mt-1.5 line-clamp-2 font-display text-lg font-bold leading-snug text-white">
                      {certificate.courseTitle}
                    </h2>
                    <p className="mt-3 text-sm text-ink-200">
                      {t.verify.recipient}:{' '}
                      <span className="font-semibold text-white">
                        {certificate.recipientName}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 p-5">
                  <dl className="space-y-2 text-sm">
                    <Row
                      label={t.dashboard.certificates.issuedAt}
                      value={formatDateLong(certificate.issuedAt)}
                    />
                    <Row label={t.verify.instructor} value={certificate.instructorName} />
                    <Row
                      label={t.dashboard.certificates.courseDuration}
                      value={formatDuration(certificate.durationMinutes)}
                    />
                  </dl>

                  <div className="rounded-card border border-hairline bg-surface-muted px-3.5 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                      {t.dashboard.certificates.code}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-heading">
                      {certificate.verificationCode}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      href={`/verify?code=${encodeURIComponent(certificate.verificationCode)}`}
                      variant="secondary"
                      size="sm"
                      full
                    >
                      {t.dashboard.certificates.verify}
                    </Button>
                    <Button
                      href={`/courses/${certificate.courseSlug}`}
                      variant="ghost"
                      size="sm"
                      full
                    >
                      {t.course.goToCourse}
                    </Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted">
        {t.verify.subtitle}{' '}
        <Link
          href="/verify"
          className="font-medium text-accent-600 underline-offset-4 hover:underline"
        >
          {t.verify.title}
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-heading">{value}</dd>
    </div>
  );
}
