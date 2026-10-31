import test from 'node:test'
import assert from 'node:assert/strict'
import {cocok,nilai} from '../src/logika.js'
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
