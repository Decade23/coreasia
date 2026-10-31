// Daftar yang dijaga. `harap` berupa kode HTTP persis, atau 'bukan5xx' untuk
// endpoint yang memang tidak punya halaman (cukup terbukti origin menjawab).
// `isi` opsional: potongan teks yang wajib ada di badan respons.
// `penyedia` dipakai untuk petunjuk di email saat beberapa server mati bersamaan.
// `rahasia` opsional: nama secret Worker yang dikirim sebagai `Authorization: Bearer`.
export const TARGET = [
  { id: 'leadku-web', nama: 'LeadKu (halaman)', url: 'https://leadku.coreasia.id/', harap: 200, penyedia: 'idcloudhost' },
  { id: 'leadku-bff', nama: 'LeadKu (login/BFF + gateway)', url: 'https://leadku.coreasia.id/bff/health', harap: 200, isi: '"status":"ok"', penyedia: 'idcloudhost' },
  { id: 'coreasia-api', nama: 'api.coreasia.id (lisensi CAD + console)', url: 'https://api.coreasia.id/readyz', harap: 200, isi: '"status":"ok"', penyedia: 'idcloudhost' },
  { id: 'pantau', nama: 'Pantau', url: 'https://pantau.coreasia.id/api/health', harap: 200, isi: 'healthy', penyedia: 'idcloudhost' },
  { id: 'tools-api', nama: 'API ebook (api.tools.coreasia.id)', url: 'https://api.tools.coreasia.id/readyz', harap: 200, penyedia: 'idcloudhost' },
  { id: 'tools-pay', nama: 'Webhook pembayaran (pay.coreasia.id)', url: 'https://pay.coreasia.id/', harap: 'bukan5xx', penyedia: 'idcloudhost' },
  { id: 'grafana', nama: 'Grafana', url: 'https://grafana.coreasia.id/api/health', harap: 200, penyedia: 'idcloudhost' },
  { id: 'otlp', nama: 'Penerima telemetri (otlp.coreasia.id)', url: 'https://otlp.coreasia.id/', harap: 'bukan5xx', penyedia: 'idcloudhost' },
  { id: 'primesotech-web', nama: 'primesotech.id', url: 'https://primesotech.id/', harap: 200, penyedia: 'idcloudhost' },
  { id: 'primesotech-api', nama: 'API primesotech', url: 'https://api.primesotech.id/health', harap: 200, isi: '"connected"', penyedia: 'idcloudhost' },
  { id: 'coreasia-landing', nama: 'coreasia.id', url: 'https://coreasia.id/', harap: 200, penyedia: 'vercel' },
  { id: 'afra-web', nama: 'afratraining.com', url: 'https://afratraining.com/', harap: 200 },
  { id: 'afra-api', nama: 'API Afra Training', url: 'https://api.afratraining.com/health', harap: 200, isi: '"connected"' },
  { id: 'garasiasia', nama: 'garasiasia.com', url: 'https://garasiasia.com/', harap: 200, penyedia: 'vercel' },
  // Sapa di VPS primesotech. Status WhatsApp hanya ok bila semua nomor tertaut yang
  // diharapkan tersambung (logout, diganti perangkat lain, atau putus >10 menit = MATI).
  { id: 'sapa-web', nama: 'Sapa (sapa.coreasia.id)', url: 'https://sapa.coreasia.id/login', harap: 200, penyedia: 'idcloudhost' },
  { id: 'sapa-whatsapp', nama: 'Sapa: koneksi WhatsApp 3395', url: 'https://sapa.coreasia.id/api/v1/health/whatsapp', harap: 200, isi: '"status":"ok"', rahasia: 'SAPA_MONITOR_TOKEN' },
]

// Cadangan DB di bucket coreasia-backup. Dianggap basi bila objek terbaru
// lebih tua dari `maksJam`. `mulai`: sebelum tanggal ini seri belum diperiksa
// (dipakai saat seri baru dipasang supaya tidak langsung berbunyi).
export const CADANGAN = [
  { id: 'cadangan-cad', nama: 'Cadangan DB lisensi CAD', prefix: 'coreasia-cad/coreasia-cad-db-', maksJam: 27 },
  { id: 'cadangan-pantau', nama: 'Cadangan DB Pantau', prefix: 'coreasia-cad/pantau-db-', maksJam: 27 },
  { id: 'cadangan-primesotech', nama: 'Cadangan DB primesotech', prefix: 'primesotech/primesotech-prod-db-', maksJam: 27 },
  { id: 'cadangan-leadku', nama: 'Cadangan DB LeadKu', prefix: 'leadku/leadku-postgres-', maksJam: 27, mulai: '2026-10-06T00:00:00Z' },
  // Supabase CashFlow, dibuat di VPS coreasia-cad (coreasia-cadangan-supabase@cashflow.timer, 03:15 WIB).
  { id: 'cadangan-cashflow', nama: 'Cadangan DB CashFlow (Supabase)', prefix: 'cashflow/cashflow-supabase-', maksJam: 27, mulai: '2026-10-13T00:00:00Z' },
  // Sapa: DB + sesi WhatsApp terenkripsi, coreasia-sapa-backup.timer 04:30 WIB di VPS primesotech.
  { id: 'cadangan-sapa', nama: 'Cadangan Sapa (DB + sesi WhatsApp)', prefix: 'sapa/primesotech/', maksJam: 27, mulai: '2026-10-30T00:00:00Z' },
]
