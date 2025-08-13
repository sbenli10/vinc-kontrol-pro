// app/api/submissions/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  try {
    const sb = supabaseServer();

    // auth kontrol: RLS zaten güvenlik sağlayacak, ama 401’leri erken yakalayalım
    const { data: ures, error: uerr } = await sb.auth.getUser();
    if (uerr) return NextResponse.json({ error: uerr.message }, { status: 400 });
    if (!ures?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // delete
    const { data, error } = await sb
      .from("submissions")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: (error as any).details }, { status: 400 });
    }
    return NextResponse.json({ ok: true, deleted: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
