<script setup lang="ts">
/**
 * Keadaan daftar dan tabel console CashFlow: kosong, memuat, galat, dan akses
 * terbatas. Hanya tampilan, semua tulisan datang dari pemanggil.
 *
 * - kosong: satu kalimat sebab, dan jalan keluarnya di slot (misalnya tombol
 *   lepas saringan).
 * - memuat: kerangka baris, jadi bentuk daftar sudah kelihatan dan layar
 *   tidak melompat saat datanya tiba.
 * - galat: apa yang terjadi, lalu tombol coba lagi bila `labelUlang` diisi.
 *   `rincian` untuk dikutip saat melapor (kode, bukan pesan mentah server).
 * - terbatas: isinya tetap terbaca, yang terkunci hanya sebagian. Tombol
 *   jalan keluarnya di slot.
 *
 * `polos`: tanpa bingkai kartu, untuk dipakai di dalam kartu lain.
 */
import { lebarKerangka, type JenisKeadaan } from '~/utils/cashflow/keadaan'

withDefaults(defineProps<{
  jenis: JenisKeadaan
  judul?: string
  pesan?: string
  icon?: string
  rincian?: string
  labelUlang?: string
  sibuk?: boolean
  baris?: number
  kolom?: number
  polos?: boolean
}>(), { judul: '', pesan: '', icon: 'lucide:inbox', rincian: '', labelUlang: '', sibuk: false, baris: 4, kolom: 4, polos: false })
const emit = defineEmits<{ ulang: [] }>()
</script>

<template>
  <!-- Memuat -->
  <div v-if="jenis === 'memuat'" class="cf-tabel-wadah" :class="{ 'cf-tabel-polos': polos }" role="status" aria-busy="true" data-keadaan="memuat">
    <span class="sr-only">{{ pesan || judul }}</span>
    <div
      v-for="b in baris" :key="b" aria-hidden="true"
      class="flex items-center gap-6 border-t border-[color:var(--ca-border)] px-5 py-3.5 first:border-t-0"
    >
      <div class="min-w-0 flex-[2] space-y-1.5">
        <span class="cf-kerangka" :style="{ width: `${lebarKerangka(b)}%` }" />
        <span class="cf-kerangka !h-2.5" :style="{ width: `${Math.round(lebarKerangka(b) * 0.55)}%` }" />
      </div>
      <div v-for="k in Math.max(0, kolom - 1)" :key="k" class="hidden min-w-0 flex-1 sm:block" :class="k === kolom - 1 ? 'max-w-[4.5rem]' : ''">
        <span class="cf-kerangka" />
      </div>
    </div>
  </div>

  <!-- Galat -->
  <div v-else-if="jenis === 'galat'" class="cf-tabel-wadah" :class="polos ? 'cf-tabel-polos' : 'p-5'" data-keadaan="galat">
    <div class="flex items-start gap-3 rounded-xl bg-[var(--ca-danger-bg)] px-4 py-3.5 text-sm text-[var(--ca-danger-text)]" role="alert">
      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
      <div class="min-w-0">
        <p v-if="judul" class="font-bold">{{ judul }}</p>
        <p v-if="pesan" class="break-words font-semibold" :class="judul ? 'mt-0.5 text-[0.8125rem]' : ''">{{ pesan }}</p>
      </div>
    </div>
    <div v-if="rincian || labelUlang || $slots.default" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p v-if="rincian" class="min-w-0 break-all font-mono text-xs text-[var(--ca-subtle)]">{{ rincian }}</p>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <slot />
        <button v-if="labelUlang" type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="sibuk" data-uji="keadaan-ulang" @click="emit('ulang')">{{ labelUlang }}</button>
      </div>
    </div>
  </div>

  <!-- Akses terbatas -->
  <div v-else-if="jenis === 'terbatas'" class="rounded-xl bg-[var(--ca-info-bg)] px-4 py-3.5 text-sm text-[var(--ca-info-text)]" role="status" data-keadaan="terbatas">
    <div class="flex flex-wrap items-start gap-x-3 gap-y-2">
      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p v-if="judul" class="font-bold">{{ judul }}</p>
        <p v-if="pesan" class="font-semibold" :class="judul ? 'mt-0.5 text-[0.8125rem]' : ''">{{ pesan }}</p>
      </div>
      <div v-if="$slots.default" class="flex flex-wrap items-center gap-2"><slot /></div>
    </div>
    <slot name="bawah" />
  </div>

  <!-- Kosong -->
  <div v-else class="cf-tabel-wadah flex flex-col items-center px-6 py-10 text-center" :class="{ 'cf-tabel-polos': polos }" data-keadaan="kosong">
    <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ca-panel-bg-strong)] text-[var(--ca-subtle)]" aria-hidden="true">
      <Icon :name="icon" class="h-6 w-6" />
    </span>
    <p v-if="judul" class="mt-4 text-base font-bold text-[var(--ca-text)]">{{ judul }}</p>
    <p v-if="pesan" class="max-w-md text-sm text-[var(--ca-muted)]" :class="judul ? 'mt-1.5' : 'mt-4'">{{ pesan }}</p>
    <div v-if="$slots.default" class="mt-4 flex flex-wrap items-center justify-center gap-2"><slot /></div>
  </div>
</template>

<style scoped>
/* Kerangka: bentuk barisnya sudah kelihatan, jadi layar tidak melompat saat data tiba. */
.cf-kerangka {
  display: block;
  height: 14px;
  border-radius: 8px;
  background: var(--ca-panel-bg-strong);
  animation: cf-kerangka 1.4s ease-in-out infinite;
}
@keyframes cf-kerangka {
  50% { opacity: 0.55; }
}
@media (prefers-reduced-motion: reduce) {
  .cf-kerangka { animation: none; }
}
</style>
