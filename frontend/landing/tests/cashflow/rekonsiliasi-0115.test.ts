import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { jenisUang, keTransaksiBaris, JENIS_TRANSAKSI } from '../../adapters/cashflowBuku'
import { keKabar, JENIS_KABAR } from '../../adapters/cashflowPerangkat'
import { JENIS_PERISTIWA } from '../../adapters/cashflowJejak'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { adaMigrasiNomor, DIR_MIGRASI, fungsiTerakhir, parameterFungsi } from './migrasi'
const ADA=adaMigrasiNomor('0115')
describe('0115 penyesuaian terpisah dari uang usaha',()=>{
 it('jenis penyesuaian tidak tampil sebagai pemasukan atau transfer',()=>{
  expect(jenisUang('income',null,'r')).toBe('penyesuaian')
  expect(jenisUang('expense',null,'r')).toBe('penyesuaian')
  expect(jenisUang('expense','g')).toBe('transfer')
  expect(jenisUang('income',null)).toBe('masuk')
  expect(JENIS_TRANSAKSI).toContain('penyesuaian')
 })
 it('adapter transaksi membaca penanda server dan nominal sen',()=>{
  const row=keTransaksiBaris({id:'t',workspace_id:'w',kind:'income',amount:'10000.25',rekonsiliasi_id:'r',transfer_group:null} as any)
  expect(row.jenis).toBe('penyesuaian');expect(row.nominal).toBe(10000.25);expect(row.transfer).toBe(false)
 })
 for(const jenis of ['rekonsiliasi.basi','rekonsiliasi.ingat'])it(`kabar ${jenis} disanitasi`,()=>{
  const r=keKabar({id:1,workspace_id:'w',jenis,pada:'2026-10-28',isi:{dompet:'Tunai',selisih:'-20000.25',per_tanggal:'2026-10-28',hari:31,rahasia:'jangan bocor'}} as any)
  expect(r.jenis).toBe(jenis);expect(r.kodeTakDikenal).toBe(false)
  expect(r.rekonsiliasi).toEqual({dompet:'Tunai',selisih:-20000.25,perTanggal:'2026-10-28',hari:31})
  expect(JSON.stringify(r)).not.toContain('rahasia')
  expect(JENIS_KABAR).toContain(jenis)
 })
 it('ID dan EN punya label produk untuk penyesuaian dan kabar',()=>{
  for(const bahasa of ['id','en'] as const){
   expect(KAMUS_CASHFLOW[bahasa].transaksi.penyesuaian).toBeTruthy()
   expect(KAMUS_CASHFLOW[bahasa].kode.jenisKabar.rekonsiliasi_basi).toBeTruthy()
   expect(KAMUS_CASHFLOW[bahasa].jejak.jenisOpsi.rekonsiliasi.simpan).toBeTruthy()
  }
 })
 it.skipIf(!ADA)('daftar aktivitas baru ada pada CHECK 0115',()=>{
  const s=readFileSync(join(DIR_MIGRASI,'0115_rekonsiliasi.sql'),'utf8')
  for(const j of ['rekonsiliasi.simpan','rekonsiliasi.basi']){
   expect(JENIS_PERISTIWA).toContain(j)
   expect(s).toContain(`'${j}'::text`)
  }
 })
 it.skipIf(!ADA)('kontrak simpan delapan parameter, pratinjau dua',()=>{
  expect(parameterFungsi('rekonsiliasi_simpan').map(p=>p.nama)).toEqual(['p_id','p_wallet','p_per','p_saldo_riil','p_saldo_layar','p_tindakan','p_catatan','p_tx_id'])
  expect(parameterFungsi('rekonsiliasi_pratinjau').map(p=>p.nama)).toEqual(['p_wallet','p_per'])
 })
 it.skipIf(!ADA)('agregat console mengecualikan penyesuaian dan saldo tetap lengkap',()=>{
  for(const f of ['admin_pengguna_360','admin_ruang_360','admin_anggaran_bangun','rekap_kontribusi'])expect(fungsiTerakhir(f).badan).toContain('rekonsiliasi_id is null')
  expect(fungsiTerakhir('admin_dompet_bangun').badan).not.toContain('rekonsiliasi_id is null')
 })
})
