<script setup lang="ts">
/**
 * Hapus akun — permintaan hapus akun dari aplikasi (migrasi 0112).
 *
 * Saat pengguna menekan Hapus akun di aplikasi, akunnya hanya ditandai
 * menunggu: ia keluar dan tidak bisa masuk lagi, tapi data, ruang, foto
 * struk, dan lampirannya tetap ada. Di sini admin menghapusnya permanen, atau
 * membatalkan permintaannya (akun bisa masuk lagi).
 *
 * - Daftar: admin_hapus_akun_daftar per status (?status=menunggu|selesai|
 *   dibatalkan, replace), beserta jumlah tiap status untuk label saringan.
 *   Izin view, email tersamar dari server, tanpa audit. Menunggu lebih dari
 *   7 hari ditandai merah, pengingat internal saja.
 * - Hapus permanen: satu konfirmasi (CashflowHapusAkunKonfirmasi), tanpa kolom
 *   alasan. Batalkan: konfirmasi sebaris di kartunya. Keduanya izin
 *   cashflow:tindak (super admin ber-TOTP); tanpa itu tombolnya mati dan
 *   CashflowIzinKurang menjelaskan jalan keluarnya.
 * - P0001 alihkan-kepemilikan (akun masih memiliki ruang bersama beranggota
 *   orang lain) ditulis di kartunya dengan bahasa awam.
 * - RPC-nya belum ada karena console tayang lebih dulu dari 0112 (PGRST202,
 *   atau 42883 yang menyebut RPC itu sendiri): halaman menulis "fitur belum
 *   aktif", bukan galat. 42883 fungsi lain di dalamnya tetap galat biasa.
 *
 * SIBUK. Setiap aksi menulis audit yang tidak bisa dihapus; selama satu
 * berjalan, semua tombol menunggu dan panggilan ulang diabaikan. Jawaban
 * "sudah selesai" atau "sudah dibatalkan" (admin lain, tab lain, atau
 * tekanan ulang sesudah jawaban pertama hilang) tidak mengubah apa pun di
 * server dan hanya memuat ulang daftar. Aksi yang gagal tanpa kepastian
 * (muatUlangSesudahGagal) juga memuat ulang daftar: server bisa saja sudah
 * selesai sebelum jawabannya hilang.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import {
  STATUS_HAPUS, BATAS_DAFTAR_HAPUS, HASIL_BERHASIL, kePermintaanHapus, urutPermintaan, keHasilHapus, jenisGagalHapus, muatUlangSesudahGagal,
  barisHapus, jumlahPerStatus,
  type HapusAkunDaftarDTO, type HasilHapus, type PermintaanHapus,
} from '~/adapters/cashflowHapusAkun'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const toast = useToast()
const { memuat, galat, pesanGalat, muat, aksi, batal } = useCashflowMuat({ awal: true })

const SKEMA = {
  status: { jenis: 'pilihan', opsi: STATUS_HAPUS, bawaan: 'menunggu' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const mentah = shallowRef<HapusAkunDaftarDTO | null>(null)
const daftar = computed<PermintaanHapus[]>(() => urutPermintaan(barisHapus(mentah.value).map(d => kePermintaanHapus(d)), q.value.status))
/* Jumlah tiap status tetap dari jawaban terakhir selama saringan berganti. */
const jumlah = shallowRef<ReturnType<typeof jumlahPerStatus>>(null)
const totalStatus = computed(() => jumlah.value?.[q.value.status] ?? 0)

/** Id permintaan yang baru ditolak hapus permanen (P0001 alihkan-kepemilikan). */
const tertahan = ref<ReadonlySet<string>>(new Set())

const muatDaftar = () => muat(async (terbaru) => {
  const rows = await api.hapusAkunDaftar(q.value.status, BATAS_DAFTAR_HAPUS)
  if (!terbaru()) return
  mentah.value = rows
  jumlah.value = jumlahPerStatus(rows)
})
/* Ganti saringan: baris status lama dibuang dulu, jangan tampil di bawah judul status baru. */
watch(() => q.value.status, () => {
  mentah.value = null
  tertahan.value = new Set()
  muatDaftar()
})
onMounted(muatDaftar)
onBeforeUnmount(batal)

/** Petunjuk tampilan; penegaknya server (42501 izin-kurang). */
const bolehTindak = computed(() => sesi.boleh('cashflow:tindak'))
/** Server menolak aksi karena izin, walau petunjuknya bilang boleh (sesi basi). */
const izinDitolak = ref(false)
const tindakAktif = computed(() => bolehTindak.value && !izinDitolak.value)
const tampilIzin = computed(() => q.value.status === 'menunggu' && daftar.value.length > 0 && !tindakAktif.value)
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')

const sibuk = ref<{ id: string; jenis: 'hapus' | 'batal' } | null>(null)
const dikonfirmasi = ref<PermintaanHapus | null>(null)

/** `sesudahJawab`: dipanggil begitu server menjawab (berhasil atau gagal), sebelum daftar dimuat ulang. */
const jalankan = async (p: PermintaanHapus, jenis: 'hapus' | 'batal', sesudahJawab?: () => void): Promise<void> => {
  if (sibuk.value) return
  sibuk.value = { id: p.id, jenis }
  try {
    const jawab: { hasil: HasilHapus | 'lain' } = { hasil: 'lain' }
    let muatUlang = false
    const ok = await aksi(async () => {
      jawab.hasil = keHasilHapus(jenis === 'hapus' ? await api.hapusAkunPermanen(p.id) : await api.hapusAkunBatalkan(p.id))
    }, {
      gagal: (g) => {
        const j = jenisGagalHapus(g)
        if (j === 'izin') izinDitolak.value = true
        if (j === 'tertahan') tertahan.value = new Set([...tertahan.value, p.id])
        if (muatUlangSesudahGagal(g)) muatUlang = true
      },
    })
    sesudahJawab?.()
    if (!ok) {
      if (muatUlang) await muatDaftar()
      return
    }
    const kalimat = tcf(`hapusAkun.hasil.${jawab.hasil}`) as string
    if (jawab.hasil !== 'lain' && HASIL_BERHASIL.includes(jawab.hasil)) toast.success(kalimat)
    else toast.info(kalimat)
    await muatDaftar()
  } finally {
    sibuk.value = null
  }
}

const mintaHapus = (p: PermintaanHapus) => { if (!sibuk.value) dikonfirmasi.value = p }
const setujuHapus = async () => {
  const p = dikonfirmasi.value
  if (!p) return
  await jalankan(p, 'hapus', () => { dikonfirmasi.value = null })
}
const batalkan = (p: PermintaanHapus) => jalankan(p, 'batal')

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.hapusAkun') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('hapusAkun.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('hapusAkun.ket') }}</p>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm" role="group" :aria-label="tcf('hapusAkun.saring')">
        <button
          v-for="s in STATUS_HAPUS" :key="s" type="button" class="rounded-full px-3 py-1 transition"
          :class="q.status === s ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.status === s" @click="setel({ status: s })"
        >
          {{ tcf(`hapusAkun.status.${s}`) }} <span v-if="jumlah" class="ml-0.5 tabular-nums text-xs text-[var(--ca-subtle)]">{{ jumlah[s] }}</span>
        </button>
      </div>
    </div>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" />
      <span>{{ tcf('hapusAkun.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !daftar.length" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <CashflowIzinKurang v-if="tampilIzin" :pesan="tcf('hapusAkun.izinTindak')" />
      <CashflowKeadaanKosong v-if="!daftar.length" :pesan="tcf(`hapusAkun.kosong.${q.status}`)" icon="lucide:user-x" />
      <ul v-else class="space-y-3">
        <li v-for="p in daftar" :key="p.id">
          <CashflowHapusAkunKartu
            :permintaan="p" :boleh-tindak="tindakAktif"
            :sibuk="sibuk?.id === p.id ? sibuk.jenis : null" :terkunci="!!sibuk"
            :ditolak-tertahan="tertahan.has(p.id)"
            @hapus="mintaHapus(p)" @batalkan="batalkan(p)"
          />
        </li>
      </ul>
      <p v-if="totalStatus > daftar.length" class="text-xs ca-tone-gold">{{ tcf('hapusAkun.terpotong')(daftar.length, totalStatus) }}</p>
    </template>

    <CashflowHapusAkunKonfirmasi :permintaan="dikonfirmasi" :sibuk="sibuk?.jenis === 'hapus'" @tutup="dikonfirmasi = null" @setuju="setujuHapus" />
  </div>
</template>
