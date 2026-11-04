<script setup lang="ts">
/** Daftar tersamar. Pencarian, saringan, urutan dan halaman dikerjakan
 * server atas seluruh akun. Kontak lengkap tetap satu klik dan setiap
 * halaman yang dibuka tercatat dalam audit. Teks pencarian tidak di URL. */
import {
  kePengguna, tanpaKontakUtuh, versiTertinggal,
  type InfoPlatform, type Pengguna, type PenggunaDTO, type StatusPengguna,
} from '~/adapters/cashflow'
import { halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import type { AlasanDaftar } from '~/composables/cashflow/useCashflowAlasanDaftar'
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf, bahasa, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const route = useRoute()
const indeks = useCashflowIndeks()
const alasanDaftar = useCashflowAlasanDaftar()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })
const sesi = useCashflowSesi()

const PER = 25
const SEGMEN = ['semua', 'catat7', 'belum', 'ditangguhkan'] as const
const URUT = ['email', 'wa', 'versi', 'daftar', 'aktif', 'ruang', 'tx'] as const
const SKEMA = {
  seg: { jenis: 'pilihan', opsi: SEGMEN, bawaan: 'semua' },
  urut: { jenis: 'pilihan', opsi: URUT, bawaan: 'daftar' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

/* DTO disimpan mentah dan dipetakan ulang saat bahasa berganti: tanggal
   tampilan ('3 Agu 2026' / '3 Aug 2026') dibentuk adapter. */
const mentah = shallowRef<PenggunaDTO[]>([])
const semua = computed<Pengguna[]>(() => mentah.value.map(d => kePengguna(d, bahasa.value)))
const total = ref(0)
const halamanHasil = ref(q.value.hal)
const cari = useState('cf_cari_pengguna', () => '')
const kolomCari = ref<HTMLInputElement | null>(null)
const filterKolom = useState<Record<string, string>>('cf_saring_kolom_pengguna', () => ({}))
const cariDiterapkan = useState('cf_cari_diterapkan_pengguna', () => cari.value)
const filterDiterapkan = shallowRef<Record<string, string>>({ ...filterKolom.value })
const versiTerbaru = shallowRef<Map<string, string>>(new Map())
const hapusTersedia = ref(true)
const paletBuka = ref(false)
/** Alasan audit untuk sakelar — tetap, karena pembukaan ini satu ketukan. */
const ALASAN_SAKELAR = 'Sakelar Kontak lengkap (email dan WhatsApp) di daftar pengguna console'
const terbuka = ref<AlasanDaftar | null>(null)

/* Jawaban basi tidak boleh menimpa halaman atau membuka kontak kembali. */
const muatDaftar = (alasan: AlasanDaftar | null) => muat(async (terbaru) => {
  // Baris yang sudah tampil bertahan sampai jawaban terbaru siap. Spinner
  // tidak boleh meruntuhkan tabel, paginasi, fokus, atau posisi gulir.
  const filter: Record<string, string> = {}
  for (const [k, v] of Object.entries(filterDiterapkan.value)) {
    if (!v || !['email', 'wa', 'versi', 'daftar', 'aktif', 'status'].includes(k)) continue
    if (k === 'status') {
      const nilai = (['aktif', 'ditangguhkan', 'menunggu_hapus'] as const).find(x => x === v || labelStatus(x) === v)
      if (nilai) filter[k] = nilai
    } else filter[k] = v
  }
  const hasil = await api.daftarPenggunaHalaman({
    limit: PER, offset: (q.value.hal - 1) * PER, cari: cariDiterapkan.value.trim(),
    segmen: q.value.seg, urut: q.value.urut, arah: q.value.arah, filter,
    bahasa: bahasa.value, alasan: alasan?.alasan ?? null,
  })
  if (!terbaru()) return
  const aman = halamanAman(q.value.hal, Number(hasil.total), PER)
  if (aman !== q.value.hal) { await setel({ hal: aman }); return }
  // Alasan yang habis selagi menunggu tidak boleh membuka kontak kembali.
  if (alasan && alasan.sampai <= Date.now()) alasan = null
  mentah.value = alasan ? hasil.baris : tanpaKontakUtuh(hasil.baris)
  total.value = Number(hasil.total)
  halamanHasil.value = q.value.hal
  versiTerbaru.value = new Map(Object.entries(hasil.versi_terbaru ?? {}))
  hapusTersedia.value = hasil.hapus_tersedia
  // Pencarian palet tidak boleh menganggap hasil tersaring daftar lengkap.
  const lengkap = q.value.seg === 'semua' && !cariDiterapkan.value.trim() && !Object.keys(filter).length && q.value.hal === 1
  indeks.isi(semua.value, lengkap ? total.value : Number.MAX_SAFE_INTEGER)
  terbuka.value = alasan
})
// Mempertahankan hasil saat jaringan lambat tidak berlaku bila hak baca hilang.
watch(galat, (g) => {
  if (!g || !['izin', 'sesi', 'totp', 'bukan-admin'].includes(g.jenis)) return
  mentah.value = []
  total.value = 0
  terbuka.value = null
  alasanDaftar.lupakan()
  indeks.kosongkan()
})
let aktif = false
let dilepas = false
onMounted(async () => {
  // URL lama dari sesi ber-pii tidak boleh meminta hitungan saat izin turun.
  if (!sesi.boleh('cashflow:pii')) {
    alasanDaftar.lupakan()
    if (['catat7', 'belum'].includes(q.value.seg) || ['ruang', 'tx'].includes(q.value.urut)) {
      await setel({ seg: 'semua', urut: 'daftar', arah: 'desc', hal: 1 })
    }
  }
  if (dilepas) return
  aktif = true
  void muatDaftar(alasanDaftar.ambil())
})

const buka = async () => {
  if (!(await muatDaftar(alasanDaftar.ingat(ALASAN_SAKELAR)))) alasanDaftar.lupakan()
}
const samarkan = () => {
  batal()
  alasanDaftar.lupakan()
  terbuka.value = null
  mentah.value = tanpaKontakUtuh(mentah.value)
  // Penyaringan/urutan atas kontak utuh perlu dihitung ulang dalam bentuk samar.
  if (cariDiterapkan.value || Object.keys(filterDiterapkan.value).length || ['email', 'wa'].includes(q.value.urut)) void muatDaftar(null)
}
let pengatur: ReturnType<typeof setTimeout> | undefined
let jedaFilter: ReturnType<typeof setTimeout> | undefined
let jedaMuat: ReturnType<typeof setTimeout> | undefined
watch(terbuka, (t) => {
  clearTimeout(pengatur)
  if (t) pengatur = setTimeout(samarkan, Math.max(0, t.sampai - Date.now()))
})
onBeforeUnmount(() => { dilepas = true; aktif = false; batal(); clearTimeout(pengatur); clearTimeout(jedaFilter); clearTimeout(jedaMuat) })

// Saringan kolom menunggu selesai mengetik; teks sensitif tetap hanya di memori.
watch(filterKolom, (f) => {
  clearTimeout(jedaFilter)
  jedaFilter = setTimeout(() => {
    filterDiterapkan.value = { ...f }
    if (q.value.hal !== 1) void setel({ hal: 1 })
  }, 600)
}, { deep: true })
const jalankanCari = async () => {
  if (q.value.hal !== 1) await setel({ hal: 1 })
  cariDiterapkan.value = cari.value
}
// Satu permintaan untuk perubahan yang terjadi dalam satu rangkaian tindakan.
watch([() => q.value.seg, () => q.value.urut, () => q.value.arah, () => q.value.hal, cariDiterapkan, filterDiterapkan, bahasa], () => {
  if (!aktif) return
  clearTimeout(jedaMuat)
  batal()
  galat.value = null
  memuat.value = true
  jedaMuat = setTimeout(() => { void muatDaftar(alasanDaftar.ambil()) }, 80)
})

/* Pindah halaman: wadah tabel DataTable elemen yang sama antarhalaman dan
   menyimpan scrollTop-nya, jadi halaman 2 tampil dari baris ±40 — terbaca
   seolah urutannya terlompati. */
const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}

// Tombol kembali di halaman detail membawa query terakhir daftar ini.
watch(() => route.fullPath, p => indeks.ingatDaftar(p), { immediate: true })

const labelStatus = (s: StatusPengguna): string =>
  s === 'menunggu_hapus' ? tcf('pengguna.menungguHapus') : s === 'ditangguhkan' ? tcf('pengguna.ditangguhkan') : tcf('pengguna.aktif')

/* ruang/tx null = sesi tanpa pii: server tidak mengirim hitungan (M/0089 §15 (d)); tabel menulis '—'. */
interface Baris { id: string; email: string; wa: string | null; versi: string | null; daftar: string; aktif: string; ruang: number | null; tx: number | null; status: string; p: Pengguna }
const keBaris = (p: Pengguna): Baris => ({
  id: p.id,
  email: p.emailPenuh ?? p.emailTersamar,
  wa: p.nomorPenuh ?? p.nomorTersamar,
  versi: p.labelVersi,
  daftar: p.daftar,
  aktif: p.aktivitasTerakhir,
  ruang: p.ruang,
  tx: p.tx,
  status: labelStatus(p.status),
  p,
})

const kolom = computed(() => [
  { key: 'email', label: tcf('pengguna.email'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]', sortable: true },
  { key: 'wa', label: tcf('pengguna.wa'), type: 'text' as const, sortable: true, class: 'hidden whitespace-nowrap tabular-nums text-[var(--ca-text)] sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'versi', label: tcf('pengguna.versi'), type: 'text' as const, sortable: true, class: 'hidden whitespace-nowrap tabular-nums sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'daftar', label: tcf('pengguna.daftar'), type: 'text' as const, width: '120px', sortable: true, class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'aktif', label: tcf('pengguna.aktifTerakhir'), type: 'text' as const, width: '130px', sortable: true },
  { key: 'ruang', label: tcf('pengguna.ruang'), type: 'text' as const, width: '70px', sortable: !tanpaHitungan.value, filterable: false, class: 'hidden tabular-nums text-right md:table-cell', headerClass: 'hidden md:table-cell' },
  // 'Tx' seperti tabel ruang Pengguna 360: label panjang membuat tabel tidak muat di 1280 px.
  { key: 'tx', label: tcf('pengguna.kolom.tx'), type: 'text' as const, width: '90px', sortable: !tanpaHitungan.value, filterable: false, class: 'tabular-nums text-right' },
  {
    key: 'status', label: tcf('pengguna.status'), type: 'status' as const, width: '140px',
    options: (['aktif', 'ditangguhkan', 'menunggu_hapus'] as const).map(s => ({ label: labelStatus(s), value: s })),
    class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell',
  },
])

const hal = computed(() => halamanHasil.value)
const jumlahHal = computed(() => jumlahHalaman(total.value, PER))
const barisHalaman = computed(() => semua.value.map(keBaris))
const pilihSegmen = (s: typeof SEGMEN[number]) => setel({ seg: s, hal: 1 })
const urutKolom = (key: string) => {
  const k = URUT.find(u => u === key)
  if (!k || (tanpaHitungan.value && (k === 'ruang' || k === 'tx'))) return
  const arah = q.value.urut === k ? (q.value.arah === 'asc' ? 'desc' : 'asc') : (k === 'email' || k === 'wa' ? 'asc' : 'desc')
  void setel({ urut: k, arah, hal: 1 })
}

const segmenOpsi = computed(() => [
  { kunci: 'semua' as const, label: tcf('umum.semua') },
  { kunci: 'catat7' as const, label: tcf('pengguna.catat7') },
  { kunci: 'belum' as const, label: tcf('pengguna.belumCatat') },
  { kunci: 'ditangguhkan' as const, label: tcf('pengguna.ditangguhkan') },
])
/** Server sudah memasang migrasi nomor WA (kolomnya ada di jawaban). */
const serverKirimWa = computed(() => mentah.value.some(d => d.nomor_wa !== undefined))
const serverKirimVersi = computed(() => mentah.value.some(d => d.versi_aplikasi !== undefined))
/** Ikon platform di sel versi. Lucide tidak punya logo merek (ikon `apple`-nya
 *  buah), jadi Android/Apple dari Bootstrap Icons yang sudah terpasang. */
const IKON_PLATFORM: Readonly<Record<'android' | 'ios' | 'web', string>> = { android: 'bi:android2', ios: 'bi:apple', web: 'lucide:globe' }
const ikonPlatform = (p: InfoPlatform): string | null => (p.dasar ? IKON_PLATFORM[p.dasar] : null)
/** Server menahan hitungan per orang (sesi tanpa pii): segmen berbasis tx tidak bermakna. */
const tanpaHitungan = computed(() => !sesi.boleh('cashflow:pii'))
const segmenButuhHitungan = (k: string) => k === 'belum' || k === 'catat7'

useCashflowPintasan([{ kunci: '/', aksi: () => kolomCari.value?.focus() }])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <form class="flex w-full gap-2 sm:w-auto" @submit.prevent="jalankanCari">
        <input ref="kolomCari" v-model="cari" type="search" maxlength="200" class="ca-input min-w-0 flex-1 sm:w-64" :aria-label="tcf('pengguna.cariLabel')" :placeholder="tcf('pengguna.cariLabel')">
        <button type="submit" class="rounded-xl border border-[color:var(--ca-border)] px-4 py-2 text-sm font-semibold text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]">{{ tcf('pengguna.cariTombol') }}</button>
      </form>
      <button type="button" class="rounded-xl border border-[color:var(--ca-border)] px-4 py-2 text-sm font-semibold text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]" @click="paletBuka = true">
        {{ tcf('cari.server') }}
      </button>
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="s in segmenOpsi" :key="s.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="q.seg === s.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.seg === s.kunci"
          :disabled="tanpaHitungan && segmenButuhHitungan(s.kunci)"
          :title="tanpaHitungan && segmenButuhHitungan(s.kunci) ? tcf('umum.butuhTotp') : undefined"
          @click="pilihSegmen(s.kunci)"
        >{{ s.label }}</button>
      </div>
      <span v-if="!pesanGalat" class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ memuat ? tcf('umum.memuat') : tcf('pengguna.jumlahHasil')(total) }}</span>

      <!-- Kontak lengkap: satu ketukan dan tercatat di audit. -->
      <button
        type="button" role="switch" :aria-checked="!!terbuka"
        class="ml-auto inline-flex items-center gap-3 rounded-full border border-[color:var(--ca-border)] py-1.5 pl-4 pr-1.5 text-sm font-semibold text-[var(--ca-text)] transition hover:bg-[var(--ca-panel-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="memuat && !terbuka" @click="terbuka ? samarkan() : buka()"
      >
        <Icon :name="terbuka ? 'lucide:eye' : 'lucide:eye-off'" class="h-4 w-4 text-[var(--ca-muted)]" />
        {{ tcf('pengguna.kontakPenuh') }}
        <span
          class="relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200"
          :class="terbuka ? 'border-[color:var(--ca-brand-deep)] bg-[var(--ca-brand)]' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full transition-transform duration-200"
            :style="{ background: 'var(--ca-toggle-thumb)', boxShadow: 'var(--ca-toggle-thumb-shadow)' }"
            :class="terbuka ? 'translate-x-[1.35rem]' : 'translate-x-0.5'"
          />
        </span>
      </button>
    </div>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.cariKet') }}</p>

    <p v-if="terbuka" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-2 text-xs text-[var(--ca-text)]">
      {{ tcf('pengguna.terbukaSampai')(formatJam(new Date(terbuka.sampai))) }}
    </p>

    <CashflowIzinKurang v-if="galat?.jenis === 'izin'" :pesan="tcf('pengguna.kontakButuhTotp')" />
    <div v-else-if="pesanGalat" class="flex flex-wrap items-center gap-3 text-sm ca-tone-danger" role="alert">
      <span>{{ pesanGalat }}</span>
      <span v-if="semua.length">{{ tcf('pengguna.hasilSebelumnya') }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" @click="muatDaftar(alasanDaftar.ambil())">{{ tcf('masuk.cobaLagi') }}</button>
    </div>

    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya pengguna. -->
    <div v-if="!pesanGalat || semua.length" ref="wadahDaftar" class="ca-daftar-pengguna ca-console-dialog scroll-mt-24 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--ca-border)] px-4 py-4 sm:px-5">
        <div><h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.daftarJudul') }}</h2><p class="mt-1 text-xs text-[var(--ca-muted)]">{{ tcf('pengguna.daftarKet') }}</p></div>
        <span class="ca-pill-muted text-xs">{{ terbuka ? tcf('pengguna.kontakPenuh') : tcf('pengguna.emailSamar') }}</span>
      </div>
      <DataTable
        v-model:filters="filterKolom"
        :columns="kolom" :data="barisHalaman" :loading="memuat"
        :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
        empty-icon="lucide:users" :empty-text="cariDiterapkan || Object.keys(filterDiterapkan).length || q.seg !== 'semua' ? tcf('umum.kosongSaring') : tcf('umum.kosong')"
        @sort="urutKolom"
        @row-click="(row: Baris) => navigateTo(`/console/cashflow/pengguna/${row.id}`)"
      >
        <template #cell-email="{ row }">
          <!-- Email panjang dipotong dengan elipsis; teks lengkapnya di title. -->
          <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="block max-w-[10rem] truncate font-mono text-[var(--ca-text)] underline-offset-2 hover:underline" :title="row.email" @click.stop>{{ row.email }}</NuxtLink>
          <span class="mt-0.5 block font-mono text-xs text-[var(--ca-subtle)]">ID {{ row.id.slice(0, 8) }}</span>
          <!-- Layar sempit: kolom WhatsApp disembunyikan, nomornya ikut di bawah email. -->
          <span v-if="row.wa" class="mt-0.5 block whitespace-nowrap font-mono text-xs tabular-nums text-[var(--ca-muted)] sm:hidden">
            <span class="sr-only">{{ tcf('pengguna.wa') }}: </span>{{ row.wa }}
          </span>
        </template>
        <!-- null = tidak ada nomor; title hanya bila server memang mengirim kolomnya
             (sebelum migrasinya terpasang, "belum ada nomor" belum tentu benar). -->
        <template #cell-wa="{ value }">
          <span v-if="value === null" class="text-[var(--ca-subtle)]" :title="serverKirimWa ? tcf('pengguna.waBelum') : undefined">—<span v-if="serverKirimWa" class="sr-only"> ({{ tcf('pengguna.waBelum') }})</span></span>
          <template v-else>{{ value }}</template>
        </template>
        <!-- Versi ramping: ikon platform kecil (titik = varian uji seperti UAT) lalu
             nomor versinya. Di bawah versi tertinggi platform yang sama: redup. -->
        <template #cell-versi="{ row }">
          <span v-if="row.versi === null" class="text-[var(--ca-subtle)]">—</span>
          <span
            v-else class="inline-flex items-center gap-1.5"
            :class="versiTertinggal(row.p, versiTerbaru) ? 'text-[var(--ca-subtle)]' : 'text-[var(--ca-text)]'"
            :title="versiTertinggal(row.p, versiTerbaru) ? `${row.versi} · ${tcf('pengguna.versiLama')}` : row.versi"
          >
            <span v-if="row.p.platform" class="relative inline-flex shrink-0" role="img" :aria-label="row.p.platform.label" :title="row.p.platform.label">
              <Icon v-if="ikonPlatform(row.p.platform)" :name="ikonPlatform(row.p.platform)!" class="h-3.5 w-3.5" aria-hidden="true" />
              <span v-else class="text-[0.65rem] font-semibold" aria-hidden="true">{{ row.p.platform.label.slice(0, 1) }}</span>
              <span v-if="row.p.platform.varian" class="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--ca-gold-text)]" aria-hidden="true" />
            </span>
            {{ row.p.versiAplikasi ?? '—' }}<span v-if="versiTertinggal(row.p, versiTerbaru)" class="sr-only"> ({{ tcf('pengguna.versiLama') }})</span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <span v-if="row.p.status === 'menunggu_hapus'" class="ca-pill-danger whitespace-nowrap text-[0.7rem]">{{ row.status }}</span>
          <template v-else>{{ row.status }}</template>
        </template>
        <template v-for="k in (['ruang', 'tx'] as const)" :key="k" #[`cell-${k}`]="{ value }">
          <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
          <template v-else>{{ value }}</template>
        </template>
      </DataTable>
    </div>

    <CashflowHalaman
      v-if="total"
      :hal="hal" :jumlah-halaman="jumlahHal" :total="total" :per="PER" :memuat="memuat || !!galat" lompat
      @ganti="gantiHalaman"
    />

    <p v-if="!hapusTersedia" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.hapusBelumTersedia') }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.aktifTerakhirKet') }}</p>
    <p v-if="serverKirimVersi" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.versiKet') }}</p>
    <CashflowPalet :show="paletBuka" @close="paletBuka = false" />
  </div>
</template>

<style scoped>
/* Delapan kolom harus muat tanpa gulir samping mulai jendela 1280 px: jarak sel
   tabel di halaman ini sedikit lebih rapat daripada bawaan DataTable (1rem). */
.ca-daftar-pengguna :deep(.ca-console-table th),
.ca-daftar-pengguna :deep(.ca-console-table td) {
  padding-inline: 0.625rem;
}
</style>
