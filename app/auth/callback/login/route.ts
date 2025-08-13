import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: 'email gerekli' }, { status: 400 });

  // NOT: burası demo. Gerçekte şifre doğrula, DB'den kullanıcı/rol çek
  const user = { id: 'u1', email, name: email.split('@')[0], role: role ?? 'operator' };

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set('session', JSON.stringify(user), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
