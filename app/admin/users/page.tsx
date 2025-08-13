import Link from 'next/link';
import InviteMemberForm from '@/components/ui/admin/forms/InviteMemberForm';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/authz';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Üyeler',
  description: 'Organizasyon üyelerini yönet, davet gönder ve roller ata.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/users' },
};

export default async function UsersPage() {
  const user = await getCurrentUser();
  requireRole(user, ['owner', 'admin'], '/admin/users');

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="text-xs text-neutral-500 dark:text-neutral-400" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/admin" className="hover:underline">Admin</Link>
              </li>
              <li className="opacity-60">/</li>
              <li className="font-medium text-neutral-700 dark:text-neutral-300">Üyeler</li>
            </ol>
          </nav>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Organizasyon Üyeleri</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Davet gönder, rol ata ve ekibini yönet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users?export=csv"
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            CSV Dışa Aktar
          </Link>
          <Link
            href="/admin/users?invite=1"
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            Hızlı Davet
          </Link>
        </div>
      </header>

      {/* İçerik 2 kolon: Sol=liste, Sağ=form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol kolon */}
        <section className="lg:col-span-2 space-y-4">
          {/* Araç çubuğu */}
          <form className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <input
              name="q"
              placeholder="Ara: ad veya e-posta"
              className="h-10 w-64 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
            />
            <select
              name="role"
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
              defaultValue=""
              aria-label="Rol filtresi"
            >
              <option value="">Tüm Roller</option>
              <option value="admin">Yönetici</option>
              <option value="manager">Sorumlu</option>
              <option value="editor">Editör</option>
              <option value="viewer">Görüntüleyici</option>

            </select>
            <button className="h-10 rounded-xl border px-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
              Filtrele
            </button>
          </form>

          {/* Üye tablosu (profesyonel iskelet) */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm dark:border-neutral-800">
              <div className="text-neutral-600 dark:text-neutral-300">Üyeler</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Sıralama / Filtreler yakında</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y text-sm dark:divide-neutral-800">
                <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Ad</th>
                    <th className="px-4 py-3 text-left font-medium">E-posta</th>
                    <th className="px-4 py-3 text-left font-medium">Rol</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-right font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-neutral-800">
                  {/* TODO: /api/org_members GET ile doldur */}
                  <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/60">
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium dark:bg-neutral-900">
                        —
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Aktif
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                        Düzenle
                      </button>
                    </td>
                  </tr>
                  {/* /TODO */}
                </tbody>
              </table>
            </div>

            {/* Basit sayfalama yeri */}
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Toplam 0 üye</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-900" disabled>
                  Önceki
                </button>
                <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-900" disabled>
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sağ kolon: Davet formu kartı */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-sm font-semibold">Üye Davet Et</h2>
            <InviteMemberForm />
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Davet e-postalarını Resend ile göndermek için gönderici adresini <strong>Ayarlar</strong>’dan tanımlayabilirsin.
            </p>
          </div>

          {/* Küçük bilgi kartları (opsiyonel metrikler) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-white p-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-neutral-500">Toplam Üye</p>
              <p className="mt-1 text-lg font-semibold">0</p>
            </div>
            <div className="rounded-2xl border bg-white p-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-neutral-500">Bekleyen Davet</p>
              <p className="mt-1 text-lg font-semibold">0</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
