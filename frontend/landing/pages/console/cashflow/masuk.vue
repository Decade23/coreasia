<script setup lang="ts">
/**
 * Bukan gerbang lagi. Halaman ini hanya terlihat kalau penyambungan otomatis
 * (middleware cashflow-admin) gagal: menyebutkan sebabnya dengan kalimat
 * manusia dan menawarkan coba lagi. Middleware 'console' tetap dipasang;
 * 'cashflow-admin' SENGAJA tidak — halaman ini tujuannya.
 */
definePageMeta({ layout: 'console', middleware: 'console' })
const { tcf } = useCashflowI18n()
const route = useRoute()
const sesi = useCashflowSesi()

const SEBAB_DIKENAL = ['konfigurasi', 'belum-konfigurasi', 'tanpa-cookie', 'cookie-ditolak', 'gateway-gagal', 'tanpa-izin', 'mint-gagal', 'lintas-situs', 'jaringan', 'sesi', 'totp', 'sibuk']
const sebab = ref(typeof route.query.sebab === 'string' ? route.query.sebab : '')
const pesan = computed(() => tcf(`masuk.sebab.${SEBAB_DIKENAL.includes(sebab.value) ? sebab.value : 'lain'}`))

// Hanya kembali ke dalam modul — `ke` dari query tidak boleh jadi pintu ke luar.
const tujuan = computed(() => {
  const ke = route.query.ke
  return typeof ke === 'string' && ke.startsWith('/console/cashflow') && !ke.startsWith('/console/cashflow/masuk')
    ? ke : '/console/cashflow'
})

const coba = async () => {
  // Sesi yang masih sah tidak perlu dicetak ulang — langsung kembali.
  const sb = await sesi.ambil()
  if (sb) {
    const { data } = await sb.auth.getSession()
    if (data.session && sebab.value !== 'sesi' && sebab.value !== 'totp') return navigateTo(tujuan.value)
    if (data.session) await sb.auth.signOut({ scope: 'local' }).catch(() => {})
  }
  const h = await sesi.sambung()
  if (h.ok) return navigateTo(tujuan.value)
  sebab.value = h.sebab
}
// Datang tanpa sebab (mis. tautan langsung): coba sambung dulu, jangan
// langsung menuduh ada yang salah.
onMounted(() => { if (!sebab.value) coba() })
</script>

<template>
  <div class="mx-auto max-w-md py-10">
    <div class="text-center">
      <span class="ca-kicker">CashFlow</span>
      <h1 class="mt-3 font-display text-3xl font-bold text-[var(--ca-text)]">{{ tcf('masuk.judul') }}</h1>
      <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ tcf('masuk.keterangan') }}</p>
    </div>

    <div class="ca-console-dialog mt-8 p-6 text-sm sm:p-8">
      <p v-if="sesi.sibuk.value" class="text-center text-[var(--ca-muted)]">{{ tcf('masuk.menyambung') }}</p>
      <template v-else>
        <p class="font-semibold text-rose-600">{{ pesan }}</p>
        <p v-if="sebab" class="mt-1 font-mono text-xs text-[var(--ca-subtle)]">{{ sebab }}</p>
        <button type="button" class="ca-btn-primary mt-5 w-full" @click="coba">{{ tcf('masuk.cobaLagi') }}</button>
        <NuxtLink to="/console/login" class="mt-3 block text-center text-xs text-[var(--ca-subtle)] hover:text-[var(--ca-muted)]">{{ tcf('masuk.masukUlangConsole') }}</NuxtLink>
      </template>
    </div>
  </div>
</template>
