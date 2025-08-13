import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type Role = 'admin'|'operator';
export type CurrentUser = {
  id: string; email: string; name?: string;
  // aktif org context
  activeOrgId: string | null;
  role: Role | null;          // aktif org'daki rol
  isAdmin: boolean;
  orgs: Array<{ org_id: string; role: Role }>;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n)=>cookieStore.get(n)?.value, set(){}, remove(){} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  // bu kullanıcının üyelikleri
  const { data: memberships } = await sb
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id);

  const orgs = (memberships ?? []) as Array<{ org_id: string; role: Role }>;
  // aktif org: cookie 'org' varsa o, yoksa ilk üyelik
  const cookieOrg = cookieStore.get('org')?.value ?? null;
  const activeOrgId = cookieOrg && orgs.some(o=>o.org_id===cookieOrg) ? cookieOrg : (orgs[0]?.org_id ?? null);

  const activeRole = orgs.find(o=>o.org_id===activeOrgId)?.role ?? null;
  const isAdmin = activeRole === 'admin';

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name,
    activeOrgId,
    role: activeRole,
    isAdmin,
    orgs,
  };
}
