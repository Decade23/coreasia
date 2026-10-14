<script setup lang="ts">
/**
 * Kartu Versi aplikasi di Sakelar (0110): penyunting kunci
 * app_config versi_android (Play), versi_android_uat (UAT), dan
 * versi_android_ias (uji IAS) yang dibaca aplikasi 1.3.2 ke atas.
 *
 * Menulis lewat admin_set_config yang sudah ada (beraudit, alasan, is_public
 * true, catatan per kunci) dan admin_hapus_config. Bentuk isian diperiksa di
 * sini dengan aturan aplikasi persis (adapters/cashflowVersi.ts): versi
 * dikirim sebagai angka JSON, bidang kosong tidak dikirim.
 *
 * PENJAGA TIMPA. updated_at kunci dicatat saat isian dimuat. Simpan dan
 * Hapus membaca ulang daftar config dulu: kalau kunci itu berubah sejak
 * dimuat, tidak ada yang ditulis dan kartu meminta muat ulang.
 *
 * Sebaran versi (admin_versi_aplikasi 30 hari) dimuat terpisah, hanya untuk
 * acuan "tertinggi di HP pengguna" dan jumlah yang tertahan minimum. Kalau
 * gagal, kartu tetap bisa menyimpan dan jumlahnya "belum bisa diketahui".
 */
import type { Config } from '~/adapters/cashflow'
import {
  PILIHAN_KUNCI_VERSI, KUNCI_VERSI, CATATAN_KUNCI_VERSI, RILIS_PLAY_TERAKHIR, ISIAN_KOSONG, VERSI_KOSONG, HARI_BAWAAN,
  pilihanKunci, rilisAcuan, bacaNilaiVersi, isianDariNilai, periksaIsianVersi, nilaiVersiUntukSimpan, samaDenganTersimpan,
  peringatanLembut, minimumBerubah, keSebaranVersi, tertinggiUntuk, namaKode, jumlahDiBawah,
  type KunciVersi, type IsianVersi, type SebaranVersi,
} from '~/adapters/cashflowVersi'

const props = defineProps<{
  config: readonly Config[]
  /** Baca ulang daftar config halaman (tanpa keadaan memuat) dan pulangkan barisnya. */
  segarkan: () => Promise<readonly Config[]>
}>()
const { tcf, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { aksi, muat: muatSebaran, galat: galatSebaran, memuat: memuatSebaran } = useCashflowMuat()

/** Alasan audit otomatis, bahasa Indonesia apa pun bahasa layar (sama dengan ALASAN_UBAH Sakelar). */
const ALASAN_VERSI = 'Setel versi aplikasi dari console CashFlow (Sakelar)'

const kunci = ref<KunciVersi>(KUNCI_VERSI)
const pilihan = computed(() => pilihanKunci(kunci.value))
const opsiKunci = computed(() => PILIHAN_KUNCI_VERSI.map(p => ({ nilai: p.kunci, label: tcf(`versi.kunci.${p.label}`) as string })))
const baris = computed(() => props.config.find(c => c.kunci === kunci.value) ?? null)
const tersimpan = computed(() => bacaNilaiVersi(!!baris.value, baris.value?.nilai))
const versiTersimpan = computed(() => (tersimpan.value.jenis === 'sah' ? tersimpan.value.versi : VERSI_KOSONG))

const sebaran = shallowRef<SebaranVersi | null>(null)
onMounted(() => muatSebaran(async () => { sebaran.value = keSebaranVersi(await api.versiAplikasi(HARI_BAWAAN)) }))

// ── Isian ────────────────────────────────────────────────────────────
const isian = reactive<IsianVersi>({ ...ISIAN_KOSONG })
/** updated_at kunci saat isian dimuat; null = kunci belum ada. */
const versiDimuat = ref<string | null>(null)
/** Kunci berubah di tempat lain sejak dimuat: Simpan dan Hapus ditahan sampai muat ulang. */
const basi = ref(false)
const setujuMinimum = ref(false)
const setujuGanti = ref(false)
const alasan = ref(ALASAN_VERSI)
const yakinHapus = ref(false)

/** Isi ulang dari nilai tersimpan (membuang isian yang belum disimpan). */
const isiUlang = () => {
  Object.assign(isian, isianDariNilai(baris.value?.nilai))
  versiDimuat.value = baris.value?.diperbaruiIso ?? null
  basi.value = false
  setujuMinimum.value = false
  setujuGanti.value = false
  yakinHapus.value = false
  alasan.value = ALASAN_VERSI
}
onMounted(isiUlang)
const pilihKunci = (k: KunciVersi) => {
  if (sibuk.value || k === kunci.value) return
  kunci.value = k
  isiUlang()
}
// Minimum yang diketik ulang sesudah dicentang harus disetujui lagi.
watch(() => isian.minimum, () => { setujuMinimum.value = false })

const periksa = computed(() => periksaIsianVersi(isian))
const nilaiBaru = computed(() => (periksa.value.nilai ? nilaiVersiUntukSimpan(periksa.value.nilai) : null))
const berubah = computed(() => !!nilaiBaru.value && !samaDenganTersimpan(nilaiBaru.value, baris.value?.nilai))
const perluSetujuGanti = computed(() => tersimpan.value.jenis === 'asing'
  || (tersimpan.value.jenis === 'sah' && tersimpan.value.diabaikan.length > 0))
const perluSetujuMinimum = computed(() => minimumBerubah(periksa.value.nilai?.minimum ?? null, versiTersimpan.value))
const alasanCukup = computed(() => alasan.value.trim().length >= 8)

type Sibuk = 'simpan' | 'hapus'
const sibuk = ref<Sibuk | null>(null)
const bolehSimpan = computed(() => !sibuk.value && !basi.value && berubah.value && alasanCukup.value
  && (!perluSetujuGanti.value || setujuGanti.value) && (!perluSetujuMinimum.value || setujuMinimum.value))
const bolehHapus = computed(() => !sibuk.value && !basi.value && !!baris.value && alasanCukup.value)

// ── Acuan dan peringatan ─────────────────────────────────────────────
/** '26101412 (1.3.2)' bila namanya dikenal, selain itu angkanya saja. */
const kodeNama = (kode: number) => {
  const nama = namaKode(kode, sebaran.value)
  return nama ? `${kode} (${nama})` : String(kode)
}
const tertinggiHp = computed(() => tertinggiUntuk(sebaran.value, pilihan.value.tertinggi))
const teksTertinggi = computed(() => {
  const t = tertinggiHp.value
  return t ? (t.versi ? `${t.versi} (${t.kode})` : String(t.kode)) : null
})
const namaTerbaru = computed(() => namaKode(periksa.value.nilai?.terbaru ?? null, sebaran.value))
const namaMinimum = computed(() => namaKode(periksa.value.nilai?.minimum ?? null, sebaran.value))
/** Rilis Play terakhir hanya acuan untuk kunci Play (null di UAT dan IAS). */
const acuanRilis = computed(() => rilisAcuan(kunci.value))
const lembut = computed(() => (periksa.value.nilai
  ? peringatanLembut(periksa.value.nilai, versiTersimpan.value, tertinggiHp.value?.kode ?? null, acuanRilis.value)
  : []))
const teksLembut = (l: (typeof lembut.value)[number]) =>
  l.jenis === 'turun' ? tcf('versi.lembut.turun')(l.lama) : tcf(`versi.lembut.${l.jenis}`)
/** Pengguna aktif build ini yang versinya diketahui dan di bawah minimum baru; null = tidak bisa diketahui. */
const jumlahTertahan = computed<number | null>(() => {
  const m = periksa.value.nilai?.minimum
  const v = pilihan.value.varian
  if (m == null || v == null || !sebaran.value) return null
  return jumlahDiBawah(sebaran.value.baris, v, m)
})
const teksTersimpan = computed(() => {
  if (tersimpan.value.jenis !== 'sah' || !baris.value) return ''
  const v = tersimpan.value.versi
  return tcf('versi.tersimpan')(kodeNama(v.terbaru!),
    v.minimum != null ? tcf('versi.denganMinimum')(kodeNama(v.minimum)) : tcf('versi.tanpaMinimum'),
    formatWaktu(baris.value.diperbaruiIso))
})
const teksDiabaikan = computed(() => (tersimpan.value.jenis === 'sah'
  ? tersimpan.value.diabaikan.map(b => tcf(`versi.bagian.${b}`)).join(', ')
  : ''))

// ── Aksi ─────────────────────────────────────────────────────────────
const jalankan = async (jenis: Sibuk, kerja: () => Promise<unknown>) => {
  if (sibuk.value) return
  sibuk.value = jenis
  try { await kerja() } finally { sibuk.value = null }
}
/** Baca ulang daftar: true bila kunci ini tidak berubah sejak dimuat, null bila baca ulang gagal. */
const masihSama = async (): Promise<boolean | null> => {
  let sama: boolean | null = null
  const ok = await aksi(async () => {
    const daftar = await props.segarkan()
    sama = (daftar.find(c => c.kunci === kunci.value)?.diperbaruiIso ?? null) === versiDimuat.value
  })
  if (!ok || sama === null) return null
  if (!sama) {
    basi.value = true
    toast.error(tcf('versi.berubahDiServer'))
  }
  return sama
}
const sesudahTulis = async () => {
  await aksi(async () => { await props.segarkan() })
  isiUlang()
}

const simpan = () => {
  if (!bolehSimpan.value || !nilaiBaru.value) return
  const nilai = nilaiBaru.value
  const k = kunci.value
  return jalankan('simpan', async () => {
    if (!(await masihSama())) return
    const ok = await aksi(() => api.setConfig(k, nilai, true, CATATAN_KUNCI_VERSI[k], alasan.value.trim()),
      { sukses: tcf('versi.tersimpanToast') })
    if (ok) await sesudahTulis()
  })
}
const hapus = () => {
  if (!bolehHapus.value) return
  const k = kunci.value
  return jalankan('hapus', async () => {
    if (!(await masihSama())) return
    const ok = await aksi(() => api.hapusConfig(k, alasan.value.trim()), { sukses: tcf('versi.terhapus') })
    if (ok) await sesudahTulis()
  })
}
const pakaiRilis = () => { if (!sibuk.value && acuanRilis.value != null) isian.terbaru = String(acuanRilis.value) }
const hapusMinimum = () => { if (!sibuk.value) isian.minimum = '' }
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-versi-judul">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="max-w-xl">
        <h2 id="cf-versi-judul" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('versi.judul') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('versi.ket') }}</p>
      </div>
      <CashflowSegmen :opsi="opsiKunci" :nilai="kunci" :label="tcf('versi.pilihKunci')" @pilih="pilihKunci" />
    </div>

    <!-- Nilai tersimpan, dalam kata. -->
    <div class="mt-4 space-y-1 text-sm text-[var(--ca-text)]" data-uji="versi-tersimpan">
      <p v-if="tersimpan.jenis === 'tiada'" class="text-[var(--ca-muted)]">{{ tcf('versi.belum') }}</p>
      <template v-else-if="tersimpan.jenis === 'sah'">
        <p>{{ teksTersimpan }}</p>
        <p v-if="tersimpan.versi.catatan" class="text-xs text-[var(--ca-muted)]">{{ tcf('versi.catatanTersimpan')(tersimpan.versi.catatan) }}</p>
      </template>
      <p v-else class="break-all font-mono text-xs text-[var(--ca-muted)]">{{ JSON.stringify(baris?.nilai) }}</p>
    </div>
    <div v-if="perluSetujuGanti" class="mt-3 rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-2 text-xs text-[var(--ca-text)]" data-uji="versi-asing">
      <p>{{ tersimpan.jenis === 'asing' ? tcf('versi.asing') : tcf('versi.asingSebagian')(teksDiabaikan) }}</p>
      <label class="mt-2 inline-flex items-center gap-2 font-semibold">
        <input v-model="setujuGanti" type="checkbox" :disabled="!!sibuk" >{{ tcf('versi.asingSetuju') }}
      </label>
    </div>

    <!-- Acuan -->
    <div class="mt-4 space-y-1 text-xs text-[var(--ca-muted)]">
      <p class="flex flex-wrap items-center gap-2">
        <span>{{ tcf('versi.rilis')(`${RILIS_PLAY_TERAKHIR.versi} (${RILIS_PLAY_TERAKHIR.kode})`) }}</span>
        <button v-if="acuanRilis != null" type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" :disabled="!!sibuk" @click="pakaiRilis">{{ tcf('versi.pakai') }}</button>
      </p>
      <p v-if="galatSebaran" class="ca-tone-gold">{{ tcf('versi.tertinggiGagal') }}</p>
      <p v-else-if="!memuatSebaran && sebaran">{{ !teksTertinggi ? tcf('versi.tertinggiBelum') : pilihan.label === 'play' ? tcf('versi.tertinggiPlay')(teksTertinggi) : tcf('versi.tertinggi')(teksTertinggi) }}</p>
      <p>{{ tcf('versi.batasBaca') }}</p>
    </div>

    <!-- Isian -->
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <label for="cf-versi-terbaru" class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('versi.terbaru') }}</label>
        <input
          id="cf-versi-terbaru" v-model="isian.terbaru" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
          class="ca-input mt-1 w-full font-mono" placeholder="26101412" :disabled="!!sibuk"
          :aria-invalid="periksa.galat.terbaru ? 'true' : undefined" aria-describedby="cf-versi-terbaru-ket"
        >
        <p id="cf-versi-terbaru-ket" class="mt-1 text-xs text-[var(--ca-subtle)]">
          {{ tcf('versi.terbaruKet') }}<span v-if="namaTerbaru" class="ca-pill-muted ml-1">{{ tcf('versi.namaKode')(namaTerbaru) }}</span>
        </p>
        <p v-if="periksa.galat.terbaru" class="mt-1 text-xs ca-tone-danger" role="alert">{{ tcf(`versi.galat.${periksa.galat.terbaru}`) }}</p>
      </div>
      <div>
        <label for="cf-versi-minimum" class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('versi.minimum') }}</label>
        <div class="mt-1 flex gap-2">
          <input
            id="cf-versi-minimum" v-model="isian.minimum" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
            class="ca-input w-full min-w-0 font-mono" :disabled="!!sibuk"
            :aria-invalid="periksa.galat.minimum ? 'true' : undefined" aria-describedby="cf-versi-minimum-ket"
          >
          <button v-if="isian.minimum" type="button" class="ca-btn-secondary shrink-0 !px-3 text-xs" :disabled="!!sibuk" @click="hapusMinimum">{{ tcf('versi.hapusMinimum') }}</button>
        </div>
        <p id="cf-versi-minimum-ket" class="mt-1 text-xs text-[var(--ca-subtle)]">
          {{ tcf('versi.minimumKet') }}<span v-if="namaMinimum" class="ca-pill-muted ml-1">{{ tcf('versi.namaKode')(namaMinimum) }}</span>
        </p>
        <p v-if="periksa.galat.minimum" class="mt-1 text-xs ca-tone-danger" role="alert">{{ tcf(`versi.galat.${periksa.galat.minimum}`) }}</p>
      </div>
      <div>
        <label for="cf-versi-catatan" class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('versi.catatan') }}</label>
        <input
id="cf-versi-catatan" v-model="isian.catatan" type="text" autocomplete="off" class="ca-input mt-1 w-full" :disabled="!!sibuk"
          :aria-invalid="periksa.galat.catatan ? 'true' : undefined" aria-describedby="cf-versi-catatan-ket" >
        <p id="cf-versi-catatan-ket" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('versi.catatanKet') }}</p>
        <p v-if="periksa.galat.catatan" class="mt-1 text-xs ca-tone-danger" role="alert">{{ tcf(`versi.galat.${periksa.galat.catatan}`) }}</p>
      </div>
      <div>
        <label for="cf-versi-catatan-en" class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('versi.catatanEn') }}</label>
        <input
id="cf-versi-catatan-en" v-model="isian.catatanEn" type="text" autocomplete="off" class="ca-input mt-1 w-full" :disabled="!!sibuk"
          :aria-invalid="periksa.galat.catatanEn ? 'true' : undefined" >
        <p v-if="periksa.galat.catatanEn" class="mt-1 text-xs ca-tone-danger" role="alert">{{ tcf(`versi.galat.${periksa.galat.catatanEn}`) }}</p>
      </div>
    </div>

    <ul v-if="lembut.length" class="mt-3 space-y-1 text-xs ca-tone-gold" data-uji="versi-lembut">
      <li v-for="l in lembut" :key="l.jenis">{{ teksLembut(l) }}</li>
    </ul>

    <!-- Peringatan minimum: baru atau berubah. -->
    <div v-if="perluSetujuMinimum && periksa.nilai?.minimum" class="mt-4 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm text-[var(--ca-text)]" data-uji="versi-peringatan">
      <p class="font-semibold">{{ tcf('versi.peringatan.minimum')(String(periksa.nilai.minimum)) }}</p>
      <p class="mt-1">{{ jumlahTertahan == null ? tcf('versi.peringatan.jumlahTakTahu') : tcf('versi.peringatan.jumlah')(jumlahTertahan) }}</p>
      <p class="mt-1">{{ pilihan.menungguPlay ? tcf('versi.peringatan.play') : tcf('versi.peringatan.uat') }}</p>
      <label class="mt-2 inline-flex items-center gap-2 font-semibold">
        <input v-model="setujuMinimum" type="checkbox" :disabled="!!sibuk" >{{ tcf('versi.peringatan.setuju') }}
      </label>
    </div>

    <div v-if="basi" class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-2 text-xs text-[var(--ca-text)]" role="alert" data-uji="versi-basi">
      <span>{{ tcf('versi.berubahDiServer') }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" :disabled="!!sibuk" @click="isiUlang">{{ tcf('versi.muatUlang') }}</button>
    </div>

    <label class="mt-4 block max-w-xl">
      <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('versi.alasan') }}</span>
      <input v-model="alasan" type="text" class="ca-input mt-1 w-full" :disabled="!!sibuk" :placeholder="tcf('alasan.lengkapi')" aria-describedby="cf-versi-alasan-ket" >
      <span id="cf-versi-alasan-ket" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('versi.alasanKet') }}</span>
    </label>

    <div v-if="yakinHapus" class="mt-4 flex flex-wrap items-center justify-end gap-2 text-sm" data-uji="versi-hapus-yakin">
      <span class="mr-auto text-[var(--ca-text)]">{{ tcf('versi.hapusYakin') }}</span>
      <button type="button" class="ca-btn-secondary" :disabled="!!sibuk" @click="yakinHapus = false">{{ tcf('umum.batal') }}</button>
      <button type="button" class="ca-btn-danger inline-flex items-center gap-2" :disabled="!bolehHapus" @click="hapus">
        <template v-if="sibuk === 'hapus'"><Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />{{ tcf('versi.menghapus') }}</template>
        <template v-else>{{ tcf('versi.hapusYa') }}</template>
      </button>
    </div>
    <div v-else class="mt-4 flex flex-wrap justify-end gap-2">
      <button v-if="baris" type="button" class="ca-btn-secondary" :disabled="!bolehHapus" @click="yakinHapus = true">{{ tcf('versi.hapusKunci') }}</button>
      <button type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bolehSimpan" @click="simpan">
        <template v-if="sibuk === 'simpan'"><Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />{{ tcf('versi.menyimpan') }}</template>
        <template v-else>{{ tcf('versi.simpan') }}</template>
      </button>
    </div>
  </section>
</template>
