import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, fromEmail } = await req.json();
  // TODO: logo upload'u ayrı endpoint olabilir (multipart)
  if (!name) return NextResponse.json({ error: 'name zorunlu' }, { status: 400 });
  // TODO: DB save + Resend sender ayarlarını doğrula
  return NextResponse.json({ ok: true });
}
