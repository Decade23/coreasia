/**
 * POST /api/cashflow/sesi (Fase 1): izin yang ditulis ke admin_konsol_sesi.izin.
 *
 * Diuji pada HANDLER-nya, dengan klien Supabase TIRUAN (tidak ada kunci
 * service, tidak ada jaringan) dan gateway /me tiruan:
 * - cashflow:view selalu untuk peran yang boleh; pii/investigasi/tindak/ekspor
 *   HANYA bila /me menjawab mfa=true (dan TOTP akunnya masih aktif) —
 *   LANGSUNG, tanpa masa tenggang sejak TOTP dipasang (keputusan Master
 *   21 Sep 2026, menggantikan temuan fe p2 #1);
 * - batas izin selain view (izin_sampai) = mfa_at + 12 jam, bukan 12 jam
 *   sejak dicetak (temuan fe p2 #2); null bila izinnya view saja;
 * - peran tanpa cashflow:view → 403 tanpa-izin, tidak ada yang dicetak/ditulis;
 * - kolom izin belum ada (0089 belum diterapkan) → INSERT gagal → sesi
 *   dimatikan lagi dan 502 mint-gagal: TIDAK ada jalan mundur diam-diam yang
 *   mencetak sesi tanpa izin.
 *
 * - admin_gw_id = id admin gateway dari /me (temuan F3, migrasi 0092);
 *   /me tanpa id yang sah → 502 gateway-gagal, tidak ada sesi yang dicetak.
 *
 * Handler dijalankan lewat h3 SUNGGUHAN (tests/konsol/bff.ts): cookie,
 * Sec-Fetch-Site, dan token ikatan diperiksa oleh lib/konsol/h3 yang asli
 * (dulu wajibIkatan ditiru sebagai no-op — temuan F13). Hanya
 * lib/konsol/proxy (ke gateway) dan klien Supabase yang ditiru.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AKSES, SEGAR, cookieKonsol, headerKonsol, panggil, pasangGlobalNitro } from '../konsol/bff'

import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const panggilan = { gateway: 0, mint: 0 }

interface Me {
  id: string; email: string; role: string; is_active: boolean
  mfa?: unknown; mfa_at?: unknown; totp_enabled_at?: unknown
}
const keadaan: { me: Me | null; galatInsert: string | null } = { me: null, galatInsert: null }
const tulis: Array<{ tabel: string; baris: Record<string, unknown> }> = []
const dicabut: string[] = []

const jwt = (klaim: Record<string, unknown>) => `h.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.t`

vi.mock('../../server/lib/konsol/proxy', () => ({
  teruskan: async () => {
    panggilan.gateway++
    return ({
    respons: new Response(JSON.stringify({ data: keadaan.me }), { status: 200, headers: { 'content-type': 'application/json' } }),
    hapusCookie: false,
    tokenBaru: null,
  }) },
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, kunci: string) => (kunci === 'kunci-layanan-tiruan'
    ? {
        rpc: async (nama: string) => (nama === 'otp_longgar_cari' ? { data: [{ id: 'konsol-id' }], error: null } : { data: null, error: null }),
        from: (tabel: string) => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { lewat_konsol: true } }) }) }),
          insert: async (baris: Record<string, unknown>) => {
            if (keadaan.galatInsert) return { error: { message: keadaan.galatInsert } }
            tulis.push({ tabel, baris })
            return { error: null }
          },
        }),
        auth: {
          admin: {
            generateLink: async () => { panggilan.mint++; return { data: { properties: { hashed_token: 'hash' } }, error: null } },
            signOut: async (token: string) => { dicabut.push(token); return { error: null } },
          },
        },
      }
    : {
        auth: {
          verifyOtp: async () => ({
            data: { session: { access_token: jwt({ session_id: 'sesi-uji-1' }), refresh_token: 'segar', expires_at: 1 } },
            error: null,
          }),
        },
      }),
}))

interface Hasil { izin: string[]; pelaku: string }
let handler: unknown
/** POST /api/cashflow/sesi lewat h3 asli; galat jadi { status, statusMessage }. */
async function cetak(header: Record<string, string> = headerKonsol({ 'x-cf-sesi': '1' })) {
  const j = await panggil(handler, { metode: 'POST', path: '/api/cashflow/sesi', header, cookie: cookieKonsol() })
  return { ...j, isi: j.json as unknown as Hasil }
}
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })
const ADMIN_GW = '0b6e7c1e-2a55-4d59-9c5f-0a8d2f9d1b11'
const KINI = Date.parse('2026-09-21T15:00:00Z')
const JAM = 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(KINI)
  // Setiap kasus mendapat pembatas baru; urutan uji tidak menghabiskan jatah.
  vi.resetModules()
  vi.stubEnv('VERCEL', '1')
  pasangGlobalNitro()
  handler = (await import('../../server/api/cashflow/sesi.post')).default
  panggilan.gateway = 0
  panggilan.mint = 0
  tulis.length = 0
  dicabut.length = 0
  keadaan.galatInsert = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

/** Bawaan: login ber-TOTP 1 jam lalu, TOTP terdaftar 3 hari lalu. */
const me = (role: string, mfa?: unknown, lain: Partial<Me> = {}): Me => ({
  id: ADMIN_GW, email: 'admin@coreasia.id', role, is_active: true, mfa,
  mfa_at: mfa === true ? iso(KINI - JAM) : null, totp_enabled_at: iso(KINI - 72 * JAM), ...lain,
})

describe('sesi.post: izin sesi CashFlow', () => {
  it('super_admin ber-MFA → kelima izin tertulis di admin_konsol_sesi dan dikembalikan', async () => {
    keadaan.me = me('super_admin', true)
    const { isi: r } = await cetak()
    expect(tulis).toEqual([{
      tabel: 'admin_konsol_sesi',
      baris: {
        session_id: 'sesi-uji-1', admin_gw_id: ADMIN_GW, pelaku: 'admin@coreasia.id',
        izin: ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor'],
        // mfa_at (1 jam lalu) + 12 jam — bukan 12 jam sejak dicetak.
        izin_sampai: iso(KINI + 11 * JAM),
      },
    }])
    expect(r.izin).toEqual(tulis[0]!.baris.izin)
    expect(r.pelaku).toBe('admin@coreasia.id')
  })

  it('super_admin TANPA MFA → hanya cashflow:view, izin_sampai null', async () => {
    keadaan.me = me('super_admin', false)
    await cetak()
    expect(tulis[0]!.baris.izin).toEqual(['cashflow:view'])
    expect(tulis[0]!.baris.izin_sampai).toBeNull()
  })

  it('keputusan Master 21 Sep 2026: TOTP baru dipasang (< 24 jam) → kelima izin LANGSUNG, tanpa masa tenggang', async () => {
    // Risiko sisa yang disadari: pemegang sandi bocor super admin tanpa TOTP
    // bisa memasang authenticator miliknya lalu langsung membuka data.
    for (const umur of [60_000, 23 * JAM, 24 * JAM - 1000]) {
      tulis.length = 0
      keadaan.me = me('super_admin', true, { totp_enabled_at: iso(KINI - umur), mfa_at: iso(KINI - 30_000) })
      const { isi: r } = await cetak()
      expect(tulis[0]!.baris.izin, String(umur)).toEqual(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor'])
      expect(tulis[0]!.baris.izin_sampai, String(umur)).toBe(iso(KINI - 30_000 + 12 * JAM))
      expect(r.izin).toEqual(tulis[0]!.baris.izin)
    }
  })

  it('totp_enabled_at (TOTP tidak aktif) atau mfa_at hilang/rusak → hanya view (gagal tertutup)', async () => {
    for (const lain of [{ totp_enabled_at: null }, { totp_enabled_at: undefined }, { totp_enabled_at: 'kemarin' },
      { mfa_at: null }, { mfa_at: 12345 }, { mfa_at: '' }] as Partial<Me>[]) {
      tulis.length = 0
      keadaan.me = me('super_admin', true, lain)
      await cetak()
      expect(tulis[0]!.baris.izin, JSON.stringify(lain)).toEqual(['cashflow:view'])
      expect(tulis[0]!.baris.izin_sampai, JSON.stringify(lain)).toBeNull()
    }
  })

  it('temuan fe p2 #2: dicetak di menit terakhir MFA → izin_sampai = mfa_at + 12 jam (±1 menit lagi), bukan 12 jam lagi', async () => {
    keadaan.me = me('super_admin', true, { mfa_at: iso(KINI - 12 * JAM + 60_000) })
    await cetak()
    expect(tulis[0]!.baris.izin).toHaveLength(5)
    expect(tulis[0]!.baris.izin_sampai).toBe(iso(KINI + 60_000))
  })

  it('jam gateway mendahului (mfa_at di masa depan) → izin_sampai dijepit ke sekarang + 12 jam', async () => {
    keadaan.me = me('super_admin', true, { mfa_at: iso(KINI + 5 * JAM) })
    await cetak()
    expect(tulis[0]!.baris.izin_sampai).toBe(iso(KINI + 12 * JAM))
  })

  it('mfa hilang atau bukan boolean true → hanya cashflow:view', async () => {
    for (const mfa of [undefined, 'true', 1]) {
      tulis.length = 0
      keadaan.me = me('super_admin', mfa)
      await cetak()
      expect(tulis[0]!.baris.izin, String(mfa)).toEqual(['cashflow:view'])
    }
  })

  it('peran tanpa cashflow:view → 403 tanpa-izin; tidak ada sesi yang dicatat', async () => {
    keadaan.me = me('admin', true)
    expect(await cetak()).toMatchObject({ status: 403, statusMessage: 'tanpa-izin' })
    expect(tulis).toEqual([])
  })

  it('kolom izin belum ada (0089 belum diterapkan) → sesi dimatikan, 502 mint-gagal (tanpa jalan mundur)', async () => {
    keadaan.me = me('super_admin', true)
    keadaan.galatInsert = 'column "izin" of relation "admin_konsol_sesi" does not exist'
    expect(await cetak()).toMatchObject({ status: 502, statusMessage: 'mint-gagal' })
    expect(tulis).toEqual([])
    expect(dicabut).toHaveLength(1)
  })

  it('tanpa Sec-Fetch-Site same-origin → 403 lintas-situs sebelum apa pun', async () => {
    keadaan.me = me('super_admin', true)
    expect(await cetak({ 'x-cf-sesi': '1', 'x-konsol-ikat': headerKonsol()['x-konsol-ikat']! })).toMatchObject({ status: 403, statusMessage: 'lintas-situs' })
    expect(tulis).toEqual([])
  })

  it('tanpa token ikatan (skrip halaman publik satu-asal) → 403 ikatan, tidak ada sesi', async () => {
    keadaan.me = me('super_admin', true)
    expect(await cetak({ 'x-cf-sesi': '1', 'sec-fetch-site': 'same-origin' })).toMatchObject({ status: 403, statusMessage: 'ikatan' })
    expect(tulis).toEqual([])
  })

  it('F3: admin_gw_id = id /me (dinormalkan huruf kecil); email hanya label', async () => {
    keadaan.me = me('super_admin', true, { id: ADMIN_GW.toUpperCase(), email: 'Label@CoreAsia.id' })
    await cetak()
    expect(tulis[0]!.baris).toMatchObject({ admin_gw_id: ADMIN_GW, pelaku: 'Label@CoreAsia.id' })
  })

  it('F3: id /me berspasi di tepi tetap sah → dirapikan (tanpa spasi, huruf kecil)', async () => {
    keadaan.me = me('super_admin', true, { id: ` ${ADMIN_GW.toUpperCase()} ` })
    await cetak()
    expect(tulis[0]!.baris).toMatchObject({ admin_gw_id: ADMIN_GW })
  })

  it('F3: /me tanpa id yang sah (gateway lama/rusak) → 502 gateway-gagal; tidak ada sesi berkunci email saja', async () => {
    for (const id of [undefined, '', 'a1', 42, `${ADMIN_GW}x`, `x${ADMIN_GW}`, `${ADMIN_GW}\n${ADMIN_GW}`] as unknown[]) {
      tulis.length = 0
      keadaan.me = me('super_admin', true, { id: id as string })
      expect(await cetak(), String(id)).toMatchObject({ status: 502, statusMessage: 'gateway-gagal' })
      expect(tulis).toEqual([])
    }
  })
})


describe('sesi.post: pembatasan tidak mengubah izin sesi', () => {
  it('jawaban token yang berhasil selalu no-store dan nosniff', async () => {
    keadaan.me = me('super_admin', true)
    const r = await cetak()
    expect(r.status).toBe(200)
    expect(r.header.get('cache-control')).toBe('no-store')
    expect(r.header.get('x-content-type-options')).toBe('nosniff')
    expect(r.isi.izin).toHaveLength(5)
  })

  it('30 cetak sah lolos; ke-31 ditolak sebelum gateway dan Supabase, lalu pulih tepat 15 menit', async () => {
    keadaan.me = me('super_admin', true)
    for (let i = 0; i < 30; i++) expect((await cetak()).status, `permintaan ${i + 1}`).toBe(200)
    const r = await cetak()
    expect(r).toMatchObject({ status: 429, statusMessage: 'dibatasi' })
    expect(r.header.get('retry-after')).toBe('900')
    expect(r.header.get('cache-control')).toBe('no-store')
    expect(r.header.get('x-content-type-options')).toBe('nosniff')
    expect(panggilan).toEqual({ gateway: 30, mint: 30 })
    expect(tulis).toHaveLength(30)
    vi.setSystemTime(KINI + 15 * 60_000)
    expect((await cetak()).status).toBe(200)
    expect(panggilan).toEqual({ gateway: 31, mint: 31 })
  })

  it('permintaan lintas situs dan tanpa ikatan tidak menghabiskan jatah console yang sah', async () => {
    keadaan.me = me('super_admin', true)
    for (let i = 0; i < 35; i++) {
      expect((await cetak(headerKonsol({ 'x-cf-sesi': '1', 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
      expect((await cetak({ 'x-cf-sesi': '1', 'sec-fetch-site': 'same-origin' })).status).toBe(403)
    }
    expect(panggilan).toEqual({ gateway: 0, mint: 0 })
    for (let i = 0; i < 30; i++) expect((await cetak()).status).toBe(200)
  })

  it('IP lain tetap bisa mencetak saat jatah IP pertama habis', async () => {
    keadaan.me = me('super_admin', true)
    const hdr = (ip: string) => headerKonsol({ 'x-cf-sesi': '1', 'x-real-ip': ip })
    for (let i = 0; i < 30; i++) expect((await cetak(hdr('192.0.2.1'))).status).toBe(200)
    expect((await cetak(hdr('192.0.2.1'))).status).toBe(429)
    expect((await cetak(hdr('192.0.2.2'))).status).toBe(200)
  })

  it('jatah serah terima login habis tidak menghabiskan jatah cetak sesi CashFlow', async () => {
    keadaan.me = me('super_admin', true)
    const sesi = (await import('../../server/api/admin/sesi.post')).default
    const serahkan = () => panggil(sesi, {
      metode: 'POST', path: '/api/admin/sesi', header: headerKonsol({ 'content-type': 'application/json' }), cookie: cookieKonsol(),
      badan: JSON.stringify({ access_token: AKSES, refresh_token: SEGAR }),
    })
    for (let i = 0; i < 20; i++) expect((await serahkan()).status).toBe(200)
    expect((await serahkan()).status).toBe(429)
    expect((await cetak()).status).toBe(200)
  })

  it('sebab dibatasi memiliki pesan Indonesia dan Inggris', () => {
    for (const lang of ['id', 'en'] as const) expect(KAMUS_CASHFLOW[lang].masuk.sebab.dibatasi).toMatch(/\S/)
  })
})
