'use client';

import { useEffect } from 'react';
import { ServerCrash } from 'lucide-react';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/primitives';

/**
 * Error boundary for public routes.
 *
 * Shows Qaraqalpaq copy and a retry that re-runs the failed render. The raw
 * error is logged to the console for developers but never displayed: it can
 * contain internal paths and query shapes.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[nagis] route error', error);
  }, [error]);

  return (
    <div className="container-page py-24">
      <StateBlock
        tone="danger"
        icon={<ServerCrash className="h-5 w-5" />}
        title={t.errorPage.title}
        description={t.errorPage.description}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={reset} variant="primary">
              {t.errorPage.retry}
            </Button>
            <Button href="/" variant="secondary">
              {t.errorPage.home}
            </Button>
          </div>
        }
      />
      {error.digest && (
        <p className="mt-4 text-center font-mono text-xs text-faint">#{error.digest}</p>
      )}
    </div>
  );
}
