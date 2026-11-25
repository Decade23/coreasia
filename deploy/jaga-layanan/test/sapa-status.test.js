import test from 'node:test'
import assert from 'node:assert/strict'
import {cocok,nilai,alasanJson} from '../src/logika.js'
import {TARGET,CADANGAN} from '../src/target.js'
test('Sapa health reads the root status and cannot be fooled by a healthy child',()=>{
 const target=TARGET.find(x=>x.id==='sapa-whatsapp')
 assert.ok(target)
 for(const value of [{status:'bermasalah',backup:{status:'ok'}},{status:'bermasalah',pipeline:{status:'ok'}},{backup:{status:'ok'}}])assert.equal(cocok(target,200,JSON.stringify(value)),false)
 assert.equal(cocok(target,200,JSON.stringify({status:'ok',backup:{status:'ok'}})),true)
 assert.equal(cocok(target,200,'not json'),false)
 assert.equal(cocok(target,503,JSON.stringify({status:'ok'})),false)
 assert.equal(CADANGAN.find(x=>x.id==='cadangan-sapa').maksJam,0.25)
})

// 25 Nov 2026: disk server Sapa penuh, cadangan lokal gagal, status induk "bermasalah",
// padahal WhatsApp tersambung dan OTP CashFlow jalan. Email berjudul OTP tidak jalan.
const sehat={status:'ok',expected:1,connected:1,problem:0,statuses:{connected:1},masuk_cashflow:'ok',
 pipeline:{pending_inbound:0,pending_publish:0,oldest_pending_ms:0,media_archive_failed:0,rejected_inbound:0},
 backup:{status:'ok',age_seconds:3,free_bytes:8*1024**3}}
const cadanganGagal={...sehat,status:'bermasalah',backup:{status:'bermasalah',age_seconds:13841,free_bytes:1.9*1024**3}}
test('Alarm WhatsApp tidak berbunyi bila yang gagal hanya cadangan lokal',()=>{
 const wa=TARGET.find(x=>x.id==='sapa-whatsapp')
 assert.equal(cocok(wa,200,JSON.stringify(sehat)),true)
 assert.equal(cocok(wa,200,JSON.stringify(cadanganGagal)),true)
 for(const ubah of [{connected:0},{expected:0},{problem:1},{masuk_cashflow:'gagal'},{pipeline:{oldest_pending_ms:600000}},
   {pipeline:{media_archive_failed:2}},{pipeline:{rejected_inbound:1}},{connected:undefined}])
  assert.equal(cocok(wa,200,JSON.stringify({...cadanganGagal,...ubah})),false,JSON.stringify(ubah))
 // Status induk bermasalah dengan cadangan sehat: penyebab tak dikenal tetap MATI.
 assert.equal(cocok(wa,200,JSON.stringify({...sehat,status:'bermasalah'})),false)
 assert.equal(cocok(wa,503,JSON.stringify(sehat)),false)
 assert.match(alasanJson(wa,JSON.stringify({...sehat,status:'bermasalah',connected:0})),/WhatsApp 0\/1 tersambung/)
})
test('Sisa disk server Sapa di bawah 3 GB berbunyi lebih dulu',()=>{
 const disk=TARGET.find(x=>x.id==='sapa-disk')
 assert.ok(disk && disk.rahasia==='SAPA_MONITOR_TOKEN')
 assert.equal(cocok(disk,200,JSON.stringify(sehat)),true)
 assert.equal(cocok(disk,200,JSON.stringify(cadanganGagal)),false)
 assert.equal(cocok(disk,200,JSON.stringify({status:'ok'})),false)
 assert.equal(cocok(disk,200,'bukan json'),false)
 assert.match(alasanJson(disk,JSON.stringify(cadanganGagal)),/sisa disk 1\.9 GB \(batas 3 GB\), cadangan bermasalah/)
})

test('Cadangan Kreatif, assets staging, Feeds, dan primak3 ikut dipantau harian (25 Nov 2026)', () => {
  const harap = {
    'cadangan-kreatif': 'coreasia-kreatif/kreatif-',
    'cadangan-assets-staging': 'coreasia-assets-staging/assets-staging-',
    'cadangan-feeds': 'feeds/feeds-db-',
    'cadangan-primak3': 'primak3/primak3-db-',
  }
  for (const [id, prefix] of Object.entries(harap)) {
    const s = CADANGAN.find((x) => x.id === id)
    assert.ok(s, `${id} terdaftar`)
    assert.equal(s.prefix, prefix)
    assert.equal(s.maksJam, 27)
    assert.ok(!s.tiapPutaran, `${id} cukup diperiksa tiap jam`)
  }
  assert.equal(new Set(CADANGAN.map((x) => x.id)).size, CADANGAN.length, 'id seri unik')
})
