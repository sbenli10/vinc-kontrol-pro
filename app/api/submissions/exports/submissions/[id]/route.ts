import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ExcelJS from "exceljs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get:(n)=>cookies().get(n)?.value, set(){}, remove(){} } }
  );

  const { data: sub, error } = await sb
    .from("submissions")
    .select("id, org_id, template_id, time, equipment, location, period, score, negatives, notes, critical, payload, created_at")
    .eq("id", params.id)
    .single();
  if (error || !sub) return NextResponse.json({ error: error?.message ?? "not_found" }, { status: 404 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Submission");
  ws.addRow(["ID", sub.id]);
  ws.addRow(["Tarih", new Date(sub.time ?? sub.created_at).toLocaleString()]);
  ws.addRow(["Ekipman", sub.equipment ?? ""]);
  ws.addRow(["Lokasyon", sub.location ?? ""]);
  ws.addRow(["Periyot", sub.period ?? ""]);
  ws.addRow(["Skor", sub.score ?? ""]);
  ws.addRow(["Kritik", sub.critical ? "Evet" : "Hayır"]);
  ws.addRow(["Notlar", sub.notes ?? ""]);
  ws.addRow([]);
  ws.addRow(["Alan", "Değer"]);

  const flat = (obj: any, prefix = "") => {
    const out: Record<string, any> = {};
    if (!obj || typeof obj !== "object") return out;
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, key));
      else out[key] = v;
    }
    return out;
  };
  const payload = flat(sub.payload || {});
  Object.entries(payload).forEach(([k, v]) => ws.addRow([k, typeof v === "object" ? JSON.stringify(v) : String(v ?? "")]));

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="submission-${sub.id}.xlsx"`
    }
  });
}
