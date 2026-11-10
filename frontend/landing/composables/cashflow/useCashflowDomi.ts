/**
 * Tab Domi AI di Pengguna 360: daftar percakapan, isi per halaman, dan foto.
 *
 * Semua pembacaan memakai SATU kasus anak gabungan {teks, foto} beralasan Domi
 * (useCashflowKasus.anakDomiOtomatis), dibuka satu klik, tanpa dialog. Isi
 * yang termuat hidup di modul ini (memori tab, console ssr:false) dan dibuang
 * lewat `saatDibuang` begitu data kasus dibuang atau anak Domi habis, sama
 * dengan teks T3.
 *
 * FOTO. Satu halaman pesan = satu panggilan admin-lampiran jenis ai per 12
 * pesan berfoto (satu baris audit buka_foto per panggilan). Tautan sementara
 * langsung diambil jadi blob (tanpa cache), blob dicabut saat isi dibuang.
 *
 * Anak yang sudah habis di server (jam klien) diganti SEKALI, sama dengan
 * mintaTeks dan lihatFoto. Jawaban yang tiba sesudah data dibuang tidak
 * disimpan (`versi`).
 */
import { ref, shallowRef } from 'vue'
import { petakanGalat } from './useCashflowAdmin'
import type { BerkasFoto } from './useCashflowKasus'
import {
  LIMIT_DAFTAR_DOMI, LIMIT_PESAN_DOMI, kePesanDaftar, keDaftarPercakapan, petaPesanBerfoto,
  type KursorPercakapan, type Percakapan, type PesanDomi, type HalamanPesan,
} from '~/adapters/cashflowDomi'
import type { Kasus } from '~/adapters/cashflowKasus'

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
let peta = new Map<string, FotoDomi>()
let versi = 0
let pendengarTerpasang = false

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
}

export const useCashflowDomi = () => {
  const api = useCashflowAdmin()
  const kasus = useCashflowKasus()
  // Sekali seumur modul: isi yang tersimpan di sini tetap dibuang walau tab
  // sudah ditinggal (mis. pindah ke tab lain selagi anak Domi habis).
  if (!pendengarTerpasang) {
    pendengarTerpasang = true
    kasus.saatDibuang(() => { if (sudahDibuka.value || panel.value) buangIsi(true) })
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
  }

  async function muatDaftarLagi(user: string): Promise<void> {
    if (!kursorBerikut.value) return
    const v = versi
    const kursor = kursorBerikut.value
    const d = await denganAnak(anak => api.aiPercakapanDaftar(anak.id, user, kursor, LIMIT_DAFTAR_DOMI))
    if (versi !== v) return
    const h = keDaftarPercakapan(d)
    daftar.value = [...daftar.value, ...h.baris]
    kursorBerikut.value = h.kursorBerikut
  }

  function terapkanHalaman(h: HalamanPesan, lanjutan: boolean) {
    const lama = panel.value
    panel.value = {
      percakapan: h.percakapan,
      pesan: lanjutan && lama ? [...h.pesan, ...lama.pesan] : h.pesan,
      kursorSebelum: h.kursorSebelum,
      adaLagi: h.adaLagi,
    }
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
    const d = await denganAnak(anak => api.aiPesanDaftar(anak.id, id, null, LIMIT_PESAN_DOMI))
    if (versi !== v) return
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
    pasangSubjek, buka, muatDaftarLagi, bukaPercakapan, muatLebihLama, bukaFoto, tutupPanel,
  }
}

