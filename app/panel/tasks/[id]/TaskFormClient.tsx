// app/panel/tasks/[id]/TaskFormClient.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DynamicForm from '@/components/ui/forms/DynamicForm';

type Props = {
  assignmentId: string;
  template: any;
};

async function submitToApi(payload: { assignment_id: string; answers: any }) {
  // JSON’a uygunlaştır: Date -> ISO, undefined temizlenir
  const safe = JSON.parse(
    JSON.stringify(payload, (_k, v) => (v instanceof Date ? v.toISOString() : v))
  );

  let res: Response;
  try {
    res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // çerezler taşınsın
      body: JSON.stringify(safe),
    });
  } catch (netErr: any) {
    throw new Error(`Ağ hatası: ${netErr?.message ?? 'ulaşılamıyor'}`);
  }

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (text && text.slice(0, 300)) ||
      res.statusText ||
      'Bilinmeyen hata';
    throw new Error(`${res.status} ${msg}`);
  }

  return data ?? {};
}

export default function TaskFormClient({ assignmentId, template }: Props) {
  // --- MOUNT GUARD: SSR'da render etme -> hydration mismatch biter
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // --- UI state'leri
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // unmount'ta devam eden isteği iptal et
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const handleSubmit = useCallback(async (formValues: any) => {
    if (loading) return; // çifte tıklamayı engelle
    setMsg(null);
    setLoading(true);

    // önceki isteği iptal et (kullanıcı hızlıca ikinci kez tıklarsa)
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      await submitToApi({ assignment_id: assignmentId, answers: formValues });
      setMsg({ type: 'ok', text: 'Gönderildi.' });
      // istersen: router.push('/panel/tasks');
    } catch (e: any) {
      console.error('Submissions API error:', e);
      setMsg({ type: 'err', text: `Submissions API error: ${e?.message ?? 'Kayıt başarısız'}` });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [assignmentId, loading]);

  return (
    <div className="space-y-3">
      <DynamicForm
        assignmentId={assignmentId}
        template={template}
        onSubmit={handleSubmit}   // fetch burada
        disabled={loading}
      />

      {msg?.type === 'ok' && (
        <div className="text-sm text-green-700">✅ {msg.text}</div>
      )}
      {msg?.type === 'err' && (
        <div className="text-sm text-red-600 whitespace-pre-wrap">⚠️ {msg.text}</div>
      )}
    </div>
  );
}
