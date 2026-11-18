<script setup lang="ts">
/**
 * Pengecualian penerima pengumuman: akun internal, pengguna, dan kelompok.
 * Dipakai di SEMUA mode penerima (spek console 19 Nov 2026, K8, PF-03): editor
 * aturan, mode semua, satu, beberapa pengguna, dan kelompok, serta templat
 * pengumuman rutin (akun internal selalu dikecualikan: `internalTetap`).
 *
 * Hanya isian. Halaman atau editor yang mengubah pilihan ini menjadi
 * audience_rules (adapters/cashflowPengumumanForm penerimaKirim).
 */
import { BATAS_KECUALI_PENGGUNA } from '~/adapters/cashflowPengumumanAturan'

const props = defineProps<{
  internal: boolean
  pengguna: string[]
  kelompok: string[]
  disabled?: boolean
  /** Akun internal selalu dikecualikan (pengumuman rutin): kotak tercentang dan terkunci. */
  internalTetap?: boolean
  /** Keterangan di bawah judul, mis. jangkauan aplikasi lama. */
  ket?: string
  /** Pesan galat untuk seluruh bagian (galat server atau batas). */
  galat?: string
}>()
const emit = defineEmits<{ 'update:internal': [boolean]; 'update:pengguna': [string[]]; 'update:kelompok': [string[]]; sibuk: [boolean] }>()
const { tcf } = useCashflowI18n()
const id = useId()
const bukaPengguna = ref(props.pengguna.length > 0)
const bukaKelompok = ref(props.kelompok.length > 0)
const kelompokSibuk = ref(false)
watch(kelompokSibuk, v => emit('sibuk', v))
onBeforeUnmount(() => emit('sibuk', false))
</script>

<template>
  <fieldset class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3" :disabled="disabled" data-uji="kecuali-penerima" :aria-describedby="galat ? `${id}-galat` : undefined">
    <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.kecualiJudul') }}</legend>
    <p v-if="ket" class="text-xs text-[var(--ca-subtle)]">{{ ket }}</p>
    <label class="flex items-start gap-2 text-xs text-[var(--ca-text)]">
      <input
        :checked="internalTetap || internal" type="checkbox" class="mt-0.5 accent-[var(--ca-accent)]" :disabled="disabled || internalTetap"
        data-uji="kecuali-internal" @change="emit('update:internal', ($event.target as HTMLInputElement).checked)"
      >
      <span>{{ tcf('pengumuman.aturan.kecualiInternal') }}<span class="block text-[var(--ca-muted)]">{{ internalTetap ? tcf('pengumuman.form.internalTetap') : tcf('pengumuman.aturan.kecualiInternalKet') }}</span></span>
    </label>
    <div class="space-y-2">
      <button type="button" class="ca-btn-ghost !min-h-11 w-full justify-between !px-2 text-xs" :aria-expanded="bukaPengguna" @click="bukaPengguna = !bukaPengguna">
        <span>{{ tcf('pengumuman.aturan.kecualiPengguna') }} · {{ pengguna.length }}</span><Icon :name="bukaPengguna ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4" />
      </button>
      <CashflowPengumumanPengguna v-if="bukaPengguna" :model-value="pengguna" :batas="BATAS_KECUALI_PENGGUNA" :label-cari="tcf('pengumuman.aturan.kecualiPengguna')" :disabled="disabled" @update:model-value="emit('update:pengguna', $event)" />
    </div>
    <div class="space-y-2">
      <button type="button" class="ca-btn-ghost !min-h-11 w-full justify-between !px-2 text-xs" :aria-expanded="bukaKelompok" @click="bukaKelompok = !bukaKelompok">
        <span>{{ tcf('pengumuman.aturan.kecualiKelompok') }} · {{ kelompok.length }}</span><Icon :name="bukaKelompok ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4" />
      </button>
      <CashflowPengumumanKelompok v-if="bukaKelompok" :model-value="kelompok" :label-cari="tcf('pengumuman.aturan.kecualiKelompok')" :disabled="disabled" @update:model-value="emit('update:kelompok', $event)" @sibuk="kelompokSibuk = $event" />
    </div>
    <p v-if="galat" :id="`${id}-galat`" class="text-xs ca-tone-danger" role="alert">{{ galat }}</p>
  </fieldset>
</template>
