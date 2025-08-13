// app/api/assignments/[id]/status/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => cookieStore.get(n)?.value, set() {}, remove() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthenticated', { status: 401 });

  const { status } = await req.json(); // 'approved' | 'rejected' | 'cancelled' | 'open'
  const allowed = new Set(['approved', 'rejected', 'cancelled', 'open']);
  if (!allowed.has(status)) return new Response('invalid_status', { status: 400 });

  const patch: any = { status };
  if (status === 'approved') patch.approved_at = new Date().toISOString();
  if (status === 'rejected') patch.rejected_at = new Date().toISOString();

  const { error } = await sb.from('assignments').update(patch).eq('id', params.id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}