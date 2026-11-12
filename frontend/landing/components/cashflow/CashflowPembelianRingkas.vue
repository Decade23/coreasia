<script setup lang="ts">
/**
 * Empat ubin di atas daftar pembelian: jumlah lunas, nominal kotor, perkiraan
 * yang diterima, dan jumlah yang dibatalkan. Angkanya dari server, dihitung
 * atas semua pembelian yang cocok saringan (bukan hanya halaman yang tampil)
 * dan tanpa pembelian uji. Catatan di bawahnya mengatakan itu terang-terangan.
 *
 * Hanya menampilkan; halaman yang memanggil server.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import type { RingkasPembelian } from '~/adapters/cashflowPembelian'

defineProps<{ ringkas: RingkasPembelian }>()
const { tcf } = useCashflowI18n()
</script>

<template>
  <section class="space-y-3" :aria-label="tcf('pembelian.judul')" data-uji="pembelian-ringkas">
    <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <CashflowStatTile
        icon="lucide:badge-check" warna="emerald" :label="tcf('pembelian.ubin.lunas')"
        :nilai="angka(ringkas.lunas)" :keterangan="tcf('pembelian.ubin.lunasKet')"
      />
      <CashflowStatTile
        icon="lucide:wallet" warna="sky" :label="tcf('pembelian.ubin.kotor')"
        :nilai="rupiah(ringkas.nominalLunas)" :keterangan="tcf('pembelian.ubin.kotorKet')"
      />
      <CashflowStatTile
        icon="lucide:piggy-bank" warna="amber" :label="tcf('pembelian.ubin.diterima')"
        :nilai="rupiah(ringkas.perkiraanDiterima)" :keterangan="tcf('pembelian.ubin.diterimaKet')"
      />
      <CashflowStatTile
        icon="lucide:undo-2" warna="rose" :label="tcf('pembelian.ubin.batal')"
        :nilai="angka(ringkas.batal)" :keterangan="tcf('pembelian.ubin.batalKet')"
      />
    </div>
    <p class="flex items-start gap-2 text-xs text-[var(--ca-muted)]" data-uji="pembelian-catatan-uji">
      <Icon name="lucide:info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('pembelian.catatanUji') }}</span>
    </p>
  </section>
</template>
