<script setup lang="ts">
import { PILIHAN_PENERIMA, type JenisPenerima, type KelompokPengumuman } from '~/adapters/cashflowPengumuman'
const props = defineProps<{ jenis: JenisPenerima; pengguna: string[]; kelompok: string[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:jenis': [JenisPenerima]; 'update:pengguna': [string[]]; 'update:kelompok': [string[]]; sibuk: [boolean] }>()
const api = useCashflowAdmin(), toast = useToast()
const { muat, pesanGalat, memuat, batal, aksi } = useCashflowMuat()
const rows = ref<KelompokPengumuman[]>([]), total = ref(0), halaman = ref(0), cari = ref(''), kueri = ref('')
const nama = reactive<Record<string, string>>({})
const editor = ref(false), simpanAktif = ref(false), membuka = ref(false)
const g = reactive({ id: '', versi: null as string | null, nama: '', pengguna: [] as string[], alasan: '' })
const baca = () => muat(async terbaru => {
  const hasil = await api.kelompokPengumuman(kueri.value, halaman.value * 25)
  if (!terbaru()) return
  rows.value = hasil.baris; total.value = Number(hasil.total)
  for (const p of rows.value) nama[p.id] = p.name
})
const cariKelompok = () => { kueri.value = cari.value.trim(); halaman.value = 0; void baca() }
const pindah = (n: number) => { halaman.value = n; void baca() }
const pilih = (id: string) => { if (!props.disabled) emit('update:kelompok', props.kelompok.includes(id) ? props.kelompok.filter(x => x !== id) : [...props.kelompok, id]) }
const baru = () => { Object.assign(g, { id: crypto.randomUUID(), versi: null, nama: '', pengguna: [], alasan: '' }); editor.value = true }
const sunting = async (id: string) => {
  if (membuka.value) return
  membuka.value = true
  try { await aksi(async () => { const p = await api.detailKelompokPengumuman(id); Object.assign(g, { id: p.id, versi: p.updated_at, nama: p.name, pengguna: p.user_ids ?? [], alasan: '' }); editor.value = true }) }
  finally { membuka.value = false }
}
const simpan = async () => {
  if (simpanAktif.value) return
  if (!g.nama.trim() || !g.pengguna.length || g.alasan.trim().length < 8) { toast.error('Isi nama, anggota, dan alasan minimal 8 karakter.'); return }
  simpanAktif.value = true
  try {
    if (await aksi(() => api.simpanKelompokPengumuman(g.id, g.versi, g.nama.trim(), g.pengguna, g.alasan.trim()), { sukses: 'Kelompok disimpan.' })) {
      nama[g.id] = g.nama.trim()
      if (!props.kelompok.includes(g.id) && props.kelompok.length < 100) emit('update:kelompok', [...props.kelompok, g.id])
      editor.value = false; await baca();
      void hitung()
    }
  } finally { simpanAktif.value = false }
}
watch([editor, simpanAktif, membuka], () => emit('sibuk', editor.value || simpanAktif.value || membuka.value), { immediate: true })
watch(() => props.jenis, jenis => { if (jenis !== 'groups') editor.value = false })
const ringkasan = useCashflowMuat(), jumlah = ref<number | null>(null)
const hitung = () => {
  jumlah.value = null
  return ringkasan.muat(async terbaru => {
    const n = await api.jumlahPenerimaPengumuman(props.jenis, props.pengguna, props.kelompok)
    if (terbaru()) jumlah.value = Number(n)
  })
}
watch(() => [props.jenis, props.pengguna, props.kelompok], () => { void hitung() }, { immediate: true, deep: true })
const labels = useCashflowMuat()
watch(() => props.kelompok, ids => { for (const id of ids.filter(x => !nama[x])) void labels.aksi(async () => { const p = await api.detailKelompokPengumuman(id); nama[id] = p.name }) }, { immediate: true })
onMounted(() => { void baca() })
onBeforeUnmount(() => { batal(); labels.batal(); ringkasan.batal(); emit('sibuk', false) })
</script>
<template>
  <fieldset class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" :disabled="disabled || simpanAktif || membuka">
    <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">Penerima</legend>
    <select id="cf-p-penerima" :value="jenis" aria-label="Penerima" class="ca-input w-full" @change="emit('update:jenis', ($event.target as HTMLSelectElement).value as JenisPenerima)"><option v-for="p in PILIHAN_PENERIMA" :key="p.id" :value="p.id">{{ p.label }}</option></select>
    <p class="text-xs text-[var(--ca-muted)]" aria-live="polite">{{ jumlah === null ? ringkasan.memuat.value ? 'Menghitung penerima…' : 'Jumlah belum tersedia.' : `${jumlah} pengguna` }}</p>
    <p v-if="ringkasan.pesanGalat.value" class="text-xs ca-tone-danger" role="alert">{{ ringkasan.pesanGalat.value }}</p>
    <CashflowPengumumanPengguna v-if="jenis === 'single' || jenis === 'users'" :key="jenis" :model-value="pengguna" :tunggal="jenis === 'single'" :disabled="disabled" @update:model-value="emit('update:pengguna', $event)" />
    <template v-if="jenis === 'groups'">
      <div class="flex gap-2"><input v-model="cari" aria-label="Cari kelompok" class="ca-input min-w-0 flex-1" placeholder="Nama kelompok" @keydown.enter.prevent="cariKelompok"><button type="button" class="ca-btn-secondary" :disabled="memuat" @click="cariKelompok">Cari</button></div>
      <p v-if="pesanGalat" class="text-xs ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <p class="text-xs text-[var(--ca-muted)]">{{ kelompok.length }} kelompok dipilih</p>
      <div class="flex flex-wrap gap-2"><button v-for="id in kelompok" :key="id" type="button" class="ca-pill-muted !min-h-11 break-all text-xs" :aria-label="`Hapus kelompok ${nama[id] || id}`" @click="pilih(id)">{{ nama[id] || id }} <span aria-hidden="true">×</span></button></div>
      <div class="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--ca-border)]" :aria-busy="memuat">
        <div v-for="p in rows" :key="p.id" class="flex min-h-12 items-center gap-2 border-b border-[color:var(--ca-border)] p-2 last:border-b-0"><label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" :checked="kelompok.includes(p.id)" :disabled="!kelompok.includes(p.id) && kelompok.length >= 100" @change="pilih(p.id)"><span class="min-w-0 break-words text-xs text-[var(--ca-text)]">{{ p.name }}<span class="block text-[var(--ca-muted)]">{{ p.members }} anggota</span></span></label><button type="button" class="ca-btn-ghost !min-h-11 !px-2 text-xs" :disabled="membuka" @click="sunting(p.id)">Sunting</button></div>
        <p v-if="!rows.length" class="p-3 text-xs text-[var(--ca-muted)]">{{ memuat ? 'Memuat…' : 'Belum ada kelompok.' }}</p>
      </div>
      <div class="flex items-center justify-between gap-2 text-xs text-[var(--ca-muted)]"><button type="button" class="ca-btn-secondary !min-h-11 !px-2" :disabled="memuat || halaman === 0" @click="pindah(halaman - 1)">Sebelumnya</button><span>{{ halaman + 1 }} / {{ Math.max(1, Math.ceil(total / 25)) }}</span><button type="button" class="ca-btn-secondary !min-h-11 !px-2" :disabled="memuat || (halaman + 1) * 25 >= total" @click="pindah(halaman + 1)">Berikutnya</button></div>
      <button type="button" class="ca-btn-secondary w-full" @click="baru">Buat kelompok</button>
      <div v-if="editor" class="space-y-3 border-t border-[color:var(--ca-border)] pt-3" role="group" aria-label="Sunting kelompok">
        <fieldset :disabled="simpanAktif" class="space-y-3">
          <label class="block text-xs font-semibold text-[var(--ca-muted)]">Nama kelompok<input v-model="g.nama" aria-label="Nama kelompok" maxlength="80" class="ca-input mt-2 w-full"></label>
          <CashflowPengumumanPengguna v-model="g.pengguna" :disabled="simpanAktif" />
          <label class="block text-xs font-semibold text-[var(--ca-muted)]">Alasan perubahan kelompok<input v-model="g.alasan" aria-label="Alasan perubahan kelompok" class="ca-input mt-2 w-full"></label>
          <div class="flex justify-end gap-2"><button type="button" class="ca-btn-secondary" @click="editor = false">Batal</button><button type="button" class="ca-btn-primary" @click="simpan">{{ simpanAktif ? 'Menyimpan…' : 'Simpan kelompok' }}</button></div>
        </fieldset>
      </div>
    </template>
  </fieldset>
</template>
