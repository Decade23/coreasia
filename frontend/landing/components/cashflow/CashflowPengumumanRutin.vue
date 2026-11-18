<script setup lang="ts">
/**
 * Bagian "Pengumuman rutin" di halaman Pengumuman (spek console 19 Nov 2026,
 * K5, PR-01 sampai PR-05): keadaan sakelar, rencana terbit berikutnya,
 * pengumuman rutin terakhir, dan templat per topik (buat, sunting, hapus).
 *
 * Jadwal server berjalan setiap hari 05.00 WIB dan menerbitkan paling banyak
 * satu kartu. Sakelar `pengumuman_rutin` di Sakelar MATI bawaan. Bagian ini
 * hanya membaca keadaannya dan menautkan ke halaman Sakelar. Isi templat
 * ditunjukkan ke Master sebelum sakelar dinyalakan.
 *
 * IZIN. Membaca cukup cashflow:view. Menulis butuh cashflow:pii (server
 * menolak dengan 42501 izin-kurang). Semua tulisan beralasan dan beraudit.
 * Templat yang berubah di tempat lain ditolak 40001 rutin-basi: form meminta
 * muat ulang.
 */
import {
  isianDariTemplat, isianRutinBaru, galatServerRutin, jamTampil,
  type DaftarRutin, type GalatRutin, type IsianRutin, type MuatanRutin, type TemplatRutin,
} from '~/adapters/cashflowPengumumanRutin'
import { kalimatAturan, labelVersi, type KamusRingkas } from '~/adapters/cashflowPengumumanAturan'
import { tombolPengumuman } from '~/adapters/cashflowPengumumanTautan'
import type { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const props = defineProps<{ daftar: DaftarRutin; memuat?: boolean }>()
const emit = defineEmits<{ berubah: [] }>()
const { tcf, kamus, bahasa, formatTanggal, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { aksi } = useCashflowMuat()
const ringkas = computed(() => kamus.value.pengumuman.ringkas as unknown as KamusRingkas)

const izinDitolak = ref(false)
const bolehUbah = computed(() => sesi.boleh('cashflow:pii') && !izinDitolak.value)
const catatIzin = (g: GalatAdmin) => { if (g.jenis === 'izin') izinDitolak.value = true }
const waktu = (iso: string | null) => (iso ? `${formatTanggal(iso)} ${formatJam(iso)}` : '—')
const tanggal = (ymd: string | null) => (ymd ? formatTanggal(`${ymd}T00:00:00+07:00`) : '—')
const versiKartu = computed(() => labelVersi(props.daftar.versiMin))
const domain = (t: TemplatRutin) => tombolPengumuman(t.tombol, t.url)?.host ?? ''
const labelTopik = (t: TemplatRutin['topik'] | null) => (t ? tcf(`pengumuman.rutin.topikOpsi.${t}`) : tcf('pengumuman.rutin.topikHilang'))
const templatRencana = computed(() => props.daftar.templat.find(t => t.id === props.daftar.rencana.templatId) ?? null)
const jumlahAktif = computed(() => props.daftar.templat.filter(t => t.aktif).length)

// ── Form ────────────────────────────────────────────────────────────────
const form = reactive({ buka: false, mode: 'baru' as 'baru' | 'ubah', id: '', versi: null as string | null, isian: isianRutinBaru() as IsianRutin, kunci: 0 })
const galatServer = ref<GalatRutin>({})
const basi = ref(false)
const menyimpan = ref(false)
const bukaBaru = () => {
  if (!bolehUbah.value) return
  Object.assign(form, { buka: true, mode: 'baru', id: crypto.randomUUID(), versi: null, isian: { ...isianRutinBaru(), alasan: tcf('pengumuman.rutin.alasanSimpan') }, kunci: form.kunci + 1 })
  galatServer.value = {}; basi.value = false
}
const sunting = (t: TemplatRutin) => {
  Object.assign(form, { buka: true, mode: 'ubah', id: t.id, versi: t.versi, isian: { ...isianDariTemplat(t), alasan: tcf('pengumuman.rutin.alasanSimpan') }, kunci: form.kunci + 1 })
  galatServer.value = {}; basi.value = false
}
watch(() => props.daftar, (d) => {
  // Templat yang sedang disunting berubah di tempat lain.
  if (form.buka && form.mode === 'ubah' && !menyimpan.value) {
    const t = d.templat.find(x => x.id === form.id)
    if (t && t.versi !== form.versi) basi.value = true
  }
})
const muatVersi = () => {
  const t = props.daftar.templat.find(x => x.id === form.id)
  if (t) sunting(t)
  else form.buka = false
}
const tutupForm = () => { if (!menyimpan.value) form.buka = false }
const simpan = async (m: MuatanRutin) => {
  if (menyimpan.value) return
  galatServer.value = {}
  menyimpan.value = true
  try {
    const ok = await aksi(async () => { await api.simpanPengumumanRutin(form.id, form.versi, m) }, {
      sukses: tcf(form.mode === 'baru' ? 'pengumuman.rutin.dibuat' : 'pengumuman.rutin.disimpan'),
      gagal: (g) => {
        catatIzin(g)
        if (g.hint === 'rutin-basi') { basi.value = true; emit('berubah'); return }
        const k = galatServerRutin(g)
        if (k) galatServer.value = { [k.kolom]: k.kode }
      },
    })
    if (ok) { form.buka = false; emit('berubah') }
  } finally { menyimpan.value = false }
}

// ── Hapus ───────────────────────────────────────────────────────────────
const hapusId = ref<string | null>(null)
const alasanHapus = ref('')
const menghapus = ref(false)
const mintaHapus = (t: TemplatRutin) => { hapusId.value = t.id; alasanHapus.value = tcf('pengumuman.rutin.alasanHapus') }
const hapus = async (t: TemplatRutin) => {
  if (menghapus.value || alasanHapus.value.trim().length < 8) return
  menghapus.value = true
  try {
    const ok = await aksi(() => api.hapusPengumumanRutin(t.id, alasanHapus.value.trim()), {
      sukses: tcf('pengumuman.rutin.terhapus'), gagal: (g) => { catatIzin(g); if (g.jenis === 'tidak-ada') emit('berubah') },
    })
    if (ok) { hapusId.value = null; emit('berubah') }
  } finally { menghapus.value = false }
}
</script>

<template>
  <section class="cf-tabel-wadah min-w-0 space-y-4 p-4 sm:p-5" data-uji="bagian-rutin" aria-labelledby="cf-rutin-judul">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 max-w-2xl">
        <h2 id="cf-rutin-judul" class="text-base font-semibold text-[var(--ca-text)]">{{ tcf('pengumuman.rutin.judul') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.ket') }}</p>
      </div>
      <button type="button" class="ca-btn-primary" :disabled="!bolehUbah" data-uji="rutin-tambah" @click="bukaBaru">{{ tcf('pengumuman.rutin.buat') }}</button>
    </div>

    <dl class="grid gap-3 text-sm sm:grid-cols-3" :aria-busy="memuat">
      <div class="min-w-0 rounded-xl border border-[color:var(--ca-border)] p-3" data-uji="rutin-sakelar">
        <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.sakelar') }}</dt>
        <dd class="mt-1">
          <span class="text-xs" :class="daftar.sakelar ? 'ca-pill-emerald' : 'ca-pill-muted'">{{ daftar.sakelar ? tcf('pengumuman.rutin.nyala') : tcf('pengumuman.rutin.mati') }}</span>
          <span class="mt-1 block text-xs text-[var(--ca-muted)]">{{ daftar.sakelar ? tcf('pengumuman.rutin.nyalaKet') : tcf('pengumuman.rutin.matiKet') }}</span>
          <NuxtLink to="/console/cashflow/sakelar" class="mt-1 inline-block text-xs font-semibold text-[var(--ca-accent)] underline-offset-2 hover:underline">{{ tcf('pengumuman.rutin.keSakelar') }}</NuxtLink>
        </dd>
      </div>
      <div class="min-w-0 rounded-xl border border-[color:var(--ca-border)] p-3" data-uji="rutin-rencana">
        <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.berikutnya') }}</dt>
        <dd class="mt-1 text-xs text-[var(--ca-text)]">
          <template v-if="daftar.rencana.sebab === 'tanpa_templat' || !daftar.rencana.topik">{{ tcf('pengumuman.rutin.sebab.tanpa_templat') }}</template>
          <template v-else>
            <span class="block font-semibold">{{ labelTopik(daftar.rencana.topik) }}<template v-if="templatRencana">: {{ templatRencana.judul }}</template></span>
            <span class="mt-1 block text-[var(--ca-muted)]">{{ daftar.rencana.sebab ? tcf(`pengumuman.rutin.sebab.${daftar.rencana.sebab}`) : tcf('pengumuman.rutin.siap') }}</span>
            <span class="mt-1 block text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.palingCepat')(tanggal(daftar.rencana.palingCepat)) }}</span>
          </template>
        </dd>
      </div>
      <div class="min-w-0 rounded-xl border border-[color:var(--ca-border)] p-3" data-uji="rutin-terakhir">
        <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.terakhir') }}</dt>
        <dd class="mt-1 text-xs text-[var(--ca-text)]">
          <template v-if="daftar.terakhir">
            <span class="block break-words font-semibold">{{ daftar.terakhir.judul }}</span>
            <span class="mt-1 block text-[var(--ca-muted)]">{{ labelTopik(daftar.terakhir.topik) }} · {{ waktu(daftar.terakhir.mulai) }}</span>
          </template>
          <template v-else>{{ tcf('pengumuman.rutin.belumPernah') }}</template>
        </dd>
      </div>
    </dl>

    <p v-if="!daftar.gayaAda" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-3 py-2 text-xs text-[var(--ca-text)]" role="status" data-uji="rutin-gaya-belum">{{ tcf('pengumuman.rutin.gayaBelumAda') }}</p>
    <p class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.rutin.aturanTetap')(daftar.umurMinHari, versiKartu) }}</p>
    <p v-if="!bolehUbah" class="text-xs ca-tone-gold" role="status">{{ tcf('pengumuman.rutin.butuhPii') }}</p>

    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengumuman.rutin.jumlah')(daftar.templat.length, jumlahAktif) }}</p>
    <CashflowKeadaanKosong v-if="!daftar.templat.length" :pesan="tcf('pengumuman.rutin.kosong')" icon="lucide:calendar-clock" />
    <ul v-else class="grid gap-3 lg:grid-cols-2">
      <li v-for="t in daftar.templat" :key="t.id" class="min-w-0 rounded-xl border border-[color:var(--ca-border)] p-3" :data-uji="`rutin-${t.id}`">
        <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span class="ca-pill-muted">{{ labelTopik(t.topik) }}</span>
          <span :class="t.aktif ? 'ca-pill-emerald' : 'ca-pill-muted'">{{ t.aktif ? tcf('pengumuman.rutin.aktifLabel') : tcf('pengumuman.rutin.draf') }}</span>
          <span v-if="t.id === daftar.rencana.templatId" class="ca-pill-muted">{{ tcf('pengumuman.rutin.giliran') }}</span>
        </div>
        <p class="mt-2 break-words text-sm font-semibold text-[var(--ca-text)]">{{ t.judul }}</p>
        <p class="mt-1 whitespace-pre-wrap break-words text-xs text-[var(--ca-muted)]">{{ t.isi }}</p>
        <p v-if="t.tombol" class="mt-1 break-all text-xs text-[var(--ca-subtle)]">{{ t.tombol }} · {{ domain(t) }}</p>
        <p class="mt-2 break-words text-xs text-[var(--ca-text)]">{{ kalimatAturan(t.aturan, ringkas, { bahasa }) }}</p>
        <p class="mt-1 text-xs text-[var(--ca-subtle)]">
          {{ tcf('pengumuman.rutin.meta')(t.jedaHari, jamTampil(t.jamMulai), jamTampil(t.jamAkhir), t.bobot) }}
          · {{ t.terbit ? tcf('pengumuman.rutin.terbitKali')(t.terbit, waktu(t.terakhirTerbit)) : tcf('pengumuman.rutin.belumTerbit') }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" :disabled="!bolehUbah" @click="sunting(t)">{{ tcf('pengumuman.sunting') }}</button>
          <button type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" :disabled="!bolehUbah || menghapus" @click="mintaHapus(t)">{{ tcf('pengumuman.segmen.hapus') }}</button>
        </div>
        <form v-if="hapusId === t.id" class="mt-3 space-y-3 border-t border-[color:var(--ca-border)] pt-3" @submit.prevent="hapus(t)">
          <p class="text-xs text-[var(--ca-text)]">{{ tcf('pengumuman.rutin.hapusKet')(t.judul) }}</p>
          <label :for="`cf-rt-hapus-${t.id}`" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.alasan') }}
            <input :id="`cf-rt-hapus-${t.id}`" v-model="alasanHapus" class="ca-input mt-2 w-full" minlength="8" :disabled="menghapus">
          </label>
          <div class="flex justify-end gap-2">
            <button type="button" class="ca-btn-secondary text-xs" :disabled="menghapus" @click="hapusId = null">{{ tcf('umum.batal') }}</button>
            <button type="submit" class="ca-btn-primary text-xs" :disabled="menghapus || alasanHapus.trim().length < 8">{{ tcf('pengumuman.segmen.hapus') }}</button>
          </div>
        </form>
      </li>
    </ul>

    <CashflowPengumumanRutinForm
      v-if="form.buka" :key="`${form.id}|${form.kunci}`" :show="form.buka" :mode="form.mode" :isian-awal="form.isian" :galat-server="galatServer"
      :sibuk="menyimpan" :basi="basi" :versi-min="daftar.versiMin" :umur-min-hari="daftar.umurMinHari"
      @simpan="simpan" @tutup="tutupForm" @muat-versi="muatVersi"
    />
  </section>
</template>
