'use client';
import { useState } from 'react';

export default function AssignForm({ templates, operators }: { templates: any[]; operators: any[] }) {
  const [templateId, setTemplate] = useState('');
  const [assigneeId, setAssignee] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setMsg(null);
    const res = await fetch('/api/assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId, assignee_id: assigneeId, title, description, due_at: dueAt || null })
    });
    if (res.ok) { setMsg('Atama oluşturuldu.'); window.location.reload(); }
    else { const t = await res.text(); setMsg('Hata: ' + t); }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select value={templateId} onChange={e=>setTemplate(e.target.value)} className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900">
          <option value="">Şablon seç</option>
          {templates.map((t:any)=> <option key={t.id} value={t.id}>{t.name ?? t.id.slice(0,8)}</option>)}
        </select>
        <select value={assigneeId} onChange={e=>setAssignee(e.target.value)} className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900">
          <option value="">Operatör seç</option>
          {operators.map((u:any)=> <option key={u.user_id} value={u.user_id}>{u.user_id.slice(0,8)}…</option>)}
        </select>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Başlık" className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900" />
        <input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} className="border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900" />
      </div>
      <textarea value={description} onChange={e=>setDesc(e.target.value)} placeholder="Açıklama (opsiyonel)" className="mt-3 w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900" />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={create} className="border rounded-xl px-3 py-2">Atama Oluştur</button>
        {msg && <span className="text-sm text-neutral-500">{msg}</span>}
      </div>
    </div>
  );
}