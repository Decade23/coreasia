// Uji browser dengan data sintetis. Jalankan server lokal dengan:
// NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398
// NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis NITRO_PORT=4399
// node .output/server/index.mjs
// PLAYWRIGHT_CORE_PATH boleh menunjuk ke instalasi playwright-core lain.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:net';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const pwPath=process.env.PLAYWRIGHT_CORE_PATH;
const { chromium }=await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'));
const output=process.env.CF_QA_ARTIFACTS || join(homedir(),'Codex','artifact','coreasia');
await mkdir(output,{recursive:true});
const portServer=createServer();
await new Promise(resolve=>portServer.listen(0,'127.0.0.1',resolve));
const cdpPort=portServer.address().port;
await new Promise(resolve=>portServer.close(resolve));
const dir=await mkdtemp(join(tmpdir(),'cf-console-headless-'));
const chrome=spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new',`--user-data-dir=${dir}`,`--remote-debugging-port=${cdpPort}`,'--no-first-run','--no-default-browser-check','--window-size=1440,900','about:blank'
],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<100;i++){try { const r=await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if(r.ok)break }catch{ /* Chrome belum siap. */ } await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  const ctx=browser.contexts()[0], page=ctx.pages()[0];
  await page.setViewportSize({width:1440,height:900});
  const jwt = ['eyJhbGciOiJub25lIn0',Buffer.from(JSON.stringify({sub:'00000000-0000-0000-0000-000000000001',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test'].join('.');
  const session={access_token:jwt,refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'admin@example.invalid'}};
  await ctx.addInitScript(({session}) => {sessionStorage.setItem('cf-console-sesi',JSON.stringify(session));sessionStorage.setItem('cf_izin',JSON.stringify(['cashflow:view','cashflow:pii','cashflow:investigasi','cashflow:tindak','cashflow:ekspor']));},{session});
  // Jangan izinkan browser mengakses layanan luar atau gateway sungguhan.
  await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.hostname==='127.0.0.1' && ['4398','4399'].includes(u.port) ? route.continue() : route.abort();
  });
  await page.route('**/api/gw/**',route=>route.fulfill({status:404,json:{error:'gateway sintetis'}}));
  const seen=[];const errors=[];let gagalSekali=false; page.on('pageerror',e=>errors.push(e.message));
  const kasus=(subjek,tambah=[])=>({id:'11111111-1111-1111-1111-111111111111',induk:null,subjek_tipe:'user',subjek_id:subjek,ruang:[],jumlah_ruang:0,skenario:null,preset:'keluhan',alasan:'contoh audit',ranah:['akun','transaksi','jejak',...tambah],tingkat:'T2',lanjutan_dari:null,dibuka:new Date().toISOString(),akar_dibuka:new Date().toISOString(),berlaku_sampai:new Date(Date.now()+60*60*1000).toISOString(),batas_perpanjang:new Date(Date.now()+2*60*60*1000).toISOString(),ditutup:null,status:'aktif',jumlah_terdampak:1});
  const ws='22222222-2222-2222-2222-222222222222';
  const kasusRuang=(tambah=[])=>({...kasus(ws),subjek_tipe:'workspace',subjek_id:ws,ruang:[ws],jumlah_ruang:1,ranah:['ruang','dompet','transaksi','jejak',...tambah]});
  await page.route('**/api/gw/admin/auth/me',r=>r.fulfill({json:{data:{id:'admin-test',email:'admin@example.invalid',full_name:'Admin Contoh',role:'super_admin',is_active:true,mfa:true,mfa_at:new Date().toISOString(),totp_enabled_at:'2026-01-01T00:00:00Z'}}}));
  await page.route('http://127.0.0.1:4398/**',async r=>{
    const req=r.request(); if(req.method()==='OPTIONS')return r.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'}});
    const name=new URL(req.url()).pathname.split('/').pop();const p=req.postDataJSON()||{};seen.push({name,p});
    let data={};
    if(name==='admin_daftar_pengguna_v3'){
      if(p.p_offset===50 && !gagalSekali){gagalSekali=true;return r.fulfill({status:500,json:{code:'XX000',message:'Gangguan sintetis'},headers:{'access-control-allow-origin':'*'}})}
      let rows=Array.from({length:601},(_,i)=>({user_id:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,email:p.p_alasan?`orang${i+1}@contoh.invalid`:`ora***@contoh.invalid`,display_name:'',created_at:'2026-01-01T00:00:00Z',last_sign_in:null,aktivitas_terakhir:null,banned_until:null,jumlah_ruang:i%4,jumlah_tx:i,nomor_wa:null,versi_aplikasi:'1.3.6',platform:'android',terbuka:!!p.p_alasan,menunggu_hapus:false}));
      if(p.p_cari) rows=rows.filter(x=>x.email.includes(p.p_cari));
      data={total:rows.length,baris:rows.slice(p.p_offset,p.p_offset+p.p_limit).map(x=>({...x,total_semua:rows.length})),versi_terbaru:{android:'0001000300060000100000'},hapus_tersedia:true};
    }else if(name==='admin_daftar_pengguna_v2') data=[];
    else if(name==='admin_pengguna_kepala') data={user_id:p.p_user,email:'ora***@contoh.invalid',daftar:'2026-01-01T00:00:00Z',masuk_terakhir:null,banned_until:null,jumlah_ruang:0,jumlah_transaksi:3,akses_30hari:0,ruang:[],nomor_wa:null};
    else if(name==='admin_kasus_aktif') data={kasus:kasus(p.p_subjek),investigasi:[]};
    else if(name==='admin_kasus_tambah') data=p.p_ranah.includes('katalog')?kasusRuang(p.p_ranah):kasus('00000000-0000-0000-0000-000000000026',p.p_ranah);
    else if(name==='admin_pengguna_360') data={kasus:p.p_kasus,akun:{user_id:p.p_user,email:'orang26@contoh.invalid',display_name:'Rani Contoh',nama_meta:null,email_confirmed_at:null,provider:'email',providers:['email'],daftar:'2026-01-01T00:00:00Z',masuk_terakhir:null,banned_until:null,sesi:{jumlah:1,terakhir:null},mfa:false},hitung:{ruang:0,ruang_dalam_lingkup:0,transaksi:3,jejak:0,sampah:0,perangkat:0,kabar:0},pertama_catat:null,total:{transaksi:3,masuk_bersih:12000,keluar_bersih:3000},ruang:[]};
    else if(name==='admin_kasus_aktif_ruang') data={kasus:kasusRuang(),investigasi:[]};
    else if(name==='admin_ruang_kepala') data={workspace_id:ws,nama:'War***',jenis:'usaha',pemilik_email:'ora***@contoh.invalid',dibuat:'2026-01-01T00:00:00Z',jumlah_anggota:2,jumlah_transaksi:3,jumlah_dompet:1,akses_30hari:0};
    else if(name==='admin_ruang_360') data={kasus:p.p_kasus,ruang:{workspace_id:ws,nama:'Warung Contoh',jenis:'usaha',owner_nick:null,aturan_hapus:'pemilik',fitur_patungan:false,ada_cara_bayar:false,ada_qris:false,pemilik_id:null,dibuat:'2026-01-01T00:00:00Z'},hitung:{anggota:2,bekas_anggota:0,undangan_aktif:0,transaksi:3,dompet:1,jejak:0,sampah:0,kategori:0,anggaran:0,jadwal_aktif:0,produk:0,struk:0},agregat:{transaksi:3,masuk_bersih:12000,keluar_bersih:3000,terakhir_catat:null},anggota:[],bekas:[],undangan:[]};
    else if(name==='admin_katalog_ruang') data={kasus:p.p_kasus,workspace_id:ws,bulan:'2026-11',kategori:[],anggaran:[],baris_anggaran:[],terpotong:{kategori:false,baris_anggaran:false}};
    else if(name==='admin_stats') data={total_pengguna:601,total_ruang:230,total_transaksi:5000,transaksi_per_hari:[]};
    else if(name==='admin_ukuran_keberhasilan_v2') data=[{jumlah:52,pembanding:40,jumlah_pengecualian:2}];
    else if(name==='admin_corong_aktivasi'||name==='admin_retensi') data=[];
    else if(name==='admin_perangkat_pengguna') data={kasus:p.p_kasus,user_id:p.p_user,hari:30,perangkat:[],sesi:[],sesi_disembunyikan:false,terpotong:{perangkat:false,sesi:false},jeda:{ringkas:{n:0},per_hari:[],terbesar:[],rinci:{terbesar:false}}};
    return r.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto('http://127.0.0.1:4399/console/cashflow/pengguna',{waitUntil:'domcontentloaded'});
  await page.getByText('601 pengguna',{exact:true}).waitFor({timeout:30000});
  const rows1=await page.locator('tbody tr').count();
  await page.getByRole('button',{name:'Berikutnya',exact:true}).click();
  await page.waitForFunction(()=>location.search.includes('hal=2'));
  await page.waitForFunction(()=>[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('000000000026')));
  const page2=seen.filter(x=>x.name==='admin_daftar_pengguna_v3').at(-1)?.p;
  if(rows1!==25||page2.p_offset!==25||page2.p_limit!==25)throw Error(`Paginasi salah: ${rows1}, ${JSON.stringify(page2)}`);
  await page.getByRole('button',{name:'Berikutnya',exact:true}).click();
  await page.getByRole('alert').getByText('Gangguan sintetis').waitFor();
  if(await page.locator('tbody tr').count())throw Error('Halaman lama masih tampil setelah gagal');
  await page.getByRole('button',{name:'Coba lagi',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('000000000051')));
  await page.getByLabel('Ke halaman').fill('25');
  await page.getByRole('button',{name:'Buka',exact:true}).click();
  await page.waitForFunction(()=>location.search.includes('hal=25'));
  await page.waitForFunction(()=>[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('000000000601')));
  if(seen.filter(x=>x.name==='admin_daftar_pengguna_v3').at(-1)?.p.p_offset!==600)throw Error('Lompat halaman salah');
  await page.getByLabel('Ke halaman').fill('2');
  await page.getByRole('button',{name:'Buka',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('000000000026')));
  await page.getByRole('switch',{name:'Kontak lengkap'}).click();
  await page.getByText('orang26@contoh.invalid',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Cari email atau WhatsApp'}).fill('orang579@contoh.invalid');
  await page.getByRole('button',{name:'Cari',exact:true}).click();
  await page.getByText('1 pengguna',{exact:true}).waitFor();
  if(page.url().includes('orang579'))throw Error('Pencarian bocor ke URL');
  const searched=seen.filter(x=>x.name==='admin_daftar_pengguna_v3').at(-1).p;
  if(searched.p_offset!==0||!searched.p_alasan||searched.p_cari!=='orang579@contoh.invalid')throw Error('Pencarian terbuka salah');
  await page.getByRole('switch',{name:'Kontak lengkap'}).click();
  await page.getByText('0 pengguna',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Cari email atau WhatsApp'}).fill('');
  await page.getByRole('button',{name:'Cari',exact:true}).click();
  await page.getByText('601 pengguna',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Berikutnya',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('000000000026')));
  if(await page.getByText('orang26@contoh.invalid',{exact:true}).count())throw Error('Kontak belum tersamar');
  await page.screenshot({path:join(output,'_qa-console-cashflow-pengguna-20261104.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(200);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  if(overflow)throw Error('Halaman seluler meluber');
  await page.setViewportSize({width:1440,height:900});
  await page.locator('tbody tr').first().getByRole('link').first().click();
  await page.getByText('Isi data pengguna',{exact:true}).waitFor({timeout:15000});
  const section=page.locator('section').filter({has:page.getByText('Isi data pengguna',{exact:true})});
  for(const label of ['Ruang','Transaksi','Jejak','Akses','Dompet','Perangkat','Kabar']) if(!(await section.getByRole('link',{name:new RegExp(label)}).count())) throw Error(`Pintasan ${label} hilang`);
  if(seen.some(x=>x.name==='admin_kasus_tambah'||x.name==='admin_perangkat_pengguna'))throw Error('Ranah dimuat sebelum dipilih');
  await page.screenshot({path:join(output,'_qa-console-cashflow-360-20261104.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error('Pengguna 360 meluber di ponsel');
  await page.setViewportSize({width:1440,height:900});
  await section.getByRole('link',{name:/Perangkat/}).click();
  await page.waitForFunction(()=>location.pathname.endsWith('/perangkat'));
  await page.waitForTimeout(1000);
  if(!seen.some(x=>x.name==='admin_kasus_tambah'&&x.p.p_ranah.includes('perangkat')))throw Error('Aktivasi perangkat tidak tercatat');
  if(!seen.some(x=>x.name==='admin_perangkat_pengguna'))throw Error('Data perangkat tidak dimuat sesudah klik');
  await page.goto(`http://127.0.0.1:4399/console/cashflow/ruang/${ws}`,{waitUntil:'domcontentloaded'});
  await page.getByText('Isi data ruang',{exact:true}).waitFor({timeout:15000});
  const ruangSection=page.locator('section').filter({has:page.getByText('Isi data ruang',{exact:true})});
  for(const label of ['Anggota','Transaksi','Dompet','Katalog','Jadwal','Usaha','Struk','Jejak','Sampah','Akses']) if(!(await ruangSection.getByRole('link',{name:new RegExp(label)}).count())) throw Error(`Pintasan ruang ${label} hilang`);
  if(seen.some(x=>x.name==='admin_katalog_ruang'))throw Error('Katalog dimuat sebelum dipilih');
  await page.screenshot({path:join(output,'_qa-console-cashflow-ruang-20261104.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error('Ruang 360 meluber di ponsel');
  await page.setViewportSize({width:1440,height:900});
  await ruangSection.getByRole('link',{name:/Katalog/}).click();
  await page.waitForFunction(()=>location.pathname.endsWith('/katalog'));
  await page.waitForTimeout(1000);
  if(!seen.some(x=>x.name==='admin_kasus_tambah'&&x.p.p_ranah.includes('katalog')))throw Error('Aktivasi katalog tidak tercatat');
  await page.goto('http://127.0.0.1:4399/console/cashflow',{waitUntil:'domcontentloaded'});
  await page.getByText('Yang perlu ditinjau',{exact:true}).waitFor({timeout:15000});
  if(!(await page.getByText('Transaksi per hari, 30 hari terakhir',{exact:true}).count()))throw Error('Grafik ringkasan tidak tampil');
  const barisUbin=await page.locator('.ca-console-stat').evaluateAll(xs=>xs.slice(0,3).map(x=>x.getBoundingClientRect().top));
  if(barisUbin.length!==3||Math.max(...barisUbin)-Math.min(...barisUbin)>2)throw Error('Ubin ringkasan desktop tidak sejajar');
  await page.screenshot({path:join(output,'_qa-console-cashflow-ringkasan-20261104.png'),fullPage:true});
  if(errors.length)throw Error(`Galat browser: ${errors.join('; ')}`);
  console.log(JSON.stringify({rows1,offsetHal2:page2.p_offset,total:601,maskToggle:'lulus',mobileOverflow:overflow,pulihGalat:'lulus',lompatHalaman:'lulus',cariAuditTanpaURL:'lulus',semuaPintasan:'lulus',aktivasiPerangkat:'lulus',ruang360:'lulus',ringkasan:'lulus',errors}));
}finally{
  if(browser)try{const session=await browser.newBrowserCDPSession();await session.send('Browser.close')}catch{ /* Chrome sudah tertutup. */ }
  chrome.kill();await rm(dir,{recursive:true,force:true}).catch(()=>{});
}
