'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock } from 'lucide-react';
import type { CourseDetail, EnrollmentDto } from '@nagis/shared-types';
import { t } from '@/i18n';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';

/**
 * Enrolment action.
 *
 * Free courses enrol through `POST /courses/:id/enroll`, which is live. Paid
 * courses need an order first, and `POST /api/v1/orders` does not exist yet —
 * so the paid path is a disabled button that names the missing endpoint
 * rather than a control that silently fails or fakes success.
 *
 * The server is authoritative either way: it answers 402 for a paid course
 * with no completed payment, so even if this button were wrong the enrolment
 * would still be refused.
 */
const PENDING_ORDER_ENDPOINT = 'POST /api/v1/orders';

export function EnrollButton({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function enroll() {
    setPending(true);
    setError('');
    try {
      const enrollment = await api.post<EnrollmentDto>(`/courses/${course.id}/enroll`);
      router.refresh();

      // Go straight into the first lesson when the API resolved one.
      if (enrollment.nextLesson) {
        router.push(`/learn/${course.slug}/${enrollment.nextLesson.id}`);
      }
    } catch (caught) {
      if (isApiError(caught)) {
        // 401 means the session lapsed between page render and click.
        if (caught.isUnauthorized) {
          router.push(`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`);
          return;
        }
        setError(caught.localisedMessage);
      } else {
        setError(t.errors.INTERNAL);
      }
    } finally {
      setPending(false);
    }
  }

  // Paid course: the order endpoint is not built, so say so plainly.
  if (!course.isFree) {
    return (
      <div className="space-y-3">
        <Button variant="primary" size="lg" full disabled>
          <Lock aria-hidden="true" className="h-4 w-4" />
          {t.course.buy}
        </Button>
        <p className="rounded-card border border-dashed border-hairline bg-surface-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
          {t.errors.PAYMENT_PROVIDER_UNAVAILABLE}
          <span className="mt-1.5 block font-mono text-[11px] text-faint">
            {PENDING_ORDER_ENDPOINT}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        size="lg"
        full
        loading={pending}
        onClick={() => void enroll()}
      >
        {pending ? t.course.enrolling : t.course.enrollFree}
        {!pending && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
      </Button>
      <FormError message={error} />
    </div>
  );
}
