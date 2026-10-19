import { SearchX } from 'lucide-react';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/primitives';

/**
 * Shown when a course slug does not resolve, or resolves to a draft this
 * viewer is not allowed to see (the API reports both as 404 so drafts cannot
 * be probed by slug).
 */
export default function CourseNotFound() {
  return (
    <div className="container-page py-24">
      <StateBlock
        icon={<SearchX className="h-5 w-5" />}
        title={t.course.notFound.title}
        description={t.course.notFound.description}
        action={
          <Button href="/courses" variant="primary">
            {t.course.notFound.action}
          </Button>
        }
      />
    </div>
  );
}
