// components/ui/forms/DynamicForm.tsx
'use client';

import { useState } from 'react';

type Field = {
  key?: string;
  name?: string;
  label?: string;
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: Array<any>;
};

type Props = {
  assignmentId: string;
  template: any;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  disabled?: boolean;
};

export default function DynamicForm({ assignmentId, template, onSubmit, disabled }: Props) {
  const fields = (template?.schema?.fields ?? []) as Array<Field>;
  const [values, setValues] = useState<Record<string, any>>({});

  function setField(k: string, v: any) {
    setValues(prev => ({ ...prev, [k]: v }));
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    // values -> parent’a gönder (ör. TaskFormClient submitToApi { assignment_id, answers })
    await onSubmit?.(values);
  }

  return (
    <form onSubmit={handleFormSubmit} className="rounded-2xl border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 space-y-3">
      {fields.length === 0 && (
        <div className="text-sm text-neutral-500">Şablon alanı bulunamadı.</div>
      )}

      {fields.map((f) => {
        const key = f.key || f.name!;
        const label = f.label || key;
        const type = f.type || 'text';
        const required = !!f.required;

        if (type === 'textarea') {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-300">
                {label}{required ? ' *' : ''}
              </label>
              <textarea
                className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                required={required}
                disabled={disabled}
                value={values[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          );
        }

        if (type === 'number') {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-300">
                {label}{required ? ' *' : ''}
              </label>
              <input
                type="number"
                className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                required={required}
                disabled={disabled}
                value={values[key] ?? ''}
                onChange={(e) => setField(key, e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          );
        }

        if (type === 'select') {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-300">
                {label}{required ? ' *' : ''}
              </label>
              <select
                className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                required={required}
                disabled={disabled}
                value={values[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
              >
                <option value="">Seçin…</option>
                {(f.options || []).map((opt: any) => {
                  const val = String(opt?.value ?? opt);
                  const lab = String(opt?.label ?? opt);
                  return <option key={val} value={val}>{lab}</option>;
                })}
              </select>
            </div>
          );
        }

        if (type === 'checkbox') {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-300">
                {label}{required ? ' *' : ''}
              </label>
              <div>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={!!values[key]}
                  onChange={(e) => setField(key, e.target.checked)}
                />
              </div>
            </div>
          );
        }

        if (type === 'date') {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-300">
                {label}{required ? ' *' : ''}
              </label>
              <input
                type="date"
                className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                required={required}
                disabled={disabled}
                value={values[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          );
        }

        // default: text
        return (
          <div key={key} className="space-y-1">
            <label className="text-xs text-neutral-600 dark:text-neutral-300">
              {label}{required ? ' *' : ''}
            </label>
            <input
              type="text"
              className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
              required={required}
              disabled={disabled}
              value={values[key] ?? ''}
              onChange={(e) => setField(key, e.target.value)}
            />
          </div>
        );
      })}

      <div className="pt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="border rounded-xl px-4 py-2 disabled:opacity-60"
          aria-disabled={disabled}
        >
          {disabled ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
    </form>
  );
}
