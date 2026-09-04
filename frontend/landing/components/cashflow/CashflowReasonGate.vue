<script setup lang="ts">
/**
 * Gerbang alasan — muncul SEBELUM data pribadi ditampilkan.
 *
 * Preset wajib dilengkapi minimal 8 aksara (nomor tiket, nama pelapor,
 * konteks) supaya preset tidak jadi cap karet "cek, cek, cek". Penjaga yang
 * menentukan tetap di server (22023 bila < 8 aksara); yang di sini hanya
 * supaya orang tidak menunggu perjalanan jaringan untuk tahu alasannya kurang.
 *
 * `investigasi` = varian untuk membuka catatan bebas: hanya satu preset,
 * dan aksinya dicatat sebagai baris audit terpisah oleh pemanggil.
 */
const props = withDefaults(defineProps<{
  show: boolean
  investigasi?: boolean
}>(), { investigasi: false })
const emit = defineEmits<{ close: []; konfirmasi: [alasan: string] }>()
const { tcf } = useCashflowI18n()

const presetTerpilih = ref<string>('')
const tambahan = ref('')
const galat = ref('')

const preset = computed<Array<{ kunci: string; label: string }>>(() => {
  const p = tcf('alasan.preset') as Record<string, string>
  const semua = Object.entries(p).map(([kunci, label]) => ({ kunci, label }))
  return props.investigasi ? semua.filter(x => x.kunci === 'galat' || x.kunci === 'penyalahgunaan') : semua
})

const alasanLengkap = computed(() => {
  const label = preset.value.find(p => p.kunci === presetTerpilih.value)?.label ?? ''
  return [label, tambahan.value.trim()].filter(Boolean).join(' — ')
})
const cukup = computed(() => !!presetTerpilih.value && tambahan.value.trim().length >= 8)

watch(() => props.show, (s) => { if (s) { presetTerpilih.value = ''; tambahan.value = ''; galat.value = '' } })

const kirim = () => {
  if (!cukup.value) { galat.value = tcf('alasan.pendek'); return }
  emit('konfirmasi', alasanLengkap.value)
}
</script>

<template>
  <ConsoleModal :show="show" :title="tcf('alasan.judul')" @close="emit('close')">
    <p class="text-sm leading-relaxed text-[var(--ca-muted)]">
      {{ investigasi ? tcf('alasan.investigasi') : tcf('alasan.ket') }}
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="p in preset" :key="p.kunci" type="button"
        class="rounded-full border px-3 py-1 text-sm transition"
        :class="presetTerpilih === p.kunci
          ? 'border-amber-500 bg-amber-500/10 text-[var(--ca-text)]'
          : 'border-[color:var(--ca-border)] text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
        @click="presetTerpilih = p.kunci"
      >{{ p.label }}</button>
    </div>
    <label class="mt-4 block">
      <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('umum.alasan') }}</span>
      <textarea
        v-model="tambahan" rows="3"
        class="mt-1 w-full rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-2 text-sm text-[var(--ca-text)] outline-none focus:border-amber-500"
        :placeholder="tcf('alasan.lengkapi')"
        @keydown.meta.enter.prevent="kirim"
      />
    </label>
    <p v-if="galat" class="mt-2 text-xs text-rose-600">{{ galat }}</p>
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" class="ca-btn-secondary" @click="emit('close')">{{ tcf('umum.batal') }}</button>
      <button type="button" class="ca-btn-primary" :disabled="!cukup" @click="kirim">{{ tcf('alasan.buka') }}</button>
    </div>
  </ConsoleModal>
</template>
