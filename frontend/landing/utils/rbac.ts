/**
 * Peta peran → izin console. Sumber kebenarannya backend
 * (internal/rbac/permissions.go); berkas ini cerminannya untuk klien DAN
 * server Nitro — satu tempat, dua pemakai:
 *   - composables/usePermissions.ts   menu & tombol di peramban
 *   - server/api/cashflow/sesi.post.ts  keputusan sebelum membuat sesi CashFlow
 * Jangan diduplikasi lagi ke tempat ketiga.
 */
export type Permission = string

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'dashboard:view',
    'cashflow:view',
    'articles:list', 'articles:view', 'articles:create', 'articles:update',
    'articles:delete', 'articles:publish', 'articles:stats',
    'users:list', 'users:create', 'users:update', 'users:delete',
    'bots:list', 'bots:view', 'bots:create', 'bots:update',
    'bots:delete', 'bots:trigger',
    'ai:generate', 'ai:models', 'ai:settings:view', 'ai:settings:update',
    'keywords:list', 'keywords:view', 'keywords:create', 'keywords:update',
    'keywords:delete', 'keywords:ai_suggest',
    'apikeys:list', 'apikeys:view', 'apikeys:create', 'apikeys:update',
    'apikeys:delete', 'apikeys:copy',
    'upload:create', 'audit:list',
    'cad:licenses:list', 'cad:licenses:view', 'cad:licenses:create', 'cad:licenses:update',
    'cad:licenses:delete', 'cad:licenses:copy', 'cad:licenses:import',
    'cad:devices:list', 'cad:devices:manage', 'cad:analytics:view',
  ],
  admin: [
    'dashboard:view',
    'articles:list', 'articles:view', 'articles:create', 'articles:update', 'articles:stats',
    'users:list',
    'bots:list', 'bots:view',
    'keywords:list', 'keywords:view', 'keywords:ai_suggest',
    'ai:generate', 'ai:models', 'ai:settings:view',
    'apikeys:list', 'apikeys:view',
    'upload:create', 'audit:list',
    'cad:licenses:list', 'cad:licenses:view', 'cad:devices:list', 'cad:devices:manage', 'cad:analytics:view',
  ],
}

export const peranBoleh = (role: string | null | undefined, izin: Permission): boolean =>
  (ROLE_PERMISSIONS[role ?? ''] ?? []).includes(izin)
