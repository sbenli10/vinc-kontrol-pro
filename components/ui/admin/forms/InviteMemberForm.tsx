'use client';
import { useState } from 'react';

export default function InviteMemberForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'editor' | 'viewer'>('manager');
  const [pending, setPending] = useState(false);

  // ...
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setPending(true);
  const res = await fetch('/api/org_members/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  setPending(false);
  if (!res.ok) return alert('Davet gönderilemedi');
  setEmail('');
  alert('Davet gönderildi');
}


  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid gap-1">
        <label className="text-sm font-medium">E-posta</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900" placeholder="kisi@ornek.com" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button disabled={pending} className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900">
          Davet Gönder
        </button>
      </div>
    </form>
  );
}
