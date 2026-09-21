/**
 * Izin console: utils/rbac.ts = cermin internal/rbac/permissions.go (gateway),
 * dan pemetaan izin sesi CashFlow (Fase 1, K4/K11).
 *
 * permissions.go dibaca sebagai TEKS dari repo yang sama (backend/gateway);
 * bila tidak ada (checkout landing saja), perbandingannya dilewati dan
 * terlihat "skipped". Arah sebaliknya diuji go test (permissions_test.go).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  IZIN_CASHFLOW, ROLE_PERMISSIONS, UMUR_MFA_MAKS_MS, batasIzinMfa, izinSesiCashflow, peranBoleh,
  type BuktiMfa,
} from '../../utils/rbac'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const GO = resolve(AKAR, '../../backend/gateway/internal/rbac/permissions.go')
const adaGo = existsSync(GO)
const GO_JWT = resolve(AKAR, '../../backend/gateway/internal/auth/jwt.go')
const adaGoWaktu = existsSync(GO_JWT)
/** `const nama = N * time.Hour` → milidetik. */
function jamGo(berkas: string, nama: string): number {
  const m = new RegExp(`const\\s+${nama}\\s*=\\s*(\\d+)\\s*\\*\\s*time\\.Hour`).exec(readFileSync(berkas, 'utf8'))
  if (!m) throw new Error(`${nama} tidak ditemukan di ${berkas}`)
  return Number(m[1]) * 3_600_000
}

/** permissions.go → { peran: [izin…] } lewat konstanta Permission dan peta RolePermissions. */
function petaGo(): Record<string, string[]> {
  const teks = readFileSync(GO, 'utf8')
  const konst = new Map([...teks.matchAll(/^\s*(\w+)\s+Permission\s*=\s*"([^"]+)"/gm)].map(m => [m[1]!, m[2]!]))
  const awal = teks.indexOf('var RolePermissions')
  const isi = teks.slice(awal, teks.indexOf('\n}\n', awal))
  const hasil: Record<string, string[]> = {}
  for (const m of isi.matchAll(/"([\w-]+)":\s*\{([^}]*)\}/g)) {
    hasil[m[1]!] = [...m[2]!.matchAll(/(\w+):\s*true/g)].map((x) => {
      const v = konst.get(x[1]!)
      if (!v) throw new Error(`Konstanta ${x[1]} tidak ditemukan di permissions.go`)
      return v
    })
  }
  return hasil
}

describe('utils/rbac.ts ↔ gateway permissions.go', () => {
  it.skipIf(!adaGo)('peran dan izinnya sama persis', () => {
    const go = petaGo()
    expect(Object.keys(go).sort()).toEqual(Object.keys(ROLE_PERMISSIONS).sort())
    for (const [peran, izin] of Object.entries(go)) expect([...ROLE_PERMISSIONS[peran]!].sort(), peran).toEqual([...izin].sort())
  })
  it.skipIf(!adaGo)('kelima izin CashFlow ada sebagai konstanta Go dengan nilai yang sama', () => {
    const teks = readFileSync(GO, 'utf8')
    for (const i of IZIN_CASHFLOW) expect(teks).toContain(`"${i}"`)
  })
  it('K11: super_admin memegang semuanya; peran lain paling jauh view + pii', () => {
    for (const i of IZIN_CASHFLOW) expect(peranBoleh('super_admin', i)).toBe(true)
    for (const peran of Object.keys(ROLE_PERMISSIONS).filter(p => p !== 'super_admin')) {
      for (const i of ['cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']) expect(peranBoleh(peran, i), `${peran} ${i}`).toBe(false)
      if (peranBoleh(peran, 'cashflow:pii')) expect(peranBoleh(peran, 'cashflow:view')).toBe(true)
    }
  })
})

const KINI = Date.parse('2026-09-21T15:00:00Z')
const JAM = 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
/** Login ber-TOTP 1 jam lalu, TOTP aktif (umurnya tidak dihitung). */
const SAH: BuktiMfa = { mfa: true, mfa_at: iso(KINI - JAM), totp_enabled_at: iso(KINI - 72 * JAM) }

describe('umur MFA = gateway', () => {
  it.skipIf(!adaGoWaktu)('UMUR_MFA_MAKS_MS = auth.MFAMaxAge', () => {
    expect(UMUR_MFA_MAKS_MS).toBe(jamGo(GO_JWT, 'MFAMaxAge'))
  })
  it('nilainya 12 jam', () => {
    expect(UMUR_MFA_MAKS_MS).toBe(12 * JAM)
  })
})

describe('izinSesiCashflow — yang ditulis sesi.post.ts ke admin_konsol_sesi.izin', () => {
  it('super_admin ber-MFA: kelima izin, urutan tetap', () => {
    expect(izinSesiCashflow('super_admin', SAH, KINI)).toEqual([
      'cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor',
    ])
  })
  it('super_admin TANPA MFA: hanya view — empat lainnya butuh login ber-TOTP', () => {
    expect(izinSesiCashflow('super_admin', { ...SAH, mfa: false }, KINI)).toEqual(['cashflow:view'])
    expect(izinSesiCashflow('super_admin', { ...SAH, mfa: undefined }, KINI)).toEqual(['cashflow:view'])
    expect(izinSesiCashflow('super_admin', null, KINI)).toEqual(['cashflow:view'])
  })
  it('mfa yang bukan boolean true dianggap tanpa MFA (gagal tertutup)', () => {
    for (const m of ['true', 1, 'ya', {}, null]) expect(izinSesiCashflow('super_admin', { ...SAH, mfa: m }, KINI), String(m)).toEqual(['cashflow:view'])
  })
  it('keputusan Master 21 Sep 2026: TANPA masa tenggang — TOTP yang baru dipasang langsung memberi kelima izin', () => {
    // Umur pendaftaran TOTP tidak dihitung sama sekali (termasuk jam gateway yang kacau).
    for (const umur of [60_000, 23 * JAM, 24 * JAM, 72 * JAM, -72 * JAM]) {
      expect(izinSesiCashflow('super_admin', { ...SAH, totp_enabled_at: iso(KINI - umur) }, KINI), String(umur)).toHaveLength(5)
    }
    expect(batasIzinMfa({ ...SAH, totp_enabled_at: iso(KINI - 60_000), mfa_at: iso(KINI - 30_000) }, KINI)).toBe(KINI - 30_000 + 12 * JAM)
  })
  it('totp_enabled_at (TOTP tidak aktif) / mfa_at hilang atau bukan waktu → hanya view', () => {
    for (const lain of [{ totp_enabled_at: null }, { totp_enabled_at: 5 }, { mfa_at: undefined }, { mfa_at: 'x' }]) {
      expect(izinSesiCashflow('super_admin', { ...SAH, ...lain }, KINI), JSON.stringify(lain)).toEqual(['cashflow:view'])
    }
  })
  it('peran tanpa cashflow:view: tidak ada izin sama sekali (sesi tidak dicetak), MFA atau tidak', () => {
    expect(izinSesiCashflow('admin', SAH, KINI)).toEqual([])
    expect(izinSesiCashflow('entah', SAH, KINI)).toEqual([])
    expect(izinSesiCashflow(null, SAH, KINI)).toEqual([])
  })
})

describe('batasIzinMfa — admin_konsol_sesi.izin_sampai (temuan fe p2 #2)', () => {
  it('mfa_at + 12 jam, bukan sekarang + 12 jam', () => {
    expect(batasIzinMfa(SAH, KINI)).toBe(KINI + 11 * JAM)
    expect(batasIzinMfa({ ...SAH, mfa_at: iso(KINI - 12 * JAM + 60_000) }, KINI)).toBe(KINI + 60_000)
  })
  it('MFA sudah lewat 12 jam → null (tanpa izin selain view)', () => {
    expect(batasIzinMfa({ ...SAH, mfa_at: iso(KINI - 12 * JAM) }, KINI)).toBeNull()
  })
  it('mfa_at di masa depan (jam gateway mendahului) → dijepit ke sekarang + 12 jam', () => {
    expect(batasIzinMfa({ ...SAH, mfa_at: iso(KINI + 3 * JAM) }, KINI)).toBe(KINI + 12 * JAM)
  })
  it('format RFC 3339 gateway (nanodetik, zona +07:00) terbaca', () => {
    const b = batasIzinMfa({ mfa: true, mfa_at: '2026-09-21T21:00:00.123456789+07:00', totp_enabled_at: '2026-09-18T10:00:00.5+07:00' }, KINI)
    expect(b).toBe(Date.parse('2026-09-21T14:00:00.123Z') + 12 * JAM)
  })
})
