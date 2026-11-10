<script setup lang="ts">
/**
 * Satu bagian jawaban: gelembung teks, angka, kertas rupiah, grafik, tabel,
 * kartu draf, atau kotak kecil untuk blok yang tidak dikenal. Tautan
 * aksi hanya digambar, tidak ada yang bisa diklik di console.
 */
import { barisTeks, nilaiSatuan, rpKertas, type SusunanDomi } from '~/adapters/cashflowDomi'
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

defineProps<{ s: SusunanDomi; foto: ReadonlyMap<string, FotoDomi> }>()
const emit = defineEmits<{ foto: [jalur: readonly string[], klik: string] }>()
const { tcf } = useCashflowI18n()
const kaliLabel = computed(() => tcf('domi.satuanKali') as string)
</script>

<template>
  <div v-if="s.jenis === 'teks'" class="domi-balon" :class="{ 'domi-pertama': s.pertama, 'domi-penuh': s.aksi.length > 0 }">
    <div v-for="(t, i) in s.teks" :key="i" class="flex flex-col gap-[7px]">
      <template v-for="(b, bi) in barisTeks(t)" :key="bi">
        <p v-if="b.jenis === 'judul'" class="text-[13.5px] font-extrabold" :class="{ 'mt-1': bi > 0 }">{{ b.potongan.map(p => p.teks).join('') }}</p>
        <div v-else-if="b.jenis === 'poin'" class="flex gap-2">
          <span class="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--d-txt3)]" />
          <span class="text-[14.2px] font-medium leading-[21px]"><template v-for="(p, pi) in b.potongan" :key="pi"><strong v-if="p.tebal" class="font-extrabold">{{ p.teks }}</strong><template v-else>{{ p.teks }}</template></template></span>
        </div>
        <p v-else class="text-[14.5px] font-medium leading-[21px]"><template v-for="(p, pi) in b.potongan" :key="pi"><strong v-if="p.tebal" class="font-extrabold">{{ p.teks }}</strong><template v-else>{{ p.teks }}</template></template></p>
      </template>
    </div>
    <div v-for="(a, i) in s.aksi" :key="`a${i}`" class="domi-aksi" :class="{ 'domi-aksi-garis': s.teks.length > 0 || i > 0 }">
      <span class="min-w-0 flex-1 text-[13.5px] font-extrabold text-[var(--d-txt)]">{{ a.label }}</span>
      <Icon name="lucide:arrow-right" class="h-4 w-4 shrink-0 text-[var(--d-txt)]" aria-hidden="true" />
    </div>
  </div>

  <div v-else-if="s.jenis === 'angka'" class="domi-balon" :class="{ 'domi-pertama': s.pertama }">
    <p class="text-[11px] font-bold uppercase tracking-wide text-[var(--d-txt3)]">{{ s.blok.label }}</p>
    <p class="text-[21px] font-extrabold tabular-nums">{{ nilaiSatuan(s.blok.nilai, s.blok.satuan, kaliLabel) }}</p>
  </div>

  <CashflowDomiKertas v-else-if="s.jenis === 'kertas'">
    <div v-if="s.utama">
      <p class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--d-label)]">{{ s.utama.label }}</p>
      <p class="domi-rp">{{ rpKertas(s.utama.nilai) }}</p>
    </div>
    <div v-if="s.baris.length" :class="s.utama ? 'border-t-[1.5px] border-dashed border-[color:var(--d-garis)] pt-2.5' : ''" class="flex flex-col gap-[7px]">
      <CashflowDomiBarisTitik v-for="(b, i) in s.baris" :key="`${b.label}-${i}`" :kiri="b.label" :kanan="rpKertas(b.nilai)" />
    </div>
  </CashflowDomiKertas>

  <div v-else-if="s.jenis === 'grafik'" class="domi-balon domi-penuh !p-2.5" :class="{ 'domi-pertama': s.pertama }">
    <CashflowDomiGrafik :spek="s.spek" />
  </div>

  <div v-else-if="s.jenis === 'tabel'" class="domi-balon domi-penuh !p-2" :class="{ 'domi-pertama': s.pertama }">
    <CashflowDomiTabel :kolom="s.kolom" :baris="s.baris" />
  </div>

  <CashflowDomiDraf v-else-if="s.jenis === 'transaksi' || s.jenis === 'draf'" :s="s" :foto="foto" @foto="(j, k) => emit('foto', j, k)" />

  <div v-else class="domi-asing">
    <Icon name="lucide:box" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>{{ tcf('domi.asing')(s.label) }}</span>
  </div>
</template>

<style scoped>
.domi-balon {
  align-self: flex-start; max-width: 100%; background: var(--d-gelembung); border-radius: 20px;
  padding: 11px 14px; display: flex; flex-direction: column; gap: 8px; color: var(--d-txt);
  box-shadow: 0 1px 2px var(--d-bayang); overflow-wrap: anywhere;
}
.domi-pertama { border-top-left-radius: 6px; }
.domi-penuh { align-self: stretch; }
.domi-rp { font-size: 36px; font-weight: 800; line-height: 44px; margin-top: 2px; font-variant-numeric: tabular-nums; color: var(--d-txt); }
.domi-aksi { min-height: 44px; display: flex; align-items: center; gap: 8px; margin-bottom: -8px; }
.domi-aksi-garis { border-top: 1px solid var(--d-line2); }
.domi-asing {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px;
  font-size: 12px; font-weight: 600; color: var(--d-txt2); background: var(--d-gelembung); border: 1px dashed var(--d-line);
}
</style>
