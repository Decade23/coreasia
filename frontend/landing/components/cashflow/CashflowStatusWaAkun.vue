<script setup lang="ts">
/**
 * Status WhatsApp satu akun di daftar pengguna: cara nomor dibuktikan (pesan
 * masuk atau kode terkirim), atau lewat tanpa nomor, beserta tanggalnya. Di
 * bawahnya tanda kecil nomor dipakai banyak akun (C4) dan kredit gratis
 * ditahan (K2). Keduanya hanya tanda untuk tim, tidak pernah ke pengguna.
 *
 * `baris`: tata letak kartu ponsel (label dan tanggal sebaris).
 */
import type { StatusWaAkun, StatusWaAkunKode } from '~/adapters/cashflowWa'

const props = defineProps<{ status: StatusWaAkun; baris?: boolean }>()
const { tcf } = useCashflowI18n()

const NADA: Record<StatusWaAkunKode, string> = {
  masuk: 'ca-tone-emerald', kirim: 'ca-tone-emerald', lewat: 'ca-tone-gold', belum: 'text-[var(--ca-muted)]', lain: 'text-[var(--ca-muted)]',
}
/** Lewat karena nomor tidak terbaca dibedakan dari lewat saat gangguan. */
const label = computed(() => (props.status.status === 'lewat' && props.status.sebabLewat === 'tanpa_nomor'
  ? tcf('pengguna.statusWa.lewatTanpaNomor')
  : tcf(`pengguna.statusWa.${props.status.status}`)))
</script>

<template>
  <div class="min-w-0">
    <div :class="baris ? 'flex flex-wrap items-baseline gap-x-2' : ''">
      <span class="font-semibold leading-snug" :class="[NADA[status.status], baris ? 'text-sm' : 'block text-xs']">{{ label }}</span>
      <span v-if="status.padaIso" class="text-xs tabular-nums text-[var(--ca-subtle)]" :class="baris ? '' : 'block'">{{ status.pada }}</span>
    </div>
    <div v-if="status.nomorRamai || status.kreditDitahan" class="mt-1 flex flex-wrap gap-1">
      <span v-if="status.nomorRamai" class="ca-pill-gold !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight" :title="tcf('pengguna.statusWa.ramaiKet')">{{ tcf('pengguna.statusWa.ramai') }}</span>
      <span v-if="status.kreditDitahan" class="ca-pill-info !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight" :title="tcf('pengguna.statusWa.kreditKet')">{{ tcf('pengguna.statusWa.kredit') }}</span>
    </div>
  </div>
</template>
