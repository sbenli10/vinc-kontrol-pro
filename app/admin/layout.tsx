import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminShell from '@/components/ui/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (!user.activeOrgId) redirect('/no-org'); // hiç üyeliği yoksa
  if (!user.isAdmin) redirect('/panel/tasks?reason=forbidden');

  return <AdminShell user={{ id:user.id, email:user.email, name:user.name, role:'admin' }}>{children}</AdminShell>;
}
