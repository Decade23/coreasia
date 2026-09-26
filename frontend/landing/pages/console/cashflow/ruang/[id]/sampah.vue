<script setup lang="ts">
/**
 * Ruang 360 › Sampah — ranah `jejak` (0094 §7): transaksi yang dihapus di
 * ruang ini, dihapus_pada desc, keyset {d, i} di ?kursor= (push). Status
 * dihapus | dipulihkan. Isi catatan/judul TIDAK dikirim (ada_catatan saja →
 * CashflowTeksTerkunci jenis 'sampah', baris yang diklik saja). Baris
 * bertaut ke laci transaksi (?tx= di tab Transaksi; laci jatuh ke sampah bila
 * id tidak hidup). Setiap halaman = satu baris audit baca_sampah.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import { keSampahRuang, kursorSampahDariUrl, ringkasSampah, type SampahRuangDTO } from '~/adapters/cashflowRuang'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const kasus = useCashflowKasus()
const { id, dasar, labelOrang, r360 } = useCashflowRuang()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

const PER = 100
const SKEMA = { kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' } } as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const kursor = computed(() => kursorSampahDariUrl(q.value.kursor))
const awalanKunci = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('jejak') ? `${kasus.kunciKasus.value}|sampah:${id.value}|` : null))
const kunci = computed(() => (awalanKunci.value ? `${awalanKunci.value}${kursor.value ? q.value.kursor : ''}` : null))
const mentah = computed(() => kasus.data<SampahRuangDTO>(kunci.value))
watch(kunci, (k) => {
  if (!k || mentah.value) return
  const ws = id.value
  const ks = kursor.value
  muat(async () => { await kasus.muatData(k, kk => api.sampahRuang(kk.id, ws, ks, PER)) })
}, { immediate: true })

const baris = computed(() => mentah.value?.baris.map(keSampahRuang) ?? [])
/* Total hanya di halaman pertama; halaman berikutnya meminjam angka itu. */
const total = computed(() => mentah.value?.total ?? kasus.data<SampahRuangDTO>(awalanKunci.value)?.total ?? null)
const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => mentah.value?.kursor_berikut,
  ke: k => setel({ kursor: k }, { dorong: true }),
})
const keTx = (tx: string) => `${dasar.value}/transaksi?tx=${tx}`
/* Lencana tab = yang MASIH terhapus (hitung.sampah); daftar ini memuat semua
   baris termasuk yang dipulihkan — keduanya disebut bila ada yang dipulihkan. */
const ringkas = computed(() => ringkasSampah(r360.value?.hitung.sampah ?? null, total.value))
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('sampah.ket') }}</p>
    <p v-if="ringkas" class="text-xs text-[var(--ca-subtle)]">{{ tcf('sampah.ringkas')(ringkas.masih, ringkas.total) }}</p>
    <CashflowPanelTab
      ranah="jejak" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah"
      :kosong="!!mentah && !baris.length" :pesan-kosong="tcf('sampah.kosong')"
    >
      <div v-if="mentah" class="space-y-4" :class="{ 'opacity-60': memuat }">
        <ol class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="s in baris" :key="s.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
            <NuxtLink :to="keTx(s.txId)" class="min-w-0 flex-1 underline-offset-2 hover:underline">
              <span class="flex flex-wrap items-center gap-2">
                <span :class="s.dipulihkan ? 'ca-pill-emerald' : 'ca-pill-muted'" class="text-[0.7rem]">{{ s.dipulihkan ? tcf('sampah.dipulihkan') : tcf('sampah.dihapus') }}</span>
                <span class="text-[var(--ca-text)]">{{ s.dompet }}</span>
                <span class="text-xs text-[var(--ca-muted)]">{{ s.kategori }}</span>
                <span v-if="s.tanggal" class="text-xs text-[var(--ca-subtle)]">· {{ formatTanggal(s.tanggal) }}</span>
                <span v-if="s.adaJudul" class="ca-pill-muted text-[0.7rem]">{{ tcf('sampah.berjudul') }}</span>
                <span v-if="s.adaFoto" class="ca-pill-muted text-[0.7rem]">{{ tcf('sampah.berfoto') }}</span>
              </span>
              <span class="mt-0.5 block text-xs text-[var(--ca-subtle)]">
                {{ tcf('transaksi.dihapusPada')(formatWaktu(s.dihapusIso)) }} · {{ tcf('sampah.dihapusOleh') }} <span class="font-mono">{{ labelOrang(s.dihapusOleh) }}</span>
                · {{ tcf('sampah.dicatatOleh') }} <span class="font-mono">{{ labelOrang(s.pencatat) }}</span>
                <template v-if="s.dipulihkanIso"> · {{ tcf('sampah.dipulihkanOleh') }} <span class="font-mono">{{ labelOrang(s.dipulihkanOleh) }}</span> {{ formatWaktu(s.dipulihkanIso) }} WIB</template>
              </span>
            </NuxtLink>
            <CashflowTeksTerkunci v-if="s.adaCatatan" jenis="sampah" :id="s.id" />
            <CashflowNominal :nilai="s.nominal" :jenis="s.jenis" />
          </li>
        </ol>
        <CashflowPagerKursor
          :halaman-pertama="!q.kursor" :ada-berikut="!!mentah.kursor_berikut" :jumlah="baris.length" :total="total" :memuat="memuat"
          @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
        />
      </div>
    </CashflowPanelTab>
  </div>
</template>
