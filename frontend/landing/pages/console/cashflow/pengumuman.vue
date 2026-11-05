<script setup lang="ts">
import { keDatetimeLokalWib, dariDatetimeLokalWib, kePengumuman, pengumumanBelumBerakhir, LEVEL_PENGUMUMAN, type Pengumuman, type LevelPengumuman } from '~/adapters/cashflow'
import { statusPengumuman, penerimaSah, PILIHAN_PENERIMA, type JenisPenerima, type SimpanPengumuman } from '~/adapters/cashflowPengumuman'
import { tombolPengumuman } from '~/adapters/cashflowPengumumanTautan'
import { ikutiPengumuman } from '~/utils/cashflow/pengumumanLangsung'
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf, formatTanggal, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi, batal } = useCashflowMuat({ awal: true })
const rows = shallowRef<Pengumuman[]>([])
const jam = ref(Date.now())
const bukaForm = ref(false)
const menyunting = ref(false)
const menyimpan = ref(false)
const penerimaSibuk = ref(false)
const hubungan = ref<'menyambung' | 'tersambung' | 'terputus'>('menyambung')
const f = reactive({ penerima: 'all' as JenisPenerima, pengguna: [] as string[], kelompok: [] as string[], id: '', versi: null as string | null, judul: '', isi: '', level: 'info' as LevelPengumuman,
  mulai: '', sampai: '', tombol: '', url: '', alasan: '', awalMulai: '', awalSampai: null as string | null })
const muatDaftar = () => muat(async terbaru => {
  const hasil = (await api.daftarPengumuman()).map(kePengumuman)
  if (terbaru()) { rows.value = hasil; jam.value = Date.now() }
})
const bukaBaru = () => {
  menyunting.value = false
  Object.assign(f, { penerima: 'all', pengguna: [], kelompok: [], id: crypto.randomUUID(), versi: null, judul: '', isi: '', level: 'info',
    mulai: keDatetimeLokalWib(new Date()), sampai: '', tombol: '', url: '', alasan: '', awalMulai: '', awalSampai: null })
  bukaForm.value = true
}
const sunting = (p: Pengumuman) => {
  menyunting.value = true
  Object.assign(f, { penerima: p.penerima, pengguna: [...p.pengguna], kelompok: [...p.kelompok], id: p.id, versi: p.diubah, judul: p.judul, isi: p.isi,
    level: LEVEL_PENGUMUMAN.includes(p.level as LevelPengumuman) ? p.level : 'info',
    mulai: keDatetimeLokalWib(new Date(p.mulai)), sampai: p.sampai ? keDatetimeLokalWib(new Date(p.sampai)) : '',
    tombol: p.tombol ?? '', url: p.url ?? '', alasan: '', awalMulai: p.mulai, awalSampai: p.sampai })
  bukaForm.value = true
}
const versiTerbaru = computed(() => rows.value.find(p => p.id === f.id))
const basi = computed(() => bukaForm.value && menyunting.value && !menyimpan.value && !!versiTerbaru.value && versiTerbaru.value.diubah !== f.versi)
const tutupForm = () => { if (!menyimpan.value) bukaForm.value = false }
const simpan = async () => {
  if (menyimpan.value || basi.value || penerimaSibuk.value) return
  if (!penerimaSah(f.penerima, f.pengguna, f.kelompok)) { toast.error('Pilih penerima pengumuman.'); return }
  if (!f.judul.trim() || !f.isi.trim()) { toast.error(tcf('pengumuman.wajibIsi')); return }
  if (f.alasan.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const mulai = f.awalMulai && keDatetimeLokalWib(new Date(f.awalMulai)) === f.mulai ? f.awalMulai : dariDatetimeLokalWib(f.mulai)
  const sampai = f.awalSampai && keDatetimeLokalWib(new Date(f.awalSampai)) === f.sampai ? f.awalSampai : f.sampai ? dariDatetimeLokalWib(f.sampai) : null
  if (!mulai || (f.sampai && !sampai)) { toast.error(tcf('pengumuman.tanggalRusak')); return }
  if (sampai && Date.parse(sampai) <= Date.parse(mulai)) { toast.error(tcf('pengumuman.sampaiSebelumMulai')); return }
  const tombol = tombolPengumuman(f.tombol, f.url)
  if ((f.tombol.trim() || f.url.trim()) && !tombol) { toast.error(tcf('pengumuman.tautanTidakSah')); return }
  const p: SimpanPengumuman = { penerima: f.penerima, pengguna: f.pengguna, kelompok: f.kelompok, id: f.id, versi: f.versi, judul: f.judul.trim(), isi: f.isi.trim(),
    level: f.level, mulai, sampai, tombol: tombol?.label ?? null, url: tombol?.url ?? null, alasan: f.alasan.trim() }
  menyimpan.value = true
  try {
    const ok = await aksi(async () => {
      if (menyunting.value) await api.ubahPengumuman(p)
      else await api.buatPengumumanV2(p)
    }, { sukses: tcf(menyunting.value ? 'pengumuman.disimpan' : 'pengumuman.dibuat'), gagal: () => { void muatDaftar() } })
    if (ok) { bukaForm.value = false; await muatDaftar() }
  } finally { menyimpan.value = false }
}

const gantiPenerima = (jenis: JenisPenerima) => {
  f.penerima = jenis
  if (jenis === 'single') f.pengguna = f.pengguna.slice(0, 1)
  if (jenis === 'all' || jenis === 'groups') f.pengguna = []
  if (jenis !== 'groups') f.kelompok = []
}
const labelPenerima = (p: Pengumuman) => PILIHAN_PENERIMA.find(x => x.id === p.penerima)?.label ?? '—'

const dihentikan = ref<Pengumuman | null>(null)
const alasanHenti = ref('')
const menghentikan = ref(false)
const mintaHentikan = (p: Pengumuman) => { dihentikan.value = p; alasanHenti.value = '' }
const hentikan = async () => {
  const p = dihentikan.value
  if (!p || menghentikan.value) return
  if (alasanHenti.value.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  menghentikan.value = true
  try {
    if (await aksi(() => api.hentikanPengumuman(p.id, alasanHenti.value.trim()), { sukses: tcf('pengumuman.dihentikan') })) {
      dihentikan.value = null; await muatDaftar()
    }
  } finally { menghentikan.value = false }
}
const waktu = (iso: string | null) => iso ? `${formatTanggal(iso)} ${formatJam(iso)}` : '—'
const domain = (url: string | null) => url ? new URL(url).hostname : ''
const labelLevel = (level: string) => (tcf('pengumuman.levelOpsi') as unknown as Record<string, string>)[level] ?? level
const aktif = computed(() => rows.value.filter(p => statusPengumuman(p, jam.value) === 'aktif').length)
const kolom = computed(() => [
  { key: 'judul', label: tcf('pengumuman.judulKolom'), filterable: false },
  { key: 'penerima', label: 'Penerima', filterable: false },
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
  halamanHidup = false; batal(); lepas?.()
  if (ubahVisibilitas) document.removeEventListener('visibilitychange', ubahVisibilitas)
})
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengumuman.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
      <template #actions><button type="button" class="ca-btn-primary" @click="bukaBaru">{{ tcf('pengumuman.buat') }}</button></template>
    </ConsolePageHeader>
    <div class="flex items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
      <span>{{ tcf('pengumuman.jumlah')(rows.length, aktif) }}</span>
      <span class="inline-flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full" :class="hubungan === 'tersambung' ? 'bg-emerald-600' : 'bg-[var(--ca-subtle)]'" />{{ tcf(`pengumuman.koneksi.${hubungan}`) }}</span>
    </div>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <div class="ca-console-dialog overflow-hidden [&_tbody_tr]:!cursor-default">
      <DataTable :columns="kolom" :data="rows" :loading="memuat" :show-count="false" :empty-text="tcf('pengumuman.kosong')" empty-icon="lucide:megaphone">
        <template #cell-judul="{ row }"><div class="max-w-md"><strong>{{ row.judul }}</strong><p class="mt-1 whitespace-pre-wrap text-xs text-[var(--ca-muted)]">{{ row.isi }}</p><span v-if="row.tombol" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ row.tombol }} · {{ domain(row.url) }}</span></div></template>
        <template #cell-penerima="{ row }"><span class="block text-xs">{{ labelPenerima(row) }}</span><span class="block text-xs text-[var(--ca-muted)]">{{ row.jumlahPenerima ?? '—' }} pengguna</span><span v-if="row.namaKelompok.length" class="block max-w-48 text-xs text-[var(--ca-muted)]">{{ row.namaKelompok.join(', ') }}</span></template>
        <template #cell-level="{ row }">{{ labelLevel(row.level) }}</template>
        <template #cell-status="{ row }"><span class="ca-pill-muted whitespace-nowrap text-xs">{{ tcf(`pengumuman.status.${statusPengumuman(row, jam)}`) }}</span></template>
        <template #cell-mulai="{ row }"><span class="whitespace-nowrap text-xs tabular-nums">{{ waktu(row.mulai) }}</span></template>
        <template #cell-sampai="{ row }"><span class="whitespace-nowrap text-xs tabular-nums">{{ waktu(row.sampai) }}</span></template>
        <template #cell-aksi="{ row }"><div class="flex items-center justify-end gap-2"><button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" @click.stop="sunting(row)">{{ tcf('pengumuman.sunting') }}</button><button v-if="pengumumanBelumBerakhir(row, jam)" type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" @click.stop="mintaHentikan(row)">{{ tcf('pengumuman.hentikan') }}</button></div></template>
      </DataTable>
    </div>

    <ConsoleModal :show="bukaForm" :title="tcf(menyunting ? 'pengumuman.suntingJudul' : 'pengumuman.buat')" size="xl" @close="tutupForm">
      <form @submit.prevent="simpan">
        <fieldset :disabled="menyimpan" class="grid min-w-0 gap-6 md:grid-cols-[1.2fr_1fr]">
          <div class="min-w-0 space-y-4">
            <CashflowPengumumanPenerima v-if="bukaForm" :key="f.id" :jenis="f.penerima" v-model:pengguna="f.pengguna" v-model:kelompok="f.kelompok" :disabled="menyimpan" @update:jenis="gantiPenerima" @sibuk="penerimaSibuk = $event" />
            <label for="cf-p-judul" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.judulKolom') }}<input id="cf-p-judul" v-model="f.judul" class="ca-input mt-2 w-full" maxlength="80" required></label>
            <label for="cf-p-isi" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.isi') }}<textarea id="cf-p-isi" v-model="f.isi" rows="4" class="ca-input mt-2 w-full" maxlength="500" required /></label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label for="cf-p-level" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.level') }}<select id="cf-p-level" v-model="f.level" class="ca-input mt-2 w-full"><option v-for="l in LEVEL_PENGUMUMAN" :key="l" :value="l">{{ labelLevel(l) }}</option></select></label>
              <label for="cf-p-mulai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.mulaiWib') }}<input id="cf-p-mulai" v-model="f.mulai" type="datetime-local" class="ca-input mt-2 w-full" required></label>
            </div>
            <label for="cf-p-sampai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.sampaiWib') }}<input id="cf-p-sampai" v-model="f.sampai" type="datetime-local" class="ca-input mt-2 w-full"></label>
            <fieldset class="space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3">
              <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.tombolOpsional') }}</legend>
              <label for="cf-p-tombol" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.tombolLabel') }}<input id="cf-p-tombol" v-model="f.tombol" class="ca-input mt-2 w-full" maxlength="40"></label>
              <label for="cf-p-url" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.urlLabel') }}<input id="cf-p-url" v-model="f.url" type="url" class="ca-input mt-2 w-full" maxlength="2048" placeholder="https://"></label>
            </fieldset>
            <label for="cf-p-alasan" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.alasan') }}<input id="cf-p-alasan" v-model="f.alasan" class="ca-input mt-2 w-full" minlength="8" required></label>
          </div>
          <div class="min-w-0"><h4 class="mb-3 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjau') }}</h4><CashflowPengumumanPratinjau :judul="f.judul" :isi="f.isi" :level="f.level" :tombol="f.tombol" :url="f.url" /></div>
        </fieldset>
        <div v-if="basi" class="mt-4 flex flex-wrap items-center gap-2 text-sm ca-tone-warning" role="alert"><span>{{ tcf('pengumuman.basi') }}</span><button v-if="versiTerbaru" type="button" class="ca-btn-secondary text-xs" @click="sunting(versiTerbaru)">{{ tcf('pengumuman.muatVersi') }}</button></div>
        <div class="mt-6 flex justify-end gap-2 border-t border-[color:var(--ca-border)] pt-4"><button type="button" class="ca-btn-secondary" :disabled="menyimpan" @click="tutupForm">{{ tcf('umum.batal') }}</button><button type="submit" class="ca-btn-primary" :disabled="menyimpan || basi || penerimaSibuk || !penerimaSah(f.penerima, f.pengguna, f.kelompok)">{{ tcf(menyimpan ? 'pengumuman.menyimpan' : menyunting ? 'pengumuman.simpanPerubahan' : 'umum.simpan') }}</button></div>
      </form>
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
