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
import { angka, keRuang, JENIS_RUANG, type RuangDTO, type JenisRuang } from '~/adapters/cashflow'
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

const jenisOpsi = computed(() => JENIS.map(j => ({ nilai: j, label: (j === 'semua' ? tcf('umum.semua') : tcf(`ruang.jenisOpsi.${j}`)) as string })))
const columns = computed(() => [
  { key: 'nama', label: tcf('ruang.nama'), type: 'text' as const, class: 'cf-kuat break-words' },
  { key: 'pemilik', label: tcf('ruang.pemilik'), type: 'text' as const, class: 'break-all text-[var(--ca-muted)]' },
  { key: 'jenis', label: tcf('ruang.jenis'), type: 'text' as const, width: '110px', class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'anggota', label: tcf('ruang.anggota'), type: 'text' as const, width: '110px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'tx', label: tcf('ruang.tx'), type: 'text' as const, width: '130px', class: 'cf-ka', headerClass: 'cf-ka' },
  { key: 'undangan', label: tcf('ruang.undangan'), type: 'text' as const, width: '150px', class: 'cf-ka hidden md:table-cell', headerClass: 'cf-ka hidden md:table-cell' },
  { key: 'dibuat', label: tcf('ruang.dibuat'), type: 'text' as const, width: '130px', class: 'whitespace-nowrap text-[var(--ca-muted)]' },
])
const data = computed(() => mentah.value.map(keRuang).map(r => ({
  id: r.id, nama: r.nama, pemilik: r.pemilik,
  jenis: r.jenis ? tcf(`ruang.jenisOpsi.${r.jenis}`) : '—',
  anggota: r.anggota, tx: r.tx, undangan: r.undangan, dibuat: formatTanggal(r.dibuatIso),
})))
const terpotong = computed(() => total.value > mentah.value.length)
const tersaring = computed(() => !!cari.value.trim() || q.value.jenis !== 'semua')
const lepasSaringan = () => { cari.value = ''; void setel({ jenis: 'semua' }) }
/** Server menahan hitungan per ruang (sesi tanpa pii). */
const tanpaHitungan = computed(() => data.value.length > 0 && data.value.every(r => r.anggota === null && r.tx === null))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ruang.judul')" kicker="CashFlow" ringkas><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('ruang.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="cari" type="search" class="ca-input w-full sm:w-80"
        :placeholder="tcf('ruang.cari')" :aria-label="tcf('ruang.cari')" aria-describedby="cf-ruang-cari-ket"
      />
      <CashflowSegmen :opsi="jenisOpsi" :nilai="q.jenis" :label="tcf('ruang.jenis')" gulir @pilih="(j) => setel({ jenis: j })" />
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ mentah.length }} / {{ total }}</span>
    </div>
    <p id="cf-ruang-cari-ket" class="-mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('ruang.cariKet') }}</p>

    <p v-if="pesanGalat && mentah.length" class="rounded-xl bg-[var(--ca-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>
    <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(mentah.length, total) }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>
    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya ruang. -->
    <CashflowKeadaan
      v-if="pesanGalat && !mentah.length" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatRuang()"
    />
    <!-- Ponsel: satu kartu per ruang, isinya sama dengan baris tabel. -->
    <div v-if="!(pesanGalat && !mentah.length)" class="min-w-0 sm:hidden" data-uji="ruang-kartu">
      <CashflowKeadaan v-if="memuat && !data.length" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="5" :kolom="1" />
      <CashflowKeadaan
        v-else-if="!data.length" jenis="kosong"
        :judul="tersaring ? tcf('umum.kosongSaringJudul') : tcf('umum.kosongJudul')"
        :pesan="tersaring ? tcf('umum.kosongSaring') : tcf('umum.kosong')"
      >
        <button v-if="tersaring" type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" @click="lepasSaringan">{{ tcf('umum.lepasSaringan') }}</button>
      </CashflowKeadaan>
      <ul v-else class="space-y-3" :aria-busy="memuat">
        <li v-for="r in data" :key="r.id" class="ca-console-dialog min-w-0 p-4">
          <div class="flex min-w-0 items-start justify-between gap-2">
            <p class="cf-kuat min-w-0 break-words text-[0.9375rem]">{{ r.nama }}</p>
            <span v-if="r.jenis !== '—'" class="cf-lencana shrink-0">{{ r.jenis }}</span>
          </div>
          <p class="mt-1 break-all text-[0.8125rem] text-[var(--ca-muted)]">{{ tcf('ruang.pemilik') }} {{ r.pemilik }}</p>
          <dl class="mt-3 grid grid-cols-3 gap-x-3 border-t border-[color:var(--ca-border)] pt-3">
            <div v-for="k in (['anggota', 'tx', 'undangan'] as const)" :key="k" class="min-w-0">
              <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf(`ruang.${k}`) }}</dt>
              <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
                <span v-if="r[k] === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
                <template v-else>{{ angka(r[k]) }}</template>
              </dd>
            </div>
          </dl>
          <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('ruang.dibuat') }} {{ r.dibuat }}</p>
        </li>
      </ul>
    </div>
    <div v-if="!(pesanGalat && !mentah.length)" class="cf-tabel-wadah hidden sm:block">
      <DataTable :columns="columns" :data="data" :loading="memuat">
        <template #loading><CashflowKeadaan jenis="memuat" polos :pesan="tcf('umum.memuat')" :baris="6" :kolom="5" /></template>
        <template #empty>
          <CashflowKeadaan
            jenis="kosong" polos icon="lucide:layers"
            :judul="tersaring ? tcf('umum.kosongSaringJudul') : tcf('umum.kosongJudul')"
            :pesan="tersaring ? tcf('umum.kosongSaring') : tcf('umum.kosong')"
          >
            <button v-if="tersaring" type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" @click="lepasSaringan">{{ tcf('umum.lepasSaringan') }}</button>
          </CashflowKeadaan>
        </template>
        <template v-for="k in (['anggota', 'tx', 'undangan'] as const)" :key="k" #[`cell-${k}`]="{ value }">
          <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
          <template v-else>{{ angka(value) }}</template>
        </template>
      </DataTable>
    </div>
  </div>
</template>
