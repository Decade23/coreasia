<script setup lang="ts">
/**
 * Pengumuman CashFlow: daftar, buat, sunting, hentikan, segmen, dan
 * pengumuman rutin.
 *
 * Form (spek console 19 Nov 2026, K8): CashflowPengumumanForm dengan pola
 * CashflowPaketForm. Galat server per kolom datang dari hint RPC
 * (galatServerPengumuman). Simpan memakai RPC terbaru yang ada di server:
 * v5 (gaya, T3) lalu v4 (aturan) lalu v3. Server lama tidak menawarkan apa
 * yang belum ia kenal, tanpa galat:
 *   sasaranAktif  RPC v4 ada: pilihan aturan, segmen, pratinjau penerima
 *   fiturT3       admin_daftar_pengumuman_rutin ada (keempat migrasi T3):
 *                 pengecualian di semua mode, pilihan gaya, bagian rutin
 *   gayaAda       kolom announcements.gaya (T4) ada: kartu bisa dipilih
 */
import { kePengumuman, pengumumanBelumBerakhir, type Pengumuman, type PengumumanDTO } from '~/adapters/cashflow'
import { statusPengumuman, PILIHAN_PENERIMA, type SimpanPengumuman } from '~/adapters/cashflowPengumuman'
import { kalimatAturan, type KamusRingkas } from '~/adapters/cashflowPengumumanAturan'
import {
  KECUALI_KOSONG, galatServerPengumuman, isianBaru, isianDari, penerimaDari,
  type GalatPengumuman, type IsianPengumuman, type MuatanPengumuman, type PenerimaIsian, type PenerimaKirim,
} from '~/adapters/cashflowPengumumanForm'
import { keDaftarRutin, type DaftarRutin } from '~/adapters/cashflowPengumumanRutin'
import type { Aturan } from '~/adapters/cashflowPengumumanAturan'
import { petakanGalat } from '~/composables/cashflow/useCashflowAdmin'
import { tombolPengumuman } from '~/adapters/cashflowPengumumanTautan'
import { ikutiPengumuman } from '~/utils/cashflow/pengumumanLangsung'
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf, kamus, bahasa, formatTanggal, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat, aksi, batal } = useCashflowMuat({ awal: true })
const rows = shallowRef<Pengumuman[]>([])
const jam = ref(Date.now())
const hubungan = ref<'menyambung' | 'tersambung' | 'terputus'>('menyambung')
/* Sasaran berbasis aturan (spek 13 Nov 2026). null = belum diketahui, false =
   server lama (RPC v4 belum ada): halaman memakai v3 dan pilihan aturan,
   segmen, serta pratinjau penerima disembunyikan, tanpa galat. */
const sasaranAktif = ref<boolean | null>(null)
const ambilDaftar = async (): Promise<PengumumanDTO[]> => {
  if (sasaranAktif.value !== false) {
    try {
      const d = await api.daftarPengumumanV4()
      sasaranAktif.value = true
      return d
    } catch (e) {
      if (petakanGalat(e, 'admin_daftar_pengumuman_v4').jenis !== 'belum-aktif') throw e
      sasaranAktif.value = false
    }
  }
  return api.daftarPengumuman()
}
const muatDaftar = () => muat(async terbaru => {
  const hasil = (await ambilDaftar()).map(kePengumuman)
  if (terbaru()) { rows.value = hasil; jam.value = Date.now() }
})

/* Pengumuman rutin dan fitur T3 (spek console 19 Nov 2026). Server tanpa
   RPC-nya = fiturT3 false, bagian rutin dan pilihan baru disembunyikan. */
const fiturT3 = ref(false)
const rutin = shallowRef<DaftarRutin | null>(null)
const rutinMuat = useCashflowMuat()
const muatRutin = () => rutinMuat.muat(async terbaru => {
  try {
    const d = keDaftarRutin(await api.daftarPengumumanRutin())
    if (!terbaru()) return
    rutin.value = d; fiturT3.value = true
  } catch (e) {
    if (petakanGalat(e, 'admin_daftar_pengumuman_rutin').jenis !== 'belum-aktif') throw e
    if (terbaru()) { rutin.value = null; fiturT3.value = false }
  }
})
const gayaAda = computed(() => rutin.value?.gayaAda === true)

// ── Form buat dan sunting ───────────────────────────────────────────────
const PENERIMA_BARU = (): PenerimaIsian & { aturanAwal: Aturan | null } => ({
  jenis: 'all', pengguna: [], kelompok: [], aturan: null, kecuali: { ...KECUALI_KOSONG, pengguna: [], kelompok: [] }, aturanAwal: null,
})
const form = reactive({
  buka: false, kunci: 0, id: '', versi: null as string | null,
  isian: isianBaru() as IsianPengumuman, penerima: PENERIMA_BARU(),
})
const menyunting = ref(false)
const menyimpan = ref(false)
const galatServer = ref<GalatPengumuman>({})
const bukaBaru = () => {
  menyunting.value = false
  Object.assign(form, { buka: true, kunci: form.kunci + 1, id: crypto.randomUUID(), versi: null, isian: isianBaru(new Date()), penerima: PENERIMA_BARU() })
  galatServer.value = {}
}
const sunting = (p: Pengumuman) => {
  menyunting.value = true
  Object.assign(form, { buka: true, kunci: form.kunci + 1, id: p.id, versi: p.diubah, isian: isianDari(p), penerima: penerimaDari(p) })
  galatServer.value = {}
}
const versiTerbaru = computed(() => rows.value.find(p => p.id === form.id))
const basi = computed(() => form.buka && menyunting.value && !menyimpan.value && !!versiTerbaru.value && versiTerbaru.value.diubah !== form.versi)
const tutupForm = () => { if (!menyimpan.value) form.buka = false }
const muatVersi = () => { if (versiTerbaru.value) sunting(versiTerbaru.value) }
const simpan = async (m: MuatanPengumuman, pk: PenerimaKirim) => {
  if (menyimpan.value || basi.value) return
  galatServer.value = {}
  const p: SimpanPengumuman = {
    penerima: pk.penerima, pengguna: pk.pengguna, kelompok: pk.kelompok, aturan: pk.aturan, id: form.id, versi: form.versi,
    judul: m.judul, isi: m.isi, level: m.level, mulai: m.mulai, sampai: m.sampai, tombol: m.tombol, url: m.url, alasan: m.alasan, gaya: m.gaya,
  }
  menyimpan.value = true
  try {
    const ok = await aksi(async () => {
      // Server baru: RPC terbaru untuk semua jenis (pindah dari atau ke `aturan` butuh v4).
      if (fiturT3.value) await api.simpanPengumumanV5(menyunting.value ? p : { ...p, versi: null })
      else if (sasaranAktif.value) await api.simpanPengumumanV4(menyunting.value ? p : { ...p, versi: null })
      else if (menyunting.value) await api.ubahPengumuman(p)
      else await api.buatPengumumanV2(p)
    }, {
      sukses: tcf(menyunting.value ? 'pengumuman.disimpan' : 'pengumuman.dibuat'),
      gagal: (g) => {
        const k = galatServerPengumuman(g)
        if (k) galatServer.value = { [k.kolom]: k.kode }
        void muatDaftar()
      },
    })
    if (ok) { form.buka = false; await Promise.all([muatDaftar(), muatRutin()]) }
  } finally { menyimpan.value = false }
}

const ringkas = computed(() => kamus.value.pengumuman.ringkas as unknown as KamusRingkas)
const labelPenerima = (p: Pengumuman) => (p.penerima === 'aturan'
  ? kalimatAturan(p.aturan, ringkas.value, { bahasa: bahasa.value, segmenNama: p.namaSegmen })
  : PILIHAN_PENERIMA.some(x => x.id === p.penerima) ? tcf(`pengumuman.penerimaOpsi.${p.penerima}`) : '—')
const bukaSegmen = ref(false)

const dihentikan = ref<Pengumuman | null>(null)
const alasanHenti = ref('')
const menghentikan = ref(false)
const mintaHentikan = (p: Pengumuman) => { dihentikan.value = p; alasanHenti.value = '' }
const hentikan = async () => {
  const p = dihentikan.value
  if (!p || menghentikan.value || alasanHenti.value.trim().length < 8) return
  menghentikan.value = true
  try {
    if (await aksi(() => api.hentikanPengumuman(p.id, alasanHenti.value.trim()), { sukses: tcf('pengumuman.dihentikan') })) {
      dihentikan.value = null; await muatDaftar()
    }
  } finally { menghentikan.value = false }
}
const waktu = (iso: string | null) => iso ? `${formatTanggal(iso)} ${formatJam(iso)}` : '—'
/** Domain web, atau nama layar untuk tautan dalam aplikasi (cashflow://). */
const domain = (row: Pengumuman) => tombolPengumuman(row.tombol, row.url)?.host ?? ''
const labelLevel = (level: string) => (tcf('pengumuman.levelOpsi') as unknown as Record<string, string>)[level] ?? level
const aktif = computed(() => rows.value.filter(p => statusPengumuman(p, jam.value) === 'aktif').length)
const kolom = computed(() => [
  // Judul dan isi butuh ruang baca: tanpa lebar terkecil kolomnya menyempit jadi satu kata per baris.
  { key: 'judul', label: tcf('pengumuman.judulKolom'), filterable: false, class: 'min-w-[14rem]' },
  { key: 'penerima', label: tcf('pengumuman.penerimaLabel'), filterable: false },
  { key: 'level', label: tcf('pengumuman.level'), filterable: false },
  { key: 'status', label: tcf('pengumuman.statusLabel'), filterable: false },
  { key: 'mulai', label: tcf('pengumuman.mulaiWib'), filterable: false },
  { key: 'sampai', label: tcf('pengumuman.sampai'), filterable: false },
  { key: 'aksi', label: '', filterable: false },
])

let halamanHidup = true
let lepas: (() => void) | null = null
let ubahVisibilitas: (() => void) | null = null
onMounted(() => {
  void muatDaftar()
  void muatRutin()
  void (async () => {
    const klien = await useCashflowSupabase().ambil()
    if (!klien || !halamanHidup) return
    ubahVisibilitas = () => {
      if (document.visibilityState === 'visible' && !lepas) lepas = ikutiPengumuman({
        klien, segarkan: async () => { await muatDaftar() },
        baca: () => ({ berikutnya: null, koreksi: 0, daftar: rows.value.map(p => ({ starts_at: p.mulai, ends_at: p.sampai })) }),
        dengar: ubah => watch(rows, ubah), ketuk: () => { jam.value = Date.now() }, status: s => { hubungan.value = s },
      })
      else if (document.visibilityState !== 'visible' && lepas) { lepas(); lepas = null; hubungan.value = 'terputus' }
    }
    document.addEventListener('visibilitychange', ubahVisibilitas)
    ubahVisibilitas()
  })()
})
onBeforeUnmount(() => {
  halamanHidup = false; batal(); rutinMuat.batal(); lepas?.()
  if (ubahVisibilitas) document.removeEventListener('visibilitychange', ubahVisibilitas)
})
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengumuman.judul')" kicker="CashFlow" ringkas>
      <template #meta><CashflowNav /></template>
      <template #actions><div class="flex flex-wrap gap-2"><button v-if="sasaranAktif" type="button" class="ca-btn-secondary" @click="bukaSegmen = true">{{ tcf('pengumuman.segmenTombol') }}</button><button type="button" class="ca-btn-primary" @click="bukaBaru">{{ tcf('pengumuman.buat') }}</button></div></template>
    </ConsolePageHeader>
    <div class="flex items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
      <span>{{ tcf('pengumuman.jumlah')(rows.length, aktif) }}</span>
      <span class="inline-flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full" :class="hubungan === 'tersambung' ? 'bg-emerald-600' : 'bg-[var(--ca-subtle)]'" />{{ tcf(`pengumuman.koneksi.${hubungan}`) }}</span>
    </div>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <!-- Ponsel: satu kartu per pengumuman, isi dan aksinya sama dengan tabel. -->
    <div class="min-w-0 sm:hidden" data-uji="pengumuman-kartu">
      <CashflowKeadaan v-if="memuat && !rows.length" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="3" :kolom="2" />
      <CashflowKeadaan v-else-if="!rows.length && !pesanGalat" jenis="kosong" :judul="tcf('umum.kosongJudul')" :pesan="tcf('pengumuman.kosong')" />
      <ul v-else class="min-w-0 space-y-3">
        <li v-for="row in rows" :key="row.id" class="cf-tabel-wadah min-w-0 p-4">
          <div class="flex min-w-0 items-start justify-between gap-3">
            <strong class="min-w-0 break-words text-[0.9375rem] text-[var(--ca-text)]">{{ row.judul }}</strong>
            <span class="ca-pill-muted shrink-0 whitespace-nowrap text-xs">{{ tcf(`pengumuman.status.${statusPengumuman(row, jam)}`) }}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--ca-muted)]">{{ row.isi }}</p>
          <p v-if="row.tombol" class="mt-1 break-all text-xs text-[var(--ca-subtle)]">{{ row.tombol }} · {{ domain(row) }}</p>
          <p v-if="row.rutinId || row.gaya" class="mt-2 flex flex-wrap gap-1.5 text-[11px]"><span v-if="row.rutinId" class="ca-pill-muted">{{ tcf('pengumuman.rutin.labelBaris') }}</span><span v-if="row.gaya" class="ca-pill-muted">{{ tcf(`pengumuman.form.gayaOpsi.${row.gaya}`) }}</span></p>
          <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[color:var(--ca-border)] pt-3 text-sm">
            <div class="col-span-2 min-w-0">
              <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.penerimaLabel') }}</dt>
              <dd class="mt-0.5 break-words text-[var(--ca-text)]">
                {{ labelPenerima(row) }}
                <span class="block text-xs text-[var(--ca-muted)]">{{ row.jumlahPenerima === null ? '—' : tcf('pengumuman.jumlahPengguna')(row.jumlahPenerima) }}<template v-if="row.namaKelompok.length"> · {{ row.namaKelompok.join(', ') }}</template></span>
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.mulaiWib') }}</dt>
              <dd class="mt-0.5 text-xs tabular-nums text-[var(--ca-text)]">{{ waktu(row.mulai) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.sampai') }}</dt>
              <dd class="mt-0.5 text-xs tabular-nums text-[var(--ca-text)]">{{ waktu(row.sampai) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.level') }}</dt>
              <dd class="mt-0.5 text-[var(--ca-text)]">{{ labelLevel(row.level) }}</dd>
            </div>
          </dl>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" @click="sunting(row)">{{ tcf('pengumuman.sunting') }}</button>
            <button v-if="pengumumanBelumBerakhir(row, jam)" type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" @click="mintaHentikan(row)">{{ tcf('pengumuman.hentikan') }}</button>
          </div>
        </li>
      </ul>
    </div>
    <div class="ca-console-dialog hidden overflow-hidden sm:block [&_tbody_tr]:!cursor-default">
      <DataTable :columns="kolom" :data="rows" :loading="memuat" :show-count="false" :empty-text="tcf('pengumuman.kosong')" empty-icon="lucide:megaphone">
        <template #cell-judul="{ row }"><div class="max-w-md"><strong>{{ row.judul }}</strong><p class="mt-1 whitespace-pre-wrap text-xs text-[var(--ca-muted)]">{{ row.isi }}</p><span v-if="row.tombol" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ row.tombol }} · {{ domain(row) }}</span><span v-if="row.rutinId || row.gaya" class="mt-2 flex flex-wrap gap-1.5 text-[11px]"><span v-if="row.rutinId" class="ca-pill-muted" data-uji="label-rutin">{{ tcf('pengumuman.rutin.labelBaris') }}</span><span v-if="row.gaya" class="ca-pill-muted">{{ tcf(`pengumuman.form.gayaOpsi.${row.gaya}`) }}</span></span></div></template>
        <template #cell-penerima="{ row }"><span class="block min-w-44 max-w-64 text-xs" :data-uji="row.penerima === 'aturan' ? 'ringkas-aturan' : undefined">{{ labelPenerima(row) }}</span><span class="block text-xs text-[var(--ca-muted)]">{{ row.jumlahPenerima === null ? '—' : tcf('pengumuman.jumlahPengguna')(row.jumlahPenerima) }}</span><span v-if="row.namaKelompok.length" class="block max-w-48 text-xs text-[var(--ca-muted)]">{{ row.namaKelompok.join(', ') }}</span></template>
        <template #cell-level="{ row }">{{ labelLevel(row.level) }}</template>
        <template #cell-status="{ row }"><span class="ca-pill-muted whitespace-nowrap text-xs">{{ tcf(`pengumuman.status.${statusPengumuman(row, jam)}`) }}</span></template>
        <template #cell-mulai="{ row }"><span class="whitespace-nowrap text-xs tabular-nums">{{ waktu(row.mulai) }}</span></template>
        <template #cell-sampai="{ row }"><span class="whitespace-nowrap text-xs tabular-nums">{{ waktu(row.sampai) }}</span></template>
        <template #cell-aksi="{ row }"><div class="flex items-center justify-end gap-2"><button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" @click.stop="sunting(row)">{{ tcf('pengumuman.sunting') }}</button><button v-if="pengumumanBelumBerakhir(row, jam)" type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" @click.stop="mintaHentikan(row)">{{ tcf('pengumuman.hentikan') }}</button></div></template>
      </DataTable>
    </div>

    <CashflowPengumumanRutin v-if="fiturT3 && rutin" :daftar="rutin" :memuat="rutinMuat.memuat.value" @berubah="muatRutin(); muatDaftar()" />

    <CashflowPengumumanForm
      v-if="form.buka" :key="`${form.id}|${form.kunci}`" :show="form.buka" :mode="menyunting ? 'ubah' : 'baru'" :isian-awal="form.isian"
      :penerima-awal="form.penerima" :galat-server="galatServer" :sibuk="menyimpan" :basi="basi" :sasaran-aktif="sasaranAktif === true"
      :kecuali-aktif="sasaranAktif === true && fiturT3" :gaya-aktif="fiturT3" :gaya-ada="gayaAda"
      @simpan="simpan" @tutup="tutupForm" @muat-versi="muatVersi"
    />
    <ConsoleModal :show="bukaSegmen" :title="tcf('pengumuman.segmen.judul')" size="xl" @close="bukaSegmen = false">
      <CashflowPengumumanSegmen v-if="bukaSegmen" @berubah="muatDaftar" />
    </ConsoleModal>
    <ConsoleModal :show="!!dihentikan" :title="tcf('pengumuman.hentikanJudul')" size="sm" @close="!menghentikan && (dihentikan = null)">
      <form class="space-y-4" @submit.prevent="hentikan">
        <p class="text-sm text-[var(--ca-text)]">{{ dihentikan?.judul }}</p>
        <label for="cf-p-alasan-henti" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.alasan') }}<textarea id="cf-p-alasan-henti" v-model="alasanHenti" rows="3" class="ca-input mt-2 w-full" minlength="8" :disabled="menghentikan" required /></label>
        <div class="flex justify-end gap-2"><button type="button" class="ca-btn-secondary" :disabled="menghentikan" @click="dihentikan = null">{{ tcf('umum.batal') }}</button><button type="submit" class="ca-btn-primary" :disabled="menghentikan || alasanHenti.trim().length < 8">{{ tcf('pengumuman.hentikan') }}</button></div>
      </form>
    </ConsoleModal>
  </div>
</template>
