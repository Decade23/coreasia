/**
 * Autentikasi console (Fase 0c).
 *
 * Login dua langkah, dikirim peramban LANGSUNG ke gateway publik (seperti
 * sebelum 0c), supaya pembatas per IP dan audit gateway melihat IP admin yang
 * asli, bukan IP keluar Vercel:
 *   login(email, sandi) → POST {gateway}/admin/auth/login
 *     → 'masuk' : token langsung diserahkan ke BFF (POST /api/admin/sesi), yang
 *                 memvalidasinya ke gateway lalu memasang cookie HttpOnly;
 *     → 'mfa'   : admin ber-TOTP; tantangan MFA disimpan di VARIABEL closure
 *                 ini saja (bukan state reaktif, bukan storage), lanjut
 *                 verifikasiTotp(kode) → POST {gateway}/admin/auth/totp/verify
 *                 → serah terima yang sama;
 *     → 'gagal' : galat di `galat` (status, kode, pesan, tunggu, sumber).
 * Token tidak pernah disimpan di storage atau cookie JS; setelah serah terima,
 * halaman login memuat dokumen console baru sehingga memorinya ikut dibuang.
 *
 * Sesudah masuk, token gateway tidak pernah menyentuh JS: refresh, proxy, dan
 * logout ditangani rute server /api/admin/* dan /api/gw/**. Klien hanya
 * menyimpan data pengguna (useState) untuk tampilan; siapa yang boleh apa
 * tetap diputuskan gateway di setiap panggilan. Setiap panggilan BFF membawa
 * token ikatan dokumen console (useKonsolIkatan).
 */
import type { GalatKonsol } from '~/utils/konsol'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  /** Dari /me: sesi ini lolos TOTP. */
  mfa?: boolean
  /** Dari /me: saat kode TOTP sesi ini diverifikasi (null bila mfa=false). */
  mfa_at?: string | null
  /** Dari /me: TOTP akun ini aktif. */
  totp_enabled?: boolean
  totp_enabled_at?: string | null
  /** Dari /me: akun dibuat (syarat umur "sesi kuat" gateway, utils/rbac.ts sesiKuat). */
  created_at?: string | null
}

/** Bentuk galat seragam (utils/konsol.ts galatDari, galatJaringan, menitTunggu). */
export type GalatAuth = GalatKonsol

export type HasilLogin = 'masuk' | 'mfa' | 'gagal'

const HEADER_TULIS = { 'X-Console': '1' } as const

/** Base gateway publik untuk login langsung dari peramban. */
const gatewayPublik = (): string =>
  String(useRuntimeConfig().public.gatewayPublicUrl || '').replace(/\/+$/, '')

interface JawabanToken {
  access_token?: unknown
  refresh_token?: unknown
  mfa_required?: unknown
  challenge?: unknown
}

export const useAdminAuth = () => {
  const { tc } = useConsoleI18n()

  const user = useState<AdminUser | null>('admin_user', () => null)
  const loginError = ref('')
  const galat = ref<GalatAuth | null>(null)
  const pending = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  /* Tantangan MFA dari gateway: hanya di closure ini (halaman login), bukan
     ref/useState (tidak ikut payload/devtools) dan bukan storage. */
  let tantangan: string | null = null
  const lupakanTantangan = () => { tantangan = null }

  const catatGalat = (err: unknown, cadangan: string, sumber: GalatAuth['sumber']): GalatAuth => {
    const g = { ...galatDari(err), sumber }
    galat.value = g
    loginError.value = g.pesan || cadangan
    return g
  }

  /** POST JSON ke gateway publik. credentials:'omit': cookie domain gateway
   *  tidak dikirim dan Set-Cookie gateway diabaikan (sesi hanya milik BFF). */
  const keGateway = (jalur: string, badan: Record<string, string>) =>
    $fetch<{ data?: JawabanToken | null }>(`${gatewayPublik()}${jalur}`, {
      method: 'POST',
      body: badan,
      credentials: 'omit',
      retry: 0,
      timeout: 20_000,
    })

  /**
   * Serahkan token hasil login ke BFF. `data` sengaja tidak disimpan di mana
   * pun: sesudah fungsi ini tidak ada rujukan ke token, dan halaman login
   * memuat dokumen console baru.
   */
  const serahkan = async (data: JawabanToken | null | undefined): Promise<boolean> => {
    if (typeof data?.access_token !== 'string' || typeof data?.refresh_token !== 'string') {
      galat.value = { status: 502, kode: 'JAWABAN_LOGIN', pesan: '', tunggu: null, sumber: 'gateway' }
      return false
    }
    try {
      const res = await $fetch<{ data: { user?: AdminUser | null } }>('/api/admin/sesi', {
        method: 'POST',
        headers: { ...HEADER_TULIS, ...headerIkatan() },
        body: { access_token: data.access_token, refresh_token: data.refresh_token },
        retry: 0,
      })
      user.value = res?.data?.user ?? null
      return !!user.value
    } catch (err) {
      pulihkanIkatan(err)
      catatGalat(err, tc('login.sesiGagal'), 'console')
      return false
    }
  }

  const login = async (email: string, password: string): Promise<HasilLogin> => {
    loginError.value = ''
    galat.value = null
    tantangan = null
    pending.value = true
    try {
      let res: { data?: JawabanToken | null } | null
      try {
        res = await keGateway('/admin/auth/login', { email, password })
      } catch (err) {
        catatGalat(err, tc('feedback.loginFailed'), 'gateway')
        return 'gagal'
      }
      if (res?.data?.mfa_required === true && typeof res.data.challenge === 'string' && res.data.challenge) {
        tantangan = res.data.challenge
        return 'mfa'
      }
      return (await serahkan(res?.data)) ? 'masuk' : 'gagal'
    } finally {
      pending.value = false
    }
  }

  const verifikasiTotp = async (kode: string): Promise<boolean> => {
    loginError.value = ''
    galat.value = null
    if (!tantangan) {
      galat.value = { status: 401, kode: 'MFA_CHALLENGE_INVALID', pesan: '', tunggu: null, sumber: 'gateway' }
      return false
    }
    pending.value = true
    try {
      let res: { data?: JawabanToken | null } | null
      try {
        res = await keGateway('/admin/auth/totp/verify', { challenge: tantangan, code: kode })
      } catch (err) {
        if (catatGalat(err, tc('login.totpFailed'), 'gateway').kode === 'MFA_CHALLENGE_INVALID') tantangan = null
        return false
      }
      // Tantangan sekali pakai: sesudah kode diterima tidak disimpan lagi.
      tantangan = null
      return await serahkan(res?.data)
    } finally {
      pending.value = false
    }
  }

  /** Muat ulang data pengguna dari gateway (/me: termasuk mfa & totp_enabled). */
  const fetchMe = async (): Promise<boolean> => {
    try {
      const res = await $fetch<{ data: AdminUser | null }>(`${KONSOL_API_BASE}/admin/auth/me`, { headers: headerIkatan() })
      user.value = res?.data ?? null
      return !!user.value
    } catch (err) {
      pulihkanIkatan(err)
      user.value = null
      return false
    }
  }

  /** Hapus jejak sesi di tab ini (CashFlow + data pengguna). Cookie dihapus server. */
  const bersihkanLokal = async () => {
    // Sesi modul CashFlow (Supabase) ikut dicabut di server — tanpa ini token
    // di sessionStorage tetap hidup sampai tab ditutup walau console sudah keluar.
    try {
      await useCashflowSesi().keluar()
    } catch { /* modul tidak terkonfigurasi atau sudah tidak ada sesi */ }
    user.value = null
  }

  /**
   * Keluar di server DULU. Bila gagal (5xx, jaringan, 403), admin tetap di
   * console dan pemanggil menampilkan galat: pindah ke /console/login dengan
   * cookie yang masih hidup hanya membuat halaman login mengembalikannya ke
   * console, sehingga tombol Keluar tampak tidak bekerja.
   * `ke` (opsional, jalur /console…): halaman login mengembalikan ke sana
   * sesudah masuk lagi — dipakai "Masuk ulang dengan TOTP".
   */
  const logout = async (ke?: string): Promise<boolean> => {
    galat.value = null
    try {
      await $fetch('/api/admin/logout', { method: 'POST', headers: HEADER_TULIS })
    } catch (err) {
      galat.value = galatDari(err)
      return false
    }
    await bersihkanLokal()
    await navigateTo(ke ? { path: '/console/login', query: { ke } } : '/console/login')
    return true
  }

  /**
   * Dipanggil sesudah gateway mengakhiri semua sesi admin ini (logout-all,
   * TOTP diaktifkan/dimatikan). Proxy sudah menghapus cookie dan mencabut
   * sesi CashFlow di server; di sini jejak lokal dibersihkan lalu ke login.
   */
  const sesiDiakhiri = async (sebab: 'semua-perangkat' | 'totp-aktif' | 'totp-mati' | 'sandi-diganti') => {
    await bersihkanLokal()
    await navigateTo({ path: '/console/login', query: { info: sebab } })
  }

  return { user, isAuthenticated, loginError, galat, pending, login, verifikasiTotp, lupakanTantangan, fetchMe, logout, sesiDiakhiri }
}
