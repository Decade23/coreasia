<script setup lang="ts">
/**
 * Pengguna 360 › Akses — siapa melihat data orang ini (admin_riwayat_akses,
 * T0, tanpa kasus dan tanpa audit). Sumbernya baris audit dengan target =
 * orang ini, orang ini di `terdampak` (anggota ruang yang dibaca, pencatat,
 * aktor), atau di detail.ids daftar pengguna yang dibuka — termasuk
 * kunjungan kepala (lihat_kepala) dan pencarian (cari).
 *
 * Alasan terpotong 10 aksara kecuali untuk pemegang cashflow:pii atau
 * pelakunya sendiri. TANPA pii, baris yang merangkai orang ini ke orang/ruang
 * lain (ia hanya ikut terbaca di pembukaan atas orang lain) tidak didaftar
 * DAN tidak dihitung (0089 §12): angka "tersembunyi" naik tepat saat subjek
 * lain dibuka — orakel waktu. Kunci `tersembunyi` di jawaban selalu null.
 *
 * Tidak disimpan di simpanan kasus: setiap kunjungan tab memuat ulang, supaya
 * pembukaan yang BARU saja dilakukan langsung tampil.
 * Halaman ?kursor= (push).
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import { kursorAksesDariUrl } from '~/adapters/cashflowJejak'
import { keBarisAkses, type RiwayatAksesDTO } from '~/adapters/cashflowKasus'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const { id } = useCashflowPengguna()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const PER = 50
const SKEMA = { kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' } } as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const mentah = shallowRef<RiwayatAksesDTO | null>(null)
/* Total dihitung server di halaman pertama saja; diingat untuk halaman berikutnya. */
const totalPertama = useState<{ id: string; total: number } | null>('cf_akses_total', () => null)

const muatAkses = () => muat(async (terbaru) => {
  const d = await api.riwayatAkses(id.value, kursorAksesDariUrl(q.value.kursor), PER)
  if (!terbaru()) return
  mentah.value = d
  if (d.total != null) totalPertama.value = { id: id.value, total: Number(d.total) }
})
watch(() => q.value.kursor, muatAkses, { immediate: true })

const baris = computed(() => mentah.value?.baris.map(keBarisAkses) ?? [])
const total = computed(() => (mentah.value?.total ?? (totalPertama.value?.id === id.value ? totalPertama.value.total : null)))

const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => mentah.value?.kursor_berikut,
  ke: kursor => setel({ kursor }, { dorong: true }),
})
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('akses.ket') }}</p>
    <CashflowPanelTab :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah" :kosong="!!mentah && !baris.length" :pesan-kosong="tcf('akses.kosong')">
      <div v-if="mentah" class="space-y-4" :class="{ 'opacity-60': memuat }">
        <ol class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="b in baris" :key="b.id" class="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-start sm:gap-4">
            <span class="w-36 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatWaktu(b.padaIso) }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-xs text-[var(--ca-muted)]">{{ b.aksi }}</span>
                <span class="break-all font-mono text-xs text-[var(--ca-text)]">{{ b.pelaku }}</span>
                <span v-if="b.milikSaya" class="ca-pill-info text-[0.7rem]">{{ tcf('akses.saya') }}</span>
                <span class="text-xs text-[var(--ca-subtle)]">{{ b.langsung ? tcf('akses.langsung') : tcf('akses.terdampak') }}</span>
                <span v-for="r in b.ranah" :key="r" class="ca-pill-emerald text-[0.7rem]">{{ tcf(`ranah.${r}`) }}</span>
                <span v-if="b.jumlah != null" class="text-xs tabular-nums text-[var(--ca-subtle)]">· {{ tcf('akses.jumlah')(b.jumlah) }}</span>
              </div>
              <p v-if="b.alasan" class="mt-0.5 text-xs text-[var(--ca-muted)]">
                {{ b.alasan }}<span v-if="!b.alasanUtuh" class="text-[var(--ca-subtle)]"> ({{ tcf('kasus.alasanTerpotong') }})</span>
              </p>
            </div>
          </li>
        </ol>
        <CashflowPagerKursor
          :halaman-pertama="!q.kursor" :ada-berikut="!!mentah.kursor_berikut" :jumlah="baris.length" :total="total" :memuat="memuat"
          @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
        />
        <NuxtLink :to="{ path: '/console/cashflow/kasus', query: { subjek: id } }" class="inline-block text-xs text-[var(--ca-muted)] underline-offset-2 hover:underline">
          {{ tcf('akses.lihatKasus') }}
        </NuxtLink>
      </div>
    </CashflowPanelTab>
  </div>
</template>
