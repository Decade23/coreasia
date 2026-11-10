<script setup lang="ts">
/** Tabel jawaban Domi: nominal rata kanan, lebih dari tiga kolom digeser mendatar. */
import { rupiah } from '~/adapters/cashflow'
import { angkaDariSel, kolomUang } from '~/adapters/cashflowDomi'

const props = defineProps<{ kolom: string[]; baris: string[][] }>()
const { tcf } = useCashflowI18n()
const banyak = computed(() => props.kolom.length > 3 || props.kolom.some(k => k.length > 12))
const uang = computed(() => props.kolom.map(kolomUang))
const sel = (ri: number, ci: number) => {
  const s = props.baris[ri]?.[ci] ?? ''
  if (!uang.value[ci]) return s
  const n = angkaDariSel(s)
  return n !== null ? rupiah(n) : s
}
</script>

<template>
  <div>
    <div class="domi-tabel-gulir overflow-x-auto">
      <table class="domi-tabel" :class="{ 'domi-tabel-lebar': banyak }">
        <thead>
          <tr>
            <th v-for="(k, i) in kolom" :key="i" :class="uang[i] ? 'text-right' : 'text-left'">{{ k }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, ri) in baris" :key="ri">
            <td
              v-for="(_, ci) in kolom" :key="ci"
              :class="[uang[ci] ? 'text-right tabular-nums' : '', ci === 0 ? 'font-bold text-[var(--d-txt)]' : 'text-[var(--d-txt2)]']"
            >{{ sel(ri, ci) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="banyak" class="mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-bold text-[var(--d-txt3)]">
      {{ tcf('domi.geserSamping') }} <Icon name="lucide:arrow-right" class="h-3 w-3" aria-hidden="true" />
    </p>
  </div>
</template>

<style scoped>
.domi-tabel-gulir { border: 1px solid var(--d-line); border-radius: 14px; }
.domi-tabel { width: 100%; border-collapse: collapse; font-size: 12px; font-weight: 600; }
.domi-tabel-lebar { min-width: 468px; }
.domi-tabel th { padding: 8px 10px; font-size: 9.2px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--d-txt3); background: var(--d-line2); }
.domi-tabel td { padding: 9px 10px; border-top: 1px solid var(--d-line2); vertical-align: top; overflow-wrap: break-word; }
.domi-tabel td.text-right { white-space: nowrap; }
</style>
