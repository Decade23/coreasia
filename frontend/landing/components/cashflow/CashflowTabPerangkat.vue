<script setup lang="ts">
/**
 * Isi tab Pengguna 360 › Perangkat (admin_perangkat_pengguna, ranah
 * perangkat): pemasangan aplikasi (device_tokens, hanya sidik HMAC), sesi
 * masuk (daftar putih auth.sessions, tanpa IP/peramban — K-F3-6), dan jeda
 * antrean luring dari peristiwa tx.catat.
 *
 * `platform`, `versi`, `kodeBuild` adalah LAPORAN klien yang sudah disaring
 * server; dirender sebagai teks biasa, tidak pernah v-html.
 *
 * Jeda terbesar (§2.8): ruang dan transaksi hanya dikirim bila kasus
 * memegang ranah jejak (`rinci`). Tanpa itu yang tampil hanya waktu, tanpa
 * tautan — tidak ditebak dari data lain.
 */
import { angka } from '~/adapters/cashflow'
import type { PerangkatPengguna } from '~/adapters/cashflowPerangkat'
import { PILIHAN_HARI_PERANGKAT, durasiSingkat, tanggalWibDariIso } from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  data: PerangkatPengguna
  hari: number
  /** Akar rute subjek (tautan Jejak/Transaksi). */
  dasar: string
  namaRuang: (ws: string) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ hari: [n: number] }>()
const { tcf, bahasa, formatWaktu, formatTanggal } = useCashflowI18n()

/* CashflowSegmen bernilai teks; hari dikirim balik sebagai angka. */
const opsiHari = computed(() => PILIHAN_HARI_PERANGKAT.map(n => ({ nilai: String(n), label: tcf('perangkat.hariOpsi')(n) as string })))
const pilihHari = (v: string) => { const n = Number(v); if ((PILIHAN_HARI_PERANGKAT as readonly number[]).includes(n)) emit('hari', n) }
const dur = (d: number | null) => durasiSingkat(d, bahasa.value)
const RINGKAS = ['p50', 'p95', 'maks'] as const
const AMBANG = ['lebih1Menit', 'lebih1Jam', 'lebih1Hari'] as const
const tandaSidik = (s: string) => s.slice(0, 10)
const labelPlatform = (p: PerangkatPengguna['perangkat'][number]['platform']) => (p ? tcf(`kode.platform.${p}`) : tcf('kode.platform.lain'))
const keJejak = (ws: string, iso: string) => {
  const t = tanggalWibDariIso(iso)
  return `${props.dasar}/jejak?ruang=${ws}${t ? `&dari=${t}&sampai=${t}` : ''}`
}
const keTx = (tx: string) => `${props.dasar}/transaksi?tx=${tx}`
</script>

<template>
  <div class="space-y-6" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <!-- Pemasangan aplikasi -->
    <section class="space-y-2">
      <div>
        <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('perangkat.pemasangan') }}</h3>
        <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('perangkat.pemasanganKet') }}</p>
      </div>
      <CashflowKeadaanKosong v-if="!data.perangkat.length" icon="lucide:smartphone" :pesan="tcf('perangkat.pemasanganKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="p in data.perangkat" :key="p.sidik" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <Icon :name="p.platform === 'web' ? 'lucide:globe' : 'lucide:smartphone'" class="h-4 w-4 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-[var(--ca-text)]">{{ labelPlatform(p.platform) }}</span>
              <span v-if="p.varian" :class="p.varian === 'uat' ? 'ca-pill-gold' : 'ca-pill-muted'" class="text-[0.7rem]">{{ tcf(`kode.varian.${p.varian}`) }}</span>
              <span class="text-xs text-[var(--ca-muted)]">
                <template v-if="p.versi">{{ tcf('perangkat.versi') }} {{ p.versi }}<template v-if="p.kodeBuild"> ({{ tcf('perangkat.build') }} {{ p.kodeBuild }})</template></template>
                <template v-else>{{ tcf('perangkat.versiTakDiketahui') }}</template>
              </span>
              <span v-if="p.versiTakSah" class="ca-pill-danger text-[0.7rem]">{{ tcf('perangkat.versiTakSah') }}</span>
            </div>
            <p class="mt-0.5 font-mono text-xs text-[var(--ca-subtle)]">{{ tandaSidik(p.sidik) }}</p>
          </div>
          <div class="text-right text-xs text-[var(--ca-muted)]">
            <div>{{ tcf('perangkat.terakhirAktif') }}</div>
            <div class="tabular-nums text-[var(--ca-text)]">{{ formatWaktu(p.terakhirIso) }}</div>
          </div>
        </li>
      </ul>
      <p v-if="data.terpotong.perangkat" class="text-xs text-[var(--ca-gold-text)]">{{ tcf('perangkat.potongPerangkat') }}</p>
    </section>

    <!-- Sesi masuk -->
    <section class="space-y-2">
      <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('perangkat.sesi') }}</h3>
      <p v-if="data.sesiDisembunyikan" class="rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-3 text-sm text-[var(--ca-muted)]">
        {{ tcf('perangkat.sesiDisembunyikan') }}
      </p>
      <CashflowKeadaanKosong v-else-if="!data.sesi.length" icon="lucide:key-round" :pesan="tcf('perangkat.sesiKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="s in data.sesi" :key="s.sidik" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span :class="s.aktif ? 'ca-pill-emerald' : 'ca-pill-muted'" class="text-[0.7rem]">{{ s.aktif ? tcf('perangkat.aktif') : tcf('perangkat.kedaluwarsa') }}</span>
              <span v-if="s.aal" class="ca-pill-info text-[0.7rem]">{{ s.aal === 'lain' ? tcf('kode.takDikenal') : s.aal.toUpperCase() }}</span>
              <span class="font-mono text-xs text-[var(--ca-subtle)]">{{ tandaSidik(s.sidik) }}</span>
            </div>
            <p class="mt-0.5 text-xs tabular-nums text-[var(--ca-muted)]">
              {{ tcf('perangkat.dibuat') }} {{ formatWaktu(s.dibuatIso) }}
              <template v-if="s.disegarkanIso"> · {{ tcf('perangkat.disegarkan') }} {{ formatWaktu(s.disegarkanIso) }}</template>
              <template v-else-if="s.diperbaruiIso"> · {{ tcf('perangkat.diperbarui') }} {{ formatWaktu(s.diperbaruiIso) }}</template>
              <template v-if="s.berakhirIso"> · {{ tcf('perangkat.berakhir') }} {{ formatWaktu(s.berakhirIso) }}</template>
            </p>
          </div>
        </li>
      </ul>
      <p v-if="data.terpotong.sesi" class="text-xs text-[var(--ca-gold-text)]">{{ tcf('perangkat.potongSesi') }}</p>
    </section>

    <!-- Jeda antrean luring -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('perangkat.jeda') }}</h3>
          <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('perangkat.jedaKet') }}</p>
        </div>
        <CashflowSegmen :opsi="opsiHari" :nilai="String(hari)" :label="tcf('perangkat.hari')" @pilih="pilihHari" />
      </div>

      <CashflowKeadaanKosong
        v-if="!data.jeda.ringkas.n && !data.jeda.ringkas.jamMaju && !data.jeda.ringkas.tanpaJamPerangkat"
        icon="lucide:timer" :pesan="tcf('perangkat.jedaKosong')"
      />
      <template v-else>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="ca-console-dialog px-3 py-2">
            <div class="text-xs text-[var(--ca-muted)]">{{ tcf('perangkat.ringkas.n') }}</div>
            <div class="text-lg font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.jeda.ringkas.n) }}</div>
          </div>
          <div v-for="k in RINGKAS" :key="k" class="ca-console-dialog px-3 py-2">
            <div class="text-xs text-[var(--ca-muted)]">{{ tcf(`perangkat.ringkas.${k}`) }}</div>
            <div class="text-lg font-semibold tabular-nums text-[var(--ca-text)]">{{ dur(data.jeda.ringkas[k]) }}</div>
          </div>
        </div>
        <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
          <div v-for="k in AMBANG" :key="k" class="flex items-baseline gap-1">
            <dt>{{ tcf(`perangkat.ringkas.${k}`) }}</dt>
            <dd class="font-semibold tabular-nums" :class="data.jeda.ringkas[k] ? 'text-[var(--ca-gold-text)]' : 'text-[var(--ca-text)]'">{{ angka(data.jeda.ringkas[k]) }}</dd>
          </div>
          <div class="flex items-baseline gap-1">
            <dt>{{ tcf('perangkat.ringkas.jamMaju') }}</dt>
            <dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.jeda.ringkas.jamMaju) }}</dd>
          </div>
          <div class="flex items-baseline gap-1">
            <dt>{{ tcf('perangkat.ringkas.tanpaJam') }}</dt>
            <dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(data.jeda.ringkas.tanpaJamPerangkat) }}</dd>
          </div>
        </dl>

        <div v-if="data.jeda.perHari.length" class="space-y-1">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('perangkat.perHari') }}</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs tabular-nums">
              <thead class="text-[var(--ca-muted)]">
                <tr>
                  <th class="py-1 pr-3 font-medium">{{ tcf('perangkat.kolom.tanggal') }}</th>
                  <th class="py-1 pr-3 text-right font-medium">{{ tcf('perangkat.kolom.n') }}</th>
                  <th class="py-1 pr-3 text-right font-medium">{{ tcf('perangkat.kolom.p95') }}</th>
                  <th class="py-1 text-right font-medium">{{ tcf('perangkat.kolom.maks') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[color:var(--ca-border)] text-[var(--ca-text)]">
                <tr v-for="h in data.jeda.perHari" :key="h.tanggal">
                  <td class="py-1 pr-3">{{ formatTanggal(h.tanggal) }}</td>
                  <td class="py-1 pr-3 text-right">{{ angka(h.n) }}</td>
                  <td class="py-1 pr-3 text-right">{{ dur(h.p95) }}</td>
                  <td class="py-1 text-right" :class="(h.maks ?? 0) >= 3600 ? 'text-[var(--ca-gold-text)]' : ''">{{ dur(h.maks) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="data.jeda.terbesar.length" class="space-y-1">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('perangkat.terbesar') }}</h4>
          <p v-if="!data.jeda.rinci" class="text-xs text-[var(--ca-subtle)]">{{ tcf('perangkat.terbesarRingkasKet') }}</p>
          <ul class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
            <li v-for="(t, i) in data.jeda.terbesar" :key="t.peristiwaId ?? `${t.padaIso}-${i}`" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
              <span class="w-20 shrink-0 font-semibold tabular-nums" :class="t.detik >= 3600 ? 'text-[var(--ca-gold-text)]' : 'text-[var(--ca-text)]'">{{ dur(t.detik) }}</span>
              <span class="min-w-0 flex-1 text-xs tabular-nums text-[var(--ca-muted)]">
                {{ tcf('perangkat.diCatat') }} {{ formatWaktu(t.padaPerangkatIso) }} · {{ tcf('perangkat.tiba') }} {{ formatWaktu(t.padaIso) }}
                <template v-if="t.ruangId"> · {{ namaRuang(t.ruangId) }}</template>
              </span>
              <template v-if="data.jeda.rinci && t.ruangId">
                <NuxtLink :to="keJejak(t.ruangId, t.padaIso)" class="ca-btn-secondary !px-3 !py-1 text-xs">{{ tcf('perangkat.bukaJejak') }}</NuxtLink>
                <NuxtLink v-if="t.sasaranId" :to="keTx(t.sasaranId)" class="ca-btn-secondary !px-3 !py-1 text-xs">{{ tcf('perangkat.bukaTx') }}</NuxtLink>
              </template>
            </li>
          </ul>
        </div>
      </template>
    </section>
  </div>
</template>
