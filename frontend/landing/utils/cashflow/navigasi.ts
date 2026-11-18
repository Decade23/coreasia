/**
 * Peta navigasi console CashFlow: lima pintu, dan halaman di dalam tiap pintu.
 *
 * Satu sumber untuk CashflowNav (tab berkelompok) dan CashflowPalet (daftar
 * halaman). Fungsi murni tanpa Nuxt supaya bisa diuji: setiap halaman di
 * pages/console/cashflow/ harus terdaftar tepat sekali (lihat
 * tests/cashflow/navigasi.test.ts).
 *
 * `kunci` halaman = kunci kamus `nav.<kunci>`, `kunci` pintu = `pintu.<kunci>`.
 * Belum ada halaman yang disembunyikan menurut izin: setiap pemegang
 * cashflow:view melihat semuanya, dan tiap halaman menolak sendiri isi yang
 * butuh izin lebih. Kalau kelak ada, tambahkan `izin` di HalamanNav dan saring
 * lewat `pintuTerlihat`, jangan di komponen.
 */
export const AKAR_CASHFLOW = '/console/cashflow'

export type KunciPintu = 'ringkasan' | 'orang' | 'domi' | 'kabar' | 'operasional'

export interface HalamanNav {
  kunci: string
  jalur: string
  ikon: string
  /** Izin yang wajib dipegang supaya tautannya tampil. Kosong = semua pemegang cashflow:view. */
  izin?: string
}

export interface PintuNav {
  kunci: KunciPintu
  halaman: readonly HalamanNav[]
}

export const PINTU_CASHFLOW: readonly PintuNav[] = [
  { kunci: 'ringkasan', halaman: [
    { kunci: 'ringkasan', jalur: '/console/cashflow', ikon: 'lucide:gauge' },
    { kunci: 'laporan', jalur: '/console/cashflow/laporan', ikon: 'lucide:chart-column' },
  ] },
  { kunci: 'orang', halaman: [
    { kunci: 'pengguna', jalur: '/console/cashflow/pengguna', ikon: 'lucide:users' },
    { kunci: 'ruang', jalur: '/console/cashflow/ruang', ikon: 'lucide:layers' },
    { kunci: 'aktivitas', jalur: '/console/cashflow/aktivitas', ikon: 'lucide:activity' },
    { kunci: 'corongWa', jalur: '/console/cashflow/corong', ikon: 'lucide:filter' },
  ] },
  { kunci: 'domi', halaman: [
    { kunci: 'domi', jalur: '/console/cashflow/domi', ikon: 'lucide:life-buoy' },
    { kunci: 'paket', jalur: '/console/cashflow/paket', ikon: 'lucide:tags' },
    { kunci: 'pembelian', jalur: '/console/cashflow/pembelian', ikon: 'lucide:receipt' },
  ] },
  { kunci: 'kabar', halaman: [
    { kunci: 'pengumuman', jalur: '/console/cashflow/pengumuman', ikon: 'lucide:megaphone' },
    { kunci: 'dukungan', jalur: '/console/cashflow/dukungan', ikon: 'lucide:heart-handshake' },
    { kunci: 'kasus', jalur: '/console/cashflow/kasus', ikon: 'lucide:folder-lock' },
  ] },
  { kunci: 'operasional', halaman: [
    { kunci: 'kesehatan', jalur: '/console/cashflow/kesehatan', ikon: 'lucide:heart-pulse' },
    { kunci: 'sakelar', jalur: '/console/cashflow/sakelar', ikon: 'lucide:toggle-right' },
    { kunci: 'hapusAkun', jalur: '/console/cashflow/hapus-akun', ikon: 'lucide:user-x' },
    { kunci: 'audit', jalur: '/console/cashflow/audit', ikon: 'lucide:scroll-text' },
  ] },
]

/** Halaman modul yang sengaja di luar menu: tujuan saat penyambungan sesi gagal. */
export const JALUR_TANPA_MENU: readonly string[] = ['/console/cashflow/masuk']

export const HALAMAN_CASHFLOW: readonly (HalamanNav & { pintu: KunciPintu })[] =
  PINTU_CASHFLOW.flatMap(p => p.halaman.map(h => ({ ...h, pintu: p.kunci })))

const rapikan = (path: string) => {
  const tanpaEkor = (path.split(/[?#]/)[0] ?? '').replace(/\/+$/, '')
  return tanpaEkor || '/'
}

/** Jalur `path` ada di halaman `jalur` atau di bawahnya (`pengguna/<id>/dompet`). */
export const diDalam = (path: string, jalur: string) => {
  const p = rapikan(path)
  return jalur === AKAR_CASHFLOW ? p === jalur : p === jalur || p.startsWith(`${jalur}/`)
}

/** Halaman menu yang memuat `path`, termasuk rute bersarang. null = di luar menu. */
export const halamanUntuk = (path: string) => HALAMAN_CASHFLOW.find(h => diDalam(path, h.jalur)) ?? null

/** Pintu yang aktif untuk `path`. null = di luar menu (mis. halaman masuk). */
export const pintuUntuk = (path: string): KunciPintu | null => halamanUntuk(path)?.pintu ?? null

/** `path` persis halaman menu itu (bukan rute bersarang di bawahnya). */
export const tepatDi = (path: string, jalur: string) => rapikan(path) === jalur

/** Pintu dan halaman yang boleh tampil untuk pemegang izin `boleh`. Pintu tanpa halaman ikut hilang. */
export const pintuTerlihat = (boleh: (izin: string) => boolean): PintuNav[] =>
  PINTU_CASHFLOW
    .map(p => ({ kunci: p.kunci, halaman: p.halaman.filter(h => !h.izin || boleh(h.izin)) }))
    .filter(p => p.halaman.length > 0)
