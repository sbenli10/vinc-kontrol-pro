import TemplateSelector from '@/components/ui/admin/forms/TemplateSelector';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/authz';

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  requireRole(user, ['owner', 'admin', 'manager'], '/admin/templates');

  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold">Form Şablonları</h1>
      <TemplateSelector />
    </div>
  );
}