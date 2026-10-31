// Logika status tanpa I/O, supaya bisa diuji dengan node --test.

export const GAGAL_BERUNTUN = 2 // 2 putaran x 5 menit sebelum dinyatakan mati
// Pulih juga butuh 2 putaran sehat beruntun. Dengan ambang 1, target yang
// berkedip (gagal, gagal, sehat) mengirim sepasang email tiap 15 menit.
export const SEHAT_BERUNTUN = 2
export const INGATKAN_SETIAP_MS = 6 * 60 * 60 * 1000
// Galat baca R2 belum tentu cadangannya basi, jadi butuh 2 putaran jam-an.
export const AMBANG_GALAT_R2 = 2

// Penahan goyang: target yang berganti status >= 4 kali dalam 2 jam kabarnya
// ditahan sampai 2 jam tanpa perubahan, supaya satu target tidak menghabiskan
// kuota Resend (paket gratis 100 email/hari).
export const JENDELA_GOYANG_MS = 2 * 60 * 60 * 1000
export const TRANSISI_GOYANG = 4

// Laporan harian dikirim di putaran pertama sejak 00:00 UTC (07:00 WIB), dan
// dicoba lagi tiap putaran sampai 02:00 UTC bila gagal. Jendela ini menjaga jam
// kirimnya tidak bergeser setelah laporan "Aktif" yang terkirim di jam sembarang.
export const JENDELA_LAPORAN_JAM = 2

// Apakah satu respons memenuhi harapan target.
export function cocok(target, status, badan) {
  const kodeOk = target.harap === 'bukan5xx' ? status > 0 && status < 500 : status === target.harap
  if (!kodeOk) return false
  if (target.jsonStatus) {
    try { if (JSON.parse(badan).status !== target.jsonStatus) return false }
    catch { return false }
  }
  if (target.isi && !(badan || '').includes(target.isi)) return false
  return true
}

function tanpa(obj, ...kunci) {
  for (const k of kunci) delete obj[k]
  return obj
}

// Buang kunci target atau seri yang sudah dihapus dari daftar, supaya tidak
// terhitung "sedang mati" selamanya. _meta milik Jaga sendiri, selalu disimpan.
export function pangkas(keadaan, idSah) {
  return Object.fromEntries(Object.entries(keadaan).filter(([id]) => id === '_meta' || idSah.has(id)))
}

// hasil: [{ id, nama, ok, alasan, penyedia, ambang?, ambangPulih? }]
// keadaan: { [id]: { naik, gagal, sejak, alasan, diingatkan, sejakGagal, sehat,
//            sejakSehat, transisi: [iso], goyang }, _meta }
// Mengembalikan keadaan baru dan daftar kabar yang perlu dikirim.
export function nilai(keadaan, hasil, sekarangMs) {
  const baru = { ...keadaan }
  const kabar = { mati: [], pulih: [], ingat: [], goyang: [], stabil: [] }
  const iso = new Date(sekarangMs).toISOString()

  for (const h of hasil) {
    const lama = keadaan[h.id] || { naik: true, gagal: 0, sejak: iso }
    let k = lama
    let ganti = null // 'mati' atau 'pulih' bila status resmi berubah di putaran ini
    let lamaMs = 0

    if (lama.naik && h.ok) {
      if (lama.gagal) k = tanpa({ ...lama, gagal: 0 }, 'sejakGagal')
    } else if (lama.naik) {
      const gagal = (lama.gagal || 0) + 1
      // Waktu mulai mati dihitung dari kegagalan pertama, bukan saat alarm berbunyi.
      const sejakGagal = lama.gagal ? lama.sejakGagal || iso : iso
      if (gagal >= (h.ambang ?? GAGAL_BERUNTUN)) {
        k = { naik: false, gagal, sejak: sejakGagal, alasan: h.alasan, diingatkan: iso }
        ganti = 'mati'
      } else {
        k = { ...lama, gagal, sejakGagal }
      }
    } else if (h.ok) {
      const sehat = (lama.sehat || 0) + 1
      // Lama mati dihitung sampai putaran sehat pertama, bukan saat kabar pulih dikirim.
      const sejakSehat = lama.sehat ? lama.sejakSehat || iso : iso
      if (sehat >= (h.ambangPulih ?? SEHAT_BERUNTUN)) {
        k = { naik: true, gagal: 0, sejak: sejakSehat }
        ganti = 'pulih'
        lamaMs = Date.parse(sejakSehat) - Date.parse(lama.sejak)
      } else {
        k = { ...lama, sehat, sejakSehat }
      }
    } else {
      if (lama.sehat) k = tanpa({ ...lama }, 'sehat', 'sejakSehat')
      const terakhir = Date.parse(lama.diingatkan || lama.sejak)
      if (!lama.goyang && sekarangMs - terakhir >= INGATKAN_SETIAP_MS) {
        kabar.ingat.push({ ...h, lamaMs: sekarangMs - Date.parse(lama.sejak) })
        k = { ...k, alasan: h.alasan, diingatkan: iso }
      }
    }

    // Penahan goyang. Yang dihitung hanya perubahan status resmi (MATI/PULIH).
    const transisi = (lama.transisi || []).filter((t) => sekarangMs - Date.parse(t) < JENDELA_GOYANG_MS)
    if (ganti) transisi.push(iso)
    let goyang = Boolean(lama.goyang)
    if (ganti && !goyang && transisi.length >= TRANSISI_GOYANG) {
      goyang = true
      kabar.goyang.push({ ...h, kali: transisi.length })
    } else if (goyang && !transisi.length) {
      // 2 jam tanpa perubahan: kirim status terakhirnya sekali.
      goyang = false
      kabar.stabil.push({ ...h, naik: k.naik, alasan: k.alasan || h.alasan, lamaMs: sekarangMs - Date.parse(k.sejak) })
      if (!k.naik) k = { ...k, diingatkan: iso }
    } else if (ganti && !goyang) {
      kabar[ganti].push(ganti === 'pulih' ? { ...h, lamaMs } : h)
    }

    k = { ...k }
    if (transisi.length) k.transisi = transisi
    else delete k.transisi
    if (goyang) k.goyang = true
    else delete k.goyang
    baru[h.id] = k
  }
  return { keadaan: baru, ...kabar }
}

// Status cadangan: objek terbaru per seri -> hasil seragam dengan target HTTP.
// terbaru: Date | null. Cadangan diperiksa per jam, jadi mati dan pulih cukup sekali.
export function nilaiCadangan(seri, terbaru, sekarangMs) {
  if (belumMulai(seri, sekarangMs)) return null
  const dasar = { id: seri.id, nama: seri.nama, ambang: 1, ambangPulih: 1 }
  if (!terbaru) return { ...dasar, ok: false, alasan: 'belum ada satu pun cadangan di R2' }
  const umurJam = (sekarangMs - terbaru.getTime()) / 3_600_000
  if (umurJam > seri.maksJam) {
    return { ...dasar, ok: false, alasan: `cadangan terbaru berumur ${Math.floor(umurJam)} jam (batas ${seri.maksJam} jam)` }
  }
  return { ...dasar, ok: true, alasan: '' }
}

export function galatCadangan(seri, pesan) {
  return { id: seri.id, nama: seri.nama, ok: false, alasan: `gagal membaca R2: ${pesan}`, ambang: AMBANG_GALAT_R2, ambangPulih: 1, galatBaca: true }
}

export function belumMulai(seri, sekarangMs) {
  return Boolean(seri.mulai) && sekarangMs < Date.parse(seri.mulai)
}

// 'aktif' bila belum pernah ada laporan, 'harian' bila sudah waktunya, selain itu null.
// Laporan harian dicatat terpisah (meta.harian) dari laporan apa pun (meta.laporan):
// dulu email Aktif yang terkirim siang hari ikut menunda laporan pagi esoknya.
export function jenisLaporan(meta, sekarangMs) {
  if (Number.isNaN(Date.parse(meta?.laporan))) return 'aktif'
  const kini = new Date(sekarangMs)
  if (kini.getUTCHours() >= JENDELA_LAPORAN_JAM) return null
  const awalHari = Date.UTC(kini.getUTCFullYear(), kini.getUTCMonth(), kini.getUTCDate())
  const harian = Date.parse(meta?.harian)
  return Number.isNaN(harian) || harian < awalHari ? 'harian' : null
}

// Waktu yang dicatat setelah laporan terkirim. Email Aktif di jendela pagi
// sekaligus dihitung sebagai laporan hari itu supaya tidak ada dua email.
export function catatLaporan(meta, jenis, sekarangMs) {
  const iso = new Date(sekarangMs).toISOString()
  const pagi = new Date(sekarangMs).getUTCHours() < JENDELA_LAPORAN_JAM
  return { ...meta, laporan: iso, ...(jenis === 'harian' || pagi ? { harian: iso } : {}) }
}

export function durasi(ms) {
  const menit = Math.max(1, Math.round(ms / 60000))
  if (menit < 60) return `${menit} menit`
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  if (jam < 48) return sisa ? `${jam} jam ${sisa} menit` : `${jam} jam`
  return `${Math.floor(jam / 24)} hari ${jam % 24} jam`
}

function wib(ms) {
  return new Date(ms + 7 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ') + ' WIB'
}

function jumlahMati(keadaan) {
  return Object.entries(keadaan).filter(([id, v]) => id !== '_meta' && v?.naik === false).length
}

function petunjukIdcloudhost(daftar) {
  if (daftar.filter((m) => m.penyedia === 'idcloudhost').length < 2) return null
  return 'Beberapa layanan di IDCloudHost mati bersamaan. Biasanya ini karena deposit habis, coba cek saldo di https://my.idcloudhost.com lalu nyalakan VM yang masih Stopped.'
}

// Satu email per putaran berisi semua perubahan.
export function susunEmail({ mati, pulih, ingat, goyang = [], stabil = [] }, sekarangMs, keadaan) {
  if (!mati.length && !pulih.length && !ingat.length && !goyang.length && !stabil.length) return null
  const bagian = []
  const judul = []
  const nama = (d) => d.map((m) => m.nama).join(', ')
  if (mati.length) {
    judul.push(`MATI: ${nama(mati)}`)
    bagian.push('Tidak menjawab sejak beberapa menit lalu:\n' + mati.map((m) => `- ${m.nama}: ${m.alasan}`).join('\n'))
    const petunjuk = petunjukIdcloudhost(mati)
    if (petunjuk) bagian.push(petunjuk)
  }
  if (ingat.length) {
    judul.push(`MASIH MATI: ${nama(ingat)}`)
    bagian.push('Masih belum pulih:\n' + ingat.map((m) => `- ${m.nama}, sudah ${durasi(m.lamaMs)}: ${m.alasan}`).join('\n'))
  }
  if (pulih.length) {
    judul.push(`PULIH: ${nama(pulih)}`)
    bagian.push('Sudah normal lagi:\n' + pulih.map((m) => `- ${m.nama}, tadi mati ${durasi(m.lamaMs)}`).join('\n'))
  }
  if (goyang.length) {
    judul.push(`NAIK-TURUN: ${nama(goyang)}`)
    bagian.push(
      goyang
        .map((m) => `${m.nama} naik-turun berulang (${m.kali} kali berganti status dalam 2 jam terakhir), kabarnya ditahan sampai stabil 2 jam.`)
        .join('\n'),
    )
  }
  if (stabil.length) {
    const normal = stabil.filter((s) => s.naik)
    const masih = stabil.filter((s) => !s.naik)
    if (normal.length) judul.push(`STABIL: ${nama(normal)}`)
    if (masih.length) judul.push(`MASIH MATI: ${nama(masih)}`)
    bagian.push(
      'Sudah 2 jam tidak naik-turun lagi. Keadaannya sekarang:\n' +
        stabil.map((s) => (s.naik ? `- ${s.nama}: normal` : `- ${s.nama}: mati, sudah ${durasi(s.lamaMs)}: ${s.alasan}`)).join('\n'),
    )
  }
  bagian.push(`Dicek ${wib(sekarangMs)}. Yang sedang mati saat ini: ${jumlahMati(keadaan)}.`)
  return { subjek: `[Jaga] ${judul.join(' | ')}`, teks: bagian.join('\n\n') }
}

// Dipakai saat keadaan di KV tidak terbaca: tanpa riwayat, semua yang gagal di
// dua percobaan putaran ini dikabarkan langsung.
export function susunEmailDarurat(gagal, galatKv, sekarangMs) {
  const bagian = [
    'Jaga tidak bisa membaca catatan keadaannya di Cloudflare KV, jadi kabar ini dikirim langsung tanpa menunggu putaran berikutnya. Yang gagal di dua percobaan putaran ini:\n' +
      gagal.map((m) => `- ${m.nama}: ${m.alasan}`).join('\n'),
  ]
  const petunjuk = petunjukIdcloudhost(gagal)
  if (petunjuk) bagian.push(petunjuk)
  bagian.push(
    `Selama KV belum terbaca, Jaga tidak tahu mana yang baru mati dan mana yang sudah pernah dikabarkan, jadi email seperti ini bisa datang tiap 5 menit. Galat KV: ${galatKv}.`,
  )
  bagian.push(`Dicek ${wib(sekarangMs)}.`)
  return { subjek: `[Jaga] GAGAL, keadaan KV tidak terbaca: ${gagal.map((m) => m.nama).join(', ')}`, teks: bagian.join('\n\n') }
}

// infoCadangan: [{ seri, terbaru?: Date | null, galat?: string, belumMulai?: true }]
function barisCadangan(i, sekarangMs) {
  const { seri } = i
  if (i.belumMulai) return `- ${seri.nama}: belum diperiksa sampai ${wib(Date.parse(seri.mulai))}`
  if (i.galat) return `- ${seri.nama}: R2 tidak bisa dibaca saat ini (${i.galat})`
  if (!i.terbaru) return `- ${seri.nama}: belum ada satu pun cadangan`
  const umurMs = sekarangMs - i.terbaru.getTime()
  const lewat = umurMs > seri.maksJam * 3_600_000 ? `, melewati batas ${seri.maksJam} jam` : ''
  return `- ${seri.nama}: ${durasi(umurMs)} lalu${lewat}`
}

// Laporan harian sekaligus tanda hidup. jenis: 'aktif' (pertama setelah deploy) atau 'harian'.
// kini: { gagal: hasil putaran ini yang gagal, galat: galat internal Jaga putaran ini }.
export function susunLaporan(jenis, keadaan, target, infoCadangan, sekarangMs, kini = {}) {
  const idTarget = new Set(target.map((t) => t.id))
  const sehat = target.filter((t) => keadaan[t.id]?.naik !== false).length
  const namaDari = new Map([...target, ...(infoCadangan || []).map((i) => i.seri)].map((x) => [x.id, x.nama]))
  const entri = Object.entries(keadaan).filter(([id]) => id !== '_meta')
  const mati = entri.filter(([, v]) => v?.naik === false)
  const goyang = entri.filter(([, v]) => v?.goyang)
  // Cadangan disebut terpisah supaya "14 dari 14 sehat" tidak menutupi cadangan yang bermasalah.
  const cadanganMati = mati.filter(([id]) => !idTarget.has(id)).length
  const ringkas = `${sehat} dari ${target.length} layanan sehat${cadanganMati ? `, ${cadanganMati} cadangan bermasalah` : ''}`

  const bagian = [
    jenis === 'aktif'
      ? 'Jaga Layanan baru saja aktif dan ini putaran pertamanya. Setelah ini laporan seperti ini datang tiap pagi sekitar pukul 07.00 WIB.'
      : 'Laporan pagi dari Jaga Layanan.',
  ]
  bagian.push(
    mati.length
      ? `${ringkas}. Yang sedang mati:\n` +
          mati.map(([id, v]) => `- ${namaDari.get(id) || id}, sudah ${durasi(sekarangMs - Date.parse(v.sejak))}: ${v.alasan}`).join('\n')
      : `${ringkas}. Tidak ada yang sedang mati.`,
  )
  if (goyang.length) {
    bagian.push(`Sedang naik-turun, kabarnya ditahan sampai stabil 2 jam: ${goyang.map(([id]) => namaDari.get(id) || id).join(', ')}.`)
  }
  // Yang gagal di putaran ini tapi belum resmi mati (butuh 2 putaran) tetap disebut,
  // supaya laporan tidak berbunyi "semua sehat" saat sesuatu baru saja tumbang.
  const baruGagal = (kini.gagal || []).filter((h) => keadaan[h.id]?.naik !== false)
  if (baruGagal.length) {
    bagian.push('Gagal di pemeriksaan barusan, belum dinyatakan mati:\n' + baruGagal.map((h) => `- ${h.nama}: ${h.alasan}`).join('\n'))
  }
  if (infoCadangan?.length) {
    bagian.push('Cadangan DB terbaru:\n' + infoCadangan.map((i) => barisCadangan(i, sekarangMs)).join('\n'))
  }
  if (kini.galat?.length) {
    bagian.push('Catatan dari Jaga sendiri (bisa membuat kabar terlambat atau terulang):\n' + kini.galat.map((g) => `- ${g}`).join('\n'))
  }
  bagian.push(
    'Email ini juga tanda bahwa Jaga masih hidup. Kalau suatu pagi email harian ini tidak datang, berarti Jaga sendiri yang bermasalah. Cek Worker jaga-layanan di dashboard Cloudflare.',
  )
  bagian.push(`Dicek ${wib(sekarangMs)}.`)
  const awalan = jenis === 'aktif' ? '[Jaga] Aktif' : '[Jaga] Laporan harian'
  return { subjek: `${awalan}: ${ringkas}`, teks: bagian.join('\n\n') }
}
