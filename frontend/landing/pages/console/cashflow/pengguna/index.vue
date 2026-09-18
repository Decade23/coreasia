<script setup lang="ts">
/**
 * Daftar pengguna — TERSAMAR secara bawaan (K1, 18 Sep 2026; membalik
 * keputusan 5 Sep).
 *
 * Kenapa dibalik: dengan email utuh sebagai bawaan, setiap kunjungan membuka
 * email semua orang dengan alasan berupa konstanta di kode. Itu bertentangan
 * dengan janji "tidak ada mode sekadar melihat-lihat" di kebijakan privasi,
 * dan baris auditnya tidak menunjuk siapa pun. Sekarang:
 * - bawaan: admin_daftar_pengguna_v2 tanpa alasan → server menyamarkan dan
 *   tidak menulis audit (0082);
 * - "Tampilkan email lengkap" meminta alasan yang DIKETIK (≥ 8 aksara) → satu
 *   baris audit per muat. Alasannya diingat 30 menit di memori tab
 *   (useCashflowAlasanDaftar), jadi kembali dari detail tidak bertanya lagi,
 *   tapi tetap tercatat. Lewat 30 menit, layar kembali tersamar sendiri;
 * - "Samarkan lagi" melupakan alasan dan membuang email utuh dari memori,
 *   tanpa jaringan.
 *
 * Saring, urut, dan paginasi di KLIEN atas ≤ 500 baris, berurutan saring →
 * urut (nilai mentah) → potong per halaman. Pencarian tidak dikirim ke
 * server: saat daftar terbuka, satu ketikan akan berarti satu baris audit.
 *
 * Posisi ada di URL (?seg&urut&arah&hal, replace), jadi refresh dan Back dari
 * detail kembali ke tempat yang sama. Teks cari dan saringan kolom sengaja
 * tidak di URL (isinya bisa potongan email) — keduanya di useState, supaya
 * Back mengembalikan saringan yang menjadi dasar ?hal.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { kePengguna, samarkanEmail, type Pengguna, type PenggunaDTO } from '~/adapters/cashflow'
import { urutkan, saringKolom, potongHalaman, halamanAman, jumlahHalaman, type AturanUrut } from '~/adapters/cashflowDaftar'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import type { AlasanDaftar } from '~/composables/cashflow/useCashflowAlasanDaftar'

const { tcf, bahasa, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const route = useRoute()
const indeks = useCashflowIndeks()
const alasanDaftar = useCashflowAlasanDaftar()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 500
const PER = 25
const SEGMEN = ['semua', 'catat7', 'belum', 'ditangguhkan'] as const
const URUT = ['email', 'daftar', 'aktif', 'ruang', 'tx'] as const
type KunciUrut = typeof URUT[number]
const SKEMA = {
  seg: { jenis: 'pilihan', opsi: SEGMEN, bawaan: 'semua' },
  urut: { jenis: 'pilihan', opsi: URUT, bawaan: 'daftar' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

/* DTO disimpan mentah dan dipetakan ulang saat bahasa berganti: tanggal
   tampilan ('3 Agu 2026' / '3 Aug 2026') dibentuk adapter. */
const mentah = shallowRef<PenggunaDTO[]>([])
const semua = computed<Pengguna[]>(() => mentah.value.map(d => kePengguna(d, bahasa.value)))
const total = ref(0)
const cari = useState('cf_cari_pengguna', () => '')
const kolomCari = ref<HTMLInputElement | null>(null)
const filterKolom = useState<Record<string, string>>('cf_saring_kolom_pengguna', () => ({}))
const gerbang = ref(false)
const terbuka = ref<AlasanDaftar | null>(null)

/** Buang email utuh dari memori, tanpa jaringan (samarkanEmail idempoten). */
const tanpaEmailUtuh = (rows: PenggunaDTO[]) => rows.map(d => ({ ...d, email: samarkanEmail(d.email), terbuka: false }))

/* `alasan` adalah salinan yang diambil SEBELUM permintaan, bukan ambil()
   sesudahnya: kalau batas 30 menit lewat selagi permintaan berjalan, ambil()
   sudah null padahal server memulangkan email utuh — tabel terbuka tanpa
   spanduk dan tanpa pengatur waktu. Dengan salinan, pengatur waktu tetap
   dipasang dan langsung menyamarkan bila batasnya sudah lewat. */
const muatDaftar = (alasan: AlasanDaftar | null) => muat(async () => {
  const rows = await api.daftarPengguna(MAKS, 0, '', alasan?.alasan ?? null)
  // Dimuat tanpa alasan = tidak boleh ada email utuh, apa pun jawabannya.
  mentah.value = alasan ? rows : tanpaEmailUtuh(rows)
  total.value = rows.length ? Number(rows[0]?.total_semua ?? rows.length) : 0
  // Indeks palet hanya menerima bentuk tersamar, sekalipun daftar sedang terbuka.
  indeks.isi(semua.value, total.value)
  terbuka.value = alasan
})
onMounted(() => muatDaftar(alasanDaftar.ambil()))

const bukaDenganAlasan = async (a: string) => {
  gerbang.value = false
  if (!(await muatDaftar(alasanDaftar.ingat(a)))) alasanDaftar.lupakan()
}
const samarkan = () => {
  alasanDaftar.lupakan()
  terbuka.value = null
  mentah.value = tanpaEmailUtuh(mentah.value)
}
let pengatur: ReturnType<typeof setTimeout> | undefined
watch(terbuka, (t) => {
  clearTimeout(pengatur)
  if (t) pengatur = setTimeout(samarkan, Math.max(0, t.sampai - Date.now()))
})
onBeforeUnmount(() => clearTimeout(pengatur))

/* Pindah halaman: wadah tabel DataTable elemen yang sama antarhalaman dan
   menyimpan scrollTop-nya, jadi halaman 2 tampil dari baris ±40 — terbaca
   seolah urutannya terlompati. */
const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}

// Tombol kembali di halaman detail membawa query terakhir daftar ini.
watch(() => route.fullPath, p => indeks.ingatDaftar(p), { immediate: true })

interface Baris { id: string; email: string; daftar: string; aktif: string; ruang: number; tx: number; status: string; p: Pengguna }
const keBaris = (p: Pengguna): Baris => ({
  id: p.id,
  email: p.emailPenuh ?? p.emailTersamar,
  daftar: p.daftar,
  aktif: p.aktivitasTerakhir,
  ruang: p.ruang,
  tx: p.tx,
  status: p.status === 'aktif' ? tcf('pengguna.aktif') : tcf('pengguna.ditangguhkan'),
  p,
})

const kolom = computed(() => [
  { key: 'email', label: tcf('pengguna.email'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]', sortable: true },
  { key: 'daftar', label: tcf('pengguna.daftar'), type: 'text' as const, width: '120px', sortable: true, class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell' },
  { key: 'aktif', label: tcf('pengguna.aktifTerakhir'), type: 'text' as const, width: '130px', sortable: true },
  { key: 'ruang', label: tcf('pengguna.ruang'), type: 'text' as const, width: '70px', sortable: true, class: 'hidden tabular-nums text-right md:table-cell', headerClass: 'hidden md:table-cell' },
  { key: 'tx', label: tcf('pengguna.tx'), type: 'text' as const, width: '90px', sortable: true, class: 'tabular-nums text-right' },
  {
    key: 'status', label: tcf('pengguna.status'), type: 'status' as const, width: '110px',
    options: [tcf('pengguna.aktif'), tcf('pengguna.ditangguhkan')].map((v: string) => ({ label: v, value: v })),
    class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell',
  },
])

const ATURAN: Record<KunciUrut, AturanUrut<Baris>> = {
  email: { jenis: 'teks', nilai: b => b.email },
  daftar: { jenis: 'waktu', nilai: b => b.p.daftarIso },
  aktif: { jenis: 'waktu', nilai: b => b.p.aktivitasTerakhirIso },
  ruang: { jenis: 'angka', nilai: b => b.ruang },
  tx: { jenis: 'angka', nilai: b => b.tx },
}

// saring (cari + segmen + kolom) → urut atas nilai mentah → potong per halaman
const tersaring = computed(() => {
  const k = cari.value.trim().toLowerCase()
  const lolos = semua.value.filter((p) => {
    if (k && !`${p.emailPenuh ?? ''} ${p.emailTersamar}`.toLowerCase().includes(k)) return false
    if (q.value.seg === 'belum') return p.tx === 0
    if (q.value.seg === 'ditangguhkan') return p.status === 'ditangguhkan'
    // "Mencatat 7 hari" = pernah mencatat DAN masih aktif dalam 7 hari terakhir.
    if (q.value.seg === 'catat7') return p.tx > 0 && p.hariSejakAktif <= 7
    return true
  })
  return saringKolom(lolos.map(keBaris), filterKolom.value, kolom.value)
})
const terurut = computed(() => urutkan(tersaring.value, ATURAN[q.value.urut], q.value.arah, b => b.id))
/* ?hal dibaca SETELAH data dimuat: sebelum itu daftar kosong, dan hal=2 akan
   dijepit ke 1 lalu tertulis balik ke URL — posisi hilang saat refresh. */
const hal = computed(() => (memuat.value ? q.value.hal : halamanAman(q.value.hal, terurut.value.length, PER)))
const jumlahHal = computed(() => jumlahHalaman(terurut.value.length, PER))
const barisHalaman = computed(() => potongHalaman(terurut.value, hal.value, PER))

// Halaman kembali ke 1 hanya saat saringan (atau urutan) berubah, tidak saat data dimuat.
const keHalamanSatu = () => { if (q.value.hal !== 1) setel({ hal: 1 }) }
watch(cari, keHalamanSatu)
watch(filterKolom, keHalamanSatu, { deep: true })
const pilihSegmen = (s: typeof SEGMEN[number]) => setel({ seg: s, hal: 1 })
const urutKolom = (key: string) => {
  const k = URUT.find(u => u === key)
  if (!k) return
  const arah = q.value.urut === k ? (q.value.arah === 'asc' ? 'desc' : 'asc') : (k === 'email' ? 'asc' : 'desc')
  setel({ urut: k, arah, hal: 1 })
}

const segmenOpsi = computed(() => [
  { kunci: 'semua' as const, label: tcf('umum.semua') },
  { kunci: 'catat7' as const, label: tcf('pengguna.catat7') },
  { kunci: 'belum' as const, label: tcf('pengguna.belumCatat') },
  { kunci: 'ditangguhkan' as const, label: tcf('pengguna.ditangguhkan') },
])
const terpotong = computed(() => total.value > semua.value.length)

useCashflowPintasan([{ kunci: '/', aksi: () => kolomCari.value?.focus() }])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.ket') }}</p>

    <CashflowReasonGate :show="gerbang" :keterangan="tcf('pengguna.alasanDaftarKet')" @close="gerbang = false" @konfirmasi="bukaDenganAlasan" />

    <div class="flex flex-wrap items-center gap-3">
      <input ref="kolomCari" v-model="cari" type="search" class="ca-input w-full sm:w-64" :placeholder="tcf('umum.cari')" />
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="s in segmenOpsi" :key="s.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="q.seg === s.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.seg === s.kunci"
          @click="pilihSegmen(s.kunci)"
        >{{ s.label }}</button>
      </div>
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ terurut.length }} / {{ semua.length }}</span>

      <!-- Email lengkap: alasan diketik, tercatat; menyamarkan lagi tanpa jaringan. -->
      <button
        v-if="terbuka" type="button" class="ca-btn-secondary ml-auto inline-flex items-center gap-2 text-sm"
        @click="samarkan"
      >
        <Icon name="lucide:eye-off" class="h-4 w-4" />{{ tcf('pengguna.samarkanLagi') }}
      </button>
      <button
        v-else type="button" class="ca-btn-secondary ml-auto inline-flex items-center gap-2 text-sm"
        :disabled="memuat" @click="gerbang = true"
      >
        <Icon name="lucide:eye" class="h-4 w-4" />{{ tcf('pengguna.tampilkanEmail') }}
      </button>
    </div>

    <p v-if="terbuka" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-2 text-xs text-[var(--ca-text)]">
      {{ tcf('pengguna.terbukaDengan')(terbuka.alasan, formatJam(new Date(terbuka.sampai))) }}
    </p>

    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>

    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya pengguna. -->
    <div v-if="!pesanGalat || semua.length" ref="wadahDaftar" class="ca-console-dialog scroll-mt-24 overflow-hidden">
      <DataTable
        v-model:filters="filterKolom"
        :columns="kolom" :data="barisHalaman" :loading="memuat"
        :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
        empty-icon="lucide:users" :empty-text="semua.length ? tcf('umum.kosongSaring') : tcf('umum.kosong')"
        @sort="urutKolom"
        @row-click="(row: Baris) => navigateTo(`/console/cashflow/pengguna/${row.id}`)"
      >
        <template #cell-email="{ row }">
          <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline" @click.stop>{{ row.email }}</NuxtLink>
        </template>
      </DataTable>
    </div>

    <CashflowHalaman
      v-if="!memuat && terurut.length"
      :hal="hal" :jumlah-halaman="jumlahHal" :total="terurut.length" :per="PER"
      @ganti="gantiHalaman"
    />

    <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('pengguna.potong')(semua.length, total) }}</p>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.aktifTerakhirKet') }}</p>
  </div>
</template>
