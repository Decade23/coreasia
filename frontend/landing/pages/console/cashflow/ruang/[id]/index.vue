<script setup lang="ts">
/**
 * Ruang 360 › Ringkas — ranah `ruang` (T2): pengaturan ruang (nama utuh,
 * jenis, aturan hapus, patungan, ada cara bayar/QRIS — isinya TIDAK dikirim
 * server), hitungan, dan agregat BERSIH (hanya bila kasus memegang ranah
 * transaksi; tanpa kaki transfer, piutang, dan dompet terarsip — 0090 §3).
 * Data dimuat bersama induk (satu baris audit baca_ruang per kasus+lingkup)
 * dan dibuang saat kasus habis.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { rupiah, angka } from '~/adapters/cashflow'

const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()
const { kunci360, r360, muat360, labelOrang } = useCashflowRuang()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

watch(kunci360, (k) => { if (k && !r360.value) muat(muat360) }, { immediate: true })

const ruang = computed(() => r360.value?.ruang ?? null)
</script>

<template>
  <CashflowPanelTab ranah="ruang" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!r360">
    <div v-if="r360 && ruang" class="space-y-4">
      <section class="ca-console-dialog p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="break-all text-base font-bold text-[var(--ca-text)] sm:text-lg">{{ ruang.nama }}</h3>
          <CashflowSalinId :id="ruang.id" />
          <span v-if="ruang.jenis" class="ca-pill-muted text-[0.7rem]">{{ tcf(`ruang.jenisOpsi.${ruang.jenis}`) }}</span>
        </div>
        <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
          <dt class="text-[var(--ca-muted)]">{{ tcf('ruang.pemilik') }}</dt>
          <dd class="text-[var(--ca-text)]">
            <NuxtLink v-if="ruang.pemilikId" :to="`/console/cashflow/pengguna/${ruang.pemilikId}`" class="font-mono underline-offset-2 hover:underline">{{ labelOrang(ruang.pemilikId) }}</NuxtLink>
            <span v-else>{{ tcf('r360.akunHilang') }}</span>
            <span v-if="ruang.ownerNick" class="text-[var(--ca-subtle)]"> · {{ ruang.ownerNick }}</span>
          </dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('ruang.dibuat') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ formatWaktu(ruang.dibuatIso) }} WIB</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('r360.aturanHapus') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ ruang.aturanHapus || '—' }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('r360.patungan') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ ruang.patungan ? tcf('umum.ya') : tcf('umum.tidak') }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('r360.caraBayar') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ ruang.adaCaraBayar ? tcf('r360.diisi') : tcf('r360.kosong') }} · QRIS {{ ruang.adaQris ? tcf('r360.diisi') : tcf('r360.kosong') }}</dd>
        </dl>
        <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('r360.caraBayarKet') }}</p>
      </section>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile icon="lucide:users" warna="sky" :label="tcf('r360.anggota')" :nilai="angka(r360.hitung.anggota)" :keterangan="tcf('r360.bekasJumlah')(r360.hitung.bekas_anggota)" />
        <CashflowStatTile icon="lucide:list" warna="amber" :label="tcf('pengguna.transaksi')" :nilai="angka(r360.agregat?.transaksi ?? r360.hitung.transaksi)" :keterangan="r360.agregat?.terakhirCatatIso ? `${tcf('ruangTab.terakhir')} ${formatTanggal(r360.agregat.terakhirCatatIso)}` : undefined" />
        <template v-if="r360.agregat">
          <CashflowStatTile icon="lucide:arrow-down-left" warna="emerald" :label="tcf('ringkas.masukBersih')" :nilai="rupiah(r360.agregat.masukBersih)" :keterangan="tcf('ringkas.bersihKet')" />
          <CashflowStatTile icon="lucide:arrow-up-right" warna="rose" :label="tcf('ringkas.keluarBersih')" :nilai="rupiah(r360.agregat.keluarBersih)" :keterangan="tcf('ringkas.bersihKet')" />
        </template>
      </div>
      <p v-if="!r360.agregat" class="text-xs text-[var(--ca-subtle)]">{{ tcf('r360.tanpaAgregat') }}</p>
      <p class="text-xs text-[var(--ca-subtle)]">
        {{ tcf('r360.hitungKet')(r360.hitung.undangan_aktif, r360.hitung.dompet, r360.hitung.jejak, r360.hitung.sampah) }}
      </p>
    </div>
  </CashflowPanelTab>
</template>
