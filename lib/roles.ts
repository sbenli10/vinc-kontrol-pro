export type Role = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer';

export type NavItem = {
  href: `/admin/${string}`;
  label: string;
  icon: any; // lucide icon component
  allowed: Role[]; // who can see & visit
};

// Simple utility: owners can do everything.
export function hasAccess(role: Role, allowed: Role[]) {
  return role === 'owner' || allowed.includes(role);
}

// Keep route access explicit and single‑sourced
export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/admin/users': ['owner', 'admin'],
  '/admin/templates': ['owner', 'admin', 'manager'],
  '/admin/plans': ['owner', 'admin', 'manager'],
  '/admin/settings': ['owner', 'admin'],
};
