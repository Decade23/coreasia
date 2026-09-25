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
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cookieKonsol, headerKonsol, panggil, pasangGlobalNitro } from '../konsol/bff'

interface Me {
  id: string; email: string; role: string; is_active: boolean
  mfa?: unknown; mfa_at?: unknown; totp_enabled_at?: unknown
}
const keadaan: { me: Me | null; galatInsert: string | null } = { me: null, galatInsert: null }
const tulis: Array<{ tabel: string; baris: Record<string, unknown> }> = []
const dicabut: string[] = []

const jwt = (klaim: Record<string, unknown>) => `h.${Buffer.from(JSON.stringify(klaim)).toString('base64url')}.t`

vi.mock('../../server/lib/konsol/proxy', () => ({
  teruskan: async () => ({
    respons: new Response(JSON.stringify({ data: keadaan.me }), { status: 200, headers: { 'content-type': 'application/json' } }),
    hapusCookie: false,
    tokenBaru: null,
  }),
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
            generateLink: async () => ({ data: { properties: { hashed_token: 'hash' } }, error: null }),
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
beforeAll(async () => {
  pasangGlobalNitro()
  handler = (await import('../../server/api/cashflow/sesi.post')).default
})
/** POST /api/cashflow/sesi lewat h3 asli; galat jadi { status, statusMessage }. */
async function cetak(header: Record<string, string> = headerKonsol({ 'x-cf-sesi': '1' })) {
  const j = await panggil(handler, { metode: 'POST', path: '/api/cashflow/sesi', header, cookie: cookieKonsol() })
  return { ...j, isi: j.json as unknown as Hasil }
}
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
const ADMIN_GW = '0b6e7c1e-2a55-4d59-9c5f-0a8d2f9d1b11'
const KINI = Date.parse('2026-09-21T15:00:00Z')
const JAM = 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(KINI)
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

  it('F3: /me tanpa id yang sah (gateway lama/rusak) → 502 gateway-gagal; tidak ada sesi berkunci email saja', async () => {
    for (const id of [undefined, '', 'a1', 42, `${ADMIN_GW}x`] as unknown[]) {
      tulis.length = 0
      keadaan.me = me('super_admin', true, { id: id as string })
      expect(await cetak(), String(id)).toMatchObject({ status: 502, statusMessage: 'gateway-gagal' })
      expect(tulis).toEqual([])
    }
  })
})
