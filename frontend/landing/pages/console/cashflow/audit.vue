<script setup lang="ts">
/**
 * Audit CashFlow — admin_daftar_audit_v3 (0089), dibaca LANGSUNG dari
 * Supabase dengan sesi CashFlow. Tidak disalin ke gateway_audit_logs:
 * target_id dan reason bisa memuat nama; menyalinnya = PII di dua tempat.
 *
 * v3 (T0): target SELALU tersamar (juga untuk pemegang pii — 500 baris tanpa
 * kasus tidak boleh jadi direktori email), alasan terpotong 10 aksara kecuali
 * untuk pemegang pii atau baris milik sendiri, `pelaku` = email admin console
 * (bukti server), ditambah kolom ranah, kasus, dan jumlah terdampak.
 *
 * Saringan di URL (?aksi&pelaku&hal, replace). `aksi` disaring server;
 * `pelaku` disaring di klien — ?pelaku= berisi SIDIK email (sha256, 10
 * aksara), bukan emailnya: URL yang dimuat penuh tercatat di riwayat peramban
 * dan log Vercel. Saringan kasus (klik id kasus) disaring server tapi TIDAK
 * di URL — id kasus tidak pernah masuk URL/storage (useState saja).
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { sidik, POLA_SIDIK } from '~/adapters/cashflow'
import { keBarisAudit, type AuditV3DTO, type BarisAudit } from '~/adapters/cashflowKasus'
import { potongHalaman, halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'

const { tcf, formatWaktu } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 500
const PER = 25
const SKEMA = {
  aksi: { jenis: 'teks', pola: /^[a-z0-9_]+$/, maks: 64, bawaan: '' },
  pelaku: { jenis: 'teks', pola: POLA_SIDIK, maks: 10, bawaan: '' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)
/** Saringan kasus: memori tab saja (bukan URL). */
const kasusSaring = useState<string | null>('cf_audit_kasus', () => null)

const mentah = shallowRef<AuditV3DTO[]>([])
const rows = computed<BarisAudit[]>(() => mentah.value.map(keBarisAudit))
const total = ref(0)
const aksi = ref<Array<{ action: string; jumlah: number }>>([])

const muatAudit = () => muat(async (terbaru) => {
  const [r, a] = await Promise.all([api.daftarAudit(MAKS, 0, q.value.aksi || null, kasusSaring.value), api.aksiAudit()])
  if (!terbaru()) return // saringan sudah berganti lagi
  mentah.value = r
  total.value = r.length ? Number(r[0]?.total_semua ?? r.length) : 0
  aksi.value = a
})
watch(() => [q.value.aksi, kasusSaring.value], muatAudit, { immediate: true })

/* sidik → email, dihitung ulang tiap baris berganti (crypto.subtle asinkron).
   `petaSiap` menahan saringan dan penjepitan ?hal sampai peta selesai. */
const petaSidik = shallowRef(new Map<string, string>())
const petaSiap = ref(false)
watch(rows, async (r) => {
  petaSiap.value = false
  let peta = new Map<string, string>()
  try {
    const email = [...new Set(r.map(x => x.pelaku).filter(p => p && p !== '—'))]
    peta = new Map(await Promise.all(email.map(async e => [await sidik(e), e] as const)))
  } catch {
    // crypto.subtle tidak ada (bukan konteks aman): saringan pelaku kosong, halaman tetap jalan.
  }
  if (r !== rows.value) return // baris sudah berganti lagi
  petaSidik.value = peta
  petaSiap.value = true
})
const opsiPelaku = computed(() => {
  const opsi = [...petaSidik.value].map(([nilai, label]) => ({ nilai, label })).sort((a, b) => a.label.localeCompare(b.label))
  // Sidik dari tautan yang pelakunya tidak ada di baris ini tetap tampil terpilih.
  if (q.value.pelaku && !petaSidik.value.has(q.value.pelaku)) opsi.push({ nilai: q.value.pelaku, label: q.value.pelaku })
  return opsi
})
const tersaring = computed(() => {
  if (!q.value.pelaku) return rows.value
  const email = petaSidik.value.get(q.value.pelaku)
  return email ? rows.value.filter(r => r.pelaku === email) : []
})
const menunggu = computed(() => memuat.value || (!!q.value.pelaku && !petaSiap.value))
const hal = computed(() => (menunggu.value ? q.value.hal : halamanAman(q.value.hal, tersaring.value.length, PER)))
const jumlahHal = computed(() => jumlahHalaman(tersaring.value.length, PER))
const barisHalaman = computed(() => potongHalaman(tersaring.value, hal.value, PER))
const terpotong = computed(() => total.value > rows.value.length)

// Mengganti saringan = kembali ke halaman 1.
const pilihAksi = (v: string) => setel({ aksi: v, hal: 1 })
const pilihPelaku = (v: string) => setel({ pelaku: v, hal: 1 })
const pilihKasus = (k: string | null) => { kasusSaring.value = k; setel({ hal: 1 }) }

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.audit') },
])

const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('audit.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('audit.ket') }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <select :value="q.aksi" class="ca-input" :aria-label="tcf('audit.aksi')" @change="pilihAksi(($event.target as HTMLSelectElement).value)">
        <option value="">{{ tcf('umum.semua') }}</option>
        <option v-for="a in aksi" :key="a.action" :value="a.action">{{ a.action }} ({{ a.jumlah }})</option>
      </select>
      <select :value="q.pelaku" class="ca-input" :aria-label="tcf('audit.admin')" @change="pilihPelaku(($event.target as HTMLSelectElement).value)">
        <option value="">{{ tcf('audit.semuaPelaku') }}</option>
        <option v-for="p in opsiPelaku" :key="p.nilai" :value="p.nilai">{{ p.label }}</option>
      </select>
      <button v-if="kasusSaring" type="button" class="ca-pill-info text-xs" @click="pilihKasus(null)">
        {{ tcf('audit.kasus') }}: {{ kasusSaring.slice(0, 8) }} ×
      </button>
    </div>
    <CashflowIzinKurang v-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="menunggu" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(rows.length, total) }}</p>
      <div ref="wadahDaftar" class="ca-console-dialog scroll-mt-24 overflow-x-auto">
        <CashflowKeadaanKosong v-if="!barisHalaman.length" class="m-5" :pesan="rows.length ? tcf('umum.kosongSaring') : tcf('umum.kosong')" icon="lucide:scroll-text" />
        <table v-else class="w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="px-4 py-2">{{ tcf('audit.waktu') }}</th>
            <th class="px-4 py-2">{{ tcf('audit.aksi') }}</th>
            <th class="hidden px-4 py-2 md:table-cell">{{ tcf('audit.admin') }}</th>
            <th class="px-4 py-2">{{ tcf('audit.target') }}</th>
            <th class="hidden px-4 py-2 lg:table-cell">{{ tcf('audit.ranah') }}</th>
            <th class="hidden px-4 py-2 sm:table-cell">{{ tcf('audit.alasan') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="r in barisHalaman" :key="r.id" class="border-t border-[color:var(--ca-border)] align-top text-[var(--ca-text)]">
              <td class="whitespace-nowrap px-4 py-1.5 text-xs text-[var(--ca-subtle)] tabular-nums">{{ formatWaktu(r.waktuIso) }}</td>
              <td class="px-4 py-1.5">
                <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-xs">{{ r.aksi }}</span>
                <button v-if="r.kasus" type="button" class="ml-1 font-mono text-[0.7rem] text-[var(--ca-subtle)] underline-offset-2 hover:underline" :title="tcf('audit.saringKasus')" @click="pilihKasus(r.kasus)">#{{ r.kasus.slice(0, 8) }}</button>
              </td>
              <td class="hidden px-4 py-1.5 font-mono text-xs md:table-cell">{{ r.pelaku }}</td>
              <td class="px-4 py-1.5 font-mono text-xs">
                <!-- Target pengguna menuju kepala T0 (datanya tetap di balik kasus); target_email
                     null pada target 'user' = akunnya sudah hilang. -->
                <NuxtLink
                  v-if="r.targetTipe === 'user' && r.targetId && r.targetLabel"
                  :to="`/console/cashflow/pengguna/${r.targetId}`" class="underline-offset-2 hover:underline"
                >{{ r.targetLabel }}</NuxtLink>
                <span v-else-if="r.targetTipe === 'user' && r.targetId" class="text-[var(--ca-subtle)]">{{ tcf('audit.akunHilang') }} · {{ r.targetId.slice(0, 8) }}</span>
                <span v-else>{{ r.targetLabel || r.targetId?.slice(0, 8) || '—' }}</span>
                <span v-if="r.terdampak" class="block text-[0.7rem] text-[var(--ca-subtle)]">{{ tcf('kasus.terdampak')(r.terdampak) }}</span>
              </td>
              <td class="hidden px-4 py-1.5 lg:table-cell">
                <span class="flex flex-wrap gap-1"><span v-for="x in r.ranah" :key="x" class="ca-pill-emerald text-[0.7rem]">{{ tcf(`ranah.${x}`) }}</span></span>
              </td>
              <td class="hidden px-4 py-1.5 text-xs text-[var(--ca-muted)] sm:table-cell">
                {{ r.alasan || '—' }}<span v-if="r.alasan && !r.alasanUtuh" class="text-[var(--ca-subtle)]"> ({{ tcf('kasus.alasanTerpotong') }})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CashflowHalaman
        v-if="tersaring.length"
        :hal="hal" :jumlah-halaman="jumlahHal" :total="tersaring.length" :per="PER"
        @ganti="gantiHalaman"
      />
    </template>
  </div>
</template>
