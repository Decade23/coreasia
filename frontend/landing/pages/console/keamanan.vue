<script setup lang="ts">
/**
 * Keamanan akun console (Fase 0c): status TOTP, pasang/aktifkan/matikan TOTP,
 * dan keluar dari semua perangkat. Ditautkan dari menu pengguna di layout.
 *
 * Rahasia TOTP hanya hidup di memori halaman ini selama pendaftaran dan
 * dibuang saat batal, berhasil, atau halaman ditinggalkan.
 */
import type { GalatAuth } from '~/composables/useAdminAuth'
import type { PendaftaranTotp } from '~/composables/useKonsolKeamanan'

definePageMeta({ layout: 'console', middleware: 'console' })

const { tc } = useConsoleI18n()
const toast = useToast()
const { formatDateTime } = useConsoleDateTime()
const { user, fetchMe, sesiDiakhiri } = useAdminAuth()
const { sibuk, mulaiPasang, aktifkan, matikan, keluarSemua } = useKonsolKeamanan()

useConsoleRemah().pasang(() => [{ label: tc('layout.security') }])

const memuat = ref(true)
const gagalMuat = ref(false)

/* Pendaftaran: tutup → sandi → pindai (QR + kunci + kode). */
const tahap = ref<'tutup' | 'sandi' | 'pindai'>('tutup')
const sandi = ref('')
const pendaftaran = ref<PendaftaranTotp | null>(null)
const kodeAktif = ref('')
const kodeMati = ref('')
const pesan = ref('')
const tampilKeluarSemua = ref(false)

const totpAktif = computed(() => !!user.value?.totp_enabled)
const sesiMfa = computed(() => !!user.value?.mfa)
const kunciBerkelompok = computed(() => (pendaftaran.value?.secret ?? '').replace(/(.{4})(?=.)/g, '$1 '))

const muat = async () => {
  memuat.value = true
  gagalMuat.value = !(await fetchMe())
  memuat.value = false
}

const lupakan = () => {
  sandi.value = ''
  pendaftaran.value = null
  kodeAktif.value = ''
  tahap.value = 'tutup'
}

const pesanGalat = (g: GalatAuth) => {
  if (g.status === 429) {
    const menit = menitTunggu(g)
    return menit ? tc('login.tooMany', { menit }) : tc('login.tooManyLater')
  }
  if (g.status === 403 && g.pesan === 'ikatan') return tc('login.muatUlang')
  if (g.kode === 'PASSWORD_INVALID') return tc('keamanan.passwordSalah')
  if (g.kode === 'TOTP_INVALID') return tc('keamanan.kodeSalah')
  if (g.status === 409) return g.pesan || tc('keamanan.sudahAktif')
  return g.pesan || tc('keamanan.gagal')
}

const hanyaAngka = (nilai: string) => nilai.replace(/\D/g, '').slice(0, 6)

const lanjutPasang = async () => {
  pesan.value = ''
  const hasil = await mulaiPasang(sandi.value)
  sandi.value = ''
  if (!hasil.ok) {
    pesan.value = pesanGalat(hasil.galat)
    return
  }
  pendaftaran.value = hasil.data
  tahap.value = 'pindai'
}

const konfirmasiAktif = async () => {
  pesan.value = ''
  const hasil = await aktifkan(kodeAktif.value)
  if (!hasil.ok) {
    kodeAktif.value = ''
    pesan.value = pesanGalat(hasil.galat)
    return
  }
  lupakan()
  toast.success(tc('login.infoTotpAktif'))
  await sesiDiakhiri('totp-aktif')
}

const konfirmasiMati = async () => {
  pesan.value = ''
  const hasil = await matikan(kodeMati.value)
  if (!hasil.ok) {
    kodeMati.value = ''
    pesan.value = pesanGalat(hasil.galat)
    return
  }
  toast.success(tc('login.infoTotpMati'))
  await sesiDiakhiri('totp-mati')
}

const konfirmasiKeluarSemua = async () => {
  const hasil = await keluarSemua()
  tampilKeluarSemua.value = false
  if (!hasil.ok) {
    toast.error(pesanGalat(hasil.galat))
    return
  }
  await sesiDiakhiri('semua-perangkat')
}

const salinKunci = async () => {
  if (!pendaftaran.value) return
  try {
    await navigator.clipboard.writeText(pendaftaran.value.secret)
    toast.success(tc('keamanan.kunciTersalin'))
  } catch {
    toast.error(tc('keamanan.gagal'))
  }
}

onMounted(muat)
onBeforeUnmount(lupakan)
</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('keamanan.kicker')"
      icon="lucide:shield-check"
      :title="tc('keamanan.title')"
      :description="tc('keamanan.description')"
    />

    <p class="ca-console-note ca-console-note-info mb-6 flex items-start gap-2.5">
      <Icon name="lucide:info" class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ tc('keamanan.pentingCashflow') }}</span>
    </p>

    <div v-if="memuat" class="ca-card p-10 text-center text-sm text-[var(--ca-muted)]">
      {{ tc('common.loading') }}
    </div>

    <div v-else-if="gagalMuat" class="ca-console-note ca-console-note-warning flex items-center gap-2.5">
      <Icon name="lucide:alert-triangle" class="h-4 w-4 shrink-0" />
      <span>{{ tc('keamanan.gagalMuat') }}</span>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <!-- TOTP -->
      <section class="ca-card-soft p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[var(--ca-text)]">{{ tc('keamanan.statusTitle') }}</h2>
            <p class="mt-1 text-xs text-[var(--ca-muted)]">
              {{ sesiMfa ? tc('keamanan.sesiMfa') : tc('keamanan.sesiTanpaMfa') }}
            </p>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase"
            :class="totpAktif ? 'ca-pill-emerald' : 'ca-pill-muted'"
          >
            {{ totpAktif ? tc('keamanan.statusOn') : tc('keamanan.statusOff') }}
          </span>
        </div>
        <p v-if="totpAktif && user?.totp_enabled_at" class="mt-3 text-xs text-[var(--ca-subtle)]">
          {{ tc('keamanan.sejak', { waktu: formatDateTime(user.totp_enabled_at) }) }}
        </p>

        <!-- Belum aktif: pasang -->
        <template v-if="!totpAktif">
          <button
            v-if="tahap === 'tutup'"
            type="button"
            class="ca-btn-primary mt-5"
            @click="tahap = 'sandi'; pesan = ''"
          >
            <Icon name="lucide:smartphone" class="h-4 w-4" />
            {{ tc('keamanan.pasang') }}
          </button>

          <form v-else-if="tahap === 'sandi'" class="mt-5 max-w-md space-y-4" @submit.prevent="lanjutPasang">
            <p class="text-sm text-[var(--ca-muted)]">{{ tc('keamanan.pasangDesc') }}</p>
            <BasePasswordInput
              id="sandi-totp"
              v-model="sandi"
              :label="tc('keamanan.password')"
              autocomplete="current-password"
              required
            />
            <p v-if="pesan" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesan }}</p>
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="ca-btn-primary" :disabled="sibuk || !sandi">
                {{ sibuk ? tc('common.processing') : tc('keamanan.lanjut') }}
              </button>
              <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="lupakan(); pesan = ''">
                {{ tc('common.cancel') }}
              </button>
            </div>
          </form>

          <form v-else-if="pendaftaran" class="mt-5 space-y-5" @submit.prevent="konfirmasiAktif">
            <p class="text-sm text-[var(--ca-muted)]">{{ tc('keamanan.pindai') }}</p>
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div class="w-48 shrink-0 rounded-2xl border border-[color:var(--ca-border)] bg-white p-2">
                <KodeQr :nilai="pendaftaran.otpauth_url" :label="tc('keamanan.qrAlt')" />
              </div>
              <div class="min-w-0 flex-1 space-y-3">
                <p class="text-xs text-[var(--ca-muted)]">{{ tc('keamanan.manual') }}</p>
                <p class="break-all rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-3 py-2 font-mono text-sm text-[var(--ca-text)]">
                  {{ kunciBerkelompok }}
                </p>
                <button type="button" class="ca-btn-secondary !px-3 !py-2 text-xs" @click="salinKunci">
                  <Icon name="lucide:copy" class="h-3.5 w-3.5" />
                  {{ tc('keamanan.salinKunci') }}
                </button>
                <p class="text-xs text-[var(--ca-subtle)]">
                  {{ tc('keamanan.akun') }}: {{ pendaftaran.issuer }} · {{ pendaftaran.account }}
                </p>
              </div>
            </div>

            <div class="max-w-xs">
              <label for="kode-aktif" class="ca-field-label">{{ tc('keamanan.kodeLabel') }}</label>
              <input
                id="kode-aktif"
                :value="kodeAktif"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="000000"
                class="ca-field-control text-center font-mono text-lg tracking-[0.4em]"
                :disabled="sibuk"
                required
                @input="kodeAktif = hanyaAngka(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = kodeAktif"
              >
            </div>
            <p class="text-xs text-[var(--ca-subtle)]">{{ tc('keamanan.aktifkanCatatan') }}</p>
            <p v-if="pesan" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesan }}</p>
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="ca-btn-primary" :disabled="sibuk || kodeAktif.length !== 6">
                {{ sibuk ? tc('common.processing') : tc('keamanan.aktifkan') }}
              </button>
              <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="lupakan(); pesan = ''">
                {{ tc('common.cancel') }}
              </button>
            </div>
          </form>
        </template>

        <!-- Aktif: matikan -->
        <template v-else>
          <p v-if="!sesiMfa" class="ca-console-note ca-console-note-warning mt-5 flex items-start gap-2.5">
            <Icon name="lucide:lock" class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ tc('keamanan.nonaktifkanPerluMfa') }}</span>
          </p>
          <form v-else class="mt-5 max-w-md space-y-4" @submit.prevent="konfirmasiMati">
            <p class="text-sm text-[var(--ca-muted)]">{{ tc('keamanan.nonaktifkanDesc') }}</p>
            <div class="max-w-xs">
              <label for="kode-mati" class="ca-field-label">{{ tc('keamanan.kodeLabel') }}</label>
              <input
                id="kode-mati"
                :value="kodeMati"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="000000"
                class="ca-field-control text-center font-mono text-lg tracking-[0.4em]"
                :disabled="sibuk"
                required
                @input="kodeMati = hanyaAngka(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = kodeMati"
              >
            </div>
            <p v-if="pesan" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesan }}</p>
            <button type="submit" class="ca-btn-danger !px-4 !py-2.5" :disabled="sibuk || kodeMati.length !== 6">
              {{ sibuk ? tc('common.processing') : tc('keamanan.nonaktifkan') }}
            </button>
          </form>
        </template>
      </section>

      <!-- Sesi -->
      <section class="ca-card-soft h-fit p-5 sm:p-6">
        <h2 class="text-base font-semibold text-[var(--ca-text)]">{{ tc('keamanan.keluarSemua') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tc('keamanan.keluarSemuaDesc') }}</p>
        <button type="button" class="ca-btn-danger mt-5 !px-4 !py-2.5" :disabled="sibuk" @click="tampilKeluarSemua = true">
          <Icon name="lucide:log-out" class="h-4 w-4" />
          {{ tc('keamanan.keluarSemua') }}
        </button>
      </section>
    </div>

    <ConsoleModal
      :show="tampilKeluarSemua"
      :title="tc('keamanan.keluarSemuaTitle')"
      size="sm"
      @close="tampilKeluarSemua = false"
    >
      <p class="text-sm text-[var(--ca-muted)]">{{ tc('keamanan.keluarSemuaDesc') }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="tampilKeluarSemua = false">
          {{ tc('common.cancel') }}
        </button>
        <button type="button" class="ca-btn-danger !px-4 !py-2.5" :disabled="sibuk" @click="konfirmasiKeluarSemua">
          {{ sibuk ? tc('common.processing') : tc('keamanan.keluarSemuaKonfirmasi') }}
        </button>
      </div>
    </ConsoleModal>
  </div>
</template>
