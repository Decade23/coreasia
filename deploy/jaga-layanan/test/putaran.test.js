// Uji putaran() utuh dengan fetch, KV, R2, dan Resend tiruan. Skenario A sampai G
// berasal dari harness tinjauan 4 Okt 2026.
import assert from 'node:assert/strict'
import { afterEach, beforeEach, mock, test } from 'node:test'
import * as modul from '../src/index.js'
import { CADANGAN, TARGET } from '../src/target.js'

const MENIT = 60_000
const JAM = 60 * MENIT
// Putaran jam-an, dua hari sebelum seri cadangan LeadKu mulai diperiksa (6 Okt).
const T0 = Date.parse('2026-10-04T01:00:00Z')
const RESEND = 'https://api.resend.com/emails'
const HC = 'https://hc-ping.com/uji-123'
const IDCH = TARGET.filter((t) => t.penyedia === 'idcloudhost').map((t) => t.id)
// Laporan harian terakhir 00:00 UTC hari ini, supaya tidak ikut campur kecuali diuji.
// Angka harapan dihitung dari daftar asli supaya menambah target atau seri tidak memerahkan uji.
const N = TARGET.length
const dimulaiPada = (t) => CADANGAN.filter((s) => !s.mulai || t >= Date.parse(s.mulai)).length
const SUDAH_LAPOR = { _meta: { laporan: '2026-10-04T00:00:00.000Z', harian: '2026-10-04T00:00:00.000Z' } }

const { default: jaga, putaran } = modul

const fetchAsli = globalThis.fetch
beforeEach(() => {
  mock.method(console, 'log', () => {})
  mock.method(console, 'error', () => {})
})
afterEach(() => {
  mock.restoreAll()
  globalThis.fetch = fetchAsli
})

function kvTiruan({ awal, getGagal = false, putGagal = false } = {}) {
  const m = new Map()
  if (awal) m.set('keadaan', JSON.stringify(awal))
  const kv = {
    getGagal,
    putGagal,
    putDicoba: 0,
    tulis: 0,
    async get(k, jenis) {
      if (kv.getGagal) throw new Error('KV get 500')
      const v = m.get(k)
      return v == null ? null : jenis === 'json' ? JSON.parse(v) : v
    },
    async put(k, v) {
      kv.putDicoba++
      if (kv.putGagal) throw new Error('KV put 429: kuota tulis harian habis')
      kv.tulis++
      m.set(k, v)
    },
    get keadaan() {
      const v = m.get('keadaan')
      return v == null ? null : JSON.parse(v)
    },
  }
  return kv
}

// Dunia tiruan: target yang tidak ada di `mati` menjawab sesuai harapan.
function pasangDunia() {
  const d = { sekarang: T0, mati: new Set(), resendGagal: false, terkirim: [], resendDicoba: 0, ping: [], pingGagal: false, r2Gagal: false, r2Dipanggil: 0 }
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    if (u === RESEND) {
      d.resendDicoba++
      if (d.resendGagal) return new Response('{"message":"daily_quota_exceeded"}', { status: 429 })
      const b = JSON.parse(init.body)
      d.terkirim.push({ subjek: b.subject, teks: b.text, saat: d.sekarang })
      return new Response('{"id":"x"}')
    }
    if (u.startsWith('https://hc-ping.com/')) {
      d.ping.push(u)
      if (d.pingGagal) throw new TypeError('fetch failed')
      return new Response('OK')
    }
    const t = TARGET.filter((x) => u.startsWith(x.url)).sort((a, b) => b.url.length - a.url.length)[0]
    if (d.mati.has(t.id)) return new Response('', { status: 522 })
    return new Response(t.jsonStatus ? JSON.stringify({status:t.jsonStatus}) : t.isi ? `{"x":1} ${t.isi}` : 'ok', { status: t.harap === 'bukan5xx' ? 404 : t.harap })
  }
  d.r2 = {
    async list({ prefix }) {
      d.r2Dipanggil++
      if (d.r2Gagal) throw new Error('R2 list 503')
      return { objects: [{ key: `${prefix}x.gpg`, uploaded: new Date(d.sekarang - 2 * JAM) }], truncated: false }
    },
  }
  return d
}

const envDari = (d, kv, tambahan = {}) => ({ JAGA_KV: kv, CADANGAN: d.r2, RESEND_API_KEY: 're_uji', EMAIL_DARI: 'Jaga <a@b.c>', EMAIL_KE: 'x@y.z', ...tambahan })

function jalan(d, env, ms, denganCadangan = false, opsi = {}) {
  d.sekarang = ms
  return putaran(env, ms, denganCadangan, { jedaMs: 0, ...opsi })
}

// Tiruan antrean koneksi Workers: paling banyak 6 menunggu header, sisanya antre,
// dan sinyal batas waktunya tetap berjalan selama antre (perilaku menurut dokumentasi limits).
function pasangAntreanWorkers(macet) {
  const s = { aktif: 0, puncak: 0, antre: [], urutan: [] }
  const lepas = () => {
    const berikut = s.antre.shift()
    if (berikut) berikut()
    else s.aktif--
  }
  globalThis.fetch = async (url, init = {}) => {
    const id = new URL(String(url)).hostname.split('.')[0]
    s.urutan.push(id)
    const sinyal = init.signal
    if (s.aktif >= 6) {
      // Slot diserahkan langsung oleh lepas(), jadi `aktif` tidak bertambah.
      await new Promise((res, rej) => {
        const masuk = () => {
          sinyal.removeEventListener('abort', batal)
          res()
        }
        const batal = () => {
          s.antre.splice(s.antre.indexOf(masuk), 1)
          rej(sinyal.reason)
        }
        s.antre.push(masuk)
        sinyal.addEventListener('abort', batal, { once: true })
      })
    } else {
      s.aktif++
    }
    s.puncak = Math.max(s.puncak, s.aktif)
    try {
      // Target macet tidak pernah menjawab, yang sehat menjawab setelah 5 ms. Keduanya
      // tunduk pada sinyal batas waktu, seperti fetch sungguhan.
      await new Promise((res, rej) => {
        if (sinyal.aborted) return rej(sinyal.reason)
        const jam = macet.has(id) ? null : setTimeout(res, 5)
        sinyal.addEventListener('abort', () => (clearTimeout(jam), rej(sinyal.reason)), { once: true })
      })
      return new Response('ok')
    } finally {
      lepas()
    }
  }
  return s
}

const targetUji = (awalan, n, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({ id: `${awalan}${i}`, nama: `${awalan}${i}`, url: `https://${awalan}${i}.test/`, harap: 200, ...extra }))

test('batas 5 koneksi bersamaan: situs sehat di ujung daftar tidak ikut habis waktu', async () => {
  const daftar = [...targetUji('m', 10, { penyedia: 'idcloudhost' }), ...targetUji('s', 4)]
  const macet = new Set(daftar.filter((t) => t.id.startsWith('m')).map((t) => t.id))
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = { JAGA_KV: kv, CADANGAN: null, RESEND_API_KEY: 'x', EMAIL_DARI: 'a', EMAIL_KE: 'b' }

  let s = pasangAntreanWorkers(macet)
  let r = await putaran(env, T0, false, { target: daftar, cadangan: [], batasWaktuMs: 40, jedaMs: 0 })
  assert.ok(s.puncak <= 5, `puncak koneksi ${s.puncak}`)
  assert.equal(s.urutan.length, 10 * 2 + 4, 'yang macet dicoba dua kali, yang sehat sekali')
  assert.deepEqual(r.hasil.filter((h) => h.ok).map((h) => h.id), ['s0', 's1', 's2', 's3'])
  for (const h of r.hasil.filter((x) => !x.ok)) assert.equal(h.alasan, 'tidak menjawab dalam 0.04 detik')

  // Kontrol: tanpa pembatas sendiri, antrean platform membuat situs sehat ikut gagal.
  s = pasangAntreanWorkers(macet)
  r = await putaran(env, T0 + 5 * MENIT, false, { target: daftar, cadangan: [], batasWaktuMs: 40, jedaMs: 0, serentak: Infinity })
  assert.equal(s.puncak, 6)
  assert.deepEqual(r.hasil.filter((h) => h.ok).map((h) => h.id), [], 'tanpa pembatas, keempat situs sehat ikut dinyatakan gagal')
})

test('jeda coba ulang melepas slot: target lain jalan selama jeda', async () => {
  const urutan = []
  globalThis.fetch = async (url) => {
    const id = new URL(String(url)).hostname.split('.')[0]
    urutan.push(id)
    return new Response('', { status: id === 'a' ? 500 : 200 })
  }
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = { JAGA_KV: kv, CADANGAN: null }
  const daftar = ['a', 'b'].map((id) => ({ id, nama: id, url: `https://${id}.test/`, harap: 200 }))
  await putaran(env, T0, false, { target: daftar, cadangan: [], serentak: 1, jedaMs: 20 })
  assert.deepEqual(urutan, ['a', 'b', 'a'], 'b mendapat slot saat a menunggu jeda 2 detiknya')
})

test('A. Resend 429 saat MATI: keadaan tidak disimpan, kabar dikirim ulang setelah Resend pulih', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  d.mati = new Set(['grafana'])
  await jalan(d, env, T0 + 5 * MENIT)
  assert.equal(kv.keadaan.grafana.gagal, 1)
  const tulisSebelum = kv.tulis

  d.resendGagal = true
  let r = await jalan(d, env, T0 + 10 * MENIT)
  assert.equal(d.resendDicoba, 1)
  assert.equal(kv.putDicoba, tulisSebelum, 'KV put tidak dicoba sama sekali')
  assert.equal(kv.keadaan.grafana.naik, true, 'grafana belum tercatat mati karena email gagal')
  assert.match(r.galat.join(), /Resend gagal: Resend menolak: HTTP 429/)

  d.resendGagal = false
  r = await jalan(d, env, T0 + 15 * MENIT)
  assert.deepEqual(d.terkirim.map((e) => e.subjek), ['[Jaga] MATI: Grafana'])
  assert.equal(kv.keadaan.grafana.naik, false)
  assert.equal(kv.keadaan.grafana.sejak, new Date(T0 + 5 * MENIT).toISOString(), 'lama mati tetap dari kegagalan pertama')
  assert.deepEqual(r.galat, [])
})

test('B. Resend gagal terus: tiap putaran ping heartbeat ke /fail', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv, { HC_PING_URL: HC })
  await jalan(d, env, T0)
  d.resendGagal = true
  d.mati = new Set(['pantau'])
  for (let i = 1; i <= 3; i++) await jalan(d, env, T0 + i * 5 * MENIT)
  d.mati = new Set()
  d.resendGagal = false
  await jalan(d, env, T0 + 20 * MENIT)
  // Pantau mati 15 menit tanpa email karena Resend menolak. Penandanya ada di heartbeat:
  // dua putaran yang mencoba mengirim MATI melapor /fail, sehingga healthchecks.io berbunyi.
  assert.deepEqual(d.terkirim, [])
  assert.deepEqual(d.ping, [HC, HC, `${HC}/fail`, `${HC}/fail`, HC])
})

test('C. KV get gagal: KV tidak ditulis, yang gagal dikabarkan langsung', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR, getGagal: true })
  const env = envDari(d, kv, { HC_PING_URL: HC })
  d.mati = new Set(IDCH)
  const r = await jalan(d, env, T0 + 5 * MENIT)
  assert.equal(d.terkirim.length, 1)
  const e = d.terkirim[0]
  assert.match(e.subjek, /^\[Jaga\] GAGAL, keadaan KV tidak terbaca: LeadKu \(halaman\), /)
  for (const id of IDCH) assert.ok(e.teks.includes(TARGET.find((t) => t.id === id).nama), id)
  assert.match(e.teks, /Galat KV: KV get 500\./)
  assert.match(e.teks, /deposit habis/)
  assert.equal(kv.putDicoba, 0)
  assert.match(r.galat.join(), /KV tidak terbaca/)
  assert.deepEqual(d.ping, [`${HC}/fail`])

  // Semua sehat: tidak ada email, tapi galat tetap ditandai.
  d.mati = new Set()
  const r2 = await jalan(d, env, T0 + 10 * MENIT)
  assert.equal(d.terkirim.length, 1)
  assert.equal(kv.putDicoba, 0)
  assert.equal(r2.galat.length, 1)
})

test('D. KV put gagal: email terkirim lebih dulu, galat ditandai, putaran tidak melempar', async () => {
  const d = pasangDunia()
  // Keadaan awal dari skenario D2 tinjauan: otlp sudah gagal sekali.
  const awal = { ...SUDAH_LAPOR, otlp: { naik: true, gagal: 1, sejak: '2026-10-03T00:00:00.000Z', sejakGagal: new Date(T0).toISOString() } }
  const kv = kvTiruan({ awal, putGagal: true })
  const env = envDari(d, kv, { HC_PING_URL: HC })
  d.mati = new Set(['otlp'])
  const r = await jalan(d, env, T0 + 5 * MENIT)
  assert.deepEqual(d.terkirim.map((e) => e.subjek), ['[Jaga] MATI: Penerima telemetri (otlp.coreasia.id)'])
  assert.equal(kv.putDicoba, 1)
  assert.match(r.galat.join(), /KV tidak tersimpan: KV put 429/)
  assert.deepEqual(d.ping, [`${HC}/fail`])
  // Selama KV tidak bisa ditulis, Jaga tidak ingat sudah mengabarkan, jadi MATI bisa terulang.
  // Penandanya ping /fail tiap putaran.
  await jalan(d, env, T0 + 10 * MENIT)
  assert.equal(d.terkirim.length, 2)
  assert.deepEqual(d.ping, [`${HC}/fail`, `${HC}/fail`])
})

test('E. R2 galat sesaat: butuh 2 putaran jam-an, seri yang belum mulai dilewati', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  const dimulai = CADANGAN.filter((s) => !s.mulai || T0 >= Date.parse(s.mulai))
  assert.ok(dimulai.length > 0, 'ada seri yang sudah dimulai')

  await jalan(d, env, T0, true)
  assert.equal(d.r2Dipanggil, dimulai.length, 'seri yang belum mulai tidak dibaca')
  d.r2Gagal = true
  let r = await jalan(d, env, T0 + JAM, true)
  assert.deepEqual(d.terkirim, [], 'satu galat R2 belum berbunyi')
  assert.equal(r.galat.length, dimulai.length)
  assert.equal(kv.keadaan['cadangan-leadku'], undefined, 'seri yang belum mulai tidak tercatat apa pun')
  d.r2Gagal = false
  await jalan(d, env, T0 + 2 * JAM, true)
  assert.deepEqual(d.terkirim, [])

  d.r2Gagal = true
  await jalan(d, env, T0 + 3 * JAM, true)
  await jalan(d, env, T0 + 4 * JAM, true)
  assert.equal(d.terkirim.length, 1)
  assert.equal(d.terkirim[0].subjek, `[Jaga] MATI: ${dimulai.map((s) => s.nama).join(', ')}`)
  assert.match(d.terkirim[0].teks, /gagal membaca R2: R2 list 503/)
  assert.match(d.terkirim[0].teks, /Yang sedang mati saat ini: 3\./)
})

test('F. pemangkasan kunci: target yang dihapus dari daftar tidak lagi terhitung mati', async () => {
  const d = pasangDunia()
  const hantu = { naik: false, gagal: 2, sejak: '2026-09-01T00:00:00.000Z', alasan: 'HTTP 522', diingatkan: '2026-09-01T00:00:00.000Z' }
  const kv = kvTiruan({ awal: { ...SUDAH_LAPOR, 'lama-dihapus': hantu } })
  const env = envDari(d, kv)
  d.mati = new Set(['grafana'])
  await jalan(d, env, T0)
  await jalan(d, env, T0 + 5 * MENIT)
  assert.equal(d.terkirim.length, 1)
  assert.match(d.terkirim[0].teks, /Yang sedang mati saat ini: 1\./)
  assert.equal('lama-dihapus' in kv.keadaan, false)
  assert.deepEqual(kv.keadaan._meta, SUDAH_LAPOR._meta, '_meta tidak ikut terpangkas')
})

test('histeresis: PULIH baru setelah 2 putaran sehat beruntun', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  const pola = [false, false, true, false, true, true] // menit 0..25
  for (const [i, ok] of pola.entries()) {
    d.mati = ok ? new Set() : new Set(['grafana'])
    await jalan(d, env, T0 + i * 5 * MENIT)
  }
  assert.deepEqual(d.terkirim.map((e) => [e.subjek, (e.saat - T0) / MENIT]), [
    ['[Jaga] MATI: Grafana', 5],
    ['[Jaga] PULIH: Grafana', 25],
  ])
  assert.match(d.terkirim[1].teks, /- Grafana, tadi mati 20 menit/)
})

test('G. penahan goyang: gagal-gagal-sehat-sehat selama 24 jam hanya 4 email, lalu 1 saat stabil', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  for (let i = 0; i < 288; i++) {
    d.mati = i % 4 < 2 ? new Set(['grafana']) : new Set()
    await jalan(d, env, T0 + i * 5 * MENIT, i % 12 === 0)
  }
  const kabar = d.terkirim.filter((e) => !e.subjek.startsWith('[Jaga] Laporan harian'))
  assert.deepEqual(kabar.map((e) => e.subjek), [
    '[Jaga] MATI: Grafana',
    '[Jaga] PULIH: Grafana',
    '[Jaga] MATI: Grafana',
    '[Jaga] NAIK-TURUN: Grafana',
  ])
  assert.match(kabar[3].teks, /Grafana naik-turun berulang \(4 kali berganti status dalam 2 jam terakhir\), kabarnya ditahan sampai stabil 2 jam\./)
  const harian = d.terkirim.filter((e) => e.subjek.startsWith('[Jaga] Laporan harian'))
  assert.equal(harian.length, 1, 'laporan pagi tetap datang')
  assert.match(harian[0].teks, /Sedang naik-turun, kabarnya ditahan sampai stabil 2 jam: Grafana\./)
  assert.ok(kv.tulis <= 289, `tulis KV ${kv.tulis} dalam 24 jam, di bawah batas 1.000`)

  // Berhenti goyang: setelah 2 jam tanpa perubahan status, satu kabar status terakhir.
  d.mati = new Set()
  for (let i = 288; i < 288 + 30; i++) await jalan(d, env, T0 + i * 5 * MENIT)
  const akhir = d.terkirim.filter((e) => !e.subjek.startsWith('[Jaga] Laporan harian')).slice(4)
  assert.deepEqual(akhir.map((e) => e.subjek), ['[Jaga] STABIL: Grafana'])
  assert.match(akhir[0].teks, /- Grafana: normal/)
})

test('laporan harian: "Aktif" pada putaran pertama, lalu tiap pagi dengan umur cadangan', async () => {
  const d = pasangDunia()
  const kv = kvTiruan()
  const env = envDari(d, kv)
  const t1 = Date.parse('2026-10-04T03:05:00Z') // bukan putaran jam-an
  d.mati = new Set(['afra-web'])
  let r = await jalan(d, env, t1)
  assert.equal(d.terkirim.length, 1)
  assert.equal(d.terkirim[0].subjek, `[Jaga] Aktif: ${N} dari ${N} layanan sehat`)
  assert.equal(r.laporan.subjek, d.terkirim[0].subjek)
  assert.equal(d.r2Dipanggil, dimulaiPada(t1), 'laporan memaksa cek cadangan walau bukan menit 0')
  assert.match(d.terkirim[0].teks, /- Cadangan DB lisensi CAD: 2 jam lalu/)
  assert.match(d.terkirim[0].teks, /- Cadangan DB LeadKu: belum diperiksa sampai 2026-10-06 07:00 WIB/)
  assert.match(d.terkirim[0].teks, /email harian ini tidak datang, berarti Jaga sendiri yang bermasalah/)
  assert.equal(kv.keadaan._meta.laporan, new Date(t1).toISOString())

  await jalan(d, env, t1 + 5 * MENIT) // afra-web gagal kedua: MATI, tanpa laporan
  assert.deepEqual(d.terkirim.slice(1).map((e) => e.subjek), ['[Jaga] MATI: afratraining.com'])
  assert.equal(d.r2Dipanggil, dimulaiPada(t1))

  // Pagi berikutnya 00:00 UTC: Resend gagal, laporan dicoba lagi di putaran 00:05.
  const pagi = Date.parse('2026-10-05T00:00:00Z')
  d.resendGagal = true
  r = await jalan(d, env, pagi, true)
  // Pengingat MASIH MATI gagal terkirim, jadi laporan juga menunggu dan tidak ada yang disimpan.
  assert.match(r.galat.join(), /Resend gagal: Resend menolak: HTTP 429/)
  assert.equal(kv.keadaan._meta.laporan, new Date(t1).toISOString())
  d.resendGagal = false
  const r2Sebelum = d.r2Dipanggil
  const jumlahSebelum = d.terkirim.length
  r = await jalan(d, env, pagi + 5 * MENIT)
  assert.equal(d.r2Dipanggil, r2Sebelum + dimulaiPada(pagi), 'putaran 00:05 ikut cek cadangan karena laporan')
  assert.deepEqual(d.terkirim.slice(jumlahSebelum).map((e) => e.subjek), [
    '[Jaga] MASIH MATI: afratraining.com',
    `[Jaga] Laporan harian: ${N - 1} dari ${N} layanan sehat`,
  ])
  const lap = d.terkirim.at(-1)
  assert.match(lap.teks, /Yang sedang mati:\n- afratraining\.com, sudah 21 jam: HTTP 522/)
  assert.equal(kv.keadaan._meta.laporan, new Date(pagi + 5 * MENIT).toISOString())
  const jumlah = d.terkirim.length
  await jalan(d, env, pagi + 10 * MENIT)
  assert.equal(d.terkirim.length, jumlah, 'hanya sekali per pagi')
})

test('heartbeat: URL berakhiran garis miring tetap benar, galat ping diabaikan', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  d.resendGagal = true
  d.mati = new Set(['grafana'])
  const env = envDari(d, kv, { HC_PING_URL: `${HC}/` })
  await jalan(d, env, T0)
  await jalan(d, env, T0 + 5 * MENIT)
  assert.deepEqual(d.ping, [`${HC}/`, `${HC}/fail`])
  d.pingGagal = true
  d.resendGagal = false
  const r = await jalan(d, env, T0 + 10 * MENIT)
  assert.deepEqual(r.galat, [], 'galat ping tidak dihitung sebagai galat putaran')
  assert.equal(d.terkirim.length, 1)
})

test('scheduled mengembalikan promise putaran, tanpa ctx.waitUntil', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  let waitUntil = 0
  const ctx = { waitUntil: () => waitUntil++ }

  d.sekarang = T0 + 5 * MENIT
  d.mati = new Set(['grafana'])
  const p = jaga.scheduled({ scheduledTime: d.sekarang, cron: '*/5 * * * *' }, env, ctx)
  assert.ok(p instanceof Promise)
  assert.equal(kv.tulis, 0, 'putaran belum selesai saat handler kembali')
  const r = await p
  assert.equal(kv.tulis, 1, 'promise baru selesai setelah keadaan tersimpan')
  assert.equal(r.hasil.length, TARGET.length, 'menit 5: tanpa cek cadangan')
  assert.equal(waitUntil, 0)

  // Galat internal membuat promise ditolak, supaya Cron Events menandainya.
  d.sekarang = T0 + 10 * MENIT
  d.resendGagal = true
  await assert.rejects(jaga.scheduled({ scheduledTime: d.sekarang, cron: '*/5 * * * *' }, env, ctx), /galat internal: Resend gagal/)

  // Putaran menit 0 ikut memeriksa cadangan.
  d.resendGagal = false
  d.mati = new Set()
  d.sekarang = T0 + JAM
  const jam = await jaga.scheduled({ scheduledTime: d.sekarang, cron: '*/5 * * * *' }, env, ctx)
  assert.equal(jam.hasil.length, N + dimulaiPada(T0 + JAM))

  // Mode uji email juga mengembalikan promise.
  const terkirim = d.terkirim.length
  const uji = jaga.scheduled({ scheduledTime: T0, cron: '*/5 * * * *' }, { ...env, UJI_EMAIL: '1' }, ctx)
  assert.ok(uji instanceof Promise)
  await uji
  assert.equal(d.terkirim.length, terkirim + 1)
  assert.equal(d.terkirim.at(-1).subjek, '[Jaga] UJI: jalur email alarm tersambung')
  assert.equal(waitUntil, 0)
})

test('modul titik masuk hanya mengekspor fungsi, karena workerd menolak ekspor lain', () => {
  for (const [nama, nilai] of Object.entries(modul)) {
    if (nama === 'default') assert.equal(typeof nilai.scheduled, 'function')
    else assert.equal(typeof nilai, 'function', `ekspor ${nama} membuat Worker gagal start`)
  }
})

test('cek cadangan yang dipaksa laporan tidak mengubah status cadangan', async () => {
  const d = pasangDunia()
  const kv = kvTiruan()
  const env = envDari(d, kv)
  d.r2Gagal = true
  const t1 = Date.parse('2026-10-04T03:05:00Z') // bukan putaran jam-an
  const r = await jalan(d, env, t1)
  assert.equal(r.hasil.length, N, 'tanpa hasil cadangan di putaran non-jam-an')
  assert.ok(!Object.keys(kv.keadaan).some((k) => k.startsWith('cadangan-')), 'status cadangan tidak tersentuh')
  assert.match(d.terkirim[0].teks, /R2 tidak bisa dibaca saat ini/)
  assert.match(d.terkirim[0].teks, /Catatan dari Jaga sendiri/)
})

test('laporan menyebut target yang baru gagal walau belum resmi mati', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: { _meta: { laporan: '2026-10-04T10:00:00.000Z' } } })
  const env = envDari(d, kv)
  d.mati = new Set(['grafana'])
  await jalan(d, env, Date.parse('2026-10-05T00:00:00Z'), true)
  const lap = d.terkirim.find((e) => e.subjek.startsWith('[Jaga] Laporan harian'))
  assert.ok(lap, 'laporan pagi tetap datang walau email terakhir dikirim siang kemarin')
  assert.match(lap.teks, /Gagal di pemeriksaan barusan, belum dinyatakan mati:\n- Grafana:/)
})

test('heartbeat: /fail disisipkan ke path, query string tetap', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  d.resendGagal = true
  d.mati = new Set(['grafana'])
  const env = envDari(d, kv, { HC_PING_URL: `${HC}?rid=1` })
  await jalan(d, env, T0)
  await jalan(d, env, T0 + 5 * MENIT)
  assert.deepEqual(d.ping, [`${HC}?rid=1`, `${HC}/fail?rid=1`])
})

test('target tanpa isi tidak menunggu badan respons (halaman besar lintas benua)', async () => {
  const d = pasangDunia()
  const kv = kvTiruan({ awal: SUDAH_LAPOR })
  const env = envDari(d, kv)
  const asli = globalThis.fetch
  // Header datang cepat, badan tidak pernah selesai: dulu ini habis waktu dan dianggap gagal.
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://leadku.coreasia.id/?')) {
      // Seperti fetch sungguhan: batas waktu ikut memutus pembacaan badan.
      const badan = new ReadableStream({
        start(c) {
          init.signal?.addEventListener('abort', () => c.error(init.signal.reason))
        },
      })
      return new Response(badan, { status: 200 })
    }
    return asli(url, init)
  }
  const mulai = Date.now()
  const r = await jalan(d, env, T0, false, { batasWaktuMs: 300 })
  assert.ok(r.hasil.find((h) => h.id === 'leadku-web').ok, 'cukup status 200 tanpa badan')
  assert.ok(Date.now() - mulai < 2000)
})

test('target dengan rahasia membawa Authorization dari secret Worker, target lain tidak', async () => {
  const kepala = {}
  globalThis.fetch = async (url, init = {}) => {
    const id = new URL(String(url)).hostname.split('.')[0]
    kepala[id] = init.headers?.authorization
    const ok = id !== 'r' || init.headers?.authorization === 'Bearer token-rahasia-uji'
    return new Response(ok ? '{"status":"ok"}' : '{"error":"unauthorized"}', { status: ok ? 200 : 401 })
  }
  const daftar = [
    { id: 'r', nama: 'r', url: 'https://r.test/', harap: 200, isi: '"status":"ok"', rahasia: 'TOKEN_UJI' },
    { id: 'b', nama: 'b', url: 'https://b.test/', harap: 200 },
  ]
  let r = await putaran({ JAGA_KV: kvTiruan({ awal: SUDAH_LAPOR }), CADANGAN: null, TOKEN_UJI: 'token-rahasia-uji' }, T0, false, { target: daftar, cadangan: [], jedaMs: 0 })
  assert.deepEqual(r.hasil.map((h) => h.ok), [true, true])
  assert.equal(kepala.r, 'Bearer token-rahasia-uji')
  assert.equal(kepala.b, undefined, 'token tidak bocor ke target lain')
  r = await putaran({ JAGA_KV: kvTiruan({ awal: SUDAH_LAPOR }), CADANGAN: null }, T0, false, { target: daftar, cadangan: [], jedaMs: 0 })
  assert.equal(r.hasil[0].ok, false, 'secret belum dipasang berarti berbunyi, bukan dilewati')
  assert.match(r.hasil[0].alasan, /401/)
})


test('Sapa backup alarm is evaluated every five minutes without widening other backup schedules', async () => {
  const d=pasangDunia(), now=Date.parse('2026-11-01T03:10:00Z')
  const kv=kvTiruan({awal:{_meta:{laporan:'2026-11-01T03:00:00.000Z',harian:'2026-11-01T03:00:00.000Z'}}})
  const env=envDari(d,kv), prefixes=[]
  env.CADANGAN={async list({prefix}){prefixes.push(prefix);return {objects:[{uploaded:new Date(now-60*MENIT)}],truncated:false}}}
  const cadangan=[{id:'cadangan-sapa',nama:'Cadangan Sapa',prefix:'sapa/primesotech/',maksJam:.25,tiapPutaran:true},{id:'other',nama:'Other',prefix:'other/',maksJam:27}]
  const first=await jalan(d,env,now,false,{target:[],cadangan})
  const second=await jalan(d,env,now+5*MENIT,false,{target:[],cadangan})
  assert.deepEqual(prefixes,['sapa/primesotech/','sapa/primesotech/'])
  assert.equal(first.hasil.length,1);assert.equal(second.hasil.length,1)
  assert.equal(second.hasil[0].ok,false)
  assert.ok(d.terkirim.some(e=>/Sapa/.test(e.teks)))
})
