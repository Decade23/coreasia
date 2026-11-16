<script setup lang="ts">
/**
 * Konfirmasi sebelum mengganti kunci yang sudah tersimpan dan sebelum
 * menghapus kunci. Keduanya tidak bisa dibatalkan dari console: kunci lama
 * tidak bisa dibaca lagi, dan menghapus kunci ikut mematikan cadangan.
 *
 * Selama aksi berjalan dialog tidak bisa ditutup, supaya hasilnya tidak
 * terlewat. Halaman yang menutupnya sesudah server menjawab.
 */
const props = defineProps<{ jenis: 'ganti' | 'hapus' | null; sibuk: boolean }>()
const emit = defineEmits<{ tutup: []; setuju: [] }>()
const { tcf } = useCashflowI18n()

/* Judul dan isi mengikuti jenis TERAKHIR supaya tidak berkedip kosong saat dialog menutup. */
const terakhir = ref<'ganti' | 'hapus'>('ganti')
watch(() => props.jenis, (j) => { if (j) terakhir.value = j }, { immediate: true })
const tutup = () => { if (!props.sibuk) emit('tutup') }
</script>

<template>
  <ConsoleModal :show="!!jenis" :title="tcf(`cadangan.konfirmasi.${terakhir}Judul`)" size="sm" @close="tutup">
    <div class="space-y-3 text-sm" data-uji="cadangan-konfirmasi">
      <p class="text-[var(--ca-muted)]">{{ tcf(`cadangan.konfirmasi.${terakhir}Ket`) }}</p>
      <div class="flex flex-wrap justify-end gap-2 pt-2">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
        <button
          v-if="terakhir === 'hapus'" type="button" class="ca-btn-danger inline-flex items-center gap-2 !px-4 !py-2.5" :disabled="sibuk"
          data-uji="cadangan-konfirmasi-setuju" @click="emit('setuju')"
        >
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ sibuk ? tcf('cadangan.kunci.menghapus') : tcf('cadangan.kunci.hapus') }}
        </button>
        <button v-else type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk" data-uji="cadangan-konfirmasi-setuju" @click="emit('setuju')">
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ sibuk ? tcf('cadangan.setelan.menyimpan') : tcf('cadangan.kunci.ganti') }}
        </button>
      </div>
    </div>
  </ConsoleModal>
</template>
