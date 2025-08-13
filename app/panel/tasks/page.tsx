// app/panel/tasks/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmtUTC(d?: string | null) {
  return d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) : '—';
}

async function getTasks() {
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

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [] as any[];

  const { data } = await sb
    .from('assignments')
    .select('id, title, due_at, status, template_id')
    .eq('assignee_id', user.id)
    .in('status', ['open', 'submitted'])
    .order('due_at', { ascending: true });

  return data ?? [];
}

export default async function TasksPage() {
  const tasks = await getTasks();
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Görevlerim</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="text-sm font-medium">{t.title}</div>
            <div className="text-xs text-neutral-500">Termin: {fmtUTC(t.due_at)}</div>
            <div className="mt-3 flex gap-2">
              <Link href={`/panel/tasks/${t.id}`} className="border rounded-xl px-3 py-1.5 text-xs">
                Formu Aç
              </Link>
            </div>
          </div>
        ))}
        {!tasks.length && (
          <div className="text-sm text-neutral-500">Bekleyen görev bulunmuyor.</div>
        )}
      </div>
    </div>
  );
}
