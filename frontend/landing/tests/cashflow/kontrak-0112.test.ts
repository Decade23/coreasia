/**
 * Kontrak DTO console ↔ RPC 0112 (admin_hapus_akun_daftar,
 * admin_hapus_akun_permanen, admin_hapus_akun_batalkan).
 *
 * Contoh jawaban di bawah bertipe DTO adapter (cashflowHapusAkun.ts), dan
 * pohon kuncinya dibandingkan dengan jsonb_build_object di definisi TERAKHIR
 * fungsinya di migrasi (tests/cashflow/migrasi.ts). Jawaban aksi dibandingkan
 * PER NILAI `status`: kunci yang diganti, ditambah, atau dibuang di salah satu
 * sisi membuat uji ini merah, bukan kartu yang kosong diam-diam.
 *
 * Yang juga dijaga karena console bergantung padanya: tanda tangan dan hak
 * fungsi, penjaga is_platform_admin() lalu izin, SETIAP kode galat yang bisa
 * dilempar beserta cara console membacanya, audit sebelum menulis (kolom
 * `oleh` di daftar dibaca dari audit itu), dan nilai hitungan server (tanda
 * 7 hari, batas, email tersamar) yang punya cadangan di console.
 *
 * Sebelum 0112 ada di folder migrasi, semuanya DILEWATI dan terlihat "skipped".
 * Semua id dan email di sini karangan.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DIR_MIGRASI, adaMigrasiNomor, fungsiTerakhir, parameterFungsi, pohonContoh, pohonDengan, pohonJsonb, semuaPohonJsonb,
  urutPohon, type PohonKunci,
} from './migrasi'
import {
  alasanBatalOtomatis, alasanHapusOtomatis, BATAS_BADGE_HAPUS, BATAS_DAFTAR_HAPUS, BATAS_HARI_MENUNGGU, HASIL_BERHASIL,
  HASIL_HAPUS, jenisGagalHapus, keHasilHapus, LEWAT_HAPUS, STATUS_HAPUS, STATUS_JAWAB,
  type HapusAkunDaftarDTO, type HapusAkunDTO, type HasilHapusDTO, type IsiHapusDTO,
} from '../../adapters/cashflowHapusAkun'
import { samarkanEmail } from '../../adapters/cashflow'
import { HINT_42501, petakanGalat, type JenisGalat } from '../../composables/cashflow/useCashflowAdmin'

const ID = '00000000-0000-4000-8000-0000000000a1'
const U = '00000000-0000-4000-8000-0000000000b1'
const W = '2026-10-14T05:00:00+00:00'

/* Angka karangan; yang diuji hanya kuncinya. */
const ISI: IsiHapusDTO = { buku_milik: 1, buku_anggota: 1, transaksi_milik: 340, transaksi_pindah: 5, foto: 12, tertahan: false }
const BARIS: Required<HapusAkunDTO> = {
  id: ID, user_id: U, email_samar: 'bud***@contoh.id', nama: null, lewat: 'aplikasi', status: 'menunggu',
  diminta_pada: W, umur_hari: 2, lewat_7_hari: false, selesai_pada: null, dibatalkan_pada: null, oleh: null,
  blokir: 'sql', blokir_pada: W, isi: ISI, tertahan: false, foto_menunggu: 0, foto_gagal: 0,
}
const DAFTAR: Required<HapusAkunDaftarDTO> = {
  status: 'menunggu', batas: 100, jumlah: { menunggu: 1, selesai: 0, dibatalkan: 0 }, baris: [BARIS],
}
/* Satu contoh per nilai `status` jawaban, persis kunci yang dipulangkan server. */
const SUDAH = {
  sudah_selesai: { status: 'sudah_selesai', permintaan: ID, user_id: U, selesai_pada: W },
  sudah_dibatalkan: { status: 'sudah_dibatalkan', permintaan: ID, user_id: U, dibatalkan_pada: W },
  tidak_ada: { status: 'tidak_ada', permintaan: ID },
} satisfies Record<string, HasilHapusDTO>
const JAWAB = {
  admin_hapus_akun_permanen: {
    selesai: { status: 'selesai', permintaan: ID, user_id: U, sudah_tiada: false, foto_antre: 12, ringkasan: { isi: ISI, inti: null } },
    ...SUDAH,
  },
  admin_hapus_akun_batalkan: {
    dibatalkan: { status: 'dibatalkan', permintaan: ID, user_id: U, buka_blokir: 'sql' },
    ...SUDAH,
  },
} satisfies Record<string, Record<string, HasilHapusDTO>>
const AKSI = ['admin_hapus_akun_permanen', 'admin_hapus_akun_batalkan'] as const
const RPC = ['admin_hapus_akun_daftar', ...AKSI] as const

/** Objek `jsonb_build_object('status', '<nilai>', …)` di badan, per nilai status. */
function jawabanPerStatus(badan: string): Record<string, PohonKunci> {
  const hasil: Record<string, PohonKunci> = {}
  for (const m of badan.matchAll(/jsonb_build_object\s*\(\s*'status'\s*,\s*'([a-z_]+)'/g)) {
    if (m[1]! in hasil) throw new Error(`status ${m[1]} dibangun dua kali`)
    hasil[m[1]!] = pohonJsonb(badan.slice(m.index))
  }
  return hasil
}
/** Setiap (errcode:hint) yang bisa dilempar badan fungsi, urut. */
const galatDi = (badan: string): string[] =>
  [...new Set([...badan.matchAll(/errcode\s*=\s*'([0-9A-Z]{5})'(?:\s*,\s*hint\s*=\s*'([a-z0-9-]+)')?/g)].map(m => `${m[1]}:${m[2] ?? ''}`))].sort()
const kutipan = (teks: string): string[] => [...teks.matchAll(/'([a-z_]+)'/g)].map(m => m[1]!)
const urut = (a: readonly string[]) => [...a].sort()

describe.skipIf(!adaMigrasiNomor('0112'))('kontrak 0112', () => {
  const isiServer = () => pohonJsonb(fungsiTerakhir('hapus_akun_hitung_inti').badan)

  it('tiga RPC didefinisikan terakhir di 0112, dengan tanda tangan yang dipanggil console', () => {
    for (const n of RPC) expect(fungsiTerakhir(n).berkas, n).toMatch(/^0112_/)
    expect(fungsiTerakhir('admin_hapus_akun_daftar').kepala)
      .toMatch(/\(p_status text default 'menunggu', p_batas integer default 100\)\s*returns jsonb\s+language plpgsql\s+stable\s+security definer\s+set search_path = public/i)
    for (const n of AKSI) {
      expect(fungsiTerakhir(n).kepala, n)
        .toMatch(/\(p_permintaan uuid, p_alasan text\)\s*returns jsonb\s+language plpgsql\s+volatile\s+security definer\s+set search_path = public/i)
    }
    expect(parameterFungsi('admin_hapus_akun_daftar')).toEqual([{ nama: 'p_status', bawaan: true }, { nama: 'p_batas', bawaan: true }])
    for (const n of AKSI) {
      expect(parameterFungsi(n), n).toEqual([{ nama: 'p_permintaan', bawaan: false }, { nama: 'p_alasan', bawaan: false }])
    }
  })

  it('hak: authenticated saja; fungsi hitungan privat', () => {
    const nama = readdirSync(DIR_MIGRASI).find(n => n.startsWith('0112_'))!
    const sql = readFileSync(join(DIR_MIGRASI, nama), 'utf8').replace(/--[^\n]*/g, '')
    for (const [n, tanda] of [['admin_hapus_akun_daftar', 'text, integer'], ['admin_hapus_akun_permanen', 'uuid, text'], ['admin_hapus_akun_batalkan', 'uuid, text']]) {
      expect(sql, n).toContain(`revoke all on function public.${n}(${tanda}) from public, anon, service_role;`)
      expect(sql, n).toContain(`grant execute on function public.${n}(${tanda}) to authenticated;`)
    }
    expect(sql).toContain('revoke all on function public.hapus_akun_hitung_inti(uuid, uuid[]) from public, anon, authenticated, service_role;')
    expect(sql).not.toMatch(/grant[^;]*\banon\b/i)
  })

  it('penjaga: is_platform_admin() lebih dulu, lalu izin (daftar view, aksi tindak)', () => {
    const izin = { admin_hapus_akun_daftar: 'view', admin_hapus_akun_permanen: 'tindak', admin_hapus_akun_batalkan: 'tindak' } as const
    for (const n of RPC) {
      const { badan } = fungsiTerakhir(n)
      const awal = badan.slice(badan.search(/\bbegin\b/))
      expect(awal, n).toMatch(new RegExp(
        `^begin\\s+if not public\\.is_platform_admin\\(\\) then\\s+raise exception 'Bukan admin platform\\.' using errcode = '42501';\\s+end if;\\s+`
        + `if not public\\.konsol_boleh\\('cashflow:${izin[n]}'\\) then\\s+raise exception '[^']+'\\s+using errcode = '42501', hint = 'izin-kurang';`))
    }
  })

  it('admin_hapus_akun_daftar: pohon kunci jawaban = HapusAkunDaftarDTO (isi = hapus_akun_hitung_inti)', () => {
    const { badan } = fungsiTerakhir('admin_hapus_akun_daftar')
    // isi baris: hitungan sekarang, atau ringkasan yang dibekukan hapus permanen (bentuk sama).
    expect(badan).toMatch(/'isi',\s+i\.isi,/)
    expect(badan).toMatch(/case when p\.status = 'selesai' then coalesce\(p\.ringkasan -> 'isi', '\{\}'::jsonb\)\s+else public\.hapus_akun_hitung_inti\(p\.user_id, p\.ruang_milik\) end as isi/)
    expect(fungsiTerakhir('admin_hapus_akun_permanen').badan).toMatch(/ringkasan = jsonb_build_object\('isi', v_isi, /)
    const server = pohonDengan(badan, 'baris', 'jumlah')
    const lengkap: PohonKunci = { ...server, baris: { ...server.baris, isi: isiServer() } }
    expect(urutPohon(pohonContoh(DAFTAR))).toEqual(urutPohon(lengkap))
    expect(Object.keys(server.jumlah ?? {}).sort()).toEqual(urut(STATUS_HAPUS))
  })

  it('jawaban aksi: pohon kunci per status = contoh HasilHapusDTO; setiap return memulangkan salah satunya', () => {
    for (const n of AKSI) {
      const { badan } = fungsiTerakhir(n)
      const server = jawabanPerStatus(badan)
      if (server.selesai) {
        expect(badan).toMatch(/v_isi := public\.hapus_akun_hitung_inti\(/)
        expect(badan).toMatch(/'ringkasan',\s+jsonb_build_object\('isi', v_isi, 'inti', v_hasil\)\)/)
        server.selesai = { ...server.selesai, ringkasan: { ...server.selesai.ringkasan, isi: isiServer() } }
      }
      const contoh = JAWAB[n] as Record<string, HasilHapusDTO>
      expect(Object.keys(server).sort(), n).toEqual(Object.keys(contoh).sort())
      for (const [st, c] of Object.entries(contoh)) expect(urutPohon(server[st]!), `${n}: ${st}`).toEqual(urutPohon(pohonContoh(c)))
      // Tidak ada objek ber-status lain (mis. status dari kolom) yang luput dari peta di atas.
      expect(semuaPohonJsonb(badan).filter(t => 'status' in t).length, n).toBe(Object.keys(server).length)
      const kembali = [...badan.matchAll(/\breturn\s+([^;]*);/g)].map(m => m[1]!)
      expect(kembali.length, n).toBe(Object.keys(server).length)
      for (const r of kembali) expect(r, n).toMatch(/^jsonb_build_object\s*\(\s*'status'\s*,\s*'[a-z_]+'/)
    }
  })

  it('setiap status jawaban dikenal console dan punya kalimatnya sendiri', () => {
    const semua = new Set(AKSI.flatMap(n => Object.keys(jawabanPerStatus(fungsiTerakhir(n).badan))))
    expect([...semua].sort()).toEqual(urut(STATUS_JAWAB))
    for (const n of AKSI) {
      for (const c of Object.values(JAWAB[n] as Record<string, HasilHapusDTO>)) {
        const h = keHasilHapus(c)
        expect(h, `${n}: ${c.status}`).not.toBe('lain')
        expect(HASIL_HAPUS as readonly string[]).toContain(h)
      }
    }
    // Yang benar-benar dikerjakan sekarang = toast sukses; "sudah_*"/"tidak_ada" = info.
    expect(keHasilHapus(JAWAB.admin_hapus_akun_permanen.selesai)).toBe('dihapus')
    expect(keHasilHapus({ ...JAWAB.admin_hapus_akun_permanen.selesai, sudah_tiada: true })).toBe('sudah_tiada')
    expect(keHasilHapus(JAWAB.admin_hapus_akun_batalkan.dibatalkan)).toBe('dibatalkan')
    for (const c of Object.values(SUDAH)) expect(HASIL_BERHASIL).not.toContain(keHasilHapus(c))
  })

  it('buka_blokir: nilai server = yang dibaca console (edge = blokir masuk belum pasti dibuka)', () => {
    const { badan } = fungsiTerakhir('admin_hapus_akun_batalkan')
    expect(urut(kutipan([...badan.matchAll(/v_buka := ('[a-z]+')/g)].map(m => m[1]).join(' ')))).toEqual(['edge', 'sql'])
    // null = v_buka tidak pernah diisi: hanya terjadi bila akunnya sudah tidak ada di auth.users.
    expect(badan).toMatch(/\bv_buka text;/)
    expect(badan).toMatch(/if exists \(select 1 from auth\.users u where u\.id = p\.user_id\) then\s+begin\s+update auth\.users set banned_until = p\.banned_until_lama where id = p\.user_id;\s+v_buka := 'sql';\s+exception when insufficient_privilege then\s+v_buka := 'edge';\s+end;\s+end if;/)
    expect(keHasilHapus({ ...JAWAB.admin_hapus_akun_batalkan.dibatalkan, buka_blokir: 'sql' })).toBe('dibatalkan')
    expect(keHasilHapus({ ...JAWAB.admin_hapus_akun_batalkan.dibatalkan, buka_blokir: 'edge' })).toBe('dibatalkan_tertunda')
    expect(keHasilHapus({ ...JAWAB.admin_hapus_akun_batalkan.dibatalkan, buka_blokir: null })).toBe('dibatalkan_tiada')
    expect(HASIL_BERHASIL).toContain('dibatalkan_tertunda')
    // Akun yang sudah tiada: permintaannya tetap dibatalkan, tapi kalimatnya info, bukan sukses.
    expect(HASIL_BERHASIL).not.toContain('dibatalkan_tiada')
  })

  it('setiap galat yang bisa dilempar punya jawaban console (tanpa galat baru yang luput)', () => {
    const DIHARAP: Record<string, string[]> = {
      admin_hapus_akun_daftar: ['22023:status', '42501:', '42501:izin-kurang'],
      admin_hapus_akun_permanen: ['22023:alasan', '42501:', '42501:izin-kurang', 'P0001:alihkan-kepemilikan'],
      admin_hapus_akun_batalkan: ['22023:alasan', '42501:', '42501:izin-kurang'],
    }
    for (const n of RPC) expect(galatDi(fungsiTerakhir(n).badan), n).toEqual(DIHARAP[n])
    const dariPenjaga = galatDi(fungsiTerakhir('is_platform_admin').badan)
    expect(dariPenjaga).toEqual(['42501:mfa-wajib', '42501:sesi-konsol'])

    const JAWAB_GALAT: Record<string, { jenis: JenisGalat; halaman: ReturnType<typeof jenisGagalHapus> }> = {
      '42501:': { jenis: 'bukan-admin', halaman: 'lain' },
      '42501:izin-kurang': { jenis: 'izin', halaman: 'izin' },
      '42501:mfa-wajib': { jenis: 'sesi', halaman: 'lain' },
      '42501:sesi-konsol': { jenis: 'sesi', halaman: 'lain' },
      '22023:status': { jenis: 'argumen', halaman: 'lain' },
      '22023:alasan': { jenis: 'argumen', halaman: 'lain' },
      'P0001:alihkan-kepemilikan': { jenis: 'lain', halaman: 'tertahan' },
    }
    for (const kh of [...new Set([...Object.values(DIHARAP).flat(), ...dariPenjaga])]) {
      const [code, hint] = kh.split(':') as [string, string]
      const g = petakanGalat({ code, hint, message: 'kalimat server' })
      expect(JAWAB_GALAT[kh], kh).toBeDefined()
      expect({ jenis: g.jenis, halaman: jenisGagalHapus(g) }, kh).toEqual(JAWAB_GALAT[kh])
    }
    for (const h of ['izin-kurang', 'mfa-wajib', 'sesi-konsol']) expect(HINT_42501[h], h).toBeDefined()
  })

  it('"fitur belum aktif" hanya untuk RPC-nya sendiri; fungsi yang dipanggil di dalamnya hilang = galat biasa', () => {
    /* Bukan dari badan: PostgREST v12 menjawab PGRST202 bila RPC belum ada,
       dan Postgres 42883 bila RPC hilang sesudah cache skema dimuat. 42883
       yang menyebut fungsi LAIN berarti 0112 terpasang tapi rusak: kalimat
       Postgres-nya harus terbaca, bukan disamarkan sebagai belum dipasang. */
    const petunjuk = 'No function matches the given name and argument types. You might need to add explicit type casts.'
    for (const n of RPC) {
      const tanda = parameterFungsi(n).map(p => p.nama)
      const pgrst = { code: 'PGRST202', hint: null, message: `Could not find the function public.${n}(${[...tanda].sort().join(', ')}) in the schema cache` }
      const basi = { code: '42883', hint: petunjuk, message: `function public.${n}(${tanda.map(t => `${t} => text`).join(', ')}) does not exist` }
      for (const g of [petakanGalat(pgrst, n), petakanGalat(basi, n)]) {
        expect({ jenis: g.jenis, halaman: jenisGagalHapus(g) }, n).toEqual({ jenis: 'belum-aktif', halaman: 'belum-aktif' })
      }
      // Setiap fungsi public yang dipanggil badan RPC ini (hitung_inti, ruang_dari_jalur, hapus_akun_inti, …).
      const dalam = [...new Set([...fungsiTerakhir(n).badan.matchAll(/\bpublic\.([a-z_0-9]+)\(/g)].map(m => m[1]!))]
        .filter(f => f !== n)
      expect(dalam.length, n).toBeGreaterThan(0)
      for (const f of dalam) {
        const g = petakanGalat({ code: '42883', hint: petunjuk, message: `function public.${f}(uuid) does not exist` }, n)
        expect({ jenis: g.jenis, halaman: jenisGagalHapus(g), pesan: g.message }, `${n} → ${f}`)
          .toEqual({ jenis: 'lain', halaman: 'lain', pesan: `function public.${f}(uuid) does not exist` })
      }
    }
    expect(fungsiTerakhir('admin_hapus_akun_permanen').badan).toMatch(/public\.hapus_akun_inti\(p\.user_id\)/)
  })

  it('22023 tidak terpicu console: status yang dikirim diterima server, alasan otomatis cukup panjang', () => {
    const { badan } = fungsiTerakhir('admin_hapus_akun_daftar')
    const diterima = kutipan(/v_status not in \(([^)]*)\)/.exec(badan)?.[1] ?? '')
    expect(urut(diterima)).toEqual(urut([...STATUS_HAPUS, 'semua']))
    for (const n of AKSI) {
      const min = Number(/length\(btrim\(p_alasan\)\) < (\d+)/.exec(fungsiTerakhir(n).badan)?.[1])
      expect(min, n).toBeGreaterThan(0)
      expect(alasanHapusOtomatis(ID).length).toBeGreaterThanOrEqual(min)
      expect(alasanBatalOtomatis(ID).length).toBeGreaterThanOrEqual(min)
    }
  })

  it('audit ditulis sebelum perubahan apa pun; kolom `oleh` daftar membaca audit yang sama', () => {
    const aksiAudit = { admin_hapus_akun_permanen: 'hapus_akun_permanen', admin_hapus_akun_batalkan: 'hapus_akun_batalkan' } as const
    for (const n of AKSI) {
      const { badan } = fungsiTerakhir(n)
      const audit = badan.search(new RegExp(
        `insert into public\\.admin_audit \\(admin_id, action, target_type, target_id, detail, reason\\)\\s+`
        + `values \\(auth\\.uid\\(\\), '${aksiAudit[n]}', 'user', p\\.user_id,\\s+jsonb_build_object\\('permintaan', p\\.id,`))
      expect(audit, n).toBeGreaterThan(0)
      expect(badan, n).toMatch(/btrim\(p_alasan\)\);/)
      const tulis = badan.search(/update public\.hapus_akun_permintaan|hapus_akun_inti\(|update auth\.users|insert into public\.hapus_foto_antrean/)
      expect(audit, n).toBeLessThan(tulis)
      // "sudah_*" dan "tidak_ada" pulang sebelum audit: tanpa jejak baru, console cukup memuat ulang.
      for (const st of Object.keys(SUDAH)) expect(badan.indexOf(`'status', '${st}'`), `${n}: ${st}`).toBeLessThan(audit)
    }
    const daftar = fungsiTerakhir('admin_hapus_akun_daftar').badan
    expect(urut(kutipan(/a\.action in \(([^)]*)\)/.exec(daftar)?.[1] ?? ''))).toEqual(urut(Object.values(aksiAudit)))
    expect(daftar).toMatch(/'oleh',\s+\(select a\.pelaku from public\.admin_audit a/)
    expect(daftar).toMatch(/a\.detail ->> 'permintaan' = p\.id::text/)
    expect(daftar).not.toMatch(/\b(insert\s+into|update\s+public\.|delete\s+from)\b/i)
  })

  it('daftar: nama hanya untuk sesi ber-pii; email dari samar_email, bentuknya sama dengan samarkanEmail', () => {
    const daftar = fungsiTerakhir('admin_hapus_akun_daftar').badan
    expect(daftar).toMatch(/v_pii := public\.konsol_boleh\('cashflow:pii'\);/)
    expect(daftar).toMatch(/'nama',\s+case when v_pii then/)
    expect(daftar).toMatch(/'email_samar',\s+p\.email_samar,/)
    expect(fungsiTerakhir('hapus_akun_saya').badan).toMatch(/values \(uid, public\.samar_email\(v_email\), v_lewat,/)
    const m = /least\((\d+), greatest\((\d+), length\(split_part\(p_email, '@', 1\)\) - (\d+)\)\)\)\s*\|\| '\*\*\*@' \|\| split_part\(p_email, '@', 2\)/
      .exec(fungsiTerakhir('samar_email').badan)
    expect(m).not.toBeNull()
    const [maks, minim, kurang] = [Number(m![1]), Number(m![2]), Number(m![3])]
    const server = (e: string) => {
      const [lokal = '', domain = ''] = e.split('@')
      return `${lokal.slice(0, Math.min(maks, Math.max(minim, lokal.length - kurang)))}***@${domain}`
    }
    for (const e of ['budiman@contoh.id', 'abc@contoh.id', 'ab@contoh.id', 'a@contoh.id', 'abcd@contoh.id']) {
      expect(samarkanEmail(server(e)), e).toBe(server(e))
      expect(samarkanEmail(e), e).toBe(server(e))
    }
  })

  it('daftar: tanda 7 hari, umur, dan batas server = cadangan console', () => {
    const { badan } = fungsiTerakhir('admin_hapus_akun_daftar')
    const hari = /'lewat_7_hari',\s+p\.status = 'menunggu' and p\.diminta_pada < now\(\) - interval '(\d+) days'/.exec(badan)?.[1]
    expect(Number(hari)).toBe(BATAS_HARI_MENUNGGU)
    expect(badan).toMatch(/'umur_hari',\s+floor\(extract\(epoch from \(coalesce\(p\.selesai_pada, p\.dibatalkan_pada, now\(\)\) - p\.diminta_pada\)\) \/ 86400\)::int/)
    const jepit = /greatest\((\d+), least\(coalesce\(p_batas, (\d+)\), (\d+)\)\)/.exec(badan)
    expect(jepit).not.toBeNull()
    expect(BATAS_DAFTAR_HAPUS).toBe(Number(jepit![2]))
    expect(BATAS_BADGE_HAPUS).toBe(Number(jepit![3]))
    // Foto gagal = bagian dari yang belum selesai (keadaanFoto mendahulukan gagal).
    expect(badan).toMatch(/'foto_gagal',\s+\(select count\(\*\) from public\.hapus_foto_antrean f\s+where f\.permintaan_id = p\.id and f\.selesai_pada is null and f\.coba > 0\)/)
  })

  it('nilai kolom permintaan = daftar nilai console (status, lewat)', () => {
    const nama = readdirSync(DIR_MIGRASI).find(n => n.startsWith('0112_'))!
    const sql = readFileSync(join(DIR_MIGRASI, nama), 'utf8')
    const cek = (c: string) => urut(kutipan(new RegExp(`constraint hapus_akun_permintaan_${c} check \\(\\w+ in \\(([^)]*)\\)\\)`).exec(sql)?.[1] ?? ''))
    expect(cek('status')).toEqual(urut(STATUS_HAPUS))
    expect(cek('lewat')).toEqual(urut(LEWAT_HAPUS))
  })
})
