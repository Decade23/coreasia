/**
 * Peta peran → izin console. Sumber kebenarannya backend
 * (internal/rbac/permissions.go); berkas ini cerminannya untuk klien DAN
 * server Nitro — satu tempat, dua pemakai:
 *   - composables/usePermissions.ts   menu & tombol di peramban
 *   - server/api/cashflow/sesi.post.ts  keputusan sebelum membuat sesi CashFlow
 * Jangan diduplikasi lagi ke tempat ketiga. Paritas dengan Go diuji di dua
 * arah: tests/cashflow/rbac-paritas.test.ts (vitest) dan
 * internal/rbac/permissions_test.go (go test). Tulis setiap izin sebagai
 * literal di dalam ROLE_PERMISSIONS — kedua uji membaca teksnya.
 *
 * IZIN CASHFLOW (Fase 1, migrasi 0089). Lima izin, ditulis Nitro ke
 * admin_konsol_sesi.izin saat mencetak sesi Supabase console dan ditegakkan
 * Postgres (konsol_boleh):
 *   cashflow:view         T0 — menu, agregat, daftar & kepala tersamar, audit
 *   cashflow:pii          T1/T2 — kasus (akun, buku), email utuh, cari server
 *   cashflow:investigasi  T3 — kasus anak: teks bebas
 *   cashflow:tindak       tangguhkan/pulihkan akun (Fase 5)
 *   cashflow:ekspor       ekspor tersamar & salinan subjek (Fase 5)
 * K11: super_admin memegang semuanya; peran lain paling jauh view + pii.
 */
export type Permission = string

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'dashboard:view',
    'cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor',
    'articles:list', 'articles:view', 'articles:create', 'articles:update',
    'articles:delete', 'articles:publish', 'articles:stats',
    'users:list', 'users:create', 'users:update', 'users:delete',
    'bots:list', 'bots:view', 'bots:create', 'bots:update',
    'bots:delete', 'bots:trigger',
    'ai:generate', 'ai:models', 'ai:settings:view', 'ai:settings:update',
    'keywords:list', 'keywords:view', 'keywords:create', 'keywords:update',
    'keywords:delete', 'keywords:ai_suggest',
    'apikeys:list', 'apikeys:view', 'apikeys:create', 'apikeys:update',
    'apikeys:delete', 'apikeys:copy',
    'upload:create', 'audit:list',
    'cad:licenses:list', 'cad:licenses:view', 'cad:licenses:create', 'cad:licenses:update',
    'cad:licenses:delete', 'cad:licenses:copy', 'cad:licenses:import',
    'cad:devices:list', 'cad:devices:manage', 'cad:analytics:view',
  ],
  admin: [
    'dashboard:view',
    'articles:list', 'articles:view', 'articles:create', 'articles:update', 'articles:stats',
    'users:list',
    'bots:list', 'bots:view',
    'keywords:list', 'keywords:view', 'keywords:ai_suggest',
    'ai:generate', 'ai:models', 'ai:settings:view',
    'apikeys:list', 'apikeys:view',
    'upload:create', 'audit:list',
    'cad:licenses:list', 'cad:licenses:view', 'cad:devices:list', 'cad:devices:manage', 'cad:analytics:view',
  ],
}

export const peranBoleh = (role: string | null | undefined, izin: Permission): boolean =>
  (ROLE_PERMISSIONS[role ?? ''] ?? []).includes(izin)

/** Kelima izin CashFlow, urutan tetap (juga urutan larik yang ditulis ke sesi). */
export const IZIN_CASHFLOW = [
  'cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor',
] as const
export type IzinCashflow = typeof IZIN_CASHFLOW[number]

/*
 * TANPA masa tenggang pendaftaran TOTP (keputusan Master 21 Sep 2026): izin
 * pii/investigasi/tindak/ekspor aktif LANGSUNG begitu login console ber-TOTP
 * (mfa=true), berapa pun umur pendaftaran TOTP-nya. Usulan tinjauan (tahan
 * 24 jam = gateway mfaEnrollmentGrace) ditolak. Risiko sisa yang disadari:
 * pemegang sandi bocor seorang super admin yang BELUM ber-TOTP bisa memasang
 * authenticator miliknya lalu langsung membuka data; jejaknya tetap tercatat
 * (audit gateway totp_setup/totp_enable, audit kasus CashFlow).
 * Masa tenggang 24 jam gateway untuk "sesi kuat" (mengelola admin ber-TOTP,
 * kredensial super admin) TIDAK berubah dan bukan urusan izin CashFlow.
 */

/** Umur maksimal sesi ber-MFA — SAMA dengan `auth.MFAMaxAge` gateway
 *  (internal/auth/jwt.go), dihitung dari mfa_at. */
export const UMUR_MFA_MAKS_MS = 12 * 60 * 60 * 1000

/** Yang dibaca dari /admin/auth/me (gateway MeResponse). */
export interface BuktiMfa {
  /** Sesi ini lolos TOTP dan belum lebih tua dari MFAMaxAge. */
  mfa?: unknown
  /** Saat kode TOTP sesi ini diverifikasi (RFC 3339); null bila mfa=false. */
  mfa_at?: unknown
  /** Saat TOTP akun ini diaktifkan (RFC 3339); null bila TOTP mati. Hanya
   *  keberadaannya yang dibaca (TOTP masih aktif), bukan umurnya. */
  totp_enabled_at?: unknown
}

const waktuMs = (v: unknown): number | null => {
  if (typeof v !== 'string' || !v) return null
  const t = Date.parse(v)
  return Number.isFinite(t) ? t : null
}

/**
 * Sampai kapan izin selain cashflow:view boleh berlaku (ms epoch), atau null
 * bila sesi ini tidak berhak atasnya. Ditulis sesi.post.ts ke
 * admin_konsol_sesi.izin_sampai; konsol_boleh (0089) menolak izin selain view
 * sesudahnya. Syarat (semuanya; yang hilang/rusak = gagal tertutup):
 *   - `mfa === true` (boolean, bukan "true"/1);
 *   - `totp_enabled_at` ada (TOTP akun masih aktif) — umurnya TIDAK dihitung
 *     (tanpa masa tenggang, keputusan Master 21 Sep 2026);
 *   - `mfa_at` ada; batasnya mfa_at + UMUR_MFA_MAKS_MS — umur izin data
 *     mengikuti kesegaran MFA gateway, bukan saat sesi CashFlow dicetak
 *     (tab yang mencetak di menit terakhir MFA tidak memegang pii 12 jam
 *     lagi). Dijepit ke sekarang + UMUR_MFA_MAKS_MS bila jam gateway
 *     mendahului.
 */
export function batasIzinMfa(bukti: BuktiMfa | null | undefined, sekarang: number = Date.now()): number | null {
  if (!bukti || bukti.mfa !== true) return null
  const totp = waktuMs(bukti.totp_enabled_at)
  const pada = waktuMs(bukti.mfa_at)
  if (totp === null || pada === null) return null
  const sampai = Math.min(pada + UMUR_MFA_MAKS_MS, sekarang + UMUR_MFA_MAKS_MS)
  return sampai > sekarang ? sampai : null
}

/**
 * Izin yang ditulis ke admin_konsol_sesi.izin untuk sesi CashFlow baru.
 *
 * - peran tanpa cashflow:view → [] (sesi tidak dicetak: 403 tanpa-izin);
 * - cashflow:view SELALU ikut bila perannya boleh;
 * - empat lainnya HANYA bila batasIzinMfa(bukti) tidak null (login gateway
 *   lolos TOTP yang masih segar dan TOTP akunnya masih aktif — langsung,
 *   tanpa masa tenggang) DAN perannya memegang izin itu.
 */
export function izinSesiCashflow(
  role: string | null | undefined, bukti: BuktiMfa | null | undefined, sekarang: number = Date.now(),
): IzinCashflow[] {
  if (!peranBoleh(role, 'cashflow:view')) return []
  const mfaSah = batasIzinMfa(bukti, sekarang) !== null
  return IZIN_CASHFLOW.filter(i => i === 'cashflow:view' || (mfaSah && peranBoleh(role, i)))
}
