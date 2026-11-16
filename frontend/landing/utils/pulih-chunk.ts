/**
 * Pengaman klien: berkas build (/_nuxt/*.js, *.css) gagal dimuat.
 *
 * Kapan terjadi: tab masih memegang build lama sesudah rilis, atau peramban
 * terlanjur menyimpan jawaban 404 untuk berkas ber-hash (lihat
 * server/lib/aset/rute-vercel.ts). Gejalanya halaman tampil setengah jadi,
 * misalnya console tanpa menu, sampai pengguna memuat ulang paksa.
 *
 * Yang dilakukan, SEKALI:
 *  1. berkas yang gagal diminta ulang dengan `cache: 'reload'`. Itu melewati
 *     tembolok peramban dan menimpa isinya dengan jawaban terbaru. Memuat
 *     ulang halaman saja tidak cukup: alamat berkasnya sama, jadi peramban
 *     akan memakai lagi 404 yang ia simpan;
 *  2. dokumen dimuat ulang dengan parameter pembeda `_mc`.
 *
 * Penjaga supaya tidak pernah berputar:
 *  - dokumen yang datang membawa `_mc` adalah hasil pemulihan, dan dokumen
 *    itu tidak memuat ulang dirinya lagi apa pun yang gagal. Penjaga ini
 *    tidak bergantung pada penyimpanan peramban. Parameternya langsung
 *    dibuang dari alamat (sekali pakai), tandanya disimpan di memori dokumen;
 *  - catatan "waktu:jumlah" di sessionStorage membatasi tab yang sama selama
 *    JEDA_PULIH_CHUNK_MS, juga di dokumen baru.
 * Jadi setiap muat ulang otomatis selalu berakhir di dokumen yang tidak bisa
 * memuat ulang otomatis. Putaran berikutnya butuh tindakan pengguna.
 *
 * Kesempatan kedua, hanya dengan bukti. Percobaan pertama bisa terjadi
 * terlalu dini: server masih menjawab 404, jadi muat ulang pertama sia-sia.
 * Bila sesudah itu pengguna membuka atau memuat ulang halaman sendiri dan
 * berkasnya masih gagal dari tembolok, permintaan ulang tetap dikirim. Kalau
 * jawabannya kini berhasil (2xx), temboloknya sudah pulih dan dokumen dimuat
 * ulang satu kali lagi. Tanpa bukti itu tidak ada muat ulang kedua, dan
 * tidak pernah ada yang ketiga dalam jeda yang sama.
 *
 * Permintaan ulang berkas sendiri tidak dibatasi penjaga (paling banyak
 * sekali per alamat per dokumen): ia tidak memuat ulang apa pun, hanya
 * memperbaiki tembolok supaya muat ulang berikutnya oleh pengguna berhasil.
 *
 * Kenapa skrip sebaris di <head> dan bukan plugin Nuxt: kalau berkas utama
 * (entry) sendiri yang gagal, Nuxt tidak pernah hidup dan plugin tidak pernah
 * berjalan. Skrip ini mendengarkan dua sumber: peristiwa `error` pada elemen
 * <script>/<link> (berkas utama dan impor statisnya), dan `vite:preloadError`
 * (impor dinamis: layout, halaman, komponen). Peristiwa kedua itu juga yang
 * diteruskan Nuxt sebagai kait `app:chunkError` (experimental
 * emitRouteChunkError 'manual'); plugins/muat-ulang-bersih.client.ts
 * memanggil `window.__caPulihChunk` supaya tujuan muat ulangnya halaman yang
 * sedang dituju.
 *
 * Yang disimpan hanya cap waktu. Tidak ada state aplikasi yang disalin.
 * CSP console menghitung hash skrip sebaris dari HTML akhir
 * (server/plugins/konsol-csp.ts), jadi skrip ini lolos tanpa 'unsafe-inline'.
 *
 * Ditulis sebagai teks ES5 polos supaya isinya sama persis di semua build dan
 * bisa dijalankan apa adanya di uji (tests/public/pulih-chunk.test.ts).
 */

export const PARAM_PULIH_CHUNK = '_mc'
export const KUNCI_PULIH_CHUNK = 'ca:pulih-chunk'
export const JEDA_PULIH_CHUNK_MS = 10 * 60_000
/** Batas tunggu permintaan ulang berkas sebelum tetap memuat ulang. */
export const TUNGGU_PULIH_CHUNK_MS = 4000

/** Tanda tangan `window.__caPulihChunk`. Mengembalikan true bila pemulihan
 *  berjalan (pemanggil tidak perlu memuat ulang sendiri). */
export type PulihChunk = (urlGagal?: string | null, tujuan?: string | null) => boolean

export function skripPulihChunk(dirAset = '/_nuxt/'): string {
  return `(function(w){
var PARAM=${JSON.stringify(PARAM_PULIH_CHUNK)},KUNCI=${JSON.stringify(KUNCI_PULIH_CHUNK)},JEDA=${JEDA_PULIH_CHUNK_MS},TUNGGU=${TUNGGU_PULIH_CHUNK_MS},DIR=${JSON.stringify(dirAset)};
var lok=w.location,alamat;
try{alamat=new URL(lok.href)}catch(e){return}
var hasilPulih=alamat.searchParams.has(PARAM);
if(hasilPulih){alamat.searchParams.delete(PARAM);try{w.history.replaceState(w.history.state,'',alamat.pathname+alamat.search+alamat.hash)}catch(e){}}
var sedang=null,diminta={};
function catatan(){var s;try{s=String(w.sessionStorage.getItem(KUNCI)||'')}catch(e){s=''}var m=/^(\\d+):(\\d+)$/.exec(s);return m?{t:Number(m[1]),n:Number(m[2])}:{t:0,n:0}}
function tulis(t,n){try{w.sessionStorage.setItem(KUNCI,t+':'+n)}catch(e){}}
function milikBuild(u){try{var x=new URL(u,lok.href);return x.origin===lok.origin&&x.pathname.indexOf(DIR)===0?x.href:null}catch(e){return null}}
function gagalTercatat(){var hasil=[];try{var e=w.performance.getEntriesByType('resource');for(var i=0;i<e.length;i++){var u=e[i].responseStatus>=400?milikBuild(e[i].name):null;if(u&&hasil.indexOf(u)<0)hasil.push(u)}}catch(x){}return hasil}
function mintaUlang(daftar){
var janji=[];if(typeof w.fetch!=='function')return janji;
for(var i=0;i<daftar.length&&janji.length<20;i++){var x=daftar[i];if(diminta[x])continue;diminta[x]=1;
try{janji.push(w.fetch(x,{cache:'reload',credentials:'same-origin'}).then(function(r){return !!(r&&r.ok)},function(){return false}))}catch(e){}}
return janji}
function pulih(urlGagal,tujuan){
var daftar=gagalTercatat(),u=urlGagal?milikBuild(urlGagal):null;
if(u&&daftar.indexOf(u)<0)daftar.push(u);
var janji=mintaUlang(daftar);
if(sedang){if(tujuan)sedang.tujuan=tujuan;return true}
if(hasilPulih)return false;
var kini=Date.now(),c=catatan(),n=c.t&&Math.abs(kini-c.t)<JEDA?c.n:0;
if(n>=2||(n===1&&!janji.length))return false;
var ini=sedang={tujuan:tujuan||null},selesai=false;
function pergi(){
if(selesai)return;selesai=true;
var t;try{t=new URL(ini.tujuan||lok.href,lok.href)}catch(e){t=new URL(lok.href)}
if(t.origin!==lok.origin)t=new URL(lok.href);
t.searchParams.set(PARAM,kini.toString(36));
lok.replace(t.pathname+t.search+t.hash)}
function batal(){if(selesai)return;selesai=true;sedang=null}
if(n===0){tulis(kini,1);Promise.all(janji).then(pergi,pergi);w.setTimeout(pergi,TUNGGU)}
else{Promise.all(janji).then(function(h){if(selesai)return;if(h.indexOf(true)>=0){tulis(kini,2);pergi()}else batal()},batal);w.setTimeout(batal,TUNGGU)}
return true}
w.__caPulihChunk=pulih;
w.addEventListener('error',function(ev){
var el=ev&&ev.target;if(!el||el===w||!el.tagName)return;
var tag=String(el.tagName).toUpperCase(),src=tag==='SCRIPT'?el.src:tag==='LINK'?el.href:'';
if(src&&milikBuild(src))pulih(src)},true);
w.addEventListener('vite:preloadError',function(ev){
var p=ev&&ev.payload,m=/https?:\\/\\/[^\\s'"]+|\\/[^\\s'"]+\\.(?:m?js|css)/.exec(String(p&&p.message||p||''));
pulih(m?m[0]:null)});
})(window)`
}
