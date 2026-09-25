/**
 * Pengganti modul virtual Nuxt `#imports` untuk vitest (alias di
 * vitest.config.ts) — bukan berkas uji.
 *
 * server/lib/konsol/h3.ts mengimpor useRuntimeConfig dari `#imports`; handler
 * Nitro memakai auto-import global yang sama. Di uji, keduanya diteruskan ke
 * SATU global tiruan (vi.stubGlobal('useRuntimeConfig', …)), jadi konfigurasi
 * yang dibaca h3.ts dan handler selalu sama.
 */
type Konfig = Record<string, unknown> & { public: Record<string, unknown> }

export function useRuntimeConfig(...arg: unknown[]): Konfig {
  const f = (globalThis as { useRuntimeConfig?: (...a: unknown[]) => Konfig }).useRuntimeConfig
  if (!f) throw new Error('useRuntimeConfig belum dipasang sebagai global tiruan di uji ini')
  return f(...arg)
}
