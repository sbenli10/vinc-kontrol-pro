"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronRight, Upload, CheckCircle, AlertTriangle, Calendar, MapPin, Clock, FileDown } from "lucide-react";
import { motion } from "framer-motion";

// --- Types ---
type Neg = { section: string; item: string };
type Submission = {
  id: string;
  equipment: string;
  period: string;
  location?: string;
  time: string; // ISO or locale
  score: number;
  negatives: Neg[];
  notes?: string;
  createdAt?: string;
};

// --- Demo soru şablonları ---
const SECTIONS = [
  { key: "genel", title: "1. Genel Görsel Kontrol", items: [
    "Vincin dış yüzeyinde hasar, çatlak veya korozyon var mı?",
    "Sepet platformunda deformasyon, kırık veya aşınma var mı?",
    "Tüm etiketler, uyarı işaretleri ve talimatlar okunabilir durumda mı?",
    "Sabitleme pimleri ve bağlantı elemanları yerinde ve sağlam mı?",
  ]},
  { key: "hidrolik", title: "2. Hidrolik Sistem Kontrolü", items: [
    "Hidrolik yağ seviyesi uygun mu?",
    "Hidrolik hortumlar ve bağlantılarda sızıntı var mı?",
    "Hidrolik silindirlerde hasar veya aşınma belirtileri var mı?",
    "Hidrolik sistem basıncı normal aralıkta mı?",
  ]},
  { key: "elektrik", title: "3. Elektrik Sistemi Kontrolü", items: [
    "Kontrol paneli ve düğmeler düzgün çalışıyor mu?",
    { text: "Acil durdurma butonu işlevsel mi?", critical: true },
    "Kablolar ve bağlantılar sağlam ve izole edilmiş mi?",
    "Sepet içi aydınlatma ve iletişim sistemleri çalışıyor mu?",
  ]},
  { key: "mekanik", title: "4. Mekanik Sistem Kontrolü", items: [
    "Bom ve teleskopik kollar düzgün hareket ediyor mu?",
    "Denge ayakları (outrigger) sağlam ve işlevsel mi?",
    "Kaldırma halatları veya zincirlerinde aşınma, kopma veya bükülme var mı?",
    "Tüm hareketli parçalar yağlanmış ve sorunsuz mu?",
  ]},
  { key: "guvenlik", title: "5. Güvenlik Sistemleri Kontrolü", items: [
    "Aşırı yük kontrol sistemi aktif mi?",
    { text: "Acil iniş sistemi çalışıyor mu?", critical: true },
    "Sepet emniyet kemerleri ve bağlantı noktaları sağlam mı?",
    "Limit switch’ler (sınır anahtarları) düzgün çalışıyor mu?",
  ]},
  { key: "arac", title: "6. Araç ve Şasi Kontrolü", items: [
    "Lastiklerin durumu uygun mu (aşınma, hava basıncı)?",
    "Fren sistemi düzgün çalışıyor mu?",
    "Araç motoru ve şanzımanında anormallik var mı?",
    "Yakıt seviyesi yeterli mi?",
  ]},
  { key: "operator", title: "7. Operatör Kontrolü", items: [
    "Operatörün gerekli sertifikaları ve eğitimi var mı?",
    "Operatör kişisel koruyucu donanım (baret, emniyet kemeri vb.) kullanıyor mu?",
    "Çalışma alanı çevresinde güvenlik bariyerleri veya işaretlemeler mevcut mu?",
  ]},
  { key: "test", title: "8. Çalışma Öncesi Test", items: [
    "Vinç tüm hareket yönlerinde test edildi mi (yukarı, aşağı, sağ, sol)?",
    "Sepet yük testi yapıldı mı (maksimum kapasiteye uygun)?",
    { text: "Acil durdurma ve kurtarma prosedürleri test edildi mi?", critical: true },
  ]},
];

function AnswerToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-4">
      <Label className="text-sm">Hayır</Label>
      <Switch checked={value === true} onCheckedChange={(v) => onChange(Boolean(v))} />
      <Label className="text-sm">Evet</Label>
    </div>
  );
}

export default function DemoApp() {
  const [tab, setTab] = useState("form");
  const [equipment, setEquipment] = useState("VINC-001");
  const [period, setPeriod] = useState("haftalık");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, (boolean | null)[]>>(() => {
    const init: Record<string, (boolean | null)[]> = {};
    SECTIONS.forEach((s) => { init[s.key] = s.items.map(() => null); });
    return init;
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [correctives, setCorrectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Backend'den liste çek
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/submissions", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (e) {
        console.error("Liste çekilemedi", e);
      }
    })();
  }, []);

  const score = useMemo(() => {
    let total = 0, ok = 0;
    Object.values(answers).forEach((arr) => {
      arr.forEach((v) => { if (v !== null) total += 1; if (v === true) ok += 1; });
    });
    const pct = total === 0 ? 0 : Math.round((ok / total) * 100);
    return { ok, total, pct };
  }, [answers]);

  const handleAnswer = (sectionKey: string, index: number, val: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((v, i) => (i === index ? val : v)),
    }));
  };

  const handlePhoto = (sectionKey: string, index: number, file?: File) => {
    const key = `${sectionKey}-${index}`;
    setPhotos((p) => ({ ...p, [key]: file?.name || "Seçilmedi" }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const negatives: Neg[] = [];
      const newCorrectives: any[] = [];
      SECTIONS.forEach((sec) => {
        sec.items.forEach((item, i) => {
          const q: any = typeof item === "string" ? { text: item } : item;
          if (answers[sec.key][i] === false) {
            negatives.push({ section: sec.title, item: q.text });
            if (q.critical) newCorrectives.push({ title: `Düzeltici İş - ${q.text}`, equipment, date: now.toISOString(), status: "Açık" });
          }
        });
      });

      const payload = {
        equipment,
        period,
        location,
        time: now.toISOString(),
        score: score.pct,
        negatives,
        notes,
      } satisfies Omit<Submission, "id">;

      // API'ye kaydet
      const res = await fetch("/api/users/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      if (!res.ok) throw new Error("Kayıt başarısız");

      // Listeyi yenile
      const list = await fetch("/api/submissions", { cache: "no-store" });
      if (list.ok) {
        setSubmissions(await list.json());
      }

      if (newCorrectives.length) setCorrectives((c) => [...newCorrectives, ...c]);

      // reset
      setNotes("");
      SECTIONS.forEach((s) => {
        setAnswers((prev) => ({ ...prev, [s.key]: s.items.map(() => null) }));
      });
      alert("Form kaydedildi ve panele işlendi.");
      setTab("panel");
    } catch (e) {
      console.error(e);
      alert("Kaydetme sırasında hata oluştu. Konsolu kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.h1 className="text-2xl md:text-3xl font-bold mb-4" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>Sepetli Mobil Vinç Kontrol – Demo</motion.h1>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="form">Operatör Formu</TabsTrigger>
          <TabsTrigger value="panel">Yönetici Paneli</TabsTrigger>
          <TabsTrigger value="correctives">Düzeltici İşler</TabsTrigger>
        </TabsList>

        {/* FORM */}
        <TabsContent value="form" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="space-y-6 p-6">
                {SECTIONS.map((sec) => (
                  <section key={sec.key} className="space-y-3">
                    <h3 className="font-semibold text-lg">{sec.title}</h3>
                    {sec.items.map((item, i) => {
                      const q: any = typeof item === "string" ? { text: item } : item;
                      return (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border p-3">
                          <div className="flex-1 text-sm">{q.text}</div>
                          <AnswerToggle value={answers[sec.key][i]} onChange={(v) => handleAnswer(sec.key, i, v)} />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Fotoğraf</Label>
                            <Input type="file" accept="image/*" className="max-w-[180px]" onChange={(e) => handlePhoto(sec.key, i, e.target.files?.[0])} />
                          </div>
                          {q.critical && (<span className="text-xs text-red-600">Kritik</span>)}
                        </div>
                      );
                    })}
                  </section>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Ekipman</Label>
                  <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="örn. VINC-001" />
                </div>
                <div className="space-y-2">
                  <Label>Periyot</Label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border rounded-md p-2">
                    <option value="gunluk">Günlük</option>
                    <option value="haftalık">Haftalık</option>
                    <option value="aylık">Aylık</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Konum</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Şantiye / Lokasyon" />
                </div>
                <div className="space-y-2">
                  <Label>Genel Not</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gözlemler, öneriler…" />
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /><div className="font-medium">Skor</div></div>
                  <div className="text-3xl font-bold">{score.pct}%</div>
                  <div className="text-sm text-muted-foreground">Cevaplanan: {score.ok}/{score.total}</div>
                </div>
                <Button onClick={submit} disabled={loading} className="w-full flex items-center gap-2">
                  {loading ? "Gönderiliyor..." : "Gönder"} <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PANEL */}
        <TabsContent value="panel" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Son Gönderimler</h3>
                <div className="overflow-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Ekipman</th>
                        <th className="text-left p-3">Periyot</th>
                        <th className="text-left p-3">Tarih/Saat</th>
                        <th className="text-left p-3">Konum</th>
                        <th className="text-left p-3">Skor</th>
                        <th className="text-left p-3">Uygunsuzluk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 && (
                        <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Henüz veri yok. Formu gönderdiğinizde burada görünecek.</td></tr>
                      )}
                      {submissions.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-3">{s.id}</td>
                          <td className="p-3">{s.equipment}</td>
                          <td className="p-3 capitalize">{s.period}</td>
                          <td className="p-3">{new Date(s.time).toLocaleString()}</td>
                          <td className="p-3">{s.location || "-"}</td>
                          <td className="p-3 font-semibold">{s.score}%</td>
                          <td className="p-3">{s.negatives?.length > 0 ? (<span className="inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {s.negatives.length} madde</span>) : (<span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 0</span>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Plan / Hatırlatmalar</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl border"><Calendar className="w-5 h-5 mt-0.5" /><div><div className="font-medium">Haftalık kontrol</div><div className="text-sm text-muted-foreground">Her Pazartesi 09:00 — {equipment}</div></div></div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border"><Clock className="w-5 h-5 mt-0.5" /><div><div className="font-medium">Aylık bakım testi</div><div className="text-sm text-muted-foreground">Ayın 1'i 08:30 — {equipment}</div></div></div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border"><MapPin className="w-5 h-5 mt-0.5" /><div><div className="font-medium">Lokasyon</div><div className="text-sm text-muted-foreground">{location || 'Konum doğrulaması (opsiyonel)'}</div></div></div>
                </div>
                <Button onClick={() => setTab("form")} className="w-full flex items-center gap-2">Yeni Kontrol Başlat <Upload className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DÜZELTİCİ İŞLER */}
        <TabsContent value="correctives" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Açık Düzeltici İşler</h3>
              <div className="overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3">Başlık</th>
                      <th className="text-left p-3">Ekipman</th>
                      <th className="text-left p-3">Tarih</th>
                      <th className="text-left p-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctives.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">Şu anda açık düzeltici iş yok.</td>
                      </tr>
                    )}
                    {correctives.map((c, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{c.title}</td>
                        <td className="p-3">{c.equipment}</td>
                        <td className="p-3">{new Date(c.date).toLocaleString()}</td>
                        <td className="p-3">{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="secondary" className="mt-4 flex items-center gap-2">PDF/Excel Çıktısı <FileDown className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



