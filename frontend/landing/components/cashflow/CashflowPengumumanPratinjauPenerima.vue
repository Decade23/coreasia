<script setup lang="ts">
/**
 * Kotak "Siapa yang menerima" di samping pratinjau tampilan pengumuman.
 * Hanya menampilkan: datanya dari useCashflowPratinjauPenerima di halaman.
 * Angka null (server tidak mengirim) ditulis "—", bukan 0.
 *
 * `jumlah` mencakup yang belum bisa menerima karena aplikasinya di bawah
 * 1.3.8 dan yang versinya belum diketahui. Keduanya ditulis sebagai bagian
 * ("Di antaranya …"), hanya bila lebih dari nol. Yang dikecualikan (akun
 * internal, lainnya) tidak termasuk jumlah dan ditulis terpisah.
 */
import { VERSI_SASARAN, type PratinjauPenerima } from '~/adapters/cashflowPengumumanAturan'

defineProps<{
  data: PratinjauPenerima | null
  memuat: boolean
  pesanGalat: string
  belumAktif: boolean
  lengkap: boolean
}>()
const { tcf, bahasa } = useCashflowI18n()
const angka = (n: number | null) => (n === null ? '—' : n.toLocaleString(bahasa.value === 'en' ? 'en-US' : 'id-ID'))
</script>

<template>
  <section class="rounded-2xl border border-[color:var(--ca-border)] p-4" :aria-busy="memuat" aria-live="polite" data-uji="pratinjau-penerima">
    <h4 class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.judul') }}</h4>
    <p v-if="belumAktif" class="mt-3 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.belumAktif') }}</p>
    <p v-else-if="!lengkap" class="mt-3 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.lengkapi') }}</p>
    <template v-else>
      <p v-if="pesanGalat" class="mt-3 text-xs ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <!-- jumlah MENCAKUP yang tak terjangkau versi lama dan yang versinya tak diketahui (keputusan 13 Nov):
           keduanya ditulis sebagai bagian dari jumlah, bukan angka terpisah. Yang dikecualikan tidak dihitung. -->
      <p class="mt-3 flex items-baseline gap-2" :class="memuat ? 'opacity-50' : ''">
        <span class="font-display text-2xl font-bold tabular-nums text-[var(--ca-text)]" data-uji="pratinjau-jumlah">{{ data ? angka(data.jumlah) : '—' }}</span>
        <span class="text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.satuan')(data?.jumlah ?? 0) }}</span>
      </p>
      <p v-if="memuat" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.pratinjauPenerima.menghitung') }}</p>
      <ul v-if="data && (data.takTerjangkau || data.versiTakDiketahui)" class="mt-2 space-y-1 text-xs">
        <li v-if="data.takTerjangkau" class="ca-tone-gold" data-uji="pratinjau-tak-terjangkau">{{ tcf('pengumuman.pratinjauPenerima.takTerjangkau')(angka(data.takTerjangkau), VERSI_SASARAN.versi) }}</li>
        <li v-if="data.versiTakDiketahui" class="text-[var(--ca-muted)]" data-uji="pratinjau-versi-tak-diketahui">{{ tcf('pengumuman.pratinjauPenerima.versiTakDiketahui')(angka(data.versiTakDiketahui)) }}</li>
      </ul>
      <div v-if="data" class="mt-3 space-y-2 border-t border-[color:var(--ca-border)] pt-3 text-xs">
        <p class="font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.dikecualikan') }}</p>
        <dl class="space-y-2">
          <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.dikecualikanInternal') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(data.dikecualikanInternal) }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-[var(--ca-muted)]">{{ tcf('pengumuman.pratinjauPenerima.dikecualikanLain') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(data.dikecualikanLain) }}</dd></div>
        </dl>
      </div>
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
