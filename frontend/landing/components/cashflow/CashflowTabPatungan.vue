<script setup lang="ts">
/**
 * Isi Ruang 360 › Dompet › Patungan (admin_patungan_ruang, ranah dompet):
 * saldo per anggota saat ini (sama dengan saldo_patungan aplikasi) dan per
 * BEKAS anggota (K-F3-10) — aplikasi tidak menampilkan mereka, padahal
 * sengketa patungan sering muncul sesudah seseorang keluar. Semua angka dari
 * server; tidak ada yang dihitung ulang di sini.
 *
 * `seimbang` = jumlah semua saldo (anggota + bekas) 0. Selain itu ada yang
 * janggal di data dan ditampilkan sebagai peringatan, bukan disembunyikan.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import type { Patungan, SaldoPatungan } from '~/adapters/cashflowRanahBuku'

defineProps<{
  data: Patungan
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const { tcf } = useCashflowI18n()

const KOLOM = ['ditalangi', 'ditanggung', 'bayarLunas', 'terimaLunas'] as const
const nadaSaldo = (s: SaldoPatungan) => (s.saldo < 0 ? 'text-[var(--ca-danger-text)]' : s.saldo > 0 ? 'text-[var(--ca-emerald-text)]' : 'text-[var(--ca-text)]')
</script>

<template>
  <div class="space-y-5" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <p v-if="!data.fitur" class="rounded-xl border border-dashed border-[color:var(--ca-gold-border)] px-4 py-3 text-sm text-[var(--ca-muted)]">
      {{ tcf('patungan.fiturMati') }}
    </p>

    <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
      <div class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.dibagi') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.ringkas.transaksiDibagi) }}</dd></div>
      <div class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.totalDibagi') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rupiah(data.ringkas.totalDibagi) }}</dd></div>
      <div class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.pelunasan') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.ringkas.pelunasan) }}</dd></div>
      <div class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.totalPelunasan') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rupiah(data.ringkas.totalPelunasan) }}</dd></div>
      <div v-if="data.ringkas.pelunasanTanpaTransfer" class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.tanpaTransfer') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-gold-text)]">{{ angka(data.ringkas.pelunasanTanpaTransfer) }}</dd></div>
      <div v-if="data.ringkas.selisihBagi" class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.selisih') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-gold-text)]">{{ rupiah(data.ringkas.selisihBagi) }}</dd></div>
      <div v-if="data.ringkas.dibagiTakDihitung" class="flex items-baseline gap-1"><dt>{{ tcf('patungan.ringkas.takDihitung') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.ringkas.dibagiTakDihitung) }}</dd></div>
    </dl>
    <p class="text-xs" :class="data.seimbang ? 'text-[var(--ca-emerald-text)]' : 'text-[var(--ca-danger-text)]'" :role="data.seimbang ? undefined : 'alert'">
      {{ data.seimbang ? tcf('patungan.seimbang') : tcf('patungan.takSeimbang')(rupiah(data.ringkas.jumlahSaldo)) }}
    </p>

    <section v-for="bagian in (['saldo', 'bekas'] as const)" :key="bagian" class="space-y-2">
      <div>
        <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ bagian === 'saldo' ? tcf('patungan.anggota') : tcf('patungan.bekas') }}</h3>
        <p v-if="bagian === 'bekas'" class="text-xs text-[var(--ca-subtle)]">{{ tcf('patungan.bekasKet') }}</p>
      </div>
      <CashflowKeadaanKosong v-if="!data[bagian].length" :pesan="bagian === 'saldo' ? tcf('patungan.anggotaKosong') : tcf('patungan.bekasKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="s in data[bagian]" :key="s.orang" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-[var(--ca-text)]">{{ labelOrang(s.orang) }}</span>
              <span v-if="bagian === 'bekas'" class="ca-pill-muted text-[0.7rem]">{{ tcf('patungan.bekas') }}</span>
              <CashflowSalinId :id="s.orang" ikon />
            </div>
            <p class="mt-0.5 text-xs tabular-nums text-[var(--ca-muted)]">
              <template v-for="(k, i) in KOLOM" :key="k"><template v-if="i"> · </template>{{ tcf(`patungan.kolom.${k}`) }} {{ rupiah(s[k]) }}</template>
            </p>
          </div>
          <div class="text-right">
            <div class="text-xs text-[var(--ca-muted)]">{{ tcf('patungan.kolom.saldo') }}</div>
            <div class="font-semibold tabular-nums" :class="nadaSaldo(s)">{{ rupiah(s.saldo) }}</div>
          </div>
        </li>
      </ul>
    </section>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('patungan.saldoKet') }}</p>
  </div>
</template>
