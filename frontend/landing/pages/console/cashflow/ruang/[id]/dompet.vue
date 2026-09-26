<script setup lang="ts">
/**
 * Ruang 360 › Dompet — dua tampilan di URL (kunci struktur):
 *   ?lihat=dompet    (bawaan) dompet + saldo, mutasi, dan Pemeriksaan
 *                    (tautan ke tab Transaksi ?cek=); isi di CashflowTabDompet;
 *   ?lihat=patungan  saldo patungan anggota + BEKAS anggota
 *                    (admin_patungan_ruang, 0095 R7) dan riwayat
 *                    ?jenis=bagi|lunas dengan keyset ?kursor=
 *                    (admin_patungan_riwayat, R8).
 * Patungan memakai ranah `dompet` yang sama; kasus ruang selalu memegangnya
 * (RANAH_RUANG), jadi tidak ada aktivasi terpisah. Hanya RPC tampilan aktif
 * yang dipanggil.
 */
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { JENIS_RIWAYAT_PATUNGAN, kursorPatunganDariUrl } from '~/adapters/cashflowRanahBuku'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, dasar, namaRuang, labelOrang } = useCashflowRuang()
const buku = useCashflowRanahBuku()

const SKEMA = {
  lihat: { jenis: 'pilihan', opsi: ['dompet', 'patungan'], bawaan: 'dompet' },
  jenis: { jenis: 'pilihan', opsi: JENIS_RIWAYAT_PATUNGAN, bawaan: 'bagi' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)
const opsiLihat = computed(() => (['dompet', 'patungan'] as const).map(l => ({ nilai: l, label: tcf(`patungan.lihat.${l}`) as string })))
/* Kunci milik tampilan lain dibuang (CashflowTabDompet memakai ?dompet=&kursor= sendiri). */
const keLihat = (l: 'dompet' | 'patungan') => setel({ lihat: l, jenis: 'bagi', kursor: '' })
const opsiJenis = computed(() => JENIS_RIWAYAT_PATUNGAN.map(j => ({ nilai: j, label: tcf(`patungan.jenis.${j}`) as string })))
const keJenis = (j: 'bagi' | 'lunas') => setel({ jenis: j, kursor: '' })

// ── Patungan ───────────────────────────────────────────────────────────
const patungan = computed(() => q.value.lihat === 'patungan')
const p = buku.patungan(() => (patungan.value ? id.value : null))
const r = buku.patunganRiwayat(
  () => (patungan.value ? id.value : null),
  () => q.value.jenis,
  () => kursorPatunganDariUrl(q.value.jenis, q.value.kursor),
)
const riwayat = computed(() => r.data.value)
const bagi = computed(() => (riwayat.value?.jenis === 'bagi' ? riwayat.value.baris : []))
const lunas = computed(() => (riwayat.value?.jenis === 'lunas' ? riwayat.value.baris : []))
/** Total hanya dihitung server di halaman pertama; disimpan per jenis. */
const totalPertama = ref<Partial<Record<'bagi' | 'lunas', number | null>>>({})
watch(riwayat, (d) => { if (d?.halamanPertama) totalPertama.value = { ...totalPertama.value, [d.jenis]: d.total } }, { immediate: true })
const total = computed(() => (riwayat.value?.halamanPertama ? riwayat.value.total : totalPertama.value[q.value.jenis] ?? null))
const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => (patungan.value ? riwayat.value?.kursorBerikut : null),
  ke: k => setel({ kursor: k }, { dorong: true }),
})
const keTx = (tx: string) => `${dasar.value}/transaksi?tx=${tx}`
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <div class="flex justify-end">
      <CashflowSegmen :opsi="opsiLihat" :nilai="q.lihat" @pilih="keLihat" />
    </div>

    <template v-if="!patungan">
      <CashflowTabDompet mode="ruang" :ws="id" :dasar="dasar" :nama-ruang="namaRuang" :label-orang="labelOrang" />
    </template>
    <template v-else>
      <p class="text-sm text-[var(--ca-muted)]">{{ tcf('patungan.ket') }}</p>
      <CashflowPanelTab ranah="dompet" :memuat="p.memuat.value" :galat="p.galat.value" :pesan-galat="p.pesanGalat.value" :ada-data="!!p.data.value">
        <CashflowTabPatungan v-if="p.data.value" :data="p.data.value" :label-orang="labelOrang" :memuat="p.memuat.value" />
      </CashflowPanelTab>

      <section v-if="p.data.value" class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('patungan.riwayat') }}</h3>
          <CashflowSegmen :opsi="opsiJenis" :nilai="q.jenis" @pilih="keJenis" />
        </div>
        <p v-if="r.pesanGalat.value" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ r.pesanGalat.value }}</p>
        <div v-else-if="!riwayat" class="space-y-2" aria-busy="true" :aria-label="tcf('umum.memuat')">
          <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-[var(--ca-panel-bg-strong)]" />
        </div>
        <template v-else>
          <CashflowRiwayatPatungan :jenis="riwayat.jenis" :bagi="bagi" :lunas="lunas" :label-orang="labelOrang" :ke-tx="keTx" :memuat="r.memuat.value" />
          <CashflowPagerKursor
            v-if="riwayat.baris.length" :halaman-pertama="!q.kursor" :ada-berikut="!!riwayat.kursorBerikut" :jumlah="riwayat.baris.length"
            :total="total" :memuat="r.memuat.value" @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
          />
        </template>
      </section>
    </template>
  </div>
</template>
