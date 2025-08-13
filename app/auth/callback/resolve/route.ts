import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ nextPath: '/login' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // 1) metadata'da rol varsa onu kullan
  const metaRole = String(user.user_metadata?.role ?? '').toLowerCase();
  if (metaRole === 'admin') {
    return new Response(JSON.stringify({ nextPath: '/admin' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // 2) yoksa org_members'tan bak (senin gerçek kaynağın bu)
  const { data: m } = await sb
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1);

  const dbRole = String(m?.[0]?.role ?? '').toLowerCase();
  const nextPath = dbRole === 'admin' ? '/admin' : '/dashboard';
  return new Response(JSON.stringify({ nextPath }), { headers: { 'Content-Type': 'application/json' } });
}
