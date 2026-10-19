'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CERTIFICATE_CODE_PATTERN } from '@nagis/shared-validation';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

/**
 * Certificate code entry.
 *
 * Submitting navigates with `?code=`, so the server component renders the
 * result and the outcome is a shareable URL rather than transient client
 * state. The format is checked here only to catch typos early; the API is the
 * authority on whether a code exists.
 */
export function VerifyForm({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalised = code.trim().toUpperCase();

    if (!normalised) {
      setError(t.validation.required);
      return;
    }

    if (!CERTIFICATE_CODE_PATTERN.test(normalised)) {
      setError(t.validation['certificate.codeInvalid']);
      return;
    }

    setError(undefined);
    startTransition(() => {
      router.push(`/verify?code=${encodeURIComponent(normalised)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Field label={t.verify.codeLabel} error={error}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder={t.verify.codePlaceholder}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={describedBy}
              invalid={invalid}
              className="font-mono tracking-wide"
            />
          )}
        </Field>
      </div>

      <Button type="submit" size="lg" loading={isPending} className="sm:mt-7">
        <Search aria-hidden="true" className="h-4 w-4" />
        {isPending ? t.verify.submitting : t.verify.submit}
      </Button>
    </form>
  );
}
