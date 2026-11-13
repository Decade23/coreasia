<script setup lang="ts">
import type { AkunPenerima } from '~/adapters/cashflowPengumuman'
const props = defineProps<{ modelValue: string[]; tunggal?: boolean; disabled?: boolean; labelCari?: string; batas?: number }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const batas = computed(() => props.batas ?? 1000)
const { muat, pesanGalat, memuat, batal } = useCashflowMuat()
const cari = ref(''), kueri = ref(''), halaman = ref(0), total = ref(0)
const rows = ref<AkunPenerima[]>([])
const label = reactive<Record<string, string>>({})
const baca = () => muat(async terbaru => {
  const hasil = await api.penggunaPengumuman(kueri.value, halaman.value * 25)
  if (!terbaru()) return
  rows.value = hasil.baris; total.value = Number(hasil.total)
  for (const p of hasil.baris) label[p.id] = p.email
})
const cariAkun = () => { kueri.value = cari.value.trim(); halaman.value = 0; void baca() }
const pindah = (n: number) => { halaman.value = n; void baca() }
const pilih = (id: string) => {
  if (props.disabled) return
  const ids = props.modelValue.includes(id) ? props.modelValue.filter(x => x !== id) : props.tunggal ? [id] : [...props.modelValue, id]
  if (ids.length <= batas.value) emit('update:modelValue', ids)
}
const labelMuat = useCashflowMuat()
watch(() => props.modelValue, ids => {
  const hilang = ids.filter(id => !label[id])
  if (hilang.length) void labelMuat.muat(async terbaru => {
    const hasil = await api.penggunaPengumuman('', 0, hilang)
    if (terbaru()) for (const p of hasil.baris) label[p.id] = p.email
  })
}, { immediate: true })
onMounted(() => { void baca() })
onBeforeUnmount(() => { batal(); labelMuat.batal() })
</script>
<template>
  <div class="min-w-0 space-y-3">
    <div class="flex gap-2"><input v-model="cari" :aria-label="labelCari || tcf('pengumuman.akun.cari')" class="ca-input min-w-0 flex-1" :placeholder="tcf('pengumuman.akun.cariKet')" :disabled="disabled" @keydown.enter.prevent="cariAkun"><button type="button" class="ca-btn-secondary" :disabled="disabled || memuat" @click="cariAkun">{{ tcf('pengumuman.akun.cariTombol') }}</button></div>
    <p v-if="pesanGalat || labelMuat.pesanGalat.value" class="text-xs ca-tone-danger" role="alert">{{ pesanGalat || labelMuat.pesanGalat.value }}</p>
    <p class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.akun.dipilih')(modelValue.length) }}</p>
    <div v-if="modelValue.length" class="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
      <button v-for="id in modelValue" :key="id" type="button" class="ca-pill-muted max-w-full break-all !min-h-11 text-xs" :disabled="disabled" :aria-label="tcf('pengumuman.akun.hapus')(label[id] || id)" @click="pilih(id)">{{ label[id] || id }} · {{ id.slice(0, 8) }} <span aria-hidden="true">×</span></button>
    </div>
    <div class="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--ca-border)]" :aria-busy="memuat">
      <label v-for="p in rows" :key="p.id" class="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[color:var(--ca-border)] px-3 py-2 last:border-b-0">
        <input :type="tunggal ? 'radio' : 'checkbox'" :name="tunggal ? 'cf-penerima-akun' : undefined" :checked="modelValue.includes(p.id)" :disabled="disabled || (!tunggal && modelValue.length >= batas && !modelValue.includes(p.id))" class="accent-[var(--ca-accent)]" @change="pilih(p.id)">
        <span class="min-w-0 text-xs"><span class="block break-all text-[var(--ca-text)]">{{ p.email || tcf('pengumuman.akun.tanpaEmail') }}</span><span class="text-[var(--ca-muted)]" :title="p.id">{{ p.id.slice(0, 8) }}</span></span>
      </label>
      <p v-if="!rows.length" class="p-3 text-xs text-[var(--ca-muted)]">{{ memuat ? tcf('pengumuman.akun.memuat') : tcf('pengumuman.akun.kosong') }}</p>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-[var(--ca-muted)]"><button type="button" class="ca-btn-secondary !min-h-11 !px-3" :disabled="disabled || memuat || halaman === 0" @click="pindah(halaman - 1)">{{ tcf('pengumuman.akun.sebelumnya') }}</button><span>{{ halaman + 1 }} / {{ Math.max(1, Math.ceil(total / 25)) }} · {{ tcf('pengumuman.akun.total')(total) }}</span><button type="button" class="ca-btn-secondary !min-h-11 !px-3" :disabled="disabled || memuat || (halaman + 1) * 25 >= total" @click="pindah(halaman + 1)">{{ tcf('pengumuman.akun.berikutnya') }}</button></div>
  </div>
</template>
