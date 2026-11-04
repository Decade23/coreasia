<script setup lang="ts">
/**
 * Pager daftar console CashFlow, untuk halaman klien maupun server.
 *
 * Hanya tampilan: halaman yang benar (sudah dijepit) dan jumlahnya dihitung
 * pemanggil dari SELURUH baris yang sudah disaring dan diurut. Pager ini tidak
 * tahu apa-apa soal data, jadi tidak bisa menghitung dari halaman yang tampil.
 */
const props = defineProps<{ hal: number; jumlahHalaman: number; total: number; per: number; lompat?: boolean; memuat?: boolean }>()
const emit = defineEmits<{ ganti: [hal: number] }>()
const { tcf } = useCashflowI18n()

const dari = computed(() => (props.total ? (props.hal - 1) * props.per + 1 : 0))
const sampai = computed(() => Math.min(props.total, props.hal * props.per))
const tujuan = ref<string | number>(String(props.hal))
watch(() => props.hal, h => { tujuan.value = String(h) })
const lompatKe = () => {
  if (props.memuat) return
  const teks = String(tujuan.value).trim()
  const angka = Number(teks)
  if (!teks || !Number.isInteger(angka)) return
  const h = Math.min(Math.max(1, angka), props.jumlahHalaman)
  tujuan.value = String(h)
  if (h !== props.hal) emit('ganti', h)
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
    <span class="tabular-nums">{{ tcf('umum.rentang')(dari, sampai, total) }}</span>
    <div v-if="jumlahHalaman > 1" class="flex items-center gap-2">
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat || hal <= 1" @click="emit('ganti', hal - 1)">
        {{ tcf('umum.sebelumnya') }}
      </button>
      <span class="tabular-nums">{{ tcf('umum.halaman')(hal, jumlahHalaman) }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat || hal >= jumlahHalaman" @click="emit('ganti', hal + 1)">
        {{ tcf('umum.berikutnya') }}
      </button>
    </div>
    <form v-if="lompat && jumlahHalaman > 1" class="flex items-center gap-2" novalidate @submit.prevent="lompatKe">
      <label for="cf-lompat-halaman">{{ tcf('umum.keHalaman') }}</label>
      <input id="cf-lompat-halaman" v-model="tujuan" type="number" min="1" :max="jumlahHalaman" :disabled="memuat" inputmode="numeric" class="ca-input w-16 !px-2 !py-1 text-xs tabular-nums">
      <button type="submit" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat">{{ tcf('umum.pergi') }}</button>
    </form>
  </div>
</template>
