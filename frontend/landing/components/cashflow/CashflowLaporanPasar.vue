<script setup lang="ts">
/**
 * Minat Kilas Pasar di halaman Laporan (spek analitik pasar dan promo 23 Nov
 * 2026, AP-7). Organism yang memuat datanya sendiri (pola
 * CashflowLaporanKebiasaan): satu RPC admin_laporan_pasar berizin view tanpa
 * audit, rentang hari dari pemilih halaman Laporan. Isinya digambar
 * CashflowLaporanPasarIsi.
 *
 * Galat hanya tampil di bagian ini, halaman Laporan lain tetap jalan. Server
 * yang belum memasang migrasinya menjawab PGRST202 (atau 42883 yang menyebut
 * fungsi ini sendiri): bagian ini menulis kalimat tenang "belum aktif",
 * bukan galat merah.
 */
import { keMinatPasar, type MinatPasar } from '~/adapters/cashflowLaporanPasar'

const props = defineProps<{ hari: number }>()

const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })

const minat = shallowRef<MinatPasar | null>(null)
/** Rentang yang terakhir berhasil tampil (penanda uji dan pemeriksa basi). */
const kunciTampil = ref('')

const muatPasar = () => muat(async (terbaru) => {
  const hari = props.hari
  const d = await api.laporanPasar(hari)
  if (!terbaru()) return
  minat.value = keMinatPasar(d)
  kunciTampil.value = String(hari)
})
watch(() => props.hari, () => { void muatPasar() })
onMounted(() => { void muatPasar() })
onBeforeUnmount(batal)

const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const izinDitolak = computed(() => galat.value?.jenis === 'izin')
</script>

<template>
  <div class="min-w-0" data-uji="pasar" :data-kunci="kunciTampil">
    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="laporan-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('laporan.pasar.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="izinDitolak" baca />
    <CashflowKeadaan
      v-else-if="pesanGalat" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatPasar()"
    />
    <CashflowKeadaan v-else-if="!minat" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="5" :kolom="3" />
    <CashflowLaporanPasarIsi v-else :minat="minat" />
  </div>
</template>
