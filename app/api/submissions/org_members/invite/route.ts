import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, role } = await req.json();
  if (!email || !role) {
    return NextResponse.json({ error: 'email ve role zorunlu' }, { status: 400 });
  }
  // TODO: DB kaydı + (opsiyonel) Resend ile davet maili
  return NextResponse.json({ ok: true }, { status: 201 });
}


