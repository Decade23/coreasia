/**
 * Kasus aktif Pengguna 360 — satu sumber kebenaran di tab ini.
 *
 * DIBUKA OTOMATIS (keputusan Master 21 Sep 2026). Membuka Pengguna 360 =
 * data tampil, tanpa dialog alasan/skenario/ranah/lingkup. Induk
 * pengguna/[id].vue memanggil `pulihkan(subjek)` (admin_kasus_aktif) lalu
 * `aturLingkup(subjek, ruang kepala)` — jawaban basi untuk subjek lain
 * (staf sudah pindah orang) tidak berbuat apa-apa:
 *   - ada kasus aktif milik pelaku ini → dipakai; ranah Fase 1 atau ruang
 *     subjek yang belum termasuk ditambahkan (admin_kasus_tambah);
 *   - tidak ada → admin_kasus_buka dengan isian otomatis
 *     (adapters/cashflowKasus.ts "Pembukaan OTOMATIS");
 *   - kepala tanpa `ruang` (sesi tanpa cashflow:pii = login tanpa TOTP) →
 *     tahap 'izin': tidak ada panggilan, halaman menyuruh masuk ulang ber-TOTP;
 *   - batas laju server ({ditolak, hint:'batas-akses'}) → tahap 'batas';
 *   - sesi console/CashFlow mati (galat 'sesi'/'totp', mis. tab ditinggal
 *     semalam) → tahap 'sesi': induk pengguna/[id].vue mengarahkan ke
 *     /console/cashflow/masuk seperti jalur muat lainnya (useCashflowMuat
 *     keMasukBilaSesi); tidak dicoba ulang sendiri (temuan fe p2 #4).
 * Kasus TETAP dicatat server dan setiap pembacaan TETAP diaudit.
 *
 * SELAMA HALAMAN AKTIF (induk terpasang, tab terlihat, ada interaksi dalam
 * 30 menit terakhir) kasus diperpanjang otomatis saat sisa ≤ 5 menit, sampai
 * batas 2 jam sejak akar anggarannya. Lewat batas itu kasus berakhir, datanya
 * dibuang, lalu kasus BARU dibuka otomatis (anggaran baru; ikut batas laju).
 * Halaman yang ditinggal (tersembunyi/diam) tidak memperpanjang: kasusnya
 * habis sendiri, dan interaksi berikutnya membukanya lagi. "Interaksi" =
 * masukan orang (pointerdown/keydown/wheel/touchstart, tab kembali terlihat),
 * BUKAN 'scroll': halaman yang memendek karena datanya dibuang membuat
 * peramban menjepit posisi gulir dan memancarkan 'scroll' (isTrusted) tanpa
 * ada orang — itu akan membuka kasus baru di layar yang tidak dijaga. Sabuk
 * kedua: masukan dalam 2 detik sesudah data dibuang diabaikan.
 *
 * KASUS DIPULIHKAN DARI SERVER. Id kasus tidak pernah masuk URL maupun
 * storage (rencana, "Kasus"). Kasus terikat pelaku, bukan session_id, jadi
 * tab lain orang yang sama ikut memakainya; admin lain tidak. Karena itu
 * setiap kali tab ini kehilangan kasusnya (salinan lokal habis, server
 * menjawab kasus-kedaluwarsa/kasus-tidak-dikenal), ia BERTANYA dulu ke
 * admin_kasus_aktif dan memakai kasus yang masih hidup; admin_kasus_buka
 * hanya bila server tidak punya. admin_kasus_buka menutup kasus aktif
 * pelaku atas subjek yang sama — tanpa pertanyaan itu, dua tab atas
 * pengguna yang sama saling menutup kasus (dan menulis audit) bergantian.
 *
 * DATA RANAH HANYA DI SINI, DAN DIKOSONGKAN. Setiap tab menyimpan jawaban
 * RPC-nya lewat `muatData(kunci, …)` — kunci memuat id kasus dan lingkup
 * ruangnya — sehingga pindah tab dan Back tidak memanggil ulang (satu baris
 * audit per panggilan). Begitu kasus habis (jam klien, atau server menjawab
 * kasus-kedaluwarsa/kasus-tidak-dikenal) atau subjek berganti, SELURUH
 * simpanan dibuang dari memori — bukan sekadar disembunyikan.
 *
 * T3 (catatan, judul, teks bebas) = satu klik "Tampilkan catatan": kasus
 * anak 10 menit dibuka otomatis (alasan otomatis yang berbeda dari induk)
 * lalu admin_teks untuk id baris yang diklik saja (CashflowTeksTerkunci).
 * Teks disimpan per kasus anak dan dibuang saat anaknya habis.
 *
 * Semua keadaan di modul ini hidup di memori tab (console ssr:false) dan
 * dibuang saat logout (lupakanKasus, dipanggil useCashflowSesi).
 */
import { computed, readonly, ref, shallowReactive } from 'vue'
import { GalatAdmin, petakanGalat } from './useCashflowAdmin'
import {
  keKasus, adalahBatasAkses, kasusBerlaku, sisaDetik, bisaPerpanjang, kurangDariKasus,
  alasanOtomatis, alasanT3Otomatis, RANAH_FASE1, SKENARIO_OTOMATIS, PRESET_OTOMATIS, PRESET_T3_OTOMATIS,
  AMBANG_PERPANJANG_DETIK, BATAS_DIAM_MS,
  type Kasus, type BatasAksesDTO, type PresetKasus,
} from '~/adapters/cashflowKasus'
import { keTeks, BATAS_TEKS, type JenisTeks, type PotongTeks } from '~/adapters/cashflowBuku'

/**
 * diam     belum ada yang dikerjakan (atau kasus baru saja habis)
 * membuka  pembukaan/penyelarasan otomatis sedang berjalan
 * siap     kasus terpasang
 * izin     sesi tanpa cashflow:pii — masuk ulang ber-TOTP
 * batas    batas laju server tercapai (tidak dicoba ulang otomatis)
 * galat    pembukaan gagal; "Coba lagi" satu klik
 * sesi     sesi console/CashFlow mati — induk mengarahkan ke /masuk
 */
export type TahapKasus = 'diam' | 'membuka' | 'siap' | 'izin' | 'batas' | 'galat' | 'sesi'

/** Tahap yang menahan pembukaan otomatis sampai ada perbuatan orang ("Coba
 *  lagi", atau kunjungan baru ke subjek — lihat pulihkan). */
const TAHAP_TERTAHAN: readonly TahapKasus[] = ['izin', 'batas', 'galat', 'sesi']

/** Galat yang berarti "masuk/sambung ulang", bukan "coba lagi" (= useCashflowMuat keMasukBilaSesi). */
const galatSesi = (g: GalatAdmin): boolean => g.jenis === 'sesi' || g.jenis === 'totp'

interface Keadaan {
  subjek: string | null
  kasus: Kasus | null
  anak: Kasus[]
  pulih: 'belum' | 'memuat' | 'siap' | 'galat'
  /** Semua ruang subjek (dari kepala); null = belum diketahui atau tanpa pii. */
  lingkup: string[] | null
  tahap: TahapKasus
  galat: GalatAdmin | null
  batas: BatasAksesDTO | null
  /** Naik setiap kali data dibuang; jawaban yang tiba sesudahnya tidak disimpan. */
  versi: number
}

const awal = (): Keadaan => ({
  subjek: null, kasus: null, anak: [], pulih: 'belum', lingkup: null, tahap: 'diam', galat: null, batas: null, versi: 0,
})

const keadaan = ref<Keadaan>(awal())
const simpanan = shallowReactive(new Map<string, unknown>())
const berjalan = new Map<string, Promise<unknown>>()
const teksTerbuka = shallowReactive(new Map<string, { anak: string; potong: PotongTeks[] }>())
const detik = ref(Date.now())
let pengatur: ReturnType<typeof setInterval> | null = null

/** API yang dipakai pekerjaan OTOMATIS (detak, pendengar aktivitas) — di luar
 *  setup komponen; diisi setiap kali useCashflowKasus() dipanggil. */
type Api = ReturnType<typeof useCashflowAdmin>
let apiTerakhir: Api | null = null

// ── Halaman aktif ────────────────────────────────────────────────────────
let halamanTerpasang = 0
let aktivitasTerakhir = Date.now()
/** Pembukaan otomatis yang sedang berjalan (satu untuk semua pemanggil) dan subjeknya. */
let bukaBerjalan: Promise<void> | null = null
let bukaUntuk: string | null = null
let anakBerjalan: Promise<Kasus> | null = null
/** Induk kasus anak yang sedang dibuka — anak itu hanya untuk induk yang sama. */
let anakUntuk: string | null = null
let perpanjangBerjalan = false
let perpanjangGagalPada = 0
/** Cap waktu pembukaan otomatis terakhir — penjaga putaran (lihat bukaOtomatis). */
let riwayatBuka: number[] = []
let tundaBuka: ReturnType<typeof setTimeout> | null = null
const BATAS_BUKA_BERUNTUN = 3
const JENDELA_BUKA_MS = 5 * 60_000
/** Jeda sesudah kasus habis sebelum dibuka lagi: jam klien bisa beberapa
 *  detik mendahului server, dan kasus lama belum dianggap habis di sana. */
const JEDA_BUKA_ULANG_MS = 5_000
/** Masukan sesaat sesudah data dibuang bukan bukti ada orang: tata letak
 *  yang memendek bisa memancarkan peristiwa tanpa masukan (lihat kepala). */
const REDAM_AKTIVITAS_MS = 2_000
let abaikanAktivitasSampai = 0
/** pulihkan() baru saja bertanya ke server dan tidak ada kasus: pembukaan
 *  yang langsung menyusul tidak perlu bertanya lagi. Hanya sesaat — lewat
 *  dari itu tab lain bisa sudah membuka kasus. */
let pulihKosongPada = 0
const PULIH_SEGAR_MS = 10_000

function terlihat(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}
/** Induk terpasang, tab terlihat, dan ada interaksi dalam 30 menit terakhir. */
export function halamanAktif(sekarang: number = Date.now()): boolean {
  return halamanTerpasang > 0 && terlihat() && sekarang - aktivitasTerakhir < BATAS_DIAM_MS
}

function kosongkanData() {
  simpanan.clear()
  berjalan.clear()
  teksTerbuka.clear()
  // Isi halaman diganti kerangka / dikosongkan: peristiwa yang dipicu tata
  // letak sesudah ini tidak dihitung sebagai orang (catatAktivitas).
  abaikanAktivitasSampai = Date.now() + REDAM_AKTIVITAS_MS
}

/** Kasus habis/ditolak server: data dibuang, lalu dibuka lagi bila halaman aktif. */
function hilangkan() {
  kosongkanData()
  keadaan.value = { ...keadaan.value, kasus: null, anak: [], tahap: 'diam', versi: keadaan.value.versi + 1 }
  jadwalkanBukaUlang()
}

function jadwalkanBukaUlang() {
  if (tundaBuka) clearTimeout(tundaBuka)
  tundaBuka = setTimeout(() => {
    tundaBuka = null
    if (halamanAktif()) void bukaOtomatis()
  }, JEDA_BUKA_ULANG_MS)
}

function hentikanDetak() {
  if (pengatur) clearInterval(pengatur)
  pengatur = null
}

function detak() {
  const sekarang = Date.now()
  detik.value = sekarang
  const k = keadaan.value.kasus
  if (k && !kasusBerlaku(k, sekarang)) {
    hilangkan()
  } else if (k && halamanAktif(sekarang) && sisaDetik(k, sekarang) <= AMBANG_PERPANJANG_DETIK && bisaPerpanjang(k)
    && !perpanjangBerjalan && sekarang - perpanjangGagalPada > 60_000) {
    void perpanjangOtomatis(k)
  }
  const s = keadaan.value
  if (s.anak.length) {
    const hidup = s.anak.filter(a => kasusBerlaku(a, sekarang))
    if (hidup.length !== s.anak.length) {
      const idHidup = new Set(hidup.map(a => a.id))
      for (const [kunci, t] of teksTerbuka) if (!idHidup.has(t.anak)) teksTerbuka.delete(kunci)
      keadaan.value = { ...s, anak: hidup }
    }
  }
  if (!keadaan.value.kasus && !keadaan.value.anak.length) hentikanDetak()
}

function mulaiDetak() {
  if (pengatur || typeof window === 'undefined') return
  detik.value = Date.now()
  pengatur = setInterval(detak, 1000)
}

/** Logout / pergantian admin: tidak ada kasus, data, atau teks yang tersisa. */
export function lupakanKasus() {
  hentikanDetak()
  kosongkanData()
  if (tundaBuka) clearTimeout(tundaBuka)
  tundaBuka = null
  bukaBerjalan = null
  bukaUntuk = null
  anakBerjalan = null
  anakUntuk = null
  riwayatBuka = []
  pulihKosongPada = 0
  keadaan.value = { ...awal(), versi: keadaan.value.versi + 1 }
}

function pasang(k: Kasus | null, anak: Kasus[]) {
  const lama = keadaan.value.kasus
  // Kasus yang sama dengan lingkup yang sama (ranah ditambah, diperpanjang)
  // = data boleh tinggal. Selain itu data lama tidak berhak tinggal.
  const tetap = !!k && !!lama && lama.id === k.id && lama.ruang.join() === k.ruang.join()
  if (!tetap) kosongkanData()
  keadaan.value = {
    ...keadaan.value,
    kasus: k,
    anak: k ? anak.filter(a => a.induk === k.id) : [],
    versi: tetap ? keadaan.value.versi : keadaan.value.versi + 1,
  }
  if (k) mulaiDetak()
}

/**
 * Jalankan RPC berkasus. Galat 'kasus' (habis, dicabut, bukan milik pelaku)
 * untuk kasus yang sama = kasus dilepas di sini (data dibuang, dibuka lagi
 * otomatis bila halaman aktif). Galatnya tetap dilempar ke pemanggil.
 */
async function jalankanDengan<T>(kerja: (k: Kasus) => Promise<T>): Promise<T> {
  const k = keadaan.value.kasus
  if (!k) throw new GalatAdmin('kasus', 'Belum ada kasus terbuka.', 'kasus-tidak-dikenal')
  try {
    return await kerja(k)
  } catch (e) {
    const g = petakanGalat(e)
    if (g.jenis === 'kasus' && keadaan.value.kasus?.id === k.id) hilangkan()
    throw g
  }
}

async function perpanjangOtomatis(k: Kasus): Promise<void> {
  const api = apiTerakhir
  if (!api) return
  perpanjangBerjalan = true
  try {
    const d = await jalankanDengan(kk => api.kasusPerpanjang(kk.id))
    if (keadaan.value.kasus?.id === k.id) pasang(keKasus(d), keadaan.value.anak)
  } catch {
    // Tidak diulang tiap detik; kasusnya tetap berlaku sampai habis, lalu dibuka lagi.
    perpanjangGagalPada = Date.now()
  } finally {
    perpanjangBerjalan = false
  }
}

function setelTahap(tahap: TahapKasus, galat: GalatAdmin | null = null, batas: BatasAksesDTO | null = null) {
  keadaan.value = { ...keadaan.value, tahap, galat, batas }
}

/**
 * Pastikan ada kasus berisi semua ranah Fase 1 dan semua ruang subjek.
 * `paksa` = dipanggil orang (Coba lagi): melewati penjaga putaran dan
 * mengulang tahap batas/galat. Satu pembukaan berjalan untuk semua pemanggil.
 */
function bukaOtomatis(paksa = false): Promise<void> {
  // Yang berjalan untuk subjek lain (pindah orang di tengah pembukaan) selesai
  // tanpa menyentuh subjek baru; pembukaan subjek baru menyusul sesudahnya.
  if (bukaBerjalan) return bukaUntuk === keadaan.value.subjek ? bukaBerjalan : bukaBerjalan.then(() => bukaOtomatis(paksa))
  const s = keadaan.value
  const api = apiTerakhir
  if (!api || !s.subjek || s.lingkup === null || s.pulih !== 'siap') return Promise.resolve()
  if (!paksa && TAHAP_TERTAHAN.includes(s.tahap)) return Promise.resolve()
  const subjek = s.subjek
  const lingkup = [...s.lingkup]
  const kerja = async () => {
    if (!keadaan.value.kasus) {
      // Penjaga putaran: kasus yang terus habis/ditolak sesaat sesudah
      // didapat (jam klien jauh dari server, sesi dicabut berulang) tidak
      // boleh membuka kasus — dan menulis audit — tanpa henti.
      const sekarang = Date.now()
      riwayatBuka = riwayatBuka.filter(t => sekarang - t < JENDELA_BUKA_MS)
      if (!paksa && riwayatBuka.length >= BATAS_BUKA_BERUNTUN) {
        setelTahap('galat', new GalatAdmin('kasus', 'Kasus berulang kali berakhir sesaat sesudah dibuka.', 'buka-beruntun'))
        return
      }
      riwayatBuka.push(sekarang)
      setelTahap('membuka')
      // Kasus terikat pelaku dan dipakai bersama antar-tab: salinan tab ini
      // bisa habis sementara tab lain sudah memperpanjangnya, atau tab lain
      // sudah membuka kasus penggantinya. Tanya server dulu (T0, tanpa
      // audit); admin_kasus_buka MENUTUP kasus aktif pelaku atas subjek ini.
      const segar = sekarang - pulihKosongPada < PULIH_SEGAR_MS
      pulihKosongPada = 0
      if (!segar) {
        const p = await api.kasusAktif(subjek)
        if (keadaan.value.subjek !== subjek) return
        const kp = p.kasus ? keKasus(p.kasus) : null
        // Masih hidup di server tapi sudah lewat menurut jam tab ini (jam
        // klien mendahului): memasangnya = langsung dibuang lagi. Buka baru.
        if (kp && kasusBerlaku(kp)) pasang(kp, (p.investigasi ?? []).map(keKasus))
      }
      if (!keadaan.value.kasus) {
        const d = await api.kasusBuka(subjek, SKENARIO_OTOMATIS, PRESET_OTOMATIS, RANAH_FASE1, lingkup, alasanOtomatis(new Date()))
        if (keadaan.value.subjek !== subjek) return
        if (adalahBatasAkses(d)) { setelTahap('batas', null, d); return }
        pasang(keKasus(d), [])
        setelTahap('siap')
        return
      }
    }
    const k = keadaan.value.kasus
    if (!k) return
    const kurang = kurangDariKasus(k, lingkup)
    if (kurang.ranah.length || kurang.ruang.length) {
      setelTahap('membuka')
      const d = await jalankanDengan(kk => api.kasusTambah(kk.id, kurang.ranah, kurang.ruang))
      if (keadaan.value.subjek === subjek) pasang(keKasus(d), keadaan.value.anak)
    }
    if (keadaan.value.subjek === subjek) setelTahap('siap')
  }
  // Tidak pernah menolak: hasilnya ada di `tahap` (halaman membacanya dari sana).
  bukaBerjalan = kerja()
    .catch((e: unknown) => {
      const g = petakanGalat(e)
      if (keadaan.value.subjek !== subjek) return
      // Kasus yang dipulihkan ternyata sudah habis di server: hilangkan()
      // sudah membuang datanya dan menjadwalkan pembukaan ulang.
      if (g.jenis === 'kasus' && !keadaan.value.kasus) return
      setelTahap(g.jenis === 'izin' ? 'izin' : galatSesi(g) ? 'sesi' : 'galat', g)
    })
    .finally(() => { bukaBerjalan = null; bukaUntuk = null })
  bukaUntuk = subjek
  return bukaBerjalan
}

// ── Pendengar aktivitas (dipasang induk pengguna/[id].vue) ───────────────
let aktivitasDicatat = 0
/** `pasti` = tab kembali terlihat: itu perbuatan orang, bukan akibat tata letak. */
function catatAktivitas(pasti = false) {
  const sekarang = Date.now()
  // Sesaat sesudah data dibuang: bukan bukti ada orang (lihat kepala berkas).
  // Selisih mutlak/berbatas: jam yang mundur tidak membuat masukan diabaikan lama.
  if (!pasti && sekarang < abaikanAktivitasSampai && abaikanAktivitasSampai - sekarang <= REDAM_AKTIVITAS_MS) return
  if (Math.abs(sekarang - aktivitasDicatat) < 1000) return
  aktivitasDicatat = sekarang
  const dariDiam = sekarang - aktivitasTerakhir >= BATAS_DIAM_MS
  aktivitasTerakhir = sekarang
  const s = keadaan.value
  // Kembali ke halaman yang kasusnya habis selagi ditinggal: buka lagi.
  // Pembukaan ulang yang sudah dijadwalkan (jadwalkanBukaUlang) dibiarkan
  // berjalan sesudah jedanya: aktivitas ini sudah membuat halaman aktif.
  if (!s.kasus && !tundaBuka && (s.tahap === 'diam' || s.tahap === 'siap') && halamanAktif(sekarang)) {
    void bukaOtomatis()
  } else if (dariDiam && s.kasus) {
    detak()
  }
}
function saatTerlihat() {
  if (terlihat()) catatAktivitas(true)
}
function saatMasukan() {
  catatAktivitas()
}
/** Masukan ORANG saja. 'scroll' sengaja tidak ada: ia juga dipancarkan saat
 *  tata letak memendek (data dibuang → kerangka), tanpa ada orang. Gulir oleh
 *  orang sudah terwakili wheel/touchstart/keydown. */
export const PERISTIWA_AKTIVITAS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

export type HasilBuka = { ok: true; kasus: Kasus } | { ok: false; batas: BatasAksesDTO }

export const useCashflowKasus = () => {
  const api = useCashflowAdmin()
  apiTerakhir = api

  const kasus = computed(() => keadaan.value.kasus)
  const anakAktif = computed(() => keadaan.value.anak.find(a => kasusBerlaku(a, detik.value)) ?? null)
  const sisa = computed(() => (kasus.value ? sisaDetik(kasus.value, detik.value) : 0))
  /** Awalan kunci simpanan: id kasus + lingkup ruangnya. null = tanpa kasus. */
  const kunciKasus = computed(() => (kasus.value ? `${kasus.value.id}:${kasus.value.ruang.join(',')}` : null))
  const punyaRanah = (r: string): boolean => !!kasus.value?.ranah.includes(r)

  /** Kasus aktif pelaku atas subjek ini, dari server. Ganti subjek = data subjek lama dibuang. */
  async function pulihkan(subjek: string): Promise<void> {
    if (keadaan.value.subjek !== subjek) {
      hentikanDetak()
      kosongkanData()
      if (tundaBuka) clearTimeout(tundaBuka)
      tundaBuka = null
      riwayatBuka = []
      pulihKosongPada = 0
      keadaan.value = { ...awal(), subjek, pulih: 'memuat', versi: keadaan.value.versi + 1 }
    } else {
      // Kunjungan BARU ke subjek yang sama (induk dipasang lagi: kembali dari
      // daftar, sesudah masuk ulang) = perbuatan orang, sama dengan "Coba
      // lagi". Tahap yang menahan pembukaan otomatis dilepas supaya kunjungan
      // ini mencoba lagi, bukan menampilkan galat/batas lama (temuan fe p3 #3):
      // 'izin' ditentukan ulang oleh kepala yang menyusul (aturLingkup), dan
      // penjaga putaran (riwayatBuka, tidak direset) tetap mencegah
      // pembukaan beruntun.
      const s = keadaan.value
      keadaan.value = TAHAP_TERTAHAN.includes(s.tahap)
        ? { ...s, pulih: 'memuat', tahap: 'diam', galat: null, batas: null }
        : { ...s, pulih: 'memuat' }
    }
    try {
      const d = await api.kasusAktif(subjek)
      if (keadaan.value.subjek !== subjek) return
      const k = d.kasus ? keKasus(d.kasus) : null
      const hidup = !!k && kasusBerlaku(k)
      pasang(hidup ? k : null, (d.investigasi ?? []).map(keKasus))
      // Jawaban ini baru saja dari server: pembukaan yang menyusul (aturLingkup)
      // tidak perlu bertanya lagi.
      pulihKosongPada = hidup ? 0 : Date.now()
      keadaan.value = { ...keadaan.value, pulih: 'siap' }
    } catch (e) {
      if (keadaan.value.subjek === subjek) keadaan.value = { ...keadaan.value, pulih: 'galat' }
      throw petakanGalat(e)
    }
  }

  /**
   * Lingkup subjek dari kepala, lalu buka/selaraskan kasus otomatis.
   * `ruang` null = kepala tanpa ruang[] = sesi tanpa cashflow:pii: kasus yang
   * mungkin dipulihkan pun dilepas dari memori (server akan menolak setiap
   * pembacaannya) dan halaman menyuruh masuk ulang ber-TOTP.
   * `subjek` = pemilik `ruang`. Bila subjek kasus sudah berganti (kepala A
   * tiba sesudah staf pindah ke B), tidak berbuat apa-apa: ruang A tidak
   * boleh menjadi lingkup kasus B (temuan fe p3 #1).
   */
  async function aturLingkup(subjek: string, ruang: readonly string[] | null): Promise<void> {
    if (keadaan.value.subjek !== subjek) return
    if (ruang === null) {
      pasang(null, [])
      keadaan.value = { ...keadaan.value, lingkup: null, tahap: 'izin', galat: null, batas: null }
      return
    }
    keadaan.value = { ...keadaan.value, lingkup: [...ruang] }
    await bukaOtomatis()
  }

  /** "Coba lagi" (satu klik) sesudah pembukaan gagal atau batas laju. */
  const cobaLagi = (): Promise<void> => bukaOtomatis(true)

  /**
   * Induk Pengguna 360 terpasang: aktivitas di halaman ini yang menentukan
   * "halaman aktif". Memulangkan pelepas (panggil di onBeforeUnmount).
   */
  function pasangHalaman(): () => void {
    halamanTerpasang++
    aktivitasTerakhir = Date.now()
    if (typeof window !== 'undefined' && halamanTerpasang === 1) {
      for (const p of PERISTIWA_AKTIVITAS) window.addEventListener(p, saatMasukan, { passive: true, capture: true })
      document.addEventListener('visibilitychange', saatTerlihat)
    }
    let lepas = false
    return () => {
      if (lepas) return
      lepas = true
      halamanTerpasang = Math.max(0, halamanTerpasang - 1)
      if (typeof window !== 'undefined' && halamanTerpasang === 0) {
        for (const p of PERISTIWA_AKTIVITAS) window.removeEventListener(p, saatMasukan, { capture: true })
        document.removeEventListener('visibilitychange', saatTerlihat)
        if (tundaBuka) clearTimeout(tundaBuka)
        tundaBuka = null
      }
    }
  }

  /** Buka kasus atas subjek aktif dengan isian yang diberikan (dipakai bukaOtomatis & uji). */
  async function buka(masukan: {
    skenario: string | null; preset: PresetKasus; ranah: readonly string[]; ruang: readonly string[]; alasan: string
  }): Promise<HasilBuka> {
    const subjek = keadaan.value.subjek
    if (!subjek) throw new GalatAdmin('argumen', 'Subjek belum dipilih.')
    const d = await api.kasusBuka(subjek, masukan.skenario, masukan.preset, masukan.ranah, masukan.ruang, masukan.alasan)
    if (adalahBatasAkses(d)) return { ok: false, batas: d }
    const k = keKasus(d)
    if (keadaan.value.subjek === subjek) pasang(k, [])
    return { ok: true, kasus: k }
  }

  const jalankan = jalankanDengan

  /** Tambah ranah/ruang ke kasus (satu klik; alasan diwarisi server). */
  async function tambah(ranah: readonly string[], ruang: readonly string[] = []): Promise<void> {
    const d = await jalankan(k => api.kasusTambah(k.id, ranah, ruang))
    pasang(keKasus(d), keadaan.value.anak)
  }

  /** Nilai tersimpan (reaktif) untuk kunci ini, atau undefined. */
  const data = <T>(kunci: string | null): T | undefined =>
    (kunci ? (simpanan.get(kunci) as T | undefined) : undefined)

  /** Muat sekali per kunci (panggilan yang sama sedang berjalan = ditunggu bersama). */
  function muatData<T>(kunci: string, kerja: (k: Kasus) => Promise<T>): Promise<T> {
    if (simpanan.has(kunci)) return Promise.resolve(simpanan.get(kunci) as T)
    const ada = berjalan.get(kunci)
    if (ada) return ada as Promise<T>
    const versi = keadaan.value.versi
    const janji = jalankan(kerja)
      .then((v) => {
        if (keadaan.value.versi === versi) simpanan.set(kunci, v)
        return v
      })
      .finally(() => { if (berjalan.get(kunci) === janji) berjalan.delete(kunci) })
    berjalan.set(kunci, janji)
    return janji
  }

  /** Buang satu kunci (muat ulang yang disengaja — satu baris audit lagi). */
  const buang = (kunci: string) => { simpanan.delete(kunci); berjalan.delete(kunci) }

  // ── T3: teks bebas lewat kasus anak OTOMATIS ─────────────────────────
  const kunciTeks = (jenis: JenisTeks, id: string | number) => `${jenis}:${id}`
  /** Potongan teks yang sudah dibuka, atau null (masih terkunci). */
  const teks = (jenis: JenisTeks, id: string | number): PotongTeks[] | null =>
    teksTerbuka.get(kunciTeks(jenis, id))?.potong ?? null

  /** Kasus anak yang hidup, atau yang baru dibuka otomatis (satu untuk semua pemanggil). */
  function anakOtomatis(): Promise<Kasus> {
    const hidup = anakAktif.value
    if (hidup) return Promise.resolve(hidup)
    if (anakBerjalan && anakUntuk === keadaan.value.kasus?.id) return anakBerjalan
    anakUntuk = keadaan.value.kasus?.id ?? null
    const janji: Promise<Kasus> = jalankan(k => api.kasusInvestigasi(k.id, PRESET_T3_OTOMATIS, alasanT3Otomatis(new Date())))
      .then((d) => {
        const anak = keKasus(d)
        if (keadaan.value.kasus?.id === anak.induk) {
          keadaan.value = { ...keadaan.value, anak: [anak, ...keadaan.value.anak.filter(a => a.id !== anak.id)] }
          mulaiDetak()
        }
        return anak
      })
      .finally(() => { if (anakBerjalan === janji) { anakBerjalan = null; anakUntuk = null } })
    anakBerjalan = janji
    return janji
  }

  async function bacaTeks(anak: Kasus, jenis: JenisTeks, ids: readonly string[]): Promise<void> {
    const versi = keadaan.value.versi
    const d = await api.teks(anak.id, jenis, ids)
    // Data sudah dibuang selagi menunggu (kasus habis, subjek berganti): teks tidak berhak tinggal.
    if (keadaan.value.versi !== versi) return
    const peta = keTeks(d)
    // Id yang dikirim tapi tanpa isi pun "sudah dibuka" (kosong): tidak diminta ulang.
    for (const id of ids) teksTerbuka.set(kunciTeks(jenis, id), { anak: anak.id, potong: peta.get(String(id)) ?? [] })
  }

  /**
   * "Tampilkan catatan" (satu klik): buka teks untuk id yang diminta — UI
   * hanya mengirim id baris yang diklik (≤ 100 dijaga server). Kasus anak
   * dibuka otomatis bila belum ada yang hidup. Anak yang ternyata sudah habis
   * di server (jam klien) diganti SEKALI dengan anak baru.
   */
  async function mintaTeks(jenis: JenisTeks, ids: readonly (string | number)[]): Promise<void> {
    const perlu = [...new Set(ids.map(String))].filter(id => !teksTerbuka.has(kunciTeks(jenis, id))).slice(0, BATAS_TEKS)
    if (!perlu.length) return
    const anak = await anakOtomatis()
    try {
      await bacaTeks(anak, jenis, perlu)
    } catch (e) {
      const g = petakanGalat(e)
      if (g.jenis !== 'kasus' || !keadaan.value.kasus) throw g
      keadaan.value = { ...keadaan.value, anak: keadaan.value.anak.filter(a => a.id !== anak.id) }
      await bacaTeks(await anakOtomatis(), jenis, perlu)
    }
  }

  return {
    keadaan: readonly(keadaan),
    kasus, anakAktif, sisa, detik: readonly(detik), kunciKasus, punyaRanah,
    pulihkan, aturLingkup, cobaLagi, pasangHalaman, buka, tambah, jalankan,
    data, muatData, buang,
    teks, mintaTeks,
  }
}
