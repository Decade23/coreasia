/**
 * Blog article data structure.
 * Articles are stored here as static data for now.
 * This will be replaced by API calls when the admin panel is ready.
 */

export interface Article {
  slug: string
  title: string
  description: string
  category: string
  readTime: number
  publishedAt: string
  author: string
  content: string
  tags: string[]
}

// Seed articles — to be replaced by API later
export const ARTICLES: Article[] = [
  {
    slug: 'apa-itu-web-monitoring-dan-mengapa-bisnis-membutuhkannya',
    title: 'Apa Itu Web Monitoring dan Mengapa Bisnis Anda Membutuhkannya',
    description: 'Pelajari apa itu web monitoring, manfaatnya untuk bisnis, dan bagaimana dashboard monitoring bisa membantu Anda mengambil keputusan berdasarkan data.',
    category: 'business',
    readTime: 5,
    publishedAt: '2026-03-15',
    author: 'Tim CoreAsia',
    tags: ['web monitoring', 'analytics', 'bisnis digital'],
    content: `
Web monitoring adalah proses memantau performa website secara berkala untuk memastikan website berfungsi dengan baik dan mencapai tujuan bisnis. Ini mencakup pemantauan traffic, user behavior, kecepatan loading, SEO ranking, dan banyak lagi.

## Mengapa Web Monitoring Penting?

Tanpa monitoring yang tepat, Anda seperti menjalankan bisnis dengan mata tertutup. Berikut alasan mengapa web monitoring sangat penting:

### 1. Memahami Pengunjung Website Anda
Dengan tools seperti Google Analytics 4, Anda bisa melihat siapa yang mengunjungi website, dari mana mereka datang, halaman apa yang paling sering dikunjungi, dan berapa lama mereka bertahan.

### 2. Meningkatkan Performa SEO
Google Search Console memberikan data tentang keyword mana yang membawa traffic, berapa impressions dan clicks yang Anda dapatkan, serta apakah ada masalah indexing yang perlu diperbaiki.

### 3. Melacak Leads dan Konversi
Setiap form submission, klik WhatsApp, atau interaksi penting bisa dilacak. Ini membantu Anda mengukur ROI dari website Anda.

### 4. Mengambil Keputusan Berdasarkan Data
Bukan asumsi, tapi data nyata. Laporan monitoring membantu tim marketing dan manajemen membuat keputusan yang lebih tepat.

## Solusi: Dashboard Monitoring yang Terintegrasi

Masalah terbesar bagi banyak bisnis adalah data tersebar di banyak tools berbeda — GA4, Search Console, CRM, spreadsheet. Ini membutuhkan waktu dan keahlian untuk menganalisa.

**Pantau by CoreAsia** mengatasi masalah ini dengan menggabungkan semua data dalam satu dashboard yang mudah dipahami, lengkap dengan laporan PDF otomatis dan AI assistant untuk analisa.

[Pelajari lebih lanjut tentang Pantau →](/products/pantau)

## Mulai Monitoring Website Anda

Tidak perlu menunggu website Anda bermasalah untuk mulai monitoring. Semakin cepat Anda mulai mengumpulkan data, semakin cepat Anda bisa mengoptimasi bisnis digital Anda.

[Konsultasikan kebutuhan monitoring Anda →](/contact?subject=pantau)
    `.trim(),
  },
  {
    slug: 'panduan-memilih-software-house-indonesia',
    title: 'Panduan Memilih Software House di Indonesia: 7 Hal yang Perlu Diperhatikan',
    description: 'Tips dan panduan lengkap memilih software house yang tepat di Indonesia. Dari portofolio, teknologi, hingga model kerja sama yang cocok untuk bisnis Anda.',
    category: 'business',
    readTime: 7,
    publishedAt: '2026-03-10',
    author: 'Tim CoreAsia',
    tags: ['software house', 'outsourcing', 'web development', 'tips bisnis'],
    content: `
Memilih software house yang tepat untuk proyek digital bisnis Anda bukan keputusan yang mudah. Salah pilih bisa berarti buang waktu, biaya, dan peluang. Berikut 7 hal yang perlu Anda perhatikan saat memilih partner teknologi.

## 1. Portofolio dan Track Record

Lihat proyek-proyek yang sudah pernah dikerjakan. Apakah mereka pernah menangani proyek dengan skala dan kompleksitas serupa? Portofolio menunjukkan kemampuan nyata, bukan sekadar klaim.

## 2. Teknologi yang Digunakan

Pastikan software house menggunakan teknologi modern dan scalable. Stack yang ketinggalan zaman bisa menjadi masalah besar di kemudian hari saat Anda perlu scaling atau maintenance.

Beberapa teknologi yang layak dipertimbangkan:
- **Frontend**: Vue.js, Nuxt.js, React, Next.js
- **Backend**: Go (Golang), Node.js, Python
- **Database**: PostgreSQL, MySQL
- **Infrastructure**: Docker, Kubernetes, Cloud-native

## 3. Proses Development yang Transparan

Software house yang profesional akan punya proses yang jelas: dari discovery, design, development, testing, hingga deployment. Transparansi dalam proses berarti Anda selalu tahu apa yang sedang dikerjakan.

## 4. Model Kerja Sama yang Fleksibel

Beberapa opsi model kerja sama yang umum:
- **Fixed Price**: Cocok untuk proyek dengan scope yang sudah jelas
- **Time & Material**: Cocok untuk proyek yang berkembang
- **Dedicated Team**: Cocok untuk proyek jangka panjang
- **Venture/Revenue Share**: Model inovatif di mana software house juga ikut berinvestasi

## 5. Support Setelah Launch

Website atau aplikasi tidak selesai saat launch. Pastikan ada garansi, maintenance plan, dan support teknis setelah proyek serah terima.

## 6. Keamanan dan Best Practice

Tanyakan tentang praktik keamanan: apakah mereka menerapkan OWASP guidelines, encryption, backup otomatis, dan audit trail?

## 7. Komunikasi dan Kultur Tim

Responsivitas, kemampuan menjelaskan hal teknis dalam bahasa bisnis, dan kultur kolaboratif sangat penting untuk kelancaran proyek.

## CoreAsia sebagai Mitra Teknologi

Di CoreAsia, kami tidak sekadar membangun software. Kami menjadi mitra teknologi strategis yang memahami tujuan bisnis Anda. Dengan model venture partnership, kami juga bisa berbagi risiko dan rewards bersama Anda.

[Diskusikan proyek Anda dengan tim kami →](/contact)
    `.trim(),
  },
  {
    slug: 'cara-meningkatkan-seo-website-bisnis',
    title: 'Cara Meningkatkan SEO Website Bisnis: Panduan Praktis 2026',
    description: 'Panduan praktis untuk meningkatkan SEO website bisnis Anda di 2026. Dari technical SEO, on-page optimization, hingga content strategy.',
    category: 'seo',
    readTime: 8,
    publishedAt: '2026-03-05',
    author: 'Tim CoreAsia',
    tags: ['seo', 'google', 'digital marketing', 'content strategy'],
    content: `
SEO (Search Engine Optimization) tetap menjadi salah satu strategi paling efektif untuk mendatangkan traffic organik ke website bisnis. Berikut panduan praktis yang bisa Anda terapkan.

## Technical SEO: Fondasi yang Kuat

### Kecepatan Website
Google menjadikan Core Web Vitals sebagai faktor ranking. Pastikan website Anda:
- Loading dalam kurang dari 2.5 detik (LCP)
- Interaktif dalam 200ms (INP)
- Tidak ada layout shift yang mengganggu (CLS)

### Mobile-First
Lebih dari 70% pengguna internet Indonesia mengakses via mobile. Website Anda harus responsif dan nyaman digunakan di smartphone.

### SSL & Keamanan
HTTPS bukan opsional — ini sudah menjadi standar. Website tanpa SSL akan ditandai "Not Secure" oleh browser.

### Sitemap & Robots.txt
Pastikan Google bisa menemukan dan mengindeks semua halaman penting di website Anda.

## On-Page SEO: Konten yang Relevan

### Title Tag & Meta Description
Setiap halaman harus punya title dan description yang unik, mengandung keyword target, dan menarik untuk diklik.

### Heading Structure
Gunakan heading (H1, H2, H3) secara hierarkis. H1 untuk judul utama, H2 untuk sub-topik, dan seterusnya.

### Internal Linking
Hubungkan halaman-halaman di website Anda secara relevan. Ini membantu Google memahami struktur website dan mendistribusikan authority.

### Alt Text pada Gambar
Setiap gambar harus punya alt text yang deskriptif. Ini membantu SEO dan accessibility.

## Content Strategy: Konten yang Bernilai

### Buat Konten yang Menjawab Pertanyaan
Riset keyword yang sering dicari target audiens Anda, lalu buat konten yang menjawab pertanyaan mereka dengan lengkap.

### Update Konten Secara Berkala
Konten yang up-to-date mendapat prioritas dari Google. Review dan update artikel Anda setidaknya setiap 6 bulan.

### Structured Data
Implementasikan schema markup (FAQ, Article, Organization) untuk membantu Google memahami konten Anda dan menampilkan rich snippets.

## Butuh Bantuan SEO?

CoreAsia membangun website yang sudah SEO-ready dari awal — dengan struktur kode yang bersih, meta tags otomatis, sitemap, dan structured data.

[Konsultasikan kebutuhan website Anda →](/contact?subject=website)
    `.trim(),
  },
]

export const getArticleBySlug = (slug: string): Article | undefined => {
  return ARTICLES.find((a) => a.slug === slug)
}

export const getArticlesByCategory = (category?: string): Article[] => {
  if (!category || category === 'all') return ARTICLES
  return ARTICLES.filter((a) => a.category === category)
}
