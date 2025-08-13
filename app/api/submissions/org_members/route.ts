import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Prisma ile gerçek liste
  const mock = [
    { id: '1', email: 'aylin@example.com', role: 'admin' },
    { id: '2', email: 'kerem@example.com', role: 'manager' },
  ];
  return NextResponse.json({ items: mock });
}