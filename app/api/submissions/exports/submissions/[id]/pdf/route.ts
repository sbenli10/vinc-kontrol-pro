// app/api/exports/submissions/[id]/pdf/route.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: async n => (await cookies()).get(n)?.value, set(){}, remove(){} } }
  );

  const { data: sub, error } = await sb
    .from("submissions")
    .select("id, time, created_at, equipment, location, period, score, notes, critical, payload")
    .eq("id", params.id)
    .single();

  if (error || !sub) {
    return new Response(JSON.stringify({ error: error?.message ?? "not_found" }), { status: 404 });
  }

  // PDF'yi Buffer olarak üret
  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks as any)));
    doc.on("error", reject);

    // --- içerik ---
    doc.fontSize(16).text("Gönderim", { underline: true });
    doc.moveDown().fontSize(10);
    doc.text(`Tarih: ${new Date(sub.time ?? sub.created_at).toLocaleString()}`);
    if (sub.equipment) doc.text(`Ekipman: ${sub.equipment}`);
    if (sub.location) doc.text(`Lokasyon: ${sub.location}`);
    if (sub.period) doc.text(`Periyot: ${sub.period}`);
    if (sub.score != null) doc.text(`Skor: ${sub.score}`);
    doc.text(`Kritik: ${sub.critical ? "Evet" : "Hayır"}`);
    if (sub.notes) { doc.moveDown(); doc.text(`Notlar: ${sub.notes}`); }

    doc.moveDown().font("Helvetica-Bold").text("Form Değerleri");
    doc.moveDown(0.5).font("Helvetica");
    const payload = sub.payload || {};
    Object.entries(payload).forEach(([k, v]) => {
      doc.font("Helvetica-Bold").text(String(k));
      doc.font("Helvetica").text(typeof v === "object" ? JSON.stringify(v, null, 2) : String(v ?? ""));
      doc.moveDown(0.4);
    });

    doc.end();
  });

  // ✅ Buffer -> Uint8Array (BodyInit ile uyumlu)
  const pdfBytes = new Uint8Array(pdfBuffer);

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="submission-${params.id}.pdf"`
    }
  });
}
