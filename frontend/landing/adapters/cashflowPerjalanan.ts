import { bacaObjekKursor, isoSah } from './cashflowBuku'
import { terjemahPeristiwa } from './cashflowKamusPeristiwa'
import { waktuDetikWib as waktuPerjalanan, type BahasaWaktu } from './cashflowWaktu'

export interface KursorPerjalanan { p: string; i: string }

export interface PerjalananBarisDTO {
  id: string
  pada: string
  sumber: 'aplikasi' | 'server'
  jenis: string
  langkah: string | null
  kategori: string
  layar: string | null
  rincian_aman: Record<string, unknown>
  sesi: string | null
  sesi_mulai: string | null
  versi: string | null
}

export interface PerjalananDTO {
  baris: PerjalananBarisDTO[]
  kursor_berikut: KursorPerjalanan | null
  halaman_pertama: boolean
  telemetri_sejak: string
  akun_internal: boolean
}

export interface SaringPerjalanan {
  dari: string | null
  sampai: string | null
  kategori: string[] | null
  hanyaGalat: boolean
}

export function kursorPerjalananDariUrl(teks: string): KursorPerjalanan | null {
  const k = bacaObjekKursor(teks)
  if (!k || !isoSah(k.p) || typeof k.i !== 'string' || !/^[0-9a-f]{32}$/.test(k.i)) return null
  return { p: k.p, i: k.i }
}

export { waktuPerjalanan }

export const TAMPIL_KATEGORI: Record<string, { ikon: string; kelas: string }> = {
  aplikasi: { ikon: 'lucide:smartphone', kelas: 'ca-pill-info' },
  onboarding: { ikon: 'lucide:user-round', kelas: 'ca-pill-blue' },
  nomor_wa: { ikon: 'lucide:message-circle', kelas: 'ca-pill-emerald' },
  pembaruan: { ikon: 'lucide:refresh-cw', kelas: 'ca-pill-info' },
  transaksi: { ikon: 'lucide:receipt', kelas: 'ca-pill-gold' },
  usaha: { ikon: 'lucide:store', kelas: 'ca-pill-gold' },
  galat: { ikon: 'lucide:triangle-alert', kelas: 'ca-pill-danger' },
  domi: { ikon: 'lucide:messages-square', kelas: 'ca-pill-blue' },
  kredit: { ikon: 'lucide:coins', kelas: 'ca-pill-gold' },
}

export function kePeristiwaTampil(d: PerjalananBarisDTO, bahasa: BahasaWaktu) {
  const tampil = terjemahPeristiwa(d, bahasa)
  const tujuan: 'transaksi' | 'jejak' | 'pembelian' | 'domi' | null = d.jenis === 'tx.mulai' ? 'transaksi'
    : d.jenis === 'tx.batal' ? 'jejak'
      : d.jenis === 'domi.pembelian' ? 'pembelian'
        : d.jenis === 'domi.pemakaian' ? 'domi' : null
  return {
    ...tampil, id: d.id, waktu: waktuPerjalanan(d.pada, bahasa), waktuIso: d.pada,
    sumber: d.sumber, kategori: d.kategori, tujuan,
    gaya: Object.hasOwn(TAMPIL_KATEGORI, d.kategori)
      ? TAMPIL_KATEGORI[d.kategori]! : { ikon: 'lucide:circle-help', kelas: 'ca-pill-muted' },
  }
}

type PeristiwaTampil = ReturnType<typeof kePeristiwaTampil>
export interface KelompokPerjalanan {
  id: string
  mulai: string | null
  versi: string | null
  baris: PeristiwaTampil[]
}

/** Pertahankan urutan server saat dua peluncuran dari perangkat berbeda beririsan. */
export function kelompokPerjalanan(daftar: readonly PerjalananBarisDTO[], bahasa: BahasaWaktu): KelompokPerjalanan[] {
  const hasil: KelompokPerjalanan[] = []
  let sesi: string | null | undefined
  for (const baris of daftar) {
    if (sesi !== baris.sesi) {
      hasil.push({
        id: baris.id,
        mulai: baris.sesi_mulai ? waktuPerjalanan(baris.sesi_mulai, bahasa) : null,
        versi: baris.versi,
        baris: [],
      })
      sesi = baris.sesi
    }
    hasil.at(-1)!.baris.push(kePeristiwaTampil(baris, bahasa))
  }
  return hasil
}

export function salinPerjalanan(
  kelompok: readonly KelompokPerjalanan[],
  terbuka: ReadonlySet<string>,
  labelKelompok: (k: KelompokPerjalanan) => string,
  labelSumber: (s: PerjalananBarisDTO['sumber']) => string,
  labelAsing: string,
  labelKategori: (kategori: string) => string,
): string {
  return kelompok.map(k => [
    labelKelompok(k),
    ...k.baris.flatMap(b => [
      [b.waktu, labelKategori(b.kategori), b.judul, b.layar, labelSumber(b.sumber)].filter(Boolean).join(' · '),
      ...(terbuka.has(b.id) ? [b.arti, ...b.rincian.map(r =>
        `  ${r.label} · ${r.nilai}${r.belumDikenal && r.nilai !== labelAsing ? ` (${labelAsing})` : ''}`,
      )].filter(Boolean) : []),
    ]),
  ].join('\n')).join('\n\n')
}
