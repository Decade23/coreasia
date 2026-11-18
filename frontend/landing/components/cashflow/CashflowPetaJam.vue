<script setup lang="ts">
/**
 * Peta jam ramai: 7 hari pekan x 24 jam WIB, satu kotak per jam.
 *
 * SVG tangan seperti CashflowSparkline dan CashflowCohortGrid: aman di SSR,
 * warnanya token --ca-* jadi ikut terang dan gelap, tanpa pustaka grafik.
 * Pekatnya kotak = seperempat-seperempat dari jam tersibuk (tingkatSel), dari
 * hijau token yang sama dengan matriks kohort.
 *
 * Layar lebar: hari ke bawah, jam ke samping. Layar sempit (di bawah 768 px):
 * diputar, jam ke bawah dan hari ke samping, supaya 24 kolom tidak menjadi
 * kotak sebesar jarum. Dua-duanya dirender dan dipilih lewat CSS, jadi tidak
 * ada lompatan saat hidrasi.
 *
 * Setiap kotak punya <title> (keterangan bawaan peramban dan pembaca layar).
 * Kotak yang disorot atau difokus menulis keterangannya di bawah peta. Tabel
 * tersembunyi di bawahnya membawa angka yang sama untuk pembaca layar.
 */
import { angka } from '~/adapters/cashflow'
import { tingkatSel, type PetaJam, type SelJam } from '~/adapters/cashflowLaporan'

const props = defineProps<{ peta: PetaJam }>()
const { tcf, bahasa } = useCashflowI18n()

/* Kamus memulangkan larik untuk dua kunci ini (tujuh nama hari, Senin dulu). */
const hariPendek = computed(() => tcf('laporan.jam.hariPendek') as unknown as string[])
const hariPanjang = computed(() => tcf('laporan.jam.hariPanjang') as unknown as string[])
const jamTeks = (j: number) => `${String(j).padStart(2, '0')}${bahasa.value === 'en' ? ':' : '.'}00`

/* Ukuran dalam satuan viewBox. */
const K = 22
const JARAK = 3
const KIRI = 34
const ATAS = 18
const lebarMendatar = KIRI + 24 * (K + JARAK)
const tinggiMendatar = ATAS + 7 * (K + JARAK)
const KT = 30
const KIRI_T = 40
const lebarTegak = KIRI_T + 7 * (KT + JARAK)
const tinggiTegak = ATAS + 24 * (16 + JARAK)

const aktif = ref<SelJam | null>(null)
const keterangan = (s: SelJam) =>
  tcf('laporan.jam.sel')(hariPanjang.value[s.dow - 1] ?? '', jamTeks(s.jam), angka(s.transaksi), angka(s.orang))
const ringkas = computed(() => props.peta.puncak
  ? tcf('laporan.jam.puncak')(hariPanjang.value[props.peta.puncak.dow - 1] ?? '', jamTeks(props.peta.puncak.jam), angka(props.peta.puncak.transaksi))
  : tcf('laporan.jam.kosong'))
const tingkat = (s: SelJam) => tingkatSel(s.transaksi, props.peta.maks)
const jamLabel = [0, 3, 6, 9, 12, 15, 18, 21]
</script>

<template>
  <figure class="cf-peta-jam m-0 min-w-0" data-uji="peta-jam">
    <!-- Layar lebar: hari x jam. -->
    <svg
      class="cf-peta-mendatar h-auto w-full" :viewBox="`0 0 ${lebarMendatar} ${tinggiMendatar}`"
      role="img" :aria-label="`${tcf('laporan.jam.petaLabel')}. ${ringkas}`" @mouseleave="aktif = null"
    >
      <text v-for="j in jamLabel" :key="`j${j}`" :x="KIRI + j * (K + JARAK)" :y="ATAS - 6" class="cf-peta-label">{{ String(j).padStart(2, '0') }}</text>
      <g v-for="(baris, i) in peta.sel" :key="`h${i}`">
        <text :x="0" :y="ATAS + i * (K + JARAK) + K / 2 + 4" class="cf-peta-label">{{ hariPendek[i] }}</text>
        <rect
          v-for="s in baris" :key="s.jam"
          :x="KIRI + s.jam * (K + JARAK)" :y="ATAS + i * (K + JARAK)" :width="K" :height="K" rx="4"
          :class="[`cf-peta-t${tingkat(s)}`, aktif === s ? 'cf-peta-aktif' : '']" :data-dow="s.dow" :data-jam="s.jam" :data-n="s.transaksi"
          @mouseenter="aktif = s"
        ><title>{{ keterangan(s) }}</title></rect>
      </g>
    </svg>
    <!-- Layar sempit: jam x hari. -->
    <svg
      class="cf-peta-tegak mx-auto h-auto w-full max-w-[24rem]" :viewBox="`0 0 ${lebarTegak} ${tinggiTegak}`"
      role="img" :aria-label="`${tcf('laporan.jam.petaLabel')}. ${ringkas}`" @mouseleave="aktif = null"
    >
      <text v-for="(h, i) in hariPendek" :key="`t${i}`" :x="KIRI_T + i * (KT + JARAK) + KT / 2" :y="ATAS - 6" text-anchor="middle" class="cf-peta-label">{{ h }}</text>
      <g v-for="jam in 24" :key="`r${jam}`">
        <text v-if="(jam - 1) % 3 === 0" :x="0" :y="ATAS + (jam - 1) * (16 + JARAK) + 12" class="cf-peta-label">{{ jamTeks(jam - 1) }}</text>
        <rect
          v-for="(baris, i) in peta.sel" :key="i"
          :x="KIRI_T + i * (KT + JARAK)" :y="ATAS + (jam - 1) * (16 + JARAK)" :width="KT" height="16" rx="4"
          :class="[`cf-peta-t${tingkat(baris[jam - 1]!)}`, aktif === baris[jam - 1] ? 'cf-peta-aktif' : '']"
          @mouseenter="aktif = baris[jam - 1]!"
          @click="aktif = baris[jam - 1]!"
        ><title>{{ keterangan(baris[jam - 1]!) }}</title></rect>
      </g>
    </svg>
    <figcaption class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
      <span class="min-w-0 tabular-nums" aria-live="polite" data-uji="peta-jam-ket">{{ aktif ? keterangan(aktif) : ringkas }}</span>
      <span class="inline-flex shrink-0 items-center gap-1.5" aria-hidden="true">
        {{ tcf('laporan.jam.sepi') }}
        <span v-for="t in 5" :key="t" class="cf-peta-contoh" :class="`cf-peta-t${t - 1}`" />
        {{ tcf('laporan.jam.ramai') }}
      </span>
    </figcaption>
    <table class="sr-only">
      <caption>{{ tcf('laporan.jam.petaLabel') }}</caption>
      <thead><tr><th scope="col" /><th v-for="j in 24" :key="j" scope="col">{{ jamTeks(j - 1) }}</th></tr></thead>
      <tbody>
        <tr v-for="(baris, i) in peta.sel" :key="i">
          <th scope="row">{{ hariPanjang[i] }}</th>
          <td v-for="s in baris" :key="s.jam">{{ s.transaksi }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.cf-peta-label { font-size: 10px; font-weight: 600; fill: var(--ca-subtle); }
.cf-peta-t0 { fill: var(--ca-panel-bg-strong); }
.cf-peta-t1 { fill: color-mix(in srgb, var(--ca-emerald-text) 22%, transparent); }
.cf-peta-t2 { fill: color-mix(in srgb, var(--ca-emerald-text) 42%, transparent); }
.cf-peta-t3 { fill: color-mix(in srgb, var(--ca-emerald-text) 66%, transparent); }
.cf-peta-t4 { fill: var(--ca-emerald-text); }
rect.cf-peta-aktif { stroke: var(--ca-text); stroke-width: 1.5; }
.cf-peta-contoh { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
span.cf-peta-t0 { background: var(--ca-panel-bg-strong); }
span.cf-peta-t1 { background: color-mix(in srgb, var(--ca-emerald-text) 22%, transparent); }
span.cf-peta-t2 { background: color-mix(in srgb, var(--ca-emerald-text) 42%, transparent); }
span.cf-peta-t3 { background: color-mix(in srgb, var(--ca-emerald-text) 66%, transparent); }
span.cf-peta-t4 { background: var(--ca-emerald-text); }
.cf-peta-tegak { display: none; }
@media (max-width: 767px) {
  .cf-peta-mendatar { display: none; }
  .cf-peta-tegak { display: block; }
}
</style>
