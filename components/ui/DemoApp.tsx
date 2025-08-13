// components/ui/DemoApp.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, AlertTriangle, Camera, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------
   1) ŞABLON – kritik maddeleri işaretle
-------------------------------------------------*/
type QA = string | { text: string; critical?: boolean };

const SECTIONS: { key: string; title: string; items: QA[] }[] = [
  { key: "genel", title: "1. Genel Görsel Kontrol", items: [
    "Vincin dış yüzeyinde hasar, çatlak veya korozyon var mı?",
    "Sepet platformunda deformasyon, kırık veya aşınma var mı?",
    "Etiketler/uyarılar okunabilir durumda mı?",
    "Sabitleme pimleri ve bağlantı elemanları yerinde ve sağlam mı?",
  ]},
  { key: "hidrolik", title: "2. Hidrolik Sistem", items: [
    "Hidrolik yağ seviyesi uygun mu?",
    "Hortum/bağlantılarda sızıntı var mı?",
    "Silindirlerde hasar/aşınma var mı?",
    "Sistem basıncı normal aralıkta mı?",
  ]},
  { key: "elektrik", title: "3. Elektrik Sistemi", items: [
    "Kontrol paneli ve düğmeler düzgün çalışıyor mu?",
    { text: "Acil durdurma butonu işlevsel mi?", critical: true },
    "Kablolar/bağlantılar sağlam ve izole mi?",
    "Aydınlatma/iletişim sistemleri çalışıyor mu?",
  ]},
  { key: "mekanik", title: "4. Mekanik", items: [
    "Bom/teleskopik kollar düzgün hareket ediyor mu?",
    "Denge ayakları işlevsel mi?",
    "Halat/zincirlerde aşınma/kopma/bükülme var mı?",
    "Hareketli parçalar yağlı ve sorunsuz mu?",
  ]},
  { key: "guvenlik", title: "5. Güvenlik Sistemleri", items: [
    "Aşırı yük kontrol sistemi aktif mi?",
    { text: "Acil iniş sistemi çalışıyor mu?", critical: true },
    "Sepet emniyet kemerleri sağlam mı?",
    "Limit switch’ler çalışıyor mu?",
  ]},
  { key: "arac", title: "6. Araç & Şasi", items: [
    "Lastiklerin durumu uygun mu?",
    "Fren sistemi düzgün mü?",
    "Motor/şanzımanda anormallik var mı?",
    "Yakıt seviyesi yeterli mi?",
  ]},
  { key: "operator", title: "7. Operatör", items: [
    "Operatör sertifika/eğitim uygun mu?",
    "KKD (baret/kemer vb.) kullanılıyor mu?",
    "Çalışma alanı bariyer/işaretleme tamam mı?",
  ]},
  { key: "test", title: "8. Çalışma Öncesi Test", items: [
    "Tüm hareket yönleri test edildi mi?",
    "Yük testi (kapasiteye uygun) yapıldı mı?",
    { text: "Acil durdurma/kurtarma prosedürleri test edildi mi?", critical: true },
  ]},
];

/* ------------------------------------------------
   2) BİLEŞEN
-------------------------------------------------*/
type Neg = { section: string; item: string; critical?: boolean };

export default function DemoApp() {
  const router = useRouter();

  // form state
  const [equipment, setEquipment] = useState("VINC-001");
  const [period, setPeriod] = useState<"gunluk" | "haftalık" | "aylık">("haftalık");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // cevaplar: true=Evet, false=Hayır, null=Boş
  const [answers, setAnswers] = useState<Record<string, (boolean | null)[]>>(() => {
    const obj: Record<string, (boolean | null)[]> = {};
    SECTIONS.forEach(s => obj[s.key] = s.items.map(() => null));
    return obj;
  });

  // foto isimleri (opsiyonel – şimdilik upload yok)
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const score = useMemo(() => {
    let total = 0, ok = 0;
    for (const s of SECTIONS) {
      answers[s.key].forEach(v => {
        if (v !== null) total += 1;
        if (v === true) ok += 1;
      });
    }
    return total === 0 ? 0 : Math.round((ok / total) * 100);
  }, [answers]);

  const negatives = useMemo<Neg[]>(() => {
    const list: Neg[] = [];
    for (const s of SECTIONS) {
      s.items.forEach((q, i) => {
        const meta = typeof q === "string" ? { text: q } : q;
        if (answers[s.key][i] === false) {
          list.push({ section: s.title, item: meta.text, critical: !!meta.critical });
        }
      });
    }
    return list;
  }, [answers]);

  const critical = useMemo(
    () => negatives.some(n => n.critical),
    [negatives]
  );

  function setAnswer(sectionKey: string, index: number, val: boolean) {
    setAnswers(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((v, i) => i === index ? val : v),
    }));
  }

  function setPhoto(sectionKey: string, index: number, file?: File) {
    const key = `${sectionKey}-${index}`;
    setPhotos(p => ({ ...p, [key]: file?.name || "Seçilmedi" }));
  }

  async function submit() {
    if (!equipment.trim()) return alert("Ekipman gerekli");
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        equipment,
        period,
        location,
        time: now,
        score,
        negatives,
        notes,
        // İstersen ham cevapları da saklayabilirsin:
        payload: { answers, photos },
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let out: any; try { out = JSON.parse(text); } catch { out = text; }

      if (!res.ok) {
        console.error("POST /api/submissions:", res.status, out);
        alert(typeof out === "string" ? out : (out?.error ?? `Hata: ${res.status}`));
        return;
      }

      // başarı → sıfırla + dashboard’a dön
      SECTIONS.forEach(s => {
        setAnswers(prev => ({ ...prev, [s.key]: s.items.map(() => null) }));
      });
      setNotes("");
      alert("Form kaydedildi.");
      router.replace("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Kaydetme sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Başlık + Özet */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Sepetli Mobil Vinç Kontrol Formu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operatör formunu doldurup gönderin. Kritik “Hayır” cevapları düzeltici iş olarak işaretlenir.
          </p>
        </div>
        <Card className="w-full md:w-80">
          <CardContent className="p-4 space-y-2">
            <div className="text-xs text-muted-foreground">Skor</div>
            <div className="text-3xl font-semibold">{score}%</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {critical ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Kritik uygunsuzluk var
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Kritik uygunsuzluk yok
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Üst bilgi alanları */}
      <Card>
        <CardContent className="p-6 grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ekipman</Label>
            <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="örn. VINC-001" />
          </div>
          <div className="space-y-2">
            <Label>Periyot</Label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full border rounded-md p-2 bg-background"
            >
              <option value="gunluk">Günlük</option>
              <option value="haftalık">Haftalık</option>
              <option value="aylık">Aylık</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Konum</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Şantiye / Lokasyon" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>Genel Not</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gözlemler, öneriler…" />
          </div>
        </CardContent>
      </Card>

      {/* Soru bölümleri */}
      {SECTIONS.map((sec) => (
        <Card key={sec.key}>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">{sec.title}</h3>
            {sec.items.map((q, i) => {
              const meta = typeof q === "string" ? { text: q } : q;
              const val = answers[sec.key][i];
              return (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border p-3">
                  <div className="flex-1 text-sm">{meta.text}</div>

                  <div className="flex items-center gap-4">
                    <Label className="text-xs">Hayır</Label>
                    <Switch
                      checked={val === true}
                      onCheckedChange={(v) => setAnswer(sec.key, i, Boolean(v))}
                    />
                    <Label className="text-xs">Evet</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs flex items-center gap-1"><Camera className="w-3 h-3" /> Foto</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-[200px]"
                      onChange={(e) => setPhoto(sec.key, i, e.target.files?.[0])}
                    />
                  </div>

                  {meta.critical && (
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300">
                      Kritik
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Gönder */}
      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={loading}
          className="min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gönderiliyor…
            </>
          ) : (
            <>
              Gönder <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Not: Fotoğraflar şu an sadece isim olarak tutuluyor.
               İstersen Supabase Storage ile upload akışını ekleyebiliriz. */}
    </div>
  );
}
