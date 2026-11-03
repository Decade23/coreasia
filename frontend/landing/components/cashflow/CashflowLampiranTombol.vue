<script setup lang="ts">
/**
 * Tombol "Lihat foto" (0122) untuk SATU baris: transaksi, struk, atau
 * pelunasan. Pola sama dengan CashflowTeksTerkunci: satu klik, tanpa dialog
 * alasan; kasus anak ber-ranah foto dibuka (atau dipakai ulang) otomatis,
 * lalu admin-lampiran memulangkan tautan sementara dan menulis satu baris
 * audit buka_foto. Foto TIDAK pernah diambil sebelum diklik.
 *
 * Fotonya tampil di CashflowLampiranPenampil yang dipasang induk Pengguna 360
 * dan Ruang 360. Galat lewat useCashflowMuat.aksi seperti "Tampilkan catatan":
 * tanpa TOTP → "Butuh login console ber-TOTP.", sesi hilang → /masuk.
 *
 * `sasaran` null = baris tanpa foto: komponen tidak merender apa pun, jadi
 * pemanggil cukup meneruskan hasil lampiranTransaksi/lampiranStruk/… .
 */
import type { SasaranLampiran } from '~/adapters/cashflowLampiran'

const props = defineProps<{ sasaran: SasaranLampiran | null }>()

const { tcf } = useCashflowI18n()
const kasus = useCashflowKasus()
const { aksi } = useCashflowMuat()
const sibuk = ref(false)

const lihat = async () => {
  const s = props.sasaran
  if (!s || sibuk.value) return
  sibuk.value = true
  try {
    await aksi(() => kasus.lihatFoto(s))
  } finally {
    sibuk.value = false
  }
}
</script>

<template>
  <button
    v-if="sasaran" type="button"
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[color:var(--ca-border)] px-2 py-0.5 text-xs text-[var(--ca-muted)] transition hover:border-[color:var(--ca-gold-border)] hover:text-[var(--ca-text)] disabled:opacity-60"
    :disabled="sibuk" :aria-busy="sibuk" :title="tcf('lampiran.lihatKet')"
    @click.stop="lihat"
  >
    <Icon :name="sibuk ? 'lucide:loader-2' : 'lucide:image'" class="h-3 w-3" :class="{ 'animate-spin': sibuk }" aria-hidden="true" />
    {{ tcf('lampiran.lihat') }}
  </button>
</template>
