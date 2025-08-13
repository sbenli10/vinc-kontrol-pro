// app/admin/plans/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import AssignForm from '@/components/ui/admin/AssignForm';

export const dynamic = 'force-dynamic';

async function getData() {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: async n => (await cookieStore).get(n)?.value, set(){}, remove(){} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { items: [], templates: [], operators: [] };

  // aktif org
  const { data: memberships } = await sb.from('org_members').select('org_id, role, user_id').eq('user_id', user.id);
  const orgId = (await cookieStore).get('org')?.value ?? memberships?.[0]?.org_id ?? null;
  if (!orgId) return { items: [], templates: [], operators: [] };

  const [{ data: items }, { data: templates }, { data: ops }] = await Promise.all([
    sb.from('assignments').select('id, title, due_at, status, assignee_id, template_id, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(100),
    sb.from('form_templates').select('id, name').eq('org_id', orgId).order('name'),
    sb.from('org_members').select('user_id, role').eq('org_id', orgId).eq('role', 'operator')
  ]);

  // kullanıcı adları için auth.users fetch'lemek yerine id gösteriyoruz (MVP)
  return { items: items ?? [], templates: templates ?? [], operators: ops ?? [] };
}

export default async function PlansPage() {
  const { items, templates, operators } = await getData();
  return (
    <div className="space-y-6">
      <h1 className="text-base font-semibold">Görev Planlama</h1>
      <AssignForm templates={templates} operators={operators} />

      <div className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-950 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2 text-left">Başlık</th>
              <th className="px-4 py-2 text-left">Atanan</th>
              <th className="px-4 py-2 text-left">Şablon</th>
              <th className="px-4 py-2 text-left">Termin</th>
              <th className="px-4 py-2 text-left">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-neutral-800">
            {items.map((a: any) => (
              <tr key={a.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/60">
                <td className="px-4 py-2">{a.title}</td>
                <td className="px-4 py-2 text-xs">{a.assignee_id.slice(0,8)}…</td>
                <td className="px-4 py-2 text-xs">{a.template_id.slice(0,8)}…</td>
                <td className="px-4 py-2">{a.due_at ? new Date(a.due_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-2">{a.status}</td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="px-4 py-6 text-neutral-500" colSpan={5}>Henüz atama yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}