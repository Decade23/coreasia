/**
 * POST /api/cashflow/sesi — membuatkan sesi Supabase untuk modul CashFlow
 * dari cookie console yang sudah tervalidasi.
 *
 * Ini satu-satunya tempat di landing yang memegang service-role Supabase,
 * dan kuncinya tidak pernah meninggalkan proses server (runtimeConfig
 * non-public). Peramban hanya menerima access + refresh token sesi biasa.
 *
 * Urutan:
 *   0. permintaan harus dari halaman kita sendiri: header X-CF-Sesi (fetch
 *      lintas situs tidak bisa memasangnya tanpa preflight yang pasti gagal)
 *      dan Sec-Fetch-Site bukan cross-site.
 *   1. cookie auth_admin_token → GET {gateway}/admin/auth/me. Gateway yang
 *      memutuskan siapa pemegang cookie; rute ini tidak mem-parse JWT sendiri.
 *      401/403 dari gateway = cookie ditolak; gagal lain = gateway bermasalah,
 *      dan pengguna tidak disuruh masuk ulang untuk kesalahan yang bukan miliknya.
 *   2. peran pemegangnya harus punya izin cashflow:view — peta yang sama
 *      dengan sidebar (utils/rbac.ts).
 *   3. identitas konsol harus ADA dan bertanda admin_users.lewat_konsol — kalau
 *      env salah ketik, generateLink bisa diam-diam membuat pengguna baru;
 *      cek ini menutupnya.
 *   4. service-role → generateLink(magiclink) → verifyOtp(token_hash) dengan
 *      anon key → sesi asli. Tidak ada email yang dikirim.
 *   5. session_id dari JWT dicatat ke admin_konsol_sesi bersama email admin
 *      console (migrasi 0078). is_platform_admin() HANYA menerima sesi yang
 *      tercatat di sana — sesi atas nama identitas yang sama dari jalur lain
 *      (reset sandi, magic-link email, kata sandi) ditolak. Pelaku manusianya
 *      pun jadi bukti server: admin_audit.pelaku diisi trigger dari tabel ini.
 *
 * Kode gagal (statusMessage) dibaca halaman /console/cashflow/masuk:
 *   tanpa-cookie · cookie-ditolak · gateway-gagal · tanpa-izin ·
 *   belum-konfigurasi · mint-gagal · lintas-situs
 */
import { createClient } from '@supabase/supabase-js'
import { peranBoleh } from '~/utils/rbac'

interface JawabanMe {
  data?: { id: string; email: string; role: string; is_active: boolean } | null
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

  // 0. Hanya dari halaman kita.
  const situs = getHeader(event, 'sec-fetch-site')
  if (getHeader(event, 'x-cf-sesi') !== '1' || (situs && situs !== 'same-origin' && situs !== 'none')) {
    throw createError({ statusCode: 403, statusMessage: 'lintas-situs' })
  }

  const cookie = getCookie(event, 'auth_admin_token')
  if (!cookie) throw createError({ statusCode: 401, statusMessage: 'tanpa-cookie' })

  // 1. Gateway memutuskan siapa pemegang cookie.
  let me: JawabanMe['data'] = null
  try {
    const r = await $fetch<JawabanMe>(`${config.public.gatewayUrl}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${cookie}` },
      timeout: 8000,
      retry: 0, // ofetch mengulang sendiri; dua kali 8 detik terlalu lama untuk satu klik
    })
    me = r?.data ?? null
  } catch (e: any) {
    const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0)
    if (status === 401 || status === 403) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })
    console.error('[cashflow/sesi] gateway tidak menjawab:', status || e?.message)
    throw createError({ statusCode: 502, statusMessage: 'gateway-gagal' })
  }
  if (!me || !me.is_active) throw createError({ statusCode: 401, statusMessage: 'cookie-ditolak' })

  // 2. Peran yang boleh melihat pintunya = peran yang boleh masuk.
  if (!peranBoleh(me.role, 'cashflow:view')) {
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
    ? await admin.from('admin_konsol_sesi').insert({ session_id: sessionId, pelaku: me.email })
    : { error: { message: 'JWT tanpa session_id' } }
  if (eCatat) {
    console.error('[cashflow/sesi] pencatatan sesi gagal:', eCatat.message)
    await admin.auth.admin.signOut(sesi.access_token, 'local').catch(() => {})
    throw createError({ statusCode: 502, statusMessage: 'mint-gagal' })
  }

  // Rumah tangga: cabut catatan yang lewat umur (12 jam) dan buang yang > 7
  // hari. Dijalankan sesudah tiap pencetakan supaya tabelnya tidak tumbuh
  // tanpa batas; hasilnya tidak ditunggu dan kegagalannya tidak menghalangi.
  admin.rpc('admin_konsol_sesi_bersihkan').then(({ error }) => {
    if (error) console.error('[cashflow/sesi] bersihkan gagal:', error.message)
  }).catch(() => {})

  return {
    access_token: sesi.access_token,
    refresh_token: sesi.refresh_token,
    expires_at: sesi.expires_at ?? null,
    /** Email admin console yang meminta — ditampilkan klien; buktinya ada di server. */
    pelaku: me.email,
  }
})
