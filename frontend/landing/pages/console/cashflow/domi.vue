<script setup lang="ts">
/**
 * Domi: penyedia cadangan. Tempat menyalakan cadangan, memilih modelnya, dan
 * mengganti kunci API-nya.
 *
 * Domi dijawab penyedia utama. Bila penyedia utama bermasalah, server pindah
 * sendiri ke cadangan selama cadangan menyala dan kuncinya ada. Halaman ini
 * hanya mengatur setelannya. Kapan pindah, server yang memutuskan.
 *
 * Alur, izin, dan aturan kunci ada di useCashflowAiCadangan. Kontrak RPC ada
 * di adapters/cashflowAiCadangan.ts. Yang perlu diingat di sini:
 * - RPC yang belum terpasang (console tayang lebih dulu dari migrasinya)
 *   menampilkan "Belum tersedia di server", bukan galat merah.
 * - Membaca butuh cashflow:view, menulis butuh cashflow:pii (login console
 *   ber-TOTP), sama dengan Paket kredit.
 * - Kunci yang diketik dibuang saat halaman ditinggal (`buang`).
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const c = useCashflowAiCadangan()
const {
  keadaan, memuat, galat, pesanGalat, belumAktif, bolehUbah, sibuk, isianAktif, isianModel, alasanSimpan, bisaSimpan, butuhKunci,
  kunci, galatKunci, konfirmasi,
} = c

onMounted(() => { void c.muatAwal() })
onBeforeUnmount(() => { c.buang() })

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.domi') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('cadangan.judul')" :description="tcf('cadangan.ket')" kicker="CashFlow" ringkas>
      <template #meta><CashflowNav /></template>
      <template #awal><CashflowDomiMaskot :ukuran="64" /></template>
      <template #actions>
        <button type="button" class="ca-btn-secondary inline-flex items-center gap-2" :disabled="memuat || !!sibuk" data-uji="cadangan-muat-ulang" @click="c.muatAwal">
          <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="memuat ? 'animate-spin' : ''" aria-hidden="true" />{{ tcf('cadangan.muatUlang') }}
        </button>
      </template>
    </ConsolePageHeader>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="cadangan-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>
        <strong class="block font-semibold text-[var(--ca-text)]">{{ tcf('cadangan.belumAktifJudul') }}</strong>
        <span class="mt-1 block">{{ tcf('cadangan.belumAktif') }}</span>
      </span>
    </div>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <div v-else-if="pesanGalat" class="flex flex-wrap items-center gap-3" data-uji="cadangan-galat">
      <p class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" @click="c.muatAwal">{{ tcf('cadangan.cobaLagi') }}</button>
    </div>
    <p v-else-if="!keadaan" class="text-sm text-[var(--ca-muted)]" role="status">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <CashflowIzinKurang v-if="!bolehUbah" :pesan="tcf('cadangan.izinUbah')" />
      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <CashflowCadanganStatus :keadaan="keadaan" />
        <div class="grid min-w-0 gap-6">
          <CashflowCadanganSetelan
            :keadaan="keadaan" :aktif="isianAktif" :model="isianModel" :boleh-ubah="bolehUbah" :butuh-kunci="butuhKunci"
            :alasan="alasanSimpan" :bisa-simpan="bisaSimpan" :menyimpan="sibuk === 'simpan'" :terkunci="!!sibuk"
            @aktif="c.setelAktif" @model="(m) => { isianModel = m }" @simpan="c.simpan"
          />
          <CashflowCadanganKunci
            :nilai="kunci" :kunci-ada="keadaan.kunciAda" :galat="galatKunci" :boleh-ubah="bolehUbah"
            :menyimpan="sibuk === 'kunci'" :menghapus="sibuk === 'hapus'" :terkunci="!!sibuk"
            @isi="c.isiKunci" @simpan="c.mintaSimpanKunci" @hapus="c.mintaHapusKunci"
          />
        </div>
      </div>
    </template>

    <CashflowCadanganKonfirmasi :jenis="konfirmasi" :sibuk="sibuk === 'kunci' || sibuk === 'hapus'" @tutup="c.tutupKonfirmasi" @setuju="c.setuju" />
  </div>
</template>
