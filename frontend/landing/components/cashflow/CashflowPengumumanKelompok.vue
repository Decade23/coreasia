<script setup lang="ts">
/**
 * Pemilih kelompok pengumuman: cari, pilih (paling banyak 100), buat, dan
 * sunting kelompok. Dipakai untuk penerima jenis Kelompok dan untuk
 * "Kelompok yang dikecualikan" di penerima jenis aturan.
 *
 * Isinya dipindah apa adanya dari CashflowPengumumanPenerima supaya dua
 * tempat itu memakai satu pemilih. Selama editor kelompok terbuka atau
 * menyimpan, `sibuk` true: formulir pengumuman menahan Simpan.
 */
import type { KelompokPengumuman } from '~/adapters/cashflowPengumuman'
import { BATAS_KECUALI_KELOMPOK } from '~/adapters/cashflowPengumumanAturan'
const props = defineProps<{ modelValue: string[]; disabled?: boolean; labelCari?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]]; sibuk: [boolean]; disimpan: [] }>()
const { tcf } = useCashflowI18n()
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
const pilih = (id: string) => { if (!props.disabled) emit('update:modelValue', props.modelValue.includes(id) ? props.modelValue.filter(x => x !== id) : [...props.modelValue, id]) }
const baru = () => { Object.assign(g, { id: crypto.randomUUID(), versi: null, nama: '', pengguna: [], alasan: '' }); editor.value = true }
const sunting = async (id: string) => {
  if (membuka.value) return
  membuka.value = true
  try { await aksi(async () => { const p = await api.detailKelompokPengumuman(id); Object.assign(g, { id: p.id, versi: p.updated_at, nama: p.name, pengguna: p.user_ids ?? [], alasan: '' }); editor.value = true }) }
  finally { membuka.value = false }
}
const simpan = async () => {
  if (simpanAktif.value) return
  if (!g.nama.trim() || !g.pengguna.length || g.alasan.trim().length < 8) { toast.error(tcf('pengumuman.kelompok.wajib')); return }
  simpanAktif.value = true
  try {
    if (await aksi(() => api.simpanKelompokPengumuman(g.id, g.versi, g.nama.trim(), g.pengguna, g.alasan.trim()), { sukses: tcf('pengumuman.kelompok.tersimpan') })) {
      nama[g.id] = g.nama.trim()
      if (!props.modelValue.includes(g.id) && props.modelValue.length < BATAS_KECUALI_KELOMPOK) emit('update:modelValue', [...props.modelValue, g.id])
      editor.value = false; await baca()
      emit('disimpan')
    }
  } finally { simpanAktif.value = false }
}
watch([editor, simpanAktif, membuka], () => emit('sibuk', editor.value || simpanAktif.value || membuka.value), { immediate: true })
const labels = useCashflowMuat()
watch(() => props.modelValue, ids => { for (const id of ids.filter(x => !nama[x])) void labels.aksi(async () => { const p = await api.detailKelompokPengumuman(id); nama[id] = p.name }) }, { immediate: true })
onMounted(() => { void baca() })
onBeforeUnmount(() => { batal(); labels.batal(); emit('sibuk', false) })
</script>
<template>
  <div class="min-w-0 space-y-3">
    <div class="flex gap-2"><input v-model="cari" :aria-label="labelCari || tcf('pengumuman.kelompok.cari')" class="ca-input min-w-0 flex-1" :placeholder="tcf('pengumuman.kelompok.cariKet')" :disabled="disabled" @keydown.enter.prevent="cariKelompok"><button type="button" class="ca-btn-secondary" :disabled="disabled || memuat" @click="cariKelompok">{{ tcf('pengumuman.akun.cariTombol') }}</button></div>
    <p v-if="pesanGalat" class="text-xs ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.kelompok.dipilih')(modelValue.length) }}</p>
    <div class="flex flex-wrap gap-2"><button v-for="id in modelValue" :key="id" type="button" class="ca-pill-muted !min-h-11 break-all text-xs" :disabled="disabled" :aria-label="tcf('pengumuman.kelompok.hapus')(nama[id] || id)" @click="pilih(id)">{{ nama[id] || id }} <span aria-hidden="true">×</span></button></div>
    <div class="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--ca-border)]" :aria-busy="memuat">
      <div v-for="p in rows" :key="p.id" class="flex min-h-12 items-center gap-2 border-b border-[color:var(--ca-border)] p-2 last:border-b-0"><label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" :checked="modelValue.includes(p.id)" :disabled="disabled || (!modelValue.includes(p.id) && modelValue.length >= BATAS_KECUALI_KELOMPOK)" @change="pilih(p.id)"><span class="min-w-0 break-words text-xs text-[var(--ca-text)]">{{ p.name }}<span class="block text-[var(--ca-muted)]">{{ tcf('pengumuman.kelompok.anggota')(p.members) }}</span></span></label><button type="button" class="ca-btn-ghost !min-h-11 !px-2 text-xs" :disabled="disabled || membuka" @click="sunting(p.id)">{{ tcf('pengumuman.sunting') }}</button></div>
      <p v-if="!rows.length" class="p-3 text-xs text-[var(--ca-muted)]">{{ memuat ? tcf('pengumuman.akun.memuat') : tcf('pengumuman.kelompok.kosong') }}</p>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-[var(--ca-muted)]"><button type="button" class="ca-btn-secondary !min-h-11 !px-2" :disabled="disabled || memuat || halaman === 0" @click="pindah(halaman - 1)">{{ tcf('pengumuman.akun.sebelumnya') }}</button><span>{{ halaman + 1 }} / {{ Math.max(1, Math.ceil(total / 25)) }}</span><button type="button" class="ca-btn-secondary !min-h-11 !px-2" :disabled="disabled || memuat || (halaman + 1) * 25 >= total" @click="pindah(halaman + 1)">{{ tcf('pengumuman.akun.berikutnya') }}</button></div>
    <button type="button" class="ca-btn-secondary w-full" :disabled="disabled" @click="baru">{{ tcf('pengumuman.kelompok.buat') }}</button>
    <div v-if="editor" class="space-y-3 border-t border-[color:var(--ca-border)] pt-3" role="group" :aria-label="tcf('pengumuman.kelompok.editor')">
      <fieldset :disabled="simpanAktif" class="space-y-3">
        <label class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.kelompok.nama') }}<input v-model="g.nama" :aria-label="tcf('pengumuman.kelompok.nama')" maxlength="80" class="ca-input mt-2 w-full"></label>
        <CashflowPengumumanPengguna v-model="g.pengguna" :disabled="simpanAktif" />
        <label class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.kelompok.alasan') }}<input v-model="g.alasan" :aria-label="tcf('pengumuman.kelompok.alasan')" class="ca-input mt-2 w-full"></label>
        <div class="flex justify-end gap-2"><button type="button" class="ca-btn-secondary" @click="editor = false">{{ tcf('umum.batal') }}</button><button type="button" class="ca-btn-primary" @click="simpan">{{ simpanAktif ? tcf('pengumuman.menyimpan') : tcf('pengumuman.kelompok.simpan') }}</button></div>
      </fieldset>
    </div>
  </div>
</template>
