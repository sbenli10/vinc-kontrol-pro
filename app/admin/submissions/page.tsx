import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function getSubs() {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n)=>cookies().get(n)?.value, set(){}, remove(){} } }
  );
  // Kendi org’undaki son 50 gönderim
  const { data, error } = await sb
    .from("submissions")
    .select("id, org_id, template_id, time, equipment, location, period, score, critical, created_at")
    .order("time", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function Page() {
  const items = await getSubs();
  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold">Gönderimler</h1>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <table className="min-w-full divide-y text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-left">Ekipman</th>
              <th className="px-4 py-3 text-left">Lokasyon</th>
              <th className="px-4 py-3 text-left">Periyot</th>
              <th className="px-4 py-3 text-left">Skor</th>
              <th className="px-4 py-3 text-left">Kritik</th>
              <th className="px-4 py-3 text-right">Çıktı</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-neutral-800">
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/60">
                <td className="px-4 py-3">{new Date(r.time ?? r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{r.equipment ?? "—"}</td>
                <td className="px-4 py-3">{r.location ?? "—"}</td>
                <td className="px-4 py-3">{r.period ?? "—"}</td>
                <td className="px-4 py-3">{r.score ?? "—"}</td>
                <td className="px-4 py-3">{r.critical ? "Evet" : "Hayır"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/api/exports/submissions/${r.id}`} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">Excel</Link>
                    <Link href={`/api/exports/submissions/${r.id}/pdf`} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">PDF</Link>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="px-4 py-6 text-sm text-neutral-500" colSpan={7}>Henüz gönderim yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
