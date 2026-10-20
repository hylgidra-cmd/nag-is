import type { Metadata } from 'next';
import { t } from '@/i18n';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: t.legal.terms.title,
  description: t.legal.terms.lead,
  robots: { index: true, follow: true },
};

/** Last edited when this copy was written, not when the site was built. */
const UPDATED_AT = '2026-10-20';

export default function TermsPage() {
  return (
    <LegalPage
      title={t.legal.terms.title}
      lead={t.legal.terms.lead}
      sections={t.legal.terms.sections}
      updatedAt={UPDATED_AT}
    />
  );
}
