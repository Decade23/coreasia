<script setup lang="ts">
/**
 * Panel saringan penerima pengumuman (P2): versi aplikasi, tanggal daftar,
 * aktif terakhir, ruang, Domi, dan nomor WhatsApp. Hanya isian: tidak
 * memanggil server. Pemeriksaan bentuknya milik adapter (periksaIsianSaring),
 * kode galatnya diterima lewat `galat` dan ditulis di bawah isian yang salah.
 *
 * Versi memakai nama rilis Play (RILIS_PLAY) bila kodenya dikenal. Kode lain
 * tetap bisa diketik lewat "Kode lain".
 */
import { PILIHAN_VERSI, RUANG_SARING, NOMOR_WA_SARING, VERSI_TAK_DIKETAHUI, AKTIF_HARI_MAKS, type IsianSaring, type KodeGalatSaring } from '~/adapters/cashflowPengumumanAturan'
import { RILIS_PLAY } from '~/adapters/cashflowVersi'

const props = defineProps<{ modelValue: IsianSaring; galat?: readonly KodeGalatSaring[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [IsianSaring] }>()
const { tcf } = useCashflowI18n()
const id = useId()

const ubah = <K extends keyof IsianSaring>(k: K, v: IsianSaring[K]) => emit('update:modelValue', { ...props.modelValue, [k]: v })
const nilai = (e: Event) => (e.target as HTMLInputElement | HTMLSelectElement).value

/* Pilihan versi: '' tanpa batas, kode rilis yang dikenal, atau 'lain' (ketik kode). */
type ModeVersi = string
const modeDari = (t: string): ModeVersi => (!t.trim() ? '' : RILIS_PLAY[Number(t)] && /^\d+$/.test(t.trim()) ? String(Number(t)) : 'lain')
const mode = reactive({ versiMin: modeDari(props.modelValue.versiMin), versiDiBawah: modeDari(props.modelValue.versiDiBawah) })
watch(() => props.modelValue.versiMin, t => { if (!(mode.versiMin === 'lain' && !t.trim())) mode.versiMin = modeDari(t) })
watch(() => props.modelValue.versiDiBawah, t => { if (!(mode.versiDiBawah === 'lain' && !t.trim())) mode.versiDiBawah = modeDari(t) })
const pilihVersi = (k: 'versiMin' | 'versiDiBawah', v: string) => {
  mode[k] = v
  if (v === 'lain') { if (modeDari(props.modelValue[k]) !== 'lain') ubah(k, '') }
  else ubah(k, v)
}
const adaVersi = computed(() => !!props.modelValue.versiMin.trim() || !!props.modelValue.versiDiBawah.trim() || mode.versiMin === 'lain' || mode.versiDiBawah === 'lain')
const salah = (k: KodeGalatSaring) => !!props.galat?.includes(k)
const galatVersi = computed(() => (['versiMin', 'versiDiBawah', 'versiTerbalik'] as const).filter(salah))
const galatDaftar = computed(() => (['daftarSejak', 'daftarSampai', 'daftarTerbalik'] as const).filter(salah))
const TIGA = ['semua', 'ya', 'tidak'] as const
const dariOpsi = (v: string) => (v === 'semua' ? '' : v)
</script>

<template>
  <fieldset class="min-w-0 space-y-4" :disabled="disabled">
    <!-- Versi aplikasi -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.versi') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div v-for="k in (['versiMin', 'versiDiBawah'] as const)" :key="k" class="min-w-0 space-y-2">
          <label :for="`${id}-${k}`" class="block text-xs text-[var(--ca-muted)]">{{ tcf(`pengumuman.saring.${k}`) }}
            <select :id="`${id}-${k}`" :value="mode[k]" class="ca-input mt-1 w-full" :aria-invalid="salah(k) || undefined" @change="pilihVersi(k, nilai($event))">
              <option value="">{{ tcf('pengumuman.saring.versiTanpa') }}</option>
              <option v-for="v in PILIHAN_VERSI" :key="v.kode" :value="String(v.kode)">{{ v.versi }}</option>
              <option value="lain">{{ tcf('pengumuman.saring.versiLain') }}</option>
            </select>
          </label>
          <input
            v-if="mode[k] === 'lain'" :value="modelValue[k]" type="text" inputmode="numeric" autocomplete="off" class="ca-input w-full tabular-nums"
            placeholder="26111301" :aria-label="tcf('pengumuman.saring.versiKode')(tcf(`pengumuman.saring.${k}`))" :aria-invalid="salah(k) || undefined"
            @input="ubah(k, nilai($event))"
          >
        </div>
      </div>
      <label v-if="adaVersi" :for="`${id}-tak`" class="block text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.versiTakDiketahui') }}
        <select :id="`${id}-tak`" :value="modelValue.versiTakDiketahui" class="ca-input mt-1 w-full" @change="ubah('versiTakDiketahui', nilai($event) === 'tidak' ? 'tidak' : 'ikut')">
          <option v-for="v in VERSI_TAK_DIKETAHUI" :key="v" :value="v">{{ tcf(`pengumuman.saring.versiTakDiketahuiOpsi.${v}`) }}</option>
        </select>
      </label>
      <p v-for="g in galatVersi" :key="g" class="text-xs ca-tone-danger" role="alert">{{ tcf(`pengumuman.saring.galat.${g}`) }}</p>
    </div>

    <!-- Tanggal daftar -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.daftar') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label :for="`${id}-sejak`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.daftarSejak') }}
          <input :id="`${id}-sejak`" :value="modelValue.daftarSejak" type="date" class="ca-input mt-1 w-full" :aria-invalid="salah('daftarSejak') || undefined" @input="ubah('daftarSejak', nilai($event))">
        </label>
        <label :for="`${id}-sampai`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.daftarSampai') }}
          <input :id="`${id}-sampai`" :value="modelValue.daftarSampai" type="date" class="ca-input mt-1 w-full" :aria-invalid="salah('daftarSampai') || undefined" @input="ubah('daftarSampai', nilai($event))">
        </label>
      </div>
      <p v-for="g in galatDaftar" :key="g" class="text-xs ca-tone-danger" role="alert">{{ tcf(`pengumuman.saring.galat.${g}`) }}</p>
    </div>

    <!-- Aktif terakhir dan ruang -->
    <div class="grid gap-3 sm:grid-cols-2">
      <label :for="`${id}-aktif`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.aktif') }}
        <input :id="`${id}-aktif`" :value="modelValue.aktifHari" type="number" min="1" :max="AKTIF_HARI_MAKS" step="1" inputmode="numeric" class="ca-input mt-1 w-full tabular-nums" :aria-invalid="salah('aktifHari') || undefined" :aria-describedby="`${id}-aktif-ket`" @input="ubah('aktifHari', nilai($event))">
        <span :id="`${id}-aktif-ket`" class="mt-1 block text-[var(--ca-subtle)]">{{ tcf('pengumuman.saring.aktifKet') }}</span>
        <span v-if="salah('aktifHari')" class="mt-1 block ca-tone-danger" role="alert">{{ tcf('pengumuman.saring.galat.aktifHari') }}</span>
      </label>
      <label :for="`${id}-ruang`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.ruang') }}
        <select :id="`${id}-ruang`" :value="modelValue.ruang || 'semua'" class="ca-input mt-1 w-full" @change="ubah('ruang', dariOpsi(nilai($event)) as IsianSaring['ruang'])">
          <option v-for="r in ['semua', ...RUANG_SARING]" :key="r" :value="r">{{ tcf(`pengumuman.saring.ruangOpsi.${r}`) }}</option>
        </select>
      </label>
    </div>

    <!-- Domi dan nomor WhatsApp -->
    <div class="grid gap-3 sm:grid-cols-2">
      <label v-for="k in (['domiPakai', 'domiBeli', 'kreditHabis'] as const)" :key="k" :for="`${id}-${k}`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf(`pengumuman.saring.${k}`) }}
        <select :id="`${id}-${k}`" :value="modelValue[k] || 'semua'" class="ca-input mt-1 w-full" @change="ubah(k, dariOpsi(nilai($event)) as IsianSaring[typeof k])">
          <option v-for="t in TIGA" :key="t" :value="t">{{ tcf(`pengumuman.saring.tigaOpsi.${t}`) }}</option>
        </select>
      </label>
      <label :for="`${id}-wa`" class="block min-w-0 text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.saring.nomorWa') }}
        <select :id="`${id}-wa`" :value="modelValue.nomorWa || 'semua'" class="ca-input mt-1 w-full" @change="ubah('nomorWa', dariOpsi(nilai($event)) as IsianSaring['nomorWa'])">
          <option v-for="w in ['semua', ...NOMOR_WA_SARING]" :key="w" :value="w">{{ tcf(`pengumuman.saring.nomorWaOpsi.${w}`) }}</option>
        </select>
      </label>
    </div>
  </fieldset>
</template>
