'use client';
import { useState } from 'react';

export default function PlanForm() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [assignee, setAssignee] = useState('');
  const [title, setTitle] = useState('');

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, period, assignee }),
  });
  if (res.ok) { setTitle(''); setAssignee(''); alert('Plan oluşturuldu'); }
}


  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Başlık</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900" placeholder="Haftalık kontrol" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Periyot</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
          <option value="weekly">Haftalık</option>
          <option value="monthly">Aylık</option>
        </select>
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Atanacak kişi</label>
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900" placeholder="email veya ad" />
      </div>
      <div>
        <button className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">Planı Kaydet</button>
      </div>
    </form>
  );
}
