<script setup lang="ts">
/**
 * Pengguna 360 › Ruang — keanggotaan (ranah `akun`), dari admin_pengguna_360.
 *
 * - Ruang DALAM lingkup kasus: nama utuh, bergabung, peran, dan agregat
 *   lengkap (ruang dan olehnya; "bersih" = uang berpindah: tanpa kaki
 *   transfer, dompet piutang/kasbon, dan dompet terarsip — M/0090 §3, sama
 *   dengan rekap_ruang 0068 dan Beranda).
 * - Ruang DI LUAR lingkup: nama tersamar, jenis, peran, jumlah anggota, dan
 *   transaksi olehnya saja — server tidak mengirim angka anggota lain. Kasus
 *   otomatis sudah memuat SEMUA ruang subjek (keputusan Master 21 Sep 2026),
 *   jadi daftar ini biasanya kosong; yang tersisa (mis. kasus lama, ruang
 *   baru) = "Masukkan ke lingkup" satu klik, tanpa dialog (admin_kasus_tambah
 *   p_ruang; alasan diwarisi; tercatat).
 *
 * Baris ruang sengaja TEKS + salin id, bukan tautan: /ruang/[id] baru ada di
 * Fase 2 (tidak ada tautan ke rute yang belum ada).
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { rupiah, angka } from '~/adapters/cashflow'
import type { RuangSubjek } from '~/adapters/cashflowBuku'

const { tcf, formatTanggal } = useCashflowI18n()
const kasus = useCashflowKasus()
const { kunci360, p360, muat360 } = useCashflowPengguna()
const { memuat, galat, pesanGalat, muat, aksi } = useCashflowMuat()

watch(kunci360, (k) => { if (k && !p360.value) muat(muat360) }, { immediate: true })

const dalam = computed(() => p360.value?.ruang.filter(r => r.dalamLingkup) ?? [])
const luar = computed(() => p360.value?.ruang.filter(r => !r.dalamLingkup) ?? [])

const menambah = ref(false)
const masukkan = async (r: RuangSubjek) => {
  if (menambah.value) return
  menambah.value = true
  try {
    await aksi(() => kasus.tambah([], [r.id]), { sukses: tcf('ruangTab.ditambah') })
  } finally {
    menambah.value = false
  }
}
const peran = (r: RuangSubjek) => (r.pemilik ? tcf('pengguna.pemilik') : r.peran || '—')
</script>

<template>
  <div>
    <CashflowPanelTab
      ranah="akun" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!p360"
      :kosong="!!p360 && !p360.ruang.length" :pesan-kosong="tcf('ruangTab.kosong')"
    >
      <div class="space-y-5">
        <section v-if="dalam.length">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ruangTab.dalam')(dalam.length) }}</h3>
          <ul class="mt-2 grid gap-3 lg:grid-cols-2">
            <li v-for="r in dalam" :key="r.id" class="ca-console-dialog p-4 text-sm">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-[var(--ca-text)]">{{ r.nama }}</span>
                <CashflowSalinId :id="r.id" />
                <span v-if="r.jenis" class="ca-pill-muted text-[0.7rem]">{{ tcf(`ruang.jenisOpsi.${r.jenis}`) }}</span>
                <span v-if="r.bekas" class="ca-pill-gold text-[0.7rem]">{{ tcf('ruangTab.bekas') }}</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ca-muted)]">
                {{ peran(r) }} · {{ tcf('ruangTab.anggota')(r.anggota) }}<template v-if="r.gabungIso"> · {{ tcf('ruangTab.gabung') }} {{ formatTanggal(r.gabungIso) }}</template>
              </p>
              <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.txDia') }}</dt><dd class="text-right tabular-nums text-[var(--ca-text)]">{{ angka(r.txOlehDia) }}</dd>
                <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.masukDia') }}</dt><dd class="text-right"><CashflowNominal :nilai="r.masukBersihDia" arah="masuk" /></dd>
                <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.keluarDia') }}</dt><dd class="text-right"><CashflowNominal :nilai="r.keluarBersihDia" arah="keluar" /></dd>
                <template v-if="r.agregat">
                  <dt class="mt-2 text-[var(--ca-muted)]">{{ tcf('ruangTab.txRuang') }}</dt><dd class="mt-2 text-right tabular-nums text-[var(--ca-text)]">{{ angka(r.agregat.transaksi) }}</dd>
                  <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.masukRuang') }}</dt><dd class="text-right tabular-nums text-[var(--ca-text)]">{{ rupiah(r.agregat.masukBersih) }}</dd>
                  <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.keluarRuang') }}</dt><dd class="text-right tabular-nums text-[var(--ca-text)]">{{ rupiah(r.agregat.keluarBersih) }}</dd>
                  <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.dompet') }}</dt><dd class="text-right tabular-nums text-[var(--ca-text)]">{{ angka(r.agregat.dompet) }}</dd>
                  <dt class="text-[var(--ca-muted)]">{{ tcf('ruangTab.terakhir') }}</dt><dd class="text-right text-[var(--ca-text)]">{{ formatTanggal(r.agregat.terakhirCatatIso) }}</dd>
                </template>
              </dl>
            </li>
          </ul>
          <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('ringkas.bersihKet') }}</p>
        </section>

        <section v-if="luar.length">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ruangTab.luar')(luar.length) }}</h3>
          <ul class="mt-2 space-y-2">
            <li v-for="r in luar" :key="r.id" class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[color:var(--ca-border)] px-4 py-3 text-sm">
              <span class="font-mono text-[var(--ca-text)]">{{ r.nama }}</span>
              <CashflowSalinId :id="r.id" />
              <span v-if="r.jenis" class="ca-pill-muted text-[0.7rem]">{{ tcf(`ruang.jenisOpsi.${r.jenis}`) }}</span>
              <span v-if="r.bekas" class="ca-pill-gold text-[0.7rem]">{{ tcf('ruangTab.bekas') }}</span>
              <span class="text-xs text-[var(--ca-muted)]">{{ peran(r) }} · {{ tcf('ruangTab.anggota')(r.anggota) }} · {{ tcf('ruangTab.txDiaJumlah')(r.txOlehDia) }}</span>
              <button type="button" class="ca-btn-secondary ml-auto !px-3 !py-1.5 text-xs" :disabled="menambah" @click="masukkan(r)">{{ tcf('ruangTab.masukkan') }}</button>
            </li>
          </ul>
          <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('ruangTab.luarKet') }}</p>
        </section>
      </div>
    </CashflowPanelTab>
  </div>
</template>
