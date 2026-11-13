<script setup lang="ts">
/**
 * Kotak "Siapa yang menerima" di samping pratinjau tampilan pengumuman.
 * Hanya menampilkan: datanya dari useCashflowPratinjauPenerima di halaman.
 * Angka null (server tidak mengirim) ditulis "—", bukan 0.
 */
import { VERSI_SASARAN, type PratinjauPenerima } from '~/adapters/cashflowPengumumanAturan'

defineProps<{
  data: PratinjauPenerima | null
  memuat: boolean
  pesanGalat: string
  belumAktif: boolean
  lengkap: boolean
}>()
const { tcf } = useCashflowI18n()
const angka = (n: number | null) => (n === null ? '—' : n.toLocaleString('id-ID'))
</script>

<template>
  <section class="rounded-2xl border border-[color:var(--ca-border)] p-4" :aria-busy="memuat" aria-live="polite" data-uji="pratinjau-penerima">
    <h4 class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.judul') }}</h4>
    <p v-if="belumAktif" class="mt-3 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.belumAktif') }}</p>
    <p v-else-if="!lengkap" class="mt-3 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.lengkapi') }}</p>
    <template v-else>
      <p v-if="pesanGalat" class="mt-3 text-xs ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <div class="mt-3 flex items-baseline justify-between gap-3">
        <span class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.jumlah') }}</span>
        <span class="font-display text-2xl font-bold tabular-nums text-[var(--ca-text)]" :class="memuat ? 'opacity-50' : ''">{{ data ? angka(data.jumlah) : '—' }}</span>
      </div>
      <p v-if="memuat" class="text-right text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.pratinjauPenerima.menghitung') }}</p>
      <dl v-if="data" class="mt-3 space-y-2 border-t border-[color:var(--ca-border)] pt-3 text-xs">
        <div>
          <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.takTerjangkau') }}</dt><dd class="tabular-nums" :class="data.takTerjangkau ? 'ca-tone-gold font-semibold' : 'text-[var(--ca-text)]'">{{ angka(data.takTerjangkau) }}</dd></div>
          <p class="mt-0.5 text-[var(--ca-subtle)]">{{ tcf('pengumuman.pratinjauPenerima.takTerjangkauKet')(VERSI_SASARAN.versi) }}</p>
        </div>
        <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.versiTakDiketahui') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(data.versiTakDiketahui) }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.dikecualikanInternal') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(data.dikecualikanInternal) }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.dikecualikanLain') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(data.dikecualikanLain) }}</dd></div>
      </dl>
      <div v-if="data" class="mt-3 border-t border-[color:var(--ca-border)] pt-3">
        <p class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.contoh') }}</p>
        <p v-if="!data.contoh.length" class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.pratinjauPenerima.contohKosong') }}</p>
        <ul v-else class="mt-2 space-y-1">
          <li v-for="(c, i) in data.contoh" :key="i" class="flex min-w-0 justify-between gap-3 text-xs">
            <span class="min-w-0 truncate font-mono text-[var(--ca-text)]">{{ c.email }}</span>
            <span class="shrink-0 tabular-nums text-[var(--ca-subtle)]">{{ c.versi ?? tcf('pengumuman.pratinjauPenerima.versiTak') }}</span>
          </li>
        </ul>
      </div>
      <p class="mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.pratinjauPenerima.ket') }}</p>
    </template>
  </section>
</template>
