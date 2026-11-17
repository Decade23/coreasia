<script setup lang="ts">
/**
 * Hapus akun — permintaan hapus akun dari aplikasi (migrasi 0114).
 *
 * Saat pengguna menekan Hapus akun di aplikasi, akunnya hanya ditandai
 * menunggu: ia keluar dan tidak bisa masuk lagi, tapi data, ruang, foto
 * struk, dan lampirannya tetap ada. Di sini admin menghapusnya permanen, atau
 * membatalkan permintaannya (akun bisa masuk lagi).
 *
 * - Daftar: admin_hapus_akun_daftar per status (?status=menunggu|selesai|
 *   dibatalkan, replace), beserta jumlah tiap status untuk label saringan.
 *   Yang menunggu diminta sampai jepit atas server (batasDaftarHapus): server
 *   memotong yang terbaru dulu, dan yang tertua justru yang paling mendesak.
 *   Izin view, email tersamar dari server, tanpa audit. Menunggu lebih dari
 *   7 hari ditandai merah, pengingat internal saja.
 * - Hapus permanen: satu konfirmasi (CashflowHapusAkunKonfirmasi), tanpa kolom
 *   alasan. Batalkan: konfirmasi sebaris di kartunya. Keduanya izin
 *   cashflow:tindak (super admin ber-TOTP); tanpa itu tombolnya mati dan
 *   CashflowIzinKurang menjelaskan jalan keluarnya.
 * - P0001 alihkan-kepemilikan (akun masih memiliki ruang bersama beranggota
 *   orang lain) ditulis di kartunya dengan bahasa awam.
 * - P0001 akun-admin (akunnya masih terdaftar sebagai admin console) cukup
 *   jadi toast bahasa awam; daftar tidak dimuat ulang.
 * - RPC-nya belum ada karena console tayang lebih dulu dari 0114 (PGRST202,
 *   atau 42883 yang menyebut RPC itu sendiri): halaman menulis "belum
 *   diaktifkan di server" (CashflowKeadaan belum-aktif), bukan galat. Saringan
 *   status dan catatan data tidak ditampilkan, karena belum ada daftar yang
 *   bisa disaring. Keadaan itu bertahan selama "Periksa lagi" berjalan, supaya
 *   layar tidak berkedip. 42883 fungsi lain di dalamnya tetap galat biasa.
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
  STATUS_HAPUS, batasDaftarHapus, HASIL_BERHASIL, kePermintaanHapus, urutPermintaan, keHasilHapus, jenisGagalHapus, muatUlangSesudahGagal,
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

/** RPC daftar belum ada di server. Bertahan selama muat ulang, sampai server menjawab lain. */
const belumAktif = ref(false)
const muatDaftar = async () => {
  const ok = await muat(async (terbaru) => {
    const rows = await api.hapusAkunDaftar(q.value.status, batasDaftarHapus(q.value.status))
    if (!terbaru()) return
    mentah.value = rows
    jumlah.value = jumlahPerStatus(rows)
  })
  // Panggilan yang sudah digantikan tidak membawa galat: keadaannya dibiarkan.
  if (ok) belumAktif.value = false
  else if (galat.value) belumAktif.value = galat.value.jenis === 'belum-aktif'
}
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
/** Hitungan per status ditulis di pil hanya bila server sudah mengirimnya. */
const opsiStatus = computed(() => STATUS_HAPUS.map(s => ({ nilai: s, label: tcf(`hapusAkun.status.${s}`) as string, jumlah: jumlah.value ? jumlah.value[s] : null })))
const tampilIzin = computed(() => q.value.status === 'menunggu' && daftar.value.length > 0 && !tindakAktif.value)

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
    <ConsolePageHeader :title="tcf('hapusAkun.judul')" kicker="CashFlow" ringkas><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('hapusAkun.ket') }}</p>

    <template v-if="!belumAktif">
      <div class="flex items-start gap-3 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm text-[var(--ca-text)]">
        <Icon name="lucide:shield-check" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{{ tcf('hapusAkun.dataTetap') }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <CashflowSegmen :opsi="opsiStatus" :nilai="q.status" :label="tcf('hapusAkun.saring')" gulir @pilih="(s) => setel({ status: s })" />
      </div>
    </template>

    <CashflowKeadaan
      v-if="belumAktif" jenis="belum-aktif" :judul="tcf('hapusAkun.belumAktifJudul')" :pesan="tcf('hapusAkun.belumAktif')"
      :label-ulang="tcf('hapusAkun.periksaLagi')" :sibuk="memuat" data-uji="hapus-akun-belum-aktif" @ulang="muatDaftar()"
    />
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <CashflowKeadaan
      v-else-if="pesanGalat" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatDaftar()"
    />
    <CashflowKeadaan v-else-if="memuat && !daftar.length" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="3" :kolom="3" />
    <template v-else>
      <CashflowIzinKurang v-if="tampilIzin" :pesan="tcf('hapusAkun.izinTindak')" />
      <CashflowKeadaan v-if="!daftar.length" jenis="kosong" icon="lucide:user-x" :judul="tcf('umum.kosongJudul')" :pesan="tcf(`hapusAkun.kosong.${q.status}`)" />
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
