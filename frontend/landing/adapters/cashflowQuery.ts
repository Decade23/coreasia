/**
 * State daftar di URL — tafsir dan tulis query dengan DAFTAR PUTIH kunci.
 *
 * URL hanya membawa kunci struktur (segmen, urut, halaman, aksi audit) yang
 * tidak mengungkap isi data: setiap URL yang dimuat penuh tercatat di riwayat
 * peramban dan log Vercel. Teks cari, nominal, dan alasan TIDAK pernah masuk
 * sini. Kunci di luar skema dibuang saat menulis; nilai yang tidak lolos
 * aturan dibaca sebagai bawaan — tautan yang diutak-atik tidak bisa membuat
 * halaman dalam keadaan aneh.
 */

export type AturanKunci =
  | { jenis: 'pilihan'; opsi: readonly string[]; bawaan: string }
  | { jenis: 'halaman'; bawaan: number }
  | { jenis: 'teks'; pola: RegExp; maks: number; bawaan: string }

export type SkemaQuery = Record<string, AturanKunci>
/* Pilihan bertipe gabungan literalnya (skema ditulis `as const`), jadi
   halaman tidak perlu cast saat memakai nilai URL sebagai kunci. */
export type NilaiQuery<S extends SkemaQuery> = {
  [K in keyof S]: S[K] extends { jenis: 'halaman' } ? number
    : S[K] extends { jenis: 'pilihan'; opsi: readonly (infer O extends string)[] } ? O
      : string
}

type QueryMentah = Record<string, unknown>

function pertama(v: unknown): string | undefined {
  const x = Array.isArray(v) ? v[0] : v
  return typeof x === 'string' ? x : undefined
}

function tafsir(aturan: AturanKunci, mentah: string | undefined): string | number {
  if (aturan.jenis === 'halaman') {
    if (!mentah || !/^\d{1,6}$/.test(mentah)) return aturan.bawaan
    const n = Number(mentah)
    return n >= 1 ? n : aturan.bawaan
  }
  if (mentah === undefined) return aturan.bawaan
  if (aturan.jenis === 'pilihan') return aturan.opsi.includes(mentah) ? mentah : aturan.bawaan
  return mentah.length <= aturan.maks && aturan.pola.test(mentah) ? mentah : aturan.bawaan
}

/** Query rute → nilai bertipe. Kunci yang tak dikenal diabaikan. */
export function bacaQuery<S extends SkemaQuery>(skema: S, query: QueryMentah): NilaiQuery<S> {
  const hasil: Record<string, string | number> = {}
  for (const [kunci, aturan] of Object.entries(skema)) hasil[kunci] = tafsir(aturan, pertama(query[kunci]))
  return hasil as NilaiQuery<S>
}

/** Nilai → query untuk router. Hanya kunci skema; nilai bawaan dan nilai yang
 *  tidak sah tidak ditulis, supaya URL tetap pendek dan tidak membawa sampah. */
export function tulisQuery<S extends SkemaQuery>(skema: S, nilai: Partial<NilaiQuery<S>>): Record<string, string> {
  const hasil: Record<string, string> = {}
  for (const [kunci, aturan] of Object.entries(skema)) {
    const v = (nilai as Record<string, unknown>)[kunci]
    if (v === undefined || v === null) continue
    const teks = String(v)
    const sah = tafsir(aturan, teks)
    if (String(sah) !== teks || sah === aturan.bawaan) continue
    hasil[kunci] = teks
  }
  return hasil
}
