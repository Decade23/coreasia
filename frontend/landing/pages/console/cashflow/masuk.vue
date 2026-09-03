<script setup lang="ts">
/**
 * Gerbang kedua: email + sandi → TOTP (atau enroll TOTP kalau belum ada).
 * Middleware 'console' tetap dipasang (harus admin console dulu);
 * 'cashflow-admin' SENGAJA tidak — halaman ini tujuannya.
 */
definePageMeta({ layout: 'console', middleware: 'console' })
const { tcf } = useCashflowI18n()
const route = useRoute()
const auth = useCashflowAuth()

const email = ref('')
const sandi = ref('')
const kode = ref('')

onMounted(auth.segarkan)

const tujuan = computed(() => (typeof route.query.ke === 'string' && route.query.ke.startsWith('/console/cashflow')) ? route.query.ke : '/console/cashflow')

watch(() => auth.tahap.value, (t) => { if (t === 'selesai') navigateTo(tujuan.value) }, { immediate: true })

const kirimKredensial = async () => { await auth.masuk(email.value, sandi.value) }
const kirimKode = async () => { await auth.verifikasiTotp(kode.value); kode.value = '' }
const kirimEnroll = async () => { await auth.selesaikanEnroll(kode.value); kode.value = '' }
</script>

<template>
  <div class="mx-auto max-w-md py-10">
    <div class="text-center">
      <span class="ca-kicker">{{ tcf('masuk.kicker') }}</span>
      <h1 class="mt-3 font-display text-3xl font-bold text-[var(--ca-text)]">{{ tcf('masuk.judul') }}</h1>
      <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ tcf('masuk.keterangan') }}</p>
    </div>

    <div v-if="!auth.terkonfigurasi.value" class="ca-console-dialog mt-8 p-6 text-sm text-rose-600">
      {{ tcf('umum.belumKonfigurasi') }}
    </div>

    <template v-else>
      <p v-if="route.query.sebab === 'totp'" class="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--ca-text)]">
        {{ tcf('masuk.sebabTotp') }}
      </p>

      <!-- 1. kredensial -->
      <form v-if="auth.tahap.value === 'kredensial'" class="ca-console-dialog mt-8 space-y-4 p-6 sm:p-8" @submit.prevent="kirimKredensial">
        <!-- Komponen isian yang sama dengan halaman login console, supaya
             gerbang kedua terasa satu keluarga dengan gerbang pertama. -->
        <BaseInput id="cf-email" v-model="email" :label="tcf('masuk.email')" type="email" placeholder="admin@coreasia.id" required icon="lucide:mail" />
        <BasePasswordInput id="cf-sandi" v-model="sandi" :label="tcf('masuk.sandi')" required />
        <p v-if="auth.galat.value" class="text-sm text-rose-600">{{ auth.galat.value }}</p>
        <button type="submit" class="ca-btn-primary w-full" :disabled="auth.sibuk.value">{{ tcf('masuk.lanjut') }}</button>
      </form>

      <!-- 2. TOTP -->
      <form v-else-if="auth.tahap.value === 'perlu-totp'" class="ca-console-dialog mt-8 space-y-4 p-6 sm:p-8" @submit.prevent="kirimKode">
        <label class="block">
          <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('masuk.kode') }}</span>
          <input v-model="kode" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" required class="ca-input mt-1 w-full text-center text-2xl tracking-[0.4em]" />
        </label>
        <p v-if="auth.galat.value" class="text-sm text-rose-600">{{ auth.galat.value }}</p>
        <button type="submit" class="ca-btn-primary w-full" :disabled="auth.sibuk.value || kode.length < 6">{{ tcf('masuk.verifikasi') }}</button>
        <button type="button" class="w-full text-xs text-[var(--ca-subtle)] hover:text-[var(--ca-muted)]" @click="auth.keluar">{{ tcf('umum.batal') }}</button>
      </form>

      <!-- 3. enroll -->
      <div v-else-if="auth.tahap.value === 'perlu-enroll'" class="ca-console-dialog mt-8 space-y-4 p-6 sm:p-8">
        <h2 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tcf('masuk.enrollJudul') }}</h2>
        <p class="text-sm text-[var(--ca-muted)]">{{ tcf('masuk.enrollKet') }}</p>
        <button v-if="!auth.enrollData.value" type="button" class="ca-btn-primary w-full" @click="auth.mulaiEnroll">{{ tcf('masuk.enrollMulai') }}</button>
        <template v-else>
          <!-- qr_code dari Supabase adalah SVG data URL -->
          <img :src="auth.enrollData.value.qr" alt="QR TOTP" class="mx-auto h-44 w-44 rounded-xl bg-white p-2" />
          <form class="space-y-3" @submit.prevent="kirimEnroll">
            <input v-model="kode" inputmode="numeric" maxlength="6" required class="ca-input w-full text-center text-2xl tracking-[0.4em]" :placeholder="tcf('masuk.kode')" />
            <p v-if="auth.galat.value" class="text-sm text-rose-600">{{ auth.galat.value }}</p>
            <button type="submit" class="ca-btn-primary w-full" :disabled="auth.sibuk.value || kode.length < 6">{{ tcf('masuk.enrollSelesai') }}</button>
          </form>
        </template>
      </div>
    </template>
  </div>
</template>
