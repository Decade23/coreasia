<script setup lang="ts">
/**
 * Audit CashFlow — dibaca LANGSUNG dari Supabase admin_audit dengan sesi
 * CashFlow. Tidak disalin ke gateway_audit_logs: target_id dan reason bisa
 * memuat nama; menyalinnya ke basis data kedua = PII di dua tempat.
 *
 * Saringan di URL (?aksi&pelaku&hal, replace) supaya refresh dan tautan yang
 * dibagikan membuka tampilan yang sama. `aksi` disaring server; `pelaku`
 * disaring di klien karena semua baris dijalankan satu identitas konsol —
 * yang membedakan manusianya hanya kolom pelaku (0078), bukan admin_id.
 * Server memulangkan paling banyak 500 baris; lebih dari itu dikatakan.
 *
 * ?pelaku= berisi SIDIK email pelaku (sha256, 10 aksara), bukan emailnya:
 * URL yang dimuat penuh tercatat di riwayat peramban dan log Vercel, dan ikut
 * ke ?ke= saat sambung ulang. Sidik dipetakan balik ke email dari baris yang
 * sudah dimuat; tautan dengan sidik yang tidak ada di baris ini menyaring
 * menjadi kosong, bukan mengabaikan saringannya.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { AuditDTO } from '~/composables/cashflow/useCashflowAdmin'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { samarkanEmail, sidik, POLA_SIDIK } from '~/adapters/cashflow'
import { potongHalaman, halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
const { tcf, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const MAKS = 500
const PER = 25
const SKEMA = {
  aksi: { jenis: 'teks', pola: /^[a-z0-9_]+$/, maks: 64, bawaan: '' },
  pelaku: { jenis: 'teks', pola: POLA_SIDIK, maks: 10, bawaan: '' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const rows = ref<AuditDTO[]>([])
const total = ref(0)
const aksi = ref<Array<{ action: string; jumlah: number }>>([])

const muatAudit = () => muat(async (terbaru) => {
  const [r, a] = await Promise.all([api.daftarAudit(MAKS, 0, q.value.aksi || null), api.aksiAudit()])
  if (!terbaru()) return // saringan aksi sudah berganti lagi
  rows.value = r
  total.value = r.length ? Number(r[0]?.total_semua ?? r.length) : 0
  aksi.value = a
})
onMounted(muatAudit)
watch(() => q.value.aksi, muatAudit)

const pelakuDari = (r: AuditDTO) => r.pelaku || r.admin_email

/* sidik → email, dihitung ulang tiap baris berganti (crypto.subtle asinkron).
   `petaSiap` menahan saringan dan penjepitan ?hal sampai peta selesai. */
const petaSidik = shallowRef(new Map<string, string>())
const petaSiap = ref(false)
watch(rows, async (r) => {
  petaSiap.value = false
  let peta = new Map<string, string>()
  try {
    const email = [...new Set(r.map(pelakuDari).filter(Boolean))]
    peta = new Map(await Promise.all(email.map(async e => [await sidik(e), e] as const)))
  } catch {
    // crypto.subtle tidak ada (bukan konteks aman): saringan pelaku kosong, halaman tetap jalan.
  }
  if (r !== rows.value) return // baris sudah berganti lagi
  petaSidik.value = peta
  petaSiap.value = true
})
const opsiPelaku = computed(() => {
  const opsi = [...petaSidik.value].map(([nilai, label]) => ({ nilai, label })).sort((a, b) => a.label.localeCompare(b.label))
  // Sidik dari tautan yang pelakunya tidak ada di baris ini tetap tampil terpilih.
  if (q.value.pelaku && !petaSidik.value.has(q.value.pelaku)) opsi.push({ nilai: q.value.pelaku, label: q.value.pelaku })
  return opsi
})
const tersaring = computed(() => {
  if (!q.value.pelaku) return rows.value
  const email = petaSidik.value.get(q.value.pelaku)
  return email ? rows.value.filter(r => pelakuDari(r) === email) : []
})
const menunggu = computed(() => memuat.value || (!!q.value.pelaku && !petaSiap.value))
const hal = computed(() => (menunggu.value ? q.value.hal : halamanAman(q.value.hal, tersaring.value.length, PER)))
const jumlahHal = computed(() => jumlahHalaman(tersaring.value.length, PER))
const barisHalaman = computed(() => potongHalaman(tersaring.value, hal.value, PER))
const terpotong = computed(() => total.value > rows.value.length)

// Mengganti saringan = kembali ke halaman 1.
const pilihAksi = (v: string) => setel({ aksi: v, hal: 1 })
const pilihPelaku = (v: string) => setel({ pelaku: v, hal: 1 })

// Pindah halaman: kembali ke kepala tabel, bukan tetap di pager di bawah.
const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('audit.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('audit.ket') }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <select :value="q.aksi" class="ca-input" :aria-label="tcf('audit.aksi')" @change="pilihAksi(($event.target as HTMLSelectElement).value)">
        <option value="">{{ tcf('umum.semua') }}</option>
        <option v-for="a in aksi" :key="a.action" :value="a.action">{{ a.action }} ({{ a.jumlah }})</option>
      </select>
      <select :value="q.pelaku" class="ca-input" :aria-label="tcf('audit.admin')" @change="pilihPelaku(($event.target as HTMLSelectElement).value)">
        <option value="">{{ tcf('audit.semuaPelaku') }}</option>
        <option v-for="p in opsiPelaku" :key="p.nilai" :value="p.nilai">{{ p.label }}</option>
      </select>
    </div>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="menunggu" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <p v-if="terpotong" class="text-xs ca-tone-gold">{{ tcf('umum.potong')(rows.length, total) }}</p>
      <div ref="wadahDaftar" class="ca-console-dialog scroll-mt-24 overflow-x-auto">
        <CashflowKeadaanKosong v-if="!barisHalaman.length" class="m-5" :pesan="rows.length ? tcf('umum.kosongSaring') : tcf('umum.kosong')" icon="lucide:scroll-text" />
        <table v-else class="w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="px-4 py-2">{{ tcf('audit.waktu') }}</th><th class="px-4 py-2">{{ tcf('audit.aksi') }}</th><th class="px-4 py-2">{{ tcf('audit.admin') }}</th><th class="px-4 py-2">{{ tcf('audit.target') }}</th><th class="px-4 py-2">{{ tcf('audit.alasan') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="r in barisHalaman" :key="r.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="px-4 py-1.5 whitespace-nowrap text-xs text-[var(--ca-subtle)] tabular-nums">{{ formatWaktu(r.created_at) }}</td>
              <td class="px-4 py-1.5"><span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-xs">{{ r.action }}</span></td>
              <td class="px-4 py-1.5 font-mono text-xs">
                <!-- pelaku = email admin console yang memegang sesi, diisi server (0078);
                     admin_email = identitas Supabase yang menjalankan RPC. -->
                <span v-if="r.pelaku" :title="r.admin_email">{{ r.pelaku }}</span>
                <span v-else>{{ r.admin_email }}</span>
              </td>
              <td class="px-4 py-1.5 font-mono text-xs">
                <!-- Target pengguna menuju detail (yang tetap meminta alasan); target lain teks saja.
                     target_email null pada target 'user' = akunnya sudah hilang (left join
                     auth.users). Tanpa tautan: detailnya hanya berujung "tidak ditemukan"
                     sesudah admin mengetik alasan. -->
                <NuxtLink
                  v-if="r.target_type === 'user' && r.target_id && r.target_email"
                  :to="`/console/cashflow/pengguna/${r.target_id}`"
                  class="underline-offset-2 hover:underline"
                >{{ samarkanEmail(r.target_email) }}</NuxtLink>
                <span v-else-if="r.target_type === 'user' && r.target_id" class="text-[var(--ca-subtle)]">{{ tcf('audit.akunHilang') }} · {{ r.target_id.slice(0, 8) }}</span>
                <span v-else>{{ r.target_email ? samarkanEmail(r.target_email) : (r.target_id?.slice(0, 8) || '—') }}</span>
              </td>
              <td class="px-4 py-1.5 text-xs text-[var(--ca-muted)]">{{ r.reason || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CashflowHalaman
        v-if="tersaring.length"
        :hal="hal" :jumlah-halaman="jumlahHal" :total="tersaring.length" :per="PER"
        @ganti="gantiHalaman"
      />
    </template>
  </div>
</template>
