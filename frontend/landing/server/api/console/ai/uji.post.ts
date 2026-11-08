/**
 * POST /api/console/ai/uji — uji satu kalimat ke Responses API.
 *
 * Hanya admin console: penjaga wajibAdminAi (asal, ikatan, cookie sesi ke
 * gateway, peran ber-cashflow:view). Tanpa penjaga ini siapa pun yang tahu
 * alamat route bisa memakai kunci penyedia di server untuk membakar kuota.
 *
 * Badan: {model, effort}. Kalimatnya TETAP di server (KALIMAT_UJI), supaya
 * tombol uji tidak bisa dipakai mengirim prompt bebas. Base URL dibaca dari
 * admin_ai_setelan memakai access token Supabase halaman; kunci dari env
 * server. Jawaban dipotong maksimal 200 aksara dan tidak pernah disimpan.
 *
 * Kode galat yang dibaca halaman: masukan, tanpa-izin, ikatan, cookie-ditolak,
 * belum-terkonfigurasi, kunci-ditolak, batas-penyedia, model-ditolak,
 * jawaban-kosong, waktu-habis, penyedia-tidak-terjangkau, dibatasi.
 */
import {
  BATAS_JAWABAN_UJI, EFFORT_AI, KALIMAT_UJI, baseUrlAiBersih, modelAiSah, potongJawabanAi,
  punyaEffortAi, teksDariRespons, type EffortAi,
} from '~/adapters/cashflowAi'
import {
  bacaSetelanAi, kunciPenyediaAi, lemparGalatPenyedia, tokenSupabaseAi, wajibAdminAi,
} from '../../../lib/konsol/ai'
import { ipKlien, tanpaCache } from '../../../lib/konsol/h3'

interface BadanUji { model?: unknown; effort?: unknown }
interface HasilUji {
  waktu_ms: number
  jawaban: string
  dipotong: boolean
  model: string
  effort: EffortAi
}

/* Pembatas sederhana per proses: 10 uji per menit per IP. Route ini memanggil
   API berbayar, dan satu admin yang menekan tombol berulang kali tidak perlu
   dihukum, tetapi banjir panggilan harus berhenti di sini. */
const BATAS_UJI_PER_MENIT = 10
const JENDELA_UJI_MS = 60_000
const riwayatUji = new Map<string, number[]>()
const batasiUji = (kunci: string, sekarang: number): number | null => {
  const lama = (riwayatUji.get(kunci) ?? []).filter(t => sekarang - t < JENDELA_UJI_MS)
  if (lama.length >= BATAS_UJI_PER_MENIT) {
    riwayatUji.set(kunci, lama)
    return Math.ceil((JENDELA_UJI_MS - (sekarang - lama[0]!)) / 1000)
  }
  lama.push(sekarang)
  riwayatUji.set(kunci, lama)
  // Rumah tangga: jangan biarkan kunci IP tumbuh tanpa batas.
  if (riwayatUji.size > 2_000) {
    for (const [k, v] of riwayatUji) if (!v.some(t => sekarang - t < JENDELA_UJI_MS)) riwayatUji.delete(k)
  }
  return null
}

export default defineEventHandler(async (event): Promise<HasilUji> => {
  tanpaCache(event)
  await wajibAdminAi(event)

  const sekarang = Date.now()
  const tunggu = batasiUji(ipKlien(event) ?? 'tanpa-ip', sekarang)
  if (tunggu !== null) {
    setResponseHeader(event, 'retry-after', String(tunggu))
    throw createError({ statusCode: 429, statusMessage: 'dibatasi', data: { pesan: `Terlalu banyak uji. Coba lagi dalam ${tunggu} detik.` } })
  }

  const badan = await readBody(event).catch(() => null) as BadanUji | null
  const model = typeof badan?.model === 'string' ? badan.model.trim() : ''
  const effort = typeof badan?.effort === 'string' && (EFFORT_AI as readonly string[]).includes(badan.effort)
    ? badan.effort as EffortAi : null
  if (!modelAiSah(model) || !effort) {
    throw createError({ statusCode: 400, statusMessage: 'masukan', data: { pesan: 'Model dan effort yang dipilih tidak sah.' } })
  }

  const kunci = kunciPenyediaAi()
  if (!kunci) {
    throw createError({ statusCode: 503, statusMessage: 'belum-terkonfigurasi', data: { pesan: 'Kunci penyedia belum dipasang di server.' } })
  }

  const { setelan } = await bacaSetelanAi(event, tokenSupabaseAi(event))
  const base = baseUrlAiBersih(setelan.baseUrl)
  const mulai = Date.now()
  let r: Response
  try {
    r = await fetch(`${base}/responses`, {
      method: 'POST',
      headers: { authorization: `Bearer ${kunci}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        model,
        input: KALIMAT_UJI,
        max_output_tokens: 256,
        store: false,
        ...(punyaEffortAi(model) ? { reasoning: { effort } } : {}),
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (e) {
    const habisWaktu = (e as { name?: string })?.name === 'TimeoutError'
    throw createError({
      statusCode: habisWaktu ? 504 : 502,
      statusMessage: habisWaktu ? 'waktu-habis' : 'penyedia-tidak-terjangkau',
      data: { pesan: habisWaktu ? 'Penyedia tidak menjawab dalam 20 detik.' : 'Penyedia tidak terjangkau dari server.' },
    })
  }

  if (!r.ok) {
    const galat = await r.json().catch(() => null)
    lemparGalatPenyedia(r.status, galat)
  }
  const jawaban = await r.json().catch(() => null)
  const mentah = teksDariRespons(jawaban)
  if (!mentah) {
    throw createError({ statusCode: 502, statusMessage: 'jawaban-kosong', data: { pesan: 'Penyedia menjawab tanpa teks.' } })
  }
  const { teks, dipotong } = potongJawabanAi(mentah, BATAS_JAWABAN_UJI)
  return {
    waktu_ms: Date.now() - mulai,
    jawaban: teks,
    dipotong,
    model,
    effort,
  }
})
