/**
 * Masuk ke modul CashFlow: email + sandi, lalu TOTP — persis urutan yang sudah
 * dipakai konsol lama (admin-next): signInWithPassword → mfa.listFactors →
 * mfa.challengeAndVerify → mfa.getAuthenticatorAssuranceLevel.
 *
 * Dua keadaan yang dibedakan dengan sengaja:
 *   'perlu-totp'   akun punya faktor TOTP; minta kodenya.
 *   'perlu-enroll' akun admin tapi BELUM punya faktor TOTP; tawarkan enroll.
 *                  Ini terjadi sekali per akun — is_platform_admin() menolak
 *                  apa pun sampai aal2, jadi tanpa enroll modul ini kosong.
 *
 * Pesan galat TIDAK membocorkan apakah sebuah email terdaftar sebagai admin:
 * "Email atau sandi salah" untuk kredensial, dan penolakan admin baru terlihat
 * saat RPC pertama dipanggil (42501) — itu urusan useCashflowAdmin.
 */
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export type TahapMasuk = 'kredensial' | 'perlu-totp' | 'perlu-enroll' | 'selesai'

export const useCashflowAuth = () => {
  const { $cashflowSupabase } = useNuxtApp()
  const sb = $cashflowSupabase as SupabaseClient | null

  const sesi = useState<Session | null>('cf_sesi', () => null)
  const tahap = useState<TahapMasuk>('cf_tahap', () => 'kredensial')
  const galat = ref('')
  const sibuk = ref(false)
  const faktorId = useState<string | null>('cf_faktor', () => null)
  /** Untuk enroll: URI otpauth + SVG QR dari Supabase. */
  const enrollData = ref<{ id: string; qr: string; uri: string } | null>(null)

  const terkonfigurasi = computed(() => !!sb)

  const segarkan = async () => {
    if (!sb) return
    const { data } = await sb.auth.getSession()
    sesi.value = data.session
    if (!data.session) { tahap.value = 'kredensial'; return }
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
    tahap.value = aal?.currentLevel === 'aal2' ? 'selesai' : 'perlu-totp'
  }

  const masuk = async (email: string, sandi: string): Promise<TahapMasuk | null> => {
    if (!sb) { galat.value = 'Modul belum dikonfigurasi.'; return null }
    galat.value = ''
    sibuk.value = true
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: sandi })
      if (error || !data.session) { galat.value = 'Email atau sandi salah.'; return null }
      sesi.value = data.session

      const { data: f } = await sb.auth.mfa.listFactors()
      const totp = f?.totp?.find(x => x.status === 'verified') ?? f?.totp?.[0]
      if (!totp) { tahap.value = 'perlu-enroll'; return tahap.value }
      faktorId.value = totp.id
      tahap.value = 'perlu-totp'
      return tahap.value
    } finally {
      sibuk.value = false
    }
  }

  const verifikasiTotp = async (kode: string): Promise<boolean> => {
    if (!sb || !faktorId.value) return false
    galat.value = ''
    sibuk.value = true
    try {
      const { error } = await sb.auth.mfa.challengeAndVerify({
        factorId: faktorId.value, code: kode.replace(/\D/g, ''),
      })
      if (error) { galat.value = 'Kode tidak cocok atau sudah kedaluwarsa.'; return false }
      await segarkan()
      return tahap.value === 'selesai'
    } finally {
      sibuk.value = false
    }
  }

  const mulaiEnroll = async (): Promise<boolean> => {
    if (!sb) return false
    galat.value = ''
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'console.coreasia.id' })
    if (error || !data) { galat.value = 'Tidak bisa memulai pendaftaran TOTP.'; return false }
    enrollData.value = { id: data.id, qr: data.totp.qr_code, uri: data.totp.uri }
    faktorId.value = data.id
    return true
  }

  /** Enroll selesai = verifikasi pertama dengan kode dari aplikasi autentikator. */
  const selesaikanEnroll = async (kode: string): Promise<boolean> => verifikasiTotp(kode)

  const keluar = async () => {
    if (sb) await sb.auth.signOut()
    sesi.value = null
    tahap.value = 'kredensial'
    faktorId.value = null
    enrollData.value = null
  }

  return {
    sb, sesi, tahap, galat, sibuk, enrollData, terkonfigurasi,
    segarkan, masuk, verifikasiTotp, mulaiEnroll, selesaikanEnroll, keluar,
  }
}
