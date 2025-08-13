'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, FileText, CalendarRange, Settings, Menu, Sun, Moon, LogOut, BarChart3 } from 'lucide-react';
import type { Role, NavItem } from '@/lib/roles';
import { hasAccess } from '@/lib/roles';

export type ShellUser = { id: string; email: string; name?: string; role: Role };

const ALL_NAV: NavItem[] = [
  { href: '/admin/users', label: 'Üyeler', icon: Users, allowed: ['owner', 'admin'] },
  { href: '/admin/templates', label: 'Şablonlar', icon: FileText, allowed: ['owner', 'admin', 'manager'] },
  { href: '/admin/plans', label: 'Planlar', icon: CalendarRange, allowed: ['owner', 'admin', 'manager'] },
  { href: '/admin/settings', label: 'Ayarlar', icon: Settings, allowed: ['owner', 'admin'] },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function AdminShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const nav = ALL_NAV.filter((n) => hasAccess(user.role, n.allowed));

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-neutral-900 antialiased transition dark:bg-neutral-950 dark:text-neutral-100">
        {/* Sidebar */}
        <aside className={classNames('fixed inset-y-0 left-0 z-30 hidden border-r bg-white transition-all dark:border-neutral-800 dark:bg-neutral-950 lg:block', collapsed ? 'w-[84px]' : 'w-64')}>
          <div className="flex h-16 items-center gap-2 px-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
              <BarChart3 size={18} />
            </div>
            {!collapsed && <span className="text-sm font-semibold tracking-tight">Admin</span>}
            <button onClick={() => setCollapsed((v) => !v)} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label="Collapse sidebar">
              <Menu size={18} />
            </button>
          </div>
          <nav className="mt-2 space-y-1 px-2">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={classNames('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', active ? 'bg-neutral-900 text-white shadow dark:bg-white dark:text-neutral-900' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100')}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Topbar + content */}
        <div className={classNames('lg:pl-64', collapsed && 'lg:pl-[84px]')}>
          <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-3 border-b bg-white/70 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
            <button onClick={() => setCollapsed((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label="Toggle sidebar">
              <Menu size={18} />
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setDark((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label="Toggle theme">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="ml-1 hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-xs font-semibold">{user.name ?? 'Kullanıcı'}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{user.email}</p>
                </div>
                <button className="inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label="Sign out">
                  <LogOut size={16} /> Çıkış
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl p-4 sm:p-6">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
