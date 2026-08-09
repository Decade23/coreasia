# Google Ads Pilot — CoreAsia Jasa Website

Dokumen ini adalah spesifikasi kampanye Search pertama CoreAsia dengan plafon tagihan Rp600.000.

## Budget dan jadwal

- Nama campaign: `Search | CoreAsia | Jasa Website | Jakarta | 7D`
- Jenis budget: campaign total budget
- Media budget: Rp535.000
- Estimasi PPN 11%: Rp58.850
- Estimasi total: Rp593.850
- Durasi: 7 hari penuh
- Jadwal tayang: 08.00–21.00 WIB
- Status saat dibuat: paused sampai tracking terverifikasi

## Tujuan dan landing

- Objective: Leads
- Campaign type: Search
- Final URL: `https://coreasia.id/layanan/jasa-pembuatan-website`
- Display path: `jasa-website/company-profile`
- Primary conversion: `lead_form_saved`
- Secondary conversions: `form_start`, `whatsapp_click`, `contact_page_view`
- Offline conversions: `qualified_lead`, `deal_won`

## Setelan

- Bidding: Maximize Clicks
- Initial max CPC: Rp7.500, ditinjau ulang dari Keyword Planner sebelum publikasi
- Google Search Network: aktif
- Search Partners: nonaktif
- Display Network: nonaktif
- AI Max/final URL expansion: nonaktif
- Broad match: nonaktif
- Lokasi: DKI Jakarta
- Location option: orang yang berada atau rutin berada di lokasi target
- Bahasa: Indonesia dan Inggris
- Audience: observation only
- Auto-tagging: aktif

Final URL suffix:

```text
utm_source=google&utm_medium=cpc&utm_campaign=coreasia_jasa_website_jakarta_7d&utm_id={campaignid}&utm_term={keyword}&utm_content={creative}&adgroup_id={adgroupid}&matchtype={matchtype}&device={device}&network={network}
```

## Ad group

Nama: `AG1 | Website & Company Profile`

Exact match:

```text
[jasa pembuatan website]
[jasa website company profile]
[jasa website perusahaan]
[jasa pembuatan website jakarta]
[website company profile]
[jasa landing page profesional]
```

Phrase match:

```text
"jasa pembuatan website"
"jasa website company profile"
"jasa website perusahaan"
"buat website perusahaan"
"website company profile"
"jasa landing page"
```

Campaign-level negative keywords:

```text
gratis
free
tutorial
belajar
kursus
bootcamp
lowongan
loker
karir
magang
gaji
template
theme
tema
source code
github
download
login
admin
skripsi
makalah
"cara membuat website"
"buat website sendiri"
"website gratis"
"hosting gratis"
"domain gratis"
"pembuat website gratis"
"ai website builder"
"100 ribu"
"500 ribu"
"wordpress theme"
"tema wordpress"
```

## Responsive Search Ad

Headlines:

1. Jasa Pembuatan Website
2. Jasa Website Jakarta
3. Website Company Profile
4. Mulai Rp3 Juta
5. Konsultasi Gratis
6. Desain Custom & Responsif
7. SEO-Ready dari Awal
8. Website untuk Bisnis Anda
9. Buat Website di CoreAsia
10. Tim Developer Indonesia
11. Landing Page Profesional
12. Website Profesional
13. Website Cepat & Modern
14. Solusi Website untuk UMKM
15. Jadwalkan Konsultasi

Descriptions:

1. Website profesional untuk bisnis, UMKM, dan perusahaan. Mulai Rp3 juta.
2. Desain custom, responsif, dan SEO-ready. Konsultasikan kebutuhan Anda gratis.
3. Bangun landing page atau company profile bersama tim developer CoreAsia.
4. Ceritakan kebutuhan Anda dan dapatkan estimasi proyek tanpa komitmen.

## Assets

Sitelinks:

- Lihat Portfolio — `https://coreasia.id/portfolio`
- Harga & Paket — `https://coreasia.id/pricing`
- Konsultasi Gratis — `https://coreasia.id/contact?subject=website`
- Tentang CoreAsia — `https://coreasia.id/about`

Callouts:

- Konsultasi Gratis
- Desain Custom
- Responsif di Mobile
- SEO-Ready dari Awal
- Harga Transparan
- Tim Developer Indonesia
- Bisa Seluruh Indonesia

Structured snippet `Katalog layanan`:

- Landing Page
- Company Profile
- Toko Online
- Web App Custom

## Launch gate

Kampanye tetap dijeda sampai seluruh poin berikut lolos:

- Lead tersimpan ke database sebelum halaman menyatakan sukses.
- First-touch UTM, GCLID, FBCLID, landing page, dan referrer tersimpan.
- Event `lead_form_saved` hanya dikirim setelah respons API sukses.
- Satu test lead muncul di database dengan atribusi yang benar.
- Tag Assistant menunjukkan event diterima oleh GA4/Google Ads.
- Search Partners, Display Network, dan broad match tetap nonaktif.
- Billing profile selesai tanpa melampaui plafon Rp600.000 termasuk pajak.
