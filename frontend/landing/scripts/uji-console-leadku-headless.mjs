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
  const metric=async label=>await p.locator('.ca-console-stat').filter({has:p.getByText(label,{exact:true})}).locator('p').nth(1).innerText();
  check('production fixture count rendered',await metric('Instalasi tercatat')==='3');
  check('unavailable Play report is not replaced with app telemetry',await p.getByText('Belum ada laporan instalasi Google Play.',{exact:true}).isVisible());
  const before=(await json('/admin/leadku/analytics?channel=production',owner)).value.data.policy;
  await p.getByRole('tab',{name:'UAT',exact:true}).click();await p.getByRole('heading',{name:'Pembaruan versi · UAT',exact:true}).waitFor();
  check('UAT fixture count is isolated',await metric('Instalasi tercatat')==='1');
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
  await p.getByRole('tab',{name:'Google Play',exact:true}).click();await p.getByRole('heading',{name:'Google Play',exact:true}).waitFor();
  await p.locator('input[type=file]').setInputFiles({name:'installs_id.coreasia.leadku_202611_overview.csv',mimeType:'text/csv',buffer:Buffer.from('Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Current Device Installs,Active Device Installs\n2026-11-04,id.coreasia.leadku,7,1,20,15\n2026-11-05,id.coreasia.leadku,4,0,23,18\n')});
  await p.getByText('Laporan Google Play tersimpan.',{exact:true}).waitFor();await p.getByText('Instalasi dari laporan',{exact:true}).waitFor();
  check('local CSV report is rendered separately',await metric('Instalasi dari laporan')==='11'&&await metric('Instalasi tercatat')==='3');
  await p.screenshot({path:join(output,'leadku-desktop.png'),fullPage:true});
  await p.setViewportSize({width:390,height:844});check('mobile page does not overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>document.documentElement.dataset.theme='dark');await p.screenshot({path:join(output,'leadku-mobile-dark.png'),fullPage:true});
  await p.setViewportSize({width:1440,height:1000});await ctx.clearCookies();await p.goto(base+'/console/login?ke=/console/leadku',{waitUntil:'domcontentloaded'});
  const viewer=await login('qa-leadku-view@example.invalid');check('read-only admin can view statistics',await metric('Instalasi tercatat')==='3');
  check('read-only admin cannot see settings',await p.getByRole('button',{name:'Simpan pengaturan',exact:true}).count()===0);
  check('read-only admin cannot mutate settings via API',(await json('/admin/leadku/mobile-policy',viewer,'PUT',{...after,expected_updated_at:after.updated_at})).status===403);
  check('anonymous analytics denied',(await json('/admin/leadku/analytics?channel=production')).status===401);
  check('no JavaScript errors',errors.length===0);
  await writeFile(join(output,'result.json'),JSON.stringify({checks,count:checks.length,errors,backend:'Real local gateway and isolated Postgres; synthetic fixtures only'},null,2));console.log(`${checks.length} checks passed`);
}finally{
  if(browser)try{await(await browser.newBrowserCDPSession()).send('Browser.close');}catch{ /* The task-owned browser may already be closed. */ }
  if(chrome.exitCode===null)chrome.kill();await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
