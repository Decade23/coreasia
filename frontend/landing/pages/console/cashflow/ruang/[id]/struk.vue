<script setup lang="ts">
/**
 * Ruang 360 › Struk — ranah `struk` (admin_struk_ruang, migrasi 0095).
 * Ranah ditambah saat tab diaktifkan pengguna (CashflowPanelTab aktivasi)
 * atau lewat "Muat data"; sebelum kasus memegang ranah itu, RPC tab tidak
 * dipanggil (useCashflowRanahBuku).
 *
 * URL hanya kunci struktur: ?kursor= (keyset {c,i}, push) dan ?struk=<uuid>
 * (laci baris item, push; Back menutup). Saringan (jenis, kasbon, OCR,
 * tanggal, pencatat) di useState per ruang — `pencatat` TIDAK boleh ke URL
 * (spek R6), jadi saringan lain ikut di memori supaya satu tempat.
 *
 * Laci baris item memakai admin_transaksi_cari p_grup: ranah TRANSAKSI, yang
 * selalu dipegang kasus ruang (RANAH_RUANG). Baris bertaut ke laci ?tx= tab
 * Transaksi.
 */
import { POLA_UUID } from '~/adapters/cashflow'
import { POLA_KURSOR_URL, tanggalJam } from '~/adapters/cashflowBuku'
import { tulisQuery, type SkemaQuery } from '~/adapters/cashflowQuery'
import { SARING_STRUK_KOSONG, kursorStrukDariUrl, type RingkasStruk, type SaringStruk } from '~/adapters/cashflowRanahBuku'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf, bahasa, formatTanggal } = useCashflowI18n()
const route = useRoute()
const router = useRouter()
const { id, dasar, r360, labelOrang } = useCashflowRuang()
const buku = useCashflowRanahBuku()

const SKEMA = {
  struk: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

// ── Saringan (memori, per ruang) ───────────────────────────────────────
const simpan = useState<{ ws: string; s: SaringStruk } | null>('cf_struk_saring', () => null)
const saring = computed<SaringStruk>(() => (simpan.value?.ws === id.value ? simpan.value.s : { ...SARING_STRUK_KOSONG }))
const gantiSaring = (s: SaringStruk) => {
  simpan.value = { ws: id.value, s }
  setel({ kursor: '', struk: '' })
}
const orang = computed(() => [
  ...(r360.value?.anggota ?? []).map(a => ({ id: a.id, label: a.emailTersamar })),
  ...(r360.value?.bekas ?? []).map(b => ({ id: b.id, label: b.emailTersamar })),
])

// ── Daftar struk ───────────────────────────────────────────────────────
const d = buku.struk(() => id.value, () => saring.value, () => kursorStrukDariUrl(q.value.kursor))
const data = computed(() => d.data.value)
/** Ringkas & total hanya dihitung server di halaman pertama; disimpan per saringan. */
const pertama = ref<{ kunci: string; ringkas: RingkasStruk | null; total: number | null } | null>(null)
const kunciSaring = computed(() => `${id.value}|${JSON.stringify(saring.value)}`)
watch(data, (x) => { if (x?.halamanPertama) pertama.value = { kunci: kunciSaring.value, ringkas: x.ringkas, total: x.total } }, { immediate: true })
const dariPertama = computed(() => (pertama.value?.kunci === kunciSaring.value ? pertama.value : null))
const ringkas = computed(() => (data.value?.halamanPertama ? data.value.ringkas : dariPertama.value?.ringkas ?? null))
const total = computed(() => (data.value?.halamanPertama ? data.value.total : dariPertama.value?.total ?? null))
const kosong = computed(() => !!data.value && data.value.halamanPertama && !data.value.baris.length
  && (Object.keys(SARING_STRUK_KOSONG) as Array<keyof SaringStruk>).every(k => saring.value[k] === null))

const { wadah, berikutnya, sebelumnya, pertama: kePertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => data.value?.kursorBerikut,
  ke: k => setel({ kursor: k, struk: '' }, { dorong: true }),
})

// ── Laci baris item (?struk=) ──────────────────────────────────────────
const b = buku.strukBaris(() => id.value, () => q.value.struk || null)
const strukTerbuka = computed(() => data.value?.baris.find(s => s.id === q.value.struk) ?? null)
const judulLaci = computed(() => tcf('struk.laci.judul')(strukTerbuka.value?.tanggal ? formatTanggal(strukTerbuka.value.tanggal) : q.value.struk.slice(0, 8)))
const buka = (s: string) => setel({ struk: s }, { dorong: true })
const tutup = () => {
  const tanpa = router.resolve({ path: route.path, query: tulisQuery(SKEMA, { ...q.value, struk: '' }) }).fullPath
  const kembali: unknown = import.meta.client ? window.history.state?.back : null
  if (kembali === tanpa) router.back()
  else setel({ struk: '' })
}
const keTx = (tx: string) => `${dasar.value}/transaksi?tx=${tx}`
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('struk.ket') }}</p>
    <CashflowPanelTab
      ranah="struk" aktivasi :memuat="d.memuat.value" :galat="d.galat.value" :pesan-galat="d.pesanGalat.value"
      :ada-data="!!data" :kosong="kosong" :pesan-kosong="tcf('struk.kosong')"
    >
      <div v-if="data" class="space-y-3">
        <CashflowTabStruk
          :baris="data.baris" :ringkas="ringkas" :saring="saring" :orang="orang" :label-orang="labelOrang" :memuat="d.memuat.value"
          @saring="gantiSaring" @buka="buka"
        />
        <CashflowPagerKursor
          v-if="data.baris.length" :halaman-pertama="!q.kursor" :ada-berikut="!!data.kursorBerikut" :jumlah="data.baris.length" :total="total"
          :memuat="d.memuat.value" @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="kePertama"
        />
      </div>
    </CashflowPanelTab>

    <CashflowLaci :show="!!q.struk" :judul="judulLaci" @close="tutup">
      <div v-if="q.struk" class="space-y-3">
        <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('struk.laci.ket') }}</p>
        <p v-if="b.pesanGalat.value" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ b.pesanGalat.value }}</p>
        <p v-else-if="!b.data.value" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
        <template v-else>
          <CashflowKeadaanKosong v-if="!b.data.value.baris.length" :pesan="tcf('struk.laci.kosong')" />
          <ol v-else class="divide-y divide-[color:var(--ca-border)] text-sm" :class="{ 'opacity-60': b.memuat.value }">
            <li v-for="t in b.data.value.baris" :key="t.id">
              <NuxtLink :to="keTx(t.id)" class="flex items-center gap-3 py-2 hover:bg-[var(--ca-panel-bg-strong)]">
                <span class="w-28 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ tanggalJam(t.tanggal, t.jam, bahasa) }}</span>
                <span class="min-w-0 flex-1 truncate text-[var(--ca-text)]">
                  {{ t.kategori || t.dompet || '—' }}<span v-if="t.qty != null" class="ml-1 text-xs text-[var(--ca-muted)]">× {{ t.qty }}</span>
                  <Icon v-if="t.adaCatatan" name="lucide:lock" class="ml-1 inline h-3 w-3 text-[var(--ca-subtle)]" :aria-label="tcf('struk.adaCatatan')" />
                </span>
                <CashflowNominal :nilai="t.nominal" :jenis="t.jenis" :arah="t.arah" />
              </NuxtLink>
            </li>
          </ol>
          <p v-if="b.data.value.kursorBerikut" class="text-xs text-[var(--ca-subtle)]">{{ tcf('struk.laci.lebih')(b.data.value.baris.length) }}</p>
        </template>
      </div>
    </CashflowLaci>
  </div>
</template>
