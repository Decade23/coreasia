<script setup lang="ts">
/**
 * Tautan "Arti tiap kolom" yang membuka panel penjelasan. Menggantikan
 * paragraf keterangan panjang di bawah tabel: orang yang sudah paham tidak
 * perlu membacanya lagi tiap kali, yang belum tinggal satu klik.
 */
defineProps<{ butir: ReadonlyArray<{ judul: string; isi: string }> }>()
const { tcf } = useCashflowI18n()
const buka = ref(false)
</script>

<template>
  <button
    type="button" class="font-bold text-[var(--ca-text)] underline-offset-2 hover:underline"
    aria-haspopup="dialog" data-uji="arti-kolom" @click="buka = true"
  >{{ tcf('umum.artiKolom') }}</button>
  <CashflowLaci :show="buka" :judul="tcf('umum.artiKolom')" @close="buka = false">
    <dl class="space-y-4 text-sm" data-uji="arti-kolom-isi">
      <div v-for="b in butir" :key="b.judul">
        <dt class="font-bold text-[var(--ca-text)]">{{ b.judul }}</dt>
        <dd class="mt-1 leading-relaxed text-[var(--ca-muted)]">{{ b.isi }}</dd>
      </div>
    </dl>
  </CashflowLaci>
</template>
