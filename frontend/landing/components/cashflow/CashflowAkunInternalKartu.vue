<script setup lang="ts">
/**
 * Kartu "Akun internal" di Sakelar (P4): akun milik kita sendiri (pemilik,
 * akun uji, peninjau Google) yang dikecualikan pengumuman beraturan bila
 * "Kecualikan akun internal" dicentang. Tahap 1 hanya pengumuman yang
 * membaca daftar ini.
 *
 * Email ditampilkan apa adanya dari admin_daftar_akun_internal: utuh untuk
 * sesi ber-izin pii, tersamar untuk yang lain. Tambah lewat email (server
 * mencari akunnya, tidak ditemukan = P0002), ubah jenis dan catatan, hapus.
 * Setiap tulisan beralasan dan beraudit; alasannya terisi kalimat otomatis
 * berbahasa Indonesia yang menamai tindakannya, bisa diganti.
 *
 * Server lama (RPC belum ada): kartu hanya menulis bahwa daftarnya belum
 * aktif, tanpa tombol.
 */
import {
  JENIS_AKUN_INTERNAL, CATATAN_INTERNAL_MAKS, keDaftarAkunInternal, catatanInternalSah,
  type AkunInternal, type JenisAkunInternal,
} from '~/adapters/cashflowPengumumanAturan'
import { periksaEmailPengecualian } from '~/adapters/cashflow'
import { GalatAdmin, petakanGalat } from '~/composables/cashflow/useCashflowAdmin'

const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { muat, memuat, galat, pesanGalat, batal, aksi } = useCashflowMuat({ awal: true })

/** Alasan audit otomatis, bahasa Indonesia apa pun bahasa layar (sama dengan kartu Sakelar lain). */
const ALASAN_TAMBAH = 'Tambah akun internal dari console CashFlow (Sakelar)'
const ALASAN_UBAH = 'Ubah akun internal dari console CashFlow (Sakelar)'
const ALASAN_HAPUS = 'Hapus akun internal dari console CashFlow (Sakelar)'

const daftar = shallowRef<AkunInternal[]>([])
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const tersamar = computed(() => daftar.value.some(a => a.email.includes('*')))
const muatDaftar = () => muat(async terbaru => {
  const hasil = keDaftarAkunInternal(await api.daftarAkunInternal())
  if (terbaru()) daftar.value = hasil
})
onMounted(() => { void muatDaftar() })
onBeforeUnmount(batal)

const sibuk = ref(false)
const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
  if (sibuk.value) return false
  sibuk.value = true
  try {
    const ok = await aksi(async () => {
      try { await kerja() } catch (e) {
        // P0002 saat menambah: email tidak ada di auth.users CashFlow.
        const g = petakanGalat(e)
        throw g.jenis === 'tidak-ada' ? new GalatAdmin('lain', tcf('sakelar.internal.emailBelumAda'), g.hint) : g
      }
    }, { sukses })
    if (ok) await muatDaftar()
    return ok
  } finally { sibuk.value = false }
}
const teksCatatan = (c: string) => (c.trim() ? c.trim() : null)

// ── Tambah ──────────────────────────────────────────────────────────────
const tambah = reactive({ buka: false, email: '', jenis: 'uji' as JenisAkunInternal, catatan: '', alasan: ALASAN_TAMBAH, galat: '' })
const bukaTambah = () => Object.assign(tambah, { buka: true, email: '', jenis: 'uji', catatan: '', alasan: ALASAN_TAMBAH, galat: '' })
const kirimTambah = async () => {
  const masalah = periksaEmailPengecualian(tambah.email, [])
  if (masalah) { tambah.galat = tcf(`sakelar.emailGalat.${masalah}`); return }
  const email = tambah.email.trim().toLowerCase()
  if (daftar.value.some(a => a.email.toLowerCase() === email)) { tambah.galat = tcf('sakelar.internal.sudahAda'); return }
  if (!catatanInternalSah(tambah.catatan)) { tambah.galat = tcf('sakelar.internal.catatanPanjang'); return }
  if (tambah.alasan.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const ok = await jalankan(() => api.simpanAkunInternal(null, email, tambah.jenis, teksCatatan(tambah.catatan), tambah.alasan.trim()), tcf('sakelar.internal.tersimpan'))
  if (ok) tambah.buka = false
}

// ── Ubah dan hapus per baris ────────────────────────────────────────────
const ubah = reactive({ id: null as string | null, jenis: 'uji' as JenisAkunInternal, catatan: '', alasan: ALASAN_UBAH })
const hapus = reactive({ id: null as string | null, alasan: ALASAN_HAPUS })
const mulaiUbah = (a: AkunInternal) => { hapus.id = null; Object.assign(ubah, { id: a.userId, jenis: a.jenis ?? 'lain', catatan: a.catatan, alasan: ALASAN_UBAH }) }
const mulaiHapus = (a: AkunInternal) => { ubah.id = null; Object.assign(hapus, { id: a.userId, alasan: ALASAN_HAPUS }) }
const kirimUbah = async (a: AkunInternal) => {
  if (!catatanInternalSah(ubah.catatan)) { toast.error(tcf('sakelar.internal.catatanPanjang')); return }
  if (ubah.alasan.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const ok = await jalankan(() => api.simpanAkunInternal(a.userId, null, ubah.jenis, teksCatatan(ubah.catatan), ubah.alasan.trim()), tcf('sakelar.internal.tersimpan'))
  if (ok) ubah.id = null
}
const kirimHapus = async (a: AkunInternal) => {
  if (hapus.alasan.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const ok = await jalankan(() => api.hapusAkunInternal(a.userId, hapus.alasan.trim()), tcf('sakelar.internal.terhapus'))
  if (ok) hapus.id = null
}
const labelJenis = (a: AkunInternal) => (a.jenis ? tcf(`sakelar.internal.jenisOpsi.${a.jenis}`) : tcf('sakelar.internal.jenisAsing')(a.jenisAsli))
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-internal-judul" data-uji="akun-internal">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-xl">
        <h2 id="cf-internal-judul" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.internal.judul') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.internal.ket') }}</p>
      </div>
      <button v-if="!belumAktif && !tambah.buka && !memuat" type="button" class="ca-btn-secondary inline-flex items-center gap-2 text-sm" :disabled="sibuk" @click="bukaTambah">
        <Icon name="lucide:plus" class="h-4 w-4" />{{ tcf('sakelar.internal.tambah') }}
      </button>
    </div>

    <p v-if="belumAktif" class="mt-3 text-sm text-[var(--ca-muted)]" role="status" data-uji="akun-internal-belum-aktif">{{ tcf('sakelar.internal.belumAktif') }}</p>
    <template v-else>
      <p v-if="pesanGalat" class="mt-3 text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <p v-if="memuat && !daftar.length" class="mt-3 text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

      <!-- Tambah lewat email -->
      <form v-if="tambah.buka" class="mt-4 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" novalidate @submit.prevent="kirimTambah">
        <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('sakelar.internal.tambahJudul') }}</h3>
        <fieldset :disabled="sibuk" class="grid gap-3 sm:grid-cols-2">
          <label for="cf-internal-email" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.email') }}
            <input id="cf-internal-email" v-model="tambah.email" type="text" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false" class="ca-input mt-1 w-full" placeholder="nama@email.com" :aria-invalid="tambah.galat ? 'true' : undefined" @input="tambah.galat = ''">
          </label>
          <label for="cf-internal-jenis" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.jenis') }}
            <select id="cf-internal-jenis" v-model="tambah.jenis" class="ca-input mt-1 w-full"><option v-for="j in JENIS_AKUN_INTERNAL" :key="j" :value="j">{{ tcf(`sakelar.internal.jenisOpsi.${j}`) }}</option></select>
          </label>
          <div class="sm:col-span-2">
            <label for="cf-internal-catatan" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.catatan') }}
              <input id="cf-internal-catatan" v-model="tambah.catatan" :maxlength="CATATAN_INTERNAL_MAKS" class="ca-input mt-1 w-full" aria-describedby="cf-internal-catatan-ket">
            </label>
            <p id="cf-internal-catatan-ket" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('sakelar.internal.catatanKet') }}</p>
          </div>
          <label for="cf-internal-alasan" class="block text-xs font-semibold text-[var(--ca-muted)] sm:col-span-2">{{ tcf('sakelar.internal.alasan') }}
            <input id="cf-internal-alasan" v-model="tambah.alasan" class="ca-input mt-1 w-full" minlength="8">
          </label>
        </fieldset>
        <p v-if="tambah.galat" class="text-xs ca-tone-danger" role="alert">{{ tambah.galat }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tambah.buka = false">{{ tcf('umum.batal') }}</button>
          <button type="submit" class="ca-btn-primary" :disabled="sibuk || !tambah.email.trim()">{{ sibuk ? tcf('sakelar.internal.menyimpan') : tcf('sakelar.internal.simpan') }}</button>
        </div>
      </form>

      <CashflowKeadaanKosong v-if="!memuat && !pesanGalat && !daftar.length" class="mt-3" :pesan="tcf('sakelar.internal.kosong')" icon="lucide:shield" />
      <ul v-else-if="daftar.length" class="mt-4 space-y-2">
        <li v-for="a in daftar" :key="a.userId" class="rounded-xl border border-[color:var(--ca-border)] p-3">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-[12rem] flex-1">
              <p class="font-mono text-xs text-[var(--ca-text)] [overflow-wrap:anywhere]">{{ a.email || a.userId.slice(0, 8) }}</p>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span class="ca-pill-muted" :class="a.jenis ? '' : 'ca-tone-gold'">{{ labelJenis(a) }}</span>
                <span v-if="a.catatan" class="break-words text-[var(--ca-muted)]">{{ a.catatan }}</span>
                <span class="text-[var(--ca-subtle)]">{{ tcf('sakelar.internal.diubah') }} {{ formatTanggal(a.diubah) }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" :disabled="sibuk" @click="mulaiUbah(a)">{{ tcf('sakelar.internal.ubah') }}</button>
              <button type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" :disabled="sibuk" @click="mulaiHapus(a)">{{ tcf('sakelar.internal.hapus') }}</button>
            </div>
          </div>
          <form v-if="ubah.id === a.userId" class="mt-3 grid gap-3 border-t border-[color:var(--ca-border)] pt-3 sm:grid-cols-2" @submit.prevent="kirimUbah(a)">
            <label :for="`cf-internal-jenis-${a.userId}`" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.jenis') }}
              <select :id="`cf-internal-jenis-${a.userId}`" v-model="ubah.jenis" class="ca-input mt-1 w-full" :disabled="sibuk"><option v-for="j in JENIS_AKUN_INTERNAL" :key="j" :value="j">{{ tcf(`sakelar.internal.jenisOpsi.${j}`) }}</option></select>
            </label>
            <label :for="`cf-internal-catatan-${a.userId}`" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.catatan') }}
              <input :id="`cf-internal-catatan-${a.userId}`" v-model="ubah.catatan" :maxlength="CATATAN_INTERNAL_MAKS" class="ca-input mt-1 w-full" :disabled="sibuk">
            </label>
            <label :for="`cf-internal-alasan-${a.userId}`" class="block text-xs font-semibold text-[var(--ca-muted)] sm:col-span-2">{{ tcf('sakelar.internal.alasan') }}
              <input :id="`cf-internal-alasan-${a.userId}`" v-model="ubah.alasan" class="ca-input mt-1 w-full" minlength="8" :disabled="sibuk">
            </label>
            <div class="flex justify-end gap-2 sm:col-span-2">
              <button type="button" class="ca-btn-secondary text-xs" :disabled="sibuk" @click="ubah.id = null">{{ tcf('umum.batal') }}</button>
              <button type="submit" class="ca-btn-primary text-xs" :disabled="sibuk || ubah.alasan.trim().length < 8">{{ sibuk ? tcf('sakelar.internal.menyimpan') : tcf('sakelar.internal.simpan') }}</button>
            </div>
          </form>
          <form v-if="hapus.id === a.userId" class="mt-3 space-y-3 border-t border-[color:var(--ca-border)] pt-3" @submit.prevent="kirimHapus(a)">
            <p class="text-xs text-[var(--ca-text)]">{{ tcf('sakelar.internal.hapusYakin')(a.email || a.userId.slice(0, 8)) }}</p>
            <label :for="`cf-internal-hapus-${a.userId}`" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('sakelar.internal.alasan') }}
              <input :id="`cf-internal-hapus-${a.userId}`" v-model="hapus.alasan" class="ca-input mt-1 w-full" minlength="8" :disabled="sibuk">
            </label>
            <div class="flex justify-end gap-2">
              <button type="button" class="ca-btn-secondary text-xs" :disabled="sibuk" @click="hapus.id = null">{{ tcf('umum.batal') }}</button>
              <button type="submit" class="ca-btn-primary text-xs" :disabled="sibuk || hapus.alasan.trim().length < 8">{{ tcf('sakelar.internal.hapus') }}</button>
            </div>
          </form>
        </li>
      </ul>
      <p v-if="tersamar" class="mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('sakelar.internal.tersamarKet') }}</p>
    </template>
  </section>
</template>
