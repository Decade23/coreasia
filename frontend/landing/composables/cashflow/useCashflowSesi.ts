/**
 * Sesi Supabase modul CashFlow, dibuatkan server dari cookie console.
 *
 * `sambung()` = POST /api/cashflow/sesi → setSession. Tidak ada kata sandi,
 * tidak ada TOTP: gerbangnya login console. `keluar()` = DELETE rute yang
 * sama (mencabut sesi tab ini di server) lalu signOut lokal — bukan global,
 * karena identitas konsol dipakai bersama semua tab dan admin.
 *
 * IZIN (Fase 1). Jawaban pencetakan membawa izin yang dicatat server untuk
 * sesi ini (admin_konsol_sesi.izin). Disimpan di sessionStorage BERSAMA sesi
 * Supabase-nya (umurnya sama) hanya sebagai PETUNJUK TAMPILAN — mis. palet
 * menawarkan cari server hanya bila ada cashflow:pii. Penegaknya Postgres;
 * izin yang keliru di sini hanya berarti tombol yang dijawab izin-kurang.
 * Tanpa catatan (sesi dicetak sebelum Fase 1), petunjuknya dihitung dari
 * peran + /me login console (mfa, mfa_at, totp_enabled_at) — rumus yang sama
 * dengan server (utils/rbac.ts).
 *
 * Kode sebab gagal mengikuti statusMessage rute server
 * (server/api/cashflow/sesi.post.ts) supaya halaman /masuk bisa menjelaskan
 * dengan kalimat manusia. Urutan pembacaannya: e.data.statusMessage (badan
 * JSON Nitro) → e.statusMessage (statusText; kosong di HTTP/2) → http-N → jaringan.
 */
import { batasIzinMfa, batasPerangkatTepercaya, izinSesiCashflow, type IzinCashflow } from '~/utils/rbac'
import { hapusStateMuatUlang } from '~/utils/konsol'
import { lupakanKasus } from './useCashflowKasus'

export type HasilSambung = { ok: true } | { ok: false; sebab: string }

/* Satu pencetakan untuk semua pemanggil. Halaman Ringkasan memanggil empat RPC
   sekaligus (Promise.all); kalau sesi kebetulan hilang, keempatnya meminta
   sesi pada saat yang sama. Tanpa ini, yang pertama mencetak dan tiga lainnya
   gagal — halaman menampilkan galat untuk sesi yang sebenarnya sedang dibuat.
   Promise yang sedang berjalan dibagikan; hanya berjalan di peramban. */
let pencetakanBerjalan: Promise<HasilSambung> | null = null

const KUNCI_IZIN = 'cf_izin'
interface HakSesi {
  izin: string[]
  tepercaya?: boolean
  bacaSampai: number | null
  mfaSampai: number | null
}
const izinDari = (nilai: unknown): string[] | null =>
  Array.isArray(nilai) ? nilai.filter((x): x is string => typeof x === 'string') : null
const tenggatDari = (nilai: unknown): number | null => {
  const waktu = typeof nilai === 'string' ? Date.parse(nilai) : Number.NaN
  return Number.isFinite(waktu) ? waktu : null
}
const angkaWaktu = (nilai: unknown): number | null => typeof nilai === 'number' && Number.isFinite(nilai) ? nilai : null
const bacaIzinTersimpan = (): HakSesi | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KUNCI_IZIN) ?? 'null')
    const izin = izinDari(Array.isArray(v) ? v : v?.izin)
    return izin ? {
      izin, tepercaya: typeof v.tepercaya === 'boolean' ? v.tepercaya : undefined,
      bacaSampai: angkaWaktu(v.bacaSampai), mfaSampai: angkaWaktu(v.mfaSampai),
    } : null
  } catch {
    return null
  }
}
const simpanIzin = (izin: HakSesi | null) => {
  try {
    if (izin) sessionStorage.setItem(KUNCI_IZIN, JSON.stringify(izin))
    else sessionStorage.removeItem(KUNCI_IZIN)
  } catch {
    // storage diblokir: petunjuk dihitung dari peran + mfa.
  }
}
let pengingatIzin: ReturnType<typeof setTimeout> | undefined
const JEDA_PERPANJANG_MS = 30_000

export const useCashflowSesi = () => {
  const { ambil, terkonfigurasi, url: supabaseUrl } = useCashflowSupabase()
  const sibuk = useState<boolean>('cf_sibuk_sesi', () => false)
  /** Email admin console yang sesinya dibuat — untuk tampilan; buktinya di server. */
  const pelaku = useState<string>('cf_pelaku', () => '')
  /** Izin sesi Supabase tab ini menurut server (petunjuk tampilan); null = belum diketahui. */
  const hak = useState<HakSesi | null>('cf_hak_sesi', () => (import.meta.client ? bacaIzinTersimpan() : null))
  const waktuIzin = useState('cf_waktu_izin', () => Date.now())
  const izin = computed(() => hak.value?.izin ?? null)
  const tepercaya = computed(() => hak.value?.tepercaya === true)
  const { user } = useAdminAuth()
  const jadwalkanIzin = (perpanjang = true) => {
    if (!import.meta.client) return
    clearTimeout(pengingatIzin)
    pengingatIzin = undefined
    const kini = Date.now()
    waktuIzin.value = kini
    const bacaSampai = hak.value?.bacaSampai
    const mfaSampai = hak.value?.mfaSampai ?? (hak.value?.tepercaya === undefined ? batasIzinMfa(user.value, kini) : null)
    const perpanjangPada = perpanjang && tepercaya.value && bacaSampai != null
      ? bacaSampai - JEDA_PERPANJANG_MS : null
    const berikut = [bacaSampai, mfaSampai, perpanjangPada]
      .filter((t): t is number => t != null && t > kini).sort((a, b) => a - b)[0]
    if (berikut) pengingatIzin = setTimeout(() => {
      const waktunya = berikut === perpanjangPada
      // Jadwalkan penutupan akses dulu. Bila koneksi gagal, data tetap
      // tersamar saat tenggat tercapai. Pemeriksaan berikutnya saat beraksi.
      jadwalkanIzin(perpanjang && !waktunya)
      if (waktunya && document.visibilityState === 'visible' && /^\/console\/cashflow(?:\/|$)/.test(location.pathname)) {
        void sambung()
      }
    }, berikut - kini)
  }
  if (import.meta.client && !pengingatIzin && hak.value) jadwalkanIzin()
  /** Petunjuk: apakah sesi CashFlow tab ini memegang izin itu. */
  const boleh = (i: IzinCashflow): boolean => {
    const kini = Math.max(waktuIzin.value, Date.now())
    const h = hak.value
    if (!h) return izinSesiCashflow(user.value?.role, user.value, kini).includes(i)
    if (!h.izin.includes(i)) return false
    if (i === 'cashflow:view') return true
    const batas = i === 'cashflow:pii' || i === 'cashflow:investigasi' ? h.bacaSampai : h.mfaSampai
    // Catatan versi lama hanya berisi daftar izin dari jalur TOTP.
    return (batas ?? (h.tepercaya === undefined ? batasIzinMfa(user.value, kini) : null) ?? 0) > kini
  }
  const perluSambung = (): boolean => {
    const h = hak.value
    if (!h?.izin.includes('cashflow:pii') && izinSesiCashflow(user.value?.role, user.value).includes('cashflow:pii')) return true
    if (h?.tepercaya) return h.bacaSampai !== null && h.bacaSampai <= Date.now()
    return batasPerangkatTepercaya(user.value) !== null
  }

  const cetak = async (): Promise<HasilSambung> => {
    const sb = await ambil()
    if (!sb) return { ok: false, sebab: 'konfigurasi' }
    sibuk.value = true
    try {
      // Token ikatan dokumen console wajib (server menolak tanpa itu, 403 'ikatan').
      const r = await $fetch<{
        access_token: string; refresh_token: string; pelaku?: string; izin?: unknown
        tepercaya?: boolean; izin_sampai?: string | null; izin_baca_sampai?: string | null
      }>(
        '/api/cashflow/sesi', { method: 'POST', headers: { 'X-CF-Sesi': '1', ...headerIkatan() } },
      )
      const { error } = await sb.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token })
      if (error) return { ok: false, sebab: 'sesi' }
      pelaku.value = r.pelaku ?? ''
      const diterima = izinDari(r.izin)
      hak.value = diterima ? {
        izin: diterima, tepercaya: r.tepercaya,
        bacaSampai: tenggatDari(r.izin_baca_sampai), mfaSampai: tenggatDari(r.izin_sampai),
      } : null
      simpanIzin(hak.value)
      jadwalkanIzin()
      return { ok: true }
    } catch (e: any) {
      pulihkanIkatan(e)
      const sebab: string = e?.data?.statusMessage || e?.statusMessage || (e?.status ? `http-${e.status}` : 'jaringan')
      return { ok: false, sebab }
    } finally {
      sibuk.value = false
    }
  }

  const sambung = (): Promise<HasilSambung> => {
    if (!pencetakanBerjalan) {
      pencetakanBerjalan = cetak().finally(() => { pencetakanBerjalan = null })
    }
    return pencetakanBerjalan
  }

  const siapkan = async (): Promise<HasilSambung> => {
    const sb = await ambil()
    if (!sb) return { ok: false, sebab: 'konfigurasi' }
    const { data } = await sb.auth.getSession()
    return data.session && !perluSambung() ? { ok: true } : sambung()
  }

  /* Jejak daftar pengguna milik admin yang keluar: alasan email lengkap,
     indeks tersamar, posisi daftar, dan saringannya. Logout → login console
     adalah navigasi SPA, jadi tanpa ini semuanya diwarisi admin berikutnya di
     tab yang sama. Dijalankan juga bila modul tidak terkonfigurasi. */
  const bersihkanJejak = () => {
    lupakanKasus()
    hak.value = null
    simpanIzin(null)
    jadwalkanIzin()
    useCashflowIndeks().kosongkan()
    useState<string>('cf_cari_pengguna', () => '').value = ''
    useState<string>('cf_cari_diterapkan_pengguna', () => '').value = ''
    useState<Record<string, string>>('cf_saring_kolom_pengguna', () => ({})).value = {}
    // Pengguna 360 (Fase 1): kepala T0, id sorotan, saringan kasus di /audit,
    // total riwayat akses, dan nominal saringan transaksi per subjek.
    useState<unknown>('cf_kepala', () => null).value = null
    useState<string | null>('cf_salin_sorot', () => null).value = null
    useState<string | null>('cf_audit_kasus', () => null).value = null
    useState<unknown>('cf_akses_total', () => null).value = null
    const keadaanNuxt = useNuxtApp().payload.state as Record<string, unknown>
    for (const k of Object.keys(keadaanNuxt)) {
      if (k.startsWith('$scf_tx_nominal_')) keadaanNuxt[k] = { min: '', maks: '' }
    }
    // Salinan payload.state yang mungkin ditulis build lama (reloadNuxtApp
    // persistState) — lihat plugins/muat-ulang-bersih.client.ts.
    hapusStateMuatUlang(() => sessionStorage)
  }

  const keluar = async () => {
    // Tunggu pembaruan yang sudah berjalan sebelum membuang token tab.
    // Dengan begitu respons yang terlambat tidak mengisi sessionStorage lagi.
    clearTimeout(pengingatIzin)
    pengingatIzin = undefined
    await pencetakanBerjalan?.catch(() => {})
    bersihkanJejak()
    const sb = await ambil()
    if (!sb) return
    try {
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        await $fetch('/api/cashflow/sesi', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          .catch(() => {})
      }
    } finally {
      await sb.auth.signOut({ scope: 'local' }).catch(() => {})
      pelaku.value = ''
    }
  }

  return { ambil, sibuk, pelaku, izin, tepercaya, boleh, perluSambung, terkonfigurasi, siapkan, sambung, keluar, supabaseUrl }
}
