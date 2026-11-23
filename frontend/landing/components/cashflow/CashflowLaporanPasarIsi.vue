<script setup lang="ts">
/**
 * Isi bagian Minat Kilas Pasar di halaman Laporan (spek analitik pasar dan
 * promo 23 Nov 2026, AP-7): corong orang dari kartu sampai halaman resmi,
 * orang per hari, sumber yang paling sering diketuk, tab Pasar atau Promo,
 * asal Detail, promo yang cocok dibanding Lihat semua, halaman resmi (asal,
 * lama dibaca, browser), tombol Tanya Domi di kartu, dan pertanyaan Domi per
 * topik.
 *
 * Hanya tampilan: menerima bentuk domain dari adapters/cashflowLaporanPasar,
 * tidak memanggil server. Yang memuat dan menangani galat adalah
 * CashflowLaporanPasar. Jawaban tanpa satu angka pun menampilkan "Belum ada
 * data", begitu juga setiap kotak yang isinya nol semua.
 */
import { angka } from '~/adapters/cashflow'
import { tanggalPendek } from '~/adapters/cashflowWaktu'
import { titikIsi } from '~/adapters/cashflowLaporan'
import {
  ASAL_HALAMAN, DARI_PROMO, DETAIL_DARI, LAMA_BACA, METRIK_PASAR, TAB_PASAR, TOPIK_KARTU, VERSI_KILAS_PASAR,
  seriPasar, type MinatPasar, type SumberPasar,
} from '~/adapters/cashflowLaporanPasar'

const props = defineProps<{ minat: MinatPasar }>()
const { tcf, bahasa } = useCashflowI18n()

const tgl = (ymd: string) => tanggalPendek(ymd, bahasa.value)
const rentang = computed(() => {
  const m = props.minat
  return m.dari && m.sampai ? tcf('laporan.rentang')(tgl(m.dari), tgl(m.sampai)) as string : ''
})

/** Baris batang dari hitungan berkunci tetap. */
type Baris = { label: string; nilai: number; persen?: number | null; keterangan?: string }
const dariHitungan = <K extends string>(kunci: readonly K[], isi: Record<K, number>, awalan: string): Baris[] =>
  kunci.map(k => ({ label: tcf(`${awalan}.${k}`) as string, nilai: isi[k] }))
const ada = (baris: readonly Baris[]) => baris.some(b => b.nilai > 0)
/* Lebar batang relatif ke yang terbesar, bukan baris pertama: halaman resmi
   bisa lebih banyak dari yang mengetuk sumber, dan deret berurutan tetap. */
const dasar = (baris: readonly Baris[]) => Math.max(1, ...baris.map(b => b.nilai))

const corong = computed<Baris[]>(() => props.minat.corong.map(c => ({
  label: tcf(`laporan.pasar.corong.${c.kunci}`) as string, nilai: c.orang, persen: c.persen,
})))
const harian = computed(() => METRIK_PASAR.map((metrik) => {
  const seri = seriPasar(props.minat, metrik)
  return { metrik, label: tcf(`laporan.pasar.metrik.${metrik}`) as string, orang: props.minat.ringkas[metrik], seri, isi: titikIsi(seri) }
}))

const labelSumber = (s: SumberPasar): string =>
  s.nama ?? (s.sumber === 'lain' ? tcf('laporan.pasar.sumberLain') as string : s.sumber)
const labelJenis = (s: SumberPasar): string => tcf(`laporan.pasar.jenis.${s.jenis ?? 'lain'}`) as string
const sumber = computed<Baris[]>(() => props.minat.sumber.map(s => ({
  label: labelSumber(s), nilai: s.ketuk, keterangan: tcf('laporan.pasar.sumberIsi')(angka(s.orang), labelJenis(s)) as string,
})))

const tab = computed(() => dariHitungan(TAB_PASAR, props.minat.tab, 'laporan.pasar.tab'))
const detailDari = computed(() => dariHitungan(DETAIL_DARI, props.minat.detailDari, 'laporan.pasar.detailDari'))
const dariPromo = computed(() => dariHitungan(DARI_PROMO, props.minat.dariPromo, 'laporan.pasar.dariPromo'))
const asalHalaman = computed(() => dariHitungan(ASAL_HALAMAN, props.minat.halaman.asal, 'laporan.pasar.asal'))
const lamaBaca = computed(() => dariHitungan(LAMA_BACA, props.minat.halaman.lama, 'laporan.pasar.lama'))
const tanyaKartu = computed(() => dariHitungan(TOPIK_KARTU, props.minat.tanyaKartu, 'laporan.pasar.topikKartu'))
const adaDomi = computed(() => props.minat.domi.some(t => t.tanya > 0 || t.orang > 0))
</script>

<template>
  <div class="min-w-0 space-y-5" data-uji="pasar-isi">
    <div class="min-w-0">
      <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.judul') }}</h2>
      <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('laporan.pasar.ket') }}</p>
      <p class="mt-1 text-xs text-[var(--ca-subtle)]" data-uji="pasar-rentang">{{ rentang }} {{ tcf('laporan.tanpaTim') }}</p>
    </div>
    <p class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm text-[var(--ca-text)]" data-uji="pasar-versi">
      {{ tcf('laporan.pasar.versi')(VERSI_KILAS_PASAR) }}
    </p>

    <CashflowKeadaanKosong v-if="minat.kosong" :pesan="tcf('laporan.pasar.kosongSemua')" icon="lucide:chart-no-axes-column" data-uji="pasar-kosong" />

    <template v-else>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Corong orang, lalu Domi di bawah garis: Domi bukan langkah corong. -->
        <section class="ca-console-dialog min-w-0 p-5" data-uji="pasar-corong">
          <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.corongJudul') }}</h3>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.corongKet') }}</p>
          <div class="mt-4">
            <CashflowBarRows :baris="corong" :dasar="dasar(corong)" />
          </div>
          <p class="mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.halamanDariDomi') }}</p>
          <div class="mt-4 flex items-start justify-between gap-3 border-t border-[color:var(--ca-border)] pt-4" data-uji="pasar-domi-orang">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('laporan.pasar.domiUbin') }}</p>
              <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.domiUbinKet') }}</p>
            </div>
            <p class="shrink-0 text-2xl font-bold tabular-nums text-[var(--ca-text)]">{{ angka(minat.ringkas.domi) }}</p>
          </div>
        </section>

        <section class="ca-console-dialog min-w-0 p-5" data-uji="pasar-harian">
          <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.harianJudul') }}</h3>
          <ul class="mt-4 space-y-4">
            <li v-for="h in harian" :key="h.metrik" class="min-w-0" :data-metrik="h.metrik">
              <div class="flex items-baseline justify-between gap-3 text-sm">
                <span class="min-w-0 break-words font-semibold text-[var(--ca-text)]">{{ h.label }}</span>
                <span class="shrink-0 whitespace-nowrap text-xs tabular-nums text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.orangRentang')(angka(h.orang)) }}</span>
              </div>
              <div class="mt-1.5">
                <CashflowSparkline v-if="h.isi >= 3" :data="h.seri" :label="h.label" :tinggi="32" />
                <p v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.sedikit')(h.isi) }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <!-- Dua kolom yang tingginya berdiri sendiri: kiri ketukan di kartu, kanan tab, halaman resmi, dan Domi. -->
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div class="min-w-0 space-y-6">
          <section class="ca-console-dialog min-w-0 p-5" data-uji="pasar-sumber">
            <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.sumberJudul') }}</h3>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.sumberKet') }}</p>
            <div class="mt-4">
              <CashflowBarRows v-if="sumber.length" :baris="sumber" />
              <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:link" />
            </div>
          </section>

          <section class="ca-console-dialog min-w-0 p-5" data-uji="pasar-promo">
            <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.promoJudul') }}</h3>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.promoKet') }}</p>
            <div class="mt-4">
              <CashflowBarRows v-if="ada(dariPromo)" :baris="dariPromo" :dasar="dasar(dariPromo)" />
              <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:ticket-percent" />
            </div>
          </section>

          <section class="ca-console-dialog min-w-0 p-5" data-uji="pasar-tanya-kartu">
            <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.tanyaKartuJudul') }}</h3>
            <div class="mt-4">
              <CashflowBarRows v-if="ada(tanyaKartu)" :baris="tanyaKartu" :dasar="dasar(tanyaKartu)" />
              <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:message-circle-question" />
            </div>
          </section>
        </div>
        <div class="min-w-0 space-y-6">
          <section class="ca-console-dialog min-w-0 space-y-6 p-5">
            <div data-uji="pasar-tab">
              <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.tabJudul') }}</h3>
              <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.tabKet') }}</p>
              <div class="mt-4">
                <CashflowBarRows v-if="ada(tab)" :baris="tab" :dasar="dasar(tab)" />
                <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:panels-top-left" />
              </div>
            </div>
            <div data-uji="pasar-detail-dari">
              <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.detailDariJudul') }}</h3>
              <div class="mt-4">
                <CashflowBarRows v-if="ada(detailDari)" :baris="detailDari" :dasar="dasar(detailDari)" />
                <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:mouse-pointer-click" />
              </div>
            </div>
          </section>

          <section class="ca-console-dialog min-w-0 space-y-6 p-5" data-uji="pasar-halaman">
            <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.halamanJudul') }}</h3>
            <div data-uji="pasar-halaman-asal">
              <h4 class="text-sm font-bold text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.asalJudul') }}</h4>
              <div class="mt-3">
                <CashflowBarRows v-if="ada(asalHalaman)" :baris="asalHalaman" :dasar="dasar(asalHalaman)" />
                <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:globe" />
              </div>
            </div>
            <div data-uji="pasar-halaman-lama">
              <h4 class="text-sm font-bold text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.lamaJudul') }}</h4>
              <p v-if="minat.halaman.tutup" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.lamaKet')(angka(minat.halaman.tutup)) }}</p>
              <div class="mt-3">
                <CashflowBarRows v-if="ada(lamaBaca)" :baris="lamaBaca" :dasar="dasar(lamaBaca)" />
                <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:timer" />
              </div>
            </div>
            <dl class="grid grid-cols-1 gap-3 border-t border-[color:var(--ca-border)] pt-4 sm:grid-cols-2" data-uji="pasar-halaman-lain">
              <div class="min-w-0">
                <dt class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('laporan.pasar.browser') }}</dt>
                <dd class="mt-0.5 text-lg font-bold tabular-nums text-[var(--ca-text)]">{{ tcf('laporan.pasar.kali')(angka(minat.halaman.browser)) }}</dd>
                <dd class="text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.browserKet') }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('laporan.pasar.pindah') }}</dt>
                <dd class="mt-0.5 text-lg font-bold tabular-nums text-[var(--ca-text)]">{{ tcf('laporan.pasar.kali')(angka(minat.halaman.pindah)) }}</dd>
                <dd class="text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.pindahKet') }}</dd>
              </div>
            </dl>
          </section>

          <section class="min-w-0 space-y-3" data-uji="pasar-domi">
            <div class="min-w-0">
              <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.pasar.domiJudul') }}</h3>
              <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.pasar.domiKet') }}</p>
            </div>
            <CashflowTabel v-if="adaDomi" data-uji="pasar-domi-tabel">
              <caption class="sr-only">{{ tcf('laporan.pasar.domiTabel') }}</caption>
              <thead>
                <tr>
                  <th scope="col">{{ tcf('laporan.pasar.domiKolom.topik') }}</th>
                  <th scope="col" class="cf-ka">{{ tcf('laporan.pasar.domiKolom.tanya') }}</th>
                  <th scope="col" class="cf-ka">{{ tcf('laporan.pasar.domiKolom.orang') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in minat.domi" :key="t.topik" :data-topik="t.topik">
                  <td class="break-words">{{ tcf(`laporan.pasar.topikDomi.${t.topik}`) }}</td>
                  <td class="cf-ka cf-kuat">{{ angka(t.tanya) }}</td>
                  <td class="cf-ka">{{ angka(t.orang) }}</td>
                </tr>
              </tbody>
            </CashflowTabel>
            <CashflowKeadaanKosong v-else :pesan="tcf('laporan.pasar.kosong')" icon="lucide:messages-square" />
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
