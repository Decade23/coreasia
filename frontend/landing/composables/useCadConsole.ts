/**
 * CoreAsia Download Manager (CAD) console composable —
 * licenses, devices/installations, and analytics.
 */

export interface CadLicense {
  id: string
  key_masked: string
  email: string | null
  tier: string
  /** "cad" | "mounter" — baris lama tanpa field ini dianggap "cad". */
  product?: string
  status: string
  order_ref: string | null
  device_limit: number
  device_count: number
  platform: string | null
  expires_at: string | null
  last_transfer_at?: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CadDevice {
  id: string
  license_id: string | null
  device_hash: string
  app_version: string | null
  os_version: string | null
  platform: string | null
  revoked: boolean
  first_seen: string
  last_seen: string
}

export interface CadCount {
  label: string
  count: number
}

export interface CadTimePoint {
  date: string
  count: number
}

export interface CadSummary {
  total_licenses: number
  active_licenses: number
  total_devices: number
  active_devices: number
  by_version: CadCount[]
  by_os: CadCount[]
  by_country: CadCount[]
  daily_active: CadTimePoint[]
}

export const useCadConsole = () => {
  const api = useAdminApi()
  const toast = useToast()
  const { tc } = useConsoleI18n()

  const licenses = ref<CadLicense[]>([])
  const devices = ref<CadDevice[]>([])
  const summary = ref<CadSummary | null>(null)
  const loading = ref(false)
  const saving = ref(false)

  // Filter produk aktif untuk list lisensi ('' = semua). Diingat di sini supaya
  // refetch internal setelah mutasi (generate/import/revoke/delete) tetap memakai
  // filter yang sedang aktif di UI.
  const licenseProduct = ref('')

  const fetchLicenses = async (product?: string) => {
    if (product !== undefined) licenseProduct.value = product
    loading.value = true
    try {
      const res = await api.get<CadLicense[]>(
        '/admin/cad/licenses',
        licenseProduct.value ? { product: licenseProduct.value } : undefined,
      )
      licenses.value = res.data || []
    } catch {
      toast.error(tc('cad.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  const fetchDevices = async () => {
    loading.value = true
    try {
      const res = await api.get<CadDevice[]>('/admin/cad/devices')
      devices.value = res.data || []
    } catch {
      toast.error(tc('cad.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  const fetchAnalytics = async () => {
    loading.value = true
    try {
      const res = await api.get<CadSummary>('/admin/cad/analytics')
      summary.value = res.data
    } catch {
      toast.error(tc('cad.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  const importKeys = async (keys: string[], tier = 'lifetime'): Promise<boolean> => {
    saving.value = true
    try {
      const res = await api.post<{ imported: number; submitted: number }>('/admin/cad/licenses/import', { keys, tier })
      toast.success(tc('cad.imported', { n: res.data?.imported ?? 0, total: res.data?.submitted ?? keys.length }))
      await fetchLicenses()
      return true
    } catch (err: any) {
      toast.error(err?.data?.errors?.message || tc('cad.actionFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const generateKeys = async (email: string, tier = 'lifetime', count = 1, sendEmail = false, product = 'cad'): Promise<string[]> => {
    saving.value = true
    try {
      const res = await api.post<{ keys: string[]; count: number; emailed: number }>('/admin/cad/licenses/generate', { email, tier, count, send_email: sendEmail, product })
      const keys = res.data?.keys ?? []
      toast.success(sendEmail && (res.data?.emailed ?? 0) > 0
        ? tc('cad.generatedEmailed', { n: keys.length })
        : tc('cad.generated', { n: keys.length }))
      await fetchLicenses()
      return keys
    } catch (err: any) {
      toast.error(err?.data?.errors?.message || tc('cad.actionFailed'))
      return []
    } finally {
      saving.value = false
    }
  }

  const setStatus = async (id: string, status: string): Promise<boolean> => {
    saving.value = true
    try {
      await api.put(`/admin/cad/licenses/${id}`, { status })
      toast.success(tc('cad.updated'))
      await fetchLicenses()
      return true
    } catch (err: any) {
      toast.error(err?.data?.errors?.message || tc('cad.actionFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteLicense = async (id: string): Promise<boolean> => {
    saving.value = true
    try {
      await api.del(`/admin/cad/licenses/${id}`)
      toast.success(tc('cad.deleted'))
      await fetchLicenses()
      return true
    } catch (err: any) {
      toast.error(err?.data?.errors?.message || tc('cad.actionFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const deactivateDevice = async (deviceId: string): Promise<boolean> => {
    saving.value = true
    try {
      await api.post('/admin/cad/devices/' + deviceId + '/deactivate')
      toast.success(tc('cad.deviceReleased'))
      await fetchDevices()
      return true
    } catch (err: any) {
      toast.error(err?.data?.errors?.message || tc('cad.actionFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const copyKey = async (id: string): Promise<void> => {
    try {
      const res = await api.get<{ license_key: string }>(`/admin/cad/licenses/${id}/copy`)
      if (res.data?.license_key) {
        await navigator.clipboard.writeText(res.data.license_key)
        toast.success(tc('cad.copied'))
      }
    } catch {
      toast.error(tc('cad.actionFailed'))
    }
  }

  return {
    licenses, devices, summary, loading, saving,
    fetchLicenses, fetchDevices, fetchAnalytics,
    importKeys, generateKeys, setStatus, deleteLicense, copyKey, deactivateDevice,
  }
}
