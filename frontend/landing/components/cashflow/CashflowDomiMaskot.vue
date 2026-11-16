<script setup lang="ts">
/**
 * Domi, maskot CashFlow, sebagai gambar diam. Bentuknya sama dengan Domi di
 * aplikasi (dompet bermata dengan tutup dan kancing emas).
 *
 * Di console Domi hanya penanda bahwa ini rumah CashFlow, jadi tampil di tiga
 * tempat saja: sapaan Ringkasan, kepala halaman Cadangan Domi, dan keadaan
 * kosong sebuah daftar. Tidak dipakai di tabel, galat, konfirmasi, atau saat
 * memuat, dan paling banyak satu per layar.
 *
 * Hiasan saja: disembunyikan dari pembaca layar. `napas` memberi satu gerak
 * naik turun yang pelan, dan mati bila pengguna meminta gerak dikurangi.
 */
withDefaults(defineProps<{ ukuran?: number; napas?: boolean }>(), { ukuran: 72, napas: false })
</script>

<template>
  <svg
    class="cf-domi" :class="{ 'cf-domi-napas': napas }" :width="ukuran" :height="ukuran"
    viewBox="0 0 120 120" aria-hidden="true" focusable="false" data-uji="domi-maskot"
  >
    <ellipse class="cf-domi-bayang" cx="60" cy="111" rx="36" ry="5" />
    <g class="cf-domi-tubuh">
      <g transform="translate(0 2)">
        <rect x="33" y="22" width="54" height="36" rx="6" fill="#1BC49E" />
        <circle cx="60" cy="33" r="7" fill="#DDF7EF" />
      </g>
      <rect x="36" y="96" width="15" height="13" rx="6.5" fill="#FFBE3D" />
      <rect x="69" y="96" width="15" height="13" rx="6.5" fill="#FFBE3D" />
      <rect class="cf-domi-badan" x="18" y="36" width="84" height="66" rx="22" />
      <ellipse cx="29" cy="93" rx="6" ry="3.5" fill="#FF9E80" opacity=".8" />
      <ellipse cx="91" cy="93" rx="6" ry="3.5" fill="#FF9E80" opacity=".8" />
      <circle cx="41" cy="82" r="9" fill="#FFFFFF" />
      <circle cx="42.5" cy="83" r="6" fill="#0E1730" />
      <circle cx="44.5" cy="80.6" r="2" fill="#FFFFFF" />
      <circle cx="79" cy="82" r="9" fill="#FFFFFF" />
      <circle cx="77.5" cy="83" r="6" fill="#0E1730" />
      <circle cx="79.5" cy="80.6" r="2" fill="#FFFFFF" />
      <path d="M54 90Q60 96 66 90" fill="none" stroke="#FFBE3D" stroke-width="2.6" stroke-linecap="round" />
      <path class="cf-domi-tutup" d="M18 58C18 44 29 36 42 36H78C91 36 102 44 102 58C102 62 99 65 95 65H25C21 65 18 62 18 58Z" />
      <circle cx="60" cy="65" r="8" fill="#FFBE3D" />
      <circle cx="60" cy="65" r="3" fill="#E9A21F" />
    </g>
  </svg>
</template>

<!-- Tidak scoped: warna badan mengikuti tema lewat atribut di <html>, sama
     dengan Domi di aplikasi (badan lebih terang di tema gelap). -->
<style>
.cf-domi { display: block; flex: none; }
.cf-domi-badan { fill: #3D4E8C; }
.cf-domi-tutup { fill: #51639F; }
.cf-domi-bayang { fill: none; }
html[data-theme="light"] .cf-domi-badan { fill: #1A2445; }
html[data-theme="light"] .cf-domi-tutup { fill: #2E3B6E; }
html[data-theme="light"] .cf-domi-bayang { fill: #0E1730; opacity: 0.13; }
@media (prefers-reduced-motion: no-preference) {
  .cf-domi-napas .cf-domi-tubuh { animation: cf-domi-napas 4.5s ease-in-out infinite; }
}
@keyframes cf-domi-napas {
  50% { transform: translateY(-2.5px); }
}
</style>
