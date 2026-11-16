<script setup lang="ts">
/**
 * Ubin angka: satu angka besar, label, dan pembanding periode.
 *
 * Mengikuti pola ubin yang sudah ada di pages/console/index.vue — kotak ikon
 * `rounded-xl bg-<warna>-500/10`, angka `text-2xl font-bold`, panel dan garis
 * lewat var(--ca-*) supaya ikut terang/gelap. Bukan pustaka grafik: pada 16
 * pengguna, satu angka yang jujur lebih berguna daripada donat yang kosong.
 *
 * `pembanding` = nilai periode sebelumnya; ∆ dihitung di sini supaya semua
 * ubin menghitung dengan cara yang sama. `utama` = ubin ukuran keberhasilan:
 * lebih besar, dan label pembandingnya menyebut jendela waktunya.
 *
 * Warna hanya lewat token --ca-* (terang/gelap sudah diatur main.css), tidak
 * ada kelas palet Tailwind mentah. 'netral' untuk angka yang bukan kabar baik
 * maupun buruk.
 */
const props = withDefaults(defineProps<{
  label: string
  nilai: string | number
  pembanding?: number | null
  nilaiMentah?: number | null
  keterangan?: string
  icon?: string
  warna?: 'amber' | 'emerald' | 'sky' | 'rose' | 'netral'
  utama?: boolean
}>(), { pembanding: null, nilaiMentah: null, keterangan: '', icon: 'lucide:hash', warna: 'amber', utama: false })
const { tcf } = useCashflowI18n()

const delta = computed(() => {
  if (props.pembanding == null || props.nilaiMentah == null) return null
  return props.nilaiMentah - props.pembanding
})
/* Nilai panjang (rupiah miliaran) memakai huruf sedikit lebih kecil supaya tetap satu baris di ubin sempit. */
const panjang = computed(() => String(props.nilai).length > 14)
const warnaKotak: Record<string, string> = {
  amber: 'bg-[var(--ca-gold-bg)] ca-tone-gold',
  emerald: 'bg-[var(--ca-emerald-bg)] ca-tone-emerald',
  sky: 'bg-[var(--ca-info-bg)] ca-tone-info',
  rose: 'bg-[var(--ca-danger-bg)] ca-tone-danger',
  netral: 'bg-[var(--ca-panel-bg-strong)] text-[var(--ca-muted)]',
}
</script>

<template>
  <!-- Ikon dan label sebaris, lalu angkanya memakai lebar ubin penuh supaya
       nilai panjang (rupiah miliaran) tidak turun jadi dua baris. -->
  <div class="ca-console-stat min-w-0" :class="utama ? 'sm:col-span-2' : ''">
    <div class="flex items-center gap-3">
      <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="warnaKotak[warna]">
        <Icon :name="icon" class="h-[1.125rem] w-[1.125rem]" />
      </span>
      <p class="min-w-0 text-[0.8125rem] font-bold leading-snug text-[var(--ca-subtle)]">{{ label }}</p>
    </div>
    <p class="mt-2 break-words font-bold text-[var(--ca-text)] tabular-nums" :class="utama ? 'text-4xl' : panjang ? 'text-xl' : 'text-2xl'">{{ nilai }}</p>
    <p v-if="delta != null" class="mt-1 text-xs tabular-nums" :class="delta > 0 ? 'ca-tone-emerald' : delta < 0 ? 'ca-tone-danger' : 'text-[var(--ca-subtle)]'">
      {{ delta > 0 ? '+' : '' }}{{ delta }} <span class="text-[var(--ca-subtle)]">{{ tcf('umum.vsSebelumnya') }} ({{ pembanding }})</span>
    </p>
    <p v-if="keterangan" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ keterangan }}</p>
  </div>
</template>
