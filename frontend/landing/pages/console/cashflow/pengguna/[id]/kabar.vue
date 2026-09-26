<script setup lang="ts">
/**
 * Pengguna 360 › Kabar — ranah `kabar` (admin_kabar_pengguna, migrasi 0095).
 * Ranah ditambah saat tab diaktifkan pengguna (CashflowPanelTab aktivasi)
 * atau lewat "Muat data"; sebelum kasus memegang ranah itu, RPC tab tidak
 * dipanggil (useCashflowRanahBuku).
 *
 * URL hanya ?kursor= (keyset {p,i}, push). Saringan ruang/jenis/baca di
 * memori per subjek; mengganti saringan kembali ke halaman pertama. Ringkas
 * dan setelan hanya dikirim server di halaman pertama, jadi disimpan per
 * saringan untuk halaman berikutnya. Kabar dari ruang di luar lingkup kasus
 * tidak dikirim dan tidak dihitung server.
 */
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { SARING_KABAR_KOSONG, kursorKabarDariUrl, ruangKabarSah, type RingkasKabar, type SaringKabar, type SetelanKabar } from '~/adapters/cashflowPerangkat'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, dasar, namaRuang } = useCashflowPengguna()
const kasus = useCashflowKasus()
const buku = useCashflowRanahBuku()

const SKEMA = {
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

// ── Saringan (memori, per subjek) ──────────────────────────────────────
const simpan = useState<{ user: string; s: SaringKabar } | null>('cf_kabar_saring', () => null)
const saring = computed<SaringKabar>(() => {
  const s = simpan.value?.user === id.value ? simpan.value.s : SARING_KABAR_KOSONG
  return { ...s, ruang: ruangKabarSah(s.ruang) }
})
const gantiSaring = (s: SaringKabar) => {
  simpan.value = { user: id.value, s }
  setel({ kursor: '' })
}
const ruang = computed(() => kasus.kasus.value?.ruang ?? [])

// ── Kotak masuk ────────────────────────────────────────────────────────
const k = buku.kabar(() => id.value, () => saring.value, () => kursorKabarDariUrl(q.value.kursor))
const data = computed(() => k.data.value)
const pertama = ref<{ kunci: string; ringkas: RingkasKabar | null; setelan: SetelanKabar[]; total: number | null } | null>(null)
const kunciSaring = computed(() => `${id.value}|${JSON.stringify(saring.value)}`)
watch(data, (d) => {
  if (d?.halamanPertama) pertama.value = { kunci: kunciSaring.value, ringkas: d.ringkas, setelan: d.setelan, total: d.total }
}, { immediate: true })
const dariPertama = computed(() => (pertama.value?.kunci === kunciSaring.value ? pertama.value : null))
const ringkas = computed(() => (data.value?.halamanPertama ? data.value.ringkas : dariPertama.value?.ringkas ?? null))
const setelan = computed(() => (data.value?.halamanPertama ? data.value.setelan : dariPertama.value?.setelan ?? null))
const total = computed(() => (data.value?.halamanPertama ? data.value.total : dariPertama.value?.total ?? null))

const { wadah, berikutnya, sebelumnya, pertama: kePertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => data.value?.kursorBerikut,
  ke: x => setel({ kursor: x }, { dorong: true }),
})
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('kabar.ket') }}</p>
    <CashflowPanelTab ranah="kabar" aktivasi :memuat="k.memuat.value" :galat="k.galat.value" :pesan-galat="k.pesanGalat.value" :ada-data="!!data">
      <div v-if="data" class="space-y-3">
        <CashflowTabKabar
          :baris="data.baris" :ringkas="ringkas" :setelan="setelan" :saring="saring" :ruang="ruang" :nama-ruang="namaRuang"
          :dasar="dasar" :memuat="k.memuat.value" @saring="gantiSaring"
        />
        <CashflowPagerKursor
          v-if="data.baris.length" :halaman-pertama="!q.kursor" :ada-berikut="!!data.kursorBerikut" :jumlah="data.baris.length" :total="total"
          :memuat="k.memuat.value" @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="kePertama"
        />
      </div>
    </CashflowPanelTab>
  </div>
</template>
