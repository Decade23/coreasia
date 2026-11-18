/**
 * Tab Domi AI di Pengguna 360: daftar percakapan, isi per halaman, dan foto.
 *
 * Semua pembacaan memakai SATU kasus anak gabungan {teks, foto} beralasan Domi
 * (useCashflowKasus.anakDomiOtomatis), dibuka satu klik, tanpa dialog. Isi
 * yang termuat hidup di modul ini (memori tab, console ssr:false) dan dibuang
 * saat tab ditinggal, atau lewat `saatDibuang` begitu data kasus dibuang atau
 * anak Domi habis.
 *
 * FOTO. Satu halaman pesan = satu panggilan admin-lampiran jenis ai per 12
 * pesan berfoto (satu baris audit buka_foto per panggilan). Tautan sementara
 * langsung diambil jadi blob (tanpa cache), blob dicabut saat isi dibuang.
 *
 * Anak yang sudah habis di server (jam klien) diganti SEKALI, sama dengan
 * mintaTeks dan lihatFoto. Jawaban yang tiba sesudah data dibuang tidak
 * disimpan (`versi`).
 *
 * SEGARKAN. Setiap panggilan daftar dan pesan menulis satu audit baca_teks,
 * jadi pembaruan dibatasi:
 * - tombol Segarkan: halaman pertama daftar + halaman terbaru percakapan
 *   yang sedang dibuka (dua audit), digabung dengan yang sudah termuat;
 * - jendela kembali dilihat (fokus atau tab terlihat): HANYA halaman pertama
 *   daftar, paling sering sekali per JEDA_SEGAR_OTOMATIS_MS sejak daftar
 *   terakhir dimuat. Isi percakapan tidak pernah dimuat ulang sendiri. Kalau
 *   daftar menyebut percakapan yang dibuka sudah bertambah (`pesanBaru`),
 *   panel menawarkan memuatnya lewat klik.
 * Menyegarkan tidak pernah membuka kasus anak baru. Anak yang habis (jam
 * klien atau jawaban server) membuang isi dan tab menampilkan ajakan
 * membuka lagi, sama dengan saat jendela 10 menitnya lewat.
 */
import { computed, ref, shallowRef } from 'vue'
import { petakanGalat } from './useCashflowAdmin'
import type { BerkasFoto } from './useCashflowKasus'
import {
  LIMIT_DAFTAR_DOMI, LIMIT_PESAN_DOMI, kePesanDaftar, keDaftarPercakapan, petaPesanBerfoto,
  adaPesanBaru, gabungDaftarSegar, gabungPesanSegar,
  type KursorPercakapan, type Percakapan, type PesanDomi, type HalamanPesan,
} from '~/adapters/cashflowDomi'
import type { Kasus } from '~/adapters/cashflowKasus'

/** Jeda terpendek antara dua pemuatan daftar yang dipicu jendela kembali dilihat. */
export const JEDA_SEGAR_OTOMATIS_MS = 30_000

export interface FotoDomi { src: string | null; keadaan: 'memuat' | 'siap' | 'belum' | 'gagal' }

/** Satu percakapan yang sedang dibuka di panel. */
export interface PanelDomi {
  percakapan: Percakapan; pesan: PesanDomi[]; kursorSebelum: number | null; adaLagi: boolean
}

const subjekIni = ref<string | null>(null)
const sudahDibuka = ref(false)
const daftar = ref<Percakapan[]>([])
const kursorBerikut = ref<KursorPercakapan | null>(null)
const totalDaftar = ref<number | null>(null)
const panel = shallowRef<PanelDomi | null>(null)
const dibuang = ref(false)
const foto = shallowRef<ReadonlyMap<string, FotoDomi>>(new Map())
/** Jam dinding saat daftar terakhir dimuat (untuk label), dan jam monoton untuk jeda segar otomatis. */
const terakhirMuat = ref<number | null>(null)
let terakhirMuatMono = Number.NEGATIVE_INFINITY
const menyegarkan = ref(false)
/** Segar otomatis terakhir gagal (bukan karena kasus): tanda kecil, bukan toast. */
const galatSegar = ref(false)
let peta = new Map<string, FotoDomi>()
let versi = 0
let pendengarTerpasang = false
/** Urutan klik percakapan: jawaban klik lama tidak boleh menimpa klik terakhir. */
let bukaKe = 0
let muatDaftarBerjalan = false

function terbitkanFoto() { foto.value = new Map(peta) }

function cabutSemuaFoto() {
  for (const f of peta.values()) if (f.src) URL.revokeObjectURL(f.src)
  peta = new Map()
  foto.value = new Map()
}

/** Buang semua isi percakapan (dipanggil pendengar kasus, dan saat subjek berganti). */
function buangIsi(tandaHabis: boolean) {
  versi++
  cabutSemuaFoto()
  daftar.value = []
  kursorBerikut.value = null
  totalDaftar.value = null
  panel.value = null
  sudahDibuka.value = false
  dibuang.value = tandaHabis
  terakhirMuat.value = null
  terakhirMuatMono = Number.NEGATIVE_INFINITY
  galatSegar.value = false
}

function tandaiMuat() {
  terakhirMuat.value = Date.now()
  terakhirMuatMono = performance.now()
}

/** Kepala percakapan dari halaman pesan menyegarkan barisnya di daftar. */
function perbaruiBaris(p: Percakapan) {
  if (!p.id || !daftar.value.some(x => x.id === p.id)) return
  daftar.value = daftar.value.map(x => (x.id === p.id
    ? { ...x, judul: p.judul || x.judul, jumlahPesan: p.jumlahPesan, diperbaruiIso: p.diperbaruiIso || x.diperbaruiIso }
    : x))
}

const pesanBaru = computed(() => {
  const p = panel.value
  return p ? adaPesanBaru(daftar.value.find(x => x.id === p.percakapan.id), p.percakapan) : false
})

export const useCashflowDomi = () => {
  const api = useCashflowAdmin()
  const kasus = useCashflowKasus()
  // Sekali seumur modul: isi yang tersimpan di sini tetap dibuang walau tab
  // sudah ditinggal (mis. pindah ke tab lain selagi anak Domi habis).
  if (!pendengarTerpasang) {
    pendengarTerpasang = true
    // Tanpa isi pun versi naik, supaya pembukaan yang masih di jalan tidak disimpan.
    kasus.saatDibuang(() => { if (sudahDibuka.value || panel.value) buangIsi(true); else versi++ })
  }

  /** Ganti subjek = isi subjek lama dibuang, tanpa jejak. */
  function pasangSubjek(id: string) {
    if (subjekIni.value !== id) {
      subjekIni.value = id
      buangIsi(false)
    }
  }

  /** Kasus anak Domi (dibuka otomatis); anak yang habis di server diganti SEKALI. */
  async function denganAnak<T>(kerja: (anak: Kasus) => Promise<T>): Promise<T> {
    let anak = await kasus.anakDomiOtomatis()
    try {
      return await kerja(anak)
    } catch (e) {
      const g = petakanGalat(e)
      if (g.jenis !== 'kasus' || !kasus.kasus.value) throw g
      kasus.lepasAnak(anak.id)
      anak = await kasus.anakDomiOtomatis()
      return await kerja(anak)
    }
  }

  /** Satu klik "Buka percakapan": anak + halaman pertama daftar. */
  async function buka(user: string): Promise<void> {
    if (subjekIni.value !== user) return
    const v = versi
    const d = await denganAnak(anak => api.aiPercakapanDaftar(anak.id, user, null, LIMIT_DAFTAR_DOMI))
    if (versi !== v || subjekIni.value !== user) return
    const h = keDaftarPercakapan(d)
    daftar.value = h.baris
    kursorBerikut.value = h.kursorBerikut
    totalDaftar.value = h.total
    sudahDibuka.value = true
    dibuang.value = false
    tandaiMuat()
  }

  async function muatDaftarLagi(user: string): Promise<void> {
    if (!kursorBerikut.value || muatDaftarBerjalan) return
    muatDaftarBerjalan = true
    try {
      const v = versi
      const kursor = kursorBerikut.value
      const d = await denganAnak(anak => api.aiPercakapanDaftar(anak.id, user, kursor, LIMIT_DAFTAR_DOMI))
      if (versi !== v) return
      const h = keDaftarPercakapan(d)
      // Sesudah Segarkan, halaman berikutnya bisa memuat baris yang sudah ada.
      const ada = new Set(daftar.value.map(x => x.id))
      daftar.value = [...daftar.value, ...h.baris.filter(x => !ada.has(x.id))]
      kursorBerikut.value = h.kursorBerikut
    } finally {
      muatDaftarBerjalan = false
    }
  }

  function terapkanHalaman(h: HalamanPesan, lanjutan: boolean) {
    const lama = panel.value
    panel.value = {
      percakapan: h.percakapan,
      pesan: lanjutan && lama ? [...h.pesan, ...lama.pesan] : h.pesan,
      kursorSebelum: h.kursorSebelum,
      adaLagi: h.adaLagi,
    }
    perbaruiBaris(h.percakapan)
  }

  /** Tautan + blob foto satu halaman pesan. Gagal foto tidak menggagalkan isi. */
  async function muatFoto(percakapan: string, pesan: readonly PesanDomi[], v: number) {
    const paket = petaPesanBerfoto(pesan)
    if (!paket.length) return
    const jalurHalaman = pesan.flatMap(p => p.jalur)
    for (const j of jalurHalaman) if (!peta.has(j)) peta.set(j, { src: null, keadaan: 'memuat' })
    terbitkanFoto()
    for (const ids of paket) {
      let d: Awaited<ReturnType<typeof api.aiGambar>> | null = null
      try {
        d = await denganAnak(anak => api.aiGambar(anak.id, percakapan, ids))
      } catch (e) {
        const g = petakanGalat(e)
        if (versi !== v) return
        // tanpa-lampiran: pesan ini memang tanpa berkas; selain itu tandai gagal.
        const keadaan = g.hint === 'tanpa-lampiran' ? 'belum' : 'gagal'
        for (const p of pesan.filter(x => ids.includes(x.id))) {
          for (const j of p.jalur) if (peta.get(j)?.keadaan === 'memuat') peta.set(j, { src: null, keadaan })
        }
        terbitkanFoto()
        continue
      }
      if (versi !== v) return
      await Promise.all((d.berkas ?? []).map(async (b) => {
        if (peta.get(b.jalur)?.keadaan === 'siap') return
        if (!b.url) { peta.set(b.jalur, { src: null, keadaan: 'belum' }); return }
        try {
          const blob = await api.ambilBerkas(b.url)
          if (versi !== v) return
          const lama = peta.get(b.jalur)
          if (lama?.src) URL.revokeObjectURL(lama.src)
          peta.set(b.jalur, { src: URL.createObjectURL(blob), keadaan: 'siap' })
        } catch {
          peta.set(b.jalur, { src: null, keadaan: 'gagal' })
        }
      }))
      if (versi !== v) return
      // Foto yang disebut pesan tapi tidak dipulangkan (jalur asing) tidak ditunggu lagi.
      for (const p of pesan.filter(x => ids.includes(x.id))) {
        for (const j of p.jalur) if (peta.get(j)?.keadaan === 'memuat') peta.set(j, { src: null, keadaan: 'belum' })
      }
      terbitkanFoto()
    }
  }

  async function bukaPercakapan(id: string): Promise<void> {
    const v = versi
    const g = ++bukaKe
    const d = await denganAnak(anak => api.aiPesanDaftar(anak.id, id, null, LIMIT_PESAN_DOMI))
    if (versi !== v || g !== bukaKe) return
    const h = kePesanDaftar(d)
    terapkanHalaman(h, false)
    void muatFoto(id, h.pesan, v)
  }

  async function muatLebihLama(): Promise<void> {
    const p = panel.value
    if (!p || !p.adaLagi || p.kursorSebelum === null) return
    const v = versi
    const id = p.percakapan.id
    const d = await denganAnak(anak => api.aiPesanDaftar(anak.id, id, p.kursorSebelum, LIMIT_PESAN_DOMI))
    if (versi !== v || panel.value?.percakapan.id !== id) return
    const h = kePesanDaftar(d)
    terapkanHalaman(h, true)
    void muatFoto(id, h.pesan, v)
  }

  /** Anak Domi ditolak server selagi menyegarkan: isi dibuang, tab menampilkan ajakan membuka lagi. */
  function habiskan(anakId: string) {
    if (kasus.foto.value?.anak === anakId) kasus.tutupFoto()
    kasus.lepasAnak(anakId)
    buangIsi(true)
  }

  /** Halaman terbaru percakapan yang sedang dibuka, digabung dengan pesan lama yang sudah termuat. */
  async function segarkanIsi(anak: Kasus, id: string, v: number): Promise<void> {
    // Tidak menaikkan bukaKe: klik percakapan lain sesudah ini tetap menang.
    const g = bukaKe
    const d = await api.aiPesanDaftar(anak.id, id, null, LIMIT_PESAN_DOMI)
    const lama = panel.value
    if (versi !== v || g !== bukaKe || lama?.percakapan.id !== id) return
    const h = kePesanDaftar(d)
    const sudah = new Set(lama.pesan.map(p => p.id))
    panel.value = { percakapan: h.percakapan, ...gabungPesanSegar(lama, h) }
    perbaruiBaris(h.percakapan)
    void muatFoto(id, h.pesan.filter(p => !sudah.has(p.id)), v)
  }

  /**
   * Muat ulang tanpa membuka kasus anak baru. `otomatis` (jendela kembali
   * dilihat): hanya daftar, galat selain kasus jadi tanda kecil. `hanyaIsi`
   * (tawaran pesan baru): hanya isi percakapan yang dibuka. Bawaan (tombol
   * Segarkan): daftar lalu isi percakapan yang dibuka.
   */
  async function segarkan(user: string, { otomatis = false, hanyaIsi = false } = {}): Promise<'segar' | 'habis' | 'lewat'> {
    if (!sudahDibuka.value || subjekIni.value !== user || menyegarkan.value) return 'lewat'
    const anak = kasus.anakDomi()
    if (!anak) { buangIsi(true); return 'habis' }
    const v = versi
    menyegarkan.value = true
    try {
      if (!hanyaIsi) {
        const d = await api.aiPercakapanDaftar(anak.id, user, null, LIMIT_DAFTAR_DOMI)
        if (versi !== v || subjekIni.value !== user) return 'lewat'
        const h = keDaftarPercakapan(d)
        const gabung = gabungDaftarSegar({ baris: daftar.value, kursorBerikut: kursorBerikut.value }, h)
        daftar.value = gabung.baris
        kursorBerikut.value = gabung.kursorBerikut
        if (h.total !== null) totalDaftar.value = h.total
        tandaiMuat()
        galatSegar.value = false
      }
      const p = panel.value
      if (!otomatis && p) await segarkanIsi(anak, p.percakapan.id, v)
      return 'segar'
    } catch (e) {
      const g = petakanGalat(e)
      if (versi !== v) return 'lewat'
      if (g.jenis === 'kasus') { habiskan(anak.id); return 'habis' }
      if (otomatis) { galatSegar.value = true; return 'lewat' }
      throw g
    } finally {
      menyegarkan.value = false
    }
  }

  /** Jendela kembali dilihat: sudah waktunya memuat daftar lagi? */
  const segarOtomatisJatuhTempo = (): boolean =>
    sudahDibuka.value && !menyegarkan.value && performance.now() - terakhirMuatMono >= JEDA_SEGAR_OTOMATIS_MS

  /** Klik foto: buka penampil dengan seluruh foto `jalur` yang dibawa pesan itu, mulai dari yang diklik. */
  function bukaFoto(jalur: readonly string[], kliknya: string): void {
    const berkas: BerkasFoto[] = jalur.flatMap((j) => {
      const f = foto.value.get(j)
      if (!f) return []
      return [{ jenis: null, src: f.src, keadaan: f.keadaan === 'siap' ? 'siap' : f.keadaan === 'gagal' ? 'gagal' : 'belum' } as BerkasFoto]
    })
    if (!berkas.length) return
    kasus.tampilkanFoto(berkas, Math.max(0, jalur.indexOf(kliknya)))
  }

  const tutupPanel = () => { panel.value = null }

  return {
    subjek: subjekIni, sudahDibuka, daftar, kursorBerikut, totalDaftar, panel, foto, dibuang,
    terakhirMuat, menyegarkan, galatSegar, pesanBaru,
    pasangSubjek, buka, muatDaftarLagi, bukaPercakapan, muatLebihLama, bukaFoto, tutupPanel,
    segarkan, segarOtomatisJatuhTempo,
    /** Dipanggil saat tab ditinggal: membuka lagi berarti baca baru dan audit baru. */
    buangSekarang: () => buangIsi(false),
  }
}

