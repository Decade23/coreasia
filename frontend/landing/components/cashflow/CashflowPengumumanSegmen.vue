<script setup lang="ts">
/**
 * Kelola segmen penerima (P5): daftar dengan jumlah anggota dan berapa
 * pengumuman aktif atau terjadwal yang memakainya, buat, sunting, hapus.
 *
 * Simpan lewat admin_simpan_segmen_pengumuman dengan versi (`diubah`) yang
 * dimuat: segmen yang berubah di tempat lain ditolak server, daftar dimuat
 * ulang. Hapus segmen yang masih dirujuk pengumuman aktif atau terjadwal
 * ditolak server (23503 segmen-dipakai); penolakan itu ditulis di kartunya
 * dengan kalimat awam, bukan kalimat Postgres. Semua tulisan beralasan dan
 * beraudit. `berubah` memberi tahu halaman supaya ringkasan dan jumlah
 * penerima di tabel pengumuman ikut segar.
 */
import {
  ISIAN_SARING_KOSONG, NAMA_SEGMEN_MAKS,
  keDaftarSegmen, isianDariSaring, periksaIsianSaring, periksaNamaSegmen, saringKeDto, kalimatSaring, segmenDipakaiDariGalat,
  type IsianSaring, type Segmen, type KamusRingkas,
} from '~/adapters/cashflowPengumumanAturan'
import { petakanGalat, type GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const emit = defineEmits<{ berubah: [] }>()
const { tcf, kamus, bahasa, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { muat, memuat, pesanGalat, batal, aksi } = useCashflowMuat({ awal: true })
const ringkas = computed(() => kamus.value.pengumuman.ringkas as unknown as KamusRingkas)

const daftar = shallowRef<Segmen[]>([])
const muatDaftar = () => muat(async terbaru => {
  const hasil = keDaftarSegmen(await api.daftarSegmenPengumuman())
  if (terbaru()) daftar.value = hasil
})
onMounted(() => { void muatDaftar() })
onBeforeUnmount(batal)

// ── Editor (buat atau sunting) ──────────────────────────────────────────
const editor = reactive({ buka: false, id: '', versi: null as string | null, nama: '', isian: { ...ISIAN_SARING_KOSONG } as IsianSaring, alasan: '', asing: false })
const menyimpan = ref(false)
const periksa = computed(() => periksaIsianSaring(editor.isian))
const galatNama = computed(() => (editor.nama ? periksaNamaSegmen(editor.nama, daftar.value, editor.id) : null))
const bolehSimpan = computed(() => !menyimpan.value && !!editor.nama.trim() && !galatNama.value && !!periksa.value.saring && editor.alasan.trim().length >= 8)
const buatBaru = () => Object.assign(editor, {
  buka: true, id: crypto.randomUUID(), versi: null, nama: '', isian: { ...ISIAN_SARING_KOSONG }, alasan: tcf('pengumuman.segmen.alasanSimpan'), asing: false,
})
const sunting = (s: Segmen) => Object.assign(editor, {
  buka: true, id: s.id, versi: s.diubah, nama: s.nama, isian: isianDariSaring(s.saring), alasan: tcf('pengumuman.segmen.alasanSimpan'), asing: s.asing.length > 0,
})
const basi = (g: GalatAdmin) => g.hint.includes('basi')
const simpan = async () => {
  const saring = periksa.value.saring
  if (!bolehSimpan.value || !saring) return
  menyimpan.value = true
  try {
    const ok = await aksi(
      async () => { await api.simpanSegmenPengumuman(editor.id, editor.versi, editor.nama.trim(), saringKeDto(saring), editor.alasan.trim()) },
      { sukses: tcf('pengumuman.segmen.tersimpan'), gagal: g => { if (basi(g)) { toast.error(tcf('pengumuman.segmen.basi')); editor.buka = false; void muatDaftar() } } },
    )
    if (ok) { editor.buka = false; await muatDaftar(); emit('berubah') }
  } finally { menyimpan.value = false }
}

// ── Hapus ───────────────────────────────────────────────────────────────
const hapusId = ref<string | null>(null)
const alasanHapus = ref('')
const menghapus = ref(false)
const ditolakDipakai = ref<string | null>(null)
const mintaHapus = (s: Segmen) => { hapusId.value = s.id; alasanHapus.value = tcf('pengumuman.segmen.alasanHapus'); ditolakDipakai.value = null }
const hapus = async (s: Segmen) => {
  if (menghapus.value || alasanHapus.value.trim().length < 8) return
  menghapus.value = true
  try {
    let dipakai = false
    const ok = await aksi(async () => {
      try { await api.hapusSegmenPengumuman(s.id, alasanHapus.value.trim()) } catch (e) {
        // Penolakan segmen-dipakai ditulis di kartunya sendiri, tanpa toast ganda.
        if (segmenDipakaiDariGalat(petakanGalat(e))) { dipakai = true; return }
        throw e
      }
    })
    if (!ok) return
    if (dipakai) { ditolakDipakai.value = s.id; await muatDaftar(); return }
    toast.success(tcf('pengumuman.segmen.terhapus'))
    hapusId.value = null
    await muatDaftar()
    emit('berubah')
  } finally { menghapus.value = false }
}
</script>

<template>
  <div class="space-y-4" data-uji="kelola-segmen">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <p class="max-w-xl text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.segmen.ket') }}</p>
      <button v-if="!editor.buka" type="button" class="ca-btn-secondary text-sm" @click="buatBaru">{{ tcf('pengumuman.segmen.buat') }}</button>
    </div>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>

    <form v-if="editor.buka" class="space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" novalidate @submit.prevent="simpan">
      <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ editor.versi ? tcf('pengumuman.segmen.suntingJudul') : tcf('pengumuman.segmen.buatJudul') }}</h3>
      <p v-if="editor.asing" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-3 py-2 text-xs text-[var(--ca-text)]">{{ tcf('pengumuman.aturan.asing') }}</p>
      <fieldset :disabled="menyimpan" class="space-y-3">
        <label for="cf-segmen-nama" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.segmen.nama') }}
          <input id="cf-segmen-nama" v-model="editor.nama" :maxlength="NAMA_SEGMEN_MAKS" class="ca-input mt-2 w-full" :aria-invalid="galatNama ? 'true' : undefined">
        </label>
        <p v-if="galatNama" class="text-xs ca-tone-danger" role="alert">{{ tcf(`pengumuman.segmen.namaGalat.${galatNama}`) }}</p>
        <CashflowPengumumanSaringan v-model="editor.isian" :galat="periksa.galat" />
        <label for="cf-segmen-alasan" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.segmen.alasan') }}
          <input id="cf-segmen-alasan" v-model="editor.alasan" class="ca-input mt-2 w-full" minlength="8">
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="ca-btn-secondary" @click="editor.buka = false">{{ tcf('umum.batal') }}</button>
          <button type="submit" class="ca-btn-primary" :disabled="!bolehSimpan">{{ menyimpan ? tcf('pengumuman.segmen.menyimpan') : tcf('pengumuman.segmen.simpan') }}</button>
        </div>
      </fieldset>
    </form>

    <p v-if="memuat && !daftar.length" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <CashflowKeadaanKosong v-else-if="!daftar.length && !pesanGalat" :pesan="tcf('pengumuman.segmen.kosong')" icon="lucide:filter" />
    <ul v-else class="space-y-2" :aria-busy="memuat">
      <li v-for="s in daftar" :key="s.id" class="rounded-xl border border-[color:var(--ca-border)] p-3" :data-uji="`segmen-${s.id}`">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-[12rem] flex-1">
            <p class="break-words text-sm font-semibold text-[var(--ca-text)]">{{ s.nama }}</p>
            <p class="mt-1 break-words text-xs text-[var(--ca-muted)]">{{ kalimatSaring(s.saring, ringkas, bahasa) }}<template v-if="s.asing.length">. {{ tcf('pengumuman.segmen.asing') }}</template></p>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">
              {{ tcf('pengumuman.segmen.kolom.anggota') }}: {{ s.jumlah === null ? '—' : tcf('pengumuman.segmen.anggota')(s.jumlah) }} · {{ tcf('pengumuman.segmen.kolom.dipakai') }}: {{ tcf('pengumuman.segmen.dipakai')(s.dipakai) }} · {{ tcf('pengumuman.segmen.kolom.diubah') }}: {{ formatTanggal(s.diubah) }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-1.5 text-xs" :disabled="menyimpan" @click="sunting(s)">{{ tcf('pengumuman.segmen.sunting') }}</button>
            <button type="button" class="ca-btn-ghost !min-h-11 !px-3 !py-1.5 text-xs" :disabled="menghapus" @click="mintaHapus(s)">{{ tcf('pengumuman.segmen.hapus') }}</button>
          </div>
        </div>
        <form v-if="hapusId === s.id" class="mt-3 space-y-3 border-t border-[color:var(--ca-border)] pt-3" @submit.prevent="hapus(s)">
          <p class="text-xs text-[var(--ca-text)]">{{ tcf('pengumuman.segmen.hapusKet')(s.nama) }}</p>
          <p v-if="ditolakDipakai === s.id" class="rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-3 py-2 text-xs text-[var(--ca-text)]" role="alert" data-uji="segmen-dipakai">{{ tcf('galat.segmenDipakai') }}</p>
          <p v-else-if="s.dipakai > 0" class="text-xs ca-tone-gold">{{ tcf('pengumuman.segmen.dipakaiKet') }}</p>
          <label :for="`cf-segmen-hapus-${s.id}`" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.segmen.alasan') }}
            <input :id="`cf-segmen-hapus-${s.id}`" v-model="alasanHapus" class="ca-input mt-2 w-full" minlength="8" :disabled="menghapus">
          </label>
          <div class="flex justify-end gap-2">
            <button type="button" class="ca-btn-secondary text-xs" :disabled="menghapus" @click="hapusId = null">{{ tcf('umum.batal') }}</button>
            <button type="submit" class="ca-btn-primary text-xs" :disabled="menghapus || alasanHapus.trim().length < 8">{{ tcf('pengumuman.segmen.hapus') }}</button>
          </div>
        </form>
      </li>
    </ul>
  </div>
</template>
