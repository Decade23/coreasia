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
 */
const props = withDefaults(defineProps<{
  label: string
  nilai: string | number
  pembanding?: number | null
  nilaiMentah?: number | null
  keterangan?: string
  icon?: string
  warna?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet'
  utama?: boolean
}>(), { pembanding: null, nilaiMentah: null, keterangan: '', icon: 'lucide:hash', warna: 'amber', utama: false })

const delta = computed(() => {
  if (props.pembanding == null || props.nilaiMentah == null) return null
  return props.nilaiMentah - props.pembanding
})
const warnaKotak: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  sky: 'bg-sky-500/10 text-sky-600',
  rose: 'bg-rose-500/10 text-rose-600',
  violet: 'bg-violet-500/10 text-violet-600',
}
</script>

<template>
  <div class="ca-console-stat" :class="utama ? 'sm:col-span-2' : ''">
    <div class="flex items-start gap-4">
      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="warnaKotak[warna]">
        <Icon :name="icon" class="h-5 w-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ label }}</p>
        <p class="mt-1 font-bold text-[var(--ca-text)] tabular-nums" :class="utama ? 'text-4xl' : 'text-2xl'">{{ nilai }}</p>
        <p v-if="delta != null" class="mt-1 text-xs tabular-nums" :class="delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-[var(--ca-subtle)]'">
          {{ delta > 0 ? '+' : '' }}{{ delta }} <span class="text-[var(--ca-subtle)]">vs periode sebelumnya ({{ pembanding }})</span>
        </p>
        <p v-if="keterangan" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ keterangan }}</p>
      </div>
    </div>
  </div>
</template>
