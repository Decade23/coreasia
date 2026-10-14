<script setup lang="ts">
/**
 * Satu permintaan hapus akun (halaman Hapus akun).
 *
 * Isi kartu: email tersamar, nama, umur permintaan (merah bila menunggu lebih
 * dari 7 hari, pengingat internal saja), ringkasan isi akun, keadaan foto,
 * dan tautan Pengguna 360 selama akunnya masih ada.
 *
 * Tombol hanya untuk permintaan yang menunggu (aksiPermintaan). Hapus
 * permanen meminta satu konfirmasi lewat CashflowHapusAkunKonfirmasi di
 * halaman; Batalkan dikonfirmasi sebaris di kartu ini. Tanpa izin tindak
 * tombolnya mati dan halaman menjelaskan lewat CashflowIzinKurang.
 */
import { aksiPermintaan, bagianIsi, type PermintaanHapus } from '~/adapters/cashflowHapusAkun'

const props = defineProps<{
  permintaan: PermintaanHapus
  bolehTindak: boolean
  /** Aksi yang sedang berjalan untuk kartu INI. */
  sibuk: 'hapus' | 'batal' | null
  /** Ada aksi berjalan di mana pun di halaman: semua tombol menunggu. */
  terkunci: boolean
  /** Server baru saja menolak hapus permanen kartu ini (P0001 alihkan-kepemilikan). */
  ditolakTertahan: boolean
}>()
const emit = defineEmits<{ hapus: []; batalkan: [] }>()
const { tcf, formatWaktu } = useCashflowI18n()

const p = computed(() => props.permintaan)
const aksi = computed(() => aksiPermintaan(p.value, props.bolehTindak))
const tanyaBatal = ref(false)
watch(() => p.value.status, () => { tanyaBatal.value = false })

const nadaStatus = computed(() =>
  p.value.status === 'menunggu' ? 'ca-pill-gold' : p.value.status === 'selesai' ? 'ca-pill-muted' : 'ca-pill-info')
const isi = computed(() => bagianIsi(p.value).map(b => tcf(`hapusAkun.isi.${b.kunci}`)(b.n) as string).join(' · '))
const teksFoto = computed(() => {
  const k = p.value.keadaanFoto
  if (k === 'menunggu') return tcf('hapusAkun.foto.menunggu')(p.value.fotoMenunggu) as string
  if (k === 'gagal') return tcf('hapusAkun.foto.gagal')(p.value.fotoGagal) as string
  return k === 'bersih' ? tcf('hapusAkun.foto.bersih') : tcf('hapusAkun.foto.tersimpan')
})
const nadaFoto = computed(() => (p.value.keadaanFoto === 'gagal' ? 'ca-tone-danger' : p.value.keadaanFoto === 'menunggu' ? 'ca-tone-gold' : 'text-[var(--ca-subtle)]'))
const judulMati = computed(() => (aksi.value.sebab === 'izin' ? tcf('hapusAkun.izinTindak') : undefined))

const setujuBatal = () => {
  if (props.terkunci) return
  emit('batalkan')
}
</script>

<template>
  <article
    class="ca-console-dialog p-4 text-sm"
    :class="p.lewatBatas ? '!border-[color:var(--ca-danger-border)]' : ''"
    :aria-label="p.emailTersamar"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-mono text-[var(--ca-text)]">{{ p.emailTersamar }}</span>
      <span class="text-[var(--ca-muted)]">{{ p.nama ?? tcf('hapusAkun.tanpaNama') }}</span>
      <span v-if="p.status" :class="nadaStatus" class="text-[0.7rem]">{{ tcf(`hapusAkun.status.${p.status}`) }}</span>
      <span v-if="p.lewatBatas" class="ca-pill-danger text-[0.7rem]">{{ tcf('hapusAkun.lewatBatas') }}</span>
      <span class="ml-auto font-mono text-xs text-[var(--ca-subtle)]">{{ p.id.slice(0, 8) }}</span>
    </div>

    <p class="mt-1 text-xs tabular-nums" :class="p.lewatBatas ? 'font-semibold ca-tone-danger' : 'text-[var(--ca-subtle)]'">
      <template v-if="p.status === 'menunggu'">{{ tcf('hapusAkun.umur')(p.umurHari) }} · </template>{{ tcf('hapusAkun.diminta')(formatWaktu(p.dimintaIso)) }}<template v-if="p.lewat"> · {{ tcf(`hapusAkun.lewat.${p.lewat}`) }}</template><template v-if="p.selesaiIso"> · {{ tcf('hapusAkun.dihapusPada')(formatWaktu(p.selesaiIso)) }}</template>
    </p>

    <p class="mt-2 text-xs text-[var(--ca-muted)]">{{ isi || tcf('hapusAkun.isiTertahan') }}</p>
    <p class="mt-1 text-xs" :class="nadaFoto">{{ teksFoto }}</p>

    <p
      v-if="p.status === 'menunggu' && (p.tertahan || ditolakTertahan)"
      class="mt-3 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-3 py-2 text-xs text-[var(--ca-text)]"
      role="status"
    >{{ ditolakTertahan ? tcf('galat.alihkanKepemilikan') : tcf('hapusAkun.tertahan') }}</p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <NuxtLink v-if="p.ke360" :to="p.ke360" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ca-text)] underline-offset-2 hover:underline">
        <Icon name="lucide:user" class="h-3.5 w-3.5 text-[var(--ca-subtle)]" />{{ tcf('hapusAkun.ke360') }}
      </NuxtLink>

      <template v-if="aksi.tampil">
        <span v-if="!tanyaBatal" class="ml-auto flex flex-wrap gap-2">
          <button
            type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs"
            :disabled="!aksi.aktif || terkunci" :title="judulMati" @click="tanyaBatal = true"
          >{{ tcf('hapusAkun.batalkan') }}</button>
          <button
            type="button" class="ca-btn-danger !px-3 !py-1.5 text-xs"
            :disabled="!aksi.aktif || terkunci" :title="judulMati" @click="emit('hapus')"
          >
            <Icon v-if="sibuk === 'hapus'" name="lucide:loader-2" class="h-3.5 w-3.5 animate-spin" />
            {{ sibuk === 'hapus' ? tcf('hapusAkun.menghapus') : tcf('hapusAkun.hapus') }}
          </button>
        </span>
        <span v-else class="ml-auto flex flex-wrap items-center justify-end gap-2" role="group" :aria-label="tcf('hapusAkun.batalkan')">
          <span class="text-xs text-[var(--ca-text)]">{{ tcf('hapusAkun.batalTanya') }}</span>
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="terkunci" @click="tanyaBatal = false">{{ tcf('hapusAkun.batalTidak') }}</button>
          <button type="button" class="ca-btn-primary !px-3 !py-1.5 text-xs" :disabled="!aksi.aktif || terkunci" @click="setujuBatal">
            <Icon v-if="sibuk === 'batal'" name="lucide:loader-2" class="h-3.5 w-3.5 animate-spin" />
            {{ sibuk === 'batal' ? tcf('hapusAkun.membatalkan') : tcf('hapusAkun.batalYa') }}
          </button>
        </span>
      </template>
    </div>
  </article>
</template>
