<script setup lang="ts">
/**
 * Tab Jejak bersama Pengguna 360 dan Ruang 360 — ranah `jejak` (T2):
 * admin_jejak.
 *   mode 'pengguna'  aktor = subjek, di ruang lingkup kasus (saringan ?ruang=);
 *   mode 'ruang'     aktor null = semua peristiwa di ruang subjek; kolom
 *                    ruang diganti aktor (email tersamar anggota).
 * Server mengirim kunci kolom yang berubah TANPA nilainya dan `ada_judul`
 * saja; judul & nilai selisih = teks bebas T3 (CashflowTeksTerkunci jenis
 * 'jejak', id bigint — baris yang diklik saja). Jeda tiba (jam server − jam
 * perangkat) ditandai bila ≥ 1 menit — itu antrean di HP.
 *
 * Saringan ?ruang&jenis&dari&sampai (replace), halaman ?kursor= (push).
 * Sasaran transaksi bertaut ke laci di tab Transaksi subjek yang sama
 * (?tx=), sasaran pengguna (anggota.*) ke kepala T0 orangnya.
 */
import { POLA_UUID } from '~/adapters/cashflow'
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import { keJejakBaris, kursorJejakDariUrl, jedaTiba, JENIS_PERISTIWA, type JejakDTO } from '~/adapters/cashflowJejak'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { argumenJejak } from '~/adapters/cashflowRuang'

const { tcf, formatWaktu, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const kasus = useCashflowKasus()
const props = defineProps<{
  mode: 'pengguna' | 'ruang'
  /** Pengguna (mode pengguna) atau ruang (mode ruang). */
  subjek: string
  /** Akar rute subjek (/console/cashflow/pengguna/<id> atau /ruang/<id>). */
  dasar: string
  namaRuang: (ws: string) => string
  /** Label aktor (mode ruang). */
  labelOrang?: (uid: string | null) => string
}>()
const id = computed(() => props.subjek)
const modeRuang = computed(() => props.mode === 'ruang')
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

const PER = 100
const POLA_TGL = /^\d{4}-\d{2}-\d{2}$/
const SKEMA = {
  ruang: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  jenis: { jenis: 'pilihan', opsi: ['', ...JENIS_PERISTIWA], bawaan: '' },
  dari: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  sampai: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

/** Mode ruang: p_ws = ruang subjek, tanpa aktor (argumenJejak). */
const argumen = computed(() => argumenJejak(props.mode, id.value, q.value))
const saring = computed(() => argumen.value.saring)
const kursor = computed(() => kursorJejakDariUrl(q.value.kursor))
const awalanKunci = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('jejak') ? `${kasus.kunciKasus.value}|jejak:${props.mode}:${id.value}|${JSON.stringify(saring.value)}|` : null))
const kunci = computed(() => (awalanKunci.value ? `${awalanKunci.value}${kursor.value ? q.value.kursor : ''}` : null))
const mentah = computed(() => kasus.data<JejakDTO>(kunci.value))

watch(kunci, (k) => {
  if (!k || mentah.value) return
  const a = argumen.value
  const ks = kursor.value
  muat(async () => { await kasus.muatData(k, kk => api.jejak(kk.id, a.aktor, a.saring, ks, PER)) })
}, { immediate: true })

const baris = computed(() => mentah.value?.baris.map(keJejakBaris) ?? [])
const total = computed(() => mentah.value?.total ?? kasus.data<JejakDTO>(awalanKunci.value)?.total ?? null)
const pilihanRuang = computed(() => (modeRuang.value ? [] : (kasus.kasus.value?.ruang ?? []).map(w => ({ id: w, nama: props.namaRuang(w) }))))
const jumlahSaring = computed(() => [modeRuang.value ? '' : q.value.ruang, q.value.jenis, q.value.dari, q.value.sampai].filter(Boolean).length)
const saringBuka = ref(false)

type Ubah = Parameters<typeof setel>[0]
const saringUlang = (ubah: Ubah) => setel({ ...ubah, kursor: '' })

const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => mentah.value?.kursor_berikut,
  ke: kursor => setel({ kursor }, { dorong: true }),
})

const sorot = ref(-1)
const idSorot = useState<string | null>('cf_salin_sorot', () => null)
watch(baris, () => { sorot.value = -1 })
watch(sorot, (i) => { const b = baris.value[i]; idSorot.value = b ? String(b.id) : null })
onBeforeUnmount(() => { idSorot.value = null })
const gerak = (n: number) => {
  if (!baris.value.length) return
  sorot.value = Math.min(baris.value.length - 1, Math.max(0, sorot.value + n))
  if (import.meta.client) document.getElementById(`cf-jejak-${sorot.value}`)?.scrollIntoView({ block: 'nearest' })
}
const tujuanSasaran = (b: ReturnType<typeof keJejakBaris>): string | null => {
  if (!b.sasaranId) return null
  if (b.sasaran === 'transaksi') return `${props.dasar}/transaksi?tx=${b.sasaranId}`
  if (b.sasaran === 'pengguna' && (modeRuang.value || b.sasaranId !== id.value)) return `/console/cashflow/pengguna/${b.sasaranId}`
  return null
}
useCashflowPintasan([
  { kunci: 'j', aksi: () => gerak(1) },
  { kunci: 'k', aksi: () => gerak(-1) },
  // Tanpa baris tersorot (atau tanpa sasaran) tidak ada yang dibuka: false = Enter dibiarkan ke peramban.
  { kunci: 'enter', aksi: () => { const b = baris.value[sorot.value]; const ke = b ? tujuanSasaran(b) : null; if (!ke) return false; navigateTo(ke); return true } },
])

const teksJeda = (d: number | null) => {
  const j = jedaTiba(d)
  return j ? tcf('jejak.jedaTiba')(j.n, j.satuan) : ''
}
const pesanKosong = computed(() => (jumlahSaring.value ? tcf('umum.kosongSaring') : !modeRuang.value && !kasus.kasus.value?.ruang.length ? tcf('transaksi.tanpaRuang') : tcf('jejak.kosong')))
/** Mode ruang: siapa pelakunya; mode pengguna: di ruang mana. */
const keterangan = (b: ReturnType<typeof keJejakBaris>) =>
  (modeRuang.value ? (props.labelOrang ? props.labelOrang(b.aktor) : (b.aktor?.slice(0, 8) ?? '—')) : props.namaRuang(b.ruangId))
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <div class="flex items-center gap-2 sm:hidden">
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-sm" :aria-expanded="saringBuka" @click="saringBuka = !saringBuka">
        <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" /> {{ tcf('saring.tombol')(jumlahSaring) }}
      </button>
    </div>
    <div class="grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end" :class="saringBuka ? 'grid' : 'hidden sm:flex'">
      <label v-if="!modeRuang" class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)] sm:col-span-1">
        {{ tcf('transaksi.ruang') }}
        <select :value="q.ruang" class="ca-input" @change="saringUlang({ ruang: ($event.target as HTMLSelectElement).value })">
          <option value="">{{ tcf('saring.semuaRuang') }}</option>
          <option v-for="r in pilihanRuang" :key="r.id" :value="r.id">{{ r.nama }}</option>
        </select>
      </label>
      <label class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)] sm:col-span-1">
        {{ tcf('jejak.jenis') }}
        <select :value="q.jenis" class="ca-input" @change="saringUlang({ jenis: ($event.target as HTMLSelectElement).value as typeof q.jenis })">
          <option value="">{{ tcf('umum.semua') }}</option>
          <option v-for="j in JENIS_PERISTIWA" :key="j" :value="j">{{ tcf(`jejak.jenisOpsi.${j}`) }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.dari') }}
        <input type="date" :value="q.dari" class="ca-input" @change="saringUlang({ dari: ($event.target as HTMLInputElement).value })">
      </label>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.sampai') }}
        <input type="date" :value="q.sampai" class="ca-input" @change="saringUlang({ sampai: ($event.target as HTMLInputElement).value })">
      </label>
    </div>

    <CashflowPanelTab
      ranah="jejak" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah"
      :kosong="!!mentah && !baris.length" :pesan-kosong="pesanKosong"
    >
      <div v-if="mentah" class="space-y-4" :class="{ 'opacity-60': memuat }">
        <ol class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
          <li
            v-for="(b, i) in baris" :id="`cf-jejak-${i}`" :key="b.id"
            class="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-start sm:gap-4"
            :class="sorot === i ? 'bg-[var(--ca-gold-bg)]' : ''"
            @click="sorot = i"
          >
            <span class="w-36 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatWaktu(b.padaIso) }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-xs text-[var(--ca-muted)]">{{ tcf(`jejak.jenisOpsi.${b.jenis}`) }}</span>
                <span class="text-xs text-[var(--ca-muted)]" :class="{ 'font-mono': modeRuang }">{{ keterangan(b) }}</span>
                <span v-if="b.tanggal" class="text-xs text-[var(--ca-subtle)]">· {{ formatTanggal(b.tanggal) }}</span>
                <span v-if="teksJeda(b.jedaTiba)" class="ca-pill-gold text-[0.7rem]" :title="tcf('jejak.jedaKet')">{{ teksJeda(b.jedaTiba) }}</span>
                <NuxtLink v-if="tujuanSasaran(b)" :to="tujuanSasaran(b)!" class="text-xs text-[var(--ca-muted)] underline-offset-2 hover:underline" @click.stop>
                  {{ b.sasaran === 'transaksi' ? tcf('jejak.bukaTransaksi') : tcf('jejak.bukaPengguna') }}
                </NuxtLink>
              </div>
              <div v-if="b.kunci.length" class="mt-1 flex flex-wrap gap-1">
                <span v-for="k in b.kunci" :key="k" class="rounded bg-[var(--ca-chip-bg)] px-1.5 font-mono text-[0.7rem] text-[var(--ca-muted)]">{{ k }}</span>
              </div>
              <div v-if="b.adaJudul" class="mt-1"><CashflowTeksTerkunci jenis="jejak" :id="b.id" /></div>
            </div>
            <CashflowNominal v-if="b.nominal != null" class="shrink-0 sm:text-right" :nilai="b.nominal" :arah="b.arah" />
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
