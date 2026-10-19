import Link from 'next/link';
import { MapPin, Mail } from 'lucide-react';
import type { CategoryDto } from '@nagis/shared-types';
import { t } from '@/i18n';
import { Logo } from '@/components/brand/Logo';

/**
 * Site footer.
 *
 * Every link points at a route that exists. Nothing here is a placeholder:
 * the legal pages and the certificate verifier are real routes, and the
 * category links carry a working catalog filter.
 */
export function Footer({ categories }: { categories: CategoryDto[] }) {
  const year = new Date().getFullYear();
  // Only the first eight, so the column stays a readable length.
  const shown = categories.slice(0, 8);

  return (
    <footer className="mt-24 border-t border-hairline bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand + contact */}
          <div className="lg:col-span-2">
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t.footer.about}</p>

            <div className="mt-6 space-y-2.5">
              <p className="flex items-center gap-2.5 text-sm text-muted">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                {t.footer.location}
              </p>
              <a
                href="mailto:salem@nagis.uz"
                className="flex items-center gap-2.5 text-sm text-muted transition-colors hover:text-accent-600"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                salem@nagis.uz
              </a>
            </div>
          </div>

          <FooterColumn title={t.footer.sections.platform}>
            <FooterLink href="/courses">{t.footer.links.courses}</FooterLink>
            <FooterLink href="/about">{t.footer.links.about}</FooterLink>
            <FooterLink href="/about#instructors">{t.footer.links.instructors}</FooterLink>
            <FooterLink href="/verify">{t.footer.links.verifyCertificate}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.sections.categories}>
            {shown.map((category) => (
              <FooterLink
                key={category.id}
                href={`/courses?category=${encodeURIComponent(category.slug)}`}
              >
                {category.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t.footer.sections.support}>
            <FooterLink href="/about#faq">{t.footer.links.faq}</FooterLink>
            <FooterLink href="/about#contact">{t.footer.links.contact}</FooterLink>
            <FooterLink href="/terms">{t.footer.links.terms}</FooterLink>
            <FooterLink href="/privacy">{t.footer.links.privacy}</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-faint">{t.footer.rights(year)}</p>
          <p className="text-xs text-faint">{t.footer.builtIn}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-heading">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted transition-colors hover:text-accent-600"
      >
        {children}
      </Link>
    </li>
  );
}
