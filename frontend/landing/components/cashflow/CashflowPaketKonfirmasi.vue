<script setup lang="ts">
/**
 * Konfirmasi dua aksi yang langsung terasa di aplikasi: hapus dan nonaktifkan.
 *
 * Hapus: bila daftar sudah bilang paket ini pernah dibeli, dialog lebih dulu
 * bilang server akan menolak dan menawarkan Nonaktifkan. Bila server menolak
 * (paket_sudah_dibeli, `ditolak`), dialog berganti jadi penjelasan dengan
 * tombol Nonaktifkan, bukan galat mentah. Menonaktifkan paket bawaan ikut
 * melepas bawaannya (muatanAktif), dan dialog menyebutnya.
 *
 * Selama aksi berjalan dialog tidak bisa ditutup, supaya hasilnya tidak
 * terlewat. Halaman yang menutupnya sesudah server menjawab.
 */
import type { PaketKredit } from '~/adapters/cashflowPaket'

const props = defineProps<{ jenis: 'hapus' | 'nonaktif' | null; paket: PaketKredit | null; ditolak: boolean; sibuk: boolean }>()
const emit = defineEmits<{ tutup: []; setuju: []; nonaktifkan: [] }>()
const { tcf } = useCashflowI18n()

const judul = computed(() => (props.jenis === 'nonaktif'
  ? tcf('paket.konfirmasi.nonaktifJudul')
  : props.ditolak ? tcf('paket.konfirmasi.ditolakJudul') : tcf('paket.konfirmasi.hapusJudul')))
const tutup = () => { if (!props.sibuk) emit('tutup') }
</script>

<template>
  <ConsoleModal :show="!!jenis && !!paket" :title="judul" size="sm" @close="tutup">
    <div v-if="paket" class="space-y-3 text-sm">
      <p class="text-[var(--ca-text)]">
        <strong>{{ tcf('paket.kredit')(paket.kredit) }}</strong>
        <span class="font-mono text-xs text-[var(--ca-muted)]"> · {{ paket.kode }}</span>
      </p>

      <template v-if="jenis === 'nonaktif'">
        <p class="text-[var(--ca-muted)]">{{ tcf('paket.konfirmasi.nonaktifKet')(paket.kode) }}</p>
        <p v-if="paket.bawaan" class="ca-tone-gold">{{ tcf('paket.konfirmasi.nonaktifBawaan') }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
          <button type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk" @click="emit('setuju')">
            <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ sibuk ? tcf('paket.menyimpan') : tcf('paket.nonaktifkan') }}
          </button>
        </div>
      </template>

      <template v-else-if="ditolak">
        <p class="text-[var(--ca-text)]" role="alert">{{ tcf('paket.galat.sudahDibeli') }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.tutup') }}</button>
          <button v-if="paket.aktif" type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="sibuk" @click="emit('nonaktifkan')">
            <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ sibuk ? tcf('paket.menyimpan') : tcf('paket.nonaktifkan') }}
          </button>
        </div>
      </template>

      <template v-else>
        <p class="text-[var(--ca-muted)]">{{ tcf('paket.konfirmasi.hapusKet')(paket.kode) }}</p>
        <p v-if="paket.pernahDibeli" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-3 py-2 text-[var(--ca-text)]">
          {{ tcf('paket.konfirmasi.hapusDibeli') }}
        </p>
        <p v-if="paket.bawaan" class="ca-tone-gold">{{ tcf('paket.konfirmasi.hapusBawaan') }}</p>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tutup">{{ tcf('umum.batal') }}</button>
          <button v-if="paket.pernahDibeli && paket.aktif" type="button" class="ca-btn-primary" :disabled="sibuk" @click="emit('nonaktifkan')">{{ tcf('paket.nonaktifkan') }}</button>
          <button type="button" class="ca-btn-danger inline-flex items-center gap-2 !px-4 !py-2.5" :disabled="sibuk" @click="emit('setuju')">
            <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ sibuk ? tcf('paket.konfirmasi.menghapus') : tcf('paket.hapus') }}
          </button>
        </div>
      </template>
    </div>
  </ConsoleModal>
</template>
