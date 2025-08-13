// app/api/assignments/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function sbClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => cookieStore.get(n)?.value, set() {}, remove() {} } }
  );
}

export async function GET(req: Request) {
  const sb = sbClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthenticated', { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  // aktif org'ı belirle
  const { data: memberships } = await sb
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id);
  const cookieOrg = cookies().get('org')?.value ?? memberships?.[0]?.org_id ?? null;
  if (!cookieOrg) return new Response('no_org', { status: 400 });

  const role = memberships?.find(m => m.org_id === cookieOrg)?.role ?? null;

  let q = sb
    .from('assignments')
    .select('id, title, description, due_at, status, assignee_id, template_id, created_at')
    .eq('org_id', cookieOrg)
    .order('created_at', { ascending: false })
    .limit(100);

  if (role !== 'admin') q = q.eq('assignee_id', user.id);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ items: data ?? [] }), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const sb = sbClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthenticated', { status: 401 });

  const body = await req.json();
  const { template_id, assignee_id, title, description, due_at } = body;
  if (!template_id || !assignee_id || !title) {
    return new Response('missing_fields', { status: 400 });
  }

  // aktif org
  const { data: memberships } = await sb
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id);
  const cookieOrg = cookies().get('org')?.value ?? memberships?.[0]?.org_id ?? null;
  if (!cookieOrg) return new Response('no_org', { status: 400 });

  // insert (RLS admin'i kontrol eder)
  const { error } = await sb.from('assignments').insert({
    org_id: cookieOrg,
    template_id,
    assignee_id,
    title,
    description,
    due_at,
    created_by: user.id,
  });
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' }, status: 201 });
}