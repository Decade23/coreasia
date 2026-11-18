<script setup lang="ts">
/**
 * Form templat pengumuman rutin (spek console 19 Nov 2026, K5, PR-01) dengan
 * pola CashflowPaketForm: galat per kolom dengan aria-invalid, sisa huruf,
 * galat server menempel di kolomnya, isian awal disalin sekali saat dipasang.
 *
 * Pratinjau = kartu di Beranda (gaya kartu, aplikasi 1.4.4), bentuk yang
 * benar-benar dipakai jadwal saat menerbitkan. Akun internal selalu
 * dikecualikan (kotaknya terkunci, server juga memaksanya). Batas yang
 * ditambah server saat terbit ditulis di bawah pratinjau.
 *
 * Komponen ini tidak memanggil server.
 */
import {
  BOBOT_MAKS, BOBOT_MIN, JAM_AKHIR_MAKS, JAM_AKHIR_MIN, JAM_MULAI_MAKS, JAM_MULAI_MIN, JEDA_MAKS, JEDA_MIN, KOLOM_RUTIN, TOPIK_RUTIN,
  jamTampil, periksaIsianRutin,
  type GalatRutin, type IsianRutin, type KolomRutin, type MuatanRutin,
} from '~/adapters/cashflowPengumumanRutin'
import { ISI_MAKS, JUDUL_MAKS, TOMBOL_MAKS, panjangHuruf } from '~/adapters/cashflowPengumumanForm'
import { labelVersi } from '~/adapters/cashflowPengumumanAturan'
import { NAMA_TAUTAN_DALAM, TAUTAN_DALAM } from '~/adapters/cashflowPengumumanTautan'

const props = defineProps<{
  show: boolean
  mode: 'baru' | 'ubah'
  isianAwal: IsianRutin
  galatServer: GalatRutin
  sibuk: boolean
  basi: boolean
  /** versi_min dan umur minimal yang ditambah server saat terbit. */
  versiMin: number
  umurMinHari: number
}>()
const emit = defineEmits<{ simpan: [muatan: MuatanRutin]; tutup: []; muatVersi: [] }>()
const { tcf } = useCashflowI18n()

const f = reactive<IsianRutin>({ ...props.isianAwal, saring: { ...props.isianAwal.saring }, kecualiPengguna: [...props.isianAwal.kecualiPengguna], kecualiKelompok: [...props.isianAwal.kecualiKelompok] })
const disentuh = reactive(new Set<KolomRutin>())
const dicoba = ref(false)
const galatServerLokal = ref<GalatRutin>({ ...props.galatServer })
watch(() => props.galatServer, (g) => { galatServerLokal.value = { ...g } })
const kecualiSibuk = ref(false)

const hasil = computed(() => periksaIsianRutin(f))
const galatKolom = (k: KolomRutin): string => {
  const server = galatServerLokal.value[k]
  if (server) return tcf(`pengumuman.rutin.galat.${server}`)
  const lokal = hasil.value.galat[k]
  return lokal && (dicoba.value || disentuh.has(k)) ? tcf(`pengumuman.rutin.galat.${lokal}`) : ''
}
const tinggal = (k: KolomRutin) => { disentuh.add(k) }
const ubah = (k: KolomRutin) => {
  disentuh.add(k)
  if (galatServerLokal.value[k]) galatServerLokal.value = { ...galatServerLokal.value, [k]: undefined }
}
const ID: Record<KolomRutin, string> = Object.fromEntries(KOLOM_RUTIN.map(k => [k, `cf-rt-${k.replace(/_/g, '-')}`])) as Record<KolomRutin, string>
const idGalat = (k: KolomRutin) => `${ID[k]}-galat`
const sisa = (nilai: string, maks: number) => maks - panjangHuruf(nilai.trim())
const sisaJudul = computed(() => sisa(f.judul, JUDUL_MAKS))
const sisaIsi = computed(() => sisa(f.isi, ISI_MAKS))
const sisaTombol = computed(() => sisa(f.tombol, TOMBOL_MAKS))
const JAM_MULAI = Array.from({ length: JAM_MULAI_MAKS - JAM_MULAI_MIN + 1 }, (_, i) => JAM_MULAI_MIN + i)
const JAM_AKHIR = Array.from({ length: JAM_AKHIR_MAKS - JAM_AKHIR_MIN + 1 }, (_, i) => JAM_AKHIR_MIN + i)
const galatSaringTampil = computed(() => (dicoba.value || disentuh.has('saring') ? hasil.value.galatSaring : []))
const versiKartu = computed(() => labelVersi(props.versiMin))

const kirim = () => {
  if (props.sibuk || props.basi || kecualiSibuk.value) return
  dicoba.value = true
  const h = hasil.value
  if (!h.muatan) {
    const pertama = KOLOM_RUTIN.find(k => h.galat[k] || galatServerLokal.value[k])
    if (pertama && import.meta.client) document.getElementById(ID[pertama])?.focus()
    return
  }
  emit('simpan', h.muatan)
}
const tutup = () => { if (!props.sibuk) emit('tutup') }
</script>

<template>
  <ConsoleModal :show="show" :title="mode === 'ubah' ? tcf('pengumuman.rutin.suntingJudul') : tcf('pengumuman.rutin.buatJudul')" size="xl" @close="tutup">
    <form novalidate data-uji="form-rutin" @submit.prevent="kirim">
      <fieldset :disabled="sibuk" class="grid min-w-0 gap-6 md:grid-cols-[1.2fr_1fr]">
        <div class="min-w-0 space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label :for="ID.topik" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.topik') }}</label>
              <select :id="ID.topik" v-model="f.topik" class="ca-input mt-2 w-full" :aria-invalid="galatKolom('topik') ? 'true' : undefined" :aria-describedby="`${ID.topik}-ket ${idGalat('topik')}`" @change="ubah('topik')">
                <option v-for="t in TOPIK_RUTIN" :key="t" :value="t">{{ tcf(`pengumuman.rutin.topikOpsi.${t}`) }}</option>
              </select>
              <p :id="`${ID.topik}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.topikKet') }}</p>
              <p v-if="galatKolom('topik')" :id="idGalat('topik')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('topik') }}</p>
            </div>
            <label class="flex min-h-11 items-start gap-3 self-end rounded-xl border border-[color:var(--ca-border)] p-3 text-sm text-[var(--ca-text)]">
              <input v-model="f.aktif" type="checkbox" class="mt-1 h-4 w-4 shrink-0" data-uji="rutin-aktif">
              <span><span class="font-semibold">{{ tcf('pengumuman.rutin.aktif') }}</span><span class="block text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.aktifKet') }}</span></span>
            </label>
          </div>

          <div>
            <label :for="ID.judul" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.judulKolom') }}</label>
            <input
              :id="ID.judul" v-model="f.judul" type="text" class="ca-input mt-2 w-full" autocomplete="off"
              :aria-invalid="galatKolom('judul') ? 'true' : undefined" :aria-describedby="`${ID.judul}-ket ${idGalat('judul')}`"
              @blur="tinggal('judul')" @input="ubah('judul')"
            >
            <p :id="`${ID.judul}-ket`" class="mt-1 text-right text-xs tabular-nums text-[var(--ca-subtle)]" :class="sisaJudul < 0 ? 'ca-tone-danger' : ''">{{ sisaJudul < 0 ? tcf('paket.form.lebihHuruf')(-sisaJudul) : tcf('paket.form.sisaHuruf')(sisaJudul) }}</p>
            <p v-if="galatKolom('judul')" :id="idGalat('judul')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('judul') }}</p>
          </div>
          <div>
            <label :for="ID.isi" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.isi') }}</label>
            <textarea
              :id="ID.isi" v-model="f.isi" rows="5" class="ca-input mt-2 w-full"
              :aria-invalid="galatKolom('isi') ? 'true' : undefined" :aria-describedby="`${ID.isi}-ket ${idGalat('isi')}`"
              @blur="tinggal('isi')" @input="ubah('isi')"
            />
            <p :id="`${ID.isi}-ket`" class="mt-1 flex flex-wrap justify-between gap-2 text-xs text-[var(--ca-subtle)]">
              <span>{{ tcf('pengumuman.rutin.isiKet') }}</span>
              <span class="tabular-nums" :class="sisaIsi < 0 ? 'ca-tone-danger' : ''">{{ sisaIsi < 0 ? tcf('paket.form.lebihHuruf')(-sisaIsi) : tcf('paket.form.sisaHuruf')(sisaIsi) }}</span>
            </p>
            <p v-if="galatKolom('isi')" :id="idGalat('isi')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('isi') }}</p>
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

          <div class="grid gap-3 sm:grid-cols-4">
            <div>
              <label :for="ID.jeda" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.jeda') }}</label>
              <input
                :id="ID.jeda" v-model="f.jedaHari" type="number" :min="JEDA_MIN" :max="JEDA_MAKS" step="1" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums"
                :aria-invalid="galatKolom('jeda') ? 'true' : undefined" :aria-describedby="`${ID.jeda}-ket ${idGalat('jeda')}`" @blur="tinggal('jeda')" @input="ubah('jeda')"
              >
              <p :id="`${ID.jeda}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.jedaKet') }}</p>
              <p v-if="galatKolom('jeda')" :id="idGalat('jeda')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('jeda') }}</p>
            </div>
            <div>
              <label :for="ID.jam_mulai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.jamMulai') }}</label>
              <select :id="ID.jam_mulai" v-model="f.jamMulai" class="ca-input mt-2 w-full tabular-nums" :aria-invalid="galatKolom('jam_mulai') ? 'true' : undefined" :aria-describedby="idGalat('jam_mulai')" @change="ubah('jam_mulai'); ubah('jam_akhir')">
                <option v-for="j in JAM_MULAI" :key="j" :value="String(j)">{{ jamTampil(j) }}</option>
              </select>
              <p v-if="galatKolom('jam_mulai')" :id="idGalat('jam_mulai')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('jam_mulai') }}</p>
            </div>
            <div>
              <label :for="ID.jam_akhir" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.jamAkhir') }}</label>
              <select :id="ID.jam_akhir" v-model="f.jamAkhir" class="ca-input mt-2 w-full tabular-nums" :aria-invalid="galatKolom('jam_akhir') ? 'true' : undefined" :aria-describedby="idGalat('jam_akhir')" @change="ubah('jam_akhir')">
                <option v-for="j in JAM_AKHIR" :key="j" :value="String(j)">{{ jamTampil(j) }}</option>
              </select>
              <p v-if="galatKolom('jam_akhir')" :id="idGalat('jam_akhir')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('jam_akhir') }}</p>
            </div>
            <div>
              <label :for="ID.bobot" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.bobot') }}</label>
              <input
                :id="ID.bobot" v-model="f.bobot" type="number" :min="BOBOT_MIN" :max="BOBOT_MAKS" step="1" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums"
                :aria-invalid="galatKolom('bobot') ? 'true' : undefined" :aria-describedby="`${ID.bobot}-ket ${idGalat('bobot')}`" @blur="tinggal('bobot')" @input="ubah('bobot')"
              >
              <p :id="`${ID.bobot}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.bobotKet') }}</p>
              <p v-if="galatKolom('bobot')" :id="idGalat('bobot')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('bobot') }}</p>
            </div>
          </div>

          <fieldset :id="ID.saring" class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" :aria-invalid="galatKolom('saring') ? 'true' : undefined" :aria-describedby="idGalat('saring')" tabindex="-1">
            <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.saringJudul') }}</legend>
            <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.saringKet') }}</p>
            <CashflowPengumumanSaringan v-model="f.saring" :galat="galatSaringTampil" :disabled="sibuk" @update:model-value="ubah('saring')" />
            <p v-if="galatKolom('saring')" :id="idGalat('saring')" class="text-xs ca-tone-danger" role="alert">{{ galatKolom('saring') }}</p>
          </fieldset>
          <CashflowPengumumanKecuali
            :internal="true" internal-tetap :pengguna="f.kecualiPengguna" :kelompok="f.kecualiKelompok" :disabled="sibuk" :galat="galatKolom('kecuali')"
            @update:pengguna="f.kecualiPengguna = $event; ubah('kecuali')" @update:kelompok="f.kecualiKelompok = $event; ubah('kecuali')" @sibuk="kecualiSibuk = $event"
          />

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

        <div class="min-w-0 space-y-3">
          <h4 class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.pratinjau') }}</h4>
          <CashflowPengumumanPratinjau :judul="f.judul" :isi="f.isi" level="info" :tombol="f.tombol" :url="f.url" gaya="kartu" />
          <div class="rounded-xl border border-[color:var(--ca-border)] p-3 text-xs text-[var(--ca-muted)]" data-uji="rutin-otomatis">
            <p class="font-semibold text-[var(--ca-text)]">{{ tcf('pengumuman.rutin.otomatisJudul') }}</p>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li>{{ tcf('pengumuman.rutin.otomatisJam')(jamTampil(Number(f.jamMulai) || 0), jamTampil(Number(f.jamAkhir) || 0)) }}</li>
              <li>{{ tcf('pengumuman.rutin.otomatisInternal') }}</li>
              <li>{{ tcf('pengumuman.rutin.otomatisUmur')(umurMinHari) }}</li>
              <li>{{ tcf('pengumuman.rutin.otomatisVersi')(versiKartu) }}</li>
            </ul>
          </div>
        </div>
      </fieldset>

      <p v-if="dicoba && !hasil.muatan" class="mt-4 text-sm ca-tone-danger" role="alert">{{ tcf('pengumuman.form.periksaIsian') }}</p>
      <div v-if="basi" class="mt-4 flex flex-wrap items-center gap-2 text-sm ca-tone-warning" role="alert">
        <span>{{ tcf('pengumuman.rutin.basi') }}</span>
        <button type="button" class="ca-btn-secondary text-xs" :disabled="sibuk" @click="emit('muatVersi')">{{ tcf('pengumuman.muatVersi') }}</button>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-[color:var(--ca-border)] pt-4">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
        <button type="submit" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk || basi || kecualiSibuk">
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ sibuk ? tcf('pengumuman.menyimpan') : tcf('pengumuman.rutin.simpan') }}
        </button>
      </div>
    </form>
  </ConsoleModal>
</template>
