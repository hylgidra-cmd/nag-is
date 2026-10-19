import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  FileEdit,
  GraduationCap,
  Layers,
  Receipt,
  ServerCrash,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { formatUzsWithUnit } from '@nagis/shared-types';
import { formatDate, t } from '@/i18n';
import { getAdminOverview } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { Badge, Card, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { TrendChart } from '@/components/charts/TrendChart';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = { title: t.meta.adminTitle };
export const dynamic = 'force-dynamic';

/**
 * Administrative overview.
 *
 * Every figure is read from `GET /admin/overview`, which aggregates real rows.
 * Revenue sums the price snapshot captured on each OrderItem at purchase
 * time, so changing a course price later does not rewrite reported revenue.
 */
export default async function AdminOverviewPage() {
  const result = await settle(getAdminOverview);

  if (!result.ok) {
    return (
      <StateBlock
        tone="danger"
        icon={<ServerCrash className="h-5 w-5" />}
        title={t.errorPage.title}
        description={result.error}
        action={
          <Button href="/admin" variant="secondary">
            {t.common.retry}
          </Button>
        }
      />
    );
  }

  const { totals, enrollmentTrend, revenueTrend, topCourses, recentOrders } = result.data;

  const stats = [
    { icon: Users, label: t.admin.overview.stats.users, value: String(totals.users) },
    { icon: GraduationCap, label: t.admin.overview.stats.students, value: String(totals.students) },
    { icon: BookOpen, label: t.admin.overview.stats.published, value: String(totals.publishedCourses) },
    { icon: FileEdit, label: t.admin.overview.stats.drafts, value: String(totals.draftCourses) },
    { icon: Layers, label: t.admin.overview.stats.categories, value: String(totals.categories) },
    { icon: TrendingUp, label: t.admin.overview.stats.enrollments, value: String(totals.enrollments) },
    { icon: Award, label: t.admin.overview.stats.certificates, value: String(totals.certificates) },
    {
      icon: Wallet,
      label: t.admin.overview.stats.revenue,
      value: formatUzsWithUnit(totals.revenueUzs),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.admin.overview.title}</h1>
        <p className="mt-2 text-base text-muted">{t.admin.subtitle}</p>
      </header>

      {/* ---- Totals ---- */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((item, index) => (
          <Reveal key={item.label} delay={stagger(index, 0.03)}>
            <Card className="p-4">
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[0.5rem] bg-accent-50 text-accent-600 dark:bg-accent-900/35 dark:text-accent-200"
              >
                <item.icon className="h-4 w-4" />
              </span>
              <dd className="mt-3 truncate text-lg font-extrabold tracking-tight text-heading">
                {item.value}
              </dd>
              <dt className="mt-0.5 text-xs leading-snug text-faint">{item.label}</dt>
            </Card>
          </Reveal>
        ))}
      </dl>

      {/* ---- Trends ---- */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-heading">
              {t.admin.overview.enrollmentTrend}
            </h2>
            <p className="text-xs text-faint">{t.admin.overview.last30Days}</p>
          </div>
          <TrendChart
            data={enrollmentTrend.map((point) => ({ date: point.date, value: point.count }))}
            label={t.admin.overview.stats.enrollments}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-heading">{t.admin.overview.revenueTrend}</h2>
            <p className="text-xs text-faint">{t.admin.overview.last30Days}</p>
          </div>
          <TrendChart
            data={revenueTrend.map((point) => ({ date: point.date, value: point.revenueUzs }))}
            label={t.admin.overview.stats.revenue}
            kind="money"
            colour="var(--color-teal-accent)"
          />
        </Card>
      </div>

      {/* ---- Top courses ---- */}
      <section>
        <h2 className="mb-4 text-display-sm">{t.admin.overview.topCourses}</h2>
        {topCourses.length === 0 ? (
          <StateBlock title={t.admin.overview.noData} />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-[var(--surface-hairline)]">
              {topCourses.map((course, index) => (
                <li key={course.id}>
                  <Link
                    href={`/admin/courses?q=${encodeURIComponent(course.slug)}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-xs font-bold text-muted"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-heading">
                      {course.title}
                    </span>
                    <span className="shrink-0 text-xs text-faint">
                      {t.course.students(course.enrollments)}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-heading">
                      {formatUzsWithUnit(course.revenueUzs)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* ---- Recent orders ---- */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-display-sm">{t.admin.overview.recentOrders}</h2>
          <Button href="/admin/orders" variant="ghost" size="sm">
            {t.common.viewAll}
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <StateBlock
            icon={<Receipt className="h-5 w-5" />}
            title={t.admin.orders.empty.title}
            description={t.admin.orders.empty.description}
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-[var(--surface-hairline)]">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center gap-3.5 px-4 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs text-heading">
                      {order.reference}
                    </span>
                    <span className="block truncate text-xs text-faint">
                      {order.items.map((item) => item.courseTitle).join(', ')}
                    </span>
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <span className="shrink-0 text-sm font-semibold text-heading">
                    {formatUzsWithUnit(order.totalUzs)}
                  </span>
                  <span className="hidden shrink-0 text-xs text-faint sm:inline">
                    {formatDate(order.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: keyof typeof t.dashboard.orders.status }) {
  const tone =
    status === 'PAID'
      ? 'success'
      : status === 'PENDING'
        ? 'warning'
        : status === 'REFUNDED'
          ? 'violet'
          : status === 'FAILED' || status === 'CANCELLED'
            ? 'danger'
            : 'neutral';

  return (
    <Badge tone={tone} size="sm" className="shrink-0">
      {t.dashboard.orders.status[status]}
    </Badge>
  );
}
