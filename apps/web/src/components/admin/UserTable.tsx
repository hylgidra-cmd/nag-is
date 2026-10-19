'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { USER_ROLES, type UserRole } from '@nagis/shared-types';
import { formatDate, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { applyApiError } from '@/lib/api/form';
import type { AdminUserRow } from '@/lib/api/server';
import { Badge, Card } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { FormError, FormSuccess, Select } from '@/components/ui/Field';

const ROLE_TONE: Record<UserRole, 'accent' | 'violet' | 'neutral'> = {
  ADMIN: 'violet',
  INSTRUCTOR: 'accent',
  STUDENT: 'neutral',
};

/**
 * User administration.
 *
 * Role changes and deactivation go straight to `PATCH /admin/users/:id`. The
 * API refuses the dangerous cases itself — an admin demoting themselves, or
 * removing the last active administrator — and those refusals are shown here
 * rather than guessed at in the client.
 */
export function UserTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setError('');
    setSuccess('');
    setBusyId(id);
    try {
      await api.patch<unknown>(`/admin/users/${id}`, body);
      setSuccess(message);
      router.refresh();
    } catch (caught) {
      setError(applyApiError(caught, () => {}, []));
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(user: AdminUserRow, role: UserRole) {
    if (role === user.role) return;
    if (!window.confirm(t.admin.users.roleChangeConfirm(t.admin.users.roles[role]))) return;
    await patch(user.id, { role }, t.admin.users.updated);
  }

  async function toggleActive(user: AdminUserRow) {
    await patch(user.id, { isActive: !user.isActive }, t.admin.users.updated);
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <FormSuccess message={success} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-hairline bg-surface-muted/60">
              <tr>
                <Th>{t.admin.users.table.user}</Th>
                <Th>{t.admin.users.table.role}</Th>
                <Th align="center">{t.admin.users.table.enrollments}</Th>
                <Th align="center">{t.admin.users.table.status}</Th>
                <Th>{t.admin.users.table.lastLogin}</Th>
                <Th>{t.admin.users.table.joined}</Th>
                <Th align="right">{t.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-hairline)]">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <span className="block truncate font-medium text-heading">
                      {user.fullName}
                    </span>
                    <span className="block truncate text-xs text-faint">{user.email}</span>
                  </td>

                  <td className="px-4 py-3">
                    <Select
                      value={user.role}
                      onChange={(event) => void changeRole(user, event.target.value as UserRole)}
                      disabled={busyId === user.id}
                      aria-label={t.admin.users.changeRole}
                      className="h-9 w-36 text-xs"
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t.admin.users.roles[role]}
                        </option>
                      ))}
                    </Select>
                  </td>

                  <td className="px-4 py-3 text-center text-muted">{user.enrollmentCount}</td>

                  <td className="px-4 py-3 text-center">
                    <Badge tone={user.isActive ? 'success' : 'danger'} size="sm">
                      {user.isActive ? t.admin.users.active : t.admin.users.disabled}
                    </Badge>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : t.admin.users.never}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busyId === user.id}
                      onClick={() => void toggleActive(user)}
                      className={user.isActive ? 'text-[var(--color-danger)]' : undefined}
                    >
                      {user.isActive ? t.admin.users.disable : t.admin.users.enable}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* The role badge legend doubles as a reminder of what each role grants. */}
      <div className="flex flex-wrap gap-2">
        {USER_ROLES.map((role) => (
          <Badge key={role} tone={ROLE_TONE[role]} size="sm">
            {t.admin.users.roles[role]}
          </Badge>
        ))}
      </div>
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
      className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint ${ALIGN[align]}`}
    >
      {children}
    </th>
  );
}
