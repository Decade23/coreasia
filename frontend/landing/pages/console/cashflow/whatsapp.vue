<script setup lang="ts">
/**
 * CashFlow > WhatsApp: laporan catat lewat WhatsApp (spek catat WA lanjutan
 * 27 Nov 2026, K-9, B-2). Satu RPC admin_wa_catat_laporan, periode 24 jam,
 * 7 hari, atau 30 hari (?hari=), akun tim dikecualikan kecuali dipilih ikut
 * (?tim=). Bentuk jawaban dan dua umur datanya ada di
 * adapters/cashflowWaLaporan.ts.
 *
 * Identitas per pengguna mengikuti sakelar Kontak lengkap yang sama dengan
 * daftar Pengguna dan Ruang (state cf_kontak_disamarkan_oleh): sesi ber-pii
 * dengan sakelar menyala mengirim alasan tetap (ALASAN_LAPORAN_WA) dan server
 * mengirim email serta nama utuh. Sesi ber-pii tanpa alasan menerima email
 * tersamar. Sesi lihat saja tidak menerima daftar orang sama sekali. Server
 * mencatat audit setiap muatan ber-pii.
 *
 * Server yang belum memasang migrasinya menjawab PGRST202: halaman menulis
 * "belum aktif", bukan galat merah. Sesi yang kehilangan pii di tengah jalan
 * dimuat ulang tersamar.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { opsiDari } from '~/adapters/cashflowLaporan'
import { ALASAN_LAPORAN_WA, PERIODE_WA, TIM_WA, keLaporanWa, type LaporanWa, type PeriodeWa, type TimWa } from '~/adapters/cashflowWaLaporan'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { user } = useAdminAuth()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })

const SKEMA = {
  hari: { jenis: 'pilihan', opsi: PERIODE_WA, bawaan: '7' },
  tim: { jenis: 'pilihan', opsi: TIM_WA, bawaan: 'tanpa' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const laporan = shallowRef<LaporanWa | null>(null)
/** Kunci muatan yang terakhir berhasil (penanda uji dan pemeriksa basi). */
const kunciTampil = ref('')
const izinPribadi = computed(() => sesi.boleh('cashflow:pii'))
/* Sakelar Kontak lengkap yang sama dengan daftar Pengguna dan Ruang. */
const kontakDisamarkanOleh = useState<string | null>('cf_kontak_disamarkan_oleh', () => null)
const samarkan = computed(() => !!user.value?.id && kontakDisamarkanOleh.value === user.value.id)
const perluVerifikasi = ref(false)

const muatLaporan = () => muat(async (terbaru) => {
  const hari = Number(q.value.hari)
  const kecuali = q.value.tim === 'tanpa'
  const alasan = izinPribadi.value && !samarkan.value ? ALASAN_LAPORAN_WA : null
  let d
  try {
    d = await api.waCatatLaporan(hari, kecuali, alasan)
  } catch (e) {
    // Server menurunkan sesi selagi tab terbuka: muat ulang tersamar, bukan galat.
    if (!(e instanceof GalatAdmin) || e.jenis !== 'izin' || !alasan) throw e
    perluVerifikasi.value = true
    d = await api.waCatatLaporan(hari, kecuali, null)
  }
  if (!terbaru()) return
  laporan.value = keLaporanWa(d)
  kunciTampil.value = `${hari}|${q.value.tim}|${laporan.value.terbuka ? 'terbuka' : 'samar'}`
})
watch(() => [q.value.hari, q.value.tim, izinPribadi.value], () => { void muatLaporan() })
onMounted(() => { void muatLaporan() })
onBeforeUnmount(batal)

const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const izinDitolak = computed(() => galat.value?.jenis === 'izin')
const opsiHari = computed(() => opsiDari(PERIODE_WA, h => tcf(`waCatat.periode.${h}`) as string))
const opsiTim = computed(() => opsiDari(TIM_WA, t => tcf(`waCatat.tim.${t}`) as string))
const pilihHari = (h: PeriodeWa) => { void setel({ hari: h }) }
const pilihTim = (t: TimWa) => { void setel({ tim: t }) }

const gantiKontak = () => {
  const pelaku = user.value?.id
  if (!pelaku || !izinPribadi.value) { perluVerifikasi.value = true; return }
  kontakDisamarkanOleh.value = samarkan.value ? null : pelaku
  // Menyamarkan tidak menunggu jaringan: identitas utuh dibuang dari layar lebih dulu.
  if (samarkan.value && laporan.value) laporan.value = { ...laporan.value, pengguna: [], terbuka: false }
  void muatLaporan()
}

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.whatsapp') },
])
</script>

<template>
  <div class="space-y-5" data-uji="wa-laporan" :data-kunci="kunciTampil">
    <ConsolePageHeader :title="tcf('waCatat.judul')" :description="tcf('waCatat.ket')" kicker="CashFlow" ringkas>
      <template #meta><CashflowNav /></template>
      <template #actions>
        <button type="button" class="ca-btn-secondary inline-flex items-center gap-2" :disabled="memuat" data-uji="wa-muat-ulang" @click="muatLaporan()">
          <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="memuat ? 'animate-spin' : ''" aria-hidden="true" />{{ tcf('waCatat.muatUlang') }}
        </button>
      </template>
    </ConsolePageHeader>

    <div class="flex flex-wrap items-center gap-2.5" data-uji="wa-alat">
      <CashflowSegmen :opsi="opsiHari" :nilai="q.hari" :label="tcf('waCatat.periodeLabel')" @pilih="pilihHari" />
      <CashflowSegmen :opsi="opsiTim" :nilai="q.tim" :label="tcf('waCatat.timLabel')" gulir @pilih="pilihTim" />
      <CashflowSakelarKontak
        v-if="izinPribadi && !belumAktif" class="sm:ml-auto" :terbuka="!!laporan?.terbuka" :mati="memuat && !laporan?.terbuka"
        :label="tcf('pengguna.kontakPenuh')" @ganti="gantiKontak"
      />
    </div>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="wa-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('waCatat.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="izinDitolak" baca />
    <CashflowKeadaan
      v-else-if="pesanGalat" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatLaporan()"
    />
    <CashflowKeadaan v-else-if="!laporan" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="6" :kolom="4" />
    <CashflowWaLaporanIsi v-else :laporan="laporan" :perlu-verifikasi="perluVerifikasi" />
  </div>
</template>
