<script setup lang="ts">
/**
 * Sparkline SVG — garis 30 titik tanpa sumbu, angka saat hover.
 *
 * SVG tangan, bukan pustaka: aman di SSR, ikut var(--ca-*) untuk terang/gelap,
 * dan tidak menambah 60–300 KB untuk satu garis. Kalau seluruh titiknya nol
 * (hari-hari sepi), garisnya tetap digambar rata — bukan disembunyikan — karena
 * kosong yang jujur lebih baik daripada grafik yang hilang tanpa penjelasan;
 * yang menyembunyikan seluruh kartunya adalah halaman lewat FallbackState,
 * dengan kalimat yang menyebut angka sebenarnya.
 */
const props = withDefaults(defineProps<{
  data: number[]
  tinggi?: number
  label?: string
  warna?: string
}>(), { tinggi: 56, label: '', warna: 'var(--ca-accent)' })

const LEBAR = 300
const titikAktif = ref<number | null>(null)

const maks = computed(() => Math.max(1, ...props.data))
const koordinat = computed(() => {
  const n = props.data.length
  if (n === 0) return []
  const langkah = n > 1 ? LEBAR / (n - 1) : 0
  return props.data.map((v, i) => ({
    x: +(i * langkah).toFixed(1),
    y: +(props.tinggi - 4 - (v / maks.value) * (props.tinggi - 8)).toFixed(1),
    v,
  }))
})
const jalur = computed(() => koordinat.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const area = computed(() =>
  koordinat.value.length ? `${jalur.value} L${LEBAR},${props.tinggi} L0,${props.tinggi} Z` : '')

const pilih = (e: MouseEvent) => {
  const svg = e.currentTarget as SVGSVGElement
  const r = svg.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * LEBAR
  let terdekat = 0
  let jarak = Number.POSITIVE_INFINITY
  koordinat.value.forEach((p, i) => { if (Math.abs(p.x - x) < jarak) { jarak = Math.abs(p.x - x); terdekat = i } })
  titikAktif.value = terdekat
}
const titik = computed(() => (titikAktif.value == null ? null : koordinat.value[titikAktif.value] ?? null))
</script>

<template>
  <div class="relative">
    <svg
      :viewBox="`0 0 ${LEBAR} ${tinggi}`"
      class="h-auto w-full"
      preserveAspectRatio="none"
      role="img"
      :aria-label="label"
      @mousemove="pilih"
      @mouseleave="titikAktif = null"
    >
      <path v-if="area" :d="area" :fill="warna" fill-opacity="0.12" />
      <path v-if="jalur" :d="jalur" fill="none" :stroke="warna" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <template v-if="titik">
        <line :x1="titik.x" :x2="titik.x" y1="0" :y2="tinggi" stroke="var(--ca-border)" stroke-dasharray="2 3" />
        <circle :cx="titik.x" :cy="titik.y" r="3.5" :fill="warna" />
      </template>
    </svg>
    <div
      v-if="titik"
      class="pointer-events-none absolute -top-6 rounded-md border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-2 py-0.5 text-xs tabular-nums text-[var(--ca-text)]"
      :style="{ left: `calc(${(titik.x / LEBAR) * 100}% - 1.25rem)` }"
    >
      {{ titik.v }}
    </div>
  </div>
</template>
