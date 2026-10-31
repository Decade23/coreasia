import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cocok,
  durasi,
  galatCadangan,
  catatLaporan,
  jenisLaporan,
  nilai,
  nilaiCadangan,
  pangkas,
  susunEmail,
  susunEmailDarurat,
  susunLaporan,
} from '../src/logika.js'

const T0 = Date.parse('2026-10-04T00:00:00Z')
const MENIT = 60_000
const JAM = 60 * MENIT
const gagal = (id, extra = {}) => ({ id, nama: id, ok: false, alasan: 'HTTP 522', ...extra })
const sehat = (id, extra = {}) => ({ id, nama: id, ok: true, alasan: '', ...extra })

// Jalankan deret hasil (true = sehat) tiap 5 menit dan kumpulkan semua kabar.
function deret(pola, { id = 'a', mulai = T0, keadaan = {} } = {}) {
  let k = keadaan
  const kabar = []
  pola.forEach((ok, i) => {
    const r = nilai(k, [ok ? sehat(id) : gagal(id)], mulai + i * 5 * MENIT)
    for (const jenis of ['mati', 'pulih', 'ingat', 'goyang', 'stabil']) for (const x of r[jenis]) kabar.push({ i, jenis, ...x })
    k = r.keadaan
  })
  return { keadaan: k, kabar }
}

test('cocok: kode persis, bukan5xx, dan isi wajib', () => {
  assert.equal(cocok({ harap: 200 }, 200, ''), true)
  assert.equal(cocok({ harap: 200 }, 503, ''), false)
  assert.equal(cocok({ harap: 'bukan5xx' }, 404, ''), true)
  assert.equal(cocok({ harap: 'bukan5xx' }, 401, ''), true)
  assert.equal(cocok({ harap: 'bukan5xx' }, 522, ''), false)
  assert.equal(cocok({ harap: 'bukan5xx' }, 0, ''), false)
  assert.equal(cocok({ harap: 200, isi: '"status":"ok"' }, 200, '{"status":"ok"}'), true)
  assert.equal(cocok({ harap: 200, isi: '"status":"ok"' }, 200, '{"status":"degraded"}'), false)
})

test('satu kegagalan belum berbunyi, dua beruntun berbunyi sekali', () => {
  let r = nilai({}, [gagal('a')], T0)
  assert.equal(r.mati.length, 0)
  r = nilai(r.keadaan, [gagal('a')], T0 + 5 * MENIT)
  assert.deepEqual(r.mati.map((m) => m.id), ['a'])
  assert.equal(r.keadaan.a.naik, false)
  assert.equal(r.keadaan.a.sejak, new Date(T0).toISOString(), 'mulai mati dihitung dari kegagalan pertama')
  const k = r.keadaan
  r = nilai(k, [gagal('a')], T0 + 10 * MENIT)
  assert.equal(r.mati.length + r.ingat.length, 0, 'tidak berbunyi ulang tiap putaran')
  assert.equal(JSON.stringify(r.keadaan), JSON.stringify(k), 'keadaan identik sehingga putaran() tidak menulis KV')
})

test('kegagalan sesaat yang pulih tidak berbunyi', () => {
  let r = nilai({}, [gagal('a')], T0)
  r = nilai(r.keadaan, [sehat('a')], T0 + 5 * MENIT)
  assert.equal(r.mati.length + r.pulih.length, 0)
  r = nilai(r.keadaan, [gagal('a')], T0 + 10 * MENIT)
  assert.equal(r.mati.length, 0, 'hitungan beruntun mulai dari nol lagi')
})

test('pulih butuh 2 putaran sehat beruntun, lama mati dihitung sampai sehat pertama', () => {
  // gagal, gagal (MATI), sehat, gagal, sehat, sehat (PULIH)
  const { keadaan, kabar } = deret([false, false, true, false, true, true])
  assert.deepEqual(kabar.map((x) => `${x.i}:${x.jenis}`), ['1:mati', '5:pulih'], 'satu putaran sehat di tengah tidak memicu PULIH')
  assert.equal(durasi(kabar[1].lamaMs), '20 menit', 'dari kegagalan pertama (menit 0) sampai sehat pertama pasangan terakhir (menit 20)')
  assert.equal(keadaan.a.naik, true)
  assert.equal(keadaan.a.sejak, new Date(T0 + 20 * MENIT).toISOString())
  assert.equal(keadaan.a.sehat, undefined, 'penghitung sehat dibuang setelah pulih')
})

test('pengingat tiap 6 jam, lalu pulih membawa lama mati', () => {
  let r = nilai({}, [gagal('a')], T0)
  r = nilai(r.keadaan, [gagal('a')], T0 + 5 * MENIT)
  r = nilai(r.keadaan, [gagal('a')], T0 + 6 * JAM)
  assert.equal(r.ingat.length, 0, 'belum 6 jam sejak alarm')
  r = nilai(r.keadaan, [gagal('a')], T0 + 6 * JAM + 5 * MENIT)
  assert.deepEqual(r.ingat.map((m) => m.id), ['a'])
  r = nilai(r.keadaan, [gagal('a')], T0 + 7 * JAM)
  assert.equal(r.ingat.length, 0, 'pengingat berikutnya 6 jam lagi')
  r = nilai(r.keadaan, [sehat('a')], T0 + 24 * JAM)
  assert.equal(r.pulih.length, 0, 'baru satu putaran sehat')
  r = nilai(r.keadaan, [sehat('a')], T0 + 24 * JAM + 5 * MENIT)
  assert.deepEqual(r.pulih.map((m) => m.id), ['a'])
  assert.equal(durasi(r.pulih[0].lamaMs), '24 jam')
  assert.equal(r.keadaan.a.naik, true)
})

test('penahan goyang: gagal-gagal-sehat-sehat berulang hanya 4 kabar, lalu sekali saat stabil', () => {
  const pola = Array.from({ length: 288 }, (_, i) => i % 4 >= 2) // 24 jam
  const { keadaan, kabar } = deret(pola)
  assert.deepEqual(
    kabar.map((x) => x.jenis),
    ['mati', 'pulih', 'mati', 'goyang'],
    'transisi ke-4 dalam 2 jam diganti satu kabar naik-turun, sisanya ditahan',
  )
  assert.equal(kabar[3].kali, 4)
  assert.equal(keadaan.a.goyang, true)
  assert.ok(keadaan.a.transisi.length <= 13, 'riwayat transisi hanya 2 jam terakhir')

  // Berhenti goyang: sehat terus. Kabar stabil baru keluar 2 jam setelah transisi terakhir.
  const lanjut = deret(Array(40).fill(true), { keadaan, mulai: T0 + 288 * 5 * MENIT })
  assert.deepEqual(lanjut.kabar.map((x) => x.jenis), ['stabil'])
  assert.equal(lanjut.kabar[0].naik, true)
  const transisiTerakhir = Date.parse(keadaan.a.transisi.at(-1))
  const saatStabil = T0 + (288 + lanjut.kabar[0].i) * 5 * MENIT
  assert.ok(saatStabil - transisiTerakhir >= 2 * JAM && saatStabil - transisiTerakhir < 2 * JAM + 15 * MENIT)
  assert.equal(lanjut.keadaan.a.goyang, undefined)
  assert.equal(lanjut.keadaan.a.transisi, undefined)
})

test('penahan goyang: stabil dalam keadaan mati dikabarkan sekali lalu pengingat 6 jam lagi', () => {
  const awal = deret(Array.from({ length: 8 }, (_, i) => i % 4 >= 2)) // mati, pulih, mati, goyang
  assert.equal(awal.kabar.at(-1).jenis, 'goyang')
  const mulai = T0 + 8 * 5 * MENIT
  const mati = deret(Array(12 * 9).fill(false), { keadaan: awal.keadaan, mulai })
  const jenis = mati.kabar.map((x) => x.jenis)
  assert.deepEqual(jenis, ['stabil', 'ingat'], 'MATI ditahan, stabil (masih mati) sekali, pengingat 6 jam setelahnya')
  assert.equal(mati.kabar[0].naik, false)
  assert.equal(mati.kabar[1].i - mati.kabar[0].i, 72, '6 jam = 72 putaran')
  const email = susunEmail({ mati: [], pulih: [], ingat: [], goyang: [], stabil: [mati.kabar[0]] }, mulai, mati.keadaan)
  assert.match(email.subjek, /^\[Jaga\] MASIH MATI: a$/)
  assert.match(email.teks, /Sudah 2 jam tidak naik-turun lagi/)
})

test('cadangan: belum mulai, kosong, basi, segar, dan galat baca R2', () => {
  const seri = { id: 'c', nama: 'C', maksJam: 27, mulai: '2026-10-06T00:00:00Z' }
  assert.equal(nilaiCadangan(seri, null, T0), null, 'sebelum tanggal mulai tidak diperiksa')
  const s2 = { ...seri, mulai: undefined }
  assert.equal(nilaiCadangan(s2, null, T0).ok, false)
  assert.equal(nilaiCadangan(s2, new Date(T0 - 28 * JAM), T0).ok, false)
  assert.equal(nilaiCadangan(s2, new Date(T0 - 2 * JAM), T0).ok, true)
  let r = nilai({}, [nilaiCadangan(s2, null, T0)], T0)
  assert.equal(r.mati.length, 1, 'cadangan berbunyi pada kegagalan pertama')
  r = nilai(r.keadaan, [nilaiCadangan(s2, new Date(T0), T0 + JAM)], T0 + JAM)
  assert.equal(r.pulih.length, 1, 'dan pulih pada satu putaran jam-an sehat')
  r = nilai({}, [galatCadangan(s2, 'R2 list 503')], T0)
  assert.equal(r.mati.length, 0, 'galat baca R2 butuh 2 putaran')
  r = nilai(r.keadaan, [galatCadangan(s2, 'R2 list 503')], T0 + JAM)
  assert.equal(r.mati.length, 1)
})

test('pangkas: kunci yang tidak ada di daftar dibuang, _meta disimpan', () => {
  const k = { a: { naik: true }, hantu: { naik: false }, _meta: { laporan: 'x' } }
  assert.deepEqual(pangkas(k, new Set(['a'])), { a: { naik: true }, _meta: { laporan: 'x' } })
})

test('email: petunjuk IDCloudHost hanya bila >= 2 server IDCloudHost mati', () => {
  const satu = susunEmail({ mati: [gagal('a', { penyedia: 'idcloudhost' })], pulih: [], ingat: [] }, T0, {})
  assert.ok(!satu.teks.includes('deposit'))
  const dua = susunEmail({ mati: [gagal('a', { penyedia: 'idcloudhost' }), gagal('b', { penyedia: 'idcloudhost' })], pulih: [], ingat: [] }, T0, {})
  assert.ok(dua.teks.includes('deposit'))
  assert.ok(dua.subjek.startsWith('[Jaga] MATI: a, b'))
  assert.equal(susunEmail({ mati: [], pulih: [], ingat: [] }, T0, {}), null)
})

test('email: _meta tidak terhitung sebagai layanan mati', () => {
  const e = susunEmail({ mati: [gagal('a')], pulih: [], ingat: [] }, T0, { a: { naik: false }, b: { naik: true }, _meta: { laporan: 'x' } })
  assert.match(e.teks, /Yang sedang mati saat ini: 1\./)
})

test('email darurat KV: menyebut KV tidak terbaca dan petunjuk IDCloudHost', () => {
  const e = susunEmailDarurat([gagal('a', { penyedia: 'idcloudhost' }), gagal('b', { penyedia: 'idcloudhost' })], 'KV get 500', T0)
  assert.equal(e.subjek, '[Jaga] GAGAL, keadaan KV tidak terbaca: a, b')
  assert.match(e.teks, /tidak bisa membaca catatan keadaannya di Cloudflare KV/)
  assert.match(e.teks, /Galat KV: KV get 500\./)
  assert.ok(e.teks.includes('deposit'))
})

test('jenis laporan: aktif bila belum pernah, harian sekali per pagi UTC 00-02, terpisah dari Aktif', () => {
  const pukul = (hm, tgl = '2026-10-05') => Date.parse(`${tgl}T${hm}:00Z`)
  assert.equal(jenisLaporan(undefined, pukul('13:05')), 'aktif')
  assert.equal(jenisLaporan({}, pukul('13:05')), 'aktif')
  const kemarin = '2026-10-04T00:00:00.000Z'
  assert.equal(jenisLaporan({ laporan: kemarin, harian: kemarin }, pukul('00:00')), 'harian')
  assert.equal(jenisLaporan({ laporan: kemarin, harian: kemarin }, pukul('01:55')), 'harian', 'dicoba lagi bila putaran 00:00 gagal')
  assert.equal(jenisLaporan({ laporan: kemarin, harian: kemarin }, pukul('02:00')), null, 'di luar jendela pagi')
  const tadi = '2026-10-05T00:00:00.000Z'
  assert.equal(jenisLaporan({ laporan: tadi, harian: tadi }, pukul('00:05')), null, 'sudah terkirim hari ini')
  // Email Aktif dikirim sore (meta.laporan terisi, harian belum): laporan pagi esoknya tetap datang.
  assert.equal(jenisLaporan({ laporan: '2026-10-04T10:05:00.000Z' }, pukul('00:00')), 'harian')
  assert.equal(jenisLaporan({ laporan: '2026-10-04T23:00:00.000Z' }, pukul('20:00')), null)
})

test('catatLaporan: Aktif di jendela pagi dihitung sebagai laporan hari itu', () => {
  const sore = catatLaporan({}, 'aktif', Date.parse('2026-10-04T10:05:00Z'))
  assert.equal(sore.harian, undefined)
  assert.equal(jenisLaporan(sore, Date.parse('2026-10-05T00:00:00Z')), 'harian')
  const pagi = catatLaporan({}, 'aktif', Date.parse('2026-10-05T00:30:00Z'))
  assert.equal(jenisLaporan(pagi, Date.parse('2026-10-05T00:35:00Z')), null, 'tidak ada dua email di pagi yang sama')
  const h = catatLaporan({ laporan: 'x' }, 'harian', Date.parse('2026-10-05T00:00:00Z'))
  assert.equal(h.harian, '2026-10-05T00:00:00.000Z')
})

test('laporan harian: ringkasan sehat, yang mati beserta lamanya, umur cadangan, dan kalimat tanda hidup', () => {
  const target = [
    { id: 'a', nama: 'A' },
    { id: 'b', nama: 'B' },
    { id: 'c', nama: 'C' },
  ]
  const keadaan = {
    a: { naik: true, gagal: 0, sejak: '2026-10-01T00:00:00.000Z' },
    b: { naik: false, gagal: 2, sejak: '2026-10-03T21:00:00.000Z', alasan: 'HTTP 522' },
    c: { naik: true, gagal: 0, sejak: '2026-10-03T00:00:00.000Z', goyang: true },
    _meta: { laporan: '2026-10-03T00:00:00.000Z' },
  }
  const info = [
    { seri: { id: 's1', nama: 'Cadangan 1', maksJam: 27 }, terbaru: new Date(T0 - 5 * JAM) },
    { seri: { id: 's2', nama: 'Cadangan 2', maksJam: 27 }, terbaru: new Date(T0 - 30 * JAM) },
    { seri: { id: 's3', nama: 'Cadangan 3', maksJam: 27, mulai: '2026-10-06T00:00:00Z' }, belumMulai: true },
    { seri: { id: 's4', nama: 'Cadangan 4', maksJam: 27 }, galat: 'R2 list 503' },
  ]
  const l = susunLaporan('harian', keadaan, target, info, T0)
  assert.equal(l.subjek, '[Jaga] Laporan harian: 2 dari 3 layanan sehat')
  assert.match(l.teks, /- B, sudah 3 jam: HTTP 522/)
  assert.match(l.teks, /Sedang naik-turun, kabarnya ditahan sampai stabil 2 jam: C\./)
  assert.match(l.teks, /- Cadangan 1: 5 jam lalu\n/)
  assert.match(l.teks, /- Cadangan 2: 30 jam lalu, melewati batas 27 jam/)
  assert.match(l.teks, /- Cadangan 3: belum diperiksa sampai 2026-10-06 07:00 WIB/)
  assert.match(l.teks, /- Cadangan 4: R2 tidak bisa dibaca saat ini/)
  assert.match(l.teks, /Kalau suatu pagi email harian ini tidak datang, berarti Jaga sendiri yang bermasalah/)
  const denganCadangan = susunLaporan('harian', { ...keadaan, s2: { naik: false, gagal: 1, sejak: new Date(T0 - 3 * JAM).toISOString(), alasan: 'basi' } }, target, info, T0)
  assert.equal(denganCadangan.subjek, '[Jaga] Laporan harian: 2 dari 3 layanan sehat, 1 cadangan bermasalah')
  assert.match(denganCadangan.teks, /- Cadangan 2, sudah 3 jam: basi/)
  const aktif = susunLaporan('aktif', { a: keadaan.a }, target.slice(0, 1), null, T0)
  assert.equal(aktif.subjek, '[Jaga] Aktif: 1 dari 1 layanan sehat')
  assert.match(aktif.teks, /Tidak ada yang sedang mati\./)
})

test('durasi ditulis manusiawi', () => {
  assert.equal(durasi(30_000), '1 menit')
  assert.equal(durasi(90 * MENIT), '1 jam 30 menit')
  assert.equal(durasi(26 * 60 * MENIT + 50 * MENIT), '26 jam 50 menit')
  assert.equal(durasi(10 * 24 * 60 * MENIT + 22 * 60 * MENIT), '10 hari 22 jam')
})

test('teks email bebas emoji, em-dash, panah, dan titik koma', () => {
  const k = { a: { naik: false, gagal: 2, sejak: new Date(T0).toISOString(), alasan: 'HTTP 522' } }
  const semua = [
    susunEmail(
      { mati: [gagal('a', { penyedia: 'idcloudhost' }), gagal('b', { penyedia: 'idcloudhost' })], pulih: [{ ...sehat('c'), lamaMs: JAM }], ingat: [{ ...gagal('d'), lamaMs: 7 * JAM }], goyang: [{ ...gagal('e'), kali: 4 }], stabil: [{ ...sehat('f'), naik: true }, { ...gagal('g'), naik: false, lamaMs: JAM }] },
      T0,
      k,
    ),
    susunEmailDarurat([gagal('a')], 'x', T0),
    susunLaporan('harian', k, [{ id: 'a', nama: 'A' }], [{ seri: { id: 's', nama: 'S', maksJam: 27 }, terbaru: new Date(T0) }], T0),
  ]
  for (const e of semua) {
    const isi = e.subjek + e.teks
    assert.doesNotMatch(isi, /[—–→←;]|\p{Extended_Pictographic}/u, e.subjek)
  }
})
