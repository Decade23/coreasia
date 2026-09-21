<script setup lang="ts">
/**
 * Teks bebas (T3) — SATU KLIK "Tampilkan catatan" (keputusan Master 21 Sep
 * 2026, tanpa dialog). Server T2 hanya mengirim `ada_catatan` / `ada_judul`;
 * isinya dibuka lewat kasus anak yang dibuka OTOMATIS (10 menit, alasan
 * otomatis, izin cashflow:investigasi) lalu admin_teks untuk BARIS INI SAJA
 * (satu id, satu baris audit baca_teks). Sengaja tanpa "buka sekaligus":
 * tombol per baris yang diam-diam membuka hingga 100 catatan lain (termasuk
 * milik anggota lain) melanggar minimisasi (temuan fe p2 #3). Kasus anaknya
 * dipakai ulang selama 10 menit, jadi klik berikutnya tidak membuka kasus
 * anak baru. Sesudah terbuka, isinya tampil di sini sampai kasus anaknya
 * habis — lalu tombolnya kembali.
 */
import type { JenisTeks } from '~/adapters/cashflowBuku'

const props = defineProps<{
  jenis: JenisTeks
  id: string | number
}>()

const { tcf } = useCashflowI18n()
const kasus = useCashflowKasus()
const { aksi } = useCashflowMuat()
const sibuk = ref(false)

const isi = computed(() => kasus.teks(props.jenis, props.id))
const label = computed(() => tcf(`teks.label.${props.jenis}`) as string)
const tampilkan = async () => {
  if (sibuk.value) return
  sibuk.value = true
  try {
    await aksi(() => kasus.mintaTeks(props.jenis, [props.id]))
  } finally {
    sibuk.value = false
  }
}
</script>

<template>
  <span v-if="isi" class="inline-flex max-w-full flex-col gap-0.5 rounded-lg border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-2 py-1 text-xs text-[var(--ca-text)]">
    <span v-if="!isi.length" class="text-[var(--ca-subtle)]">{{ tcf('teks.kosong') }}</span>
    <span v-for="p in isi" :key="p.kolom" class="break-words">
      <span class="text-[var(--ca-subtle)]">{{ tcf(`teks.kolom.${p.kolom.split('.')[0]}`) }}{{ p.kolom.includes('.') ? ` · ${p.kolom.split('.').slice(1).join('.')}` : '' }}:</span> {{ p.isi }}
    </span>
  </span>
  <button
    v-else type="button"
    class="inline-flex items-center gap-1 rounded-full border border-[color:var(--ca-border)] px-2 py-0.5 text-xs text-[var(--ca-muted)] transition hover:border-[color:var(--ca-gold-border)] hover:text-[var(--ca-text)] disabled:opacity-60"
    :disabled="sibuk" :title="tcf('teks.tampilkanKet')" @click.stop="tampilkan"
  >
    <Icon :name="sibuk ? 'lucide:loader-2' : 'lucide:eye'" class="h-3 w-3" :class="{ 'animate-spin': sibuk }" aria-hidden="true" />
    {{ tcf('teks.tampilkan')(label) }}
  </button>
</template>
