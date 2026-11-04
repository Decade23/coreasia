<script setup lang="ts">
/**
 * Pengguna 360 › Ringkas — ranah `akun` (T1): blok akun dari
 * admin_pengguna_360 (email utuh, nama, konfirmasi, provider, sesi, MFA,
 * tangguh), jeda daftar → catatan pertama (MIN di server — jujur, tidak lagi
 * "hanya transaksi terbaru yang dimuat"), dan total BERSIH dalam lingkup
 * kasus (tanpa kaki transfer, kasbon, dan dompet terarsip — M/0090 §3).
 * Data dimuat bersama induk (satu baris audit
 * baca_akun per kasus+lingkup) dan dibuang saat kasus habis.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
import { rupiah, angka, jedaDaftarKeCatatan } from '~/adapters/cashflow'
import { TAB_PENGGUNA, lencanaTabPengguna, type TabPengguna } from '~/adapters/cashflowKasus'

const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()
const { dasar, kepala, kunci360, p360, muat360 } = useCashflowPengguna()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

watch(kunci360, (k) => { if (k && !p360.value) muat(muat360) }, { immediate: true })

const akun = computed(() => p360.value?.akun ?? null)
const jeda = computed(() => (p360.value ? jedaDaftarKeCatatan(p360.value.akun.daftarIso, p360.value.pertamaCatatIso) : null))
const ikon: Record<Exclude<TabPengguna, ''>, string> = {
  ruang: 'lucide:layers', transaksi: 'lucide:receipt-text', jejak: 'lucide:history',
  akses: 'lucide:shield-check', dompet: 'lucide:wallet', perangkat: 'lucide:smartphone', kabar: 'lucide:bell',
}
const hitungTab = computed(() => {
  const h = p360.value?.hitung
  return h ? { ...h, perangkat: h.perangkat ?? null, kabar: h.kabar ?? null } : null
})
const bagian = computed(() => TAB_PENGGUNA.filter((t): t is Exclude<TabPengguna, ''> => !!t).map(t => ({
  kunci: t, label: tcf(`tab.${t}`), to: `${dasar.value}/${t}`, ikon: ikon[t],
  jumlah: lencanaTabPengguna(t, hitungTab.value, kepala.value?.akses30 ?? null),
})))
</script>

<template>
  <CashflowPanelTab ranah="akun" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!p360">
    <div v-if="p360 && akun" class="space-y-4">
      <div class="grid items-start gap-4 xl:grid-cols-2">
      <section class="ca-console-dialog p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="break-all font-mono text-base font-bold text-[var(--ca-text)] sm:text-lg">{{ akun.email }}</h3>
          <CashflowSalinId :id="akun.id" />
          <span v-if="akun.ditangguhkan" class="ca-pill-danger">{{ tcf('pengguna.ditangguhkan') }}</span>
        </div>
        <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
          <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.nama') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ akun.namaTampil }}<span v-if="akun.namaMeta && akun.namaMeta !== akun.namaTampil" class="text-[var(--ca-subtle)]"> · {{ akun.namaMeta }}</span></dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.konfirmasi') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ akun.emailTerkonfirmasiIso ? formatTanggal(akun.emailTerkonfirmasiIso) : tcf('ringkas.belumKonfirmasi') }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.provider') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ akun.provider.join(', ') || '—' }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.daftar') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ formatWaktu(akun.daftarIso) }} WIB</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.masuk') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ akun.masukTerakhirIso ? `${formatWaktu(akun.masukTerakhirIso)} WIB` : '—' }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.sesi') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ tcf('ringkas.sesiNilai')(akun.sesi, akun.sesiTerakhirIso ? `${formatWaktu(akun.sesiTerakhirIso)} WIB` : '—') }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.mfa') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ akun.mfa ? tcf('umum.ya') : tcf('umum.tidak') }}</dd>
          <template v-if="akun.ditangguhkanSampaiIso">
            <dt class="text-[var(--ca-muted)]">{{ tcf('ringkas.tangguhSampai') }}</dt>
            <dd class="text-[var(--ca-text)]">{{ formatWaktu(akun.ditangguhkanSampaiIso) }} WIB</dd>
          </template>
          <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.jeda') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ jeda ? tcf('pengguna.jedaSetelah')(jeda.n, jeda.satuan) : tcf('pengguna.jedaBelum') }}</dd>
        </dl>
      </section>
      <CashflowIsiData :judul="tcf('ringkas.isiPengguna')" :keterangan="tcf('ringkas.isiKet')" :bagian="bagian" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile icon="lucide:layers" warna="sky" :label="tcf('pengguna.ruang')" :nilai="angka(p360.hitung.ruang)" :keterangan="tcf('ringkas.dalamLingkup')(p360.hitung.ruang_dalam_lingkup)" />
        <CashflowStatTile icon="lucide:list" warna="amber" :label="tcf('pengguna.transaksi')" :nilai="angka(p360.total.transaksi)" :keterangan="tcf('ringkas.dicatatDalamLingkup')" />
        <CashflowStatTile icon="lucide:arrow-down-left" warna="emerald" :label="tcf('ringkas.masukBersih')" :nilai="rupiah(p360.total.masukBersih)" :keterangan="tcf('ringkas.bersihKet')" />
        <CashflowStatTile icon="lucide:arrow-up-right" warna="rose" :label="tcf('ringkas.keluarBersih')" :nilai="rupiah(p360.total.keluarBersih)" :keterangan="tcf('ringkas.bersihKet')" />
      </div>
      <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('ringkas.catatanAngka') }}</p>
    </div>
  </CashflowPanelTab>
</template>
