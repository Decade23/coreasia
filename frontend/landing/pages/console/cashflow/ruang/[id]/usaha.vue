<script setup lang="ts">
/**
 * Ruang 360 › Usaha — ranah `usaha` (admin_usaha_ruang + admin_stok_ruang, migrasi 0095).
 * Ranah ditambah saat tab diaktifkan pengguna (CashflowPanelTab aktivasi)
 * atau lewat "Muat data"; sebelum kasus memegang ranah itu, RPC tab tidak
 * dipanggil (useCashflowRanahBuku).
 *
 * Dua tampilan di URL (kunci struktur): ?lihat=produk (bawaan; produk + stok
 * kini, CashflowTabUsaha) dan ?lihat=stok (riwayat stok, keyset ?kursor=,
 * saringan ?produk=<uuid>; CashflowRiwayatStok). Hanya RPC tampilan aktif
 * yang dipanggil. Saringan arsip hanya di memori.
 */
import { POLA_UUID } from '~/adapters/cashflow'
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { kursorStokDariUrl, type UsahaRuang } from '~/adapters/cashflowRanahBuku'
import { arsipDariPilihan, type PilihanArsip } from '~/adapters/cashflowTampilBuku'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, labelOrang } = useCashflowRuang()
const kasus = useCashflowKasus()
const buku = useCashflowRanahBuku()

const SKEMA = {
  lihat: { jenis: 'pilihan', opsi: ['produk', 'stok'], bawaan: 'produk' },
  produk: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)
const opsiLihat = computed(() => (['produk', 'stok'] as const).map(l => ({ nilai: l, label: tcf(`usaha.lihat.${l}`) as string })))
const keLihat = (l: 'produk' | 'stok') => setel({ lihat: l, produk: '', kursor: '' })

// ── Produk ─────────────────────────────────────────────────────────────
const pilihan = ref<PilihanArsip>('semua')
const u = buku.usaha(() => (q.value.lihat === 'produk' ? id.value : null), () => arsipDariPilihan(pilihan.value))
const tampil = shallowRef<UsahaRuang | null>(null)
watch(u.data, (d) => { if (d) tampil.value = d }, { immediate: true })
watch(kasus.kunciKasus, () => { tampil.value = u.data.value })
const riwayat = (p: string) => setel({ lihat: 'stok', produk: p, kursor: '' }, { dorong: true })

// ── Riwayat stok ───────────────────────────────────────────────────────
const s = buku.stok(() => (q.value.lihat === 'stok' ? id.value : null), () => q.value.produk || null, () => kursorStokDariUrl(q.value.kursor))
const stok = computed(() => s.data.value)
/** Total hanya dihitung server di halaman pertama; disimpan per saringan produk. */
const totalPertama = ref<{ produk: string; total: number | null } | null>(null)
watch(stok, (d) => { if (d?.halamanPertama) totalPertama.value = { produk: q.value.produk, total: d.total } }, { immediate: true })
const total = computed(() => (stok.value?.halamanPertama ? stok.value.total : totalPertama.value?.produk === q.value.produk ? totalPertama.value.total : null))
const namaProduk = computed(() => {
  if (!q.value.produk) return ''
  return stok.value?.baris[0]?.produk ?? tampil.value?.produk.find(p => p.id === q.value.produk)?.nama ?? q.value.produk.slice(0, 8)
})
const saringProduk = (p: string) => setel({ produk: p, kursor: '' }, { dorong: true })
const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => (q.value.lihat === 'stok' ? stok.value?.kursorBerikut : null),
  ke: k => setel({ kursor: k }, { dorong: true }),
})

// ── Keadaan panel = tampilan aktif ─────────────────────────────────────
const aktif = computed(() => (q.value.lihat === 'stok' ? s : u))
const adaData = computed(() => (q.value.lihat === 'stok' ? !!stok.value : !!tampil.value))
const kosong = computed(() => (q.value.lihat === 'stok'
  ? !!stok.value && stok.value.halamanPertama && !stok.value.baris.length && !q.value.produk
  : !!tampil.value && pilihan.value === 'semua' && tampil.value.ringkas.total === 0))
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-[var(--ca-muted)]">{{ q.lihat === 'stok' ? tcf('stok.ket') : tcf('usaha.ket') }}</p>
      <CashflowSegmen :opsi="opsiLihat" :nilai="q.lihat" @pilih="keLihat" />
    </div>
    <CashflowPanelTab
      ranah="usaha" aktivasi :memuat="aktif.memuat.value" :galat="aktif.galat.value" :pesan-galat="aktif.pesanGalat.value"
      :ada-data="adaData" :kosong="kosong" :pesan-kosong="q.lihat === 'stok' ? tcf('stok.kosong') : tcf('usaha.kosong')"
    >
      <CashflowTabUsaha
        v-if="q.lihat === 'produk' && tampil" :data="tampil" :arsip="pilihan" :label-orang="labelOrang" :memuat="u.memuat.value"
        @arsip="p => (pilihan = p)" @riwayat="riwayat"
      />
      <div v-else-if="q.lihat === 'stok' && stok" class="space-y-3">
        <div v-if="q.produk" class="flex flex-wrap items-center gap-2 text-sm">
          <span class="ca-pill-info">{{ tcf('stok.saringProduk')(namaProduk) }}</span>
          <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" @click="saringProduk('')">{{ tcf('stok.semuaProduk') }}</button>
        </div>
        <CashflowKeadaanKosong v-if="!stok.baris.length" :pesan="tcf('stok.kosong')" />
        <template v-else>
          <CashflowRiwayatStok :baris="stok.baris" :satu-produk="!!q.produk" :label-orang="labelOrang" :memuat="s.memuat.value" @produk="saringProduk" />
          <CashflowPagerKursor
            :halaman-pertama="!q.kursor" :ada-berikut="!!stok.kursorBerikut" :jumlah="stok.baris.length" :total="total" :memuat="s.memuat.value"
            @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
          />
        </template>
      </div>
    </CashflowPanelTab>
  </div>
</template>
