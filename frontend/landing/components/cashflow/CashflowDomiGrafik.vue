<script setup lang="ts">
/** Grafik jawaban Domi: batang dan garis, gambar diam, aturan sama dengan aplikasi. */
import { nilaiSatuan, type SpekGrafik } from '~/adapters/cashflowDomi'

const props = defineProps<{ spek: SpekGrafik }>()
const { tcf } = useCashflowI18n()
const W = 320
const H = 168
const KIRI = 8
const KANAN = 8
const ATAS = 20
const BAWAH = 30
const data = computed(() => props.spek.data)
const n = computed(() => data.value.length)
const plotW = W - KIRI - KANAN
const plotH = H - ATAS - BAWAH
const skala = computed(() => {
  const nilai = data.value.map(d => d.nilai)
  const minD = Math.min(...nilai)
  const maxD = Math.max(...nilai)
  const batang = props.spek.jenis === 'batang'
  const lo = batang ? Math.min(0, minD) : Math.min(minD, maxD * 0.9)
  const hi = batang ? Math.max(0, maxD) : Math.max(maxD, minD * 0.9)
  return { lo, hi, rentang: hi - lo || Math.abs(hi) || 1 }
})
const Y = (v: number) => ATAS + ((skala.value.hi - v) / skala.value.rentang) * plotH
const yNol = computed(() => Y(0))
const kolom = computed(() => plotW / Math.max(1, n.value))
const lebarBatang = computed(() => Math.max(3, kolom.value - (n.value > 1 ? Math.min(10, kolom.value * 0.3) : 0)))
const langkah = computed(() => Math.max(1, Math.ceil(n.value / 6)))
const xTitik = (i: number) => (n.value > 1 ? KIRI + (plotW / (n.value - 1)) * i : KIRI + plotW / 2)
const garis = computed(() => data.value.map((d, i) => `${i ? 'L' : 'M'}${xTitik(i).toFixed(1)} ${Y(d.nilai).toFixed(1)}`).join(' '))
const sumbu = computed(() => [0, 0.5, 1].map(f => skala.value.lo + skala.value.rentang * f))
const nilaiTeks = (v: number) => nilaiSatuan(v, props.spek.satuan === 'rupiah' ? 'angka' : props.spek.satuan, tcf('domi.satuanKali') as string)
const labelPendek = (s: string) => (s.length > 9 ? `${s.slice(0, 8)}…` : s)
</script>

<template>
  <figure class="m-0">
    <figcaption v-if="spek.judul" class="mb-1 truncate text-[13px] font-bold text-[var(--d-txt)]">{{ spek.judul }}</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" :aria-label="tcf('domi.grafik')(spek.judul || tcf('tab.domi'), n)">
      <line v-for="(v, i) in sumbu" :key="`g${i}`" :x1="KIRI" :x2="KIRI + plotW" :y1="Y(v)" :y2="Y(v)" class="domi-sumbu" />
      <line :x1="KIRI" :x2="KIRI + plotW" :y1="yNol" :y2="yNol" class="domi-nol" />
      <template v-if="spek.jenis === 'batang'">
        <rect
          v-for="(d, i) in data" :key="`b${i}`" :x="KIRI + kolom * i + (kolom - lebarBatang) / 2"
          :y="Math.min(Y(d.nilai), yNol)" :width="lebarBatang" :height="Math.max(2, Math.abs(Y(d.nilai) - yNol))" rx="4"
          :class="d.nilai < 0 ? 'domi-batang-minus' : 'domi-batang'"
        />
        <template v-if="n <= 6">
          <text v-for="(d, i) in data" :key="`v${i}`" :x="KIRI + kolom * i + kolom / 2" :y="Math.max(ATAS - 6, Y(d.nilai) - 6)" text-anchor="middle" class="domi-nilai">{{ nilaiTeks(d.nilai) }}</text>
        </template>
      </template>
      <template v-else>
        <path :d="`${garis} L${(KIRI + plotW).toFixed(1)} ${yNol.toFixed(1)} L${KIRI} ${yNol.toFixed(1)} Z`" class="domi-area" />
        <path :d="garis" class="domi-garis" />
        <circle v-for="(d, i) in data" :key="`c${i}`" :cx="xTitik(i)" :cy="Y(d.nilai)" r="3.2" class="domi-titik" />
      </template>
      <template v-for="(d, i) in data" :key="`l${i}`">
        <text
          v-if="i % langkah === 0 || i === n - 1"
          :x="spek.jenis === 'batang' ? KIRI + kolom * i + kolom / 2 : xTitik(i)" :y="H - 8"
          :text-anchor="i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'" class="domi-label"
        >{{ labelPendek(d.label) }}</text>
      </template>
    </svg>
  </figure>
</template>

<style scoped>
.domi-sumbu { stroke: var(--d-line2); stroke-width: 1; }
.domi-nol { stroke: var(--d-garis); stroke-width: 1; }
.domi-batang { fill: var(--d-sky); opacity: 0.85; }
.domi-batang-minus { fill: var(--d-rose); opacity: 0.85; }
.domi-area { fill: var(--d-sky); opacity: 0.12; }
.domi-garis { fill: none; stroke: var(--d-sky); stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
.domi-titik { fill: var(--d-sky); stroke: var(--d-gelembung); stroke-width: 1.5; }
.domi-nilai { font-size: 9.5px; font-weight: 700; fill: var(--d-txt2); }
.domi-label { font-size: 9.5px; font-weight: 600; fill: var(--d-txt3); }
</style>
