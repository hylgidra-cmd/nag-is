import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { t } from '@/i18n';
import { getCurrentUser } from '@/lib/api/server';
import { Card } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ProfileForm, PasswordForm } from '@/components/dashboard/SettingsForms';

export const metadata: Metadata = { title: t.dashboard.settings.title };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  // The layout already redirects anonymous visitors; this keeps the type
  // narrow and covers a session expiring between the two reads.
  if (!user) redirect('/login?next=/dashboard/settings');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.dashboard.settings.title}</h1>
        <p className="mt-2 text-base text-muted">{t.dashboard.settings.subtitle}</p>
      </header>

      <ProfileForm user={user} />

      <PasswordForm />

      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.dashboard.settings.appearanceTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.dashboard.settings.appearanceSubtitle}</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.dashboard.settings.languageTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.dashboard.settings.languageSubtitle}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </Card>
    </div>
  );
}
