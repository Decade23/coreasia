<script setup lang="ts">
/**
 * Ruang 360 › Jadwal — ranah `jadwal` (admin_jadwal_ruang + admin_jadwal_rinci, migrasi 0095).
 * Ranah ditambah saat tab diaktifkan pengguna (CashflowPanelTab aktivasi)
 * atau lewat "Muat data"; sebelum kasus memegang ranah itu, RPC tab tidak
 * dipanggil (useCashflowRanahBuku).
 *
 * Daftar di CashflowTabJadwal; rincian satu jadwal di laci ?jadwal=<uuid>
 * (kunci struktur, push; Back menutup) — CashflowLaciJadwal. Saringan arsip
 * hanya di memori; jawaban terakhir tetap tampil selama saringan baru dimuat.
 */
import { POLA_UUID } from '~/adapters/cashflow'
import { tulisQuery, type SkemaQuery } from '~/adapters/cashflowQuery'
import type { JadwalRuang } from '~/adapters/cashflowRanahBuku'
import { arsipDariPilihan, type PilihanArsip } from '~/adapters/cashflowTampilBuku'

definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id, dasar, labelOrang } = useCashflowRuang()
const kasus = useCashflowKasus()
const route = useRoute()
const router = useRouter()

const SKEMA = { jadwal: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' } } as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const pilihan = ref<PilihanArsip>('semua')
const r = useCashflowRanahBuku().jadwal(() => id.value, () => arsipDariPilihan(pilihan.value))
const tampil = shallowRef<JadwalRuang | null>(null)
watch(r.data, (d) => { if (d) tampil.value = d }, { immediate: true })
watch(kasus.kunciKasus, () => { tampil.value = r.data.value })
/** "Memang kosong" hanya bila ruang tanpa jadwal sama sekali; kosong karena saringan ditulis di daftar. */
const kosong = computed(() => !!tampil.value && pilihan.value === 'semua' && tampil.value.ringkas.total === 0)

const judulRinci = ref('')
watch(() => q.value.jadwal, () => { judulRinci.value = '' })
const judulLaci = computed(() => tcf('jadwal.rinci.judul')(tampil.value?.baris.find(j => j.id === q.value.jadwal)?.judul ?? judulRinci.value))
const buka = (j: string) => setel({ jadwal: j }, { dorong: true })
const tutup = () => {
  const tanpa = router.resolve({ path: route.path, query: tulisQuery(SKEMA, { jadwal: '' }) }).fullPath
  const b: unknown = import.meta.client ? window.history.state?.back : null
  if (b === tanpa) router.back()
  else setel({ jadwal: '' })
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('jadwal.ket') }}</p>
    <CashflowPanelTab
      ranah="jadwal" aktivasi :memuat="r.memuat.value" :galat="r.galat.value" :pesan-galat="r.pesanGalat.value"
      :ada-data="!!tampil" :kosong="kosong" :pesan-kosong="tcf('jadwal.kosong')"
    >
      <template v-if="tampil">
        <CashflowTabJadwal :data="tampil" :arsip="pilihan" :label-orang="labelOrang" :memuat="r.memuat.value" @arsip="p => (pilihan = p)" @buka="buka" />
        <CashflowLaci :show="!!q.jadwal" :judul="judulLaci" @close="tutup">
          <CashflowLaciJadwal v-if="q.jadwal" :key="q.jadwal" :jadwal="q.jadwal" :dasar="dasar" :label-orang="labelOrang" @judul="j => (judulRinci = j)" />
        </CashflowLaci>
      </template>
    </CashflowPanelTab>
  </div>
</template>
