import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';
  if (!next.startsWith('/')) next = '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Rol'e göre default yönlendirme (metadata.role kullandığını varsayıyorum)
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role as
        | 'owner'|'admin'|'manager'|'editor'|'viewer'|'operator' | undefined;

      if (!searchParams.get('next')) {
        next = role && ['owner','admin','manager'].includes(role) ? '/admin' : '/panel/tasks';
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
