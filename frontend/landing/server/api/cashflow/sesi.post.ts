/**
 * POST /api/cashflow/sesi — membuatkan sesi Supabase untuk modul CashFlow
 * dari cookie console yang sudah tervalidasi.
 *
 * Ini satu-satunya tempat di landing yang memegang service-role Supabase,
 * dan kuncinya tidak pernah meninggalkan proses server (runtimeConfig
 * non-public). Peramban hanya menerima access + refresh token sesi biasa.
 *
 * Urutan:
 *   0. permintaan harus dari halaman kita sendiri: header X-CF-Sesi DAN
 *      Sec-Fetch-Site: same-origin. Tanpa Sec-Fetch-Site (curl, klien bukan
 *      peramban) → 403 (Fase 0c; dulu header yang hilang diloloskan). Aturan
 *      '/api/**' { cors: true } memang memasang Allow-Origin: * pada rute ini,
 *      tapi TANPA Allow-Credentials — peramban menolak permintaan ber-cookie
 *      lintas asal. Jangan pernah menambahkan allow-credentials.
 *   1. cookie HttpOnly sesi console (BFF, lib/konsol/cookie.ts) → GET
 *      {gateway}/admin/auth/me lewat inti proxy yang sama dengan /api/gw/**:
 *      akses kedaluwarsa + refresh sah → refresh sekali, cookie diperbarui.
 *      Gateway yang memutuskan siapa pemegang cookie (typ, token_version,
 *      is_active); rute ini tidak mem-parse JWT sendiri. 401/403 dari gateway
 *      = cookie ditolak; gagal lain = gateway bermasalah, dan pengguna tidak
 *      disuruh masuk ulang untuk kesalahan yang bukan miliknya.
 *   2. peran pemegangnya harus punya izin cashflow:view — peta yang sama
 *      dengan sidebar (utils/rbac.ts). Izin sesi (Fase 1, migrasi 0089)
 *      dihitung izinSesiCashflow(role, /me): cashflow:view bila perannya
 *      boleh; pii/investigasi/tindak/ekspor HANYA bila /me menjawab mfa=true
 *      (login ber-TOTP yang masih segar), TOTP akunnya masih aktif
 *      (totp_enabled_at ada), DAN perannya memegang izin itu. Aktif LANGSUNG,
 *      TANPA masa tenggang sejak TOTP dipasang (keputusan Master 21 Sep 2026;
 *      risiko sisa: pemegang sandi bocor super admin tanpa TOTP bisa memasang
 *      TOTP sendiri lalu langsung membuka data — utils/rbac.ts). Batas waktunya
 *      (mfa_at + 12 jam = umur MFA gateway) ditulis ke `izin_sampai`:
 *      konsol_boleh menolak izin selain view sesudahnya, walaupun sesi
 *      CashFlow-nya sendiri masih hidup (umurnya 12 jam sejak DICETAK).
 *   3. identitas konsol harus ADA dan bertanda admin_users.lewat_konsol — kalau
 *      env salah ketik, generateLink bisa diam-diam membuat pengguna baru;
 *      cek ini menutupnya.
 *   4. service-role → generateLink(magiclink) → verifyOtp(token_hash) dengan
 *      anon key → sesi asli. Tidak ada email yang dikirim.
 *   5. session_id dari JWT dicatat ke admin_konsol_sesi bersama email admin
 *      console (migrasi 0078) DAN izinnya (kolom `izin` + `izin_sampai`,
 *      migrasi 0089).
 *      is_platform_admin() HANYA menerima sesi yang tercatat di sana — sesi
 *      atas nama identitas yang sama dari jalur lain (reset sandi, magic-link
 *      email, kata sandi) ditolak. Pelaku manusianya pun jadi bukti server:
 *      admin_audit.pelaku diisi trigger dari tabel ini; konsol_boleh() membaca
 *      `izin`.
 *
 * URUTAN RILIS (Fase 1). Kolom `izin` baru ada sesudah migrasi 0089. Sengaja
 * TANPA jalan mundur: bila 0089 belum diterapkan, INSERT ini gagal, sesi
 * dimatikan lagi, dan console berhenti di /masuk ('mint-gagal') — lebih baik
 * daripada diam-diam mencetak sesi tanpa izin. Terapkan 0089 + 0090 DULU,
 * baru tayangkan landing ini (rencana Fase 1, "Urutan rilis").
 *
 * Kode gagal (statusMessage) dibaca halaman /console/cashflow/masuk:
 *   tanpa-cookie · cookie-ditolak · gateway-gagal · tanpa-izin ·
 *   belum-konfigurasi · mint-gagal · lintas-situs · ikatan
 */
import { createClient } from '@supabase/supabase-js'
import { batasIzinMfa, izinSesiCashflow } from '~/utils/rbac'
import { bacaCookie, catat, hapusCookie, ipKlien, pasangToken, wajibIkatan } from '../../lib/konsol/h3'
import { rakitTujuan } from '../../lib/konsol/jalur'
import { teruskan } from '../../lib/konsol/proxy'

interface JawabanMe {
  /** mfa: sesi gateway ini lolos TOTP kurang dari 12 jam lalu (Fase 0c).
   *  mfa_at: saat kodenya diverifikasi; totp_enabled_at: saat TOTP akun ini
   *  diaktifkan (keduanya RFC 3339, null bila tidak ada — gateway MeResponse;
   *  hanya keberadaannya yang dibaca, bukan umurnya). */
  data?: {
    id: string; email: string; role: string; is_active: boolean
    mfa?: unknown; mfa_at?: unknown; totp_enabled_at?: unknown
  } | null
}

/** Klaim JWT tanpa verifikasi tanda tangan — cukup, karena token ini baru saja
 *  diterbitkan Supabase kepada kita dan hanya session_id-nya yang dibaca. */
function klaimJwt(token: string): Record<string, unknown> | null {
  try {
    const bagian = token.split('.')[1]
    if (!bagian) return null
    return JSON.parse(Buffer.from(bagian.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // 0. Hanya dari halaman kita. Sec-Fetch-Site WAJIB ada dan same-origin.
  if (getHeader(event, 'x-cf-sesi') !== '1' || getHeader(event, 'sec-fetch-site') !== 'same-origin') {
    throw createError({ statusCode: 403, statusMessage: 'lintas-situs' })
  }
  wajibIkatan(event)

  const akses = bacaCookie(event, 'akses')
  const segar = bacaCookie(event, 'segar')
  if (!akses && !segar) throw createError({ statusCode: 401, statusMessage: 'tanpa-cookie' })

  // 1. Gateway memutuskan siapa pemegang cookie (refresh sekali bila perlu).
  const gatewayUrl = config.public.gatewayUrl as string
  const tujuan = rakitTujuan(gatewayUrl, 'admin/auth/me', '')
  if (!tujuan) throw createError({ statusCode: 502, statusMessage: 'gateway-gagal' })
  const hasil = await teruskan(
    { metode: 'GET', jalur: 'admin/auth/me', tujuan, header: new Headers({ accept: 'application/json' }), akses, segar },
    { gatewayUrl, fetch, timeoutMs: 8000, klienIp: ipKlien(event) },
  )
  if (hasil.hapusCookie) hapusCookie(event, ['akses', 'segar'])
  else if (hasil.tokenBaru) pasangToken(event, hasil.tokenBaru)
  const status = hasil.respons.status
  if (status === 401 || status === 403) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })
  if (!hasil.respons.ok) {
    console.error('[cashflow/sesi] gateway tidak menjawab:', status)
    throw createError({ statusCode: 502, statusMessage: 'gateway-gagal' })
  }
  const me: JawabanMe['data'] = ((await hasil.respons.json().catch(() => null)) as JawabanMe | null)?.data ?? null
  if (!me || !me.is_active) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })

  // 2. Peran yang boleh melihat pintunya = peran yang boleh masuk. Izin
  //    sesi: view untuk peran yang boleh, empat lainnya hanya bila ber-MFA
  //    segar (langsung, tanpa masa tenggang pendaftaran TOTP) — berlaku
  //    sampai izinSampai (mfa_at + 12 jam), bukan 12 jam sejak dicetak.
  const sekarang = Date.now()
  const izin = izinSesiCashflow(me.role, me, sekarang)
  const batas = batasIzinMfa(me, sekarang)
  const izinSampai = batas !== null && izin.some(i => i !== 'cashflow:view') ? new Date(batas).toISOString() : null
  if (!izin.includes('cashflow:view')) {
    throw createError({ statusCode: 403, statusMessage: 'tanpa-izin' })
  }

  // 3. Bahan + identitas konsol yang sah.
  const url = config.public.cashflowSupabaseUrl as string
  const anon = config.public.cashflowSupabaseAnonKey as string
  const service = config.cashflowSupabaseServiceKey as string
  const email = ((config.cashflowKonsolEmail as string) || 'konsol@coreasia.id').trim().toLowerCase()
  if (!url || !anon || !service) {
    throw createError({ statusCode: 503, statusMessage: 'belum-konfigurasi' })
  }
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: cari, error: eCari } = await admin.rpc('otp_longgar_cari', { p_email: email })
  const identitas = Array.isArray(cari) ? cari[0] : cari
  if (eCari || !identitas?.id) {
    console.error('[cashflow/sesi] identitas konsol tidak ditemukan:', eCari?.message ?? email)
    throw createError({ statusCode: 503, statusMessage: 'belum-konfigurasi' })
  }
  const { data: barisAdmin } = await admin
    .from('admin_users').select('lewat_konsol').eq('user_id', identitas.id).maybeSingle()
  if (!barisAdmin?.lewat_konsol) {
    console.error('[cashflow/sesi] identitas konsol belum bertanda lewat_konsol')
    throw createError({ statusCode: 503, statusMessage: 'belum-konfigurasi' })
  }

  // 4. Cetak sesi. GoTrue menyimpan SATU token pemulihan per pengguna, jadi dua
  //    pencetakan yang bersamaan (dua tab, dua admin) saling menimpa dan salah
  //    satunya gagal di verifyOtp. Jendelanya ratusan milidetik; tiga percobaan
  //    dengan jeda acak kecil menutupnya tanpa perlu kunci lintas instans.
  const klien = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  let sesi: { access_token: string; refresh_token: string; expires_at?: number } | null = null
  let sebabTerakhir = ''
  for (let percobaan = 1; percobaan <= 3 && !sesi; percobaan++) {
    const { data: tautan, error: eTautan } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    const tokenHash = tautan?.properties?.hashed_token
    if (eTautan || !tokenHash) {
      // Pesan galat Supabase aman dicatat; yang tidak boleh tercatat adalah kuncinya.
      sebabTerakhir = `generateLink: ${eTautan?.message ?? 'tanpa hashed_token'}`
    } else {
      const { data: hasil, error: eSesi } = await klien.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
      if (!eSesi && hasil?.session) { sesi = hasil.session; break }
      sebabTerakhir = `verifyOtp: ${eSesi?.message ?? 'tanpa sesi'}`
    }
    await new Promise((r) => setTimeout(r, 120 + Math.floor(Math.random() * 280)))
  }
  if (!sesi) {
    console.error('[cashflow/sesi] pencetakan gagal 3x:', sebabTerakhir)
    throw createError({ statusCode: 502, statusMessage: 'mint-gagal' })
  }

  // 5. Catat sesi ini sebagai sesi cetakan console. Tanpa catatan ini
  //    is_platform_admin() menolaknya — jadi kalau pencatatan gagal, sesinya
  //    dimatikan lagi supaya tidak ada token setengah jadi di peramban.
  const sessionId = klaimJwt(sesi.access_token)?.session_id
  const { error: eCatat } = typeof sessionId === 'string'
    ? await admin.from('admin_konsol_sesi').insert({ session_id: sessionId, pelaku: me.email, izin, izin_sampai: izinSampai })
    : { error: { message: 'JWT tanpa session_id' } }
  if (eCatat) {
    console.error('[cashflow/sesi] pencatatan sesi gagal:', eCatat.message)
    await admin.auth.admin.signOut(sesi.access_token, 'local').catch(() => {})
    throw createError({ statusCode: 502, statusMessage: 'mint-gagal' })
  }

  // Rumah tangga: cabut catatan yang lewat umur (12 jam) dan buang yang > 7
  // hari. Dijalankan sesudah tiap pencetakan supaya tabelnya tidak tumbuh
  // tanpa batas; hasilnya tidak ditunggu dan kegagalannya tidak menghalangi.
  catat(event, 'cashflow-sesi', { email: me.email, izin: izin.join(' '), izin_sampai: izinSampai ?? '-' })
  admin.rpc('admin_konsol_sesi_bersihkan').then(({ error }) => {
    if (error) console.error('[cashflow/sesi] bersihkan gagal:', error.message)
  }).catch(() => {})

  return {
    access_token: sesi.access_token,
    refresh_token: sesi.refresh_token,
    expires_at: sesi.expires_at ?? null,
    /** Email admin console yang meminta — ditampilkan klien; buktinya ada di server. */
    pelaku: me.email,
    /** Izin yang tercatat untuk sesi ini — petunjuk tampilan saja; Postgres yang menegakkan. */
    izin,
  }
})
