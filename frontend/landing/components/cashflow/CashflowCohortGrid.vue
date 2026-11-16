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
import { angka, type SelKohort } from '~/adapters/cashflow'
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
  <!-- Di ponsel lima kolom tidak muat: tabelnya bergulir di dalam kartu, kartunya tidak meluber. -->
  <CashflowTabel polos lebar-min="27rem" class="-mx-5">
    <thead>
      <tr>
        <th scope="col">{{ tcf('ringkasan.kohortKolom.kohort') }}</th>
        <th scope="col" class="cf-ka">{{ tcf('ringkasan.kohortKolom.daftar') }}</th>
        <th scope="col" class="cf-ka">{{ tcf('ringkasan.kohortKolom.pernah') }}</th>
        <th scope="col" class="cf-ka">{{ tcf('ringkasan.kohortKolom.masih') }}</th>
        <th scope="col" class="cf-ka">{{ tcf('ringkasan.kohortKolom.retensi') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="k in baris" :key="k.kohort">
        <td class="whitespace-nowrap">
          {{ k.kohort }}
          <span v-if="k.berjalan" class="ml-1 rounded-full border border-[color:var(--ca-border)] px-1.5 text-[0.65rem] text-[var(--ca-subtle)]">{{ tcf('ringkasan.berjalan') }}</span>
        </td>
        <td class="cf-ka">{{ angka(k.mendaftar) }}</td>
        <td class="cf-ka">{{ angka(k.pernahCatat) }}</td>
        <td class="cf-ka">{{ angka(k.catat30) }}</td>
        <td class="cf-ka">
          <span class="inline-block min-w-[3.5rem] rounded-md px-2 py-0.5 text-right tabular-nums text-[var(--ca-text)]" :class="nada(k.persen)">{{ k.persen }}%</span>
        </td>
      </tr>
    </tbody>
  </CashflowTabel>
</template>
