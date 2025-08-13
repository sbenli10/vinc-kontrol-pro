// components/ui/admin/forms/InviteMemberForm.tsx
"use client";
import { useState } from "react";

export default function InviteMemberForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operator"|"viewer"|"editor"|"manager"|"admin">("operator");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    if (!email) return setMsg("E-posta gerekli.");
    setLoading(true);

    const res = await fetch("/api/org_members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {           // <-- BURASI ÖNEMLİ
      setMsg(`Hata: ${data?.error || "İşlem başarısız"}`);
      return;
    }
    setMsg(data?.message || "Davet gönderildi.");
  }

  return (
    <div className="rounded-2xl border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_140px]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kisi@firma.com"
          className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
        >
          <option value="operator">Operatör</option>
          <option value="viewer">Görüntüleyici</option>
          <option value="editor">Editör</option>
          <option value="manager">Sorumlu</option>
          <option value="admin">Yönetici</option>
        </select>
        <button
          onClick={submit}
          disabled={loading}
          className="border rounded-xl px-3 py-2 disabled:opacity-60"
        >
          {loading ? "Gönderiliyor…" : "Davet Gönder"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-neutral-500">{msg}</p>}
    </div>
  );
}
