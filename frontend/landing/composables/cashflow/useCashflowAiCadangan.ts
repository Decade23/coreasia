/**
 * Halaman "Domi: penyedia cadangan": keadaan, setelan, dan kunci API.
 *
 * Semua panggilan server lewat useCashflowAdmin, galatnya lewat
 * useCashflowMuat (kalimat awam, sesi hilang pindah ke /masuk). Kontrak RPC
 * dan aturan isian: adapters/cashflowAiCadangan.ts.
 *
 * KUNCI API. Nilainya hanya hidup di `kunci`, sebuah ref milik satu halaman:
 * bukan useState, bukan storage, bukan URL, dan tidak pernah diisi dari
 * server (server hanya memulangkan sidik). Ia dikosongkan begitu server
 * menerimanya, begitu kunci dihapus, dan saat halaman ditinggal (`buang`).
 * Ia tidak ditulis ke toast, log, atau galat: galat server dibersihkan
 * darinya di lapisan RPC (galatTulisCadangan), dan galat kolom di sini hanya
 * berupa kode (GalatKunci).
 *
 * IZIN. Membaca butuh cashflow:view, menulis butuh cashflow:pii, sama dengan
 * Paket kredit. `bolehUbah` hanya petunjuk tampilan, penegaknya server.
 *
 * SIBUK. Satu tulisan pada satu waktu. Setiap tulisan memulangkan keadaan
 * terbaru yang langsung dipasang, tanpa membaca ulang.
 */
import { computed, ref, shallowRef } from 'vue'
import {
  alasanTakSimpan, isianDariKeadaan, keAiCadangan, kodeGalatCadangan, periksaKunci, rapikanKunci,
  type AiCadangan, type AlasanTakSimpan, type GalatKunci,
} from '~/adapters/cashflowAiCadangan'
import { petakanGalat, type GalatAdmin } from './useCashflowAdmin'

export type SibukCadangan = 'simpan' | 'kunci' | 'hapus'
export type KonfirmasiCadangan = 'ganti' | 'hapus'

export const useCashflowAiCadangan = () => {
  const { tcf } = useCashflowI18n()
  const api = useCashflowAdmin()
  const sesi = useCashflowSesi()
  const toast = useToast()
  const { memuat, galat, pesanGalat, pesanUntuk, keMasukBilaSesi, muat, batal } = useCashflowMuat({ awal: true })

  const keadaan = shallowRef<AiCadangan | null>(null)
  const isianAktif = ref(false)
  const isianModel = ref('')
  /** Kunci yang sedang diketik. Lihat KUNCI API di kepala berkas. */
  const kunci = ref('')
  const galatKunci = ref<GalatKunci | null>(null)
  const konfirmasi = ref<KonfirmasiCadangan | null>(null)
  const sibuk = ref<SibukCadangan | null>(null)
  const izinDitolak = ref(false)

  const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
  const bolehUbah = computed(() => sesi.boleh('cashflow:pii') && !izinDitolak.value)
  const alasanSimpan = computed<AlasanTakSimpan | null>(() =>
    (keadaan.value ? alasanTakSimpan(keadaan.value, { aktif: isianAktif.value, model: isianModel.value }) : 'tanpaPerubahan'))
  const bisaSimpan = computed(() => bolehUbah.value && !sibuk.value && !alasanSimpan.value)
  /** Sakelar tidak bisa dinyalakan selama kunci belum ada. Mematikan selalu boleh. */
  const butuhKunci = computed(() => !!keadaan.value && !keadaan.value.kunciAda)

  /** Pasang jawaban baca/simpan/kunci. Bentuk tak dikenal diabaikan (false). */
  const pasang = (dto: unknown): boolean => {
    const k = keAiCadangan(dto)
    if (!k) return false
    keadaan.value = k
    const isian = isianDariKeadaan(k)
    isianAktif.value = isian.aktif
    isianModel.value = isian.model
    return true
  }
  const muatAwal = () => muat(async (terbaru) => {
    const r = await api.aiCadanganBaca()
    if (terbaru()) pasang(r)
  })
  /** Hasil tulisan: pasang keadaannya, atau baca ulang bila bentuknya tak dikenal. */
  const pakaiHasil = async (dto: unknown) => { if (!pasang(dto)) await muatAwal() }

  const kosongkanKunci = () => {
    kunci.value = ''
    galatKunci.value = null
  }

  /** Tulisan gagal: galat kolom kunci, atau toast. Keadaan dibaca ulang bila server menolak isinya. */
  const tangani = async (g: GalatAdmin, opsi: { kolomKunci?: boolean } = {}) => {
    if (g.jenis === 'izin') izinDitolak.value = true
    if (keMasukBilaSesi(g)) return
    const kode = kodeGalatCadangan(g)
    if (opsi.kolomKunci && kode === 'kunci_tidak_sah') {
      galatKunci.value = 'server'
      return
    }
    toast.error(pesanUntuk(g))
    // Keadaan di layar sudah basi (model dicabut, kunci dihapus admin lain), atau fiturnya belum terpasang.
    if (kode || g.jenis === 'belum-aktif') await muatAwal()
  }

  const jalankan = async (jenis: SibukCadangan, kerja: () => Promise<void>, opsi: { kolomKunci?: boolean } = {}) => {
    if (sibuk.value) return
    sibuk.value = jenis
    try {
      await kerja()
    } catch (e) {
      await tangani(petakanGalat(e), opsi)
    } finally {
      sibuk.value = null
    }
  }

  // ── Setelan: nyala/mati dan model ────────────────────────────────────
  const setelAktif = (nilai: boolean) => {
    if (sibuk.value || !bolehUbah.value) return
    if (nilai && butuhKunci.value) return
    isianAktif.value = nilai
  }
  const simpan = () => {
    if (!bisaSimpan.value) return
    const aktif = isianAktif.value
    const model = isianModel.value
    return jalankan('simpan', async () => {
      await pakaiHasil(await api.aiCadanganSimpan(aktif, model))
      toast.success(tcf(aktif ? 'cadangan.hasil.nyala' : 'cadangan.hasil.mati'))
    })
  }

  // ── Kunci: simpan, ganti, hapus ──────────────────────────────────────
  const kirimKunci = (ganti: boolean) => jalankan('kunci', async () => {
    const hasil = await api.aiCadanganKunci(rapikanKunci(kunci.value))
    kosongkanKunci()
    konfirmasi.value = null
    await pakaiHasil(hasil)
    toast.success(tcf(ganti ? 'cadangan.hasil.kunciDiganti' : 'cadangan.hasil.kunciDisimpan'))
  }, { kolomKunci: true }).finally(() => { konfirmasi.value = null })

  /** Tombol Simpan kunci. Kunci yang sudah ada diganti hanya sesudah konfirmasi. */
  const mintaSimpanKunci = () => {
    if (sibuk.value || !bolehUbah.value || !keadaan.value) return
    galatKunci.value = periksaKunci(kunci.value)
    if (galatKunci.value) return
    if (keadaan.value.kunciAda) konfirmasi.value = 'ganti'
    else return kirimKunci(false)
  }
  const mintaHapusKunci = () => {
    if (sibuk.value || !bolehUbah.value || !keadaan.value?.kunciAda) return
    konfirmasi.value = 'hapus'
  }
  const hapusKunci = () => jalankan('hapus', async () => {
    const hasil = await api.aiCadanganKunci(null)
    kosongkanKunci()
    konfirmasi.value = null
    await pakaiHasil(hasil)
    toast.success(tcf('cadangan.hasil.kunciDihapus'))
  }).finally(() => { konfirmasi.value = null })

  const setuju = () => {
    if (konfirmasi.value === 'ganti') return kirimKunci(true)
    if (konfirmasi.value === 'hapus') return hapusKunci()
  }
  const tutupKonfirmasi = () => { if (!sibuk.value) konfirmasi.value = null }
  /** Mengetik lagi menghapus galat kolom yang lama. */
  const isiKunci = (nilai: string) => {
    kunci.value = nilai
    galatKunci.value = null
  }

  /** Halaman ditinggal: permintaan yang masih berjalan jadi basi, kunci yang diketik dibuang. */
  const buang = () => {
    batal()
    kosongkanKunci()
    konfirmasi.value = null
  }

  return {
    keadaan, memuat, galat, pesanGalat, belumAktif, bolehUbah, sibuk,
    isianAktif, isianModel, alasanSimpan, bisaSimpan, butuhKunci, setelAktif, simpan,
    kunci, galatKunci, isiKunci, mintaSimpanKunci, mintaHapusKunci,
    konfirmasi, setuju, tutupKonfirmasi,
    muatAwal, buang,
  }
}
