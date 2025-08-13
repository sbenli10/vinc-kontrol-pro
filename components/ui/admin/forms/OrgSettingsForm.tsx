'use client';
import { useState } from 'react';

export default function OrgSettingsForm() {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [fromEmail, setFromEmail] = useState('');
    // TODO: multipart upload for logo -> /api/org/logo
    // TODO: save name + email -> /api/org/settings
    // TODO: Resend domain/sender config on server side
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  const res = await fetch('/api/org/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, fromEmail }),
  });
  if (res.ok) alert('Ayarlar kaydedildi');
}


  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Organizasyon Adı</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900" placeholder="Örn: VINC" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Logo</label>
        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border file:px-3 file:py-1 dark:border-neutral-800 dark:bg-neutral-900" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Bildirim Gönderen (Resend)</label>
        <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900" placeholder="noreply@domain.com" />
      </div>
      <button className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">Kaydet</button>
    </form>
  );
}