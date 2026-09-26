<script setup lang="ts">
/**
 * Riwayat patungan satu halaman (admin_patungan_riwayat, ranah dompet):
 *   bagi   transaksi yang dibagi — pembayar, bagian per orang, selisih
 *          (amount − Σ bagian); split atas pemasukan ditandai "tidak ikut
 *          saldo" (0073), bukan disembunyikan;
 *   lunas  pelunasan — dari, ke, pencatat, bukti ada/tidak, dan apakah
 *          kaki transfernya masih hidup.
 * Catatan, foto bukti, dan identitas orang tidak dikirim. Baris bagi
 * bertaut ke laci transaksi (?tx= tab Transaksi).
 */
import { rupiah } from '~/adapters/cashflow'
import type { BagiBaris, LunasBaris } from '~/adapters/cashflowRanahBuku'

defineProps<{
  jenis: 'bagi' | 'lunas'
  bagi: BagiBaris[]
  lunas: LunasBaris[]
  labelOrang: (uid: string | null) => string
  keTx: (id: string) => string
  memuat?: boolean
}>()
const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()
</script>

<template>
  <div :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <template v-if="jenis === 'bagi'">
      <CashflowKeadaanKosong v-if="!bagi.length" :pesan="tcf('patungan.bagiKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="b in bagi" :key="b.id" class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-[var(--ca-text)]">{{ formatTanggal(b.tanggal) }}</span>
              <span class="text-[var(--ca-muted)]">{{ b.kategori || '—' }}</span>
              <span v-if="!b.dihitungSaldo" class="ca-pill-muted text-[0.7rem]">{{ tcf('patungan.takDihitungBaris') }}</span>
              <span v-if="b.selisih" class="ca-pill-gold text-[0.7rem]">{{ tcf('patungan.selisihBaris')(rupiah(b.selisih)) }}</span>
              <span v-if="b.adaCatatan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('patungan.adaCatatan') }}</span>
            </div>
            <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
              {{ tcf('patungan.pembayar') }} <span class="font-mono">{{ labelOrang(b.pembayar) }}</span> · {{ tcf('patungan.bagian')(b.jumlahBagian) }}
            </p>
            <ul class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-[var(--ca-subtle)]">
              <li v-for="x in b.bagian" :key="x.orang"><span class="font-mono">{{ labelOrang(x.orang) }}</span> {{ rupiah(x.nominal) }}</li>
            </ul>
          </div>
          <CashflowNominal class="font-semibold" :nilai="b.nominal" :arah="b.arah" />
          <NuxtLink :to="keTx(b.id)" class="ca-btn-secondary !px-3 !py-1 text-xs">{{ tcf('patungan.bukaTx') }}</NuxtLink>
        </li>
      </ul>
    </template>
    <template v-else>
      <CashflowKeadaanKosong v-if="!lunas.length" :pesan="tcf('patungan.lunasKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="l in lunas" :key="l.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-[var(--ca-text)]">{{ formatWaktu(l.padaIso) }}</span>
              <span class="text-xs text-[var(--ca-muted)]">
                {{ tcf('patungan.dari') }} <span class="font-mono">{{ labelOrang(l.dari) }}</span>
                {{ tcf('patungan.ke') }} <span class="font-mono">{{ labelOrang(l.ke) }}</span>
              </span>
              <span v-if="!l.transferGroup" class="ca-pill-gold text-[0.7rem]">{{ tcf('patungan.tanpaTransfer') }}</span>
              <span v-else-if="!l.transferHidup" class="ca-pill-danger text-[0.7rem]">{{ tcf('patungan.transferHilang') }}</span>
              <span v-if="l.adaBukti" class="ca-pill-muted text-[0.7rem]">{{ tcf('patungan.adaBukti') }}</span>
            </div>
            <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
              {{ tcf('patungan.dicatatOleh') }} <span class="font-mono">{{ labelOrang(l.dicatatOleh) }}</span>
              <template v-if="l.adaCatatan"> · {{ tcf('patungan.adaCatatan') }}</template>
            </p>
          </div>
          <span class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rupiah(l.nominal) }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
