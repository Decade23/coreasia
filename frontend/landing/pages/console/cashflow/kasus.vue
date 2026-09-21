<script setup lang="ts">
/**
 * Kasus — kasus saya / semua kasus (admin_daftar_kasus, T0, tanpa audit).
 *
 * Subjek SELALU tersamar di sini, juga untuk pemegang cashflow:pii: daftar
 * tanpa kasus tidak boleh jadi direktori email utuh. Alasan terpotong 10
 * aksara kecuali untuk pemegang pii atau kasus milik sendiri. Rantai
 * `lanjutan_dari` (buka ulang sesudah 2 jam, alasan baru) dan kasus anak
 * investigasi (T3) ditandai.
 *
 * Spanduk batas akses: penolakan batas laju (5 subjek/jam, 15/hari) tercatat
 * sebagai baris audit `batas_akses` — ditarik dari audit v3, 24 jam terakhir.
 *
 * URL: ?lingkup=saya|semua&subjek=<uuid>&hal (replace). Email pelaku TIDAK
 * masuk URL: "kasus saya" menyaring server dengan email sesi ini.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { POLA_UUID } from '~/adapters/cashflow'
import { keBarisKasus, keBarisAudit, type BarisKasus, type DaftarKasusDTO, type BarisAudit } from '~/adapters/cashflowKasus'
import { potongHalaman, halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, formatWaktu } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const { user } = useAdminAuth()
const sesi = useCashflowSesi()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 200
const PER = 25
const SKEMA = {
  lingkup: { jenis: 'pilihan', opsi: ['saya', 'semua'], bawaan: 'saya' },
  subjek: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const mentah = shallowRef<DaftarKasusDTO[]>([])
const baris = computed<BarisKasus[]>(() => mentah.value.map(keBarisKasus))
const total = ref(0)
const batas = shallowRef<BarisAudit[]>([])

const pelakuSaya = computed(() => (sesi.pelaku.value || user.value?.email || '').trim().toLowerCase())
const muatKasus = () => muat(async (terbaru) => {
  const pelaku = q.value.lingkup === 'saya' ? (pelakuSaya.value || null) : null
  const [rows, aud] = await Promise.all([
    api.daftarKasus(MAKS, 0, pelaku, q.value.subjek || null),
    api.daftarAudit(20, 0, 'batas_akses', null),
  ])
  if (!terbaru()) return
  mentah.value = rows
  total.value = rows.length ? Number(rows[0]?.total_semua ?? rows.length) : 0
  const sehari = Date.now() - 864e5
  batas.value = aud.map(keBarisAudit).filter(a => Date.parse(a.waktuIso) >= sehari)
})
watch(() => [q.value.lingkup, q.value.subjek], muatKasus, { immediate: true })

const hal = computed(() => (memuat.value ? q.value.hal : halamanAman(q.value.hal, baris.value.length, PER)))
const jumlahHal = computed(() => jumlahHalaman(baris.value.length, PER))
const barisHalaman = computed(() => potongHalaman(baris.value, hal.value, PER))
const terpotong = computed(() => total.value > baris.value.length)
const { wadah, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => { await setel({ hal: h }); await keKepala() }

/** Skenario yang dikenal kamus (pembukaan otomatis Pengguna 360), selain itu apa adanya. */
const labelSkenario = (s: string) => {
  const l: unknown = tcf(`skenario.${s}`)
  return typeof l === 'string' && l !== `skenario.${s}` ? l : s
}

const nadaStatus = (s: BarisKasus['status']) =>
  s === 'aktif' ? 'ca-pill-emerald' : s === 'dicabut' ? 'ca-pill-danger' : 'ca-pill-muted'

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.kasus') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('kasus.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('kasus.ket') }}</p>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="l in (['saya', 'semua'] as const)" :key="l" type="button" class="rounded-full px-3 py-1 transition"
          :class="q.lingkup === l ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.lingkup === l" @click="setel({ lingkup: l, hal: 1 })"
        >{{ tcf(`kasus.lingkupOpsi.${l}`) }}</button>
      </div>
      <button v-if="q.subjek" type="button" class="ca-pill-info text-xs" @click="setel({ subjek: '', hal: 1 })">
        {{ tcf('kasus.subjekSaring') }}: {{ q.subjek.slice(0, 8) }} ×
      </button>
    </div>

    <p v-if="batas.length" class="rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-3 text-sm text-[var(--ca-danger-text)]" role="status">
      {{ tcf('kasus.batasSpanduk')(batas.length) }}
      <span class="block text-xs">{{ batas.slice(0, 5).map(b => `${b.pelaku} · ${formatWaktu(b.waktuIso)}`).join(' — ') }}</span>
    </p>

    <CashflowIzinKurang v-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !baris.length" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(baris.length, total) }}</p>
      <div ref="wadah" class="scroll-mt-24">
        <CashflowKeadaanKosong v-if="!barisHalaman.length" :pesan="tcf('kasus.kosong')" icon="lucide:folder-lock" />
        <ul v-else class="space-y-2">
          <li v-for="k in barisHalaman" :key="k.id" class="ca-console-dialog p-4 text-sm">
            <div class="flex flex-wrap items-center gap-2">
              <span class="tabular-nums text-xs text-[var(--ca-subtle)]">{{ formatWaktu(k.dibukaIso) }}</span>
              <span :class="nadaStatus(k.status)" class="text-[0.7rem]">{{ k.status ? tcf(`kasus.status.${k.status}`) : '—' }}</span>
              <span v-if="k.induk" class="ca-pill-gold text-[0.7rem]">{{ tcf('kasus.anak') }}</span>
              <span v-if="k.lanjutanDari" class="ca-pill-muted text-[0.7rem]" :title="k.lanjutanDari">{{ tcf('kasus.lanjutan') }} · {{ k.lanjutanDari.slice(0, 8) }}</span>
              <span class="ml-auto font-mono text-xs text-[var(--ca-subtle)]">{{ k.id.slice(0, 8) }}</span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <NuxtLink :to="`/console/cashflow/pengguna/${k.subjekId}`" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline">{{ k.subjekLabel }}</NuxtLink>
              <span class="text-xs text-[var(--ca-muted)]">{{ tcf('kasus.oleh') }} <span class="font-mono">{{ k.pelaku }}</span></span>
              <span v-if="k.milikSaya" class="ca-pill-info text-[0.7rem]">{{ tcf('akses.saya') }}</span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span v-if="k.skenario" class="ca-pill-muted">{{ labelSkenario(k.skenario) }}</span>
              <span class="ca-pill-muted">{{ tcf(`preset.${k.preset}`) }}</span>
              <span v-for="r in k.ranah" :key="r" class="ca-pill-emerald">{{ tcf(`ranah.${r}`) }}</span>
              <span class="text-[var(--ca-subtle)]">· {{ tcf('kasus.bilah.ruang')(k.ruang) }}<template v-if="k.terdampak !== null"> · {{ tcf('kasus.terdampak')(k.terdampak) }}</template></span>
            </div>
            <p class="mt-1.5 text-xs text-[var(--ca-muted)]">
              {{ tcf('kasus.bilah.alasan') }}: <span class="text-[var(--ca-text)]">{{ k.alasan || '—' }}</span>
              <span v-if="!k.alasanUtuh" class="text-[var(--ca-subtle)]"> ({{ tcf('kasus.alasanTerpotong') }})</span>
            </p>
            <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">
              {{ k.ditutupIso ? tcf('kasus.ditutupPada')(formatWaktu(k.ditutupIso)) : tcf('kasus.berlakuSampai')(formatWaktu(k.sampaiIso)) }}
            </p>
          </li>
        </ul>
      </div>
      <CashflowHalaman v-if="baris.length" :hal="hal" :jumlah-halaman="jumlahHal" :total="baris.length" :per="PER" @ganti="gantiHalaman" />
    </template>
  </div>
</template>
