<script setup lang="ts">
/**
 * Asisten AI — setelan penyedia, katalog model, effort, kredit, dan harga
 * paket untuk asisten di aplikasi (spek November 2026).
 *
 * KUNCI PENYEDIA TIDAK ADA DI HALAMAN INI. Katalog model dan uji koneksi
 * melewati route server (server/api/console/ai/*) yang memegang
 * OPENAI_API_KEY. Halaman hanya mengirim access token sesi CashFlow ke route
 * itu supaya server bisa membaca base URL lewat admin_ai_setelan.
 *
 * PETA DATA.
 * - admin_ai_setelan() mengisi isian: aktif, provider, base URL, tiga model,
 *   tiga effort, kredit gratis, harga tiga paket, versi prompt.
 * - admin_ai_setelan_simpan(p) menyimpan semuanya sekaligus. Server menolak
 *   sesi tanpa cashflow:pii; galatnya ditampilkan di kartu simpan, bukan
 *   ditelan toast.
 * - admin_ai_ringkas() mengisi empat ubin: pesan, token, biaya, saldo
 *   kredit beredar.
 * - Katalog model dari GET /api/console/ai/models, dinormalkan adapter. Saat
 *   daftar penyedia gagal dibaca, daftar bawaan dipakai dan halaman menyebut
 *   sebabnya.
 * - Uji koneksi ke POST /api/console/ai/uji: satu kalimat pendek, jawaban
 *   maksimal 200 aksara. Teks jawaban dirender sebagai teks polos.
 *
 * RPC yang belum terpasang (PGRST202) = halaman menampilkan nilai bawaan
 * dengan semua isian terkunci, bukan formulir yang seolah bisa menyimpan.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import {
  EFFORT_AI, KALIMAT_UJI, MODEL_AI_BAWAAN, PAKET_KREDIT, PENYEDIA_AI,
  baseUrlAiSah, effortUntukModel, hargaAiSah, keHasilUjiAi, keKatalogAi, keRingkasAi, keSetelanAi,
  kreditGratisAiSah, modelAiSah, nilaiSimpanAi, punyaEffortAi, samaSetelanAi, sebabGalatUjiAi,
  type EffortAi, type HasilUjiAi, type KatalogAi, type ModelAi, type PaketKredit, type RingkasAi, type SetelanAi,
} from '~/adapters/cashflowAi'

definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const toast = useToast()
const { memuat, galat, pesanGalat, pesanUntuk, muat, aksi, batal } = useCashflowMuat({ awal: true })

/** Setelan tersimpan sebagai pembanding; null = belum berhasil dibaca. */
const asli = shallowRef<SetelanAi | null>(null)
/** Isian aktif. Nilai bawaan dipasang lebih dulu supaya formulir tidak kosong. */
const isian = reactive<SetelanAi>(keSetelanAi(null))
const ringkas = shallowRef<RingkasAi | null>(null)
const ringkasGagal = ref(false)
const katalog = shallowRef<KatalogAi | null>(null)
const memuatKatalog = ref(false)
const katalogGagalMuat = ref(false)
const galatSimpan = ref('')

const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
/** Hanya setelan yang benar-benar terbaca yang boleh disunting dan disimpan. */
const bisaUbah = computed(() => !!asli.value && !belumAktif.value)

const terapkan = (s: SetelanAi) => {
  Object.assign(isian, s)
  isian.harga = { ...s.harga }
  asli.value = { ...s, harga: { ...s.harga } }
  ujiModel.value = s.modelChat
  ujiEffort.value = s.effortChat
}

const muatRingkas = async () => {
  try {
    ringkas.value = keRingkasAi(await api.aiRingkas())
    ringkasGagal.value = false
  } catch {
    ringkas.value = null
    ringkasGagal.value = true
  }
}

const muatSemua = async () => {
  const ok = await muat(async () => {
    terapkan(keSetelanAi(await api.aiSetelan()))
  })
  if (!ok && belumAktif.value && !asli.value) {
    // RPC belum terpasang: tampilkan nilai bawaan, terkunci, tanpa pura-pura
    // bisa menyimpan.
    terapkan(keSetelanAi(null))
  }
  if (ok) await muatRingkas()
}

/** Access token sesi CashFlow untuk route server (bukan untuk penyedia). */
const ambilToken = async (): Promise<string | null> => {
  try {
    const sb = await sesi.ambil()
    if (!sb) return null
    const { data } = await sb.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

const muatKatalog = async () => {
  if (memuatKatalog.value) return
  memuatKatalog.value = true
  katalogGagalMuat.value = false
  try {
    const token = await ambilToken()
    const k = await $fetch<Record<string, unknown>>('/api/console/ai/models', {
      headers: {
        ...headerIkatan(),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
    katalog.value = keKatalogAi(k)
  } catch (e) {
    if (pulihkanIkatan(e)) return
    katalog.value = keKatalogAi(null)
    katalogGagalMuat.value = true
  } finally {
    memuatKatalog.value = false
  }
}

onMounted(async () => {
  await muatSemua()
  await muatKatalog()
})
onBeforeUnmount(batal)

// ── Isian ────────────────────────────────────────────────────────────
const opsiPenyedia = computed(() => {
  const daftar = PENYEDIA_AI.map(p => ({ nilai: p as string, label: tcf(`ai.penyediaNilai.${p}`) as string }))
  return daftar.some(o => o.nilai === isian.provider) ? daftar : [...daftar, { nilai: isian.provider, label: isian.provider }]
})
const opsiEffort = computed(() => EFFORT_AI.map(e => ({ nilai: e as string, label: tcf(`ai.effortNilai.${e}`) as string })))

/** Katalog ditambah nilai tersimpan yang tidak ada di katalog (jangan hilang). */
const opsiModel = (nilai: string): ModelAi[] => {
  const daftar = (katalog.value?.daftar ?? MODEL_AI_BAWAAN).map(m => ({ ...m, effort: [...m.effort] }))
  if (!nilai || daftar.some(m => m.id === nilai)) return daftar
  return [...daftar, { id: nilai, alasan: punyaEffortAi(nilai), effort: effortUntukModel(nilai) }]
}
const infoModel = (nilai: string): string => {
  const m = katalog.value?.daftar.find(x => x.id === nilai)
  const alasan = m ? m.alasan : punyaEffortAi(nilai)
  return alasan ? tcf('ai.modelPunyaEffort') : tcf('ai.modelTanpaEffort')
}
const pilihEffort = (e: Event, bidang: 'effortChat' | 'effortAnalisa' | 'effortLaporan') => {
  const v = (e.target as HTMLSelectElement).value
  const f = EFFORT_AI.find(x => x === v)
  if (f) isian[bidang] = f
}
const pilihEffortUji = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  const f = EFFORT_AI.find(x => x === v)
  if (f) ujiEffort.value = f
}
const angkaDari = (e: Event): number => {
  const n = Number((e.target as HTMLInputElement).value)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}
const setKredit = (e: Event) => {
  isian.kreditGratis = Math.min(1_000, Math.max(0, angkaDari(e)))
}
const setHarga = (e: Event, paket: PaketKredit) => {
  isian.harga[paket] = Math.min(100_000_000, Math.max(0, angkaDari(e)))
}

const galatIsian = computed(() => {
  if (!baseUrlAiSah(isian.baseUrl)) return tcf('ai.baseUrlGalat')
  if (!modelAiSah(isian.modelChat) || !modelAiSah(isian.modelMurah) || !modelAiSah(isian.modelEmbed)) return tcf('ai.modelGalat')
  if (!kreditGratisAiSah(isian.kreditGratis)) return tcf('ai.kreditGalat')
  for (const p of PAKET_KREDIT) if (!hargaAiSah(isian.harga[p])) return tcf('ai.hargaGalat')
  return ''
})
const berubah = computed(() => !!asli.value && !samaSetelanAi(isian, asli.value))

type Sibuk = 'simpan' | null
const sibuk = ref<Sibuk>(null)
const bolehSimpan = computed(() => bisaUbah.value && berubah.value && !sibuk.value && !galatIsian.value)

const simpan = async () => {
  if (sibuk.value) return
  galatSimpan.value = ''
  if (!bolehSimpan.value) {
    if (!berubah.value) toast.error(tcf('ai.belumBerubah'))
    else if (galatIsian.value) toast.error(galatIsian.value)
    return
  }
  sibuk.value = 'simpan'
  try {
    const ok = await aksi(async () => {
      await api.aiSetelanSimpan(nilaiSimpanAi(isian))
    }, {
      sukses: tcf('ai.tersimpan'),
      gagal: (g) => { galatSimpan.value = `${tcf('ai.simpanDitolak')} ${pesanUntuk(g)}` },
    })
    if (!ok) return
    const segar = await api.aiSetelan().catch(() => null)
    if (segar) terapkan(keSetelanAi(segar))
    else asli.value = { ...isian, harga: { ...isian.harga } }
    await muatRingkas()
  } finally {
    sibuk.value = null
  }
}

// ── Uji koneksi ──────────────────────────────────────────────────────
const ujiModel = ref('')
const ujiEffort = ref<EffortAi>('low')
const ujiSibuk = ref(false)
const hasilUji = shallowRef<HasilUjiAi | null>(null)
const galatUji = ref('')
/** Katalog menjawab bahwa kunci penyedia belum dipasang di server. */
const tanpaKunci = computed(() => katalog.value?.belumTerkonfigurasi === true)

const kirimUji = async () => {
  if (ujiSibuk.value) return
  ujiSibuk.value = true
  galatUji.value = ''
  hasilUji.value = null
  try {
    const token = await ambilToken()
    const r = await $fetch<Record<string, unknown>>('/api/console/ai/uji', {
      method: 'POST',
      headers: {
        'X-Console': '1',
        ...headerIkatan(),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: { model: ujiModel.value, effort: ujiEffort.value },
    })
    hasilUji.value = keHasilUjiAi(r)
  } catch (e) {
    if (pulihkanIkatan(e)) return
    const { kode, detail } = sebabGalatUjiAi(e)
    const kalimat = tcf(`ai.uji.galat.${kode}`) as string
    galatUji.value = detail ? `${kalimat} ${tcf('ai.ujiDetail')(detail)}` : kalimat
  } finally {
    ujiSibuk.value = false
  }
}

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.ai') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ai.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('ai.ket') }}</p>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="ai-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" />
      <span>{{ tcf('ai.belumAktif') }}</span>
    </div>
    <p v-else-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !asli" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <template v-if="asli && (!pesanGalat || belumAktif)">
      <!-- Ringkasan pemakaian -->
      <section class="space-y-3" aria-labelledby="cf-ai-ringkas">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cf-ai-ringkas" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.ringkas') }}</h2>
          <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('ai.ringkasKet') }}</p>
        </div>
        <div v-if="ringkas" class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4" data-uji="ai-ringkas">
          <CashflowStatTile
            icon="lucide:message-circle-question" warna="sky" :label="tcf('ai.ubin.pesan')"
            :nilai="angka(ringkas.pesan)" :keterangan="tcf('ai.ubin.pesanKet')(ringkas.pesan)"
          />
          <CashflowStatTile
            icon="lucide:binary" warna="amber" :label="tcf('ai.ubin.token')"
            :nilai="angka(ringkas.token)" :keterangan="tcf('ai.ubin.tokenKet')(ringkas.tokenMasuk, ringkas.tokenKeluar)"
          />
          <CashflowStatTile
            icon="lucide:receipt" warna="rose" :label="tcf('ai.ubin.biaya')"
            :nilai="rupiah(ringkas.biaya)" :keterangan="tcf('ai.ubin.biayaKet')"
          />
          <CashflowStatTile
            icon="lucide:coins" warna="emerald" :label="tcf('ai.ubin.saldo')"
            :nilai="angka(ringkas.saldoBeredar)" :keterangan="tcf('ai.ubin.saldoKet')"
          />
        </div>
        <CashflowKeadaanKosong
          v-else-if="ringkasGagal" icon="lucide:receipt"
          :pesan="tcf('ai.ringkasGagal')"
        />
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-6">
          <!-- Penyedia dan status -->
          <section class="ca-console-dialog p-5" aria-labelledby="cf-ai-penyedia">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="max-w-xl">
                <h2 id="cf-ai-penyedia" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.aktif') }}</h2>
                <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('ai.aktifKet') }}</p>
                <p class="mt-2 text-sm font-semibold" :class="isian.aktif ? 'ca-tone-emerald' : 'ca-tone-danger'" data-uji="ai-status">
                  {{ isian.aktif ? tcf('ai.hidup') : tcf('ai.mati') }}
                </p>
              </div>
              <div class="flex rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
                <button
                  type="button" class="rounded-full px-4 py-1.5 transition disabled:opacity-60" :disabled="!bisaUbah || !!sibuk"
                  :class="isian.aktif ? 'bg-[var(--ca-emerald-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
                  :aria-pressed="isian.aktif" data-uji="ai-hidup" @click="isian.aktif = true"
                >{{ tcf('ai.hidup') }}</button>
                <button
                  type="button" class="rounded-full px-4 py-1.5 transition disabled:opacity-60" :disabled="!bisaUbah || !!sibuk"
                  :class="!isian.aktif ? 'bg-[var(--ca-danger-bg)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
                  :aria-pressed="!isian.aktif" data-uji="ai-mati" @click="isian.aktif = false"
                >{{ tcf('ai.mati') }}</button>
              </div>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.penyedia') }}</span>
                <select v-model="isian.provider" class="ca-input mt-1 w-full" :disabled="!bisaUbah || !!sibuk" data-uji="ai-penyedia">
                  <option v-for="p in opsiPenyedia" :key="p.nilai" :value="p.nilai">{{ p.label }}</option>
                </select>
                <span class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('ai.penyediaKet') }}</span>
              </label>
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.baseUrl') }}</span>
                <input
                  v-model.trim="isian.baseUrl" type="url" class="ca-input mt-1 w-full" spellcheck="false"
                  :disabled="!bisaUbah || !!sibuk" :aria-invalid="!baseUrlAiSah(isian.baseUrl)" data-uji="ai-base-url"
                >
                <span class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('ai.baseUrlKet') }}</span>
                <span v-if="!baseUrlAiSah(isian.baseUrl)" class="mt-1 block text-xs ca-tone-danger" role="alert">{{ tcf('ai.baseUrlGalat') }}</span>
              </label>
            </div>
          </section>

          <!-- Model dan effort -->
          <section class="ca-console-dialog p-5" aria-labelledby="cf-ai-model">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="max-w-xl">
                <h2 id="cf-ai-model" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.model') }}</h2>
                <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('ai.modelKet') }}</p>
              </div>
              <button type="button" class="ca-btn-secondary inline-flex items-center gap-2 text-sm" :disabled="memuatKatalog" @click="muatKatalog">
                <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="memuatKatalog ? 'animate-spin' : ''" />
                {{ memuatKatalog ? tcf('ai.memuatKatalog') : tcf('ai.muatKatalog') }}
              </button>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span :class="katalog?.sumber === 'penyedia' ? 'ca-pill-emerald' : 'ca-pill-muted'" data-uji="ai-katalog-sumber">
                {{ katalog?.sumber === 'penyedia' ? tcf('ai.katalogPenyedia') : tcf('ai.katalogBawaan') }}
              </span>
              <span v-if="tanpaKunci" class="text-[var(--ca-subtle)]">{{ tcf('ai.katalogTanpaKunci') }}</span>
              <span v-else-if="katalog?.sumber === 'bawaan'" class="text-[var(--ca-subtle)]">{{ tcf('ai.katalogBawaanKet') }}</span>
            </div>
            <p v-if="katalog?.galat || katalogGagalMuat" class="mt-2 text-xs ca-tone-gold" role="status">
              {{ tcf('ai.katalogGagal')(katalog?.galat ?? tcf('ai.katalogTidakTerbaca')) }}
            </p>

            <div class="mt-5 grid gap-4 sm:grid-cols-3">
              <label
v-for="f in ([
                { bidang: 'modelChat', kunci: 'ai.modelChat' },
                { bidang: 'modelMurah', kunci: 'ai.modelMurah' },
                { bidang: 'modelEmbed', kunci: 'ai.modelEmbed' },
              ] as const)" :key="f.bidang" class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf(f.kunci) }}</span>
                <select v-model="isian[f.bidang]" class="ca-input mt-1 w-full" :disabled="!bisaUbah || !!sibuk" :data-uji="`ai-${f.bidang}`">
                  <option v-for="m in opsiModel(isian[f.bidang])" :key="m.id" :value="m.id">{{ m.id }}</option>
                </select>
                <span class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ infoModel(isian[f.bidang]) }}</span>
              </label>
            </div>

            <h3 class="mt-6 font-display text-sm font-bold text-[var(--ca-text)]">{{ tcf('ai.effort') }}</h3>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('ai.effortKet') }}</p>
            <div class="mt-3 grid gap-4 sm:grid-cols-3">
              <label
v-for="f in ([
                { bidang: 'effortChat', kunci: 'ai.effortChat' },
                { bidang: 'effortAnalisa', kunci: 'ai.effortAnalisa' },
                { bidang: 'effortLaporan', kunci: 'ai.effortLaporan' },
              ] as const)" :key="f.bidang" class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf(f.kunci) }}</span>
                <select class="ca-input mt-1 w-full" :value="isian[f.bidang]" :disabled="!bisaUbah || !!sibuk" :data-uji="`ai-${f.bidang}`" @change="pilihEffort($event, f.bidang)">
                  <option v-for="e in opsiEffort" :key="e.nilai" :value="e.nilai">{{ e.label }}</option>
                </select>
              </label>
            </div>
          </section>

          <!-- Kredit dan harga -->
          <section class="ca-console-dialog p-5" aria-labelledby="cf-ai-kredit">
            <h2 id="cf-ai-kredit" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.kredit') }}</h2>
            <div class="mt-4 grid gap-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.kreditGratis') }}</span>
                <input
                  type="number" min="0" max="1000" step="1" class="ca-input mt-1 w-full tabular-nums"
                  :value="isian.kreditGratis" :disabled="!bisaUbah || !!sibuk" data-uji="ai-kredit-gratis" @input="setKredit"
                >
                <span class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('ai.kreditGratisKet') }}</span>
              </label>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.harga') }}</span>
                <div class="mt-1 grid gap-3 sm:grid-cols-3">
                  <label v-for="p in PAKET_KREDIT" :key="p" class="block">
                    <span class="text-xs text-[var(--ca-muted)]">{{ tcf('ai.paket')(Number(p)) }}</span>
                    <input
                      type="number" min="0" max="100000000" step="1000" class="ca-input mt-1 w-full tabular-nums"
                      :value="isian.harga[p]" :disabled="!bisaUbah || !!sibuk" :data-uji="`ai-harga-${p}`" @input="setHarga($event, p)"
                    >
                    <span class="mt-1 block text-xs tabular-nums text-[var(--ca-subtle)]">{{ rupiah(isian.harga[p]) }}</span>
                  </label>
                </div>
                <span class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ tcf('ai.hargaKet') }}</span>
              </div>
            </div>
            <p class="mt-4 border-t border-[color:var(--ca-border)] pt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('ai.promptVersi')(isian.promptVersi) }}</p>
          </section>
        </div>

        <div class="space-y-6">
          <!-- Uji koneksi -->
          <section class="ca-console-dialog p-5" aria-labelledby="cf-ai-uji">
            <h2 id="cf-ai-uji" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.uji') }}</h2>
            <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('ai.ujiKet') }}</p>
            <div class="mt-4 space-y-3">
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.ujiModel') }}</span>
                <select v-model="ujiModel" class="ca-input mt-1 w-full" :disabled="ujiSibuk || tanpaKunci" data-uji="ai-uji-model">
                  <option v-for="m in opsiModel(ujiModel)" :key="m.id" :value="m.id">{{ m.id }}</option>
                </select>
              </label>
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('ai.ujiEffort') }}</span>
                <select class="ca-input mt-1 w-full" :value="ujiEffort" :disabled="ujiSibuk || tanpaKunci" data-uji="ai-uji-effort" @change="pilihEffortUji">
                  <option v-for="e in opsiEffort" :key="e.nilai" :value="e.nilai">{{ e.label }}</option>
                </select>
              </label>
            </div>
            <button type="button" class="ca-btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2" :disabled="ujiSibuk || tanpaKunci" data-uji="ai-uji-kirim" @click="kirimUji">
              <Icon v-if="ujiSibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:flask-conical" class="h-4 w-4" />
              {{ ujiSibuk ? tcf('ai.ujiMengirim') : tcf('ai.ujiKirim') }}
            </button>
            <p v-if="tanpaKunci" class="mt-3 text-xs ca-tone-gold" role="status">{{ tcf('ai.ujiTanpaKunci') }}</p>
            <p class="mt-3 text-xs text-[var(--ca-subtle)]">{{ KALIMAT_UJI }}</p>

            <div v-if="galatUji" class="mt-4 rounded-xl border border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] px-4 py-3 text-xs text-[var(--ca-text)]" role="alert" data-uji="ai-uji-galat">
              {{ galatUji }}
            </div>
            <div v-else-if="hasilUji" class="mt-4 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-3" data-uji="ai-uji-hasil">
              <p class="text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('ai.ujiHasil')(hasilUji.waktuMs) }}</p>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--ca-text)]" data-uji="ai-jawaban">{{ hasilUji.jawaban }}</p>
              <p v-if="hasilUji.dipotong" class="mt-2 text-xs ca-tone-gold">{{ tcf('ai.ujiDipotong') }}</p>
            </div>
            <p v-else class="mt-4 text-xs text-[var(--ca-subtle)]">{{ tcf('ai.ujiKosong') }}</p>
          </section>

          <!-- Simpan -->
          <section class="ca-console-dialog p-5" aria-labelledby="cf-ai-simpan">
            <h2 id="cf-ai-simpan" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ai.simpan') }}</h2>
            <p class="mt-1 text-xs leading-relaxed text-[var(--ca-subtle)]">{{ tcf('ai.kunciServer') }}</p>
            <p v-if="galatIsian && berubah" class="mt-3 text-xs ca-tone-danger" role="alert">{{ galatIsian }}</p>
            <p v-if="galatSimpan" class="mt-3 text-xs ca-tone-danger" role="alert" data-uji="ai-simpan-galat">{{ galatSimpan }}</p>
            <div class="mt-4 flex justify-end">
              <button type="button" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bolehSimpan" data-uji="ai-simpan" @click="simpan">
                <Icon v-if="sibuk === 'simpan'" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
                <Icon v-else name="lucide:save" class="h-4 w-4" />
                {{ sibuk === 'simpan' ? tcf('ai.menyimpan') : tcf('ai.simpan') }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
