// app/api/org/select/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
  const { org_id } = await req.json();
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get:(n)=>cookieStore.get(n)?.value, set(){}, remove(){} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthenticated', { status: 401 });

  // org_members’ta gerçekten üye mi?
  const { data } = await sb.from('org_members').select('org_id').eq('org_id', org_id).eq('user_id', user.id).maybeSingle();
  if (!data) return new Response('forbidden', { status: 403 });

  (await cookies()).set('org', org_id, { path: '/', sameSite: 'lax' });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
}
