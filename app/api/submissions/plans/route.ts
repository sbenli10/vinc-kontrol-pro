import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: DB'den planlar
  return NextResponse.json({ items: [] });
}

export async function POST(req: Request) {
  const { title, period, assignee } = await req.json();
  if (!title || !period) return NextResponse.json({ error: 'title/period zorunlu' }, { status: 400 });
  // TODO: DB create
  return NextResponse.json({ ok: true, id: 'plan_1' }, { status: 201 });
}