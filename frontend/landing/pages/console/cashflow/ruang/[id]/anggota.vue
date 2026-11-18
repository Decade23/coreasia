<script setup lang="ts">
/**
 * Ruang 360 › Anggota — ranah `ruang` (T2), dari admin_ruang_360_v2: anggota
 * dengan email UTUH (perintah Master 19 Nov 2026 membalik keputusan 0094;
 * kasusnya menuntut pii dan setiap baca tercatat baca_ruang). Server lama
 * (admin_ruang_360) tetap mengirim bentuk tersamar dan itulah yang tampil.
 * Juga bekas anggota yang barisnya masih ada (termasuk yang hanya tersisa di
 * sampah), dan ≤ 100 undangan terbaru dengan email target (kode dan label
 * tidak pernah dikirim, ada_label saja). Setiap orang bertaut ke kepala T0-nya di Pengguna 360 —
 * kasusnya sendiri dibuka otomatis di sana.
 *
 * Lencana Kasir di samping peran: anggota bertanda Kasir dan undangan Kasir
 * (kunci `kasir`, migrasi 20261117180000). Server lama tidak mengirimnya, dan
 * daftarnya tampil persis seperti sebelumnya.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { angka } from '~/adapters/cashflow'
import type { StatusUndangan } from '~/adapters/cashflowRuang'

const { tcf, formatTanggal } = useCashflowI18n()
const { kunci360, r360, muat360, labelOrang } = useCashflowRuang()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

watch(kunci360, (k) => { if (k && !r360.value) muat(muat360) }, { immediate: true })

const keOrang = (uid: string) => `/console/cashflow/pengguna/${uid}`
const kelasStatus = (s: StatusUndangan | null) => (s === 'aktif' ? 'ca-pill-emerald' : s === 'diterima' ? 'ca-pill-info' : 'ca-pill-muted')
</script>

<template>
  <CashflowPanelTab
    ranah="ruang" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!r360"
    :kosong="!!r360 && !r360.anggota.length && !r360.bekas.length && !r360.undangan.length" :pesan-kosong="tcf('r360.anggotaKosong')"
  >
    <div v-if="r360" class="space-y-5">
      <section v-if="r360.anggota.length">
        <h3 class="cf-subjudul">{{ tcf('r360.anggotaJudul')(r360.anggota.length) }}</h3>
        <ul class="ca-console-dialog mt-2 divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="a in r360.anggota" :key="a.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <NuxtLink :to="keOrang(a.id)" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline" data-uji="anggota-email">{{ a.emailUtuh ?? a.emailTersamar }}</NuxtLink>
            <CashflowSalinKontak v-if="a.emailUtuh" jenis="email" :nilai="a.emailUtuh" class="!size-6" />
            <CashflowSalinId :id="a.id" />
            <span v-if="a.pemilik" class="ca-pill-gold text-[0.7rem]">{{ tcf('pengguna.pemilik') }}</span>
            <span v-else-if="a.peran" class="ca-pill-muted text-[0.7rem]">{{ a.peran }}</span>
            <span v-if="a.kasir" class="ca-pill-info text-[0.7rem]" :title="tcf('r360.kasirKet')" data-uji="anggota-kasir"><Icon name="lucide:store" class="h-3 w-3" aria-hidden="true" />{{ tcf('r360.kasir') }}</span>
            <span class="text-xs text-[var(--ca-muted)]">
              <template v-if="a.gabungIso">{{ tcf('ruangTab.gabung') }} {{ formatTanggal(a.gabungIso) }} · </template>{{ tcf('ruangTab.txDiaJumlah')(a.tx) }}<template v-if="a.terakhirCatatIso"> · {{ tcf('ruangTab.terakhir') }} {{ formatTanggal(a.terakhirCatatIso) }}</template>
            </span>
          </li>
        </ul>
      </section>

      <section v-if="r360.bekas.length">
        <h3 class="cf-subjudul">{{ tcf('r360.bekasJudul')(r360.bekas.length) }}</h3>
        <ul class="ca-console-dialog mt-2 divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="b in r360.bekas" :key="b.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <NuxtLink v-if="b.akunAda" :to="keOrang(b.id)" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline" data-uji="bekas-email">{{ b.emailUtuh ?? b.emailTersamar }}</NuxtLink>
            <span v-else class="text-[var(--ca-muted)]">{{ tcf('audit.akunHilang') }} · <span class="font-mono">{{ b.id.slice(0, 8) }}</span></span>
            <CashflowSalinId :id="b.id" />
            <span class="text-xs text-[var(--ca-muted)]">{{ b.tx ? tcf('ruangTab.txDiaJumlah')(b.tx) : tcf('r360.hanyaSampah') }}</span>
          </li>
        </ul>
      </section>

      <section v-if="r360.undangan.length">
        <h3 class="cf-subjudul">{{ tcf('r360.undanganJudul')(r360.undangan.length) }}</h3>
        <ul class="ca-console-dialog mt-2 divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="u in r360.undangan" :key="u.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span :class="kelasStatus(u.status)" class="text-[0.7rem]">{{ u.status ? tcf(`r360.statusUndangan.${u.status}`) : '—' }}</span>
            <span class="font-mono text-[var(--ca-text)]" data-uji="undangan-email">{{ u.targetUtuh ?? u.targetTersamar }}</span>
            <span v-if="u.peran" class="ca-pill-muted text-[0.7rem]">{{ u.peran }}</span>
            <span v-if="u.kasir" class="ca-pill-info text-[0.7rem]" :title="tcf('r360.kasirUndanganKet')" data-uji="undangan-kasir"><Icon name="lucide:store" class="h-3 w-3" aria-hidden="true" />{{ tcf('r360.kasir') }}</span>
            <span v-if="u.adaLabel" class="ca-pill-muted text-[0.7rem]" :title="tcf('r360.labelKet')">{{ tcf('r360.berlabel') }}</span>
            <span class="text-xs text-[var(--ca-muted)]">
              {{ tcf('r360.diundang') }} {{ formatTanggal(u.dibuatIso) }}
              <template v-if="u.diundangOleh"> · {{ tcf('transaksi.olehLabel') }} <NuxtLink :to="keOrang(u.diundangOleh)" class="font-mono underline-offset-2 hover:underline">{{ labelOrang(u.diundangOleh) }}</NuxtLink></template>
              <template v-if="u.diterimaOleh"> · {{ tcf('r360.diterimaOleh') }} <NuxtLink :to="keOrang(u.diterimaOleh)" class="font-mono underline-offset-2 hover:underline">{{ labelOrang(u.diterimaOleh) }}</NuxtLink></template>
            </span>
          </li>
        </ul>
        <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('r360.undanganKet')(angka(r360.hitung.undangan_aktif)) }}</p>
      </section>
    </div>
  </CashflowPanelTab>
</template>
