import { Info } from 'lucide-react';
import { formatDateLong, t } from '@/i18n';
import { Card } from '@/components/ui/primitives';

interface LegalSection {
  title: string;
  body: string;
}

/**
 * Shared layout for the terms and privacy pages.
 *
 * Both carry a visible notice that the text is a draft pending legal review.
 * Presenting unreviewed policy text as final would be worse than saying so.
 */
export function LegalPage({
  title,
  lead,
  sections,
  /** When the copy was last edited. Build date is not used — it would imply
   *  the text changed whenever the site was redeployed. */
  updatedAt,
}: {
  title: string;
  lead: string;
  sections: readonly LegalSection[];
  updatedAt: string;
}) {
  return (
    <div className="container-page max-w-3xl py-14 sm:py-20">
      <header>
        <h1 className="text-display-md">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{lead}</p>
        <p className="mt-3 text-xs text-faint">
          {t.legal.updatedAt}: {formatDateLong(updatedAt)}
        </p>
      </header>

      <Card className="mt-8 flex items-start gap-3 p-4" tone="muted" elevation="none">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
        <p className="text-sm leading-relaxed text-muted">{t.legal.draftNotice}</p>
      </Card>

      <div className="mt-10 space-y-8">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="flex items-baseline gap-2.5 text-lg font-bold text-heading">
              <span aria-hidden="true" className="text-sm font-semibold text-faint">
                {index + 1}.
              </span>
              {section.title}
            </h2>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-body">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
