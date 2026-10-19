'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { COURSE_LEVELS, COURSE_STATUSES, type CategoryDto, type CourseDetail } from '@nagis/shared-types';
import { z } from 'zod';
import { courseCreateSchema } from '@nagis/shared-validation';
import { resolveValidationMessage, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/primitives';
import { Field, FormError, FormSuccess, Input, Select, Textarea } from '@/components/ui/Field';

function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

/** Bullet lists are edited as one-per-line textareas and split on submit. */
function toLines(values: string[]): string {
  return values.join('\n');
}
function fromLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** `slugify` for the "generate from title" helper. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    // Qaraqalpaq Latin letters are transliterated to their ASCII base, since
    // a slug must match ^[a-z0-9]+(-[a-z0-9]+)*$.
    .replace(/[áä]/g, 'a')
    .replace(/[ǵ]/g, 'g')
    .replace(/[ń]/g, 'n')
    .replace(/[óö]/g, 'o')
    .replace(/[úü]/g, 'u')
    .replace(/[ı]/g, 'i')
    .replace(/[`'’‘]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * The form's own schema.
 *
 * Built from `courseCreateSchema` so the rules stay shared with the API, but
 * the three bullet lists are edited as newline-separated textareas, so they
 * are swapped for `*Text` strings and split on submit.
 *
 * Declaring ONE schema for the whole form matters: resolving against a
 * subset (via `.omit()`) while the form holds extra fields makes the resolver
 * and the form disagree about which field names exist.
 *
 * `instructorId` is omitted entirely — the API defaults it to the acting
 * administrator, and letting a form set it invites mis-attribution.
 */
const courseFormSchema = courseCreateSchema
  .omit({
    objectives: true,
    prerequisites: true,
    targetAudience: true,
    instructorId: true,
    promoVideoUrl: true,
  })
  .extend({
    objectivesText: z.string().default(''),
    prerequisitesText: z.string().default(''),
    audienceText: z.string().default(''),
  });

type FormInput = z.input<typeof courseFormSchema>;
type FormOutput = z.output<typeof courseFormSchema>;

/**
 * Course create/edit form.
 *
 * This is what makes the platform administrable without code changes: every
 * field a course needs is editable here, validated by the same Zod schema the
 * API uses, and submitted to `/admin/courses`.
 *
 * Publication is part of the form (`status`), so publishing is one save
 * rather than a separate privileged action.
 */
export function CourseForm({
  categories,
  course,
}: {
  categories: CategoryDto[];
  /** Present when editing; absent when creating. */
  course?: CourseDetail | undefined;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const isEdit = course !== undefined;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: course?.title ?? '',
      slug: course?.slug ?? '',
      summary: course?.summary ?? '',
      description: course?.description ?? '',
      categoryId: course?.category.id ?? categories[0]?.id ?? '',
      level: course?.level ?? 'BEGINNER',
      status: course?.status ?? 'DRAFT',
      priceUzs: course?.priceUzs ?? 0,
      comparePriceUzs: course?.comparePriceUzs ?? null,
      thumbnailUrl: course?.thumbnailUrl ?? '',
      language: course?.language ?? 'kaa',
      objectivesText: toLines(course?.objectives ?? []),
      prerequisitesText: toLines(course?.prerequisites ?? []),
      audienceText: toLines(course?.targetAudience ?? []),
    },
  });

  async function onSubmit(values: FormOutput) {
    setFormError('');
    setSuccess('');

    const payload = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      description: values.description,
      categoryId: values.categoryId,
      level: values.level,
      status: values.status,
      priceUzs: Number(values.priceUzs),
      comparePriceUzs:
        values.comparePriceUzs === null || String(values.comparePriceUzs) === ''
          ? null
          : Number(values.comparePriceUzs),
      thumbnailUrl: values.thumbnailUrl || null,
      language: values.language,
      objectives: fromLines(values.objectivesText),
      prerequisites: fromLines(values.prerequisitesText),
      targetAudience: fromLines(values.audienceText),
    };

    try {
      if (isEdit && course) {
        await api.patch<CourseDetail>(`/admin/courses/${course.id}`, payload);
        setSuccess(t.admin.courses.form.updated);
        router.refresh();
      } else {
        const created = await api.post<CourseDetail>('/admin/courses', payload);
        setSuccess(t.admin.courses.form.created);
        router.push(`/admin/courses/${created.id}`);
      }
    } catch (error) {
      setFormError(
        applyApiError(error, setError, [
          'title',
          'slug',
          'summary',
          'description',
          'categoryId',
          'priceUzs',
          'comparePriceUzs',
        ] as const),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />
      <FormSuccess message={success} />

      {/* ---- Basics ---- */}
      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.admin.courses.form.basicsTitle}</h2>

        <Field
          label={t.admin.courses.form.titleLabel}
          error={fieldMessage(errors.title?.message)}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('title')} />
          )}
        </Field>

        <Field
          label={t.admin.courses.form.slugLabel}
          hint={t.admin.courses.form.slugHint}
          error={fieldMessage(errors.slug?.message)}
          required
        >
          {({ id, describedBy, invalid }) => (
            <div className="flex gap-2">
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                className="font-mono"
                {...register('slug')}
              />
              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                onClick={() =>
                  setValue('slug', slugify(getValues('title')), { shouldValidate: true })
                }
              >
                {t.admin.courses.form.slugGenerate}
              </Button>
            </div>
          )}
        </Field>

        <Field
          label={t.admin.courses.form.summaryLabel}
          hint={t.admin.courses.form.summaryHint}
          error={fieldMessage(errors.summary?.message)}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={2}
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('summary')}
            />
          )}
        </Field>

        <Field
          label={t.admin.courses.form.descriptionLabel}
          hint={t.admin.courses.form.descriptionHint}
          error={fieldMessage(errors.description?.message)}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={8}
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('description')}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label={t.admin.courses.form.categoryLabel}
            error={fieldMessage(errors.categoryId?.message)}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('categoryId')}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t.admin.courses.form.levelLabel}>
            {({ id }) => (
              <Select id={id} {...register('level')}>
                {COURSE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t.course.level[level]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t.admin.courses.form.statusLabel} hint={t.admin.courses.form.publishHint}>
            {({ id }) => (
              <Select id={id} {...register('status')}>
                {COURSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t.course.status[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      {/* ---- Pricing ---- */}
      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.admin.courses.form.pricingTitle}</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.admin.courses.form.priceLabel}
            hint={t.admin.courses.form.priceHint}
            error={fieldMessage(errors.priceUzs?.message)}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('priceUzs')}
              />
            )}
          </Field>

          <Field
            label={t.admin.courses.form.comparePriceLabel}
            hint={t.admin.courses.form.comparePriceHint}
            error={fieldMessage(errors.comparePriceUzs?.message)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('comparePriceUzs')}
              />
            )}
          </Field>
        </div>
      </Card>

      {/* ---- Media ---- */}
      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.admin.courses.form.mediaTitle}</h2>
        <Field
          label={t.admin.courses.form.thumbnailLabel}
          error={fieldMessage(errors.thumbnailUrl?.message)}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="url"
              placeholder="https://..."
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('thumbnailUrl')}
            />
          )}
        </Field>
      </Card>

      {/* ---- Content lists ---- */}
      <Card className="space-y-5 p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">{t.admin.courses.form.contentTitle}</h2>

        <Field
          label={t.admin.courses.form.objectivesLabel}
          hint={t.admin.courses.form.objectivesHint}
        >
          {({ id }) => <Textarea id={id} rows={5} {...register('objectivesText')} />}
        </Field>

        <Field
          label={t.admin.courses.form.prerequisitesLabel}
          hint={t.admin.courses.form.objectivesHint}
        >
          {({ id }) => <Textarea id={id} rows={3} {...register('prerequisitesText')} />}
        </Field>

        <Field label={t.admin.courses.form.audienceLabel} hint={t.admin.courses.form.objectivesHint}>
          {({ id }) => <Textarea id={id} rows={3} {...register('audienceText')} />}
        </Field>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? t.common.saving : isEdit ? t.common.save : t.common.create}
        </Button>
        <Button href="/admin/courses" variant="secondary" size="lg">
          {t.common.cancel}
        </Button>
        {isEdit && course && course.status === 'PUBLISHED' && (
          <Button href={`/courses/${course.slug}`} variant="ghost" size="lg">
            {t.common.view}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Re-exported so the curriculum editor can share the helper. */
export { slugify };

export type { FormOutput as CourseFormValues };
