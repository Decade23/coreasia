/**
 * IP klien dan pembatas jendela tetap untuk BFF console.
 *
 * IP klien dipakai untuk:
 *   - pembatas serah terima sesi (/api/admin/sesi) per IP;
 *   - log peristiwa BFF (h3.ts catat);
 *   - header X-Konsol-Klien-IP ke gateway (lib/konsol/proxy.ts): gateway
 *     mencatatnya di audit sebagai IP yang DILAPORKAN BFF, tidak untuk
 *     pembatas atau keputusan keamanan.
 * Login dan verifikasi TOTP tidak lewat BFF: peramban mengirimnya langsung ke
 * gateway, jadi pembatas & audit gateway melihat IP admin yang asli.
 *
 * Sumber IP:
 *   - di Vercel, `x-real-ip` dipasang Vercel sendiri (nilai kiriman klien
 *     ditimpa). Bila coreasia.id diproksikan Cloudflare, nilai itu IP edge
 *     Cloudflare; hanya bila peer-nya memang rentang Cloudflare,
 *     `cf-connecting-ip` (dipasang Cloudflare) dipakai. Permintaan yang
 *     langsung ke Vercel tanpa Cloudflare tidak bisa mengarang IP lewat
 *     `cf-connecting-ip`;
 *   - di luar Vercel (dev, node lokal) hanya alamat soket, header diabaikan.
 *
 * MURNI (node:net) supaya bisa diuji vitest.
 */
import { BlockList, isIP } from 'node:net'

/** Rentang proxy Cloudflare (cloudflare.com/ips-v4 dan ips-v6, dicek
 *  18 Sep 2026; sama dengan backend/gateway/internal/middleware/clientip.go).
 *  Daftar basi = edge baru dianggap klien: kunci jadi lebih kasar, tidak
 *  pernah menjadi nilai karangan klien. */
export const RENTANG_CLOUDFLARE = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
] as const

const cloudflare = new BlockList()
for (const cidr of RENTANG_CLOUDFLARE) {
  const [jaringan, prefiks] = cidr.split('/')
  cloudflare.addSubnet(jaringan!, Number(prefiks), isIP(jaringan!) === 6 ? 'ipv6' : 'ipv4')
}

/** IP yang sah dan dinormalkan (IPv4-mapped IPv6 → IPv4), selain itu null. */
export function ipSah(nilai: string | null | undefined): string | null {
  let v = (nilai ?? '').split(',')[0]!.trim()
  if (v.startsWith('[') && v.includes(']')) v = v.slice(1, v.indexOf(']'))
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(v)
  if (mapped) v = mapped[1]!
  return isIP(v) ? v : null
}

export function diCloudflare(ip: string): boolean {
  const jenis = isIP(ip)
  if (!jenis) return false
  return cloudflare.check(ip, jenis === 6 ? 'ipv6' : 'ipv4')
}

export interface BahanIp {
  diVercel: boolean
  xRealIp?: string | null
  xVercelForwardedFor?: string | null
  cfConnectingIp?: string | null
  alamatSoket?: string | null
}

export function ipKlien(b: BahanIp): string | null {
  if (!b.diVercel) return ipSah(b.alamatSoket)
  const peer = ipSah(b.xRealIp) ?? ipSah(b.xVercelForwardedFor)
  if (!peer) return null
  if (diCloudflare(peer)) return ipSah(b.cfConnectingIp) ?? peer
  return peer
}

/** Delapan hextet IPv6 (sudah divalidasi isIP). */
function hextet(ip: string): number[] {
  let s = ip.split('%')[0]!
  const v4 = /^(.*:)(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(s)
  if (v4) {
    const [a, b, c, d] = v4.slice(2).map(Number) as [number, number, number, number]
    s = `${v4[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const [kiri, kanan] = s.split('::') as [string, string | undefined]
  const a = kiri ? kiri.split(':') : []
  const b = kanan === undefined ? null : (kanan ? kanan.split(':') : [])
  const bagian = b === null ? a : [...a, ...Array(8 - a.length - b.length).fill('0'), ...b]
  return bagian.map((h) => Number.parseInt(h || '0', 16))
}

/** Kunci pembatas: IPv4 apa adanya, IPv6 per /64 (sama dengan gateway). */
export function kunciBatas(ip: string | null): string {
  if (!ip) return 'tak-dikenal'
  if (isIP(ip) !== 6) return ip
  return `${hextet(ip).slice(0, 4).map((h) => h.toString(16)).join(':')}::/64`
}

export type HasilBatas = { ok: true } | { ok: false; tungguDetik: number }

/**
 * Jendela tetap per kunci, dihitung untuk SETIAP permintaan (berhasil atau
 * gagal). Per instans fungsi (memori): hanya menaikkan ongkos banjir, bukan
 * batas global. Peta dibatasi ukurannya supaya banjir kunci acak tidak
 * menghabiskan memori instans.
 */
export class PembatasJendela {
  private readonly isi = new Map<string, { hitung: number; habisPada: number }>()

  constructor(
    readonly batas: number,
    readonly jendelaMs: number,
    private readonly maksEntri = 10_000,
  ) {}

  periksa(kunci: string, sekarang: number): HasilBatas {
    const ada = this.isi.get(kunci)
    if (!ada || sekarang >= ada.habisPada) {
      this.bersihkan(sekarang)
      this.isi.set(kunci, { hitung: 1, habisPada: sekarang + this.jendelaMs })
      return { ok: true }
    }
    if (ada.hitung >= this.batas) {
      return { ok: false, tungguDetik: Math.max(1, Math.ceil((ada.habisPada - sekarang) / 1000)) }
    }
    ada.hitung++
    return { ok: true }
  }

  get ukuran(): number {
    return this.isi.size
  }

  private bersihkan(sekarang: number) {
    if (this.isi.size < this.maksEntri) return
    for (const [k, v] of this.isi) if (sekarang >= v.habisPada) this.isi.delete(k)
    // Masih penuh (banjir kunci yang semuanya aktif): buang yang tertua.
    while (this.isi.size >= this.maksEntri) {
      const tertua = this.isi.keys().next().value
      if (tertua === undefined) break
      this.isi.delete(tertua)
    }
  }
}
