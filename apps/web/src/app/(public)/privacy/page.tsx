import type { Metadata } from 'next';
import { t } from '@/i18n';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: t.legal.privacy.title,
  description: t.legal.privacy.lead,
  robots: { index: true, follow: true },
};

const UPDATED_AT = '2026-10-20';

export default function PrivacyPage() {
  return (
    <LegalPage
      title={t.legal.privacy.title}
      lead={t.legal.privacy.lead}
      sections={t.legal.privacy.sections}
      updatedAt={UPDATED_AT}
    />
  );
}
