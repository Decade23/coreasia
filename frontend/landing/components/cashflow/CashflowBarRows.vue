<script setup lang="ts">
/**
 * Batang mendatar berurut — untuk corong dan "kategori teratas".
 *
 * Tiap baris: label dan angka di atas, batang proporsional di bawahnya, dan (opsional)
 * persen dari baris sebelumnya — itu yang membuat corong terbaca sebagai
 * corong: "8 dari 16 (50%)", bukan sekadar dua angka bersebelahan.
 * Lebar batang relatif terhadap baris PERTAMA, bukan maksimum, supaya corong
 * yang menyusut terlihat menyusut. Deret yang urutannya tetap (hari pekan,
 * pilihan jawaban) mengisi `dasar` dengan nilai terbesarnya, supaya baris
 * yang lebih besar dari baris pertama tidak terpotong di 100%.
 */
import { angka } from '~/adapters/cashflow'

const props = defineProps<{
  baris: Array<{ label: string; nilai: number; persen?: number | null; keterangan?: string }>
  warna?: string
  dasar?: number
}>()
const dasar = computed(() => Math.max(1, props.dasar ?? props.baris[0]?.nilai ?? 1))
</script>

<template>
  <!-- Label dan angka di baris atas, batang di bawahnya: label panjang tidak pernah terpotong,
       di ponsel maupun di kartu sempit. -->
  <ol class="space-y-3">
    <li v-for="(b, i) in baris" :key="i" class="min-w-0 text-sm">
      <div class="flex items-baseline justify-between gap-3">
        <span class="min-w-0 break-words font-semibold text-[var(--ca-text)]">{{ b.label }}</span>
        <span class="shrink-0 whitespace-nowrap text-right tabular-nums">
          <span class="font-bold text-[var(--ca-text)]">{{ angka(b.nilai) }}</span>
          <span v-if="b.persen != null" class="ml-1 text-xs text-[var(--ca-subtle)]">({{ b.persen }}%)</span>
        </span>
      </div>
      <span class="mt-1.5 block h-2 overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]">
        <span
          class="block h-full rounded-full transition-[width]"
          :style="{ width: `${Math.max(2, Math.round((b.nilai / dasar) * 100))}%`, background: warna || 'var(--ca-accent)' }"
        />
      </span>
      <span v-if="b.keterangan" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ b.keterangan }}</span>
    </li>
  </ol>
</template>
