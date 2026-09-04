<script setup lang="ts">
/**
 * Daftar pengguna — email tampil LENGKAP secara bawaan, dengan sakelar
 * tersamar di atas tabel.
 *
 * Keputusan pemilik (5 Sep 2026): hari ini hanya dia yang memakai console,
 * jadi modal alasan sebelum melihat daftar cuma menghalangi pekerjaannya
 * sendiri. Yang TIDAK ikut hilang: jejaknya. Satu kali halaman ini dibuka =
 * satu baris audit (admin_daftar_pengguna_v2 menulisnya sebelum data keluar),
 * atas nama akun console yang membukanya. Membuka SATU orang tetap butuh
 * alasan yang diketik — itu halaman lain, dan aturannya tidak berubah.
 *
 * Sakelar tersamar/lengkap murni tampilan: seluruh daftar sudah ada di memori
 * sejak halaman dimuat, jadi menyamarkan tidak memanggil server dan tidak
 * menambah baris audit. Pencarian pun disaring di klien, bukan di server —
 * kalau tidak, satu ketikan berarti satu baris audit.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { kePengguna, type Pengguna } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()

/** Alasan baku untuk pembukaan daftar. Server menuntut ≥ 8 aksara, dan
 *  useCashflowAdmin menambahkan awalan email admin console-nya. */
const ALASAN_BAKU = 'Membuka daftar pengguna dari console'
const MAKS = 500

const memuat = ref(true)
const galat = ref('')
const semua = ref<Pengguna[]>([])
const total = ref(0)
const cari = ref('')
const segmen = ref<'semua' | 'catat7' | 'belum' | 'ditangguhkan'>('semua')
/** Sakelar tampilan. Bawaan: TIDAK tersamar. */
const samar = ref(false)

const muat = async () => {
  memuat.value = true; galat.value = ''
  try {
    const rows = await api.daftarPengguna(MAKS, 0, '', ALASAN_BAKU)
    semua.value = rows.map(kePengguna)
    total.value = rows.length ? Number(rows[0].total_semua ?? rows.length) : 0
  } catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin')
      : e?.jenis === 'alasan' ? tcf('alasan.pendek')
      : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp' || e?.jenis === 'sesi') {
      navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow/pengguna' } })
    }
  } finally { memuat.value = false }
}
onMounted(muat)

/** Yang dicari selalu email SUNGGUHAN, sekalipun layarnya sedang tersamar —
 *  datanya memang sudah ada di memori, dan menyembunyikannya dari pencarian
 *  hanya akan membuat sakelar terasa rusak. */
const data = computed(() => {
  const q = cari.value.trim().toLowerCase()
  return semua.value.filter(p => {
    if (q && !`${p.emailPenuh ?? ''} ${p.emailTersamar}`.toLowerCase().includes(q)) return false
    if (segmen.value === 'belum') return p.tx === 0
    if (segmen.value === 'ditangguhkan') return p.status === 'ditangguhkan'
    // "Mencatat 7 hari" = pernah mencatat DAN masih aktif dalam 7 hari terakhir.
    if (segmen.value === 'catat7') return p.tx > 0 && p.hariSejakAktif <= 7
    return true
  })
})

const columns = computed(() => [
  { key: 'emailTampil', label: tcf('pengguna.email'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]' },
  { key: 'daftar', label: tcf('pengguna.daftar'), type: 'text' as const, width: '120px' },
  { key: 'aktivitasTerakhir', label: tcf('pengguna.aktifTerakhir'), type: 'text' as const, width: '130px' },
  { key: 'ruang', label: tcf('pengguna.ruang'), type: 'text' as const, width: '70px', class: 'tabular-nums text-right' },
  { key: 'tx', label: tcf('pengguna.tx'), type: 'text' as const, width: '90px', class: 'tabular-nums text-right' },
  { key: 'statusLabel', label: tcf('pengguna.status'), type: 'status' as const, width: '110px' },
])
const tableData = computed(() => data.value.map(p => ({
  ...p,
  emailTampil: samar.value ? p.emailTersamar : (p.emailPenuh ?? p.emailTersamar),
  statusLabel: p.status === 'aktif' ? tcf('pengguna.aktif') : tcf('pengguna.ditangguhkan'),
})))
const segmenOpsi = computed(() => [
  { kunci: 'semua', label: tcf('umum.semua') },
  { kunci: 'catat7', label: tcf('pengguna.catat7') },
  { kunci: 'belum', label: tcf('pengguna.belumCatat') },
  { kunci: 'ditangguhkan', label: tcf('pengguna.ditangguhkan') },
])
const terpotong = computed(() => total.value > semua.value.length)
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <input v-model="cari" type="search" class="ca-input w-64" :placeholder="tcf('umum.cari')" />
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="s in segmenOpsi" :key="s.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="segmen === s.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          @click="segmen = s.kunci as any"
        >{{ s.label }}</button>
      </div>
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ data.length }} / {{ semua.length }}</span>

      <!-- Sakelar tampilan email: dua keadaan, satu ketukan, tanpa jaringan. -->
      <div class="ml-auto flex gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          type="button" class="rounded-full px-3 py-1 transition"
          :class="!samar ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
          :aria-pressed="!samar" @click="samar = false"
        >{{ tcf('pengguna.emailPenuh') }}</button>
        <button
          type="button" class="rounded-full px-3 py-1 transition"
          :class="samar ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
          :aria-pressed="samar" @click="samar = true"
        >{{ tcf('pengguna.emailSamar') }}</button>
      </div>
    </div>

    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>

    <div class="ca-console-dialog overflow-hidden">
      <DataTable :columns="columns" :data="tableData" :loading="memuat" empty-icon="lucide:users" :empty-text="tcf('umum.kosong')">
        <template #cell-emailTampil="{ row }">
          <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline">{{ row.emailTampil }}</NuxtLink>
        </template>
      </DataTable>
    </div>

    <p v-if="terpotong" class="text-xs text-amber-600">{{ tcf('pengguna.potong')(semua.length, total) }}</p>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.aktifTerakhirKet') }}</p>
  </div>
</template>
