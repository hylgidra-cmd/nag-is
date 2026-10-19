'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { CategoryDto } from '@nagis/shared-types';
import { z } from 'zod';
import { categoryUpsertSchema } from '@nagis/shared-validation';
import { resolveValidationMessage, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import { Badge, Card, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Field, FormError, FormSuccess, Input, Select, Textarea } from '@/components/ui/Field';
import { AVAILABLE_ICON_NAMES, CategoryIcon } from '@/components/courses/CategoryIcon';

function fieldMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.startsWith('validation.') ? resolveValidationMessage(message) : message;
}

type CategoryFormInput = z.input<typeof categoryUpsertSchema>;
type CategoryFormOutput = z.output<typeof categoryUpsertSchema>;

const FIELDS = ['name', 'slug', 'description', 'icon', 'accent', 'position'] as const;

/**
 * Category list plus an inline create/edit form.
 *
 * Categories are few and short, so a single screen with an inline editor
 * beats a separate route per category. Deletion is attempted and the API's
 * refusal (409 while courses still reference it) is surfaced as-is rather
 * than pre-judged in the client.
 */
export function CategoryManager({ categories }: { categories: CategoryDto[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [listError, setListError] = useState('');
  const [listSuccess, setListSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(category: CategoryDto) {
    setListError('');
    setListSuccess('');

    // Native confirm is deliberate: a bespoke modal adds no safety here, and
    // this is a destructive administrative action.
    if (!window.confirm(t.admin.categories.form.deleteConfirm)) return;

    setDeletingId(category.id);
    try {
      await api.delete<void>(`/admin/categories/${category.id}`);
      setListSuccess(t.admin.categories.form.deleted);
      router.refresh();
    } catch (error) {
      setListError(applyApiError(error, () => {}, []));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <FormError message={listError} />
      <FormSuccess message={listSuccess} />

      {!creating && editing === null && (
        <Button onClick={() => setCreating(true)} variant="primary">
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t.admin.categories.create}
        </Button>
      )}

      {(creating || editing !== null) && (
        <CategoryForm
          category={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {categories.length === 0 ? (
        <StateBlock
          icon={<Layers className="h-5 w-5" />}
          title={t.admin.categories.empty.title}
          description={t.admin.categories.empty.description}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-[var(--surface-hairline)]">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-muted/50"
              >
                <CategoryIcon
                  name={category.icon}
                  accent={category.accent}
                  className="h-9 w-9 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading">{category.name}</p>
                  <p className="truncate font-mono text-[11px] text-faint">{category.slug}</p>
                </div>

                <Badge tone="neutral" size="sm" className="shrink-0">
                  {t.categories.courseCount(category.courseCount)}
                </Badge>

                <span className="hidden w-10 shrink-0 text-center text-xs text-faint sm:inline">
                  #{category.position}
                </span>

                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setCreating(false);
                      setEditing(category);
                    }}
                    title={t.common.edit}
                  >
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only">{t.common.edit}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    loading={deletingId === category.id}
                    onClick={() => void remove(category)}
                    title={t.common.delete}
                    className="text-[var(--color-danger)]"
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only">{t.common.delete}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
  onCancel,
}: {
  category: CategoryDto | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState('');
  const isEdit = category !== null;

  /*
   * `position` uses z.coerce, so the schema's INPUT type (what the form holds
   * — a string from <input type="number">) differs from its OUTPUT type (the
   * coerced number the API receives). Both are declared explicitly, otherwise
   * the resolver and the form disagree on that one field.
   */
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryFormOutput>({
    resolver: zodResolver(categoryUpsertSchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      icon: category?.icon ?? 'Code2',
      accent: category?.accent ?? '#2f66f6',
      position: category?.position ?? 0,
    },
  });

  /*
   * Live preview of the tile the student will see.
   *
   * `useWatch` rather than `watch()`: the latter returns a fresh function on
   * every render, which the React Compiler cannot memoize — it bails out of
   * optimising the whole component and warns. `useWatch` subscribes through
   * `control` and is compiler-safe.
   */
  const previewIcon = useWatch({ control, name: 'icon' });
  const previewAccent = useWatch({ control, name: 'accent' });

  async function onSubmit(values: CategoryFormOutput) {
    setFormError('');
    const payload = {
      ...values,
      description: values.description || null,
      icon: values.icon || null,
      accent: values.accent || null,
    };

    try {
      if (isEdit && category) {
        await api.patch<CategoryDto>(`/admin/categories/${category.id}`, payload);
      } else {
        await api.post<CategoryDto>('/admin/categories', payload);
      }
      onDone();
    } catch (error) {
      setFormError(applyApiError(error, setError, FIELDS));
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-heading">
          {isEdit ? t.admin.categories.edit : t.admin.categories.create}
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} title={t.common.cancel}>
          <X aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{t.common.cancel}</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormError message={formError} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.admin.categories.form.nameLabel}
            error={fieldMessage(errors.name?.message)}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('name')} />
            )}
          </Field>

          <Field
            label={t.admin.categories.form.slugLabel}
            error={fieldMessage(errors.slug?.message)}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                className="font-mono"
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('slug')}
              />
            )}
          </Field>
        </div>

        <Field
          label={t.admin.categories.form.descriptionLabel}
          error={fieldMessage(errors.description?.message)}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={2}
              aria-describedby={describedBy}
              invalid={invalid}
              {...register('description')}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
          <Field
            label={t.admin.categories.form.iconLabel}
            hint={t.admin.categories.form.iconHint}
            error={fieldMessage(errors.icon?.message)}
          >
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} invalid={invalid} {...register('icon')}>
                {AVAILABLE_ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label={t.admin.categories.form.accentLabel}
            hint={t.admin.categories.form.accentHint}
            error={fieldMessage(errors.accent?.message)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                className="font-mono"
                placeholder="#2f66f6"
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('accent')}
              />
            )}
          </Field>

          <Field
            label={t.admin.categories.form.positionLabel}
            error={fieldMessage(errors.position?.message)}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                aria-describedby={describedBy}
                invalid={invalid}
                {...register('position')}
              />
            )}
          </Field>

          {/* Live tile preview */}
          <div className="flex items-center gap-2 pb-1">
            <CategoryIcon name={previewIcon ?? null} accent={previewAccent ?? null} className="h-11 w-11" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? t.common.saving : isEdit ? t.common.save : t.common.create}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
