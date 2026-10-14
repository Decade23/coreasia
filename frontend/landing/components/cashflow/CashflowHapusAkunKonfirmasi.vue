<script setup lang="ts">
/**
 * Satu-satunya konfirmasi sebelum hapus permanen. Tanpa kolom alasan
 * (keputusan P3): alasan audit diisi otomatis oleh useCashflowAdmin.
 *
 * Selama penghapusan berjalan, dialog tidak bisa ditutup (Esc, latar, tombol
 * Batal) supaya hasilnya tidak terlewat; halaman yang menutupnya sesudah
 * server menjawab.
 */
import { bagianIsi, type PermintaanHapus } from '~/adapters/cashflowHapusAkun'

const props = defineProps<{ permintaan: PermintaanHapus | null; sibuk: boolean }>()
const emit = defineEmits<{ tutup: []; setuju: [] }>()
const { tcf } = useCashflowI18n()

const isi = computed(() => (props.permintaan
  ? bagianIsi(props.permintaan.isi).map(b => tcf(`hapusAkun.isi.${b.kunci}`)(b.n) as string).join(' · ')
  : ''))
const tutup = () => { if (!props.sibuk) emit('tutup') }
const setuju = () => { if (!props.sibuk) emit('setuju') }
</script>

<template>
  <ConsoleModal :show="!!permintaan" :title="tcf('hapusAkun.konfirmasiJudul')" size="sm" @close="tutup">
    <div v-if="permintaan" class="space-y-3 text-sm">
      <p class="text-[var(--ca-text)]">
        <span class="font-mono">{{ permintaan.emailTersamar }}</span>
        <span v-if="permintaan.nama" class="text-[var(--ca-muted)]"> · {{ permintaan.nama }}</span>
      </p>
      <p v-if="isi" class="text-xs text-[var(--ca-muted)]">{{ isi }}</p>
      <p class="text-[var(--ca-muted)]">{{ tcf('hapusAkun.konfirmasiKet') }}</p>
      <p class="text-[var(--ca-muted)]">{{ tcf('hapusAkun.konfirmasiPindah') }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
        <button type="button" class="ca-btn-danger !px-4 !py-2.5" :disabled="sibuk" @click="setuju">
          <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          {{ sibuk ? tcf('hapusAkun.menghapus') : tcf('hapusAkun.hapus') }}
        </button>
      </div>
    </div>
  </ConsoleModal>
</template>
