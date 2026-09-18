/**
 * Waktu di console CashFlow — SELALU WIB (Asia/Jakarta), apa pun zona peramban.
 *
 * Datanya milik orang Indonesia dan dicatat dengan hari WIB; staf yang membuka
 * console dari laptop berzona lain tetap harus membaca "18 Sep" untuk transaksi
 * tanggal 18. Aturannya dua:
 * - timestamptz → Intl.DateTimeFormat dengan timeZone Asia/Jakarta, tidak
 *   pernah getDate()/getHours() yang mengikuti zona mesin;
 * - kolom `date` ('YYYY-MM-DD', mis. occurred_at, tanggal) diformat dari
 *   STRING-nya. new Date('2026-09-03') dibaca sebagai tengah malam UTC dan
 *   bergeser ke 2 Sep di zona barat.
 * WIB tidak punya musim panas, jadi selisih +07:00 aman dipakai tetap untuk
 * menafsirkan masukan datetime-local.
 *
 * Bahasa hanya mengubah RUPA (nama bulan, pemisah jam), tidak pernah zonanya:
 * console berbahasa Inggris tetap membaca hari WIB. Bawaannya 'id' supaya
 * pemanggil lama tidak berubah; halaman meneruskan bahasa lewat
 * useCashflowI18n (formatTanggal/formatJam/formatWaktu).
 *
 * Fungsi murni; diekspor ulang dari adapters/cashflow.ts supaya impor lama
 * tetap jalan.
 */

export const ZONA_WIB = 'Asia/Jakarta'
export const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const BULAN_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export type BahasaWaktu = 'id' | 'en'

const namaBulan = (m: string, bahasa: BahasaWaktu) => (bahasa === 'en' ? BULAN_EN : BULAN)[Number(m) - 1] ?? m
/* '14.05' adalah penulisan jam baku bahasa Indonesia; pembaca Inggris membaca titik sebagai desimal. */
const jamMenit = (b: BagianWib, bahasa: BahasaWaktu) => `${b.jam}${bahasa === 'en' ? ':' : '.'}${b.menit}`

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/
const POLA_DATETIME_LOKAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/* Satu formatter untuk semua: en-CA + h23 memberi angka ASCII yang bisa
   dirakit ulang tanpa bergantung pada tanda baca locale. */
let formatter: Intl.DateTimeFormat | null = null
const fmt = () => (formatter ??= new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_WIB, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}))

interface BagianWib { y: string; m: string; d: string; jam: string; menit: string }

function keDate(nilai: string | Date | null | undefined): Date | null {
  if (!nilai) return null
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  return Number.isNaN(d.getTime()) ? null : d
}

function bagianWib(d: Date): BagianWib {
  const p: Record<string, string> = {}
  for (const x of fmt().formatToParts(d)) p[x.type] = x.value
  return { y: p.year ?? '', m: p.month ?? '', d: p.day ?? '', jam: p.hour ?? '', menit: p.minute ?? '' }
}

function pendek(y: string, m: string, d: string, bahasa: BahasaWaktu): string {
  return `${Number(d)} ${namaBulan(m, bahasa)} ${y}`
}

/** '2026-09-03' atau '2026-09-17T17:00:00Z' → '3 Sep 2026' / '18 Sep 2026' (hari WIB). Kosong/rusak → '—'. */
export function tanggalPendek(nilai: string | null | undefined, bahasa: BahasaWaktu = 'id'): string {
  if (!nilai) return '—'
  const t = POLA_TANGGAL.exec(nilai)
  if (t) return pendek(t[1]!, t[2]!, t[3]!, bahasa)
  const d = keDate(nilai)
  if (!d) return '—'
  const b = bagianWib(d)
  return pendek(b.y, b.m, b.d, bahasa)
}

/** Hari WIB sebagai 'YYYY-MM-DD'. Kolom date dipulangkan apa adanya. Kosong/rusak → ''. */
export function tanggalWib(nilai: string | Date | null | undefined): string {
  if (typeof nilai === 'string' && POLA_TANGGAL.test(nilai)) return nilai
  const d = keDate(nilai)
  if (!d) return ''
  const b = bagianWib(d)
  return `${b.y}-${b.m}-${b.d}`
}

/** Hari ini menurut WIB. `sekarang` bisa diisi untuk uji. */
export function hariIniWib(sekarang: Date = new Date()): string {
  return tanggalWib(sekarang)
}

/** Geser tanggal 'YYYY-MM-DD' sebanyak n hari — aritmetika tanggal murni lewat UTC, tanpa zona. */
export function geserHari(ymd: string, n: number): string {
  const t = POLA_TANGGAL.exec(ymd)
  if (!t) return ymd
  const d = new Date(Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]) + n))
  return d.toISOString().slice(0, 10)
}

/** '14.05' (jam WIB; '14:05' untuk 'en'). Kosong/rusak → '—'. */
export function jamWib(nilai: string | Date | null | undefined, bahasa: BahasaWaktu = 'id'): string {
  const d = keDate(nilai)
  if (!d) return '—'
  return jamMenit(bagianWib(d), bahasa)
}

/** '18 Sep 01.05' — tanggal dan jam WIB tanpa tahun, untuk tabel audit. */
export function waktuPendekWib(nilai: string | Date | null | undefined, bahasa: BahasaWaktu = 'id'): string {
  const d = keDate(nilai)
  if (!d) return '—'
  const b = bagianWib(d)
  return `${Number(b.d)} ${namaBulan(b.m, bahasa)} ${jamMenit(b, bahasa)}`
}

/** Nilai untuk <input type="datetime-local"> yang DIBACA sebagai WIB: 'YYYY-MM-DDTHH:mm'. */
export function keDatetimeLokalWib(nilai: string | Date): string {
  const d = keDate(nilai)
  if (!d) return ''
  const b = bagianWib(d)
  return `${b.y}-${b.m}-${b.d}T${b.jam}:${b.menit}`
}

/** Masukan datetime-local yang diketik sebagai jam WIB → ISO UTC untuk server.
 *  Tanggal yang tidak ada (30 Feb, bulan 13) → null, bukan digulirkan diam-diam. */
export function dariDatetimeLokalWib(nilai: string): string | null {
  if (!POLA_DATETIME_LOKAL.test(nilai)) return null
  const d = new Date(`${nilai}:00+07:00`)
  if (Number.isNaN(d.getTime())) return null
  // Pulang-pergi harus sama persis; kalau tidak, mesin tanggal menggulirkannya.
  return keDatetimeLokalWib(d) === nilai ? d.toISOString() : null
}
