<script setup lang="ts">
/**
 * Sakelar — konfigurasi jarak jauh (app_config). Setiap perubahan lewat
 * admin_set_config yang beraudit dan meminta alasan.
 *
 * Yang paling penting di sini: `auth.verifikasi_email`. Saat pengiriman kode
 * email bermasalah, admin menggesernya ke "longgar": pendaftar baru
 * dikonfirmasi otomatis oleh Edge Function auth-longgar, dan aplikasi melewati
 * layar kode. Pemulihan sandi TIDAK ikut longgar. Sakelar ini sengaja berwarna
 * peringatan saat longgar — ia keadaan darurat, bukan pilihan.
 *
 * DAFTAR PENGECUALIAN (Fase 0b). Daftar dimuat lewat admin_daftar_config_v2:
 * admin.pengecualian_email tiba TERSAMAR ('ded*** · gmail.com') — email
 * keluarga/rekan pemilik tidak dikirim ke setiap sesi console tanpa alasan.
 * Menyunting = "Buka untuk menyunting" → alasan → admin_config_buka (audit
 * buka_config) memulangkan nilai utuh → sunting draf → Simpan daftar
 * (admin_set_config). Nilai utuh hanya hidup di `draf` selama penyuntingan;
 * Simpan atau Tutup membuangnya. Menyimpan bentuk tersamar ditolak server
 * (22023 nilai-tersamar) — halaman juga memeriksanya lebih dulu.
 * Kunci yang belum ada, atau larik kosong, tidak punya apa pun untuk dibuka:
 * draf kosong dimulai tanpa gerbang dan tanpa audit buka_config.
 *
 * MENIMPA TANPA SADAR. admin_set_config menimpa nilai apa adanya (belum ada
 * pemeriksaan versi di server; Fase 1). Dua penjaga di sini:
 * - versi: updated_at baris dicatat SEBELUM nilai dibuka (null = kunci belum
 *   ada), dan Simpan membaca ulang daftarnya dulu — bila berbeda, admin lain
 *   sudah menyimpan: tidak disimpan, buka lagi;
 * - bentuk: nilai yang bukan larik teks murni (admin-next bisa menulis JSON
 *   apa pun) tidak bisa diwakili draf; Simpan menunggu persetujuan eksplisit.
 *
 * ALASAN. Sakelar OTP dan daftar punya kolom alasannya sendiri-sendiri.
 * Kolom daftar ada di panel sunting, terisi alasan pembukaan (terlihat, bisa
 * diganti) dan dikosongkan saat panel ditutup — sakelar OTP tidak pernah
 * memakai alasan yang ditulis untuk tindakan lain. Gerbang pembukaan memakai
 * preset sakelar.bukaPreset, bukan preset bawaan (keluhan, pembayaran, …):
 * labelnya masuk ke audit buka_config DAN set_config, jadi harus menamai
 * tindakan yang sebenarnya.
 *
 * SIBUK. Setiap aksi di halaman ini menulis audit yang tidak bisa dihapus;
 * selama satu berjalan, semua pemicunya nonaktif dan panggilan ulang diabaikan.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import {
  keConfig, daftarTeks, bacaDaftarEmail, keadaanPengecualian, nilaiMasihTersamar, periksaEmailPengecualian,
  KUNCI_PENGECUALIAN, type ConfigDTO, type NilaiJson,
} from '~/adapters/cashflow'
import { petakanGalat, type GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })

const CATATAN_PENGECUALIAN = 'Email yang dikecualikan dari ukuran keberhasilan.'

const mentah = shallowRef<ConfigDTO[]>([])
const config = computed(() => mentah.value.map(keConfig))
const alasanOtp = ref('')

const muatConfig = () => muat(async () => { mentah.value = await api.daftarConfig() })
onMounted(muatConfig)
/** Baca ulang daftar tanpa keadaan memuat halaman (tabel tetap tampil);
 *  memulangkan baris pengecualian terbaru, atau null bila kuncinya tiada. */
const segarkan = async () => {
  mentah.value = await api.daftarConfig()
  return barisPengecualian.value
}

const nilai = (key: string) => config.value.find(c => c.kunci === key)?.nilai
const otpLonggar = computed(() => nilai('auth.verifikasi_email') === 'longgar')
const barisPengecualian = computed(() => config.value.find(c => c.kunci === KUNCI_PENGECUALIAN) ?? null)
const keadaan = computed(() => keadaanPengecualian(barisPengecualian.value))
/** Bentuk tersamar dari server — hanya untuk dilihat, tidak pernah dikirim balik. */
const pengecualianSamar = computed(() => daftarTeks(barisPengecualian.value?.nilai))

type Sibuk = 'otp' | 'buka' | 'simpan'
const sibuk = ref<Sibuk | null>(null)
/** Satu aksi pada satu waktu; panggilan selagi sibuk diabaikan. */
const jalankan = async (jenis: Sibuk, kerja: () => Promise<unknown>) => {
  if (sibuk.value) return
  sibuk.value = jenis
  try { await kerja() } finally { sibuk.value = null }
}

/** `gagal` menerima galat server, atau null bila ditolak di sini sebelum dikirim. */
const simpan = async (key: string, value: NilaiJson, publik: boolean, note: string, alasanUbah: string, gagal?: (g: GalatAdmin | null) => void) => {
  if (alasanUbah.trim().length < 8) { toast.error(tcf('alasan.pendek')); return false }
  if (nilaiMasihTersamar(key, value)) { toast.error(tcf('galat.nilaiTersamar')); gagal?.(null); return false }
  const ok = await aksi(() => api.setConfig(key, value, publik, note, alasanUbah.trim()), { sukses: `${key}: ${tcf('umum.tersimpan')}`, gagal })
  if (ok) await muatConfig()
  return ok
}

const setOtp = (longgar: boolean) => jalankan('otp', () => simpan(
  'auth.verifikasi_email', longgar ? 'longgar' : 'wajib', true,
  'wajib | longgar. Longgar = pendaftar baru dikonfirmasi otomatis tanpa kode email.',
  alasanOtp.value,
))

// ── Penyuntingan daftar pengecualian ──────────────────────────────────
const gerbangBuka = ref(false)
/** null = tertutup (hanya bentuk tersamar di layar); larik = nilai utuh terbuka. */
const draf = ref<string[] | null>(null)
const aslinya = ref<string[]>([])
/** updated_at baris saat dibuka; null = kunci belum ada. */
const versiDibuka = ref<string | null>(null)
/** Nilai tersimpan bukan larik teks murni — Simpan menggantinya utuh. */
const bentukAsing = ref(false)
const setujuGanti = ref(false)
const alasanDaftar = ref('')
const emailBaru = ref('')
const galatEmail = ref('')
const berubah = computed(() => !!draf.value && (bentukAsing.value || JSON.stringify(draf.value) !== JSON.stringify(aslinya.value)))
const bolehSimpan = computed(() => berubah.value && !sibuk.value && (!bentukAsing.value || setujuGanti.value))

const mulaiSunting = (isi: { daftar: string[]; asing: boolean }, versi: string | null, alasanAwal: string) => {
  aslinya.value = isi.daftar
  draf.value = [...isi.daftar]
  bentukAsing.value = isi.asing
  setujuGanti.value = false
  versiDibuka.value = versi
  alasanDaftar.value = alasanAwal
}
const tutupSunting = () => {
  draf.value = null
  aslinya.value = []
  versiDibuka.value = null
  bentukAsing.value = false
  setujuGanti.value = false
  alasanDaftar.value = ''
  emailBaru.value = ''
  galatEmail.value = ''
}
const kosongAtauTiada = (k: string) => k === 'tiada' || k === 'kosong'

/* Kunci yang belum ada (admin_config_buka menjawab P0002) atau larik kosong
   tidak punya nilai untuk dibuka — draf kosong dimulai tanpa gerbang. Yang
   dimuat bersama halaman bisa basi, jadi "kosong" dipastikan ke server dulu. */
const mintaBuka = () => jalankan('buka', () => aksi(async () => {
  if (!kosongAtauTiada(keadaan.value)) { gerbangBuka.value = true; return }
  const b = await segarkan()
  if (!kosongAtauTiada(keadaanPengecualian(b))) { gerbangBuka.value = true; return }
  mulaiSunting({ daftar: [], asing: false }, b?.diperbaruiIso ?? null, '')
}))

const bukaUntukSunting = (a: string) => {
  gerbangBuka.value = false
  return jalankan('buka', () => aksi(async () => {
    // Versi dicatat SEBELUM nilai dibuka: simpanan orang lain sesudah titik ini
    // membuat Simpan menolak, bukan menimpa diam-diam.
    const b = await segarkan()
    if (!b) { toast.error(tcf('sakelar.kunciHilang')); return }
    if (keadaanPengecualian(b) === 'kosong') { mulaiSunting({ daftar: [], asing: false }, b.diperbaruiIso, a); return }
    let utuh: NilaiJson
    try {
      utuh = await api.bukaConfig(KUNCI_PENGECUALIAN, a)
    } catch (e) {
      // P0002: dihapus di antara baca ulang dan buka. Chip lama jangan dibiarkan.
      if (petakanGalat(e).jenis !== 'tidak-ada') throw e
      toast.error(tcf('sakelar.kunciHilang'))
      await segarkan()
      return
    }
    mulaiSunting(bacaDaftarEmail(utuh), b.diperbaruiIso, a)
  }))
}

const tambahPengecualian = () => {
  if (!draf.value || sibuk.value) return
  const galat = periksaEmailPengecualian(emailBaru.value, draf.value)
  if (galat) { galatEmail.value = tcf(`sakelar.emailGalat.${galat}`); return }
  draf.value = [...draf.value, emailBaru.value.trim().toLowerCase()]
  emailBaru.value = ''
  galatEmail.value = ''
}
const hapusPengecualian = (e: string) => {
  if (draf.value && !sibuk.value) draf.value = draf.value.filter(x => x !== e)
}

const simpanDaftar = () => jalankan('simpan', async () => {
  if (!draf.value) return
  if (!berubah.value) { toast.error(tcf('sakelar.belumBerubah')); return }
  if (bentukAsing.value && !setujuGanti.value) return
  if (alasanDaftar.value.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  let berbeda = false
  const terbaca = await aksi(async () => {
    const b = await segarkan()
    berbeda = (b?.diperbaruiIso ?? null) !== versiDibuka.value
  })
  if (!terbaca || !draf.value) return // draf null = halaman ditinggalkan selagi membaca
  if (berbeda) { toast.error(tcf('sakelar.berubahDiServer')); tutupSunting(); return }
  // Server menolak nilai tersamar: yang di tangan bukan nilai asli, buka ulang.
  const ok = await simpan(KUNCI_PENGECUALIAN, [...draf.value], false, CATATAN_PENGECUALIAN, alasanDaftar.value, (g) => {
    if (!g || g.hint === 'nilai-tersamar') tutupSunting()
  })
  if (ok) tutupSunting()
})
onBeforeUnmount(tutupSunting)
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('sakelar.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.ket') }}</p>

    <CashflowReasonGate
      :show="gerbangBuka" :keterangan="tcf('sakelar.bukaKet')" :preset="tcf('sakelar.bukaPreset')"
      @close="gerbangBuka = false" @konfirmasi="bukaUntukSunting"
    />

    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <template v-else-if="!pesanGalat">
      <!-- Sakelar verifikasi email -->
      <section class="ca-console-dialog p-5" :class="otpLonggar ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)]' : ''">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-xl">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.otpJudul') }}</h2>
            <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.otpKet') }}</p>
            <p class="mt-2 text-sm font-semibold" :class="otpLonggar ? 'ca-tone-gold' : 'ca-tone-emerald'">
              {{ otpLonggar ? tcf('sakelar.otpAktif') : tcf('sakelar.otpNormal') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Icon v-if="sibuk === 'otp'" name="lucide:loader-2" class="h-4 w-4 animate-spin text-[var(--ca-muted)]" :aria-label="tcf('sakelar.menyimpan')" />
            <div class="flex rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
              <button type="button" class="rounded-full px-4 py-1.5 transition disabled:opacity-60" :disabled="!!sibuk" :class="!otpLonggar ? 'bg-[var(--ca-emerald-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'" @click="setOtp(false)">{{ tcf('sakelar.otpWajib') }}</button>
              <button type="button" class="rounded-full px-4 py-1.5 transition disabled:opacity-60" :disabled="!!sibuk" :class="otpLonggar ? 'bg-[var(--ca-gold-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'" @click="setOtp(true)">{{ tcf('sakelar.otpLonggar') }}</button>
            </div>
          </div>
        </div>
        <label class="mt-4 block max-w-xl">
          <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('sakelar.alasanUbah') }}</span>
          <input v-model="alasanOtp" type="text" class="ca-input mt-1 w-full" :placeholder="tcf('alasan.lengkapi')" />
        </label>
      </section>

      <!-- Pengecualian ukuran keberhasilan -->
      <section class="ca-console-dialog p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="max-w-xl">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.pengecualian') }}</h2>
            <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.pengecualianKet') }}</p>
          </div>
          <button v-if="!draf" type="button" class="ca-btn-secondary inline-flex items-center gap-2 text-sm" :disabled="!!sibuk" @click="mintaBuka">
            <template v-if="sibuk === 'buka'"><Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />{{ tcf('sakelar.membuka') }}</template>
            <template v-else-if="kosongAtauTiada(keadaan)"><Icon name="lucide:plus" class="h-4 w-4" />{{ tcf('sakelar.tambahEmail') }}</template>
            <template v-else><Icon name="lucide:lock-open" class="h-4 w-4" />{{ tcf('sakelar.bukaSunting') }}</template>
          </button>
        </div>

        <!-- Tertutup: bentuk tersamar dari server, tanpa tombol hapus. -->
        <template v-if="!draf">
          <p class="mt-3 text-xs text-[var(--ca-subtle)]">
            {{ keadaan === 'isi' ? tcf('sakelar.pengecualianTersamar')(pengecualianSamar.length)
              : keadaan === 'lain' ? tcf('sakelar.pengecualianBentukLain') : tcf('sakelar.pengecualianKosong') }}
          </p>
          <ul v-if="pengecualianSamar.length" class="mt-2 flex flex-wrap gap-2">
            <li v-for="(e, i) in pengecualianSamar" :key="i" class="rounded-full border border-[color:var(--ca-border)] px-3 py-1 font-mono text-xs text-[var(--ca-muted)]">{{ e }}</li>
          </ul>
        </template>

        <!-- Terbuka: nilai utuh, disunting di draf; baru tersimpan lewat Simpan daftar. -->
        <template v-else>
          <p class="mt-3 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-2 text-xs text-[var(--ca-text)]">{{ tcf('sakelar.terbukaKet') }}</p>
          <div v-if="bentukAsing" class="mt-3 rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-2 text-xs text-[var(--ca-text)]">
            <p>{{ tcf('sakelar.bentukAsing') }}</p>
            <label class="mt-2 inline-flex items-center gap-2 font-semibold">
              <input v-model="setujuGanti" type="checkbox" :disabled="!!sibuk" />{{ tcf('sakelar.bentukAsingSetuju') }}
            </label>
          </div>
          <p v-if="!draf.length" class="mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('sakelar.pengecualianKosong') }}</p>
          <ul v-else class="mt-3 flex flex-wrap gap-2">
            <li v-for="e in draf" :key="e" class="inline-flex items-center gap-2 rounded-full border border-[color:var(--ca-border)] px-3 py-1 font-mono text-xs text-[var(--ca-text)]">
              {{ e }} <button type="button" class="text-[var(--ca-subtle)] hover:text-[var(--ca-danger-text)] disabled:opacity-60" :disabled="!!sibuk" :aria-label="tcf('sakelar.hapusEmail')(e)" @click="hapusPengecualian(e)">×</button>
            </li>
          </ul>
          <!-- novalidate + type="text": validasi bawaan peramban menahan submit
               (balonnya berbahasa peramban) sebelum periksaEmailPengecualian
               sempat menilai. Satu-satunya penilai adalah fungsi itu. -->
          <form class="mt-3 flex flex-wrap gap-2" novalidate @submit.prevent="tambahPengecualian">
            <input v-model="emailBaru" type="text" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false" class="ca-input w-full sm:w-72" placeholder="nama@email.com" :disabled="!!sibuk" :aria-label="tcf('sakelar.tambahEmail')" :aria-invalid="galatEmail ? 'true' : undefined" :aria-describedby="galatEmail ? 'cf-email-galat' : undefined" @input="galatEmail = ''" />
            <button type="submit" class="ca-btn-secondary" :disabled="!!sibuk">{{ tcf('sakelar.tambahEmail') }}</button>
          </form>
          <p v-if="galatEmail" id="cf-email-galat" class="mt-2 text-xs ca-tone-danger" role="alert">{{ galatEmail }}</p>
          <label class="mt-4 block max-w-xl">
            <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('sakelar.alasanDaftar') }}</span>
            <input v-model="alasanDaftar" type="text" class="ca-input mt-1 w-full" :disabled="!!sibuk" :placeholder="tcf('alasan.lengkapi')" aria-describedby="cf-alasan-daftar-ket" />
            <span id="cf-alasan-daftar-ket" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('sakelar.alasanDaftarKet') }}</span>
          </label>
          <div class="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" class="ca-btn-secondary" :disabled="!!sibuk" @click="tutupSunting">{{ tcf('sakelar.tutupSunting') }}</button>
            <button type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bolehSimpan" @click="simpanDaftar">
              <template v-if="sibuk === 'simpan'"><Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />{{ tcf('sakelar.menyimpan') }}</template>
              <template v-else>{{ tcf('sakelar.simpanDaftar') }}</template>
            </button>
          </div>
        </template>
      </section>

      <!-- Semua kunci -->
      <section class="ca-console-dialog overflow-x-auto p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.semua') }}</h2>
        <CashflowKeadaanKosong v-if="!config.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:toggle-right" />
        <table v-else class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('sakelar.kunci') }}</th><th class="py-2 px-3">{{ tcf('sakelar.nilai') }}</th><th class="py-2 px-3">{{ tcf('sakelar.publik') }}</th><th class="py-2 px-3">{{ tcf('sakelar.catatan') }}</th><th class="py-2 pl-3">{{ tcf('sakelar.diperbarui') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in config" :key="c.kunci" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-1.5 pr-3 font-mono text-xs">{{ c.kunci }}</td>
              <td class="py-1.5 px-3 font-mono text-xs">
                {{ JSON.stringify(c.nilai) }}
                <span v-if="c.tersamar" class="ca-pill-muted ml-1 font-sans">{{ tcf('sakelar.tersamar') }}</span>
              </td>
              <td class="py-1.5 px-3">{{ c.publik ? tcf('umum.ya') : tcf('umum.tidak') }}</td>
              <td class="py-1.5 px-3 text-xs text-[var(--ca-muted)]">{{ c.catatan || '—' }}</td>
              <td class="py-1.5 pl-3 text-xs text-[var(--ca-subtle)] whitespace-nowrap">{{ formatTanggal(c.diperbaruiIso) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
