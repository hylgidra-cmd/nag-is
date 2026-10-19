import type { Metadata } from 'next';
import { Receipt, ServerCrash } from 'lucide-react';
import { formatUzsWithUnit } from '@nagis/shared-types';
import { formatDate, t } from '@/i18n';
import { getAdminOrders } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { cn } from '@/lib/cn';
import { Badge, Card, StateBlock } from '@/components/ui/primitives';

export const metadata: Metadata = { title: t.admin.orders.title };
export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  CANCELLED: 'danger',
  REFUNDED: 'violet',
} as const;

/**
 * Orders and payment state.
 *
 * Amounts are the snapshots stored on the order and its items, never
 * recomputed from current course prices — a receipt must always reflect what
 * was actually charged.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page);

  const result = await settle(() =>
    getAdminOrders({
      status: params.status,
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      perPage: 25,
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.admin.orders.title}</h1>
        {result.ok && (
          <p className="mt-2 text-sm text-muted">
            {t.catalog.resultCount(result.data.meta.total)}
          </p>
        )}
      </header>

      {!result.ok ? (
        <StateBlock
          tone="danger"
          icon={<ServerCrash className="h-5 w-5" />}
          title={t.errorPage.title}
          description={result.error}
        />
      ) : result.data.items.length === 0 ? (
        <StateBlock
          icon={<Receipt className="h-5 w-5" />}
          title={t.admin.orders.empty.title}
          description={t.admin.orders.empty.description}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-hairline bg-surface-muted/60">
                <tr>
                  <Th>{t.admin.orders.table.reference}</Th>
                  <Th>{t.admin.orders.table.user}</Th>
                  <Th>{t.admin.orders.table.items}</Th>
                  <Th align="right">{t.admin.orders.table.total}</Th>
                  <Th align="center">{t.admin.orders.table.status}</Th>
                  <Th align="center">{t.admin.orders.table.payment}</Th>
                  <Th>{t.admin.orders.table.created}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-hairline)]">
                {result.data.items.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface-muted/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-heading">
                      {order.reference}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block truncate font-medium text-heading">
                        {order.customerName}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {order.customerEmail}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted">
                      <span className="block truncate">
                        {order.items.map((item) => item.courseTitle).join(', ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-heading">
                      {formatUzsWithUnit(order.totalUzs)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={STATUS_TONE[order.status] ?? 'neutral'} size="sm">
                        {t.dashboard.orders.status[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.payment ? (
                        <span className="text-xs text-muted">
                          {order.payment.provider}
                          <span className="mt-0.5 block text-faint">
                            {t.dashboard.orders.paymentStatus[order.payment.status]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* The dev payment adapter must never be mistaken for real revenue. */}
      <p className="rounded-card border border-dashed border-hairline bg-surface-muted/60 px-4 py-3 text-xs leading-relaxed text-muted">
        {t.payment.devModeBody}
      </p>
    </div>
  );
}

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: keyof typeof ALIGN;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint',
        ALIGN[align],
      )}
    >
      {children}
    </th>
  );
}
