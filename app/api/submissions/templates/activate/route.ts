import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });
  // TODO: aktif şablonu org bazlı işaretle
  return NextResponse.json({ ok: true });
}