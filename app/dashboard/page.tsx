// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Bell, LogOut, PlusCircle, Activity, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Neg = { section: string; item: string; critical?: boolean };
type Submission = {
  id: string;
  created_at: string;
  org_id: string;
  created_by: string;
  template_id: string | null;
  equipment: string | null;
  period: string | null;
  location: string | null;
  time: string | null;     // ISO
  score: number | null;
  negatives: Neg[] | null;
  notes: string | null;
  payload: any;
  critical: boolean | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  // 1) Auth kontrol
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error("auth.getUser", error.message);
      if (!data?.user) {
        router.replace("/login");
      } else {
        setUserEmail(data.user.email ?? null);
      }
    });
    return () => { alive = false; };
  }, [router, supabase]);

  // 2) Başlangıç listesi
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/submissions", { cache: "no-store", credentials: "include" });
        const text = await res.text();
        let json: any = [];
        try { json = JSON.parse(text); } catch { console.warn("GET /api/submissions raw:", text); }
        if (res.ok && Array.isArray(json)) {
          if (alive) setSubmissions(json);
        } else {
          console.error("GET /api/submissions error:", json);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 3) Realtime — yeni submission gelince listeyi güncelle
  useEffect(() => {
    const orgId = process.env.NEXT_PUBLIC_ORG_ID; // varsa, filtre uygula
    const channel = supabase.channel("realtime:submissions")
      .on("postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: orgId ? `org_id=eq.${orgId}` : undefined,
        },
        (payload: { new: Submission }) => {
          setSubmissions((prev) => [payload.new, ...prev].slice(0, 200));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // console.log("Realtime subscribed");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Metrix’ler
  const { total, avgScore, criticalCount, lastTime } = useMemo(() => {
    const total = submissions.length;
    const scores = submissions.map(s => s.score ?? 0).filter(n => typeof n === "number");
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const criticalCount = submissions.filter(s => !!s.critical || (s.negatives?.some(n => n.critical))).length;
    const times = submissions.map(s => s.time ?? s.created_at).filter(Boolean) as string[];
    const lastTime = times.length ? new Date(times[0]).toLocaleString() : "-";
    return { total, avgScore, criticalCount, lastTime };
  }, [submissions]);

  // Grafik: son 6 ay adet
  const chart = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const counts: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }));
      counts.push(0);
    }
    const monthKey = (iso?: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      return d.getFullYear() + "-" + (d.getMonth() + 1);
    };
    const labelIndex = (iso?: string | null) => {
      if (!iso) return -1;
      const d = new Date(iso);
      const diff = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
      const idx = 5 - diff;
      return idx >= 0 && idx < 6 ? idx : -1;
    };
    submissions.forEach(s => {
      const idx = labelIndex(s.time ?? s.created_at);
      if (idx >= 0) counts[idx] += 1;
    });
    return {
      data: { labels, datasets: [{ label: "Gönderim", data: counts }] },
      options: { responsive: true, plugins: { legend: { position: "bottom" as const }, title: { display: true, text: "Son 6 Ay Gönderim Sayısı" } } }
    };
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return submissions.slice(0, 50);
    return submissions.filter(s =>
      (s.equipment ?? "").toLowerCase().includes(q) ||
      (s.location ?? "").toLowerCase().includes(q) ||
      (s.period ?? "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [submissions, filterText]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleDelete(id: string) {
  if (!confirm("Bu gönderimi silmek istediğinizden emin misiniz?")) return;
  setDeletingId(id);
  try {
    const res = await fetch(`/api/submissions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const text = await res.text();
    let out: any; try { out = JSON.parse(text); } catch { out = text; }

    if (!res.ok) {
      console.error("DELETE failed:", res.status, out);
      alert(typeof out === "string" ? out : (out?.error ?? `Silinemedi (${res.status})`));
      return;
    }

    setSubmissions(prev => prev.filter(s => s.id !== id));
  } finally {
    setDeletingId(null);
  }
}

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <div className="font-semibold">Vinc<span className="text-blue-400">Kontrol</span> Pro</div>
            <span className="text-xs text-slate-400 hidden sm:inline">• Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden md:inline">{userEmail ?? ""}</span>
            <Button variant="outline" className="border-slate-700" asChild>
              <Link href="/kontrol-formu"><PlusCircle className="w-4 h-4 mr-2" /> Yeni Kontrol</Link>
            </Button>
            <Button variant="outline" className="border-slate-700">
              <Bell className="w-4 h-4" />
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-600/90">
              <LogOut className="w-4 h-4 mr-2" /> Çıkış
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Toplam Gönderim</div>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Ortalama Skor</div>
              <div className="text-2xl font-bold">{avgScore}%</div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Kritik Uygunsuzluk</div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                {criticalCount > 0 ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {criticalCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Son Güncelleme</div>
              <div className="text-sm">{lastTime}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…</div>
            ) : (
              <Bar data={chart.data} options={chart.options} />
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Son Gönderimler</div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ekipman / konum / periyot ara…"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-60"
                />
                {/* Excel/PDF ileride: /api/reports/submissions-excel */}
                {/* <Button variant="outline" className="border-slate-700">Excel</Button> */}
              </div>
            </div>

            <div className="overflow-auto rounded border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70">
                  <tr>
                    <th className="text-left p-3">Tarih</th>
                    <th className="text-left p-3">Ekipman</th>
                    <th className="text-left p-3">Periyot</th>
                    <th className="text-left p-3">Konum</th>
                    <th className="text-left p-3">Skor</th>
                    <th className="text-left p-3">Uygunsuzluk</th>
                    <th className="text-left p-3">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      {/* ✅ 7 sütun */}
                      <td colSpan={7} className="p-4 text-center text-slate-400">Kayıt bulunamadı.</td>
                    </tr>
                  )}

                  {filtered.map((s) => (
                    <tr key={s.id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                      <td className="p-3">{new Date(s.time ?? s.created_at).toLocaleString()}</td>
                      <td className="p-3">{s.equipment ?? "-"}</td>
                      <td className="p-3 capitalize">{s.period ?? "-"}</td>
                      <td className="p-3">{s.location ?? "-"}</td>
                      <td className="p-3 font-semibold">{s.score ?? 0}%</td>
                      <td className="p-3">
                        {s.negatives && s.negatives.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="w-4 h-4" /> {s.negatives.length}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> 0
                          </span>
                        )}
                      </td>

                      {/* ✅ Sil butonu */}
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-red-600 border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
