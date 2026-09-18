<script setup lang="ts">
/**
 * Sakelar — konfigurasi jarak jauh (app_config). Setiap perubahan lewat
 * admin_set_config yang beraudit dan meminta alasan.
 *
 * Yang paling penting di sini: `auth.verifikasi_email`. Saat pengiriman kode
 * email bermasalah, admin menggesernya ke "longgar": pendaftar baru
 * dikonfirmasi otomatis oleh Edge Function auth-longgar, dan aplikasi melewati
 * layar kode. Pemulihan sandi TIDAK ikut longgar. Sakelar ini sengaja berwarna
 * peringatan saat longgar — ia keadaan darurat, bukan pilihan.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { ConfigDTO } from '~/composables/cashflow/useCashflowAdmin'
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })

const config = ref<ConfigDTO[]>([])
const alasan = ref('')
const emailBaru = ref('')

const muatConfig = () => muat(async () => { config.value = await api.daftarConfig() })
onMounted(muatConfig)

const nilai = (key: string) => config.value.find(c => c.key === key)?.value
const otpLonggar = computed(() => nilai('auth.verifikasi_email') === 'longgar')
const pengecualian = computed<string[]>(() => {
  const v = nilai('admin.pengecualian_email'); return Array.isArray(v) ? v : []
})

const simpan = async (key: string, value: unknown, publik: boolean, note: string) => {
  if (alasan.value.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const ok = await aksi(() => api.setConfig(key, value, publik, note, alasan.value.trim()), { sukses: `${key}: ${tcf('umum.tersimpan')}` })
  if (ok) await muatConfig()
}

const setOtp = (longgar: boolean) => simpan(
  'auth.verifikasi_email', longgar ? 'longgar' : 'wajib', true,
  'wajib | longgar. Longgar = pendaftar baru dikonfirmasi otomatis tanpa kode email.',
)
const tambahPengecualian = () => {
  const e = emailBaru.value.trim().toLowerCase()
  if (!e.includes('@') || pengecualian.value.includes(e)) return
  simpan('admin.pengecualian_email', [...pengecualian.value, e], false, 'Email yang dikecualikan dari ukuran keberhasilan.')
  emailBaru.value = ''
}
const hapusPengecualian = (e: string) =>
  simpan('admin.pengecualian_email', pengecualian.value.filter(x => x !== e), false, 'Email yang dikecualikan dari ukuran keberhasilan.')
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('sakelar.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.ket') }}</p>

    <label class="block max-w-xl">
      <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('sakelar.alasanUbah') }}</span>
      <input v-model="alasan" type="text" class="ca-input mt-1 w-full" :placeholder="tcf('alasan.lengkapi')" />
    </label>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <template v-else-if="!pesanGalat">
      <!-- Sakelar verifikasi email -->
      <section class="ca-console-dialog p-5" :class="otpLonggar ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)]' : ''">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-xl">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.otpJudul') }}</h2>
            <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.otpKet') }}</p>
            <p class="mt-2 text-sm font-semibold" :class="otpLonggar ? 'ca-tone-gold' : 'ca-tone-emerald'">
              {{ otpLonggar ? tcf('sakelar.otpAktif') : tcf('sakelar.otpNormal') }}
            </p>
          </div>
          <div class="flex rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
            <button type="button" class="rounded-full px-4 py-1.5 transition" :class="!otpLonggar ? 'bg-[var(--ca-emerald-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'" @click="setOtp(false)">{{ tcf('sakelar.otpWajib') }}</button>
            <button type="button" class="rounded-full px-4 py-1.5 transition" :class="otpLonggar ? 'bg-[var(--ca-gold-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'" @click="setOtp(true)">{{ tcf('sakelar.otpLonggar') }}</button>
          </div>
        </div>
      </section>

      <!-- Pengecualian ukuran keberhasilan -->
      <section class="ca-console-dialog p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.pengecualian') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.pengecualianKet') }}</p>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="e in pengecualian" :key="e" class="inline-flex items-center gap-2 rounded-full border border-[color:var(--ca-border)] px-3 py-1 font-mono text-xs text-[var(--ca-text)]">
            {{ e }} <button type="button" class="text-[var(--ca-subtle)] hover:text-[var(--ca-danger-text)]" :aria-label="tcf('sakelar.hapusEmail')(e)" @click="hapusPengecualian(e)">×</button>
          </li>
        </ul>
        <form class="mt-3 flex gap-2" @submit.prevent="tambahPengecualian">
          <input v-model="emailBaru" type="email" class="ca-input w-72" placeholder="nama@email.com" />
          <button type="submit" class="ca-btn-secondary">{{ tcf('sakelar.tambahEmail') }}</button>
        </form>
      </section>

      <!-- Semua kunci -->
      <section class="ca-console-dialog overflow-x-auto p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.semua') }}</h2>
        <CashflowKeadaanKosong v-if="!config.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:toggle-right" />
        <table v-else class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('sakelar.kunci') }}</th><th class="py-2 px-3">{{ tcf('sakelar.nilai') }}</th><th class="py-2 px-3">{{ tcf('sakelar.publik') }}</th><th class="py-2 px-3">{{ tcf('sakelar.catatan') }}</th><th class="py-2 pl-3">{{ tcf('sakelar.diperbarui') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in config" :key="c.key" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-1.5 pr-3 font-mono text-xs">{{ c.key }}</td>
              <td class="py-1.5 px-3 font-mono text-xs">{{ JSON.stringify(c.value) }}</td>
              <td class="py-1.5 px-3">{{ c.is_public ? tcf('umum.ya') : tcf('umum.tidak') }}</td>
              <td class="py-1.5 px-3 text-xs text-[var(--ca-muted)]">{{ c.note || '—' }}</td>
              <td class="py-1.5 pl-3 text-xs text-[var(--ca-subtle)] whitespace-nowrap">{{ formatTanggal(c.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
