import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = cookies();
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

  // 1) Oturumdaki kullanıcıyı al
  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr || !user) return new Response('unauthenticated', { status: 401 });

  // 2) Zaten bir org üyeliği var mı?
  const { data: existing, error: exErr } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .limit(1);
  if (exErr) return new Response(exErr.message, { status: 400 });

  // Varsa hiçbir şey yapma (cookie'yi de tazeleyelim)
  if (existing && existing.length) {
    cookies().set('org', existing[0].org_id, { path: '/', sameSite: 'lax' });
    return new Response(JSON.stringify({ ok: true, org_id: existing[0].org_id, already: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3) Yoksa otomatik bir organizasyon oluştur (kişisel org gibi)
  const orgName = (user.user_metadata?.company || user.email?.split('@')[0] || 'Yeni Organizasyon') + ' Org';
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('orgs')
    .insert({ name: orgName, owner_id: user.id })
    .select('id')
    .single();
  if (orgErr || !org) return new Response(orgErr?.message ?? 'org_error', { status: 400 });

  // 4) Kullanıcıyı admin (veya istersen operator) olarak ekle
  const { error: memErr } = await supabaseAdmin
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'admin' }); // istersen 'operator'
  if (memErr) return new Response(memErr.message, { status: 400 });

  // 5) Aktif org çerezi
  cookies().set('org', org.id, { path: '/', sameSite: 'lax' });

  return new Response(JSON.stringify({ ok: true, org_id: org.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
