<script setup lang="ts">
/**
 * Kode QR dari teks (mis. URI otpauth:// pendaftaran TOTP), dirender sebagai
 * satu <path> SVG di template — tanpa v-html, tanpa kanvas, tanpa layanan luar.
 * Pustaka `uqr` (MIT, tanpa dependensi) hanya menghitung matriksnya.
 *
 * Warna SENGAJA tetap hitam di atas putih di kedua tema: pemindai authenticator
 * gagal membaca QR terbalik/berkontras rendah, jadi token --ca-* tidak dipakai
 * untuk modulnya.
 */
import { encode } from 'uqr'

const props = defineProps<{
  nilai: string
  label: string
}>()

const qr = computed(() => {
  if (!props.nilai) return null
  try {
    return encode(props.nilai, { ecc: 'M', border: 2 })
  } catch {
    return null
  }
})

const jalur = computed(() => {
  const data = qr.value?.data
  if (!data) return ''
  let d = ''
  data.forEach((baris, y) => {
    baris.forEach((gelap, x) => {
      if (gelap) d += `M${x} ${y}h1v1h-1z`
    })
  })
  return d
})
</script>

<template>
  <svg
    v-if="qr"
    :viewBox="`0 0 ${qr.size} ${qr.size}`"
    role="img"
    :aria-label="label"
    shape-rendering="crispEdges"
    class="block h-auto w-full rounded-xl"
  >
    <rect :width="qr.size" :height="qr.size" fill="#ffffff" />
    <path :d="jalur" fill="#000000" />
  </svg>
</template>
