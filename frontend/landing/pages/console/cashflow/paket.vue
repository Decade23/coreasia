<script setup lang="ts">
/**
 * Paket kredit Domi: daftar, tambah, ubah, nonaktifkan, hapus, bawaan, urutan.
 *
 * Sumber kebenarannya satu tabel di database CashFlow. Aplikasi, halaman
 * kredit, dan fungsi pembelian membacanya langsung, jadi perubahan di sini
 * berlaku tanpa rilis. Harga yang ditagih tetap dihitung server saat
 * pembelian dibuat. Kontrak RPC dan aturan isian: adapters/cashflowPaket.ts.
 *
 * IZIN. Membaca butuh cashflow:view, menulis butuh cashflow:pii (login
 * console ber-TOTP), sama dengan setelan AI. Tanpa pii semua tombol tulis
 * mati dan CashflowIzinKurang menjelaskan jalan keluarnya. Penegaknya server
 * (penolakannya dipetakan ke 'izin' oleh galatTulisPaket).
 *
 * MENIMPA TANPA SADAR. admin_ai_paket_simpan menambah ATAU mengubah per kode
 * dengan menggabung kunci, tanpa nomor versi. Maka:
 * - paket baru: daftar dibaca ulang dulu, kode yang sudah ada ditolak di sini
 *   (kodeTerpakai), bukan diam-diam menggabung ke paket lama;
 * - ubah lewat form: daftar dibaca ulang dulu dan `diubah` dibandingkan
 *   dengan saat form dibuka; berbeda berarti ada yang menyimpan di tempat
 *   lain, form meminta muat ulang;
 * - aksi baris (aktif, bawaan, urutan) hanya mengirim kode + kolom yang
 *   berubah, jadi kolom lain tidak tertimpa.
 * Setiap tulisan memulangkan daftar terbaru dan jam server; tabel langsung
 * memakainya tanpa membaca ulang.
 *
 * JAM. Status promo dihitung dengan jam server (`kini` di setiap jawaban)
 * yang terus berjalan di halaman, bukan jam laptop.
 *
 * GALAT. 22023 paket_tidak_sah (hint = kolom) menempel di kolom form.
 * Hapus yang ditolak (paket_sudah_dibeli) mengganti isi dialog dengan
 * penjelasan dan tombol Nonaktifkan. RPC yang belum terpasang (console tayang
 * lebih dulu dari migrasinya) menulis "fitur belum aktif".
 *
 * SIBUK. Satu aksi pada satu waktu; setiap tulisan dicatat audit oleh server.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import {
  daftarPaket, geserUrutan, isianBaru, isianDariPaket, kiniServer, kolomDariGalat, muatanAktif, paketSudahDibeli,
  paketTidakAda, ringkasPaket,
  type DaftarPaketDTO, type GalatIsian, type IsianPaket, type MuatanPaket, type PaketKredit,
} from '~/adapters/cashflowPaket'
import { petakanGalat, type GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const toast = useToast()
const { memuat, galat, pesanGalat, pesanUntuk, keMasukBilaSesi, muat, aksi, batal } = useCashflowMuat({ awal: true })

const mentah = shallowRef<DaftarPaketDTO>(null)
const daftar = computed<PaketKredit[]>(() => daftarPaket(mentah.value))
/** Selisih jam server dan jam laptop (ms); `jam` = jam server yang berjalan. */
let selisih = 0
const jam = ref(Date.now())
const ringkas = computed(() => ringkasPaket(daftar.value, jam.value))

/** Pasang jawaban daftar/simpan/hapus. Jawaban yang bukan daftar diabaikan. */
const pasang = (dto: DaftarPaketDTO) => {
  if (!Array.isArray(dto) && !(dto && Array.isArray(dto.paket))) return false
  mentah.value = dto
  const k = kiniServer(dto)
  if (k !== null) selisih = k - Date.now()
  jam.value = Date.now() + selisih
  return true
}
const muatDaftar = () => muat(async (terbaru) => {
  const r = await api.aiPaketDaftar()
  if (terbaru()) pasang(r)
})
/** Baca ulang tanpa keadaan memuat halaman; dipakai sebelum menulis lewat form dan urutan. */
const segarkan = async (): Promise<PaketKredit[]> => {
  pasang(await api.aiPaketDaftar())
  return daftar.value
}
/** Hasil tulisan: pasang daftarnya, atau baca ulang bila bentuknya tak dikenal. */
const pakaiHasil = async (dto: DaftarPaketDTO) => { if (!pasang(dto)) await muatDaftar() }

let detak: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  void muatDaftar()
  detak = setInterval(() => { jam.value = Date.now() + selisih }, 30_000)
})
onBeforeUnmount(() => { batal(); if (detak) clearInterval(detak) })

/** Petunjuk tampilan; penegaknya server. */
const izinDitolak = ref(false)
const bolehUbah = computed(() => sesi.boleh('cashflow:pii') && !izinDitolak.value)
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const catatIzin = (g: GalatAdmin) => { if (g.jenis === 'izin') izinDitolak.value = true }

type JenisSibuk = 'simpan' | 'aktif' | 'bawaan' | 'urutan' | 'hapus'
const sibuk = ref<{ kode: string; jenis: JenisSibuk } | null>(null)
const jalankan = async (kode: string, jenis: JenisSibuk, kerja: () => Promise<void>) => {
  if (sibuk.value) return
  sibuk.value = { kode, jenis }
  try { await kerja() } finally { sibuk.value = null }
}

// ── Form tambah/ubah ────────────────────────────────────────────────────
const form = reactive({
  buka: false, mode: 'baru' as 'baru' | 'ubah', asal: null as PaketKredit | null,
  isian: isianBaru([]) as IsianPaket, versi: null as string | null, kunci: 0,
})
const galatServer = ref<GalatIsian>({})
const basi = ref(false)
const kodeLain = computed(() => daftar.value.map(p => p.kode))

const bukaBaru = () => {
  if (sibuk.value || !bolehUbah.value) return
  Object.assign(form, { buka: true, mode: 'baru', asal: null, isian: isianBaru(daftar.value), versi: null, kunci: form.kunci + 1 })
  galatServer.value = {}
  basi.value = false
}
const bukaUbah = (p: PaketKredit) => {
  Object.assign(form, { buka: true, mode: 'ubah', asal: p, isian: isianDariPaket(p), versi: p.diubah, kunci: form.kunci + 1 })
  galatServer.value = {}
  basi.value = false
}
const tutupForm = () => { if (!sibuk.value) form.buka = false }

const muatVersi = () => jalankan(form.asal?.kode ?? '', 'simpan', async () => {
  const kode = form.asal?.kode
  await aksi(async () => {
    const p = (await segarkan()).find(x => x.kode === kode)
    if (!p) { toast.error(tcf('paket.galat.hilang')); form.buka = false; return }
    bukaUbah(p)
  })
})

const simpanForm = (muatan: MuatanPaket) => jalankan(muatan.kode, 'simpan', async () => {
  galatServer.value = {}
  const mode = form.mode
  let hasil: DaftarPaketDTO | undefined
  const ok = await aksi(async () => {
    const ada = (await segarkan()).find(p => p.kode === muatan.kode)
    if (mode === 'baru' && ada) { galatServer.value = { kode: 'kodeTerpakai' }; return }
    if (mode === 'ubah' && !ada) { toast.error(tcf('paket.galat.hilang')); form.buka = false; return }
    if (mode === 'ubah' && ada && ada.diubah !== form.versi) { basi.value = true; return }
    hasil = await api.aiPaketSimpan(muatan)
  }, {
    gagal: (g) => {
      catatIzin(g)
      const k = kolomDariGalat(g)
      if (k) galatServer.value = { [k]: 'server' }
    },
  })
  if (!ok || hasil === undefined) return
  toast.success(tcf(mode === 'baru' ? 'paket.hasil.dibuat' : 'paket.hasil.disimpan')(muatan.kode))
  form.buka = false
  await pakaiHasil(hasil)
})

// ── Aksi baris: hanya kode + kolom yang berubah ─────────────────────────
const tulisBaris = async (kerja: () => Promise<DaftarPaketDTO | undefined>, sukses: string): Promise<boolean> => {
  let hasil: DaftarPaketDTO | undefined
  const ok = await aksi(async () => { hasil = await kerja() }, {
    gagal: (g) => { catatIzin(g); if (paketTidakAda(g)) void muatDaftar() },
  })
  if (!ok || hasil === undefined) return false
  toast.success(sukses)
  await pakaiHasil(hasil)
  return true
}

const aktifkan = (p: PaketKredit) => jalankan(p.kode, 'aktif', async () => {
  await tulisBaris(() => api.aiPaketSimpan(muatanAktif(p, true)), tcf('paket.hasil.aktif')(p.kode))
})
const jadikanBawaan = (p: PaketKredit) => jalankan(p.kode, 'bawaan', async () => {
  await tulisBaris(() => api.aiPaketSimpan({ kode: p.kode, bawaan: true }), tcf('paket.hasil.bawaan')(p.kode))
})
/* Urutan dihitung dari daftar SEGAR: admin lain bisa baru saja menggeser. */
const geser = (p: PaketKredit, arah: -1 | 1) => jalankan(p.kode, 'urutan', async () => {
  await tulisBaris(async () => {
    let akhir: DaftarPaketDTO | undefined
    for (const u of geserUrutan(await segarkan(), p.kode, arah)) akhir = await api.aiPaketSimpan({ kode: u.kode, urutan: u.urutan })
    return akhir // tidak ada yang bergeser (ujung daftar): tanpa toast
  }, tcf('paket.hasil.urutan'))
})

// ── Konfirmasi: nonaktifkan, hapus ──────────────────────────────────────
const konfirmasi = ref<{ jenis: 'hapus' | 'nonaktif'; paket: PaketKredit; ditolak: boolean } | null>(null)
const mintaNonaktif = (p: PaketKredit) => { if (!sibuk.value) konfirmasi.value = { jenis: 'nonaktif', paket: p, ditolak: false } }
const mintaHapus = (p: PaketKredit) => { if (!sibuk.value) konfirmasi.value = { jenis: 'hapus', paket: p, ditolak: false } }
const tutupKonfirmasi = () => { if (!sibuk.value) konfirmasi.value = null }

const nonaktifkan = () => {
  const k = konfirmasi.value
  if (!k) return
  return jalankan(k.paket.kode, 'aktif', async () => {
    await tulisBaris(() => api.aiPaketSimpan(muatanAktif(k.paket, false)), tcf('paket.hasil.nonaktif')(k.paket.kode))
    konfirmasi.value = null
  })
}

/* Hapus tidak memakai aksi(): penolakan paket_sudah_dibeli dijawab di dalam
   dialog (bukan toast), galat lain tetap toast lewat pesanUntuk. */
const hapus = () => {
  const k = konfirmasi.value
  if (!k || k.jenis !== 'hapus') return
  return jalankan(k.paket.kode, 'hapus', async () => {
    try {
      const hasil = await api.aiPaketHapus(k.paket.kode)
      toast.success(tcf('paket.hasil.dihapus')(k.paket.kode))
      konfirmasi.value = null
      await pakaiHasil(hasil)
    } catch (e) {
      const g = petakanGalat(e)
      if (paketSudahDibeli(g)) {
        konfirmasi.value = { ...k, ditolak: true }
        return
      }
      catatIzin(g)
      konfirmasi.value = null
      if (!keMasukBilaSesi(g)) toast.error(pesanUntuk(g))
      await muatDaftar()
    }
  })
}
const setuju = () => (konfirmasi.value?.jenis === 'nonaktif' ? nonaktifkan() : hapus())

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.paket') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('paket.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
      <template #actions>
        <button type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bolehUbah || !!sibuk || belumAktif || !!pesanGalat" @click="bukaBaru">
          <Icon name="lucide:plus" class="h-4 w-4" aria-hidden="true" />{{ tcf('paket.tambah') }}
        </button>
      </template>
    </ConsolePageHeader>
    <p class="max-w-3xl text-sm text-[var(--ca-muted)]">{{ tcf('paket.ket') }}</p>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('paket.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !daftar.length" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <CashflowIzinKurang v-if="!bolehUbah" :pesan="tcf('paket.izinUbah')" />
      <p class="text-xs text-[var(--ca-muted)]">{{ tcf('paket.ringkas')(ringkas.total, ringkas.aktif, ringkas.promo) }}</p>
      <CashflowKeadaanKosong v-if="!daftar.length" :pesan="tcf('paket.kosong')" icon="lucide:tags" />
      <CashflowPaketTabel
        v-else :daftar="daftar" :kini="jam" :boleh-ubah="bolehUbah" :sibuk="sibuk?.kode ?? null" :terkunci="!!sibuk"
        @ubah="bukaUbah" @aktifkan="aktifkan" @nonaktifkan="mintaNonaktif" @bawaan="jadikanBawaan"
        @naik="geser($event, -1)" @turun="geser($event, 1)" @hapus="mintaHapus"
      />
    </template>

    <CashflowPaketForm
      v-if="form.buka" :key="form.kunci" :show="form.buka" :mode="form.mode" :isian-awal="form.isian" :asal="form.asal"
      :kode-lain="kodeLain" :galat-server="galatServer" :sibuk="sibuk?.jenis === 'simpan'" :basi="basi" :kini="jam"
      @simpan="simpanForm" @tutup="tutupForm" @muat-versi="muatVersi"
    />
    <CashflowPaketKonfirmasi
      :jenis="konfirmasi?.jenis ?? null" :paket="konfirmasi?.paket ?? null" :ditolak="!!konfirmasi?.ditolak"
      :sibuk="!!konfirmasi && (sibuk?.jenis === 'hapus' || sibuk?.jenis === 'aktif')"
      @tutup="tutupKonfirmasi" @setuju="setuju" @nonaktifkan="nonaktifkan"
    />
  </div>
</template>
