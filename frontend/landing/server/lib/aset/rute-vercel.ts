/**
 * Tembolok berkas build (/_nuxt/**) di Vercel: lama HANYA untuk berkas yang
 * memang ada, tidak pernah untuk jawaban "tidak ditemukan".
 *
 * Asal masalah. Preset Vercel milik Nitro menulis semua header routeRules dan
 * header aset publik sebagai rute SEBELUM `handle: filesystem` di
 * .vercel/output/config.json. Rute di fase itu dipasang ke jawaban apa pun
 * untuk jalur yang cocok, tanpa melihat status. Jadi `cache-control: public,
 * max-age=31536000, immutable` ikut menempel pada 404 di bawah /_nuxt/, dan
 * peramban serta CDN di depan menyimpan 404 itu selama setahun. Saat rilis,
 * berkas ber-hash milik build baru bisa sesaat belum terjawab 200; siapa pun
 * yang memintanya pada jendela itu membawa pulang 404 yang awet.
 *
 * Perbaikan. Fungsi di bawah menulis ulang daftar rute:
 *  - di fase awal, header cache-control untuk /_nuxt dicabut (bentuk dan
 *    urutan rutenya dipertahankan supaya jalur lain tidak berubah perilaku);
 *  - `handle: miss` (berkas tidak ada di sistem berkas deployment) memberi
 *    `no-store`;
 *  - `handle: hit` (berkas ditemukan) memberi tembolok lama.
 * Fase `hit` dan `miss` ada di Build Output API v3 (tipe HandleValue). Aturan
 * bentuknya dipaksa @vercel/routing-utils: rute sesudah `hit` wajib
 * `continue: true` dan tidak boleh punya dest atau status; rute sesudah
 * `miss` tanpa dest wajib `continue: true`.
 *
 * Tiga rute `hit` sengaja tidak saling tumpang (lookahead negatif) supaya
 * hasilnya tidak bergantung pada urutan penimpaan header.
 *
 * Dijaga tests/public/tembolok-aset.test.ts.
 */

export interface RuteVercel {
  src?: string
  handle?: string
  dest?: string
  status?: number
  continue?: boolean
  headers?: Record<string, string>
  [kunci: string]: unknown
}

export interface KonfigVercel {
  routes?: RuteVercel[]
  [kunci: string]: unknown
}

export const TEMBOLOK_ASET_LAMA = 'public, max-age=31536000, immutable'
export const TEMBOLOK_ASET_HILANG = 'no-store'
/** Pengganti header di rute fase awal yang kehilangan cache-control: rutenya
 *  tetap ada (dan tetap menghentikan pencocokan seperti sebelumnya), isinya
 *  header yang aman untuk status apa pun. */
const HEADER_NETRAL = { 'X-Content-Type-Options': 'nosniff' } as const

const kunciTembolok = (headers: Record<string, string> | undefined): string | undefined =>
  Object.keys(headers ?? {}).find(k => k.toLowerCase() === 'cache-control')

const lepasRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * @param konfig isi .vercel/output/config.json hasil preset Nitro
 * @param dirAset awalan berkas build tanpa garis miring akhir, mis. `/_nuxt`
 */
export function amankanTembolokAset<T extends KonfigVercel>(konfig: T, dirAset = '/_nuxt'): T {
  const awalan = dirAset.replace(/\/+$/, '')
  const rute = konfig.routes
  if (!Array.isArray(rute)) throw new Error('tembolok aset: config.json Vercel tidak punya daftar routes')
  const batas = rute.findIndex(r => r.handle === 'filesystem')
  if (batas < 0) throw new Error('tembolok aset: `handle: filesystem` tidak ditemukan, susunan rute preset berubah')
  if (rute.some(r => r.handle === 'hit' || r.handle === 'miss')) {
    throw new Error('tembolok aset: preset sudah menulis fase hit/miss sendiri, periksa ulang penulisan ini')
  }

  const milikAset = (r: RuteVercel): boolean =>
    typeof r.src === 'string' && (r.src === awalan || r.src.startsWith(`${awalan}/`) || r.src.startsWith(`${awalan}(`))

  let tembolokBuilds: string | undefined
  let tembolokMeta: string | undefined
  const faseAwal: RuteVercel[] = []
  for (const r of rute.slice(0, batas)) {
    const kunci = milikAset(r) ? kunciTembolok(r.headers) : undefined
    if (!kunci) {
      faseAwal.push(r)
      continue
    }
    const nilai = r.headers![kunci]!
    if (r.src === `${awalan}/builds/meta/(.*)`) tembolokMeta = nilai
    else if (r.src === `${awalan}/builds/(.*)`) tembolokBuilds = nilai
    // Rute `continue` milik preset (aset publik) hanya membawa cache-control:
    // dibuang seluruhnya, penggantinya ada di fase hit.
    if (r.continue) continue
    const { [kunci]: _dibuang, ...sisa } = r.headers!
    faseAwal.push({ ...r, headers: Object.keys(sisa).length ? sisa : { ...HEADER_NETRAL } })
  }

  const a = lepasRegex(awalan)
  const hit: RuteVercel[] = tembolokBuilds || tembolokMeta
    ? [
        { src: `${a}/builds/meta/(.*)`, headers: { 'cache-control': tembolokMeta ?? TEMBOLOK_ASET_LAMA }, continue: true },
        // Manifest build (latest.json) sengaja berumur pendek: nilainya diambil dari aturan Nuxt.
        { src: `${a}/builds/(?!meta/)(.*)`, headers: { 'cache-control': tembolokBuilds ?? TEMBOLOK_ASET_LAMA }, continue: true },
        { src: `${a}/(?!builds/)(.*)`, headers: { 'cache-control': TEMBOLOK_ASET_LAMA }, continue: true },
      ]
    : [{ src: `${a}/(.*)`, headers: { 'cache-control': TEMBOLOK_ASET_LAMA }, continue: true }]

  return {
    ...konfig,
    routes: [
      ...faseAwal,
      ...rute.slice(batas),
      { handle: 'miss' },
      { src: `${a}/(.*)`, headers: { 'cache-control': TEMBOLOK_ASET_HILANG }, continue: true },
      { handle: 'hit' },
      ...hit,
    ],
  }
}

/** Jalur permintaan (boleh ber-query) ada di bawah folder berkas build? */
export function jalurAsetBuild(jalur: string, dirAset = '/_nuxt'): boolean {
  const awalan = dirAset.replace(/\/+$/, '')
  const tanpaQuery = jalur.split('?')[0] ?? ''
  return tanpaQuery.startsWith(`${awalan}/`)
}
