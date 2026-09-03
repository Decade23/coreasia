// Peta peran → izin ada di utils/rbac.ts (dipakai juga oleh server Nitro).
import { ROLE_PERMISSIONS, type Permission } from '~/utils/rbac'

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
