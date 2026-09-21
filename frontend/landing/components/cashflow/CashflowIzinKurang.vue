<script setup lang="ts">
/**
 * 42501 izin-kurang: sesi CashFlow tab ini tidak memegang cashflow:pii /
 * cashflow:investigasi. Izin itu hanya dicetak untuk login console ber-TOTP
 * (sesi.post.ts: /me mfa=true, TOTP lolos < 12 jam lalu — utils/rbac.ts
 * batasIzinMfa). Aktif langsung, tanpa masa tenggang sejak TOTP dipasang
 * (keputusan Master 21 Sep 2026). Jalan keluarnya:
 * - TOTP terpasang tapi login ini belum/tidak lagi ber-TOTP (mfa false) →
 *   "Masuk ulang dengan TOTP": keluar dari console lalu ke halaman login,
 *   yang mengembalikan ke halaman ini sesudah kode TOTP diterima;
 * - login SUDAH ber-TOTP tapi sesi CashFlow tab ini dicetak sebelumnya →
 *   "Sambung ulang CashFlow" mencetak sesi baru yang membawa izinnya;
 * - TOTP belum dipasang → Keamanan akun (/console/keamanan).
 */
withDefaults(defineProps<{ pesan?: string }>(), { pesan: '' })
const { tcf } = useCashflowI18n()
const { user, logout } = useAdminAuth()
const sesi = useCashflowSesi()
const route = useRoute()
const toast = useToast()
const sibuk = ref(false)

const sambungUlang = async () => {
  if (sibuk.value) return
  sibuk.value = true
  try {
    const sb = await sesi.ambil()
    await sb?.auth.signOut({ scope: 'local' }).catch(() => {})
    const h = await sesi.sambung()
    if (h.ok) {
      toast.success(tcf('izin.tersambung'))
      reloadNuxtApp({ persistState: false })
    } else {
      toast.error(tcf('izin.gagalSambung'))
    }
  } finally {
    sibuk.value = false
  }
}

const masukUlang = async () => {
  if (sibuk.value) return
  sibuk.value = true
  try {
    if (!(await logout(route.fullPath))) toast.error(tcf('izin.gagalKeluar'))
  } finally {
    sibuk.value = false
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm text-[var(--ca-text)]" role="status">
    <Icon name="lucide:shield-alert" class="h-4 w-4 shrink-0 text-[var(--ca-gold-text)]" aria-hidden="true" />
    <span class="min-w-0 flex-1">{{ pesan || tcf('izin.kurang') }}</span>
    <span class="flex flex-wrap gap-2">
      <button v-if="user?.mfa" type="button" class="ca-btn-primary !px-3 !py-1.5 text-xs" :disabled="sibuk" @click="sambungUlang">
        {{ sibuk ? tcf('izin.menyambung') : tcf('izin.sambungUlang') }}
      </button>
      <!-- /me belum dimuat (user null) = anggap TOTP terpasang: masuk ulang tetap jalan yang benar. -->
      <button v-else-if="user?.totp_enabled !== false" type="button" class="ca-btn-primary !px-3 !py-1.5 text-xs" :disabled="sibuk" @click="masukUlang">
        {{ sibuk ? tcf('izin.keluarMasuk') : tcf('izin.masukUlang') }}
      </button>
      <NuxtLink v-else to="/console/keamanan" class="ca-btn-primary !px-3 !py-1.5 text-xs">{{ tcf('izin.keKeamanan') }}</NuxtLink>
    </span>
  </div>
</template>
