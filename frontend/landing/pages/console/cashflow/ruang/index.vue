<script setup lang="ts">
/**
 * Daftar ruang.
 *
 * Berkas ini index.vue di dalam folder ruang/, bukan ruang.vue: begitu
 * ruang/[id].vue ada (Fase 2), ruang.vue yang hidup berdampingan dengan
 * folder ruang/ otomatis menjadi INDUK rute, dan tanpa <NuxtPage/> halaman
 * detail dirender kosong.
 *
 * admin_daftar_ruang_v3 (migrasi CashFlow 20261119100000, spek console
 * laporan 19 Nov 2026 K1): diurutkan per kolom dan dipotong per halaman di
 * server. Sesi ber-pii dengan Kontak lengkap menyala mengirim alasan tetap
 * (ALASAN_DAFTAR_RUANG): nama ruang, email, dan nama pemilik tampil utuh,
 * pencarian ikut mencocokkan nilai aslinya, dan setiap halaman tercatat
 * daftar_ruang_terbuka di audit. Tanpa pii, atau Kontak lengkap dimatikan,
 * isinya tersamar persis seperti v2. Sakelarnya sama dengan daftar Pengguna
 * (state cf_kontak_disamarkan_oleh).
 *
 * Server lama tanpa v3 (PGRST202): daftar v2 seperti sebelumnya, 500 ruang
 * terbaru tanpa urut kolom dan tanpa halaman.
 *
 * Baris tabel dan kartu ponsel membuka Ruang 360 (SM-02).
 *
 * Anggota, transaksi, dan undangan aktif dikirim server HANYA ke sesi ber-pii
 * (M/0089 §15 (d)); selain itu null → tabel menulis "—" (butuh TOTP), bukan 0.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { angka, keRuang, JENIS_RUANG, type RuangDTO, type JenisRuang } from '~/adapters/cashflow'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
import { ALASAN_DAFTAR_RUANG, PER_RUANG, URUT_RUANG, URUT_RUANG_PRIBADI, gantiUrutRuang } from '~/adapters/cashflowSamaran'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { user } = useAdminAuth()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })

const MAKS = 500
const JENIS = ['semua', ...JENIS_RUANG] as const
const SKEMA = {
  jenis: { jenis: 'pilihan', opsi: JENIS, bawaan: 'semua' },
  urut: { jenis: 'pilihan', opsi: URUT_RUANG, bawaan: 'dibuat' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const mentah = shallowRef<RuangDTO[]>([])
const total = ref(0)
const terbuka = ref(false)
const halamanHasil = ref(q.value.hal)
const cari = useState('cf_cari_ruang', () => '')
/* null = belum tahu, false = server tanpa v3. Lengket selama sesi. */
const serverV3 = useState<boolean | null>('cf_server_ruang_v3', () => null)
const adaV3 = computed(() => serverV3.value === true)
const izinPribadi = computed(() => sesi.boleh('cashflow:pii'))
/* Sakelar Kontak lengkap yang sama dengan daftar Pengguna. */
const kontakDisamarkanOleh = useState<string | null>('cf_kontak_disamarkan_oleh', () => null)
const samarkan = computed(() => !!user.value?.id && kontakDisamarkanOleh.value === user.value.id)
const perluVerifikasi = ref(false)

/* Urut berhitungan tanpa pii kembali ke bawaan (tautan lama atau izin hilang). */
const urutAman = async (): Promise<boolean> => {
  if (izinPribadi.value || !URUT_RUANG_PRIBADI.includes(q.value.urut)) return false
  await setel({ urut: 'dibuat', arah: 'desc', hal: 1 })
  return true
}

/* Jawaban yang datang TERLAMBAT (ketikan sebelumnya) tidak boleh menimpa
   jawaban ketikan terbaru. muat() sendiri menahan memuat/galat permintaan
   basi; `terbaru()` menahan datanya. */
const muatRuang = () => muat(async (terbaru) => {
  const jenis: JenisRuang | null = q.value.jenis === 'semua' ? null : q.value.jenis
  const v3 = (alasan: string | null) => api.daftarRuangV3({
    limit: PER_RUANG, offset: (q.value.hal - 1) * PER_RUANG, cari: cari.value, jenis,
    urut: q.value.urut, arah: q.value.arah, alasan,
  })
  if (serverV3.value !== false) {
    const alasan = izinPribadi.value && !samarkan.value ? ALASAN_DAFTAR_RUANG : null
    let d = null
    try {
      d = await v3(alasan)
    } catch (e) {
      if (!(e instanceof GalatAdmin)) throw e
      if (e.jenis === 'izin' && alasan) {
        // Server menurunkan sesi selagi tab terbuka: daftar tersamar, bukan galat.
        perluVerifikasi.value = true
        d = await v3(null)
      } else if (e.jenis !== 'belum-aktif') throw e
    }
    if (!terbaru()) return
    if (d) {
      serverV3.value = true
      const t = Number(d.total) || 0
      const aman = halamanAman(q.value.hal, t, PER_RUANG)
      if (aman !== q.value.hal) { await setel({ hal: aman }); return }
      mentah.value = d.baris ?? []
      total.value = t
      terbuka.value = d.terbuka === true
      halamanHasil.value = q.value.hal
      return
    }
    serverV3.value = false
  }
  const rows = await api.daftarRuang(MAKS, 0, cari.value, jenis)
  if (!terbaru()) return
  mentah.value = rows
  total.value = rows.length ? Number(rows[0]?.total_semua ?? rows.length) : 0
  terbuka.value = false
  halamanHasil.value = 1
})
let aktif = false
onMounted(async () => {
  await urutAman()
  aktif = true
  void muatRuang()
})
watch([() => q.value.jenis, () => q.value.urut, () => q.value.arah, () => q.value.hal], () => { if (aktif) void muatRuang() })
let jeda: ReturnType<typeof setTimeout> | undefined
watch(cari, () => {
  clearTimeout(jeda)
  jeda = setTimeout(async () => {
    if (q.value.hal !== 1) await setel({ hal: 1 })
    else void muatRuang()
  }, 400)
})
watch(izinPribadi, async () => { if (aktif && !(await urutAman())) void muatRuang() })
onBeforeUnmount(() => { clearTimeout(jeda); batal() })
watch(galat, (g) => {
  if (!g || !['izin', 'sesi', 'totp', 'bukan-admin'].includes(g.jenis)) return
  mentah.value = []
  total.value = 0
  terbuka.value = false
})

const gantiKontak = () => {
  const pelaku = user.value?.id
  if (!pelaku || !izinPribadi.value) { perluVerifikasi.value = true; return }
  kontakDisamarkanOleh.value = samarkan.value ? null : pelaku
  // Menyamarkan tidak menunggu jaringan: bentuk utuh dibuang dari layar lebih dulu.
  if (samarkan.value) { mentah.value = []; terbuka.value = false }
  void muatRuang()
}

const jenisOpsi = computed(() => JENIS.map(j => ({ nilai: j, label: (j === 'semua' ? tcf('umum.semua') : tcf(`ruang.jenisOpsi.${j}`)) as string })))
/* Kepala kolom mengurutkan di server (v3). Hitungan butuh pii. Server lama: tidak ada urut kolom. */
const bolehUrut = (k: string) => adaV3.value && (izinPribadi.value || !(URUT_RUANG_PRIBADI as readonly string[]).includes(k))
const columns = computed(() => [
  { key: 'nama', label: tcf('ruang.nama'), type: 'text' as const, class: 'cf-kuat break-words', sortable: bolehUrut('nama'), filterable: false },
  { key: 'pemilik', label: tcf('ruang.pemilik'), type: 'text' as const, class: 'text-[var(--ca-muted)]', sortable: bolehUrut('pemilik'), filterable: false },
  { key: 'jenis', label: tcf('ruang.jenis'), type: 'text' as const, width: '110px', class: 'hidden text-[var(--ca-muted)] sm:table-cell', headerClass: 'hidden sm:table-cell', sortable: bolehUrut('jenis'), filterable: false },
  { key: 'anggota', label: tcf('ruang.anggota'), type: 'text' as const, width: '110px', class: 'cf-ka', headerClass: 'cf-ka', sortable: bolehUrut('anggota'), filterable: false },
  { key: 'tx', label: tcf('ruang.tx'), type: 'text' as const, width: '130px', class: 'cf-ka', headerClass: 'cf-ka', sortable: bolehUrut('tx'), filterable: false },
  { key: 'undangan', label: tcf('ruang.undangan'), type: 'text' as const, width: '150px', class: 'cf-ka hidden md:table-cell', headerClass: 'cf-ka hidden md:table-cell', sortable: bolehUrut('undangan'), filterable: false },
  { key: 'dibuat', label: tcf('ruang.dibuat'), type: 'text' as const, width: '130px', class: 'whitespace-nowrap text-[var(--ca-muted)]', sortable: bolehUrut('dibuat'), filterable: false },
])
/* Kunci kolom = nilai p_urut, kecuali nama tabel 'pemilik' yang sama. */
const urutKolom = (key: string) => {
  const baru = gantiUrutRuang(q.value, key, { tanpaHitungan: !izinPribadi.value })
  if (baru && adaV3.value) void setel(baru)
}
const data = computed(() => mentah.value.map(d => keRuang(d, { terbuka: terbuka.value })).map(r => ({
  id: r.id, nama: r.nama, pemilik: r.pemilik, pemilikNama: r.pemilikNama, pemilikId: r.pemilikId,
  jenis: r.jenis ? tcf(`ruang.jenisOpsi.${r.jenis}`) : '—',
  anggota: r.anggota, tx: r.tx, undangan: r.undangan, dibuat: formatTanggal(r.dibuatIso),
})))
const keRuang360 = (id: string) => `/console/cashflow/ruang/${id}`
const terpotong = computed(() => !adaV3.value && total.value > mentah.value.length)
const tersaring = computed(() => !!cari.value.trim() || q.value.jenis !== 'semua')
const lepasSaringan = () => { cari.value = ''; void setel({ jenis: 'semua', hal: 1 }) }
/** Server menahan hitungan per ruang (sesi tanpa pii). */
const tanpaHitungan = computed(() => data.value.length > 0 && data.value.every(r => r.anggota === null && r.tx === null))
const hal = computed(() => halamanHasil.value)
const jumlahHal = computed(() => jumlahHalaman(total.value, PER_RUANG))
const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ruang.judul')" kicker="CashFlow" ringkas>
      <template #meta><CashflowNav /></template>
      <template v-if="adaV3" #actions>
        <CashflowSakelarKontak :terbuka="terbuka" :mati="memuat && !terbuka" :label="tcf('pengguna.kontakPenuh')" @ganti="gantiKontak" />
      </template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]" data-uji="ruang-ket">{{ terbuka ? tcf('ruang.ketTerbuka') : tcf('ruang.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="cari" type="search" maxlength="200" class="ca-input w-full sm:w-80"
        :placeholder="terbuka ? tcf('ruang.cariTerbuka') : tcf('ruang.cari')" :aria-label="terbuka ? tcf('ruang.cariTerbuka') : tcf('ruang.cari')"
        aria-describedby="cf-ruang-cari-ket"
      />
      <CashflowSegmen :opsi="jenisOpsi" :nilai="q.jenis" :label="tcf('ruang.jenis')" gulir @pilih="(j) => setel({ jenis: j, hal: 1 })" />
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ mentah.length }} / {{ total }}</span>
    </div>
    <p id="cf-ruang-cari-ket" class="-mt-3 text-xs text-[var(--ca-subtle)]">{{ terbuka ? tcf('ruang.cariKetTerbuka') : tcf('ruang.cariKet') }}</p>

    <CashflowIzinKurang v-if="perluVerifikasi" baca :pesan="tcf('pengguna.kontakButuhTotp')" />
    <p v-if="pesanGalat && mentah.length" class="rounded-xl bg-[var(--ca-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>
    <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(mentah.length, total) }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>
    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya ruang. -->
    <CashflowKeadaan
      v-if="pesanGalat && !mentah.length" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatRuang()"
    />
    <div ref="wadahDaftar" class="min-w-0 scroll-mt-24 space-y-6">
      <!-- Ponsel: satu kartu per ruang, isinya sama dengan baris tabel. Seluruh kartu membuka Ruang 360. -->
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
          <li v-for="r in data" :key="r.id" class="ca-console-dialog relative min-w-0 p-4">
            <div class="flex min-w-0 items-start justify-between gap-2">
              <NuxtLink :to="keRuang360(r.id)" class="cf-kuat min-w-0 break-words text-[0.9375rem] after:absolute after:inset-0 after:rounded-[inherit]" data-uji="ruang-kartu-buka">{{ r.nama }}</NuxtLink>
              <span v-if="r.jenis !== '—'" class="cf-lencana shrink-0">{{ r.jenis }}</span>
            </div>
            <p class="mt-1 break-all text-[0.8125rem] text-[var(--ca-muted)]">{{ tcf('ruang.pemilik') }} {{ r.pemilik }}<template v-if="r.pemilikNama"> · {{ r.pemilikNama }}</template></p>
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
        <DataTable
          :columns="columns" :data="data" :loading="memuat" :show-count="false"
          :sort="adaV3 ? { key: q.urut, arah: q.arah } : undefined"
          @sort="urutKolom" @row-click="(row: { id: string }) => navigateTo(keRuang360(row.id))"
        >
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
          <!-- Nama: tautan ke Ruang 360 (baris juga bisa diklik di mana saja). -->
          <template #cell-nama="{ row }">
            <NuxtLink :to="keRuang360(row.id)" class="underline-offset-2 hover:underline" data-uji="ruang-buka" @click.stop>{{ row.nama }}</NuxtLink>
          </template>
          <template #cell-pemilik="{ row }">
            <NuxtLink v-if="row.pemilikId" :to="`/console/cashflow/pengguna/${row.pemilikId}`" class="break-all underline-offset-2 hover:underline" data-uji="ruang-pemilik" @click.stop>{{ row.pemilik }}</NuxtLink>
            <span v-else class="break-all" data-uji="ruang-pemilik">{{ row.pemilik }}</span>
            <span v-if="row.pemilikNama" class="cf-dua break-words">{{ row.pemilikNama }}</span>
          </template>
          <template v-for="k in (['anggota', 'tx', 'undangan'] as const)" :key="k" #[`cell-${k}`]="{ value }">
            <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
            <template v-else>{{ angka(value) }}</template>
          </template>
        </DataTable>
      </div>
    </div>
    <CashflowHalaman
      v-if="adaV3 && total" :hal="hal" :jumlah-halaman="jumlahHal" :total="total" :per="PER_RUANG" :memuat="memuat || !!galat" lompat
      @ganti="gantiHalaman"
    />
  </div>
</template>
