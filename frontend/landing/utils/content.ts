import { DEFAULT_LOCALE } from './i18n'

const ID_CONTENT = {
  // Navigation
  nav: {
    home: 'Beranda',
    products: 'Produk',
    partnerships: 'Kerja Sama',
    solutions: 'Solusi',
    venture: 'Venture',
    about: 'Tentang Kami',
    contact: 'Hubungi Kami',
    pricing: 'Harga',
  },
  // Common
  common: {
    loading: 'Memuat...',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
    cancel: 'Batal',
    save: 'Simpan',
    close: 'Tutup',
    back: 'Kembali',
    next: 'Selanjutnya',
    submit: 'Kirim',
    learnMore: 'Pelajari lebih lanjut',
    search: 'Cari',
    all: 'Semua',
    yes: 'Ya',
    no: 'Tidak',
    or: 'atau',
    contact: 'Hubungi',
    email: 'Email',
    phone: 'Telepon',
    whatsapp: 'WhatsApp',
    download: 'Unduh',
    futureReady: 'Future-Ready',
    noResults: 'Tidak ada hasil ditemukan.',
  },
  // Home page
  home: {
    title: 'CoreAsia - Ekosistem Produk Digital untuk Bisnis Bertumbuh',
    description:
      'CoreAsia membangun produk digital dan model kerja sama strategis untuk sertifikasi, web monitoring, CRM, dan kebutuhan enterprise yang siap tumbuh.',
    kicker: 'Strategic Technology Partner',
    hero: {
      // v1: 'Bangun operasi digital lebih cepat dengan ekosistem produk CoreAsia.'
      // v1: 'Dari sertifikasi digital, web monitoring, sampai CRM multi-workspace, CoreAsia membantu bisnis Anda memilih produk yang tepat dan model kerja sama yang realistis untuk launch, scale, dan monetisasi.'
      title:
        'Eksekusi digital yang lebih cepat, rapi, dan <span class="ca-gradient-text">siap di-scale</span>.',
      subtitle:
        'CoreAsia menyediakan produk dan model kerja sama yang membantu bisnis Anda launch lebih cepat tanpa build dari nol.',
      ctaPrimary: 'Diskusikan Kebutuhan',
      ctaSecondary: 'WhatsApp',
      powerStatement:
        'Satu ekosistem, banyak solusi — dari sertifikasi, monitoring, hingga CRM, CoreAsia bantu bisnis Anda launch lebih cepat dan scale lebih rapi.',
      chips: ['Product Ecosystem', 'Growth Partnership', 'Enterprise Delivery'],
    },
    products: {
      kicker: 'Produk Kami',
      title: 'Pilih produk yang sesuai dengan kebutuhan tim Anda',
      subtitle:
        'Setiap produk dirancang untuk menyelesaikan masalah yang spesifik, tetapi tetap bisa berkembang dalam satu ekosistem yang terhubung.',
      items: [
        {
          name: 'Pantau by CoreAsia',
          badge: 'Live',
          tagline: 'Web Monitoring',
          heroDesc: 'GA4 + Search Console + leads + laporan PDF dalam satu dashboard yang mudah dipahami.',
          description:
            'Dashboard analytics yang menggabungkan GA4, Google Search Console, leads, dan laporan PDF otomatis untuk freelancer, agensi, dan bisnis yang butuh insight web lengkap.',
          features: [
            'GA4 & GSC dalam satu dashboard',
            'Laporan PDF otomatis & terjadwal',
            'Leads management & webhook',
            'AI assistant untuk analisa performa',
          ],
          ctaLabel: 'Pelajari Pantau',
          to: '/products/pantau',
        },
        {
          name: 'Build by CoreAsia',
          badge: 'Service',
          tagline: 'Web & App',
          heroDesc: 'Website, web app, atau sistem custom — dari konsep sampai live, kami yang eksekusi.',
          description:
            'Bangun website, web app, atau sistem custom sesuai kebutuhan bisnis Anda. Dari landing page hingga platform SaaS, kami eksekusi dari konsep sampai live.',
          features: [
            'Website & landing page profesional',
            'Web application & dashboard custom',
            'Integrasi API & sistem pihak ketiga',
          ],
          ctaLabel: 'Lihat Layanan',
          to: '/products/build',
        },
      ],
      comingSoon: [
        {
          name: 'CoreAsia LMS',
          badge: 'Coming Soon',
          tagline: 'Sertifikasi & Training',
          description:
            'Platform sertifikasi dan training management untuk operasional yang butuh workflow rapi, audit-ready, dan siap di-scale.',
        },
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Coming Soon',
          tagline: 'Sales CRM',
          description:
            'CRM multi-workspace untuk tim sales yang perlu pipeline lebih rapi, aktivitas tim terlacak, dan reporting yang cepat.',
        },
      ],
    },
    engagementModels: {
      kicker: 'Model Kerja Sama',
      title: 'Pilih cara kerja yang paling cocok dengan stage bisnis Anda',
      subtitle:
        'Kami tidak memaksa semua klien masuk ke model yang sama. Pilihan kerja sama disesuaikan dengan readiness bisnis, kebutuhan eksekusi, dan target pertumbuhan.',
      items: [
        {
          name: 'SaaS Subscription',
          description:
            'Gunakan produk CoreAsia sebagai layanan berlangganan agar tim Anda bisa launch lebih cepat tanpa build dari nol.',
          features: [
            'Go-live lebih cepat',
            'Biaya awal lebih terkontrol',
            'Perawatan produk ditangani bertahap',
          ],
          ctaLabel: 'Lihat Pricing',
          to: '/pricing',
        },
        {
          name: 'Venture Partnership',
          description:
            'Model kolaborasi bagi hasil untuk bisnis yang punya market, tetapi ingin menekan beban investasi teknologi di awal.',
          features: [
            'Skema growth-aligned',
            'Strategi dan delivery berjalan bersama',
            'Fokus pada monetisasi dan traction',
          ],
          ctaLabel: 'Lihat Venture Model',
          to: '/solutions/venture',
        },
        {
          name: 'Enterprise Custom',
          description:
            'Pendekatan khusus untuk organisasi yang membutuhkan integrasi, workflow, compliance, atau delivery model yang lebih kompleks.',
          features: [
            'Scoping sesuai kebutuhan operasional',
            'Integrasi dan workflow yang lebih fleksibel',
            'Cocok untuk kebutuhan enterprise dan regulasi',
          ],
          ctaLabel: 'Diskusikan Enterprise',
          to: '/contact?subject=enterprise',
        },
      ],
    },
    readyCTA: {
      title: 'Siap memilih produk atau model kerja sama yang tepat?',
      subtitle:
        'Ceritakan target bisnis Anda. Kami bantu memetakan opsi yang paling realistis untuk implementasi, launch, dan pertumbuhan berikutnya.',
      ctaPrimary: 'Jadwalkan Konsultasi',
      ctaSecondary: 'Chat via WhatsApp',
    },
  },
  // About page
  productsPage: {
    title: 'Produk & Layanan CoreAsia',
    description:
      'Jelajahi produk dan layanan CoreAsia untuk monitoring website, pembuatan web/app custom, dan solusi digital yang siap scale.',
    hero: {
      kicker: 'Product & Services',
      title: 'Temukan <span class="ca-gradient-text">produk dan layanan CoreAsia</span> yang paling cocok untuk kebutuhan digital Anda.',
      subtitle:
        'Dari monitoring performa website hingga pembuatan web dan aplikasi custom, CoreAsia membantu bisnis Anda beroperasi lebih cepat dan terukur.',
      ctaPrimary: 'Diskusikan Kebutuhan',
      ctaSecondary: 'Lihat Pricing',
      chips: ['Website Analytics', 'Digital Build', 'Custom Solutions'],
    },
    highlights: {
      title: 'Cara cepat memilih produk yang tepat',
      items: [
        {
          title: 'Pilih berdasarkan bottleneck utama',
          description:
            'Jika masalah Anda ada di sertifikasi, monitoring performa web, atau pipeline sales, mulai dari produk yang langsung menyentuh bottleneck itu.',
          icon: 'lucide:target',
        },
        {
          title: 'Mulai lean, scale bertahap',
          description:
            'Produk dirancang agar Anda bisa mulai dari kebutuhan paling mendesak tanpa memaksa build yang terlalu besar di awal.',
          icon: 'lucide:rocket',
        },
        {
          title: 'Siapkan jalur integrasi berikutnya',
          description:
            'Saat kebutuhan bertumbuh, CoreAsia bisa diteruskan ke model enterprise atau partnership yang lebih kompleks.',
          icon: 'lucide:git-branch-plus',
        },
      ],
    },
    cta: {
      title: 'Masih ingin membandingkan opsi yang paling realistis?',
      subtitle:
        'Ceritakan konteks operasional, target revenue, atau alur kerja tim Anda. Kami bantu arahkan ke produk yang paling masuk akal.',
      ctaPrimary: 'Hubungi Tim CoreAsia',
      ctaSecondary: 'WhatsApp',
    },
  },
  partnershipsPage: {
    title: 'Model Kerja Sama CoreAsia - SaaS, Venture, dan Enterprise',
    description:
      'Pahami model kerja sama CoreAsia untuk berlangganan SaaS, venture partnership, dan enterprise delivery sesuai stage bisnis dan kompleksitas operasional.',
    hero: {
      kicker: 'Engagement Models',
      title: 'Pilih <span class="ca-gradient-text">model kerja sama</span> yang paling realistis untuk stage bisnis Anda.',
      subtitle:
        'CoreAsia tidak memaksa semua kebutuhan masuk ke pola delivery yang sama. Setiap model dirancang untuk menyeimbangkan kecepatan launch, beban investasi, dan ruang bertumbuh.',
      ctaPrimary: 'Konsultasi Strategis',
      ctaSecondary: 'Lihat Produk',
      chips: ['Subscription SaaS', 'Venture Partnership', 'Enterprise Delivery'],
    },
    principles: {
      title: 'Kerangka memilih model kerja sama',
      items: [
        {
          title: 'Kecepatan launch',
          description:
            'Jika Anda ingin go-live cepat dengan risiko delivery yang lebih rendah, model SaaS biasanya paling efisien.',
          icon: 'lucide:gauge',
        },
        {
          title: 'Kesiapan monetisasi',
          description:
            'Jika bisnis punya akses market tetapi ingin menekan biaya teknologi di awal, venture partnership bisa lebih relevan.',
          icon: 'lucide:hand-coins',
        },
        {
          title: 'Kompleksitas operasional',
          description:
            'Jika kebutuhan Anda menyentuh integrasi, workflow khusus, atau compliance, jalur enterprise lebih tepat dibanding paket generik.',
          icon: 'lucide:building-2',
        },
      ],
    },
    cta: {
      title: 'Perlu bantuan menentukan model delivery yang tepat?',
      subtitle:
        'Kami bisa bantu memetakan apakah kebutuhan Anda lebih cocok masuk ke SaaS subscription, venture, atau enterprise execution.',
      ctaPrimary: 'Diskusikan Model Kerja Sama',
      ctaSecondary: 'WhatsApp',
    },
  },
  // About page
  about: {
    title: 'Tentang Kami - Strategic Technology Partner',
    description:
      'Mengenal lebih dekat CoreAsia yang sedang membangun fondasi sebagai strategic technology partner untuk produk digital, sertifikasi, dan kebutuhan operasional yang ingin tumbuh rapi.',
    kicker: 'Our Vision',
    hero: {
      title: 'Building <span class="ca-gradient-text">Digital Infrastructure for Future</span>',
      subtitle:
        'CoreAsia sedang berada pada fase awal untuk membangun product ecosystem yang fokus pada sertifikasi digital, monitoring web, CRM, dan delivery model yang realistis untuk bertumbuh.',
      ctaPrimary: 'Hubungi Kami',
      ctaSecondary: 'WhatsApp',
    },
    schema: {
      name: 'Tentang CoreAsia',
      description: 'Company profile dan visi CoreAsia Teknologi.',
    },
    whyUs: {
      title: 'Mengapa CoreAsia',
      subtitle: 'Solusi Teknologi yang Dirancang untuk Pertumbuhan',
      values: [
        {
          title: 'High Performance',
          description: 'Solusi yang dioptimalkan untuk kecepatan dan skalabilitas maksimal.',
          icon: 'lucide:zap',
        },
        {
          title: 'Data Integrity',
          description: 'Keamanan dan integritas data menjadi prioritas utama dalam setiap solusi.',
          icon: 'lucide:shield-check',
        },
        {
          title: 'Future Proof',
          description: 'Teknologi yang dirancang untuk berkembang bersama bisnis klien.',
          icon: 'lucide:bar-chart-3',
        },
      ],
    },
    journey: {
      title: 'Arah yang Sedang Kami Bangun',
      subtitle: 'Bukan sejarah panjang yang dibuat-buat, tetapi roadmap yang sedang kami kerjakan dengan sengaja.',
      events: [
        {
          year: 'Mulai',
          title: 'Founding Stage',
          description: 'CoreAsia baru memulai dengan fokus membangun fondasi brand, delivery flow, dan positioning produk yang jelas.',
          icon: 'lucide:sprout',
        },
        {
          year: 'Fokus',
          title: 'Flagship Product Validation',
          description: 'CoreAsia LMS menjadi pijakan awal untuk memvalidasi kebutuhan pasar, workflow, dan kualitas operasional.',
          icon: 'lucide:graduation-cap',
        },
        {
          year: 'Bangun',
          title: 'Product Ecosystem Rollout',
          description: 'Pantau dan LeadKu disiapkan bertahap agar CoreAsia berkembang sebagai product ecosystem, bukan satu produk tunggal.',
          icon: 'lucide:boxes',
        },
        {
          year: 'Scale',
          title: 'Strategic Partnership Expansion',
          description: 'Setelah fondasi produk kuat, CoreAsia diarahkan ke venture collaboration dan enterprise execution yang lebih matang.',
          icon: 'lucide:handshake',
        },
      ],
    },
    leadership: {
      title: 'Leadership',
      subtitle: 'Founder-led execution with realistic product thinking',
      name: 'Dedi - Founder & Principal Tech Lead',
      description:
        'CoreAsia dibangun langsung oleh founder yang fokus menyusun fondasi produk, sistem delivery, dan monetisasi dengan ritme yang realistis, bukan sekadar terlihat besar di permukaan.',
      chips: ['Founder-Led', 'Product Strategy', 'Execution-First'],
    },
    readyCTA: {
      title: 'Siap Transformasi Operasional Digital Anda?',
      subtitle: 'Diskusikan kebutuhan teknologi dan product strategy Anda dengan tim CoreAsia.',
      ctaPrimary: 'Hubungi Kami',
      ctaSecondary: 'WhatsApp',
    },
  },
  // Solutions pages (legacy routes retained)
  solutions: {
    title: 'Solusi Kami',
    subtitle: 'Pilih jalur pertumbuhan sesuai stage bisnis Anda',
    kicker: 'Our Solutions',
    lms: {
      title: 'SaaS LMS Platform - Online Certification Solution',
      description:
        'Luncurkan akademi digital Anda dalam hitungan hari. Platform all-in-one untuk penjualan kursus, ujian online, dan sertifikasi digital.',
      kicker: 'SaaS LMS for Certification',
      hero: {
        title: 'LMS white-label untuk <span class="ca-gradient-text">sertifikasi online</span> yang siap dijual.',
        subtitle:
          'Solusi end-to-end untuk pendaftaran, assessment, dan sertifikat digital. Dirancang agar team operasional tetap nyaman dari mobile sampai desktop.',
        ctaPrimary: 'Request Demo',
        ctaSecondary: 'WhatsApp Sales',
        chips: ['APL-01 & APL-02 digital', 'CBT + Essay grading', 'QR certificate validation'],
      },
      detailedFeatures: [
        {
          title: 'Ujian Online Terawasi',
          description: 'Sistem proctoring AI mendeteksi kecurangan, tab switching, dan multi-face detection.',
          icon: 'lucide:shield-alert',
        },
        {
          title: 'Sertifikat Blockchain',
          description: 'Terbitkan sertifikat digital yang dapat diverifikasi secara instan dan anti-palsu.',
          icon: 'lucide:award',
        },
        {
          title: 'Manajemen Kelas Hybrid',
          description: 'Kelola sesi offline dan online dalam satu dashboard terintegrasi.',
          icon: 'lucide:users',
        },
        {
          title: 'Analytics & Reporting',
          description: 'Laporan perkembangan peserta secara real-time untuk evaluasi efektivitas training.',
          icon: 'lucide:bar-chart-3',
        },
      ],
      features: [
        'Sertifikat Digital Anti-Palsu',
        'White-Label (Brand Anda)',
        'Auto-Invoicing Payment',
      ],
      cta: {
        title: 'Siap untuk upgrade sistem pelatihan Anda?',
        subtitle: 'Tim kami siap membantu migrasi data dan setup awal.',
        button: 'Hubungi Sales',
      },
    },
    pantau: {
      title: 'Pantau - Dashboard Analytics & Monitoring Website Lengkap',
      description:
        'Pantau menggabungkan GA4, Google Search Console, leads management, laporan PDF otomatis, dan AI assistant ke satu dashboard yang mudah dipahami.',
      kicker: 'Website Analytics Dashboard',
      hero: {
        title:
          'Semua data website Anda dalam <span class="ca-gradient-text">satu dashboard yang langsung bisa dipahami</span>.',
        subtitle:
          'Pantau menggabungkan Google Analytics, Search Console, leads, laporan otomatis, dan AI assistant — sehingga tim Anda bisa fokus mengambil keputusan, bukan mengumpulkan data.',
        ctaPrimary: 'Coba Pantau Gratis',
        ctaSecondary: 'WhatsApp',
        chips: ['GA4 + GSC', 'Laporan PDF Otomatis', 'AI Assistant', 'Leads & CRM'],
      },
      detailedFeatures: [
        {
          title: 'Google Analytics & Search Console',
          description: 'Lihat sessions, users, page views, bounce rate, klik, impresi, CTR, dan posisi rata-rata dalam satu tampilan terpadu.',
          icon: 'lucide:bar-chart-3',
        },
        {
          title: 'Laporan PDF Otomatis',
          description: 'Generate laporan performa website dalam format PDF. Atur jadwal mingguan, bulanan, atau kuartalan dengan pengiriman otomatis via email.',
          icon: 'lucide:file-text',
        },
        {
          title: 'Leads Management',
          description: 'Kelola prospek dari berbagai sumber. Terima leads via webhook dari form, CRM, atau platform lain secara otomatis.',
          icon: 'lucide:users',
        },
        {
          title: 'AI Assistant (Dexter)',
          description: 'Tanyakan apa saja tentang performa website Anda. AI membantu menganalisa data dan memberikan rekomendasi yang actionable.',
          icon: 'lucide:sparkles',
        },
        {
          title: 'PageSpeed Monitoring',
          description: 'Pantau skor PageSpeed Insights secara berkala. Dapatkan notifikasi jika performa website menurun.',
          icon: 'lucide:gauge',
        },
        {
          title: 'Multi-Website & Tim',
          description: 'Kelola banyak website dalam satu akun. Undang anggota tim dengan role berbeda untuk kolaborasi yang lebih rapi.',
          icon: 'lucide:globe',
        },
        {
          title: 'Analisa Kata Kunci & Halaman',
          description: 'Identifikasi kata kunci dan halaman yang paling berdampak. Temukan peluang SEO yang belum dioptimalkan.',
          icon: 'lucide:search',
        },
        {
          title: 'Admin Panel & Billing',
          description: 'Panel admin lengkap untuk mengelola pengguna, paket langganan, penggunaan API, broadcast notifikasi, dan audit log.',
          icon: 'lucide:settings',
        },
      ],
      pricing: {
        label: 'Pricing',
        title: 'Harga yang transparan, mulai dari gratis',
        subtitle: 'Pilih paket yang sesuai dengan jumlah website dan kebutuhan tim Anda.',
        plans: [
          {
            name: 'Starter',
            price: 'Gratis',
            description: 'Untuk memulai monitoring 1 website.',
            features: ['1 website', 'Data 7 hari', 'GSC dasar', '10 AI query/hari'],
          },
          {
            name: 'Professional',
            price: 'Rp 199.000/bln',
            description: 'Analitik mendalam untuk profesional.',
            popular: true,
            features: ['10 website', 'Data 90 hari', 'GA4 + GSC lengkap', 'Laporan PDF', '3 anggota tim', '50 AI query/hari'],
          },
          {
            name: 'Business',
            price: 'Rp 499.000/bln',
            description: 'Untuk agensi dengan banyak klien.',
            features: ['25 website', 'Data 180 hari', 'White-label', 'Jadwal laporan custom', '10 anggota tim', '100 AI query/hari'],
          },
          {
            name: 'Enterprise',
            price: 'Rp 999.000/bln',
            description: 'Akses penuh tanpa batas.',
            features: ['50 website', 'Data 365 hari', 'API access', 'Semua fitur Business', '25 anggota tim', '500 AI query/hari'],
          },
        ],
      },
      audience: {
        label: 'Best Fit',
        title: 'Siapa yang paling cocok memakai Pantau',
        subtitle:
          'Dirancang untuk siapa saja yang butuh monitoring performa web yang lengkap tapi tetap mudah dipahami.',
        items: [
          {
            icon: 'lucide:briefcase-business',
            title: 'Freelancer & consultant',
            description: 'Audit performa web, generate laporan PDF untuk klien, dan kelola leads dari berbagai project dalam satu tempat.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Agency digital',
            description: 'Monitoring puluhan website klien, laporan otomatis, white-label dashboard, dan kolaborasi tim yang terstruktur.',
          },
          {
            icon: 'lucide:megaphone',
            title: 'Owner & marketing team',
            description: 'Baca performa website tanpa harus buka GA4 dan GSC terpisah. Tanya AI jika butuh insight lebih dalam.',
          },
          {
            icon: 'lucide:store',
            title: 'Bisnis online & e-commerce',
            description: 'Pantau traffic, konversi, dan sumber pengunjung. Terima leads dari form website langsung ke dashboard.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'Mulai monitoring dalam 3 langkah',
        items: [
          {
            title: '1. Hubungkan website Anda',
            description: 'Login dengan Google, lalu pilih property GA4 dan Search Console yang ingin dipantau. Setup selesai dalam 2 menit.',
          },
          {
            title: '2. Lihat insight lengkap',
            description: 'Dashboard langsung menampilkan traffic, kata kunci, halaman terbaik, PageSpeed score, dan tren performa secara real-time.',
          },
          {
            title: '3. Ambil tindakan',
            description: 'Generate laporan PDF, analisa dengan AI, kelola leads yang masuk, dan bagikan insight ke tim atau klien.',
          },
        ],
      },
      cta: {
        title: 'Siap memonitor website Anda dengan lebih efektif?',
        subtitle: 'Mulai gratis dengan paket Starter. Upgrade kapan saja saat kebutuhan Anda berkembang.',
        button: 'Coba Pantau Gratis',
      },
    },
    custom: {
      title: 'Build by CoreAsia - Pembuatan Website, Web App, dan Sistem Digital',
      description:
        'CoreAsia membantu bisnis membangun website profesional, web application, dan sistem custom yang dirancang sesuai kebutuhan spesifik Anda.',
      kicker: 'Digital Build Service',
      hero: {
        title:
          'Bangun solusi digital yang <span class="ca-gradient-text">benar-benar sesuai kebutuhan bisnis Anda</span>.',
        subtitle:
          'Dari landing page yang converting, web app untuk operasional internal, hingga platform SaaS yang siap scale — kami eksekusi dari konsep, desain, development, sampai live.',
        ctaPrimary: 'Konsultasi Gratis',
        ctaSecondary: 'WhatsApp',
        chips: ['Website', 'Web App', 'SaaS Platform', 'API Integration'],
      },
      detailedFeatures: [
        {
          title: 'Website & Landing Page',
          description: 'Website profesional yang cepat, SEO-friendly, dan dioptimasi untuk konversi. Cocok untuk company profile, produk, atau campaign.',
          icon: 'lucide:monitor',
        },
        {
          title: 'Web Application',
          description: 'Aplikasi web custom untuk dashboard, portal, booking system, inventory, atau kebutuhan operasional lainnya.',
          icon: 'lucide:layout-dashboard',
        },
        {
          title: 'Platform SaaS',
          description: 'Bangun produk SaaS dari nol dengan arsitektur multi-tenant, billing, dan infrastruktur yang siap scale.',
          icon: 'lucide:cloud',
        },
        {
          title: 'Integrasi API & Sistem',
          description: 'Hubungkan sistem Anda dengan payment gateway, CRM, ERP, Google APIs, atau layanan pihak ketiga lainnya.',
          icon: 'lucide:plug',
        },
        {
          title: 'Mobile-Responsive Design',
          description: 'Setiap project dibangun dengan pendekatan mobile-first. Tampil sempurna di semua ukuran layar.',
          icon: 'lucide:smartphone',
        },
        {
          title: 'Maintenance & Support',
          description: 'Setelah live, kami tetap mendampingi dengan maintenance berkala, monitoring, dan update fitur sesuai kebutuhan.',
          icon: 'lucide:wrench',
        },
      ],
      process: {
        label: 'Process',
        title: 'Dari ide ke produk dalam 4 tahap',
        items: [
          {
            title: '1. Discovery & konsultasi',
            description: 'Kami pahami kebutuhan bisnis, target user, dan goals Anda. Dari sini kami tentukan scope, timeline, dan teknologi yang tepat.',
          },
          {
            title: '2. Desain & prototyping',
            description: 'UI/UX design yang clean dan modern. Anda bisa review dan memberikan feedback sebelum development dimulai.',
          },
          {
            title: '3. Development & testing',
            description: 'Proses build dengan standar engineering yang rapi. Setiap milestone bisa di-review dan di-test bersama.',
          },
          {
            title: '4. Launch & maintenance',
            description: 'Deployment ke production, monitoring performa, dan pendampingan setelah launch untuk memastikan semuanya berjalan lancar.',
          },
        ],
      },
      audience: {
        label: 'Best Fit',
        title: 'Siapa yang cocok menggunakan layanan ini',
        subtitle: 'Layanan custom development kami dirancang untuk berbagai kebutuhan bisnis, dari startup hingga enterprise.',
        items: [
          {
            icon: 'lucide:rocket',
            title: 'Startup & founder',
            description: 'Validasi ide produk dengan MVP yang cepat dibangun, tanpa harus recruit tim engineering sendiri.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Bisnis yang butuh digitalisasi',
            description: 'Transformasi proses manual ke sistem digital yang lebih efisien dan terukur.',
          },
          {
            icon: 'lucide:briefcase-business',
            title: 'Agency & consultant',
            description: 'Butuh development partner untuk project klien? Kami bisa jadi extended team Anda.',
          },
          {
            icon: 'lucide:shield-check',
            title: 'Enterprise & government',
            description: 'Sistem custom dengan standar keamanan dan compliance yang ketat, didukung dokumentasi lengkap.',
          },
        ],
      },
      techStack: {
        label: 'Tech Stack',
        title: 'Teknologi yang kami gunakan',
        subtitle: 'Kami tidak terbatas pada teknologi tertentu. Berikut beberapa yang sering kami gunakan — dan kami selalu terbuka untuk menyesuaikan dengan kebutuhan project Anda.',
        items: [
          'Nuxt.js / Next.js',
          'Vue.js / React',
          'Go / Node.js',
          'Python / FastAPI',
          'PostgreSQL / MySQL',
          'Redis / MongoDB',
          'Docker & CI/CD',
          'Tailwind CSS',
          'TypeScript',
          'REST & GraphQL API',
          'AWS / GCP / VPS',
          'WordPress / Headless CMS',
        ],
        moreLabel: 'Dan teknologi lainnya sesuai kebutuhan project Anda',
      },
      cta: {
        title: 'Punya ide project? Mari diskusikan.',
        subtitle: 'Konsultasi gratis untuk membahas kebutuhan, scope, dan estimasi project Anda. Tanpa komitmen.',
        button: 'Konsultasi Gratis',
      },
    },
    leadku: {
      title: 'LeadKu - CRM Multi-Workspace untuk Tim Sales yang Butuh Pipeline Rapi',
      description:
        'LeadKu membantu tim sales menjaga pipeline, aktivitas, dan reporting tetap terstruktur dalam satu workspace yang ringan.',
      kicker: 'Multi-Workspace CRM',
      hero: {
        title:
          'Rapikan pipeline sales dengan <span class="ca-gradient-text">CRM multi-workspace</span> yang lebih ringan.',
        subtitle:
          'LeadKu dirancang untuk tim yang membutuhkan alur sales yang lebih terpantau, aktivitas tim yang lebih jelas, dan reporting yang tidak berbelit.',
        ctaPrimary: 'Minta Preview LeadKu',
        ctaSecondary: 'WhatsApp',
        chips: ['Pipeline visibility', 'Team activity tracking', 'Multi-workspace ready'],
      },
      detailedFeatures: [
        {
          title: 'Pipeline yang Mudah Dipantau',
          description: 'Lihat pergerakan lead dan deal di setiap stage tanpa setup CRM yang terlalu kompleks.',
          icon: 'lucide:kanban-square',
        },
        {
          title: 'Aktivitas Tim Tercatat',
          description: 'Riwayat follow-up dan aktivitas penting tim sales tersimpan lebih rapi untuk evaluasi harian.',
          icon: 'lucide:history',
        },
        {
          title: 'Multi-Workspace',
          description: 'Pisahkan pipeline antar brand, unit, atau tim tanpa harus berpindah sistem.',
          icon: 'lucide:layers-3',
        },
        {
          title: 'Reporting Lebih Cepat',
          description: 'Ringkasan progres dan performa tim bisa dibaca lebih cepat oleh sales lead maupun owner bisnis.',
          icon: 'lucide:line-chart',
        },
      ],
      audience: {
        label: 'Best Fit',
        title: 'LeadKu paling relevan untuk tim seperti ini',
        subtitle:
          'Cocok untuk bisnis jasa, agency, dan tim sales internal yang butuh CRM praktis sebelum masuk tool yang terlalu berat.',
        items: [
          {
            icon: 'lucide:users',
            title: 'Tim sales kecil-menengah',
            description: 'Membantu koordinasi lead, follow-up, dan progres deal agar tidak tercecer.',
          },
          {
            icon: 'lucide:briefcase',
            title: 'Agency & service business',
            description: 'Pipeline prospek dan klien lebih mudah dibagi per layanan, unit, atau brand.',
          },
          {
            icon: 'lucide:user-round-check',
            title: 'Founder yang masih pegang sales',
            description: 'Memberikan visibilitas lebih cepat ke aktivitas tim tanpa dashboard yang terlalu berat.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'Lead management yang lebih bersih dari awal sampai closing',
        items: [
          {
            title: 'Kumpulkan lead ke workspace yang tepat',
            description: 'Pisahkan lead dan pipeline berdasarkan brand, divisi, atau tim yang menanganinya.',
          },
          {
            title: 'Pantau follow-up tim',
            description: 'Aktivitas tim tercatat lebih jelas sehingga sales lead tahu apa yang berjalan dan apa yang macet.',
          },
          {
            title: 'Review performa lebih cepat',
            description: 'Owner atau sales manager bisa membaca progres dan bottleneck tanpa mengurai spreadsheet manual.',
          },
        ],
      },
      cta: {
        title: 'Butuh CRM yang lebih rapi tanpa terlalu berat?',
        subtitle: 'Tunjukkan alur sales Anda sekarang. Kami bantu lihat apakah LeadKu cukup untuk kebutuhan pipeline tim.',
        button: 'Diskusikan LeadKu',
      },
    },
    venture: {
      title: 'Venture Partner',
      description:
        'Akselerasi bisnis tanpa risiko modal. Kami investasi teknologi senilai ratusan juta, kita bagi hasil dari profit.',
      kicker: 'Venture Partnership',
      hero: {
        title:
          'Launch bisnis digital dengan model <span class="bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent">bagi hasil</span> yang transparan.',
        subtitle:
          'Cocok untuk owner yang punya market dan eksekusi bisnis, tetapi ingin meminimalkan beban investasi teknologi di awal.',
        ctaPrimary: 'Ajukan Partnership',
        ctaSecondary: 'Diskusi Cepat',
        chips: ['Zero upfront option', 'Shared execution model', 'Growth-aligned incentive'],
      },
      features: [
        'Rp 0 Biaya Investasi Awal',
        'Pendampingan Strategi',
        'Fokus Jualan & Mengajar',
      ],
      relevance: {
        title: 'Kenapa model ini relevan sekarang',
        subtitle:
          'Banyak bisnis gagal scale bukan karena market, tapi karena cost awal product development terlalu berat.',
        buildSelf: {
          label: 'Build sendiri',
          price: 'Rp 150jt+',
          desc: 'Biaya awal, tim teknis, dan maintenance bisa menekan cashflow.',
        },
        venture: {
          label: 'Venture Partnership',
          price: 'Mulai dari Rp 0',
          desc: 'Anda fokus growth, kami handle build dan improvement sistem.',
        },
      },
      steps: {
        kicker: 'Execution Flow',
        title: 'Alur kerja sama yang terstruktur dari awal',
        items: [
          { title: 'Business discovery', description: 'Diskusi masalah user, positioning produk, dan peluang monetisasi paling realistis.' },
          { title: 'Feasibility review', description: 'Evaluasi potensi pasar, unit economics, dan kesiapan operasional tim Anda.' },
          { title: 'Deal structure', description: 'Menetapkan skema bagi hasil, ruang lingkup, dan milestone eksekusi secara transparan.' },
          { title: 'Build and scale', description: 'Eksekusi produk, testing market, lalu optimasi funnel untuk growth berkelanjutan.' },
        ],
      },
      benefits: {
        kicker: 'Strategic Benefits',
        title: 'Model ini memaksa semua pihak fokus ke hasil',
        subtitle: 'Insentif Anda dan tim kami diselaraskan ke revenue growth, bukan hanya deliver project selesai.',
        items: [
          { icon: 'lucide:wallet', title: 'Lower upfront risk', description: 'Mengurangi tekanan cashflow awal tanpa mengorbankan kualitas produk.' },
          { icon: 'lucide:gauge', title: 'Faster go-to-market', description: 'Anda tidak perlu mulai dari nol untuk stack teknis dan proses delivery.' },
          { icon: 'lucide:refresh-ccw', title: 'Continuous iteration', description: 'Produk terus dioptimasi berdasarkan feedback pasar dan data conversion.' },
          { icon: 'lucide:line-chart', title: 'Aligned incentives', description: 'Semakin bisnis bertumbuh, kedua pihak sama-sama mendapatkan hasil.' },
        ],
      },
      partnerFit: {
        label: 'Partner fit checklist',
        title: 'Siapa yang biasanya berhasil',
        requirements: [
          'Masalah user dan target market sudah jelas',
          'Tim siap menjalankan operasional dan akuisisi user',
          'Komitmen kolaborasi jangka menengah-panjang',
          'Orientasi pada growth berbasis data dan execution discipline',
        ],
        targetLabel: 'Target ideal',
        targetDesc: 'Potensi revenue bisnis minimal Rp 50jt+/bulan dalam fase scale.',
      },
      faqs: {
        kicker: 'FAQ',
        title: 'Pertanyaan sebelum memulai venture model',
        items: [
          { question: 'Apakah semua bisnis bisa masuk model ini?', answer: 'Tidak. Kami selektif agar model bagi hasil tetap sehat dan sustainable untuk kedua pihak.' },
          { question: 'Berapa lama sampai bisa launch?', answer: 'Tergantung kompleksitas, tetapi biasanya fase awal bisa berjalan dalam hitungan minggu, bukan bulan panjang.' },
          { question: 'Bagaimana skema bagi hasil ditentukan?', answer: 'Skema ditetapkan berdasarkan effort, risiko, biaya operasional, dan target revenue yang disepakati bersama.' },
        ],
      },
      cta: {
        title: 'Punya ide dan market? Kita uji kelayakan bersama.',
        subtitle: 'Sesi awal fokus pada potensi monetisasi, readiness operasional, dan skema kerjasama yang realistis.',
        ctaPrimary: 'Ajukan Proposal',
        ctaSecondary: 'Chat WhatsApp',
      },
    },
    enterprise: {
      title: 'Custom Enterprise',
      description: 'Kontrol penuh untuk kebutuhan kompleks. Dedikasi server dan kustomisasi alur kerja sesuai standar regulasi.',
      features: [
        'Data Residency (UU PDP Compliant)',
        'Blockchain-Ready Architecture',
        'AI-Powered Competency Graph',
      ],
    },
  },
  // Contact page
  contact: {
    title: 'Hubungi Kami',
    description:
      'Hubungi tim CoreAsia untuk konsultasi strategis terkait produk CoreAsia, venture partnership, dan kebutuhan enterprise.',
    kicker: 'Hubungi Kami',
    hero: {
      title: 'Konsultasi strategi produk <span class="ca-gradient-text">tanpa ribet</span>',
      subtitle: 'Ceritakan kebutuhan bisnis Anda. Tim kami bantu memetakan opsi paling realistis untuk launch, scale, dan monetisasi.',
      ctaPrimary: 'Jadwalkan Konsultasi',
      ctaSecondary: 'Chat via WhatsApp',
    },
    channels: {
      quickResponse: 'Respon cepat',
      title: 'Pilih channel favorit Anda',
      subtitle: 'Untuk respon tercepat, gunakan WhatsApp pada jam kerja.',
      whatsapp: 'WhatsApp',
      email: 'Email',
      businessHours: 'Senin - Jumat, 09.00 - 17.00 WIB',
    },
    form: {
      title: 'Kirim Brief Singkat',
      subtitle: 'Form ini akan mengarahkan pesan Anda ke WhatsApp/email agar tim dapat menindaklanjuti lebih cepat.',
      fields: {
        name: 'Nama lengkap',
        email: 'Email',
        phone: 'No. WhatsApp',
        subject: 'Subjek',
        message: 'Pesan',
        consent: 'Saya menyetujui data ini digunakan untuk tindak lanjut konsultasi.',
      },
      subjects: {
        lms: 'CoreAsia LMS',
        pantau: 'Pantau by CoreAsia',
        leadku: 'LeadKu by CoreAsia',
        pricing: 'Informasi Pricing',
        venture: 'Venture Partnership',
        enterprise: 'Custom Enterprise Solution',
        support: 'Technical Support',
      },
      placeholders: {
        name: 'Nama Anda',
        email: 'nama@email.com',
        phone: '+62 xxx xxxx xxxx',
        subject: 'Pilih subjek',
        message: 'Ceritakan kebutuhan utama Anda',
      },
      messages: {
        whatsappTemplate:
          'Halo CoreAsia, saya ingin konsultasi terkait: {subject}.\n\nNama: {name}\nEmail: {email}\nWhatsApp: {phone}\n\nKebutuhan:\n{message}',
      },
      submit: 'Kirim Brief',
      submitting: 'Memproses...',
      success: 'Brief berhasil diproses. Jika WhatsApp tidak terbuka, cek draft email yang disiapkan otomatis.',
      error: 'Terjadi kendala saat memproses brief. Silakan hubungi WhatsApp langsung.',
      validation: {
        nameRequired: 'Nama wajib diisi',
        emailRequired: 'Email wajib diisi',
        emailInvalid: 'Format email tidak valid',
        subjectRequired: 'Subjek wajib dipilih',
        messageRequired: 'Pesan wajib diisi',
        consentRequired: 'Persetujuan penggunaan data diperlukan sebelum mengirim brief.',
      },
    },
    assets: {
      title: 'Brand Assets',
      subtitle: 'Asset kit terintegrasi untuk kebutuhan brand, favicon, dan social sharing',
      socialAssets: 'Social Preview Assets',
      logoAssets: 'Logo Variants',
      faviconAssets: 'Favicon Pack',
      appIconAssets: 'App Icons & Tiles',
      download: 'Download',
    },
    whatToPrepare: {
      title: 'What to prepare',
      items: [
        'Tujuan bisnis 6-12 bulan ke depan',
        'Segment user dan volume target',
        'Constraint budget dan timeline',
      ],
    },
    schema: {
      name: 'Hubungi CoreAsia',
      description: 'Halaman kontak CoreAsia untuk konsultasi produk, pricing, venture, dan solusi enterprise.',
    },
  },
  // Pricing page
  pricing: {
    title: 'Harga & Paket Layanan',
    description:
      'Pilih paket CoreAsia yang sesuai dengan kebutuhan organisasi Anda, dari tim kecil hingga kebutuhan enterprise.',
    kicker: 'Pricing',
    hero: {
      title: 'Pilih plan yang tepat <span class="ca-gradient-text">untuk kebutuhan Anda</span>',
      subtitle:
        'Mulai dari kebutuhan dasar hingga enterprise, kami menyiapkan opsi yang realistis untuk launch, operasional, dan pertumbuhan berikutnya.',
    },
    faq: {
      kicker: 'FAQ',
      title: 'Pertanyaan yang Sering Diajukan',
      intro: 'Belum menemukan jawaban? Hubungi tim kami via',
      contactCta: 'halaman kontak',
      items: [
        {
          question: 'Apakah ada trial gratis?',
          answer:
            'Ya, paket Starter menyediakan trial 14 hari dengan fitur inti yang bisa langsung dicoba tanpa kartu kredit.',
        },
        {
          question: 'Bagaimana cara upgrade atau downgrade plan?',
          answer:
            'Plan dapat disesuaikan sesuai kebutuhan organisasi dan perubahan akan mengikuti siklus billing berikutnya.',
        },
        {
          question: 'Apakah data saya aman?',
          answer:
            'Setiap tenant dipisahkan secara logis, dilindungi dengan kontrol akses yang sesuai, dan backup dilakukan secara berkala.',
        },
        {
          question: 'Bisakah saya meminta fitur custom?',
          answer:
            'Bisa. Kebutuhan custom biasanya dibahas lewat skema enterprise atau scoped delivery setelah sesi konsultasi.',
        },
        {
          question: 'Apa metode pembayaran yang diterima?',
          answer:
            'Pembayaran dapat disesuaikan dengan skema layanan. Tim kami akan menjelaskan opsi invoice dan termin saat proses konsultasi.',
        },
      ],
    },
    allPlansInclude:
      'Semua plan termasuk SSL, backup rutin, dan support teknis untuk kebutuhan operasional dasar.',
    cta: {
      title: 'Siap digitalisasi sertifikasi Anda?',
      subtitle:
        'Mulai dengan trial atau diskusikan kebutuhan organisasi Anda sebelum menentukan plan yang paling tepat.',
      primary: 'Mulai Trial Gratis',
      secondary: 'Konsultasi Dulu',
    },
    schema: {
      name: 'Pricing CoreAsia',
      description: 'Halaman pricing CoreAsia untuk paket LMS, trial, dan kebutuhan enterprise.',
    },
  },
  register: {
    title: 'Daftar Akun Baru',
    description:
      'Buat akun CoreAsia LMS untuk organisasi Anda dan mulai setup workspace tanpa proses manual yang rumit.',
    kicker: 'Registrasi',
    backToPricing: 'Kembali ke Pricing',
    hero: {
      title: 'Buat akun <span class="ca-gradient-text">organisasi baru</span>',
      subtitle: 'Setup hanya 5 menit. Langsung aktif tanpa proses manual.',
    },
    sections: {
      organization: 'Data Organisasi',
      admin: 'Akun Administrator',
    },
    fields: {
      orgName: 'Nama Organisasi',
      slug: 'URL Subdomain',
      orgType: 'Tipe Organisasi',
      fullName: 'Nama Lengkap',
      email: 'Email',
      phone: 'No. Handphone',
      password: 'Password',
      confirmPassword: 'Konfirmasi Password',
    },
    placeholders: {
      orgName: 'PT Sertifikasi Nusantara',
      slug: 'nama-organisasi',
      orgType: 'Pilih tipe organisasi...',
      fullName: 'Nama lengkap Anda',
      email: 'nama@organisasi.id',
      phone: '+62 812 3456 7890',
      password: 'Minimal 8 karakter',
      confirmPassword: 'Ulangi password',
    },
    orgTypes: [
      { value: 'lsp', label: 'LSP (Lembaga Sertifikasi Profesi)' },
      { value: 'training_center', label: 'LPK / Training Center' },
      { value: 'corporate', label: 'Korporat' },
    ],
    slug: {
      suffix: '.coreasia.id',
      helper: 'Huruf kecil dan angka saja. Minimal 3 karakter.',
      available: '{slug}.coreasia.id tersedia',
      usedSuggestion: 'Sudah digunakan. Coba:',
    },
    validation: {
      orgNameRequired: 'Nama organisasi wajib diisi',
      slugMin: 'Subdomain minimal 3 karakter',
      slugFormat: 'Hanya huruf kecil dan angka. Tanpa spasi, dash, atau karakter khusus.',
      slugUnavailable: 'Subdomain sudah digunakan',
      orgTypeRequired: 'Pilih tipe organisasi',
      fullNameRequired: 'Nama lengkap wajib diisi',
      emailRequired: 'Email wajib diisi',
      emailInvalid: 'Format email tidak valid',
      phoneRequired: 'Nomor handphone wajib diisi',
      passwordRequired: 'Password wajib diisi',
      passwordMin: 'Password minimal 8 karakter',
      confirmPasswordRequired: 'Konfirmasi password wajib diisi',
      confirmPasswordMismatch: 'Password tidak cocok',
      agreeRequired: 'Anda harus menyetujui Syarat & Ketentuan',
    },
    payment: {
      unavailable: 'Status pembayaran belum dapat dimuat. Silakan refresh halaman atau hubungi tim kami.',
      provisioning: 'Pembayaran berhasil diterima. Workspace Anda sedang dipersiapkan dan halaman ini akan memperbarui otomatis.',
      failed: 'Pembayaran belum berhasil diproses. Anda bisa melanjutkan pembayaran kembali dari link checkout.',
      review: 'Pembayaran Anda sedang direview oleh payment gateway. Mohon tunggu beberapa saat.',
      pending: 'Pendaftaran sudah tercatat. Silakan lanjutkan pembayaran untuk mengaktifkan workspace Anda.',
      continuePayment: 'Lanjutkan Pembayaran',
    },
    success: {
      createdTitle: 'Pendaftaran Berhasil!',
      readyTitle: 'Workspace Berhasil Dibuat!',
      defaultMessage: 'Akun organisasi {orgName} telah dibuat.',
      subdomainLabel: 'URL Subdomain Anda:',
      backHome: 'Kembali ke Beranda',
    },
    submit: {
      idle: 'Daftar Sekarang',
      loading: 'Mendaftarkan...',
    },
    passwordStrength: {
      weak: 'Lemah',
      fair: 'Cukup',
      good: 'Baik',
      strong: 'Kuat',
      matched: 'Password cocok',
    },
    consent: {
      prefix: 'Saya setuju dengan',
      terms: 'Syarat & Ketentuan',
      and: 'dan',
      privacy: 'Kebijakan Privasi',
    },
    summary: {
      selectedPlan: 'Plan Terpilih',
      changePlan: 'Ubah Plan',
      chooseOther: 'Pilih Plan Lain',
      trustSignals: [
        'Data terenkripsi dan backup harian otomatis',
        'Setup dalam 5 menit, langsung aktif',
        'Support teknis via WhatsApp',
        'Tanpa kartu kredit untuk trial',
      ],
    },
    schema: {
      name: 'Registrasi CoreAsia LMS',
      description: 'Halaman registrasi tenant CoreAsia LMS untuk membuat workspace organisasi baru.',
    },
  },
  // Legal pages
  legal: {
    kicker: 'Legal',
    privacy: {
      title: 'Kebijakan Privasi',
      description: 'Kebijakan privasi CoreAsia menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.',
      lastUpdated: 'Terakhir diperbarui: Februari 2026',
      sections: {
        informationCollected: {
          title: '1. Informasi yang Kami Kumpulkan',
          content: '{company} mengumpulkan informasi yang Anda berikan secara sukarela melalui formulir kontak di website kami, termasuk:',
          items: ['Nama lengkap', 'Alamat email', 'Nomor WhatsApp (opsional)', 'Informasi kebutuhan bisnis yang disampaikan'],
        },
        informationUsage: {
          title: '2. Penggunaan Informasi',
          content: 'Informasi yang dikumpulkan digunakan untuk:',
          items: [
            'Merespons pertanyaan dan permintaan konsultasi Anda',
            'Memberikan informasi tentang layanan kami yang relevan',
            'Meningkatkan kualitas layanan dan pengalaman pengguna',
          ],
        },
        dataProtection: {
          title: '3. Perlindungan Data',
          content: 'Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.',
        },
        dataSharing: {
          title: '4. Pembagian Informasi',
          content: 'Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada pihak ketiga. Informasi hanya dibagikan jika diperlukan untuk memenuhi permintaan layanan Anda.',
        },
        cookies: {
          title: '5. Cookie dan Teknologi Pelacakan',
          content: 'Website ini menggunakan cookie teknis yang diperlukan untuk fungsi dasar situs. Kami tidak menggunakan cookie pelacakan pihak ketiga tanpa persetujuan Anda.',
        },
        userRights: {
          title: '6. Hak Anda',
          content: 'Anda berhak untuk:',
          items: [
            'Meminta akses ke data pribadi Anda',
            'Meminta koreksi data yang tidak akurat',
            'Meminta penghapusan data pribadi Anda',
            'Menarik persetujuan penggunaan data',
          ],
        },
        policyChanges: {
          title: '7. Perubahan Kebijakan',
          content: 'Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diinformasikan melalui halaman ini.',
        },
        contact: {
          title: '8. Hubungi Kami',
          content: 'Untuk pertanyaan terkait kebijakan privasi, hubungi kami di {email}.',
        },
      },
    },
    terms: {
      title: 'Syarat dan Ketentuan',
      description: 'Syarat dan ketentuan penggunaan layanan CoreAsia. Harap baca dengan seksama sebelum menggunakan layanan kami.',
      lastUpdated: 'Terakhir diperbarui: Februari 2026',
      sections: {
        generalTerms: {
          title: '1. Ketentuan Umum',
          content: 'Dengan mengakses dan menggunakan website {company}, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini.',
        },
        serviceDescription: {
          title: '2. Deskripsi Layanan',
          content: '{company} menyediakan layanan teknologi meliputi:',
          items: [
            'Platform SaaS LMS untuk lembaga sertifikasi dan training center',
            'Program venture partnership dengan model bagi hasil',
            'Solusi enterprise kustom untuk kebutuhan korporasi',
          ],
        },
        websiteUsage: {
          title: '3. Penggunaan Website',
          content: 'Anda setuju untuk:',
          items: [
            'Menggunakan website hanya untuk tujuan yang sah',
            'Tidak melakukan tindakan yang dapat merusak atau mengganggu fungsi website',
            'Memberikan informasi yang akurat pada formulir kontak',
          ],
        },
        intellectualProperty: {
          title: '4. Hak Kekayaan Intelektual',
          content: 'Seluruh konten di website ini termasuk teks, grafis, logo, dan kode sumber merupakan milik {company} dan dilindungi oleh hukum hak cipta Indonesia.',
        },
        liabilityLimitation: {
          title: '5. Batasan Tanggung Jawab',
          content: '{company} berupaya menjaga keakuratan informasi di website ini. Namun, kami tidak menjamin bahwa semua informasi selalu terkini atau bebas kesalahan.',
        },
        serviceAgreement: {
          title: '6. Perjanjian Layanan',
          content: 'Detail perjanjian layanan spesifik (SaaS, venture, enterprise) akan diatur dalam kontrak terpisah antara {company} dan klien.',
        },
        applicableLaw: {
          title: '7. Hukum yang Berlaku',
          content: 'Syarat dan ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia.',
        },
        termsChanges: {
          title: '8. Perubahan Ketentuan',
          content: '{company} berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan berlaku efektif setelah dipublikasikan di halaman ini.',
        },
        contact: {
          title: '9. Hubungi Kami',
          content: 'Untuk pertanyaan terkait syarat dan ketentuan, hubungi kami di {email}.',
        },
      },
    },
  },
  // Error pages
  errors: {
    metaLabel: 'Jika kendala berulang, sertakan kode error ini ke tim kami: ',
    notFound: {
      title: 'Halaman Tidak Ditemukan (404)',
      description: 'Halaman tidak ditemukan. Kembali ke beranda CoreAsia untuk melanjutkan navigasi.',
      statusLabel: 'Error 404',
      pageTitle: 'Oops! Halaman Tidak Ditemukan (404)',
      pageDescription: 'Sepertinya Anda tersesat. Halaman yang Anda cari mungkin telah dipindahkan atau tidak ada.',
      visualTitle: 'Digital path not found',
      visualDescription: 'Page routing map shows disconnected connection. Return to home to continue navigation.',
      progressLabel: 'Path Recovery',
      highlights: [
        {
          icon: 'lucide:map-pinned',
          label: 'Node Status',
          value: 'Route endpoint not active',
        },
        {
          icon: 'lucide:wifi-off',
          label: 'Connection',
          value: 'Page link disconnected',
        },
      ],
      backToHome: 'Kembali ke Beranda',
    },
    serverError: {
      title: 'Terjadi Kesalahan Sistem (500)',
      description: 'Terjadi gangguan sistem sementara. Tim CoreAsia sedang melakukan perbaikan server.',
      statusLabel: 'Error 500',
      pageTitle: 'Terjadi Kesalahan Sistem (500)',
      pageDescription: 'Maaf, ada masalah di sisi server kami. Tim teknis kami sedang memperbaikinya. Silakan coba beberapa saat lagi.',
      visualTitle: 'System recovery in progress',
      visualDescription: 'Cluster server kami sedang distabilkan. Proses recovery dipantau otomatis agar layanan kembali normal.',
      progressLabel: 'Recovery Progress',
      highlights: [
        {
          icon: 'lucide:wrench',
          label: 'Maintenance',
          value: 'Service patch being applied',
        },
        {
          icon: 'lucide:activity',
          label: 'Health Check',
          value: 'Server performance validation active',
        },
      ],
      reload: 'Reload Page',
      contactSupport: 'Contact Support',
    },
    maintenance: {
      title: 'Sedang Dalam Pemeliharaan',
      description: 'CoreAsia sedang melakukan pemeliharaan sistem untuk peningkatan performa platform.',
      statusLabel: 'Maintenance Mode',
      pageTitle: 'Sedang Dalam Pemeliharaan',
      pageDescription: 'Kami sedang meningkatkan performa platform CoreAsia. Kami akan segera kembali.',
      visualTitle: 'Platform upgrade in progress',
      visualDescription: 'Infrastructure optimization is running to improve stability and platform speed.',
      progressLabel: 'Upgrade Timeline',
      highlights: [
        {
          icon: 'lucide:cpu',
          label: 'System Upgrade',
          value: 'Resource tuning and cache refresh',
        },
        {
          icon: 'lucide:activity',
          label: 'Deployment',
          value: 'Rollout without data loss',
        },
      ],
      estimatedCompletion: 'Estimasi selesai 03.30 WIB',
    },
  },
  // Components
  components: {
    brand: {
      tagline: 'Mitra Teknologi Strategis',
    },
    header: {
      ariaLabel: 'Main Navigation',
      mobileMenuAriaOpen: 'Buka menu',
      mobileMenuAriaClose: 'Tutup menu',
      ctaText: 'Konsultasi',
      responseTime: 'Respon tim',
      businessHours: 'Senin - Jumat, 09.00 - 17.00 WIB',
    },
    themeToggle: {
      label: 'Tema',
      light: 'Terang',
      dark: 'Gelap',
      switchToLight: 'Aktifkan mode terang',
      switchToDark: 'Aktifkan mode gelap',
    },
    backToTop: {
      ariaLabel: 'Kembali ke atas',
    },
    footer: {
      copyright: 'All rights reserved.',
      description:
        'CoreAsia membangun produk digital dan model kerja sama strategis untuk organisasi yang ingin launch lebih cepat, scale lebih rapi, dan memonetisasi layanan dengan lebih serius.',
      chips: ['Product-Led Delivery', 'SaaS & Venture Model', 'Jakarta, Indonesia'],
      links: {
        products: 'Produk',
        partnerships: 'Kerja Sama',
        contact: 'Kontak',
        privacy: 'Privacy Policy',
        terms: 'TOS',
      },
      productLinks: [
        { label: 'Pantau', to: '/products/pantau' },
        { label: 'Build by CoreAsia', to: '/products/build' },
      ],
      partnershipLinks: [
        { label: 'SaaS Subscription', to: '/pricing' },
        { label: 'Venture Partnership', to: '/solutions/venture' },
        { label: 'Enterprise Custom', to: '/contact?subject=enterprise' },
      ],
    },
    trustedBy: {
      ariaLabel: 'Trusted by partners',
      title: 'Trusted By',
    },
    liveTicker: {
      stats: [
        {
          label: 'Sertifikasi Terproses',
          value: '1.2M+',
          icon: 'lucide:file-check',
        },
        {
          label: 'Uptime Platform',
          value: '99.99%',
          icon: 'lucide:server',
        },
        {
          label: 'Mitra Lembaga',
          value: '500+',
          icon: 'lucide:building',
        },
        {
          label: 'Pengguna Aktif',
          value: '50k+',
          icon: 'lucide:users',
        },
      ],
    },
    serviceCard: {
      learnDetail: 'Pelajari Detail',
    },
    threeHeroScene: {
      label: 'CoreAsia Product Orbit',
      webGLLabel: 'WebGL Product Scene',
      loading: 'Menyiapkan 3D scene...',
      fallback: 'Mode visual fallback aktif untuk perangkat ini.',
    },
    fallbackState: {
      statusLabel: 'Error',
      title: 'Terjadi Kesalahan',
      description: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi support.',
      visualTitle: 'System Status',
      visualDescription: 'Sistem sedang diperiksa untuk mengidentifikasi masalah.',
      progressLabel: 'Progress',
      components: ['statusLabel', 'title', 'description', 'progressLabel', 'highlights'],
    },
  },
  // SEO
  seo: {
    defaultTitle: 'CoreAsia Teknologi - Strategic Technology Partner',
    defaultDescription:
      'Ekosistem produk digital dan mitra teknologi strategis untuk sertifikasi, monitoring web, CRM, serta model pertumbuhan berbasis SaaS dan venture.',
    siteName: 'CoreAsia Teknologi',
    tagline: 'Strategic Technology Partner',
    domain: 'coreasia.id',
    url: 'https://coreasia.id',
    ogImage: '/social/og-image.png',
    twitterImage: '/social/twitter-card.webp',
  },
} as const

type ContentRecord = Record<string, any>

const mergeLocaleContent = <T extends ContentRecord>(base: T, overrides: Partial<T>): T => {
  if (Array.isArray(base)) {
    return (Array.isArray(overrides) ? overrides : base) as T
  }

  const merged: ContentRecord = { ...base }

  for (const key of Object.keys(overrides)) {
    const baseValue = base[key]
    const overrideValue = overrides[key]

    if (overrideValue === undefined) {
      continue
    }

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      merged[key] = mergeLocaleContent(baseValue, overrideValue as Partial<typeof baseValue>)
      continue
    }

    merged[key] = overrideValue
  }

  return merged as T
}

const EN_CONTENT = mergeLocaleContent(ID_CONTENT, {
  nav: {
    home: 'Home',
    products: 'Products',
    partnerships: 'Engagement Models',
    about: 'About Us',
    contact: 'Contact',
    pricing: 'Pricing',
  },
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    learnMore: 'Learn more',
    search: 'Search',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    download: 'Download',
    noResults: 'No results found.',
  },
  home: {
    title: 'CoreAsia - Digital Product Ecosystem for Growing Businesses',
    description:
      'CoreAsia builds digital products and strategic engagement models for certification, web monitoring, CRM, and enterprise operations that need room to grow.',
    hero: {
      // v1: 'Move faster with the CoreAsia product ecosystem.'
      // v1: 'From certification operations to web monitoring and multi-workspace CRM, CoreAsia helps you choose the right product and engagement model for launch, scale, and monetization.'
      title: 'Faster digital execution, cleaner ops, <span class="ca-gradient-text">ready to scale</span>.',
      subtitle:
        'CoreAsia provides products and engagement models that help your business launch faster without building from scratch.',
      ctaPrimary: 'Discuss Your Needs',
      powerStatement:
        'One ecosystem, many solutions — from certification to monitoring to CRM, CoreAsia helps you launch faster and scale smarter.',
      chips: ['Product Ecosystem', 'Growth Partnership', 'Enterprise Delivery'],
    },
    products: {
      kicker: 'Our Products',
      title: 'Choose the product that fits your team',
      subtitle:
        'Each product solves a focused operational problem while still fitting into a broader ecosystem built for business growth.',
      items: [
        {
          name: 'Pantau by CoreAsia',
          badge: 'Live',
          tagline: 'Web Monitoring',
          heroDesc: 'GA4 + Search Console + leads + PDF reports in one easy-to-read dashboard.',
          description:
            'An analytics dashboard that brings GA4, Google Search Console, leads, automated PDF reports, and AI assistant together for freelancers, agencies, and businesses.',
          features: [
            'GA4 & GSC in a single dashboard',
            'Automated PDF reports & scheduling',
            'Leads management & webhook',
            'AI assistant for performance analysis',
          ],
          ctaLabel: 'Explore Pantau',
          to: '/products/pantau',
        },
        {
          name: 'Build by CoreAsia',
          badge: 'Service',
          tagline: 'Web & App',
          heroDesc: 'Websites, web apps, or custom systems — from concept to launch, we deliver.',
          description:
            'Build websites, web apps, or custom systems tailored to your business needs. From landing pages to SaaS platforms, we deliver from concept to launch.',
          features: [
            'Professional websites & landing pages',
            'Custom web applications & dashboards',
            'Third-party API & system integration',
          ],
          ctaLabel: 'View Services',
          to: '/products/build',
        },
      ],
      comingSoon: [
        {
          name: 'CoreAsia LMS',
          badge: 'Coming Soon',
          tagline: 'Certification & Training',
          description:
            'A certification and training management platform for teams that need clean workflows, audit-ready operations, and scalable delivery.',
        },
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Coming Soon',
          tagline: 'Sales CRM',
          description:
            'A multi-workspace CRM for sales teams that need cleaner pipelines, visible team activity, and faster reporting.',
        },
      ],
    },
    engagementModels: {
      kicker: 'Engagement Models',
      title: 'Choose the working model that matches your business stage',
      subtitle:
        'We do not force every client into the same commercial model. The structure should match your readiness, execution needs, and growth target.',
      items: [
        {
          name: 'SaaS Subscription',
          description:
            'Use CoreAsia products as subscription software so your team can launch faster without building from scratch.',
          features: [
            'Faster go-live',
            'More controlled upfront cost',
            'Iterative product maintenance',
          ],
          ctaLabel: 'View Pricing',
          to: '/pricing',
        },
        {
          name: 'Venture Partnership',
          description:
            'A revenue-aligned collaboration model for businesses that have market access but want to reduce the burden of upfront tech investment.',
          features: [
            'Growth-aligned incentives',
            'Strategy and delivery move together',
            'Focus on traction and monetization',
          ],
          ctaLabel: 'View Venture Model',
          to: '/solutions/venture',
        },
        {
          name: 'Enterprise Custom',
          description:
            'A tailored approach for organizations that need integration, workflow design, compliance, or more complex delivery structures.',
          features: [
            'Operational scoping based on your needs',
            'Flexible workflows and integrations',
            'Fit for enterprise and regulated use cases',
          ],
          ctaLabel: 'Discuss Enterprise',
          to: '/contact?subject=enterprise',
        },
      ],
    },
    readyCTA: {
      title: 'Ready to choose the right product or engagement model?',
      subtitle:
        'Tell us where your business is heading. We will help map the most realistic path for implementation, launch, and the next stage of growth.',
      ctaPrimary: 'Book a Consultation',
      ctaSecondary: 'Chat via WhatsApp',
    },
  },
  productsPage: {
    title: 'CoreAsia Products & Services',
    description:
      'Explore CoreAsia products and services for website monitoring, custom web/app development, and digital solutions built to scale.',
    hero: {
      kicker: 'Products & Services',
      title: 'Find the <span class="ca-gradient-text">products and services</span> that best fit your digital needs.',
      subtitle:
        'From website performance monitoring to custom web and app development, CoreAsia helps your business operate faster and smarter.',
      ctaPrimary: 'Discuss Your Needs',
      ctaSecondary: 'View Pricing',
      chips: ['Website Analytics', 'Digital Build', 'Custom Solutions'],
    },
    highlights: {
      title: 'A faster way to choose the right product',
      items: [
        {
          title: 'Start from the main bottleneck',
          description:
            'If your bottleneck sits in certification, website visibility, or sales pipeline execution, begin with the product that directly addresses it.',
          icon: 'lucide:target',
        },
        {
          title: 'Launch lean, scale in stages',
          description:
            'The products are designed so you can start with the most urgent operational need without overbuilding too early.',
          icon: 'lucide:rocket',
        },
        {
          title: 'Keep the next integration path open',
          description:
            'As the business grows, CoreAsia can extend into enterprise delivery or a broader partnership model when needed.',
          icon: 'lucide:git-branch-plus',
        },
      ],
    },
    cta: {
      title: 'Still comparing which option is the most realistic?',
      subtitle:
        'Share your workflow, revenue target, or team context and we will help point you to the product with the strongest fit.',
      ctaPrimary: 'Contact CoreAsia',
      ctaSecondary: 'WhatsApp',
    },
  },
  partnershipsPage: {
    title: 'CoreAsia Engagement Models - SaaS, Venture, and Enterprise',
    description:
      'Understand CoreAsia engagement models for SaaS subscription, venture partnership, and enterprise delivery based on business stage and operational complexity.',
    hero: {
      kicker: 'Engagement Models',
      title: 'Choose the <span class="ca-gradient-text">engagement model</span> that fits your business stage realistically.',
      subtitle:
        'CoreAsia does not force every client into the same delivery structure. Each model balances launch speed, upfront investment, and room to grow.',
      ctaPrimary: 'Strategic Consultation',
      ctaSecondary: 'View Products',
      chips: ['Subscription SaaS', 'Venture Partnership', 'Enterprise Delivery'],
    },
    principles: {
      title: 'A simple framework to choose the right model',
      items: [
        {
          title: 'Launch speed',
          description:
            'If you want to go live quickly with lower delivery risk, the SaaS model is usually the most efficient starting point.',
          icon: 'lucide:gauge',
        },
        {
          title: 'Monetization readiness',
          description:
            'If the business has market access but wants to reduce early technology burden, venture partnership may be more relevant.',
          icon: 'lucide:hand-coins',
        },
        {
          title: 'Operational complexity',
          description:
            'If your needs involve integration, custom workflow design, or compliance, enterprise delivery is often the better fit.',
          icon: 'lucide:building-2',
        },
      ],
    },
    cta: {
      title: 'Need help choosing the right delivery model?',
      subtitle:
        'We can help map whether your current need is better served by SaaS subscription, venture, or enterprise execution.',
      ctaPrimary: 'Discuss Engagement Options',
      ctaSecondary: 'WhatsApp',
    },
  },
  about: {
    title: 'About Us - Strategic Technology Partner',
    description:
      'Get to know CoreAsia as an early-stage strategic technology partner building the foundation for digital products, certification workflows, and operational systems that can scale cleanly.',
    hero: {
      title: 'Building <span class="ca-gradient-text">digital infrastructure for the future</span>',
      subtitle:
        'CoreAsia is in its early stage of building a product ecosystem focused on digital certification, website monitoring, CRM, and realistic delivery models for growth.',
      ctaPrimary: 'Contact Us',
      ctaSecondary: 'WhatsApp',
    },
    schema: {
      name: 'About CoreAsia',
      description: 'Company profile and vision of CoreAsia Teknologi.',
    },
    whyUs: {
      title: 'Why CoreAsia',
      subtitle: 'Technology designed for business growth',
      values: [
        {
          title: 'High Performance',
          description: 'Solutions optimized for speed, clarity, and sustainable scalability.',
          icon: 'lucide:zap',
        },
        {
          title: 'Data Integrity',
          description: 'Security, traceability, and data quality remain part of the delivery baseline.',
          icon: 'lucide:shield-check',
        },
        {
          title: 'Future Proof',
          description: 'Technology decisions are prepared so products can evolve with the client business.',
          icon: 'lucide:bar-chart-3',
        },
      ],
    },
    journey: {
      title: 'What We Are Building Now',
      subtitle: 'Not an inflated company history, but a roadmap we are intentionally building step by step.',
      events: [
        {
          year: 'Start',
          title: 'Founding Stage',
          description: 'CoreAsia is starting by building a clear brand foundation, delivery rhythm, and sharper product positioning.',
          icon: 'lucide:sprout',
        },
        {
          year: 'Focus',
          title: 'Flagship Product Validation',
          description: 'CoreAsia LMS acts as the first proving ground for workflow quality, market fit, and delivery discipline.',
          icon: 'lucide:graduation-cap',
        },
        {
          year: 'Build',
          title: 'Product Ecosystem Rollout',
          description: 'Pantau and LeadKu are being prepared in stages so CoreAsia grows as a real product ecosystem, not a single-product story.',
          icon: 'lucide:boxes',
        },
        {
          year: 'Scale',
          title: 'Strategic Partnership Expansion',
          description: 'Once the product foundation is stronger, CoreAsia will expand into more mature venture collaboration and enterprise execution.',
          icon: 'lucide:handshake',
        },
      ],
    },
    leadership: {
      title: 'Leadership',
      subtitle: 'Founder-led direction with pragmatic execution',
      name: 'Dedi - Founder & Principal Tech Lead',
      description:
        'CoreAsia is being built directly by its founder with a focus on product foundation, delivery quality, and realistic monetization instead of performative scale.',
      chips: ['Founder-Led', 'Product Strategy', 'Execution-First'],
    },
    readyCTA: {
      title: 'Ready to strengthen your digital operations?',
      subtitle:
        'Discuss your product direction, delivery model, or operational challenge with the CoreAsia team.',
      ctaPrimary: 'Contact Us',
      ctaSecondary: 'WhatsApp',
    },
  },
  pricing: {
    title: 'Pricing & Service Plans',
    description:
      'Choose the CoreAsia LMS plan that matches your organization, from smaller teams to enterprise-ready needs.',
    hero: {
      title: 'Choose the right plan <span class="ca-gradient-text">for your organization</span>',
      subtitle:
        'From lean certification teams to enterprise programs, we provide options that match launch speed, operational needs, and growth targets.',
    },
    faq: {
      title: 'Frequently Asked Questions',
      intro: 'Still need clarification? Reach out through our',
      contactCta: 'contact page',
      items: [
        {
          question: 'Is there a free trial?',
          answer:
            'Yes. The Starter plan includes a 14-day trial so your team can evaluate the core workflow without upfront commitment.',
        },
        {
          question: 'How do plan upgrades or downgrades work?',
          answer:
            'Plans can be adjusted based on operational changes, and the update will follow the next billing cycle.',
        },
        {
          question: 'Is our data secure?',
          answer:
            'Tenant access is isolated logically, operational access is controlled, and backups are handled on a recurring basis.',
        },
        {
          question: 'Can we request custom features?',
          answer:
            'Yes. Custom requirements are usually scoped through enterprise delivery or a separate implementation discussion.',
        },
        {
          question: 'What payment options are available?',
          answer:
            'Payment terms depend on the service model. Our team will explain invoice and payment options during consultation.',
        },
      ],
    },
    allPlansInclude:
      'All plans include SSL, recurring backups, and technical support for baseline operational needs.',
    cta: {
      title: 'Ready to digitize your certification workflow?',
      subtitle:
        'Start with a trial or discuss your organizational needs before choosing the most suitable plan.',
      primary: 'Start Free Trial',
      secondary: 'Talk First',
    },
    schema: {
      name: 'CoreAsia Pricing',
      description: 'CoreAsia pricing page for LMS plans, trial options, and enterprise needs.',
    },
  },
  register: {
    title: 'Create a New Account',
    description:
      'Create a CoreAsia LMS account for your organization and start provisioning your workspace without a manual setup process.',
    kicker: 'Registration',
    backToPricing: 'Back to Pricing',
    hero: {
      title: 'Create a <span class="ca-gradient-text">new organization account</span>',
      subtitle: 'Setup takes around 5 minutes and can go live without manual provisioning.',
    },
    sections: {
      organization: 'Organization Details',
      admin: 'Administrator Account',
    },
    fields: {
      orgName: 'Organization Name',
      slug: 'Subdomain URL',
      orgType: 'Organization Type',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    },
    placeholders: {
      orgName: 'Nusantara Certification Ltd.',
      slug: 'your-organization',
      orgType: 'Choose organization type...',
      fullName: 'Your full name',
      email: 'name@organization.id',
      phone: '+62 812 3456 7890',
      password: 'Minimum 8 characters',
      confirmPassword: 'Repeat your password',
    },
    orgTypes: [
      { value: 'lsp', label: 'Professional Certification Body' },
      { value: 'training_center', label: 'Training Center' },
      { value: 'corporate', label: 'Corporate' },
    ],
    slug: {
      suffix: '.coreasia.id',
      helper: 'Lowercase letters and numbers only. Minimum 3 characters.',
      available: '{slug}.coreasia.id is available',
      usedSuggestion: 'Already taken. Try:',
    },
    validation: {
      orgNameRequired: 'Organization name is required',
      slugMin: 'Subdomain must be at least 3 characters',
      slugFormat: 'Only lowercase letters and numbers. No spaces, dashes, or special characters.',
      slugUnavailable: 'Subdomain is already taken',
      orgTypeRequired: 'Please choose an organization type',
      fullNameRequired: 'Full name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      phoneRequired: 'Phone number is required',
      passwordRequired: 'Password is required',
      passwordMin: 'Password must be at least 8 characters',
      confirmPasswordRequired: 'Please confirm your password',
      confirmPasswordMismatch: 'Passwords do not match',
      agreeRequired: 'You must agree to the Terms and Conditions',
    },
    payment: {
      unavailable: 'Payment status could not be loaded yet. Please refresh the page or contact our team.',
      provisioning: 'Payment has been received. Your workspace is being prepared and this page will update automatically.',
      failed: 'Payment has not been completed successfully. You can continue the payment from the checkout link.',
      review: 'Your payment is currently under review by the payment gateway. Please wait a moment.',
      pending: 'Registration has been recorded. Please continue payment to activate your workspace.',
      continuePayment: 'Continue Payment',
    },
    success: {
      createdTitle: 'Registration Successful!',
      readyTitle: 'Workspace Ready!',
      defaultMessage: 'The organization account {orgName} has been created.',
      subdomainLabel: 'Your subdomain URL:',
      backHome: 'Back to Home',
    },
    submit: {
      idle: 'Create Account',
      loading: 'Creating Account...',
    },
    passwordStrength: {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
      matched: 'Passwords match',
    },
    consent: {
      prefix: 'I agree to the',
      terms: 'Terms & Conditions',
      and: 'and',
      privacy: 'Privacy Policy',
    },
    summary: {
      selectedPlan: 'Selected Plan',
      changePlan: 'Change Plan',
      chooseOther: 'Choose Another Plan',
      trustSignals: [
        'Encrypted data with recurring daily backups',
        'Setup in minutes with immediate activation',
        'Technical support via WhatsApp',
        'No credit card required for trial',
      ],
    },
    schema: {
      name: 'CoreAsia LMS Registration',
      description: 'Tenant registration page for creating a new CoreAsia LMS workspace.',
    },
  },
  solutions: {
    lms: {
      title: 'SaaS LMS Platform - Online Certification Solution',
      description:
        'Launch your digital academy faster with an all-in-one platform for certification workflow, online exams, and digital certificates.',
      kicker: 'SaaS LMS for Certification',
      hero: {
        title: 'White-label LMS for <span class="ca-gradient-text">online certification</span> that is ready to sell.',
        subtitle:
          'An end-to-end solution for registration, assessment, and digital certificates designed for operational teams that need clean workflows across mobile and desktop.',
        ctaPrimary: 'Request Demo',
        ctaSecondary: 'WhatsApp Sales',
        chips: ['Digital APL-01 & APL-02', 'CBT + essay grading', 'QR certificate validation'],
      },
      detailedFeatures: [
        {
          title: 'Proctored Online Exams',
          description: 'Online exam workflow with proctoring-ready controls to help maintain assessment integrity.',
          icon: 'lucide:shield-alert',
        },
        {
          title: 'Digital Certificates',
          description: 'Issue digital certificates that are easier to validate and protect from misuse.',
          icon: 'lucide:award',
        },
        {
          title: 'Hybrid Class Management',
          description: 'Manage online and offline class operations through a unified workflow.',
          icon: 'lucide:users',
        },
        {
          title: 'Analytics & Reporting',
          description: 'Track participant progress and operational performance through centralized reporting.',
          icon: 'lucide:bar-chart-3',
        },
      ],
      features: [
        'Fraud-resistant digital certificates',
        'White-label delivery',
        'Automated payment invoicing',
      ],
      cta: {
        title: 'Ready to upgrade your training system?',
        subtitle: 'Our team can help you scope setup, migration, and the best rollout path for your organization.',
        button: 'Contact Sales',
      },
    },
    pantau: {
      title: 'Pantau - Complete Website Analytics & Monitoring Dashboard',
      description:
        'Pantau brings GA4, Google Search Console, leads management, automated PDF reports, and AI assistant into one easy-to-read dashboard.',
      kicker: 'Website Analytics Dashboard',
      hero: {
        title:
          'All your website data in <span class="ca-gradient-text">one dashboard that just makes sense</span>.',
        subtitle:
          'Pantau combines Google Analytics, Search Console, leads, automated reports, and AI assistant — so your team can focus on decisions, not data collection.',
        ctaPrimary: 'Try Pantau Free',
        ctaSecondary: 'WhatsApp',
        chips: ['GA4 + GSC', 'Auto PDF Reports', 'AI Assistant', 'Leads & CRM'],
      },
      detailedFeatures: [
        {
          title: 'Google Analytics & Search Console',
          description: 'See sessions, users, page views, bounce rate, clicks, impressions, CTR, and average position in one unified view.',
          icon: 'lucide:bar-chart-3',
        },
        {
          title: 'Automated PDF Reports',
          description: 'Generate website performance reports in PDF format. Schedule weekly, monthly, or quarterly delivery via email.',
          icon: 'lucide:file-text',
        },
        {
          title: 'Leads Management',
          description: 'Manage prospects from multiple sources. Receive leads via webhook from forms, CRM, or other platforms automatically.',
          icon: 'lucide:users',
        },
        {
          title: 'AI Assistant (Dexter)',
          description: 'Ask anything about your website performance. AI helps analyze data and provides actionable recommendations.',
          icon: 'lucide:sparkles',
        },
        {
          title: 'PageSpeed Monitoring',
          description: 'Track PageSpeed Insights scores regularly. Get notified when website performance drops.',
          icon: 'lucide:gauge',
        },
        {
          title: 'Multi-Website & Team',
          description: 'Manage multiple websites in one account. Invite team members with different roles for structured collaboration.',
          icon: 'lucide:globe',
        },
        {
          title: 'Keyword & Page Analysis',
          description: 'Identify the most impactful keywords and pages. Discover untapped SEO opportunities.',
          icon: 'lucide:search',
        },
        {
          title: 'Admin Panel & Billing',
          description: 'Full admin panel to manage users, subscription plans, API usage, broadcast notifications, and audit logs.',
          icon: 'lucide:settings',
        },
      ],
      pricing: {
        label: 'Pricing',
        title: 'Transparent pricing, starting from free',
        subtitle: 'Choose the plan that fits your website count and team needs.',
        plans: [
          {
            name: 'Starter',
            price: 'Free',
            description: 'Get started monitoring 1 website.',
            features: ['1 website', '7-day data', 'Basic GSC', '10 AI queries/day'],
          },
          {
            name: 'Professional',
            price: 'Rp 199,000/mo',
            description: 'Deep analytics for professionals.',
            popular: true,
            features: ['10 websites', '90-day data', 'Full GA4 + GSC', 'PDF reports', '3 team members', '50 AI queries/day'],
          },
          {
            name: 'Business',
            price: 'Rp 499,000/mo',
            description: 'For agencies managing multiple clients.',
            features: ['25 websites', '180-day data', 'White-label', 'Custom report schedule', '10 team members', '100 AI queries/day'],
          },
          {
            name: 'Enterprise',
            price: 'Rp 999,000/mo',
            description: 'Full access without limits.',
            features: ['50 websites', '365-day data', 'API access', 'All Business features', '25 team members', '500 AI queries/day'],
          },
        ],
      },
      audience: {
        label: 'Best Fit',
        title: 'Who gets the most value from Pantau',
        subtitle:
          'Designed for anyone who needs comprehensive web monitoring that stays easy to understand.',
        items: [
          {
            icon: 'lucide:briefcase-business',
            title: 'Freelancers & consultants',
            description: 'Run performance audits, generate PDF reports for clients, and manage leads from multiple projects in one place.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Digital agencies',
            description: 'Monitor dozens of client websites, automate reports, white-label dashboards, and keep team collaboration structured.',
          },
          {
            icon: 'lucide:megaphone',
            title: 'Owners & marketing teams',
            description: 'Read website performance without opening GA4 and GSC separately. Ask AI when you need deeper insight.',
          },
          {
            icon: 'lucide:store',
            title: 'Online businesses & e-commerce',
            description: 'Track traffic, conversions, and visitor sources. Receive leads from website forms directly in the dashboard.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'Start monitoring in 3 steps',
        items: [
          {
            title: '1. Connect your website',
            description: 'Sign in with Google, then select the GA4 and Search Console properties you want to monitor. Setup done in 2 minutes.',
          },
          {
            title: '2. See the full picture',
            description: 'The dashboard instantly shows traffic, keywords, top pages, PageSpeed scores, and performance trends in real-time.',
          },
          {
            title: '3. Take action',
            description: 'Generate PDF reports, analyze with AI, manage incoming leads, and share insights with your team or clients.',
          },
        ],
      },
      cta: {
        title: 'Ready to monitor your website more effectively?',
        subtitle: 'Start free with the Starter plan. Upgrade anytime as your needs grow.',
        button: 'Try Pantau Free',
      },
    },
    custom: {
      title: 'Build by CoreAsia - Websites, Web Apps, and Digital Systems',
      description:
        'CoreAsia helps businesses build professional websites, web applications, and custom systems designed to match your specific needs.',
      kicker: 'Digital Build Service',
      hero: {
        title:
          'Build digital solutions that <span class="ca-gradient-text">truly fit your business needs</span>.',
        subtitle:
          'From high-converting landing pages, internal web apps, to scalable SaaS platforms — we deliver from concept, design, development, to launch.',
        ctaPrimary: 'Free Consultation',
        ctaSecondary: 'WhatsApp',
        chips: ['Website', 'Web App', 'SaaS Platform', 'API Integration'],
      },
      detailedFeatures: [
        {
          title: 'Website & Landing Page',
          description: 'Fast, SEO-friendly, conversion-optimized professional websites. Perfect for company profiles, products, or campaigns.',
          icon: 'lucide:monitor',
        },
        {
          title: 'Web Application',
          description: 'Custom web apps for dashboards, portals, booking systems, inventory, or other operational needs.',
          icon: 'lucide:layout-dashboard',
        },
        {
          title: 'SaaS Platform',
          description: 'Build SaaS products from scratch with multi-tenant architecture, billing, and infrastructure ready to scale.',
          icon: 'lucide:cloud',
        },
        {
          title: 'API & System Integration',
          description: 'Connect your systems with payment gateways, CRM, ERP, Google APIs, or other third-party services.',
          icon: 'lucide:plug',
        },
        {
          title: 'Mobile-Responsive Design',
          description: 'Every project is built mobile-first. Looks perfect on all screen sizes.',
          icon: 'lucide:smartphone',
        },
        {
          title: 'Maintenance & Support',
          description: 'After launch, we stay with you through regular maintenance, monitoring, and feature updates as needed.',
          icon: 'lucide:wrench',
        },
      ],
      process: {
        label: 'Process',
        title: 'From idea to product in 4 stages',
        items: [
          {
            title: '1. Discovery & consultation',
            description: 'We understand your business needs, target users, and goals. From here we determine scope, timeline, and the right technology.',
          },
          {
            title: '2. Design & prototyping',
            description: 'Clean and modern UI/UX design. You can review and provide feedback before development begins.',
          },
          {
            title: '3. Development & testing',
            description: 'Built with clean engineering standards. Every milestone can be reviewed and tested together.',
          },
          {
            title: '4. Launch & maintenance',
            description: 'Production deployment, performance monitoring, and post-launch support to make sure everything runs smoothly.',
          },
        ],
      },
      audience: {
        label: 'Best Fit',
        title: 'Who should use this service',
        subtitle: 'Our custom development service is designed for various business needs, from startups to enterprise.',
        items: [
          {
            icon: 'lucide:rocket',
            title: 'Startups & founders',
            description: 'Validate your product idea with a fast-built MVP without having to recruit your own engineering team.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Businesses going digital',
            description: 'Transform manual processes into more efficient and measurable digital systems.',
          },
          {
            icon: 'lucide:briefcase-business',
            title: 'Agencies & consultants',
            description: 'Need a development partner for client projects? We can be your extended team.',
          },
          {
            icon: 'lucide:shield-check',
            title: 'Enterprise & government',
            description: 'Custom systems with strict security and compliance standards, backed by complete documentation.',
          },
        ],
      },
      techStack: {
        label: 'Tech Stack',
        title: 'Technologies we use',
        subtitle: 'We are not limited to specific technologies. Here are some we frequently use — and we are always open to adapting to your project needs.',
        items: [
          'Nuxt.js / Next.js',
          'Vue.js / React',
          'Go / Node.js',
          'Python / FastAPI',
          'PostgreSQL / MySQL',
          'Redis / MongoDB',
          'Docker & CI/CD',
          'Tailwind CSS',
          'TypeScript',
          'REST & GraphQL API',
          'AWS / GCP / VPS',
          'WordPress / Headless CMS',
        ],
        moreLabel: 'And other technologies based on your project needs',
      },
      cta: {
        title: 'Have a project idea? Let\'s discuss.',
        subtitle: 'Free consultation to discuss your needs, scope, and project estimates. No commitment required.',
        button: 'Free Consultation',
      },
    },
    leadku: {
      title: 'LeadKu - Multi-Workspace CRM for Teams That Need a Cleaner Pipeline',
      description:
        'LeadKu helps sales teams keep pipeline, activity, and reporting structured in a lighter multi-workspace CRM.',
      kicker: 'Multi-Workspace CRM',
      hero: {
        title:
          'Clean up your sales pipeline with a <span class="ca-gradient-text">lighter multi-workspace CRM</span>.',
        subtitle:
          'LeadKu is built for teams that need better sales visibility, clearer team activity, and reporting that does not feel heavy.',
        ctaPrimary: 'Request LeadKu Preview',
        ctaSecondary: 'WhatsApp',
        chips: ['Pipeline visibility', 'Team activity tracking', 'Multi-workspace ready'],
      },
      detailedFeatures: [
        {
          title: 'Visible pipeline stages',
          description: 'Track lead and deal movement across each stage without an overly complex CRM setup.',
          icon: 'lucide:kanban-square',
        },
        {
          title: 'Logged team activity',
          description: 'Important follow-up history and sales activity stay clearer for daily review.',
          icon: 'lucide:history',
        },
        {
          title: 'Multi-workspace structure',
          description: 'Separate pipelines across brands, business units, or teams without moving to another system.',
          icon: 'lucide:layers-3',
        },
        {
          title: 'Faster reporting',
          description: 'Managers and owners can read team progress and bottlenecks without manual spreadsheets.',
          icon: 'lucide:line-chart',
        },
      ],
      audience: {
        label: 'Best Fit',
        title: 'LeadKu is most relevant for teams like these',
        subtitle:
          'A good fit for service businesses, agencies, and internal sales teams that want a practical CRM before jumping into heavier tools.',
        items: [
          {
            icon: 'lucide:users',
            title: 'Small to mid sales teams',
            description: 'Helps coordinate leads, follow-up, and deal progress so opportunities do not get lost.',
          },
          {
            icon: 'lucide:briefcase',
            title: 'Agencies and service businesses',
            description: 'Pipelines stay easier to separate by service line, unit, or brand.',
          },
          {
            icon: 'lucide:user-round-check',
            title: 'Founders still leading sales',
            description: 'Gives faster visibility into team activity without a heavy CRM dashboard.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'Cleaner lead management from first touch to closing',
        items: [
          {
            title: 'Route leads to the right workspace',
            description: 'Separate leads and pipelines by brand, division, or team ownership.',
          },
          {
            title: 'Monitor team follow-up',
            description: 'Sales activity is easier to read, so team leads know what is moving and what is stuck.',
          },
          {
            title: 'Review performance faster',
            description: 'Owners or sales managers can read progress and bottlenecks without manual spreadsheet cleanup.',
          },
        ],
      },
      cta: {
        title: 'Need a cleaner CRM without the weight?',
        subtitle: 'Show us your current sales workflow and we will help assess whether LeadKu is enough for your team.',
        button: 'Discuss LeadKu',
      },
    },
    venture: {
      title: 'Venture Partnership',
      description:
        'Accelerate digital business execution with a revenue-aligned partnership model that reduces upfront technology burden.',
      kicker: 'Venture Partnership',
      hero: {
        title:
          'Launch digital products with a <span class="bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent">transparent revenue-sharing</span> model.',
        subtitle:
          'Designed for founders or operators who understand their market but want to reduce the weight of initial technology investment.',
        ctaPrimary: 'Apply for Partnership',
        ctaSecondary: 'Quick Discussion',
        chips: ['Zero upfront option', 'Shared execution model', 'Growth-aligned incentives'],
      },
      relevance: {
        title: 'Why this model matters now',
        subtitle:
          'Many businesses fail to scale not because demand is missing, but because the upfront cost of building product infrastructure is too heavy.',
        buildSelf: {
          label: 'Build internally',
          price: 'Rp 150m+',
          desc: 'Higher upfront cost, technical team dependency, and ongoing maintenance can pressure cashflow.',
        },
        venture: {
          label: 'Venture partnership',
          price: 'Starting from Rp 0',
          desc: 'You stay focused on growth while we handle product build and ongoing system improvement.',
        },
      },
      steps: {
        kicker: 'Execution Flow',
        title: 'A structured partnership flow from the start',
        items: [
          { title: 'Business discovery', description: 'Discuss user problems, product positioning, and the most realistic monetization path.' },
          { title: 'Feasibility review', description: 'Review market potential, unit economics, and the operational readiness of your team.' },
          { title: 'Deal structure', description: 'Define revenue share, delivery scope, and execution milestones in a transparent model.' },
          { title: 'Build and scale', description: 'Execute the product, validate the market, then improve the funnel based on traction and data.' },
        ],
      },
      benefits: {
        kicker: 'Strategic Benefits',
        title: 'A model that keeps both sides focused on outcomes',
        subtitle: 'Incentives are aligned to growth and monetization, not just project delivery.',
        items: [
          { icon: 'lucide:wallet', title: 'Lower upfront risk', description: 'Reduce initial cashflow pressure without compromising execution quality.' },
          { icon: 'lucide:gauge', title: 'Faster go-to-market', description: 'Move faster because the technology stack and delivery workflow do not start from zero.' },
          { icon: 'lucide:refresh-ccw', title: 'Continuous iteration', description: 'The product keeps improving based on market feedback and conversion insight.' },
          { icon: 'lucide:line-chart', title: 'Aligned incentives', description: 'As the business grows, both parties benefit from the upside.' },
        ],
      },
      partnerFit: {
        label: 'Partner fit checklist',
        title: 'Who usually succeeds in this model',
        requirements: [
          'A clear user problem and target market',
          'A team ready to run operations and user acquisition',
          'Commitment to medium-to-long-term collaboration',
          'Growth mindset backed by data and execution discipline',
        ],
        targetLabel: 'Ideal target',
        targetDesc: 'Business potential with meaningful monthly revenue or a validated path toward repeatable growth.',
      },
      faqs: {
        kicker: 'FAQ',
        title: 'Questions before starting a venture model',
        items: [
          { question: 'Can every business use this model?', answer: 'No. We stay selective so the partnership remains healthy and sustainable for both sides.' },
          { question: 'What does zero upfront mean?', answer: 'It means the initial structure can be adjusted so the technology burden does not fully land on the partner at the beginning.' },
          { question: 'How is revenue sharing defined?', answer: 'The scheme is discussed case by case based on business model, delivery scope, and operational readiness.' },
          { question: 'Do I still control the business direction?', answer: 'Yes. Business decisions remain collaborative, with clear roles between market execution and technology delivery.' },
        ],
      },
      cta: {
        title: 'Ready to explore a venture partnership?',
        subtitle: 'Tell us your market context, current traction, and execution target. We will assess whether the model fits.',
        ctaPrimary: 'Apply for Partnership',
        ctaSecondary: 'Quick Discussion',
      },
    },
  },
  contact: {
    title: 'Contact Us',
    description:
      'Talk to the CoreAsia team about products, pricing, venture partnership, and enterprise delivery.',
    kicker: 'Contact Us',
    hero: {
      title: 'Discuss your product strategy <span class="ca-gradient-text">without the noise</span>',
      subtitle:
        'Share your business context and we will help map the most realistic product, delivery, and monetization path.',
      ctaPrimary: 'Book a Consultation',
      ctaSecondary: 'Chat via WhatsApp',
    },
    channels: {
      quickResponse: 'Fast response',
      title: 'Choose your preferred channel',
      subtitle: 'For the fastest response, use WhatsApp during business hours.',
      businessHours: 'Monday - Friday, 09.00 - 17.00 WIB',
    },
    form: {
      title: 'Send a Short Brief',
      subtitle: 'This form routes your message to WhatsApp or email so the team can follow up faster.',
      fields: {
        name: 'Full name',
        phone: 'WhatsApp number',
        subject: 'Subject',
        message: 'Message',
        consent: 'I agree that this data may be used for consultation follow-up.',
      },
      subjects: {
        lms: 'CoreAsia LMS',
        pantau: 'Pantau by CoreAsia',
        leadku: 'LeadKu by CoreAsia',
        pricing: 'Pricing Information',
        venture: 'Venture Partnership',
        enterprise: 'Custom Enterprise Solution',
      },
      placeholders: {
        name: 'Your name',
        subject: 'Choose a subject',
        message: 'Tell us your main requirement',
      },
      messages: {
        whatsappTemplate:
          'Hello CoreAsia, I would like to discuss: {subject}.\n\nName: {name}\nEmail: {email}\nWhatsApp: {phone}\n\nRequirement:\n{message}',
      },
      submit: 'Send Brief',
      submitting: 'Processing...',
      success: 'Your brief has been prepared. If WhatsApp does not open, check the email draft that was generated automatically.',
      error: 'Something went wrong while processing the brief. Please contact us directly via WhatsApp.',
      validation: {
        nameRequired: 'Name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        subjectRequired: 'Please choose a subject',
        messageRequired: 'Message is required',
        consentRequired: 'Consent is required before sending the brief.',
      },
    },
    assets: {
      subtitle: 'Integrated asset kit for logo usage, favicons, and social sharing',
    },
    whatToPrepare: {
      items: [
        'Your business target for the next 6-12 months',
        'Target users and expected volume',
        'Budget and timeline constraints',
      ],
    },
    schema: {
      name: 'Contact CoreAsia',
      description: 'CoreAsia contact page for product, pricing, venture, and enterprise consultation.',
    },
  },
  legal: {
    kicker: 'Legal',
    privacy: {
      title: 'Privacy Policy',
      description:
        'CoreAsia privacy policy explains how we collect, use, and protect your personal information.',
      lastUpdated: 'Last updated: February 2026',
      sections: {
        informationCollected: {
          title: '1. Information We Collect',
          content: '{company} collects information that you voluntarily provide through our website forms, including:',
          items: ['Full name', 'Email address', 'WhatsApp number (optional)', 'Business requirements shared through the form'],
        },
        informationUsage: {
          title: '2. How We Use Information',
          content: 'The information collected is used to:',
          items: [
            'Respond to your consultation requests and inquiries',
            'Provide relevant information about our services',
            'Improve service quality and user experience',
          ],
        },
        dataProtection: {
          title: '3. Data Protection',
          content: 'We apply reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.',
        },
        dataSharing: {
          title: '4. Information Sharing',
          content: 'We do not sell, trade, or rent your personal information to third parties. Information is only shared when needed to fulfill your service request.',
        },
        cookies: {
          title: '5. Cookies and Tracking Technologies',
          content: 'This website uses technical cookies required for core functionality. We do not use third-party tracking cookies without consent.',
        },
        userRights: {
          title: '6. Your Rights',
          content: 'You have the right to:',
          items: [
            'Request access to your personal data',
            'Request correction of inaccurate data',
            'Request deletion of your personal data',
            'Withdraw consent for data usage',
          ],
        },
        policyChanges: {
          title: '7. Policy Changes',
          content: 'We may update this privacy policy from time to time. Changes will be communicated through this page.',
        },
        contact: {
          title: '8. Contact Us',
          content: 'For questions about this privacy policy, contact us at {email}.',
        },
      },
    },
    terms: {
      title: 'Terms and Conditions',
      description:
        'Terms and conditions for using CoreAsia services. Please review them carefully before using our services.',
      lastUpdated: 'Last updated: February 2026',
      sections: {
        generalTerms: {
          title: '1. General Terms',
          content: 'By accessing and using the {company} website, you agree to be bound by these terms and conditions.',
        },
        serviceDescription: {
          title: '2. Service Description',
          content: '{company} provides technology services including:',
          items: [
            'SaaS LMS platform for certification bodies and training centers',
            'Venture partnership programs with revenue-sharing models',
            'Custom enterprise solutions for organizational needs',
          ],
        },
        websiteUsage: {
          title: '3. Website Usage',
          content: 'You agree to:',
          items: [
            'Use the website only for lawful purposes',
            'Avoid actions that may damage or disrupt website functionality',
            'Provide accurate information in contact forms',
          ],
        },
        intellectualProperty: {
          title: '4. Intellectual Property',
          content: 'All content on this website, including text, graphics, logos, and source code, belongs to {company} and is protected by applicable copyright law.',
        },
        liabilityLimitation: {
          title: '5. Limitation of Liability',
          content: '{company} strives to keep the information on this website accurate. However, we do not guarantee that all information is always current or error-free.',
        },
        serviceAgreement: {
          title: '6. Service Agreement',
          content: 'Specific service agreements for SaaS, venture, or enterprise work will be governed by separate contracts between {company} and the client.',
        },
        applicableLaw: {
          title: '7. Governing Law',
          content: 'These terms and conditions are governed by the laws of the Republic of Indonesia.',
        },
        termsChanges: {
          title: '8. Changes to Terms',
          content: '{company} may update these terms and conditions at any time. Changes become effective after publication on this page.',
        },
        contact: {
          title: '9. Contact Us',
          content: 'For questions about these terms and conditions, contact us at {email}.',
        },
      },
    },
  },
  errors: {
    metaLabel: 'If the issue continues, share this error code with our team: ',
    notFound: {
      title: 'Page Not Found (404)',
      description: 'The page could not be found. Return to the CoreAsia homepage to continue browsing.',
      statusLabel: 'Error 404',
      pageTitle: 'Oops! Page Not Found (404)',
      pageDescription: 'The page you are looking for may have moved or no longer exists.',
      visualTitle: 'Digital route not found',
      visualDescription: 'The page routing map shows a disconnected path. Return home to continue navigation.',
      progressLabel: 'Path Recovery',
      highlights: [
        {
          icon: 'lucide:map-pinned',
          label: 'Node Status',
          value: 'Route endpoint is inactive',
        },
        {
          icon: 'lucide:wifi-off',
          label: 'Connection',
          value: 'Page link is disconnected',
        },
      ],
      backToHome: 'Back to Home',
    },
    serverError: {
      title: 'System Error (500)',
      description: 'There is a temporary system issue. The CoreAsia team is working to restore normal service.',
      statusLabel: 'Error 500',
      pageTitle: 'A System Error Occurred (500)',
      pageDescription: 'There is an issue on our server side. Our technical team is working on it. Please try again shortly.',
      visualTitle: 'System recovery in progress',
      visualDescription: 'Our server cluster is being stabilized and recovery is monitored automatically.',
      progressLabel: 'Recovery Progress',
      highlights: [
        {
          icon: 'lucide:wrench',
          label: 'Maintenance',
          value: 'Service patch is being applied',
        },
        {
          icon: 'lucide:activity',
          label: 'Health Check',
          value: 'Server performance validation is active',
        },
      ],
      reload: 'Reload Page',
      contactSupport: 'Contact Support',
    },
    maintenance: {
      title: 'Maintenance in Progress',
      description: 'CoreAsia is performing system maintenance to improve platform performance.',
      statusLabel: 'Maintenance Mode',
      pageTitle: 'Maintenance in Progress',
      pageDescription: 'We are improving the CoreAsia platform and will be back shortly.',
      visualTitle: 'Platform upgrade in progress',
      visualDescription: 'Infrastructure optimization is running to improve stability and platform speed.',
      progressLabel: 'Upgrade Timeline',
      estimatedCompletion: 'Estimated completion 03.30 WIB',
    },
  },
  components: {
    brand: {
      tagline: 'Strategic Technology Partner',
    },
    header: {
      ctaText: 'Consult',
      responseTime: 'Team response',
      businessHours: 'Monday - Friday, 09.00 - 17.00 WIB',
    },
    themeToggle: {
      label: 'Theme',
      light: 'Light',
      dark: 'Dark',
      switchToLight: 'Enable light mode',
      switchToDark: 'Enable dark mode',
    },
    backToTop: {
      ariaLabel: 'Back to top',
    },
    footer: {
      description:
        'CoreAsia builds digital products and strategic engagement models for organizations that want faster launch cycles, cleaner scaling, and stronger monetization.',
      links: {
        products: 'Products',
        partnerships: 'Engagement Models',
        contact: 'Contact',
        terms: 'Terms',
      },
      productLinks: [
        { label: 'Pantau', to: '/products/pantau' },
        { label: 'Build by CoreAsia', to: '/products/build' },
      ],
      partnershipLinks: [
        { label: 'SaaS Subscription', to: '/pricing' },
        { label: 'Venture Partnership', to: '/solutions/venture' },
        { label: 'Enterprise Custom', to: '/contact?subject=enterprise' },
      ],
    },
    liveTicker: {
      stats: [
        {
          label: 'Certificates Processed',
          value: '1.2M+',
          icon: 'lucide:file-check',
        },
        {
          label: 'Platform Uptime',
          value: '99.99%',
          icon: 'lucide:server',
        },
        {
          label: 'Institution Partners',
          value: '500+',
          icon: 'lucide:building',
        },
        {
          label: 'Active Users',
          value: '50k+',
          icon: 'lucide:users',
        },
      ],
    },
  },
  seo: {
    defaultTitle: 'CoreAsia Technology - Strategic Technology Partner',
    defaultDescription:
      'A digital product ecosystem and strategic technology partner for certification, web monitoring, CRM, and growth models built around SaaS and venture collaboration.',
  },
})

export const CONTENT = {
  id: ID_CONTENT,
  en: EN_CONTENT,
} as const

// Helper to get content for a locale
export const getContent = (locale: string = DEFAULT_LOCALE) => {
  return CONTENT[locale as keyof typeof CONTENT] || CONTENT.id
}

// Helper to get a specific content path
export const getContentPath = (path: string, locale: string = DEFAULT_LOCALE) => {
  const content = getContent(locale)
  const pathParts = path.split('.')
  let result: any = content

  for (const part of pathParts) {
    result = result?.[part]
  }

  return result
}
