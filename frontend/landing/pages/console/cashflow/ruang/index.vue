<script setup lang="ts">
/**
 * Daftar ruang — nama buatan pengguna dan pemilik TERSAMAR, oleh server.
 *
 * Berkas ini index.vue di dalam folder ruang/, bukan ruang.vue: begitu
 * ruang/[id].vue ada (Fase 2), ruang.vue yang hidup berdampingan dengan
 * folder ruang/ otomatis menjadi INDUK rute, dan tanpa <NuxtPage/> halaman
 * detail dirender kosong.
 *
 * admin_daftar_ruang_v2 (0087): v1 memulangkan nama ruang UTUH dan
 * penyamarannya baru terjadi di adapter peramban — nama "Tabungan cerai"
 * tetap terbaca di tab Network. v2 menyamarkan nama dan pemilik di server,
 * tanpa ruang milik identitas layanan.
 *
 * Pencarian dikirim ke SERVER, dan server hanya mencocokkannya dengan bentuk
 * tersamar yang memang tampil (atau id ruang persis): menebak nama asli huruf
 * demi huruf tidak menemukan apa-apa, dan pencarian tidak menulis audit.
 * Karena itu pula ia menjangkau semua ruang, bukan hanya 500 yang termuat.
 * Teks cari tidak masuk URL (useState); jenis ruang masuk (?jenis).
 *
 * Server memotong di p_limit (maks. 500). Kalau total_semua lebih besar,
 * layar mengatakannya.
 *
 * Anggota, transaksi, dan undangan aktif dikirim server HANYA ke sesi ber-pii
 * (M/0089 §15 (d)); selain itu null → tabel menulis "—" (butuh TOTP), bukan 0.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { keRuang, JENIS_RUANG, type RuangDTO, type JenisRuang } from '~/adapters/cashflow'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 500
const JENIS = ['semua', ...JENIS_RUANG] as const
const SKEMA = { jenis: { jenis: 'pilihan', opsi: JENIS, bawaan: 'semua' } } as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const mentah = shallowRef<RuangDTO[]>([])
const total = ref(0)
const cari = useState('cf_cari_ruang', () => '')

/* Jawaban yang datang TERLAMBAT (ketikan sebelumnya) tidak boleh menimpa
   jawaban ketikan terbaru. muat() sendiri menahan memuat/galat permintaan
   basi; `terbaru()` menahan datanya. */
const muatRuang = () => muat(async (terbaru) => {
  const jenis: JenisRuang | null = q.value.jenis === 'semua' ? null : q.value.jenis
  const rows = await api.daftarRuang(MAKS, 0, cari.value, jenis)
  if (!terbaru()) return
  mentah.value = rows
  total.value = rows.length ? Number(rows[0]?.total_semua ?? rows.length) : 0
})
onMounted(muatRuang)
watch(() => q.value.jenis, muatRuang)
let jeda: ReturnType<typeof setTimeout> | undefined
watch(cari, () => { clearTimeout(jeda); jeda = setTimeout(muatRuang, 300) })
onBeforeUnmount(() => clearTimeout(jeda))

const jenisOpsi = computed(() => JENIS.map(j => ({ kunci: j, label: j === 'semua' ? tcf('umum.semua') : tcf(`ruang.jenisOpsi.${j}`) })))
const columns = computed(() => [
  { key: 'nama', label: tcf('ruang.nama'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]' },
  { key: 'pemilik', label: tcf('ruang.pemilik'), type: 'text' as const, class: 'font-mono' },
  { key: 'jenis', label: tcf('ruang.jenis'), type: 'text' as const, width: '100px', class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'anggota', label: tcf('ruang.anggota'), type: 'text' as const, width: '90px', class: 'tabular-nums text-right' },
  { key: 'tx', label: tcf('ruang.tx'), type: 'text' as const, width: '110px', class: 'tabular-nums text-right' },
  { key: 'undangan', label: tcf('ruang.undangan'), type: 'text' as const, width: '120px', class: 'hidden tabular-nums text-right md:table-cell', headerClass: 'hidden md:table-cell' },
  { key: 'dibuat', label: tcf('ruang.dibuat'), type: 'text' as const, width: '120px' },
])
const data = computed(() => mentah.value.map(keRuang).map(r => ({
  id: r.id, nama: r.nama, pemilik: r.pemilik,
  jenis: r.jenis ? tcf(`ruang.jenisOpsi.${r.jenis}`) : '—',
  anggota: r.anggota, tx: r.tx, undangan: r.undangan, dibuat: formatTanggal(r.dibuatIso),
})))
const terpotong = computed(() => total.value > mentah.value.length)
/** Server menahan hitungan per ruang (sesi tanpa pii). */
const tanpaHitungan = computed(() => data.value.length > 0 && data.value.every(r => r.anggota === null && r.tx === null))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ruang.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('ruang.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="cari" type="search" class="ca-input w-full sm:w-80"
        :placeholder="tcf('ruang.cari')" :aria-label="tcf('ruang.cari')" aria-describedby="cf-ruang-cari-ket"
      />
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="j in jenisOpsi" :key="j.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="q.jenis === j.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.jenis === j.kunci"
          @click="setel({ jenis: j.kunci })"
        >{{ j.label }}</button>
      </div>
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ mentah.length }} / {{ total }}</span>
    </div>
    <p id="cf-ruang-cari-ket" class="-mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('ruang.cariKet') }}</p>

    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(mentah.length, total) }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>
    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya ruang. -->
    <div v-if="!pesanGalat || mentah.length" class="ca-console-dialog overflow-hidden">
      <DataTable
        :columns="columns" :data="data" :loading="memuat" empty-icon="lucide:layers"
        :empty-text="cari.trim() || q.jenis !== 'semua' ? tcf('umum.kosongSaring') : tcf('umum.kosong')"
      >
        <template v-for="k in (['anggota', 'tx', 'undangan'] as const)" :key="k" #[`cell-${k}`]="{ value }">
          <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
          <template v-else>{{ value }}</template>
        </template>
      </DataTable>
    </div>
  </div>
</template>
