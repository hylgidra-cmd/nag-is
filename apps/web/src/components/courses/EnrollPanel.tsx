'use client';

import { useState } from 'react';
import { ArrowRight, BadgeCheck, Share2 } from 'lucide-react';
import { discountPercent, formatUzs, type CourseDetail } from '@nagis/shared-types';
import { formatDuration, t } from '@/i18n';
import { Badge, Card, Progress } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';
import { useSession } from '@/components/auth/SessionProvider';
import { EnrollButton } from './EnrollButton';
import { SaveCourseButton } from './SaveCourseButton';

/**
 * Purchase / enrolment panel on the course detail page.
 *
 * What it shows is driven entirely by API state:
 *  * already enrolled -> resume link plus real progress
 *  * free and signed in -> enrol action
 *  * paid -> purchase action, which is honest about the payment driver
 *  * anonymous -> sign-in prompt that returns here afterwards
 *
 * Free enrolment is live (POST /courses/:id/enroll). Purchase still needs the
 * orders endpoint, and EnrollButton says so instead of faking a success.
 */

export function EnrollPanel({ course }: { course: CourseDetail }) {
  const { isAuthenticated } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const discount = discountPercent(course.priceUzs, course.comparePriceUzs);
  const enrollment = course.viewerEnrollment;
  const isEnrolled = enrollment !== null && enrollment.status !== 'CANCELLED';

  async function share() {
    const url = `${window.location.origin}/courses/${course.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.errors.INTERNAL);
    }
  }

  return (
    <Card elevation="card" className="overflow-hidden">
      {/* ---- Price header ---- */}
      <div className="border-b border-hairline p-5">
        {course.isFree ? (
          <p className="text-display-sm text-[var(--color-success)]">{t.course.free}</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-display-sm text-heading">
              {formatUzs(course.priceUzs)}{' '}
              <span className="text-base font-medium text-muted">{t.course.currency}</span>
            </p>
            {course.comparePriceUzs !== null && (
              <span className="text-base text-faint line-through">
                {formatUzs(course.comparePriceUzs)}
              </span>
            )}
            {discount !== null && (
              <Badge tone="danger">{t.course.discount(discount)}</Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* ---- Primary action ---- */}
        {isEnrolled && enrollment ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-success)]">
              <BadgeCheck aria-hidden="true" className="h-4 w-4" />
              {enrollment.status === 'COMPLETED' ? t.course.completed : t.course.enrolled}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">
                  {t.dashboard.progressLabel(enrollment.progressPercent)}
                </span>
              </div>
              <Progress
                value={enrollment.progressPercent}
                tone={enrollment.status === 'COMPLETED' ? 'success' : 'accent'}
              />
            </div>

            <Button
              href={
                enrollment.lastLessonId
                  ? `/learn/${course.slug}/${enrollment.lastLessonId}`
                  : `/learn/${course.slug}`
              }
              variant="primary"
              size="lg"
              full
            >
              {enrollment.progressPercent > 0
                ? t.course.continueLearning
                : t.course.startLearning}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <Button
              href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
              variant="ink"
              size="lg"
              full
            >
              {course.isFree ? t.course.enrollFree : t.course.buy}
            </Button>
            <p className="text-center text-xs text-faint">{t.auth.requireAuth.description}</p>
          </div>
        ) : (
          /* Signed in, not enrolled. Free enrolment is live; the paid path
             still needs the orders endpoint, which EnrollButton states. */
          <EnrollButton course={course} />
        )}

        <FormError message={error} />

        {/* ---- Secondary actions ---- */}
        <div className="flex gap-2">
          <SaveCourseButton
            courseId={course.id}
            courseSlug={course.slug}
            initialSaved={course.viewerSaved}
          />

          <Button variant="secondary" size="sm" full onClick={() => void share()}>
            <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
            {copied ? t.course.linkCopied : t.course.share}
          </Button>
        </div>

        {/* ---- Facts ---- */}
        <dl className="space-y-2.5 border-t border-hairline pt-4 text-sm">
          <Fact label={t.course.duration} value={formatDuration(course.durationMinutes)} />
          <Fact label={t.catalog.levelLabel} value={t.course.level[course.level]} />
          <Fact label={t.course.lessonsLabel} value={String(course.lessonCount)} />
          <Fact label={t.course.language} value={t.course.languageKaa} />
          {course.enrollmentCount > 0 && (
            <Fact label={t.course.studentsLabel} value={String(course.enrollmentCount)} />
          )}
        </dl>
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-heading">{value}</dd>
    </div>
  );
}
