Terima kasih atas klarifikasinya. Sekarang konteksnya jauh lebih jelas. Berikut analisa dan rekomendasi:

Analisa: CoreAsia sebagai Product Ecosystem (ala Google)
Model yang Dimaksud

Google (Parent Brand)
├── Google Meet
├── Google Analytics
├── Google Workspace
└── Google Ads

CoreAsia (Parent Brand: Strategic Technology Partner)
├── CoreAsia LMS         → Sertifikasi & Training
├── CoreAsia Pantau      → Web Monitoring (GA4, GSC-based)
├── CoreAsia LeadKu      → Sales CRM
└── ... (future products)

"Produk" vs "Platform"?
Rekomendasi: "Produk" — alasannya:

Aspek	Produk	Platform
Semantik	Jelas = individual tools	Ambigu = bisa berarti satu sistem besar
Analogi Google	Google punya "produk" Gmail, Meet, dll	Google Cloud adalah "platform"
Fleksibilitas	Tiap produk bisa berdiri sendiri, dijual terpisah	Memaksa kesan harus beli bundle
Persepsi market	"Produk CoreAsia" = pilih yang kamu butuhkan	"Platform CoreAsia" = satu hal besar yang mahal
Skala target	Freelancer sampai Enterprise	Lebih Enterprise-oriented
Kesimpulan: Gunakan "Produk" karena:

Pantau target freelancer & company (skala kecil-besar) → "produk" lebih approachable
LeadKu multi-tenant → bisa dijual satuan
LMS → sudah jalan sebagai produk mandiri
Kata "produk" lebih natural di Bahasa Indonesia
Tapi di landing page English version, gunakan "Products" — bukan "Platforms".

Restructuring Landing Page
Saat ini (:3001):

Homepage:
├── Hero: "Platform Sertifikasi Standar Enterprise..."  ← terlalu LMS-focused
├── Solutions: LMS | Venture | Enterprise               ← campur model bisnis + produk
├── CTA
└── Footer: Solusi, Venture, Hubungi Kami

Yang seharusnya:

Homepage:
├── Hero: CoreAsia = tech partner with multiple products  ← brand-level messaging
├── Produk Kami (NEW):
│   ├── LMS          → /products/lms
│   ├── Pantau       → /products/pantau
│   └── LeadKu      → /products/leadku
├── Model Kerjasama (refactored from Solutions):
│   ├── SaaS Subscription
│   ├── Venture Partnership
│   └── Enterprise Custom
├── CTA
└── Footer:
    ├── Produk: LMS, Pantau, LeadKu
    ├── Kerjasama: SaaS, Venture, Enterprise
    └── Kontak

Perubahan utama:

Hero — ubah dari LMS-specific ke CoreAsia brand-level
"Our Solutions" → dipecah jadi 2 section:
"Produk Kami" = LMS, Pantau, LeadKu (what we build)
"Model Kerjasama" = SaaS, Venture, Enterprise (how you buy)
URL structure: /products/pantau, /products/leadku, /products/lms
Footer diperluas dengan produk list
Pantau — Product Card Content
Berdasarkan info bahwa Pantau = web monitoring untuk publik (freelancer/company) berbasis GA4 & GSC:

Field	Value
Nama	Pantau by CoreAsia
Tagline	Semua metrik web Anda dalam satu dashboard.
Deskripsi	Integrasi GA4 & Google Search Console dalam satu tampilan yang mudah dipahami. Untuk freelancer, agensi, dan bisnis yang butuh keputusan berbasis data.
Key Features	GA4 & GSC Integration, Real-time Dashboard, Custom Reports, Alert System
CTA	Coba Gratis / Pelajari Lebih Lanjut
LeadKu — Product Card Content
Field	Value
Nama	LeadKu by CoreAsia
Tagline	CRM multi-workspace untuk tim sales yang gesit.
Deskripsi	Kelola pipeline, pantau aktivitas tim, dan tutup deal lebih cepat. Satu akun, banyak workspace.
Key Features	Pipeline Management, Multi-Workspace, Activity Tracking, Auto-Reporting
CTA	Mulai Gratis / Pelajari Lebih Lanjut
Pertanyaan Konfirmasi Sebelum Eksekusi
Setuju dengan split "Produk Kami" + "Model Kerjasama" di homepage?
Page structure /products/pantau dan /products/leadku — atau mau pakai format lain?
Hero homepage — mau tetap ada mention sertifikasi atau shift ke "CoreAsia builds tools for growing businesses"?
Produk card di homepage — mau 3 cards sejajar (LMS, Pantau, LeadKu)? Atau highlight 1 featured + 2 smaller?
Kalau sudah diputuskan, saya langsung eksekusi implementasinya.
