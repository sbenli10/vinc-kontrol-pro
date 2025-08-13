// app/api/submissions/[id]/moderate/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { action } = await req.json(); // 'approve' | 'reject'
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => cookieStore.get(n)?.value, set(){}, remove(){} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthenticated', { status: 401 });

  // submission'ı çek (org_id & assignment_id öğren)
  const { data: sub, error } = await sb
    .from('submissions')
    .select('id, org_id, assignment_id')
    .eq('id', params.id)
    .single();
  if (error || !sub) return new Response('not_found', { status: 404 });

  if (sub.assignment_id) {
    const patch: any = {};
    if (action === 'approve') patch.status = 'approved';
    if (action === 'reject') patch.status = 'rejected';
    if (patch.status) {
      await sb.from('assignments').update(patch).eq('id', sub.assignment_id);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}