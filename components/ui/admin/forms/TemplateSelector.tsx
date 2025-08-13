'use client';
import { useState } from 'react';

type Template = { id: string; name: string; fields: number };
const MOCK: Template[] = [
  { id: 't1', name: 'Standart Kontrol Formu', fields: 8 },
  { id: 't2', name: 'Genişletilmiş Denetim', fields: 14 },
];

export default function TemplateSelector() {
  const [active, setActive] = useState('t1');
async function setActiveTemplate(id: string) {
  setActive(id);
  await fetch('/api/templates/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3 text-sm font-semibold">Form Şablonları</div>
      <ul className="divide-y text-sm dark:divide-neutral-800">
        {MOCK.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-neutral-500">{t.fields} alan</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTemplate(t.id)} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                {active === t.id ? 'Aktif' : 'Aktifleştir'}
              </button>
              <button className="rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">Düzenle</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}