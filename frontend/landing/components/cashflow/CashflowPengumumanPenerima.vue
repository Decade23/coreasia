<script setup lang="ts">
/**
 * Pilihan penerima pengumuman. Jenis lama (semua, satu, beberapa,
 * kelompok) tetap sama: daftar beku saat disimpan, dihitung lewat
 * admin_jumlah_penerima_pengumuman. Jenis `aturan` hanya ditawarkan bila
 * server sudah memasang sasaran berbasis aturan (`aturanAktif`); hitungannya
 * milik kotak pratinjau penerima di halaman, bukan baris jumlah di sini.
 */
import { PILIHAN_PENERIMA, type JenisPenerima } from '~/adapters/cashflowPengumuman'
import type { Aturan, AturanDTO } from '~/adapters/cashflowPengumumanAturan'
const props = defineProps<{
  jenis: JenisPenerima; pengguna: string[]; kelompok: string[]; disabled?: boolean
  /** Server punya RPC v4: pilihan "Otomatis dengan aturan" ditawarkan. */
  aturanAktif?: boolean
  /** Aturan tersimpan saat menyunting (dibaca sekali oleh editor aturan). */
  aturanAwal?: Aturan | null
}>()
const emit = defineEmits<{
  'update:jenis': [JenisPenerima]; 'update:pengguna': [string[]]; 'update:kelompok': [string[]]; 'update:aturan': [AturanDTO | null]; sibuk: [boolean]
}>()
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const pilihan = computed(() => PILIHAN_PENERIMA.filter(p => p.id !== 'aturan' || props.aturanAktif || props.jenis === 'aturan'))
const ringkasan = useCashflowMuat(), jumlah = ref<number | null>(null)
const hitung = () => {
  jumlah.value = null
  if (props.jenis === 'aturan') { ringkasan.batal(); return }
  return ringkasan.muat(async terbaru => {
    const n = await api.jumlahPenerimaPengumuman(props.jenis, props.pengguna, props.kelompok)
    if (terbaru()) jumlah.value = Number(n)
  })
}
watch(() => [props.jenis, props.pengguna, props.kelompok], () => { void hitung() }, { immediate: true, deep: true })
const kelompokSibuk = ref(false), aturanSibuk = ref(false)
watch([kelompokSibuk, aturanSibuk], () => emit('sibuk', kelompokSibuk.value || aturanSibuk.value), { immediate: true })
onBeforeUnmount(() => { ringkasan.batal(); emit('sibuk', false) })
</script>
<template>
  <fieldset class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" :disabled="disabled">
    <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.penerimaLabel') }}</legend>
    <select id="cf-p-penerima" :value="jenis" :aria-label="tcf('pengumuman.penerimaLabel')" class="ca-input w-full" @change="emit('update:jenis', ($event.target as HTMLSelectElement).value as JenisPenerima)"><option v-for="p in pilihan" :key="p.id" :value="p.id">{{ tcf(`pengumuman.penerimaOpsi.${p.id}`) }}</option></select>
    <template v-if="jenis !== 'aturan'">
      <p class="text-xs text-[var(--ca-muted)]" aria-live="polite">{{ jumlah === null ? ringkasan.memuat.value ? tcf('pengumuman.menghitung') : tcf('pengumuman.jumlahBelum') : tcf('pengumuman.jumlahPengguna')(jumlah) }}</p>
      <p v-if="ringkasan.pesanGalat.value" class="text-xs ca-tone-danger" role="alert">{{ ringkasan.pesanGalat.value }}</p>
    </template>
    <CashflowPengumumanPengguna v-if="jenis === 'single' || jenis === 'users'" :key="jenis" :model-value="pengguna" :tunggal="jenis === 'single'" :disabled="disabled" @update:model-value="emit('update:pengguna', $event)" />
    <CashflowPengumumanKelompok v-if="jenis === 'groups'" :model-value="kelompok" :disabled="disabled" @update:model-value="emit('update:kelompok', $event)" @sibuk="kelompokSibuk = $event" @disimpan="hitung" />
    <CashflowPengumumanAturan v-if="jenis === 'aturan'" :awal="aturanAwal ?? null" :disabled="disabled" @update:aturan="emit('update:aturan', $event)" @sibuk="aturanSibuk = $event" />
  </fieldset>
</template>
