/**
 * GET /api/console/ai/models — katalog model penyedia untuk halaman Asisten AI.
 *
 * ALASAN ROUTE INI ADA. Kunci penyedia (OPENAI_API_KEY) hanya boleh hidup di
 * server. Peramban tidak boleh memanggil {base}/models sendiri karena harus
 * membawa kunci; route ini yang memanggil, lalu memulangkan daftar
 * ternormalisasi {id, alasan, effort} tanpa satu pun potongan kunci.
 *
 * ALUR.
 *   1. Penjaga admin console (wajibAdminAi): asal, ikatan, cookie sesi ke
 *      gateway, peran ber-cashflow:view.
 *   2. Base URL dari admin_ai_setelan memakai access token Supabase sesi
 *      CashFlow yang dikirim halaman. Gagal = base URL bawaan, route tetap
 *      menjawab dan menyebut sumbernya di `galat`.
 *   3. Kunci kosong = daftar bawaan dan `belum_terkonfigurasi: true`
 *      (spek November 2026). Kunci ada = GET {base}/models.
 *   4. Penyedia menolak = daftar bawaan + `galat` yang aman. Route tidak
 *      melempar galat di sini supaya halaman tetap bisa menyimpan model yang
 *      sudah tersimpan walau katalog sedang tidak terbaca.
 *
 * Normalkan: id berawalan gpt-5, gpt-6, o1, o3, o4 punya effort minimal,
 * low, medium, high; model lain `alasan: false` dan `effort: []`.
 */
import {
  MODEL_AI_BAWAAN, baseUrlAiBersih, normalkanDaftarModel,
  type KatalogAiDTO, type ModelAi,
} from '~/adapters/cashflowAi'
import {
  bacaSetelanAi, galatPenyediaAi, kunciPenyediaAi, tokenSupabaseAi, wajibAdminAi,
} from '../../../lib/konsol/ai'
import { tanpaCache } from '../../../lib/konsol/h3'

interface JawabanModelAi {
  daftar: ModelAi[]
  sumber: 'penyedia' | 'bawaan'
  belum_terkonfigurasi: boolean
  galat: string | null
}

const daftarBawaan = (): ModelAi[] => MODEL_AI_BAWAAN.map(m => ({ ...m, effort: [...m.effort] }))

const jawabanBawaan = (belumTerkonfigurasi: boolean, galat: string | null): JawabanModelAi & KatalogAiDTO => ({
  daftar: daftarBawaan(), sumber: 'bawaan', belum_terkonfigurasi: belumTerkonfigurasi, galat,
})

export default defineEventHandler(async (event): Promise<JawabanModelAi> => {
  tanpaCache(event)
  await wajibAdminAi(event)

  const { setelan, galat: galatSetelan } = await bacaSetelanAi(event, tokenSupabaseAi(event))
  const kunci = kunciPenyediaAi()
  if (!kunci) return jawabanBawaan(true, galatSetelan)

  const base = baseUrlAiBersih(setelan.baseUrl)
  try {
    const r = await fetch(`${base}/models`, {
      headers: { authorization: `Bearer ${kunci}`, accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) {
      const badan = await r.json().catch(() => null)
      return jawabanBawaan(false, galatPenyediaAi(r.status, badan))
    }
    const badan = await r.json().catch(() => null)
    const daftar = normalkanDaftarModel(badan)
    if (!daftar.length) {
      return jawabanBawaan(false, 'Penyedia tidak memulangkan model yang bisa dibaca. Daftar bawaan dipakai.')
    }
    return { daftar, sumber: 'penyedia', belum_terkonfigurasi: false, galat: galatSetelan }
  } catch (e) {
    const habisWaktu = (e as { name?: string })?.name === 'TimeoutError'
    return jawabanBawaan(false, habisWaktu
      ? 'Katalog penyedia tidak menjawab dalam 8 detik. Daftar bawaan dipakai.'
      : 'Katalog penyedia tidak terjangkau. Daftar bawaan dipakai.')
  }
})
