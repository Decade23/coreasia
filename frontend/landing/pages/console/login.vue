<script setup lang="ts">
import type { GalatAuth } from '~/composables/useAdminAuth'

definePageMeta({ layout: false })

// GTM/iklan yang terlanjur termuat di dokumen ini → muat ulang penuh (Fase 0c).
useKonsolBersih()

const { theme } = useCoreTheme()
const { login, verifikasiTotp, lupakanTantangan, fetchMe, galat, pending, isAuthenticated } = useAdminAuth()
const { tc } = useConsoleI18n()
const toast = useToast()
const route = useRoute()

/* Dua langkah: sandi → (bila akun ber-TOTP) kode. Keduanya dikirim peramban
   LANGSUNG ke gateway (useAdminAuth); tantangan MFA hanya di memori composable,
   token hasilnya langsung diserahkan ke BFF. Dokumen ini ber-CSP khusus login
   (connect-src ke gateway publik) dan dibuang saat berhasil masuk. */
const langkah = ref<'sandi' | 'kode'>('sandi')
const email = ref('')
const password = ref('')
const kode = ref('')
const pesan = ref('')
const inputKode = ref<HTMLInputElement | null>(null)

/* Tema: halaman ini SPA (ssr:false); skrip bootstrap tema sebaris dihapus
   karena CSP console menolak skrip sebaris dan htmlAttrs sudah cukup. */
useHead(() => ({
  htmlAttrs: { 'data-theme': theme.value },
  bodyAttrs: { class: 'ca-console-page' },
}))

const info = computed(() => {
  switch (route.query.info) {
    case 'semua-perangkat': return tc('login.infoSemuaPerangkat')
    case 'totp-aktif': return tc('login.infoTotpAktif')
    case 'totp-mati': return tc('login.infoTotpMati')
    case 'sandi-diganti': return tc('login.infoSandiDiganti')
    default: return ''
  }
})

/** Kembali ke halaman semula — hanya jalur console di situs ini (bukan pengalihan terbuka). */
const tujuan = () => {
  const ke = route.query.ke
  return typeof ke === 'string' && /^\/console(?:[/?#]|$)/i.test(ke) && jenisDokumen(ke) === 'konsol' ? ke : '/console'
}

/** Masuk = dokumen console BARU (bukan navigasi SPA): memori halaman ini,
 *  termasuk token yang sempat lewat, ikut dibuang; dokumen baru mendapat CSP
 *  console dan token ikatan dari cookie `ikat` yang baru. */
const keConsole = () => window.location.replace(tujuan())

const pesanGalat = (g: GalatAuth | null, cadangan: 'login.failed' | 'login.totpFailed') => {
  const p = pesanLogin(g, cadangan)
  return 'teks' in p ? p.teks : tc(p.kunci, p.param)
}

const handleSubmit = async () => {
  pesan.value = ''
  const hasil = await login(email.value, password.value)
  if (hasil === 'mfa') {
    password.value = ''
    langkah.value = 'kode'
    await nextTick()
    inputKode.value?.focus()
    return
  }
  if (hasil === 'masuk') {
    password.value = ''
    keConsole()
    return
  }
  pesan.value = pesanGalat(galat.value, 'login.failed')
  toast.error(pesan.value)
}

const kirimKode = async () => {
  if (pending.value || kode.value.length !== 6) return
  pesan.value = ''
  const ok = await verifikasiTotp(kode.value)
  if (ok) {
    kode.value = ''
    keConsole()
    return
  }
  const g = galat.value
  kode.value = ''
  pesan.value = pesanGalat(g, 'login.totpFailed')
  // Tantangan habis, atau kode sudah diterima gateway tetapi serah terima ke
  // console gagal (tantangan sekali pakai): mulai lagi dari sandi.
  if (g?.kode === 'MFA_CHALLENGE_INVALID' || g?.sumber === 'console') {
    langkah.value = 'sandi'
    return
  }
  await nextTick()
  inputKode.value?.focus()
}

const ketikKode = (e: Event) => {
  const el = e.target as HTMLInputElement
  kode.value = el.value.replace(/\D/g, '').slice(0, 6)
  el.value = kode.value
  if (kode.value.length === 6) kirimKode()
}

const kembali = () => {
  lupakanTantangan()
  langkah.value = 'sandi'
  kode.value = ''
  pesan.value = ''
}

onMounted(async () => {
  // Sesi yang masih hidup (cookie HttpOnly) tidak perlu login ulang.
  if (isAuthenticated.value || await fetchMe()) keConsole()
})
onBeforeUnmount(lupakanTantangan)
</script>

<template>
  <div class="ca-console-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
    <div class="relative z-[1] w-full max-w-lg">
      <div class="mb-8 text-center">
        <div class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] shadow-[var(--ca-card-soft-shadow)]">
          <NuxtImg src="/logo.svg" alt="CoreAsia" width="48" height="48" class="h-10 w-10" />
        </div>
        <div class="mt-5">
          <span class="ca-kicker">
            <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
            {{ tc('layout.kicker') }}
          </span>
        </div>
        <h1 class="mt-5 font-display text-3xl font-bold text-[var(--ca-text)]">
          {{ langkah === 'kode' ? tc('login.totpTitle') : tc('login.title') }}
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
          {{ langkah === 'kode' ? tc('login.totpDescription') : tc('login.description') }}
        </p>
      </div>

      <p
        v-if="info && langkah === 'sandi'"
        class="mb-4 rounded-2xl border border-[color:var(--ca-info-border)] bg-[var(--ca-info-bg)] px-4 py-3 text-sm text-[var(--ca-info-text)]"
        role="status"
      >
        {{ info }}
      </p>

      <form v-if="langkah === 'sandi'" class="ca-console-dialog p-6 sm:p-8" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <BaseInput
            id="email"
            v-model="email"
            :label="tc('login.email')"
            type="email"
            placeholder="admin@coreasia.id"
            autocomplete="username"
            required
            icon="lucide:mail"
          />
          <BasePasswordInput
            id="password"
            v-model="password"
            :label="tc('login.password')"
            :placeholder="tc('login.passwordPlaceholder')"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="pesan" class="mt-3 text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesan }}</p>

        <button
          type="submit"
          class="ca-btn-primary mt-6 w-full"
          :disabled="pending || !email || !password"
        >
          <span v-if="pending">{{ tc('login.submitting') }}</span>
          <span v-else>{{ tc('login.submit') }}</span>
        </button>
      </form>

      <form v-else class="ca-console-dialog p-6 sm:p-8" @submit.prevent="kirimKode">
        <label for="kode-totp" class="ca-field-label">{{ tc('login.totpCode') }}</label>
        <input
          id="kode-totp"
          ref="inputKode"
          :value="kode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6}"
          maxlength="6"
          placeholder="000000"
          class="ca-field-control text-center font-mono text-2xl tracking-[0.5em]"
          :disabled="pending"
          :aria-invalid="pesan ? 'true' : undefined"
          aria-describedby="kode-totp-galat"
          required
          @input="ketikKode"
        >

        <p v-if="pesan" id="kode-totp-galat" class="mt-3 text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesan }}</p>

        <button type="submit" class="ca-btn-primary mt-6 w-full" :disabled="pending || kode.length !== 6">
          <span v-if="pending">{{ tc('login.submitting') }}</span>
          <span v-else>{{ tc('login.totpSubmit') }}</span>
        </button>
        <button type="button" class="ca-btn-secondary mt-3 w-full" :disabled="pending" @click="kembali">
          {{ tc('login.totpBack') }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-[var(--ca-subtle)]">
        <NuxtLink to="/" class="transition hover:text-[var(--ca-muted)]">
          &larr; {{ tc('common.backToWebsite') }}
        </NuxtLink>
      </p>
    </div>
  </div>
  <ToastContainer />
</template>
