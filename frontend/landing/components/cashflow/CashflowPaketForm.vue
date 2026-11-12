<script setup lang="ts">
/**
 * Form tambah dan ubah paket kredit, dengan pratinjau seperti di aplikasi.
 *
 * Pemeriksaan isian = periksaIsian (adapter), aturan yang sama dengan CHECK
 * server. Galat tampil per kolom sesudah kolom itu diubah atau ditinggalkan,
 * atau sesudah Simpan ditekan. Galat server (22023 paket_tidak_sah, hint = kolom,
 * atau produk Play yang dipakai paket lain) datang lewat `galatServer` dan
 * menempel di kolomnya sampai kolom itu diubah.
 *
 * Produk Google Play: id produk di Play Console, boleh kosong. Harganya diatur
 * di Play Console, jadi form hanya mengingatkan supaya sama dengan harga normal.
 *
 * Komponen ini tidak memanggil server. Halaman yang membaca ulang daftar,
 * menolak kode yang sudah dipakai, memeriksa versi, lalu menyimpan.
 * Isian disalin dari `isianAwal` saat dipasang: halaman memberi :key baru
 * setiap kali form dibuka.
 */
import { rupiah } from '~/adapters/cashflow'
import {
  KOLOM_PAKET, LABEL_MAKS, PLAY_PRODUK_MAKS, hargaSaatPromo, hargaTampil, paketDariIsian, panjangHuruf, periksaIsian,
  type GalatIsian, type IsianPaket, type KolomPaket, type MuatanPaket, type PaketKredit,
} from '~/adapters/cashflowPaket'

const props = defineProps<{
  show: boolean
  mode: 'baru' | 'ubah'
  isianAwal: IsianPaket
  asal: PaketKredit | null
  /** Kode paket lain (hanya untuk mode baru). */
  kodeLain: readonly string[]
  /** Id produk Play milik paket lain (unik di server). */
  playLain: readonly string[]
  galatServer: GalatIsian
  sibuk: boolean
  basi: boolean
  kini: number
}>()
const emit = defineEmits<{ simpan: [muatan: MuatanPaket]; tutup: []; muatVersi: [] }>()
const { tcf, formatTanggal, formatJam } = useCashflowI18n()

const f = reactive<IsianPaket>({ ...props.isianAwal })
const disentuh = reactive(new Set<KolomPaket>())
const dicoba = ref(false)
const galatServerLokal = ref<GalatIsian>({ ...props.galatServer })
watch(() => props.galatServer, (g) => { galatServerLokal.value = { ...g } })

const hasil = computed(() => periksaIsian(f, { kodeTerpakai: props.mode === 'baru' ? props.kodeLain : [], playTerpakai: props.playLain, asal: props.asal }))
const galatKolom = (k: KolomPaket): string => {
  const server = galatServerLokal.value[k]
  if (server) return tcf(`paket.galat.${server}`)
  const lokal = hasil.value.galat[k]
  return lokal && (dicoba.value || disentuh.has(k)) ? tcf(`paket.galat.${lokal}`) : ''
}
const tinggal = (k: KolomPaket) => { disentuh.add(k) }
/**
 * Kolom yang diubah melepas galat server miliknya dan langsung dinilai.
 * Galatnya muncul sambil mengetik, bukan saat kolom ditinggalkan: blur
 * terjadi di mousedown klik berikutnya, dan baris galat yang baru muncul
 * menggeser tata letak sebelum mouseup sehingga klik itu hilang.
 */
const ubah = (k: KolomPaket) => {
  disentuh.add(k)
  if (galatServerLokal.value[k]) galatServerLokal.value = { ...galatServerLokal.value, [k]: undefined }
}
const ID: Record<KolomPaket, string> = Object.fromEntries(KOLOM_PAKET.map(k => [k, `cf-pk-${k.replace(/_/g, '-')}`])) as Record<KolomPaket, string>
const idGalat = (k: KolomPaket) => `${ID[k]}-galat`
const adaPromo = computed(() => f.hargaPromo.trim() !== '')
watch(adaPromo, (ada) => { if (!ada) { f.promoMulai = ''; f.promoSampai = '' } })
const sisaLabel = computed(() => LABEL_MAKS - panjangHuruf(f.label.trim()))
/** Tiga centang; label kamus `paket.form.<isian>` dan `paket.form.<isian>Ket`. */
const CENTANG = [
  { isian: 'aktif', kolom: 'aktif' }, { isian: 'bawaan', kolom: 'bawaan' }, { isian: 'khususUji', kolom: 'khusus_uji' },
] as const satisfies ReadonlyArray<{ isian: keyof IsianPaket; kolom: KolomPaket }>

// Pratinjau dari isian yang sedang diketik.
const pratinjau = computed(() => paketDariIsian(f, props.asal))
const tampilKini = computed(() => hargaTampil(pratinjau.value, props.kini))
const tampilPromo = computed(() => (tampilKini.value.status === 'terjadwal' ? hargaSaatPromo(pratinjau.value) : null))
const waktu = (iso: string | null) => (iso ? `${formatTanggal(iso)} ${formatJam(iso)}` : '')
/** Pengingat harga Play: muncul begitu id produk diisi, dengan harga normal yang sah. */
const adaPlay = computed(() => f.playProdukId.trim() !== '')
const ketHargaPlay = computed(() => (pratinjau.value.harga > 0 && !hasil.value.galat.harga
  ? tcf('paket.form.playHarga')(rupiah(pratinjau.value.harga))
  : tcf('paket.form.playHargaUmum')))

const kirim = () => {
  if (props.sibuk || props.basi) return
  dicoba.value = true
  const h = hasil.value
  if (!h.muatan) {
    // Fokus ke kolom pertama yang salah, supaya pembaca layar langsung mendengarnya.
    const pertama = KOLOM_PAKET.find(k => h.galat[k])
    if (pertama && import.meta.client) document.getElementById(ID[pertama])?.focus()
    return
  }
  emit('simpan', h.muatan)
}
const tutup = () => { if (!props.sibuk) emit('tutup') }
</script>

<template>
  <ConsoleModal :show="show" :title="mode === 'baru' ? tcf('paket.form.judulBaru') : tcf('paket.form.judulUbah')(isianAwal.kode)" size="xl" @close="tutup">
    <form novalidate @submit.prevent="kirim">
      <fieldset :disabled="sibuk" class="grid min-w-0 gap-6 md:grid-cols-[1.25fr_1fr]">
        <div class="min-w-0 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label :for="ID.kode" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.kode') }}</label>
              <input
                :id="ID.kode" v-model="f.kode" type="text" class="ca-input mt-2 w-full font-mono" maxlength="24" autocomplete="off" autocapitalize="off" spellcheck="false"
                :disabled="mode === 'ubah'" :aria-invalid="galatKolom('kode') ? 'true' : undefined" :aria-describedby="`${ID.kode}-ket ${idGalat('kode')}`"
                @blur="tinggal('kode')" @input="ubah('kode')"
              >
              <p :id="`${ID.kode}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ mode === 'ubah' ? tcf('paket.form.kodeTetap') : tcf('paket.form.kodeKet') }}</p>
              <p v-if="galatKolom('kode')" :id="idGalat('kode')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('kode') }}</p>
            </div>
            <div>
              <label :for="ID.kredit" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.kredit') }}</label>
              <input
                :id="ID.kredit" v-model="f.kredit" type="text" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums" autocomplete="off"
                :aria-invalid="galatKolom('kredit') ? 'true' : undefined" :aria-describedby="idGalat('kredit')"
                @blur="tinggal('kredit')" @input="ubah('kredit')"
              >
              <p v-if="galatKolom('kredit')" :id="idGalat('kredit')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('kredit') }}</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label :for="ID.harga" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.harga') }}</label>
              <input
                :id="ID.harga" v-model="f.harga" type="text" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums" autocomplete="off"
                :aria-invalid="galatKolom('harga') ? 'true' : undefined" :aria-describedby="idGalat('harga')"
                @blur="tinggal('harga')" @input="ubah('harga')"
              >
              <p v-if="galatKolom('harga')" :id="idGalat('harga')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('harga') }}</p>
            </div>
            <div>
              <label :for="ID.harga_promo" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.hargaPromo') }}</label>
              <input
                :id="ID.harga_promo" v-model="f.hargaPromo" type="text" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums" autocomplete="off"
                :aria-invalid="galatKolom('harga_promo') ? 'true' : undefined" :aria-describedby="`${ID.harga_promo}-ket ${idGalat('harga_promo')}`"
                @blur="tinggal('harga_promo')" @input="ubah('harga_promo')"
              >
              <p :id="`${ID.harga_promo}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('paket.form.promoKet') }}</p>
              <p v-if="galatKolom('harga_promo')" :id="idGalat('harga_promo')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('harga_promo') }}</p>
            </div>
          </div>

          <fieldset class="space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" :disabled="!adaPromo || sibuk">
            <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.jendela') }}</legend>
            <p class="text-xs text-[var(--ca-subtle)]">{{ adaPromo ? tcf('paket.form.jendelaKet') : tcf('paket.form.jendelaMati') }}</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label :for="ID.promo_mulai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.promoMulai') }}</label>
                <input
                  :id="ID.promo_mulai" v-model="f.promoMulai" type="datetime-local" class="ca-input mt-2 w-full"
                  :aria-invalid="galatKolom('promo_mulai') ? 'true' : undefined" :aria-describedby="idGalat('promo_mulai')"
                  @blur="tinggal('promo_mulai')" @input="ubah('promo_mulai')"
                >
                <p v-if="galatKolom('promo_mulai')" :id="idGalat('promo_mulai')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('promo_mulai') }}</p>
              </div>
              <div>
                <label :for="ID.promo_sampai" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.promoSampai') }}</label>
                <input
                  :id="ID.promo_sampai" v-model="f.promoSampai" type="datetime-local" class="ca-input mt-2 w-full"
                  :aria-invalid="galatKolom('promo_sampai') ? 'true' : undefined" :aria-describedby="idGalat('promo_sampai')"
                  @blur="tinggal('promo_sampai')" @input="ubah('promo_sampai')"
                >
                <p v-if="galatKolom('promo_sampai')" :id="idGalat('promo_sampai')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('promo_sampai') }}</p>
              </div>
            </div>
          </fieldset>

          <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label :for="ID.label" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.label') }}</label>
              <input
                :id="ID.label" v-model="f.label" type="text" class="ca-input mt-2 w-full" autocomplete="off"
                :aria-invalid="galatKolom('label') ? 'true' : undefined" :aria-describedby="`${ID.label}-ket ${idGalat('label')}`"
                @blur="tinggal('label')" @input="ubah('label')"
              >
              <p :id="`${ID.label}-ket`" class="mt-1 flex flex-wrap justify-between gap-2 text-xs text-[var(--ca-subtle)]">
                <span>{{ tcf('paket.form.labelKet') }}</span>
                <span class="tabular-nums" :class="sisaLabel < 0 ? 'ca-tone-danger' : ''">{{ sisaLabel < 0 ? tcf('paket.form.lebihHuruf')(-sisaLabel) : tcf('paket.form.sisaHuruf')(sisaLabel) }}</span>
              </p>
              <p v-if="galatKolom('label')" :id="idGalat('label')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('label') }}</p>
            </div>
            <div>
              <label :for="ID.urutan" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.urutan') }}</label>
              <input
                :id="ID.urutan" v-model="f.urutan" type="text" inputmode="numeric" class="ca-input mt-2 w-full tabular-nums" autocomplete="off"
                :aria-invalid="galatKolom('urutan') ? 'true' : undefined" :aria-describedby="`${ID.urutan}-ket ${idGalat('urutan')}`"
                @blur="tinggal('urutan')" @input="ubah('urutan')"
              >
              <p :id="`${ID.urutan}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('paket.form.urutanKet') }}</p>
              <p v-if="galatKolom('urutan')" :id="idGalat('urutan')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('urutan') }}</p>
            </div>
          </div>

          <div class="space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3">
            <label v-for="c in CENTANG" :key="c.isian" :for="ID[c.kolom]" class="flex items-start gap-3 text-sm text-[var(--ca-text)]">
              <input :id="ID[c.kolom]" v-model="f[c.isian]" type="checkbox" class="mt-1 h-4 w-4 shrink-0" @change="ubah(c.kolom)">
              <span>
                <span class="font-semibold">{{ tcf(`paket.form.${c.isian}`) }}</span>
                <span class="block text-xs text-[var(--ca-muted)]">{{ tcf(`paket.form.${c.isian}Ket`) }}</span>
                <span v-if="galatKolom(c.kolom)" class="mt-1 block text-xs ca-tone-danger" role="alert">{{ galatKolom(c.kolom) }}</span>
              </span>
            </label>
          </div>

          <div>
            <label :for="ID.play_produk_id" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.play') }}</label>
            <input
              :id="ID.play_produk_id" v-model="f.playProdukId" type="text" class="ca-input mt-2 w-full font-mono" :maxlength="PLAY_PRODUK_MAKS"
              autocomplete="off" autocapitalize="off" spellcheck="false"
              :aria-invalid="galatKolom('play_produk_id') ? 'true' : undefined" :aria-describedby="`${ID.play_produk_id}-ket ${idGalat('play_produk_id')}`"
              @blur="tinggal('play_produk_id')" @input="ubah('play_produk_id')"
            >
            <p :id="`${ID.play_produk_id}-ket`" class="mt-1 text-xs text-[var(--ca-subtle)]">
              {{ tcf('paket.form.playKet') }}
              <span v-if="adaPlay" class="mt-1 block text-[var(--ca-muted)]">{{ ketHargaPlay }}</span>
            </p>
            <p v-if="galatKolom('play_produk_id')" :id="idGalat('play_produk_id')" class="mt-1 text-xs ca-tone-danger" role="alert">{{ galatKolom('play_produk_id') }}</p>
          </div>
        </div>

        <div class="min-w-0 space-y-3">
          <h4 class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('paket.form.pratinjau') }}</h4>
          <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.pratinjau.sekarang') }}</p>
          <CashflowPaketPratinjau :kredit="pratinjau.kredit" :label="pratinjau.label" :tampil="tampilKini" />
          <template v-if="tampilPromo">
            <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.pratinjau.saatPromo')(waktu(pratinjau.promoMulai)) }}</p>
            <CashflowPaketPratinjau :kredit="pratinjau.kredit" :label="pratinjau.label" :tampil="tampilPromo" />
          </template>
          <ul class="space-y-1 text-xs">
            <li v-if="!f.aktif" class="ca-tone-gold">{{ tcf('paket.pratinjau.nonaktif') }}</li>
            <li v-else-if="f.khususUji" class="text-[var(--ca-muted)]">{{ tcf('paket.pratinjau.khususUji') }}</li>
            <li v-if="tampilKini.status === 'berakhir'" class="ca-tone-gold">{{ tcf('paket.form.promoLewat') }}</li>
            <li class="text-[var(--ca-subtle)]">{{ tcf('paket.pratinjau.catatan') }}</li>
          </ul>
        </div>
      </fieldset>

      <p v-if="dicoba && !hasil.muatan" class="mt-4 text-sm ca-tone-danger" role="alert">{{ tcf('paket.galat.periksaIsian') }}</p>
      <div v-if="basi" class="mt-4 flex flex-wrap items-center gap-2 text-sm ca-tone-gold" role="alert">
        <span>{{ tcf('paket.form.basi') }}</span>
        <button type="button" class="ca-btn-secondary text-xs" :disabled="sibuk" @click="emit('muatVersi')">{{ tcf('paket.form.muatVersi') }}</button>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-[color:var(--ca-border)] pt-4">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
        <button type="submit" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk || basi">
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ sibuk ? tcf('paket.menyimpan') : mode === 'baru' ? tcf('paket.form.simpanBaru') : tcf('paket.form.simpanUbah') }}
        </button>
      </div>
    </form>
  </ConsoleModal>
</template>
