<script setup lang="ts">
/**
 * Form buat dan sunting pengumuman (spek console 19 Nov 2026, K8, PF-01),
 * dengan pola CashflowPaketForm: galat per kolom dengan aria-invalid, sisa
 * huruf, galat server yang menempel di kolomnya, dan isian awal yang disalin
 * sekali saat dipasang (halaman memberi :key baru setiap kali form dibuka).
 *
 * Pemeriksaan isian = periksaIsianPengumuman (adapter), aturan yang sama
 * dengan pengumuman_periksa di server. Galat tampil sesudah kolom diubah atau
 * ditinggalkan, atau sesudah Simpan ditekan. Galat server (hint) menempel di
 * kolomnya sampai kolom itu diubah.
 *
 * Penerima: jenis lama, aturan, dan pengecualian di SEMUA mode (PF-03,
 * CashflowPengumumanKecuali). Pengecualian di mode lama hanya ditawarkan bila
 * server sudah memasang saringan baru (`kecualiAktif`). Gaya kartu hanya bisa
 * dipilih bila server sudah punya kolom gaya (`gayaAda`).
 *
 * Komponen ini tidak menyimpan. Halaman yang memeriksa versi lalu memanggil
 * RPC simpan (v5, v4, atau v3 sesuai server).
 */
import { LEVEL_PENGUMUMAN } from '~/adapters/cashflow'
import {
  GAYA_PENGUMUMAN, ISI_MAKS, JUDUL_MAKS, KOLOM_PENGUMUMAN, TOMBOL_MAKS, adaKecuali, panjangHuruf, penerimaKirim, periksaIsianPengumuman,
  type GalatPengumuman, type IsianPengumuman, type KolomPengumuman, type MuatanPengumuman, type PenerimaIsian, type PenerimaKirim,
} from '~/adapters/cashflowPengumumanForm'
import type { Aturan, AturanDTO } from '~/adapters/cashflowPengumumanAturan'
import { NAMA_TAUTAN_DALAM, TAUTAN_DALAM } from '~/adapters/cashflowPengumumanTautan'
import type { JenisPenerima } from '~/adapters/cashflowPengumuman'

const props = defineProps<{
  show: boolean
  mode: 'baru' | 'ubah'
  isianAwal: IsianPengumuman
  penerimaAwal: PenerimaIsian & { aturanAwal: Aturan | null }
  galatServer: GalatPengumuman
  sibuk: boolean
  basi: boolean
  /** Server punya RPC v4: pilihan aturan dan pratinjau penerima ditawarkan. */
  sasaranAktif: boolean
  /** Server punya saringan baru (T3): pengecualian ditawarkan di semua mode. */
  kecualiAktif: boolean
  /** Server punya simpan v5: pilihan gaya ditawarkan. */
  gayaAktif: boolean
  /** Kolom gaya sudah ada (T4): kartu bisa dipilih. */
  gayaAda: boolean
}>()
const emit = defineEmits<{ simpan: [muatan: MuatanPengumuman, penerima: PenerimaKirim]; tutup: []; muatVersi: [] }>()
const { tcf } = useCashflowI18n()

const f = reactive<IsianPengumuman>({ ...props.isianAwal })
const p = reactive<PenerimaIsian>({
  jenis: props.penerimaAwal.jenis, pengguna: [...props.penerimaAwal.pengguna], kelompok: [...props.penerimaAwal.kelompok],
  aturan: props.penerimaAwal.aturan, kecuali: { ...props.penerimaAwal.kecuali, pengguna: [...props.penerimaAwal.kecuali.pengguna], kelompok: [...props.penerimaAwal.kecuali.kelompok] },
})
const disentuh = reactive(new Set<KolomPengumuman>())
const dicoba = ref(false)
const galatServerLokal = ref<GalatPengumuman>({ ...props.galatServer })
watch(() => props.galatServer, (g) => { galatServerLokal.value = { ...g } })
const penerimaSibuk = ref(false)
const kecualiSibuk = ref(false)

const kirimPenerima = computed(() => penerimaKirim(p))
const hasil = computed(() => periksaIsianPengumuman(f, { gayaAda: props.gayaAda, penerimaOk: kirimPenerima.value !== null }))
const galatKolom = (k: KolomPengumuman): string => {
  const server = galatServerLokal.value[k]
  if (server) return tcf(`pengumuman.form.galat.${server}`)
  const lokal = hasil.value.galat[k]
  return lokal && (dicoba.value || disentuh.has(k)) ? tcf(`pengumuman.form.galat.${lokal}`) : ''
}
const tinggal = (k: KolomPengumuman) => { disentuh.add(k) }
/** Kolom yang diubah melepas galat server miliknya dan langsung dinilai (lihat CashflowPaketForm). */
const ubah = (k: KolomPengumuman) => {
  disentuh.add(k)
  if (galatServerLokal.value[k]) galatServerLokal.value = { ...galatServerLokal.value, [k]: undefined }
}
const ID: Record<KolomPengumuman, string> = Object.fromEntries(KOLOM_PENGUMUMAN.map(k => [k, `cf-p-${k}`])) as Record<KolomPengumuman, string>
const idGalat = (k: KolomPengumuman) => `${ID[k]}-galat`
const sisa = (nilai: string, maks: number) => maks - panjangHuruf(nilai.trim())
const sisaJudul = computed(() => sisa(f.judul, JUDUL_MAKS))
const sisaIsi = computed(() => sisa(f.isi, ISI_MAKS))
const sisaTombol = computed(() => sisa(f.tombol, TOMBOL_MAKS))
const labelLevel = (level: string) => (tcf('pengumuman.levelOpsi') as unknown as Record<string, string>)[level] ?? level

// ── Penerima ────────────────────────────────────────────────────────────
const gantiJenis = (jenis: JenisPenerima) => {
  p.jenis = jenis
  if (jenis === 'single') p.pengguna = p.pengguna.slice(0, 1)
  if (jenis === 'all' || jenis === 'groups' || jenis === 'aturan') p.pengguna = []
  if (jenis !== 'groups') p.kelompok = []
  if (jenis !== 'aturan') p.aturan = null
  // Ganti mode belum berarti selesai memilih: galat lokal baru muncul sesudah
  // memilih orang atau kelompok, atau sesudah Simpan. Galat server dilepas.
  if (galatServerLokal.value.penerima) galatServerLokal.value = { ...galatServerLokal.value, penerima: undefined }
}
const pakaiAturan = (a: AturanDTO | null) => { p.aturan = a; ubah('penerima') }
/** Pengecualian di mode lama: hanya bila server mendukung dan modenya bukan aturan (editor aturan punya sendiri). */
const tampilKecuali = computed(() => props.kecualiAktif && p.jenis !== 'aturan')
watch(tampilKecuali, (t) => { if (!t) p.kecuali = { internal: false, pengguna: [], kelompok: [] } })
const ketKecuali = computed(() => (p.jenis === 'all' && adaKecuali(p.kecuali) ? tcf('pengumuman.form.kecualiSemuaKet') : tcf('pengumuman.form.kecualiKet')))

// ── Pratinjau penerima (server baru saja, selagi form terbuka) ──────────
const pratinjau = useCashflowPratinjauPenerima(
  () => (kirimPenerima.value ? { jenis: kirimPenerima.value.penerima, pengguna: kirimPenerima.value.pengguna, kelompok: kirimPenerima.value.kelompok, aturan: kirimPenerima.value.aturan } : null),
  () => props.show && props.sasaranAktif,
)

const kirim = () => {
  if (props.sibuk || props.basi || penerimaSibuk.value || kecualiSibuk.value) return
  dicoba.value = true
  const h = hasil.value
  const pk = kirimPenerima.value
  if (!h.muatan || !pk) {
    // Fokus ke kolom pertama yang salah, supaya pembaca layar langsung mendengarnya.
    const pertama = KOLOM_PENGUMUMAN.find(k => h.galat[k] || galatServerLokal.value[k])
    if (pertama && import.meta.client) document.getElementById(pertama === 'penerima' ? 'cf-p-penerima' : ID[pertama])?.focus()
    return
  }
  emit('simpan', h.muatan, pk)
}
const tutup = () => { if (!props.sibuk) emit('tutup') }
</script>

<template>
  <ConsoleModal :show="show" :title="mode === 'ubah' ? tcf('pengumuman.suntingJudul') : tcf('pengumuman.buat')" size="xl" @close="tutup">
    <form novalidate data-uji="form-pengumuman" @submit.prevent="kirim">
      <fieldset :disabled="sibuk" class="grid min-w-0 gap-6 md:grid-cols-[1.2fr_1fr]">
        <div class="min-w-0 space-y-4">
          <div :aria-invalid="galatKolom('penerima') ? 'true' : undefined" :aria-describedby="idGalat('penerima')" class="min-w-0 space-y-3">
            <CashflowPengumumanPenerima
              :jenis="p.jenis" :pengguna="p.pengguna" :kelompok="p.kelompok" :disabled="sibuk" :aturan-aktif="sasaranAktif" :aturan-awal="penerimaAwal.aturanAwal"
              :ada-kecuali="tampilKecuali && adaKecuali(p.kecuali)"
              @update:jenis="gantiJenis" @update:pengguna="p.pengguna = $event; ubah('penerima')" @update:kelompok="p.kelompok = $event; ubah('penerima')"
              @update:aturan="pakaiAturan" @sibuk="penerimaSibuk = $event"
            />
            <CashflowPengumumanKecuali
              v-if="tampilKecuali"
              :internal="p.kecuali.internal" :pengguna="p.kecuali.pengguna" :kelompok="p.kecuali.kelompok" :disabled="sibuk" :ket="ketKecuali"
              @update:internal="p.kecuali.internal = $event; ubah('penerima')" @update:pengguna="p.kecuali.pengguna = $event; ubah('penerima')"
              @update:kelompok="p.kecuali.kelompok = $event; ubah('penerima')" @sibuk="kecualiSibuk = $event"
            />
            <p v-if="galatKolom('penerima')" :id="idGalat('penerima')" class="text-xs ca-tone-danger" role="alert">{{ galatKolom('penerima') }}</p>
          </div>

          <div>
            <label :for="ID.judul" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.judulKolom') }}</label>
            <input
              :id="ID.judul" v-model="f.judul" type="text" class="ca-input mt-2 w-full" autocomplete="off"
              :aria-invalid="galatKolom('judul') ? 'true' : undefined" :aria-describedby="`${ID.judul}-ket ${idGalat('judul')}`"
              @blur="tinggal('judul')" @input="ubah('judul')"
            >
            <p :id="`${ID.judul}-ket`" class="mt-1 flex flex-wrap justify-between gap-2 text-xs text-[var(--ca-subtle)]">
              <span>{{ tcf('pengumuman.form.judulKet') }}</span>
              <span class="tabular-nums" :class="sisaJudul < 0 ? 'ca-tone-danger' : ''">{{ sisaJudul < 0 ? tcf('paket.form.lebihHuruf')(-sisaJudul) : tcf('paket.form.sisaHuruf')(sisaJudul) }}</span>
            </p>
            <p v-if="galatKolom('judul')" :id="idGalat('judul')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('judul') }}</p>
          </div>

          <div>
            <label :for="ID.isi" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.isi') }}</label>
            <textarea
              :id="ID.isi" v-model="f.isi" rows="4" class="ca-input mt-2 w-full"
              :aria-invalid="galatKolom('isi') ? 'true' : undefined" :aria-describedby="`${ID.isi}-ket ${idGalat('isi')}`"
              @blur="tinggal('isi')" @input="ubah('isi')"
            />
            <p :id="`${ID.isi}-ket`" class="mt-1 flex flex-wrap justify-between gap-2 text-xs text-[var(--ca-subtle)]">
              <span>{{ tcf('pengumuman.form.isiKet') }}</span>
              <span class="tabular-nums" :class="sisaIsi < 0 ? 'ca-tone-danger' : ''">{{ sisaIsi < 0 ? tcf('paket.form.lebihHuruf')(-sisaIsi) : tcf('paket.form.sisaHuruf')(sisaIsi) }}</span>
            </p>
            <p v-if="galatKolom('isi')" :id="idGalat('isi')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('isi') }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label :for="ID.level" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.level') }}</label>
              <select :id="ID.level" v-model="f.level" class="ca-input mt-2 w-full" :aria-invalid="galatKolom('level') ? 'true' : undefined" :aria-describedby="idGalat('level')" @change="ubah('level')">
                <option v-for="l in LEVEL_PENGUMUMAN" :key="l" :value="l">{{ labelLevel(l) }}</option>
              </select>
              <p v-if="galatKolom('level')" :id="idGalat('level')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('level') }}</p>
            </div>
            <fieldset v-if="gayaAktif" class="min-w-0" :aria-invalid="galatKolom('gaya') ? 'true' : undefined" :aria-describedby="`${ID.gaya}-ket ${idGalat('gaya')}`" data-uji="pilihan-gaya">
              <legend class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.form.gaya') }}</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <label v-for="g in GAYA_PENGUMUMAN" :key="g" class="flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--ca-border)] px-3 text-xs text-[var(--ca-text)]" :class="{ 'opacity-60': g === 'kartu' && !gayaAda }">
                  <input :id="g === 'modal' ? ID.gaya : undefined" v-model="f.gaya" type="radio" name="cf-p-gaya" :value="g" class="accent-[var(--ca-accent)]" :disabled="g === 'kartu' && !gayaAda" @change="ubah('gaya')">
                  {{ tcf(`pengumuman.form.gayaOpsi.${g}`) }}
                </label>
              </div>
              <p :id="`${ID.gaya}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ gayaAda ? tcf(`pengumuman.form.gayaKet.${f.gaya}`) : tcf('pengumuman.form.gayaBelumAdaKet') }}</p>
              <p v-if="galatKolom('gaya')" :id="idGalat('gaya')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('gaya') }}</p>
            </fieldset>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label :for="ID.mulai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.mulaiWib') }}</label>
              <input
                :id="ID.mulai" v-model="f.mulai" type="datetime-local" class="ca-input mt-2 w-full"
                :aria-invalid="galatKolom('mulai') ? 'true' : undefined" :aria-describedby="idGalat('mulai')" @blur="tinggal('mulai')" @input="ubah('mulai')"
              >
              <p v-if="galatKolom('mulai')" :id="idGalat('mulai')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('mulai') }}</p>
            </div>
            <div>
              <label :for="ID.sampai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.sampaiWib') }}</label>
              <input
                :id="ID.sampai" v-model="f.sampai" type="datetime-local" class="ca-input mt-2 w-full"
                :aria-invalid="galatKolom('sampai') ? 'true' : undefined" :aria-describedby="idGalat('sampai')" @blur="tinggal('sampai')" @input="ubah('sampai')"
              >
              <p v-if="galatKolom('sampai')" :id="idGalat('sampai')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('sampai') }}</p>
            </div>
          </div>

          <fieldset class="space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3">
            <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.tombolOpsional') }}</legend>
            <div>
              <label :for="ID.tombol" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.tombolLabel') }}</label>
              <input
                :id="ID.tombol" v-model="f.tombol" type="text" class="ca-input mt-2 w-full" autocomplete="off"
                :aria-invalid="galatKolom('tombol') ? 'true' : undefined" :aria-describedby="`${ID.tombol}-ket ${idGalat('tombol')}`"
                @blur="tinggal('tombol')" @input="ubah('tombol')"
              >
              <p :id="`${ID.tombol}-ket`" class="mt-1 text-right text-xs tabular-nums text-[var(--ca-subtle)]" :class="sisaTombol < 0 ? 'ca-tone-danger' : ''">{{ sisaTombol < 0 ? tcf('paket.form.lebihHuruf')(-sisaTombol) : tcf('paket.form.sisaHuruf')(sisaTombol) }}</p>
              <p v-if="galatKolom('tombol')" :id="idGalat('tombol')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('tombol') }}</p>
            </div>
            <div>
              <label :for="ID.url" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.urlLabel') }}</label>
              <input
                :id="ID.url" v-model="f.url" type="url" class="ca-input mt-2 w-full" maxlength="2048" placeholder="https://" autocomplete="off"
                :aria-invalid="galatKolom('url') ? 'true' : undefined" :aria-describedby="`${ID.url}-ket ${idGalat('url')}`" @blur="tinggal('url')" @input="ubah('url')"
              >
              <div class="mt-2 flex flex-wrap items-center gap-2" role="group" :aria-label="tcf('pengumuman.form.tautanDalam')">
                <span class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.form.tautanDalam') }}</span>
                <button v-for="d in TAUTAN_DALAM" :key="d" type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1 text-xs" :aria-pressed="f.url.trim() === d" :data-uji="`tautan-${d.slice(11)}`" @click="f.url = d; ubah('url')">{{ NAMA_TAUTAN_DALAM[d] }}</button>
              </div>
              <p :id="`${ID.url}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.form.urlKet') }}</p>
              <p v-if="galatKolom('url')" :id="idGalat('url')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('url') }}</p>
            </div>
          </fieldset>

          <div>
            <label :for="ID.alasan" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.alasan') }}</label>
            <input
              :id="ID.alasan" v-model="f.alasan" type="text" class="ca-input mt-2 w-full" autocomplete="off"
              :aria-invalid="galatKolom('alasan') ? 'true' : undefined" :aria-describedby="`${ID.alasan}-ket ${idGalat('alasan')}`"
              @blur="tinggal('alasan')" @input="ubah('alasan')"
            >
            <p :id="`${ID.alasan}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.form.alasanKet') }}</p>
            <p v-if="galatKolom('alasan')" :id="idGalat('alasan')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('alasan') }}</p>
          </div>
        </div>

        <div class="min-w-0 space-y-4">
          <div>
            <h4 class="mb-3 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjau') }}</h4>
            <CashflowPengumumanPratinjau :judul="f.judul" :isi="f.isi" :level="f.level" :tombol="f.tombol" :url="f.url" :gaya="gayaAktif ? f.gaya : 'modal'" />
          </div>
          <CashflowPengumumanPratinjauPenerima v-if="sasaranAktif" :data="pratinjau.data.value" :memuat="pratinjau.memuat.value" :pesan-galat="pratinjau.pesanGalat.value" :belum-aktif="pratinjau.belumAktif.value" :lengkap="pratinjau.lengkap.value" />
        </div>
      </fieldset>

      <p v-if="dicoba && (!hasil.muatan || !kirimPenerima)" class="mt-4 text-sm ca-tone-danger" role="alert">{{ tcf('pengumuman.form.periksaIsian') }}</p>
      <div v-if="basi" class="mt-4 flex flex-wrap items-center gap-2 text-sm ca-tone-warning" role="alert">
        <span>{{ tcf('pengumuman.basi') }}</span>
        <button type="button" class="ca-btn-secondary text-xs" :disabled="sibuk" @click="emit('muatVersi')">{{ tcf('pengumuman.muatVersi') }}</button>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-[color:var(--ca-border)] pt-4">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
        <button type="submit" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk || basi || penerimaSibuk || kecualiSibuk">
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ tcf(sibuk ? 'pengumuman.menyimpan' : mode === 'ubah' ? 'pengumuman.simpanPerubahan' : 'umum.simpan') }}
        </button>
      </div>
    </form>
  </ConsoleModal>
</template>
