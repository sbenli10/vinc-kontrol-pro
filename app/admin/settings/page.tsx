import OrgSettingsForm from '@/components/ui/admin/forms/OrgSettingsForm';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/authz';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  requireRole(user, ['owner', 'admin'], '/admin/settings');

  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold">Organizasyon Ayarları</h1>
      <OrgSettingsForm />
    </div>
  );
}