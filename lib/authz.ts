import 'server-only';
import { redirect } from 'next/navigation';
import type { CurrentUser } from './auth';
import { Role, hasAccess } from './roles';

export function requireRole(user: CurrentUser | null, allowed: Role[], next?: string) {
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  if (!hasAccess(user.role, allowed)) redirect('/'); // or a /forbidden route
}