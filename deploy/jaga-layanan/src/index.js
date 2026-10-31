// Jaga Layanan: pemantau uptime CoreAsia yang berjalan di Cloudflare, di luar
// semua VPS kita. Tiap 5 menit memeriksa TARGET; tiap jam (putaran menit 0)
// juga memeriksa umur cadangan DB di R2. Email dikirim lewat Resend saat status
// berubah (mati / pulih), sebagai pengingat tiap 6 jam selama masih mati, dan
// sebagai laporan harian tiap pagi yang sekaligus menjadi tanda Jaga masih hidup.
//
// Keadaan disimpan di satu kunci KV dan hanya ditulis bila berubah, supaya
// tetap di bawah batas tulis KV paket gratis (1.000/hari).
import { CADANGAN, TARGET } from './target.js'
import {
  belumMulai,
  catatLaporan,
  cocok,
  galatCadangan,
  jenisLaporan,
  nilai,
  nilaiCadangan,
  pangkas,
  susunEmail,
  susunEmailDarurat,
  susunLaporan,
} from './logika.js'

// Modul ini titik masuk Worker: workerd menolak ekspor bernama yang bukan fungsi,
// jadi konstanta di sini sengaja tidak diekspor.
const KUNCI = 'keadaan'
const BATAS_WAKTU_MS = 8000
const JEDA_ULANG_MS = 2000
// Workers hanya mengizinkan 6 koneksi menunggu header sekaligus. Koneksi ke-7
// diantre, padahal jam batas waktunya sudah berjalan, sehingga situs sehat di
// ujung daftar ikut habis waktu saat VPS IDCloudHost menggantung. Kita batasi
// sendiri 5 dan memulai jam batas waktu setelah slot didapat.
const MAKS_SERENTAK = 5
const BATAS_RESEND_MS = 15000

function semafor(maks) {
  let aktif = 0
  const antre = []
  return {
    async dapat() {
      if (aktif < maks) {
        aktif++
        return
      }
      // Slot diserahkan langsung oleh lepas(), jadi `aktif` tidak berubah.
      await new Promise((r) => antre.push(r))
    },
    lepas() {
      const lanjut = antre.shift()
      if (lanjut) lanjut()
      else aktif--
    },
  }
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms))

// Badan respons hanya dibaca bila target memeriksa isinya. Cron berjalan dari
// colo Cloudflare yang jauh (EWR); mengunduh halaman 121 KB LeadKu lintas Pasifik
// sesekali melewati batas waktu dan memicu MATI palsu (4 Okt 18.55 WIB).
async function ambil(url, slot, batasWaktuMs, bacaBadan, kepala = {}) {
  await slot.dapat()
  try {
    const pisah = url.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${pisah}_jaga=${Date.now()}`, {
      headers: { 'user-agent': 'coreasia-jaga-layanan/1', ...kepala },
      redirect: 'manual',
      signal: AbortSignal.timeout(batasWaktuMs),
    })
    if (!bacaBadan) {
      await res.body?.cancel()
      return { status: res.status, badan: '' }
    }
    const badan = await res.text()
    return { status: res.status, badan }
  } finally {
    slot.lepas()
  }
}

// Target dengan `rahasia` membawa header Authorization dari secret Worker bernama itu.
// Secret yang belum dipasang tetap dikirim kosong supaya target berbunyi (HTTP 401),
// bukan diam-diam dilewati.
export function kepalaUntuk(t, env) {
  return t.rahasia ? { authorization: `Bearer ${env?.[t.rahasia] || ''}` } : {}
}

async function periksa(t, slot, batasWaktuMs, jedaMs, kepala = {}) {
  let alasan = ''
  for (let coba = 0; coba < 2; coba++) {
    // Slot tidak dipegang selama jeda, supaya target lain tetap jalan.
    if (coba) await tidur(jedaMs)
    try {
      const { status, badan } = await ambil(t.url, slot, batasWaktuMs, Boolean(t.isi || t.jsonStatus), kepala)
      if (cocok(t, status, badan)) return { id: t.id, nama: t.nama, penyedia: t.penyedia, ok: true, alasan: '' }
      alasan = t.jsonStatus && status === t.harap ? `HTTP ${status}, status layanan belum sehat` : t.isi && status === t.harap ? `HTTP ${status} tapi isi tidak memuat "${t.isi}"` : `HTTP ${status}`
    } catch (e) {
      alasan = e?.name === 'TimeoutError' ? `tidak menjawab dalam ${batasWaktuMs / 1000} detik` : `galat jaringan: ${e?.message || e}`
    }
  }
  return { id: t.id, nama: t.nama, penyedia: t.penyedia, ok: false, alasan }
}

async function terbaru(bucket, prefix) {
  let akhir = null
  let cursor
  do {
    const daftar = await bucket.list({ prefix, cursor })
    for (const o of daftar.objects) if (!akhir || o.uploaded > akhir) akhir = o.uploaded
    cursor = daftar.truncated ? daftar.cursor : undefined
  } while (cursor)
  return akhir
}

// Seri yang belum mulai dilewati lebih dulu, supaya galat R2 tidak membuatnya ikut berbunyi.
async function periksaCadangan(bucket, cadangan, sekarangMs, catat) {
  const info = []
  for (const seri of cadangan) {
    if (belumMulai(seri, sekarangMs)) {
      info.push({ seri, belumMulai: true })
      continue
    }
    try {
      info.push({ seri, terbaru: await terbaru(bucket, seri.prefix) })
    } catch (e) {
      catat(`R2 ${seri.id} tidak terbaca`, e)
      info.push({ seri, galat: e?.message || String(e) })
    }
  }
  return info
}

async function kirimEmail(env, email) {
  if (env.TANPA_EMAIL === '1') {
    console.log(`[jaga] (tanpa email) ${email.subjek}\n${email.teks}`)
    return
  }
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY belum dipasang')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_DARI,
      to: env.EMAIL_KE.split(',').map((s) => s.trim()),
      subject: email.subjek,
      text: email.teks,
    }),
    signal: AbortSignal.timeout(BATAS_RESEND_MS),
  })
  if (!res.ok) throw new Error(`Resend menolak: HTTP ${res.status} ${await res.text()}`)
}

// Heartbeat opsional ke layanan luar (mis. healthchecks.io), yang mengirim kabar
// sendiri bila ping berhenti datang. Galat ping sengaja diabaikan.
async function ping(env, galat) {
  const url = (env.HC_PING_URL || '').trim()
  if (!url) return
  try {
    const tujuan = new URL(url)
    // /fail disisipkan ke path, bukan ditempel di belakang query string.
    if (galat.length) tujuan.pathname = `${tujuan.pathname.replace(/\/+$/, '')}/fail`
    const res = await fetch(tujuan, {
      method: 'POST',
      body: galat.length ? galat.join('\n').slice(0, 10_000) : 'ok',
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    })
    await res.body?.cancel()
  } catch (e) {
    console.error(`[jaga] ping heartbeat gagal (diabaikan): ${e?.message || e}`)
  }
}

// opsi hanya untuk uji: daftar target/seri dan angka waktu yang lebih kecil.
export async function putaran(env, sekarangMs, denganCadangan, opsi = {}) {
  const {
    target = TARGET,
    cadangan = CADANGAN,
    batasWaktuMs = BATAS_WAKTU_MS,
    jedaMs = JEDA_ULANG_MS,
    serentak = MAKS_SERENTAK,
  } = opsi
  // Galat internal (Resend, KV, R2) dikumpulkan per putaran untuk heartbeat dan log.
  const galat = []
  const catat = (apa, e) => {
    const pesan = `${apa}: ${e?.message || e}`
    galat.push(pesan)
    console.error(`[jaga] ${pesan}`)
  }

  // Keadaan dibaca lebih dulu karena laporan harian menentukan perlu tidaknya cek cadangan.
  let lama = null
  let galatKv = ''
  try {
    lama = (await env.JAGA_KV.get(KUNCI, 'json')) || {}
  } catch (e) {
    galatKv = e?.message || String(e)
    catat('KV tidak terbaca', e)
  }
  const laporan = lama ? jenisLaporan(lama._meta, sekarangMs) : null

  const slot = semafor(serentak)
  const hasil = await Promise.all(target.map((t) => periksa(t, slot, batasWaktuMs, jedaMs, kepalaUntuk(t, env))))
  let infoCadangan = null
  if (denganCadangan || laporan) {
    infoCadangan = await periksaCadangan(env.CADANGAN, cadangan, sekarangMs, catat)
    // Hanya putaran jam-an yang mengubah status cadangan. Cek yang dipaksa laporan
    // (bisa diulang tiap 5 menit bila Resend gagal) cukup untuk isi laporan, supaya
    // ambang 2 untuk galat baca R2 tidak terlampaui dalam 5 menit.
    if (denganCadangan) {
      for (const i of infoCadangan) {
        if (i.belumMulai) continue
        hasil.push(i.galat ? galatCadangan(i.seri, i.galat) : nilaiCadangan(i.seri, i.terbaru, sekarangMs))
      }
    }
  }

  let email = null
  let emailLaporan = null
  if (!lama) {
    // Tanpa keadaan lama, apa pun yang ditulis akan menimpa riwayat. KV tidak
    // disentuh sama sekali, dan yang gagal dikabarkan langsung.
    // Galat baca R2 tidak disebut sebagai layanan mati; ia sudah tercatat di galat.
    const gagal = hasil.filter((h) => !h.ok && !h.galatBaca)
    if (gagal.length) {
      email = susunEmailDarurat(gagal, galatKv, sekarangMs)
      try {
        await kirimEmail(env, email)
      } catch (e) {
        catat('Resend gagal', e)
      }
    }
  } else {
    const idSah = new Set([...target, ...cadangan].map((x) => x.id))
    const { keadaan, ...kabar } = nilai(pangkas(lama, idSah), hasil, sekarangMs)
    email = susunEmail(kabar, sekarangMs, keadaan)
    let terkirim = true
    if (email) {
      try {
        await kirimEmail(env, email)
      } catch (e) {
        terkirim = false
        catat('Resend gagal', e)
      }
    }
    // Laporan menunggu kabar perubahan terkirim. Bila laporannya sendiri gagal,
    // _meta tidak diperbarui sehingga putaran berikutnya mencoba lagi.
    if (terkirim && laporan) {
      const kini = { gagal: hasil.filter((h) => !h.ok), galat: [...galat] }
      emailLaporan = susunLaporan(laporan, keadaan, target, infoCadangan, sekarangMs, kini)
      try {
        await kirimEmail(env, emailLaporan)
        keadaan._meta = catatLaporan(keadaan._meta, laporan, sekarangMs)
      } catch (e) {
        catat('Resend gagal (laporan)', e)
      }
    }
    // Simpan setelah email terkirim: bila pengiriman gagal, putaran berikutnya mencoba lagi.
    if (terkirim && JSON.stringify(keadaan) !== JSON.stringify(lama)) {
      try {
        await env.JAGA_KV.put(KUNCI, JSON.stringify(keadaan))
      } catch (e) {
        catat('KV tidak tersimpan', e)
      }
    }
  }

  await ping(env, galat)

  const mati = hasil.filter((h) => !h.ok)
  const subjek = [email, emailLaporan].filter(Boolean).map((e) => e.subjek)
  console.log(
    `[jaga] ${hasil.length} diperiksa, ${mati.length} gagal${mati.length ? ': ' + mati.map((m) => `${m.id} (${m.alasan})`).join('; ') : ''}` +
      `${subjek.length ? `, email: ${subjek.join(' + ')}` : ''}${galat.length ? `, galat internal: ${galat.length}` : ''}`,
  )
  return { hasil, email, laporan: emailLaporan, galat }
}

// Dipakai sekali setelah pemasangan (var UJI_EMAIL=1) untuk membuktikan jalur email.
async function kirimUji(env, sekarangMs) {
  await kirimEmail(env, {
    subjek: '[Jaga] UJI: jalur email alarm tersambung',
    teks: `Ini email uji dari Jaga Layanan, pemantau uptime CoreAsia di Cloudflare.\n\nKalau email ini sampai, alarm sudah bisa mengirim kabar. Tidak ada yang perlu dilakukan.\n\nDikirim ${new Date(sekarangMs).toISOString()}.`,
  })
  console.log('[jaga] email uji terkirim')
}

export default {
  // Promise dikembalikan, bukan diserahkan ke ctx.waitUntil: runtime menunggu
  // promise handler sampai batas cron (15 menit), sedangkan waitUntil hanya
  // menambah sekitar 30 detik. Putaran saat banyak target menggantung bisa lebih lama.
  scheduled(event, env, ctx) {
    if (env.UJI_EMAIL === '1') return kirimUji(env, event.scheduledTime)
    const menit = new Date(event.scheduledTime).getUTCMinutes()
    return putaran(env, event.scheduledTime, menit < 5 || env.SELALU_CEK_CADANGAN === '1').then((r) => {
      // Dilempar supaya Cron Events di dashboard menandai putaran ini bermasalah.
      if (r.galat.length) throw new Error(`[jaga] galat internal: ${r.galat.join('; ')}`)
      return r
    })
  },
}
