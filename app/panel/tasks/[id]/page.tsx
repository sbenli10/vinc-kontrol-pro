// app/panel/tasks/[id]/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import TaskFormClient from './TaskFormClient'; // ✅ YENİ: client wrapper

export const dynamic = 'force-dynamic';

function fmtUTC(d?: string | null) {
  return d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) : '—';
}

async function loadData(id: string) {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (n: string) => (await cookieStore).get(n)?.value,
        set() {},
        remove() {},
      },
    }
  );

  const { data: a, error } = await sb
    .from('assignments')
    .select('id, title, description, due_at, status, template_id')
    .eq('id', id)
    .single();

  if (error || !a) return null;

  const { data: tpl } = await sb
    .from('form_templates')
    .select('id, name, schema')
    .eq('id', a.template_id)
    .single();

  return { assignment: a, template: tpl };
}

export default async function TaskDetail({ params }: { params: { id: string } }) {
  const data = await loadData(params.id);
  if (!data) return <div className="p-6 text-sm text-red-600">Görev bulunamadı.</div>;

  const { assignment, template } = data;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-base font-semibold">{assignment.title}</h1>
        {assignment.description && (
          <p className="text-sm text-neutral-500 mt-1">{assignment.description}</p>
        )}
        <p className="text-xs text-neutral-500 mt-1">
          Termin: {fmtUTC(assignment.due_at)}
        </p>
      </div>

      {/* ✅ Artık submit & hata yakalama bu client wrapper içinde */}
      <TaskFormClient assignmentId={assignment.id} template={template} />
    </div>
  );
}
