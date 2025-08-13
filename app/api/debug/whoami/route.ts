// app/api/debug/whoami/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => cookieStore.get(n)?.value, set(){}, remove(){} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response(JSON.stringify({ user: null }), { headers: { 'Content-Type':'application/json' } });

  const { data: orgs } = await sb.from('org_members').select('org_id, role').eq('user_id', user.id);
  const cookieOrg = cookieStore.get('org')?.value ?? null;

  return new Response(JSON.stringify({
    email: user.email,
    cookieOrg,
    orgs: orgs ?? []
  }), { headers: { 'Content-Type':'application/json' } });
}
