import test from 'node:test'
import assert from 'node:assert/strict'
import { nilai, susunEmail } from '../src/logika.js'
import { TARGET, PENTING } from '../src/target.js'

const JAM = 60 * 60 * 1000
const T0 = Date.parse('2026-11-10T00:00:00Z')
const WA = { id: 'sapa-whatsapp', nama: 'Sapa: koneksi WhatsApp 3395', ok: false, alasan: 'status belum sehat' }
const LAIN = { id: 'a', nama: 'a', ok: false, alasan: 'x' }
const kosong = { mati: [], pulih: [], ingat: [], goyang: [], stabil: [] }

test('setiap target penting benar-benar ada di daftar', () => {
  for (const id of Object.keys(PENTING)) assert.ok(TARGET.find((t) => t.id === id), id)
})

test('WhatsApp putus: judul PENTING, isi menyebut akibat dan langkah', () => {
  const e = susunEmail({ ...kosong, mati: [WA] }, T0, {})
  assert.equal(e.subjek, '[PENTING] OTP CashFlow tidak jalan, WhatsApp Sapa putus')
  assert.match(e.teks, /^OTP CashFlow tidak jalan/)
  assert.match(e.teks, /tanpa OTP WhatsApp/)
  assert.match(e.teks, /tautkan ulang WhatsApp dari HP nomor 3395/)
  assert.match(e.teks, /Sapa: koneksi WhatsApp 3395: status belum sehat/)
})

test('pengingat, kabar stabil masih mati, dan gabungan dengan target lain', () => {
  assert.match(susunEmail({ ...kosong, ingat: [{ ...WA, lamaMs: JAM }] }, T0, {}).subjek, /^\[PENTING\] OTP CashFlow/)
  assert.match(susunEmail({ ...kosong, stabil: [{ ...WA, naik: false, lamaMs: JAM }] }, T0, {}).subjek, /^\[PENTING\] OTP CashFlow/)
  assert.equal(
    susunEmail({ ...kosong, mati: [WA, LAIN] }, T0, {}).subjek,
    '[PENTING] OTP CashFlow tidak jalan, WhatsApp Sapa putus | MATI: a',
  )
})

test('target biasa dan kabar pulih tetap seperti semula', () => {
  assert.equal(susunEmail({ ...kosong, mati: [LAIN] }, T0, {}).subjek, '[Jaga] MATI: a')
  const pulih = susunEmail({ ...kosong, pulih: [{ ...WA, ok: true, lamaMs: JAM }] }, T0, {})
  assert.equal(pulih.subjek, '[Jaga] PULIH: Sapa: koneksi WhatsApp 3395')
  assert.doesNotMatch(pulih.teks, /tautkan ulang/)
})

test('WhatsApp diingatkan tiap jam, target biasa tetap 6 jam', () => {
  const iso = new Date(T0).toISOString()
  const keadaan = {
    'sapa-whatsapp': { naik: false, gagal: 2, sejak: iso, alasan: 'x', diingatkan: iso },
    a: { naik: false, gagal: 2, sejak: iso, alasan: 'x', diingatkan: iso },
  }
  const sebentar = nilai(keadaan, [WA, LAIN], T0 + 59 * 60 * 1000)
  assert.deepEqual(sebentar.ingat.map((x) => x.id), [])
  const sejam = nilai(keadaan, [WA, LAIN], T0 + JAM)
  assert.deepEqual(sejam.ingat.map((x) => x.id), ['sapa-whatsapp'])
  const enam = nilai(keadaan, [WA, LAIN], T0 + 6 * JAM)
  assert.deepEqual(enam.ingat.map((x) => x.id).sort(), ['a', 'sapa-whatsapp'])
})
