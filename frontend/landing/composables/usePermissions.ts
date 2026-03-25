// Keep in sync with backend: internal/rbac/permissions.go
type Permission = string

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'dashboard:view',
    'articles:list', 'articles:view', 'articles:create', 'articles:update',
    'articles:delete', 'articles:publish', 'articles:stats',
    'users:list', 'users:create', 'users:update', 'users:delete',
    'bots:list', 'bots:view', 'bots:create', 'bots:update',
    'bots:delete', 'bots:trigger',
    'ai:generate', 'ai:models', 'ai:settings:view', 'ai:settings:update',
    'apikeys:list', 'apikeys:view', 'apikeys:create', 'apikeys:update',
    'apikeys:delete', 'apikeys:copy',
    'upload:create', 'audit:list',
  ],
  admin: [
    'dashboard:view',
    'articles:list', 'articles:view', 'articles:create', 'articles:update', 'articles:stats',
    'users:list',
    'bots:list', 'bots:view',
    'ai:generate', 'ai:models', 'ai:settings:view',
    'apikeys:list', 'apikeys:view',
    'upload:create', 'audit:list',
  ],
}

export const usePermissions = () => {
  const { user } = useAdminAuth()

  const permissions = computed(() => {
    const role = user.value?.role || ''
    return new Set(ROLE_PERMISSIONS[role] || [])
  })

  const can = (permission: Permission): boolean => {
    return permissions.value.has(permission)
  }

  const canAny = (...perms: Permission[]): boolean => {
    return perms.some(p => permissions.value.has(p))
  }

  return { can, canAny, permissions }
}
