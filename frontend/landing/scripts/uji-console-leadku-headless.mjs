/** Full Nuxt + real gateway/SQL fixtures. Refuses every non-loopback target. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const base=process.env.LEADKU_QA_BASE, gateway=process.env.LEADKU_QA_GATEWAY;
for(const url of [base,gateway])assert.equal(new URL(url).hostname,'127.0.0.1','Only an isolated loopback stack is allowed');
const identity=JSON.parse(await readFile(process.env.LEADKU_QA_IDENTITY,'utf8'));
assert.equal(identity.email,'qa-leadku-console@example.invalid');
const output=process.env.LEADKU_QA_ARTIFACTS;assert.ok(output);await mkdir(output,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_CORE_PATH).href);
const free=createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));
const profile=await mkdtemp(join(tmpdir(),'leadku-console-qa-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--user-data-dir=${profile}`,`--remote-debugging-port=${port}`,'--no-first-run','--no-default-browser-check','--window-size=1440,1000','about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let browser;
const checks=[],errors=[];const check=(name,value=true)=>{assert.ok(value,name);checks.push(name);};
const json=async(path,token,method='GET',body)=>{
  const response=await fetch(gateway+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:response.status,value:await response.json()};
};
try{
  for(let i=0;i<100;i++){try{browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);break;}catch{await pause(100);}}
  assert.ok(browser);const ctx=browser.contexts()[0],p=ctx.pages()[0];
  const cdp=await ctx.newCDPSession(p);
  await cdp.send('Emulation.setTimezoneOverride',{timezoneId:'America/Los_Angeles'});
  await p.setViewportSize({width:1440,height:1000});p.on('pageerror',e=>errors.push(e.message));
  await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await p.goto(base+'/console/leadku',{waitUntil:'domcontentloaded'});await p.waitForURL(/\/console\/login/);
  check('route resolves and unauthenticated visitor reaches login');
  const login=async email=>{
    await p.locator('#email').fill(email);await p.locator('#password').fill(identity.password);
    const response=p.waitForResponse(r=>r.url()===gateway+'/admin/auth/login'&&r.request().method()==='POST');
    await p.locator('button[type=submit]').click();const result=await(await response).json();assert.ok(result.data?.access_token);
    await p.waitForURL(base+'/console/leadku');await p.getByRole('heading',{name:'Versi aplikasi',exact:true}).waitFor();return result.data.access_token;
  };
  const owner=await login(identity.email);
  check('authenticated owner opens LeadKu without a 404');
  check('LeadKu navigation is visible',await p.getByRole('link',{name:'LeadKu',exact:true}).isVisible());
  const play=p.getByRole('region',{name:'Instalasi Google Play',exact:true});
  const telemetry=p.getByRole('region',{name:'Telemetri aplikasi',exact:true});
  const funnel=p.getByRole('region',{name:'Funnel pengguna baru',exact:true});
  const setup=p.getByRole('region',{name:'Permintaan bantuan setup',exact:true});
  const tile=(region,label)=>region.locator('.ca-console-stat').filter({has:p.getByText(label,{exact:true})});
  const metric=async(region,label)=>await tile(region,label).locator('p').nth(1).innerText();
  const checkFunnel=async(channel)=>{
    const {data:summary}=(await json(`/admin/leadku/analytics?channel=${channel}`,owner)).value;
    const number=new Intl.NumberFormat('id-ID');
    check(`${channel} funnel shows only its channel's first opens and registration outcomes`,
      await metric(funnel,'Buka pertama')===number.format(summary.funnel.first_open)
        && await metric(funnel,'Mulai daftar')===number.format(summary.funnel.signup_started)
        && await metric(funnel,'Email terverifikasi')===number.format(summary.funnel.signup_completed)
        && !Object.hasOwn(summary,'setup_requests'));
    return summary;
  };
  check('production telemetry count rendered',await metric(telemetry,'ID instalasi tercatat')==='3');
  check('unavailable Play report has an empty state and no numeric tile',
    await play.getByText('Belum ada laporan instalasi Google Play.',{exact:true}).isVisible()
      && await tile(play,'Pemasangan perangkat baru').count()===0);
  await p.screenshot({path:join(output,'leadku-belum-ada-laporan.png')});
  const before=(await checkFunnel('production')).policy;
  const requestResponse=p.waitForResponse(r=>r.url().includes('/admin/leadku/setup-requests?channel=production'));
  await setup.getByRole('button',{name:'Lihat permintaan',exact:true}).click();
  const loaded=await requestResponse;
  assert.equal(loaded.status(),200);
  const setupList=(await loaded.json()).data;
  await setup.getByRole('button',{name:'Muat ulang permintaan',exact:true}).waitFor();
  check('owner can load the separate opt-in contact list',setupList.length
    ? await setup.getByText(setupList[0].contact,{exact:true}).first().isVisible()
      && await setup.getByRole('button',{name:'Salin kontak',exact:true}).count()===setupList.length
    : await setup.getByText('Belum ada permintaan bantuan setup.',{exact:true}).isVisible());
  await p.getByRole('tab',{name:'UAT',exact:true}).click();await p.getByRole('heading',{name:'Pembaruan versi · UAT',exact:true}).waitFor();
  check('UAT telemetry is isolated and has no Play region',await metric(telemetry,'ID instalasi tercatat')==='1'&&await play.count()===0);
  await checkFunnel('uat');
  check('switching channel clears the contact list',await setup.getByRole('button',{name:'Lihat permintaan',exact:true}).isVisible()
    && await setup.getByRole('button',{name:'Salin kontak',exact:true}).count()===0);
  const save=async()=>{
    const response=p.waitForResponse(r=>r.url().includes('/admin/leadku/mobile-policy')&&r.request().method()==='PUT');
    await p.getByRole('button',{name:'Simpan pengaturan',exact:true}).click();assert.equal((await response).status(),200);
  };
  await p.getByLabel('Versi terbaru',{exact:true}).fill('1.6.4');await p.getByLabel('Kode terbaru',{exact:true}).fill('15');await p.getByLabel('Kode minimum wajib',{exact:true}).fill('0');await p.getByLabel('Build UAT sudah tersedia',{exact:true}).check();await save();
  let policy=(await json('/public/leadku/mobile-policy?package=id.coreasia.leadku.qa.prod')).value.data.policy;
  check('optional update saved through the real BFF and SQL',policy.latest_code===15&&policy.minimum_code===0&&policy.available);
  await p.getByLabel('Kode minimum wajib',{exact:true}).fill('15');await save();policy=(await json('/public/leadku/mobile-policy?package=id.coreasia.leadku.qa.prod')).value.data.policy;
  check('mandatory minimum saved only on local UAT',policy.minimum_code===15);
  const old=(await json('/admin/leadku/analytics?channel=uat',owner)).value.data.policy;
  await p.getByLabel('Kode minimum wajib',{exact:true}).fill('0');await p.getByLabel('Build UAT sudah tersedia',{exact:true}).uncheck();await p.getByLabel('Kode terbaru',{exact:true}).fill('0');await p.getByLabel('Versi terbaru',{exact:true}).fill('');await p.getByLabel('Catatan rilis',{exact:true}).fill('');await save();
  check('stale editor cannot overwrite a newer policy',(await json('/admin/leadku/mobile-policy',owner,'PUT',{...old,expected_updated_at:old.updated_at})).status===409);
  policy=(await json('/public/leadku/mobile-policy?package=id.coreasia.leadku.qa.prod')).value.data.policy;check('draft policy is not advertised',policy.latest_code===0&&!policy.available&&policy.minimum_code===0);
  const after=(await json('/admin/leadku/analytics?channel=production',owner)).value.data.policy;check('production policy unchanged',JSON.stringify(before)===JSON.stringify(after));
  await p.getByRole('tab',{name:'Produksi',exact:true}).click();await play.waitFor();
  const importPlay=async(csv)=>{
    const response=p.waitForResponse(r=>r.url().includes('/admin/leadku/play-report')&&r.request().method()==='POST');
    await play.locator('input[type=file]').setInputFiles({name:'installs_id.coreasia.leadku_202611_overview.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
    assert.equal((await response).status(),200);
  };
  await importPlay('Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Current Device Installs\n2026-11-04,id.coreasia.leadku,0,0,0\n');
  await tile(play,'Pemasangan perangkat baru').getByText('0',{exact:true}).waitFor();
  check('reported zero is distinct from an unavailable device snapshot',await metric(play,'Masih terpasang')==='0'
    &&await metric(play,'Perangkat aktif')==='Belum tersedia'
    &&await play.getByText(/4 Nov 2026.*1 hari tercatat/).isVisible());
  await importPlay('Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Current Device Installs,Installs on active devices\n2026-11-04,id.coreasia.leadku,7,1,20,15\n2026-11-06,id.coreasia.leadku,4,0,23,18\n');
  await tile(play,'Pemasangan perangkat baru').getByText('11',{exact:true}).waitFor();
  check('reported totals are rendered separately from telemetry',await metric(play,'Uninstal perangkat')==='1'&&await metric(telemetry,'ID instalasi tercatat')==='3');
  check('period counts only reported dates without browser timezone shift',await play.getByText(/4 Nov 2026.*6 Nov 2026.*2 hari tercatat/).isVisible());
  check('device snapshots use the latest report date',await play.getByText('Per 6 Nov 2026',{exact:true}).isVisible()
    &&await metric(play,'Masih terpasang')==='23'&&await metric(play,'Perangkat aktif')==='18');
  await p.reload({waitUntil:'domcontentloaded'});
  await tile(play,'Pemasangan perangkat baru').getByText('11',{exact:true}).waitFor();
  check('imported Play figures persist after reload',await metric(telemetry,'ID instalasi tercatat')==='3');
  await p.screenshot({path:join(output,'leadku-desktop.png')});
  await p.setViewportSize({width:390,height:844});check('mobile page does not overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>document.documentElement.dataset.theme='dark');await p.screenshot({path:join(output,'leadku-mobile-dark.png'),fullPage:true});
  await p.setViewportSize({width:1440,height:1000});await ctx.clearCookies();await p.goto(base+'/console/login?ke=/console/leadku',{waitUntil:'domcontentloaded'});
  const requestsByViewer=[];
  const observeViewerRequest=request=>{if(request.url().includes('/admin/leadku/setup-requests'))requestsByViewer.push(request.url());};
  p.on('request',observeViewerRequest);
  const viewer=await login('qa-leadku-view@example.invalid');check('read-only admin can view both sources',await metric(telemetry,'ID instalasi tercatat')==='3'
    &&await metric(play,'Pemasangan perangkat baru')==='11');
  p.off('request',observeViewerRequest);
  check('read-only admin sees aggregated funnel without a contact request',await funnel.isVisible()
    && await setup.count()===0 && requestsByViewer.length===0);
  check('read-only admin cannot read opt-in contacts via API',(await json('/admin/leadku/setup-requests?channel=production',viewer)).status===403);
  check('read-only admin cannot import or sync Play data',await play.getByRole('button',{name:/Impor laporan|Sinkronkan/}).count()===0);
  check('read-only admin cannot see settings',await p.getByRole('button',{name:'Simpan pengaturan',exact:true}).count()===0);
  check('read-only admin cannot mutate settings via API',(await json('/admin/leadku/mobile-policy',viewer,'PUT',{...after,expected_updated_at:after.updated_at})).status===403);
  check('anonymous analytics denied',(await json('/admin/leadku/analytics?channel=production')).status===401);
  check('no JavaScript errors',errors.length===0);
  await writeFile(join(output,'result.json'),JSON.stringify({checks,count:checks.length,errors,backend:'Real local gateway and isolated Postgres; synthetic fixtures only'},null,2));console.log(`${checks.length} checks passed`);
}finally{
  if(browser)try{await(await browser.newBrowserCDPSession()).send('Browser.close');}catch{ /* The task-owned browser may already be closed. */ }
  if(chrome.exitCode===null)chrome.kill();await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
