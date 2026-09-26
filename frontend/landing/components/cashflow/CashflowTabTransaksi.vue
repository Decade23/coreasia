<script setup lang="ts">
/**
 * Tab Transaksi bersama Pengguna 360 dan Ruang 360 — ranah `transaksi` (T2):
 * admin_transaksi_cari, keyset (occurred_at, created_at, id) desc, TANPA
 * note.
 *   mode 'pengguna'  transaksi yang DICATAT subjek, di ruang lingkup kasus
 *                    (saringan ?ruang= memilih salah satunya);
 *   mode 'ruang'     semua transaksi di ruang subjek (kolom Ruang diganti
 *                    Pencatat; tanpa saringan ruang).
 *
 * STATE DI URL (rencana, "State di URL"):
 * - saringan struktur ?ruang&dompet&kategori&jenis&dari&sampai&cek&sampah —
 *   replace; mengganti saringan kembali ke halaman pertama;
 * - halaman ?kursor=<base64url> — PUSH: riwayat peramban = tumpukan halaman;
 * - laci ?tx=<uuid> — PUSH: Back menutup laci.
 * Nominal (min/maks) TIDAK di URL — terlalu mengungkap untuk riwayat
 * peramban/log Vercel; ia di useState (per subjek), didebounce 300 ms.
 * ?cek= datang juga dari tautan Pemeriksaan ruang (server menghitung ulang
 * id-nya; tidak ada daftar id di URL).
 *
 * Setiap halaman = satu baris audit baca_transaksi (nama saringan saja, bukan
 * nilainya). Jawaban disimpan per (kasus, lingkup, mode, subjek, saringan,
 * kursor) di useCashflowKasus, jadi pindah tab/Back tidak memanggil ulang;
 * semuanya dibuang saat kasus habis.
 *
 * Catatan (T3) lewat CashflowTeksTerkunci — membuka catatan baris yang
 * diklik SAJA (satu id, satu baris audit baca_teks).
 * Tampilan < 640 px: kartu, saringan dilipat ke tombol "Saring (n)".
 * Pintasan: j/k pindah baris, ↵ buka laci, [ ] halaman keyset, c salin id.
 */
import { POLA_UUID } from '~/adapters/cashflow'
import {
  keTransaksiBaris, keSampahBaris, adaSampahLebih, labelJumlahSampah, kursorTransaksiDariUrl, tanggalJam,
  CEK_TRANSAKSI, POLA_KURSOR_URL,
  type TransaksiCariDTO, type SaringTransaksi, type TransaksiBaris,
} from '~/adapters/cashflowBuku'
import { tulisQuery, type SkemaQuery } from '~/adapters/cashflowQuery'
import type { NominalSaring } from '~/composables/cashflow/useCashflowNominal'

const { tcf, bahasa, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const route = useRoute()
const router = useRouter()
const kasus = useCashflowKasus()
const props = defineProps<{
  mode: 'pengguna' | 'ruang'
  /** Pengguna (mode pengguna) atau ruang (mode ruang). */
  subjek: string
  namaRuang: (ws: string) => string
  /** Label pencatat (mode ruang): email tersamar anggota, selain itu 8 aksara id. */
  labelOrang?: (uid: string | null) => string
}>()
const id = computed(() => props.subjek)
const modeRuang = computed(() => props.mode === 'ruang')
const { memuat, galat, pesanGalat, muat, pakaiSimpanan } = useCashflowMuat()

const PER = 100
const POLA_TGL = /^\d{4}-\d{2}-\d{2}$/
const SKEMA = {
  ruang: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  dompet: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  kategori: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  jenis: { jenis: 'pilihan', opsi: ['', 'masuk', 'keluar', 'transfer'], bawaan: '' },
  dari: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  sampai: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  cek: { jenis: 'pilihan', opsi: ['', ...CEK_TRANSAKSI], bawaan: '' },
  sampah: { jenis: 'pilihan', opsi: ['0', '1'], bawaan: '0' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
  tx: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

/* Nominal: useState per subjek (tidak di URL), didebounce sebelum dipakai.
   Mengubahnya kembali ke halaman pertama dan menutup laci, sama dengan
   saringan lain (temuan F9, useCashflowNominal). */
const nominal = useState<NominalSaring>(`cf_tx_nominal_${props.mode}_${id.value}`, () => ({ min: '', maks: '' }))
const { stabil: nominalStabil, menunggu: nominalKeAwal } = useCashflowNominal({ nominal, q, setel })
const keAngka = (s: string): number | null => {
  const t = s.replace(/[^\d]/g, '')
  return t ? Number(t) : null
}

const saring = computed<SaringTransaksi>(() => ({
  // Mode ruang: ruangnya subjek itu sendiri (p_ws), saringan ruang tidak berlaku.
  ruang: modeRuang.value ? null : q.value.ruang || null,
  dompet: q.value.dompet || null,
  kategori: q.value.kategori || null,
  jenis: q.value.jenis || null,
  dari: q.value.dari || null,
  sampai: q.value.sampai || null,
  min: keAngka(nominalStabil.value.min),
  maks: keAngka(nominalStabil.value.maks),
  cek: q.value.cek || null,
  sampah: q.value.sampah === '1',
}))
// Selama nominal baru menunggu URL-nya dikosongkan, kursor lama tidak dipakai.
const kursor = computed(() => (nominalKeAwal.value ? null : kursorTransaksiDariUrl(q.value.kursor)))
const kunciSaring = computed(() => JSON.stringify(saring.value))
const awalanKunci = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('transaksi') ? `${kasus.kunciKasus.value}|tx:${props.mode}:${id.value}|${kunciSaring.value}|` : null))
const kunci = computed(() => (awalanKunci.value ? `${awalanKunci.value}${kursor.value ? q.value.kursor : ''}` : null))
const mentah = computed(() => kasus.data<TransaksiCariDTO>(kunci.value))

watch(kunci, (k) => {
  if (!k) return
  if (mentah.value) { pakaiSimpanan(); return }
  const s = saring.value
  const ks = kursor.value
  muat(async () => { await kasus.muatData(k, kk => api.transaksiCari(kk.id, props.mode, id.value, s, ks, PER)) })
}, { immediate: true })

const baris = computed(() => mentah.value?.baris.map(keTransaksiBaris) ?? [])
const sampah = computed(() => mentah.value?.sampah?.map(keSampahBaris) ?? [])
/* Server memotong sampah di 50 baris; sampah_lebih (0092) menandai sisanya. */
const sampahLebih = computed(() => adaSampahLebih(mentah.value))
/* Total hanya di halaman pertama; halaman berikutnya meminjam angka itu. */
const total = computed(() => mentah.value?.total ?? kasus.data<TransaksiCariDTO>(awalanKunci.value)?.total ?? null)

// ── Saringan ───────────────────────────────────────────────────────────
type Ubah = Parameters<typeof setel>[0]
const saringUlang = (ubah: Ubah) => setel({ ...ubah, kursor: '', tx: '' })
const jumlahSaring = computed(() => ['ruang', 'dompet', 'kategori', 'jenis', 'dari', 'sampai', 'cek'].filter(k => !!q.value[k as keyof typeof q.value]).length
  + (q.value.sampah === '1' ? 1 : 0) + (nominal.value.min ? 1 : 0) + (nominal.value.maks ? 1 : 0))
const saringBuka = ref(false)
const pilihanRuang = computed(() => (modeRuang.value ? [] : (kasus.kasus.value?.ruang ?? []).map(w => ({ id: w, nama: props.namaRuang(w) }))))
const labelDompet = computed(() => (q.value.dompet ? (baris.value.find(t => t.dompetId === q.value.dompet)?.dompet ?? q.value.dompet.slice(0, 8)) : ''))
const labelKategori = computed(() => (q.value.kategori ? (baris.value.find(t => t.kategoriId === q.value.kategori)?.kategori || q.value.kategori.slice(0, 8)) : ''))
const bersihkan = () => {
  nominal.value = { min: '', maks: '' }
  setel({ ruang: '', dompet: '', kategori: '', jenis: '', dari: '', sampai: '', cek: '', sampah: '0', kursor: '', tx: '' })
}
const opsiJenis = computed(() => [
  { nilai: '' as const, label: tcf('umum.semua') },
  { nilai: 'masuk' as const, label: tcf('transaksi.masuk') },
  { nilai: 'keluar' as const, label: tcf('transaksi.keluar') },
  { nilai: 'transfer' as const, label: tcf('transaksi.transfer') },
])

// ── Halaman keyset (push; [ ] di useCashflowKursor) ────────────────────
const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => mentah.value?.kursor_berikut,
  ke: kursor => setel({ kursor, tx: '' }, { dorong: true }),
})

// ── Laci ?tx= (push; Back menutup) ─────────────────────────────────────
const bukaLaci = (tx: string) => setel({ tx }, { dorong: true })
const tutupLaci = () => {
  const tanpaTx = router.resolve({ path: route.path, query: tulisQuery(SKEMA, { ...q.value, tx: '' }) }).fullPath
  const b: unknown = import.meta.client ? window.history.state?.back : null
  if (b === tanpaTx) router.back()
  else setel({ tx: '' })
}

// ── Papan ketik ────────────────────────────────────────────────────────
const sorot = ref(-1)
const idSorot = useState<string | null>('cf_salin_sorot', () => null)
watch(baris, () => { sorot.value = -1 })
watch(sorot, (i) => { idSorot.value = baris.value[i]?.id ?? null })
onBeforeUnmount(() => { idSorot.value = null })
const gerak = (n: number) => {
  if (!baris.value.length) return
  sorot.value = Math.min(baris.value.length - 1, Math.max(0, sorot.value + n))
  if (import.meta.client) document.getElementById(`cf-tx-${sorot.value}`)?.scrollIntoView({ block: 'nearest' })
}
useCashflowPintasan([
  { kunci: 'j', aksi: () => gerak(1) },
  { kunci: 'k', aksi: () => gerak(-1) },
  // Tanpa baris tersorot tidak ada yang dibuka: false = Enter dibiarkan ke peramban.
  { kunci: 'enter', aksi: () => { const t = baris.value[sorot.value]; if (!t) return false; bukaLaci(t.id); return true } },
])

const labelPencatat = (p: string | null) => {
  if (!p) return '—'
  if (props.labelOrang) return props.labelOrang(p)
  return p === id.value ? tcf('laci.subjekIni') : p.slice(0, 8)
}
/** Kolom kedua: ruang (mode pengguna) atau pencatat (mode ruang). */
const kolomKedua = (t: TransaksiBaris) => (modeRuang.value ? labelPencatat(t.pencatat) : props.namaRuang(t.ruangId))
const pesanKosong = computed(() => {
  if (jumlahSaring.value) return tcf('umum.kosongSaring')
  if (!modeRuang.value && !kasus.kasus.value?.ruang.length) return tcf('transaksi.tanpaRuang')
  return tcf('transaksi.kosong')
})
const pilihBaris = (t: TransaksiBaris, i: number) => { sorot.value = i; bukaLaci(t.id) }
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <!-- Saringan: dilipat di layar sempit. -->
    <div class="flex items-center gap-2 sm:hidden">
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-sm" :aria-expanded="saringBuka" @click="saringBuka = !saringBuka">
        <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" /> {{ tcf('saring.tombol')(jumlahSaring) }}
      </button>
    </div>
    <div class="grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end" :class="saringBuka ? 'grid' : 'hidden sm:flex'">
      <label v-if="!modeRuang" class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)] sm:col-span-1">
        {{ tcf('transaksi.ruang') }}
        <select :value="q.ruang" class="ca-input" @change="saringUlang({ ruang: ($event.target as HTMLSelectElement).value })">
          <option value="">{{ tcf('saring.semuaRuang') }}</option>
          <option v-for="r in pilihanRuang" :key="r.id" :value="r.id">{{ r.nama }}</option>
        </select>
      </label>
      <div class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)] sm:col-span-1">
        {{ tcf('transaksi.jenis') }}
        <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
          <button
            v-for="o in opsiJenis" :key="o.nilai || 'semua'" type="button"
            class="rounded-full px-3 py-1 transition"
            :class="q.jenis === o.nilai ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
            :aria-pressed="q.jenis === o.nilai" @click="saringUlang({ jenis: o.nilai })"
          >{{ o.label }}</button>
        </div>
      </div>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.dari') }}
        <input type="date" :value="q.dari" class="ca-input" @change="saringUlang({ dari: ($event.target as HTMLInputElement).value })">
      </label>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.sampai') }}
        <input type="date" :value="q.sampai" class="ca-input" @change="saringUlang({ sampai: ($event.target as HTMLInputElement).value })">
      </label>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.min') }}
        <input v-model="nominal.min" inputmode="numeric" class="ca-input sm:w-32" :placeholder="tcf('saring.rp')" autocomplete="off">
      </label>
      <label class="flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('saring.maks') }}
        <input v-model="nominal.maks" inputmode="numeric" class="ca-input sm:w-32" :placeholder="tcf('saring.rp')" autocomplete="off">
      </label>
      <label class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)] sm:col-span-1">
        {{ tcf('saring.cek') }}
        <select :value="q.cek" class="ca-input" @change="saringUlang({ cek: ($event.target as HTMLSelectElement).value as typeof q.cek })">
          <option value="">{{ tcf('saring.tanpaCek') }}</option>
          <option v-for="c in CEK_TRANSAKSI" :key="c" :value="c">{{ tcf(`saring.cekOpsi.${c}`) }}</option>
        </select>
      </label>
      <label class="col-span-2 inline-flex items-center gap-2 py-2 text-sm text-[var(--ca-text)] sm:col-span-1">
        <input type="checkbox" class="accent-[var(--ca-brand)]" :checked="q.sampah === '1'" @change="saringUlang({ sampah: ($event.target as HTMLInputElement).checked ? '1' : '0' })">
        {{ tcf('saring.sampah') }}
      </label>
      <button v-if="jumlahSaring" type="button" class="col-span-2 text-left text-xs text-[var(--ca-muted)] underline-offset-2 hover:underline sm:col-span-1 sm:py-2" @click="bersihkan">{{ tcf('saring.bersihkan') }}</button>
    </div>
    <div v-if="q.dompet || q.kategori" class="flex flex-wrap gap-2 text-xs">
      <button v-if="q.dompet" type="button" class="ca-pill-info" @click="saringUlang({ dompet: '' })">{{ tcf('transaksi.dompet') }}: {{ labelDompet }} ×</button>
      <button v-if="q.kategori" type="button" class="ca-pill-info" @click="saringUlang({ kategori: '' })">{{ tcf('transaksi.kategori') }}: {{ labelKategori }} ×</button>
    </div>

    <CashflowPanelTab
      ranah="transaksi" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah"
      :kosong="!!mentah && !baris.length && !sampah.length" :pesan-kosong="pesanKosong"
    >
      <div v-if="mentah" class="space-y-4" :class="{ 'opacity-60': memuat }">
        <!-- ≥ 640 px: tabel -->
        <div v-if="baris.length" class="ca-console-dialog hidden overflow-x-auto sm:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
                <th class="px-4 py-2">{{ tcf('transaksi.tanggal') }}</th>
                <th class="hidden px-3 py-2 md:table-cell">{{ modeRuang ? tcf('r360.pencatat') : tcf('transaksi.ruang') }}</th>
                <th class="px-3 py-2">{{ tcf('transaksi.dompet') }}</th>
                <th class="px-3 py-2">{{ tcf('transaksi.kategori') }}</th>
                <th class="px-3 py-2">{{ tcf('transaksi.penanda') }}</th>
                <th class="px-4 py-2 text-right">{{ tcf('transaksi.nominal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(t, i) in baris" :id="`cf-tx-${i}`" :key="t.id"
                class="cursor-pointer border-t border-[color:var(--ca-border)] text-[var(--ca-text)] transition"
                :class="sorot === i ? 'bg-[var(--ca-gold-bg)]' : 'hover:bg-[var(--ca-panel-bg-strong)]'"
                :aria-selected="sorot === i"
                @click="pilihBaris(t, i)"
              >
                <td class="whitespace-nowrap px-4 py-1.5 tabular-nums">{{ tanggalJam(t.tanggal, t.jam, bahasa) }}</td>
                <td class="hidden px-3 py-1.5 md:table-cell" :class="{ 'font-mono text-xs': modeRuang }">{{ kolomKedua(t) }}</td>
                <td class="px-3 py-1.5">
                  <button v-if="t.dompetId" type="button" class="text-left underline-offset-2 hover:underline" :title="tcf('transaksi.saringIni')" @click.stop="saringUlang({ dompet: t.dompetId })">{{ t.dompet }}</button>
                  <span v-else>{{ t.dompet }}</span>
                </td>
                <td class="px-3 py-1.5">
                  <button v-if="t.kategoriId" type="button" class="text-left underline-offset-2 hover:underline" :title="tcf('transaksi.saringIni')" @click.stop="saringUlang({ kategori: t.kategoriId })">{{ t.kategori || '—' }}</button>
                  <span v-else>{{ t.kategori || '—' }}</span>
                </td>
                <td class="px-3 py-1.5">
                  <span class="inline-flex flex-wrap items-center gap-1">
                    <span v-if="t.transfer" class="ca-pill-info whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.transfer') }}</span>
                    <span v-if="t.masaDepan" class="ca-pill-gold whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.masaDepan') }}</span>
                    <span v-if="t.cicilanKe != null" class="ca-pill-muted whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.cicilan')(t.cicilanKe) }}</span>
                    <span v-if="t.adaLampiran" class="ca-pill-muted whitespace-nowrap text-[0.7rem]">{{ tcf('transaksi.lampiran') }}</span>
                    <CashflowTeksTerkunci v-if="t.adaCatatan" jenis="transaksi" :id="t.id" />
                  </span>
                </td>
                <td class="px-4 py-1.5 text-right"><CashflowNominal :nilai="t.nominal" :jenis="t.jenis" :arah="t.arah" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- < 640 px: kartu -->
        <ul v-if="baris.length" class="space-y-2 sm:hidden">
          <CashflowBarisTransaksi
            v-for="(t, i) in baris" :key="t.id" :t="t" :ruang="kolomKedua(t)" :sorot="sorot === i"
            @buka="pilihBaris(t, i)"
          />
        </ul>

        <CashflowPagerKursor
          v-if="baris.length" :halaman-pertama="!q.kursor" :ada-berikut="!!mentah.kursor_berikut"
          :jumlah="baris.length" :total="total" :memuat="memuat"
          @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
        />

        <!-- Kecocokan di sampah (halaman pertama, ?sampah=1) -->
        <section v-if="sampah.length" class="ca-console-dialog p-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('transaksi.diSampah')(labelJumlahSampah(sampah.length, sampahLebih)) }}</h3>
          <p v-if="sampahLebih" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('transaksi.sampahLebih') }}</p>
          <ul class="mt-2 divide-y divide-[color:var(--ca-border)] text-sm">
            <li v-for="s in sampah" :key="s.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <button type="button" class="min-w-0 flex-1 text-left" @click="bukaLaci(s.txId)">
                <span class="text-[var(--ca-text)]">{{ s.dompet }}</span>
                <span class="block text-xs text-[var(--ca-subtle)]">
                  {{ tcf('transaksi.dihapusPada')(formatWaktu(s.dihapusIso)) }} · {{ tcf('transaksi.olehLabel') }} {{ labelPencatat(s.dihapusOleh) }}
                  <template v-if="s.dipulihkanIso"> · {{ tcf('laci.dipulihkan') }}</template>
                </span>
              </button>
              <CashflowTeksTerkunci v-if="s.adaCatatan" jenis="sampah" :id="s.id" />
              <CashflowNominal :nilai="s.nominal" :jenis="s.jenis" />
            </li>
          </ul>
        </section>
      </div>
    </CashflowPanelTab>

    <CashflowLaci :show="!!q.tx" :judul="tcf('laci.judul')" @close="tutupLaci">
      <CashflowLaciTransaksi v-if="q.tx" :key="q.tx" :tx="q.tx" :subjek="mode === 'pengguna' ? id : ''" :nama-ruang="namaRuang" @pindah="bukaLaci" />
    </CashflowLaci>
  </div>
</template>
