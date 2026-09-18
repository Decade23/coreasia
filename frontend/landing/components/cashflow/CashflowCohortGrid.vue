<script setup lang="ts">
/**
 * Matriks kohort retensi: satu baris per bulan pendaftaran —
 * mendaftar → pernah mencatat → masih mencatat 30 hari terakhir.
 *
 * Intensitas warna sel = persen dari yang mendaftar. Bulan berjalan ditandai
 * karena angkanya belum matang: orang yang daftar kemarin belum sempat "masih
 * mencatat 30 hari". Menampilkannya tanpa tanda membuat kohort terakhir selalu
 * terlihat paling buruk, dan itu bohong.
 */
import type { SelKohort } from '~/adapters/cashflow'
defineProps<{ baris: SelKohort[] }>()
const { tcf } = useCashflowI18n()

/* Intensitas dari token hijau yang sama di terang dan gelap (color-mix), bukan
   palet Tailwind mentah — di tema terang emerald-500 terlalu menyala. */
const nada = (persen: number) => {
  if (persen >= 60) return 'bg-[color-mix(in_srgb,var(--ca-emerald-text)_30%,transparent)]'
  if (persen >= 30) return 'bg-[color-mix(in_srgb,var(--ca-emerald-text)_18%,transparent)]'
  if (persen > 0) return 'bg-[var(--ca-emerald-bg)]'
  return 'bg-[var(--ca-panel-bg-strong)]'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="py-2 pr-3 font-semibold">{{ tcf('ringkasan.kohortKolom.kohort') }}</th>
          <th class="py-2 px-3 text-right font-semibold">{{ tcf('ringkasan.kohortKolom.daftar') }}</th>
          <th class="py-2 px-3 text-right font-semibold">{{ tcf('ringkasan.kohortKolom.pernah') }}</th>
          <th class="py-2 px-3 text-right font-semibold">{{ tcf('ringkasan.kohortKolom.masih') }}</th>
          <th class="py-2 pl-3 text-right font-semibold">{{ tcf('ringkasan.kohortKolom.retensi') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in baris" :key="k.kohort" class="border-t border-[color:var(--ca-border)]">
          <td class="py-2 pr-3 text-[var(--ca-text)]">
            {{ k.kohort }}
            <span v-if="k.berjalan" class="ml-1 rounded-full border border-[color:var(--ca-border)] px-1.5 text-[0.65rem] text-[var(--ca-subtle)]">{{ tcf('ringkasan.berjalan') }}</span>
          </td>
          <td class="py-2 px-3 text-right tabular-nums text-[var(--ca-text)]">{{ k.mendaftar }}</td>
          <td class="py-2 px-3 text-right tabular-nums text-[var(--ca-text)]">{{ k.pernahCatat }}</td>
          <td class="py-2 px-3 text-right tabular-nums text-[var(--ca-text)]">{{ k.catat30 }}</td>
          <td class="py-2 pl-3 text-right">
            <span class="inline-block min-w-[3.5rem] rounded-md px-2 py-0.5 text-right tabular-nums text-[var(--ca-text)]" :class="nada(k.persen)">{{ k.persen }}%</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
