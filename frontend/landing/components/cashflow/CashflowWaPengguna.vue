<script setup lang="ts">
/**
 * Tabel per pengguna di laporan catat lewat WhatsApp: pesan, yang tercatat,
 * catatan (48 jam), terakhir kirim, sisa kuota Pro, versi aplikasi, status
 * sakelar catat WA, dan tautan ke Perjalanan 360 mulai awal periode.
 *
 * Identitas mengikuti sakelar Kontak lengkap halaman: tanpa alasan server
 * mengirim email tersamar, nama kosong, dan waktu dibulatkan ke awal hari WIB
 * (maka yang tampil hanya tanggal). Dengan alasan, email dan nama utuh dan
 * waktunya persis. `pengguna` null = sesi tanpa izin data pribadi.
 *
 * Hanya tampilan: menerima bentuk domain dari adapters/cashflowWaLaporan.
 */
import { angka } from '~/adapters/cashflow'
import { tanggalPendek, waktuPendekWib } from '~/adapters/cashflowWaktu'
import { keadaanKuotaWa, tautanPerjalananWa, type PenggunaWa, type StatusCatatWa } from '~/adapters/cashflowWaLaporan'

const props = defineProps<{
  pengguna: PenggunaWa[] | null
  total: number | null
  terbuka: boolean
  sejak: string | null
  perluVerifikasi?: boolean
}>()
const { tcf, bahasa } = useCashflowI18n()

const siapa = (p: PenggunaWa) => (props.terbuka ? p.nama || p.email : p.email || p.nama) || (tcf('waCatat.pengguna.tanpaNama') as string)
const kedua = (p: PenggunaWa) => (props.terbuka && p.nama && p.email ? p.email : '')
const terakhir = (p: PenggunaWa) => (!p.terakhir ? '' : props.terbuka ? waktuPendekWib(p.terakhir, bahasa.value) : tanggalPendek(p.terakhir, bahasa.value))
const kuota = (p: PenggunaWa) => {
  const k = keadaanKuotaWa(p.kuota)
  if (k.jenis === 'pro') return { teks: tcf('waCatat.pengguna.kuota.pro') as string, kelas: 'ca-pill-emerald' }
  if (k.jenis === 'bebas') return { teks: tcf('waCatat.pengguna.kuota.bebas') as string, kelas: 'ca-pill-muted' }
  if (k.jenis === 'sisa') {
    return k.habis
      ? { teks: tcf('waCatat.pengguna.kuota.habis') as string, kelas: 'ca-pill-danger' }
      : { teks: tcf('waCatat.pengguna.kuota.sisa')(angka(k.sisa), angka(k.batas)) as string, kelas: '' }
  }
  return { teks: '', kelas: '' }
}
const NADA: Record<StatusCatatWa, string> = {
  menyala: 'ca-tone-emerald', mati: 'ca-tone-gold', tanpa_setelan: 'text-[var(--ca-muted)]', lain: 'text-[var(--ca-muted)]',
}
const versi = (p: PenggunaWa) => (p.versi ? [p.versi.versi, p.versi.kode ? `(${p.versi.kode})` : ''].filter(Boolean).join(' ') : '')
const tautan = (p: PenggunaWa) => tautanPerjalananWa(p.id, props.sejak)
const terpotong = computed(() => !!props.pengguna && props.total !== null && props.total > props.pengguna.length)
</script>

<template>
  <section class="min-w-0 space-y-3" data-uji="wa-pengguna">
    <div class="min-w-0">
      <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.pengguna.judul') }}</h2>
      <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.pengguna.ket') }} {{ tcf('waCatat.pengguna.catatanKet') }}</p>
      <p v-if="pengguna" class="mt-1 text-xs text-[var(--ca-subtle)]" data-uji="wa-pengguna-identitas">
        {{ terbuka ? tcf('waCatat.pengguna.terbuka') : tcf('waCatat.pengguna.tersamar') }}
      </p>
    </div>

    <CashflowIzinKurang v-if="!pengguna || perluVerifikasi" baca :pesan="tcf('waCatat.pengguna.butuhPii')" />
    <template v-if="pengguna">
      <CashflowKeadaanKosong v-if="!pengguna.length" :pesan="tcf('waCatat.pengguna.kosong')" icon="lucide:users" />
      <template v-else>
        <CashflowTabel lebar-min="62rem" data-uji="wa-pengguna-tabel">
          <caption class="sr-only">{{ tcf('waCatat.pengguna.judul') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ tcf('waCatat.pengguna.kolom.pengguna') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.pengguna.kolom.pesan') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.pengguna.kolom.dicatat') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.pengguna.kolom.catatan') }}</th>
              <th scope="col">{{ tcf('waCatat.pengguna.kolom.terakhir') }}</th>
              <th scope="col">{{ tcf('waCatat.pengguna.kolom.kuota') }}</th>
              <th scope="col">{{ tcf('waCatat.pengguna.kolom.versi') }}</th>
              <th scope="col">{{ tcf('waCatat.pengguna.kolom.status') }}</th>
              <th scope="col"><span class="sr-only">{{ tcf('waCatat.pengguna.kolom.perjalanan') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pengguna" :key="p.id" :data-pengguna="p.id">
              <td class="min-w-[14rem] max-w-[20rem]">
                <span class="flex min-w-0 items-center gap-2">
                  <span class="cf-kuat min-w-0 break-words">{{ siapa(p) }}</span>
                  <span v-if="p.internal" class="ca-pill-info shrink-0 !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight">{{ tcf('waCatat.pengguna.tim') }}</span>
                </span>
                <span v-if="kedua(p)" class="cf-dua break-words">{{ kedua(p) }}</span>
              </td>
              <td class="cf-ka cf-kuat">{{ angka(p.pesan) }}</td>
              <td class="cf-ka">{{ angka(p.dicatat) }}</td>
              <td class="cf-ka">{{ angka(p.catatan) }}</td>
              <td class="whitespace-nowrap tabular-nums"><template v-if="terakhir(p)">{{ terakhir(p) }}</template><span v-else class="wa-kosong"><span class="sr-only">{{ tcf('waCatat.pengguna.kosongSel') }}</span></span></td>
              <td class="whitespace-nowrap">
                <span v-if="kuota(p).kelas" :class="kuota(p).kelas" class="!rounded-lg !px-2 !py-0.5 text-xs leading-tight">{{ kuota(p).teks }}</span>
                <span v-else-if="kuota(p).teks" class="tabular-nums">{{ kuota(p).teks }}</span>
                <span v-else class="wa-kosong"><span class="sr-only">{{ tcf('waCatat.pengguna.kosongSel') }}</span></span>
              </td>
              <td class="whitespace-nowrap text-xs tabular-nums text-[var(--ca-muted)]"><template v-if="versi(p)">{{ versi(p) }}</template><span v-else class="wa-kosong"><span class="sr-only">{{ tcf('waCatat.pengguna.kosongSel') }}</span></span></td>
              <td class="whitespace-nowrap"><span class="text-sm font-semibold" :class="NADA[p.status]">{{ tcf(`waCatat.pengguna.status.${p.status}`) }}</span></td>
              <td class="whitespace-nowrap text-right">
                <NuxtLink
                  :to="tautan(p)" class="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[var(--ca-accent)] hover:underline"
                  :aria-label="tcf('waCatat.pengguna.bukaPerjalanan')(siapa(p))" data-uji="wa-pengguna-perjalanan"
                >
                  {{ tcf('waCatat.pengguna.kolom.perjalanan') }}
                  <Icon name="lucide:arrow-up-right" class="h-3.5 w-3.5" aria-hidden="true" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </CashflowTabel>
        <p v-if="terpotong" class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.pengguna.potong')(angka(pengguna.length), angka(total ?? 0)) }}</p>
      </template>
    </template>
  </section>
</template>

<style scoped>
/* Sel kosong: tanda pisah hanya tampilan (bukan teks), pembaca layar mendengar "tidak ada". */
.wa-kosong::before { content: '\2014'; color: var(--ca-subtle); }
</style>
