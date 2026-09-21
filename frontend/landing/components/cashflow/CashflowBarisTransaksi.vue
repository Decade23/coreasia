<script setup lang="ts">
/**
 * Satu transaksi sebagai KARTU — tampilan < 640 px tab Transaksi (tabel
 * menyembunyikan terlalu banyak kolom di 375 px). Isinya sama dengan baris
 * tabel: tanggal, ruang, dompet/kategori, nominal bernada, penanda, dan
 * catatan terkunci. Ketuk = buka laci.
 *
 * Enter/Spasi membuka laci hanya bila fokusnya KARTU itu sendiri (`.self`):
 * Enter pada tombol "Tampilkan catatan" di dalamnya milik tombol itu, bukan
 * laci (temuan fe p3 #2).
 */
import { tanggalJam, type TransaksiBaris } from '~/adapters/cashflowBuku'

defineProps<{ t: TransaksiBaris; ruang: string; sorot?: boolean }>()
const emit = defineEmits<{ buka: [id: string] }>()
const { tcf, bahasa } = useCashflowI18n()
</script>

<template>
  <li>
    <div
      role="button" tabindex="0"
      class="block w-full rounded-xl border px-3 py-2.5 text-left text-sm transition"
      :class="sorot ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)]' : 'border-[color:var(--ca-border)] hover:bg-[var(--ca-panel-bg-strong)]'"
      @click="emit('buka', t.id)" @keydown.enter.self.prevent="emit('buka', t.id)" @keydown.space.self.prevent="emit('buka', t.id)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-[var(--ca-text)]">{{ t.kategori || t.dompet }}</p>
          <p class="truncate text-xs text-[var(--ca-subtle)]">{{ tanggalJam(t.tanggal, t.jam, bahasa) }} · {{ ruang }}<template v-if="t.kategori"> · {{ t.dompet }}</template></p>
        </div>
        <CashflowNominal class="shrink-0 font-semibold" :nilai="t.nominal" :jenis="t.jenis" :arah="t.arah" />
      </div>
      <div v-if="t.transfer || t.masaDepan || t.adaLampiran || t.adaCatatan || t.cicilanKe != null" class="mt-1.5 flex flex-wrap items-center gap-1">
        <span v-if="t.transfer" class="ca-pill-info whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.transfer') }}</span>
        <span v-if="t.masaDepan" class="ca-pill-gold whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.masaDepan') }}</span>
        <span v-if="t.cicilanKe != null" class="ca-pill-muted whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.cicilan')(t.cicilanKe) }}</span>
        <span v-if="t.adaLampiran" class="ca-pill-muted whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.lampiran') }}</span>
        <CashflowTeksTerkunci v-if="t.adaCatatan" jenis="transaksi" :id="t.id" />
      </div>
    </div>
  </li>
</template>
