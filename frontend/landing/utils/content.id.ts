const ID_CONTENT = {
  // Navigation
  nav: {
    home: 'Beranda',
    products: 'Produk',
    services: 'Layanan',
    partnerships: 'Kerja Sama',
    solutions: 'Solusi',
    venture: 'Venture',
    about: 'Tentang Kami',
    contact: 'Hubungi Kami',
    pricing: 'Harga',
    articles: 'Artikel',
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
    title: 'CoreAsia - Jasa Pembuatan Website & Aplikasi Web Custom Indonesia',
    description:
      'CoreAsia adalah digital agency Indonesia yang menyediakan jasa pembuatan website, aplikasi web custom, web monitoring dashboard, dan solusi digital enterprise.',
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
      roadmapKicker: 'Roadmap Produk',
      roadmapTitle: 'Produk berikutnya yang sedang disiapkan',
      roadmapSubtitle:
        'LMS dan LeadKu tetap ditampilkan sebagai arah ekosistem CoreAsia, sehingga calon client bisa melihat rencana solusi yang akan tersedia berikutnya.',
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
          ctaLabel: 'Lihat Roadmap LMS',
          to: '/products/lms',
        },
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Coming Soon',
          tagline: 'Sales CRM',
          description:
            'CRM multi-workspace untuk tim sales yang perlu pipeline lebih rapi, aktivitas tim terlacak, dan reporting yang cepat.',
          ctaLabel: 'Lihat Roadmap LeadKu',
          to: '/products/leadku',
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
    services: {
      kicker: 'Layanan Kami',
      title: 'Butuh website atau aplikasi web?',
      subtitle: 'Selain produk digital, kami juga menyediakan jasa pembuatan web profesional untuk berbagai kebutuhan bisnis.',
      items: [
        { label: 'Jasa Pembuatan Website', description: 'Company profile, toko online, landing page — custom & SEO-ready.', to: '/layanan/jasa-pembuatan-website' },
        { label: 'Jasa Pembuatan Aplikasi Web', description: 'Dashboard, portal, sistem manajemen — sesuai kebutuhan bisnis.', to: '/layanan/jasa-pembuatan-aplikasi-web' },
        { label: 'Web Monitoring Dashboard', description: 'Pantau performa website dari satu dashboard yang mudah dipahami.', to: '/layanan/web-monitoring-dashboard' },
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
    title: 'Tentang CoreAsia Teknologi - Digital Agency Jakarta, Indonesia',
    description:
      'CoreAsia Teknologi adalah software house dan digital agency di Jakarta yang membangun produk digital, web monitoring, dan solusi enterprise untuk bisnis di Indonesia.',
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
      title: 'Pantau - Dashboard Analytics Website & SEO Monitoring Indonesia',
      description:
        'Pantau adalah dashboard monitoring website Indonesia yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, AI assistant, dan laporan PDF otomatis. Mulai gratis.',
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
            description: 'Mulai pantau performa website Anda.',
            features: ['1 Website', 'Data 7 hari', '3 AI query/hari', '15 Keyword Ranking', 'Dashboard Analytics'],
          },
          {
            name: 'Professional',
            price: 'Rp 250.000/bln',
            description: 'Analitik mendalam untuk profesional.',
            popular: true,
            features: ['5 Website', 'Data 90 hari', 'GA4 Lengkap + GSC', '30 AI query/hari', '100 Keyword Ranking', '3 SEO Audit/bulan', 'Ekspor PDF & Excel', '3 Anggota Tim'],
          },
          {
            name: 'Business',
            price: 'Rp 600.000/bln',
            description: 'Solusi lengkap untuk agensi dan bisnis.',
            features: ['15 Website', 'Data 180 hari', '60 AI query/hari', '300 Keyword Ranking', '10 SEO Audit/bulan', 'Jadwal Laporan Kustom', '10 Anggota Tim'],
          },
          {
            name: 'Enterprise',
            price: 'Rp 1.500.000/bln',
            description: 'Kelola banyak klien dengan fitur lengkap.',
            features: ['30 Website', 'Data 365 hari', '150 AI query/hari', '500 Keyword Ranking', '20 SEO Audit/bulan', 'API Access', '25 Anggota Tim', 'Prioritas Support'],
          },
          {
            name: 'Self-Hosted',
            price: 'Hubungi Kami',
            description: 'Deploy di server Anda sendiri.',
            features: ['Unlimited Website', 'Unlimited Data Retention', 'Unlimited AI Query', 'Full Source Code', 'Custom Domain & Branding', 'Dedicated Support'],
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
      title: 'Build by CoreAsia - Jasa Development Website & Web App Custom',
      description:
        'Layanan development website dan web app custom oleh CoreAsia. Landing page, company profile, e-commerce, CRM, dan sistem digital — dibangun sesuai kebutuhan bisnis Anda.',
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
    title: 'Hubungi CoreAsia - Konsultasi Gratis Jasa Website & Aplikasi Web',
    description:
      'Hubungi tim CoreAsia untuk konsultasi gratis seputar jasa pembuatan website, aplikasi web custom, web monitoring, dan kebutuhan digital enterprise.',
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
    title: 'Harga & Paket CoreAsia - Jasa Website & Web App Mulai Rp 3 Juta',
    description:
      'Bandingkan harga dan paket layanan CoreAsia: jasa pembuatan website mulai Rp 3 juta, web app custom, dan LMS enterprise. Konsultasi gratis.',
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
  // Keyword-targeted SEO pages
  services: {
    jasaPembuatanWebsite: {
      title: 'Jasa Pembuatan Website Profesional Jakarta - Mulai Rp 3 Juta',
      description: 'Jasa pembuatan website profesional untuk bisnis, UMKM, dan korporasi di Jakarta dan seluruh Indonesia. Landing page, company profile, toko online, dan web app custom dengan harga terjangkau mulai Rp 3 juta.',
      kicker: 'Jasa Pembuatan Web',
      hero: {
        title: 'Jasa pembuatan web profesional yang <span class="ca-gradient-text">membangun kredibilitas</span> bisnis Anda',
        subtitle: 'CoreAsia adalah mitra pembuatan website terpercaya di Indonesia. Website cepat, SEO-ready, dan dirancang untuk menghasilkan konversi — mulai dari company profile hingga web app custom.',
        ctaPrimary: 'Konsultasi Gratis',
        ctaSecondary: 'Lihat Portofolio',
      },
      whyUs: {
        title: 'Mengapa Pilih CoreAsia untuk Pembuatan Web Anda?',
        subtitle: 'Bukan sekadar jasa pembuatan website murah — kami adalah mitra teknologi untuk pertumbuhan bisnis Anda di seluruh Indonesia.',
        items: [
          {
            icon: 'lucide:palette',
            title: 'Design Custom & Responsif',
            description: 'Setiap website dirancang khusus sesuai brand dan kebutuhan bisnis Anda. Tampil sempurna di semua perangkat.',
          },
          {
            icon: 'lucide:zap',
            title: 'Performa & Kecepatan Tinggi',
            description: 'Dibangun dengan teknologi modern untuk kecepatan loading optimal dan pengalaman pengguna yang smooth.',
          },
          {
            icon: 'lucide:search',
            title: 'SEO-Ready dari Awal',
            description: 'Struktur kode, meta tags, dan performa dioptimasi agar website Anda mudah ditemukan di Google.',
          },
          {
            icon: 'lucide:shield-check',
            title: 'Keamanan & Maintenance',
            description: 'SSL, backup otomatis, dan monitoring keamanan memastikan website Anda selalu aman dan stabil.',
          },
          {
            icon: 'lucide:settings',
            title: 'Teknologi Modern',
            description: 'Menggunakan stack terkini seperti Nuxt.js, Vue, Go, dan PostgreSQL untuk hasil yang scalable.',
          },
          {
            icon: 'lucide:headphones',
            title: 'Support Berkelanjutan',
            description: 'Tim teknis siap membantu setelah website launch. Tidak ditinggal begitu saja setelah serah terima.',
          },
        ],
      },
      serviceTypes: {
        title: 'Jenis Website yang Kami Buat',
        subtitle: 'Solusi pembuatan web untuk berbagai kebutuhan bisnis Anda.',
        items: [
          {
            icon: 'lucide:building-2',
            title: 'Website Company Profile',
            description: 'Tampilkan profil perusahaan secara profesional. Cocok untuk UMKM, startup, hingga korporasi yang ingin membangun kehadiran digital.',
            keywords: 'jasa pembuatan web company profile',
          },
          {
            icon: 'lucide:shopping-cart',
            title: 'Toko Online & E-Commerce',
            description: 'Website toko online dengan sistem pembayaran, manajemen produk, dan integrasi pengiriman. Siap jualan dari hari pertama.',
            keywords: 'jasa pembuatan web toko online',
          },
          {
            icon: 'lucide:rocket',
            title: 'Landing Page & Promosi',
            description: 'Halaman khusus untuk kampanye marketing, peluncuran produk, atau promosi bisnis. Dioptimasi untuk konversi tinggi.',
            keywords: 'jasa pembuatan landing page',
          },
          {
            icon: 'lucide:layout-dashboard',
            title: 'Web Application Custom',
            description: 'Aplikasi web sesuai kebutuhan spesifik bisnis Anda — dashboard, sistem manajemen, portal, dan lainnya.',
            keywords: 'jasa pembuatan web app custom',
          },
        ],
      },
      serviceAreas: {
        title: 'Melayani Seluruh Indonesia',
        subtitle: 'Tim kami bekerja secara remote dan melayani klien dari berbagai kota di Indonesia.',
        cities: ['Jakarta', 'Surabaya', 'Bandung', 'Tangerang', 'Bekasi', 'Makassar', 'Semarang', 'Yogyakarta', 'Medan', 'Bali'],
        description: 'Tidak terbatas lokasi — konsultasi dan pengerjaan dilakukan secara online. Anda bisa mendapatkan jasa pembuatan web profesional dari mana saja di Indonesia.',
      },
      pricing: {
        title: 'Estimasi Biaya Pembuatan Website',
        subtitle: 'Biaya pembuatan web bervariasi tergantung jenis, fitur, dan kompleksitas. Berikut gambaran umum:',
        items: [
          { type: 'Landing Page', range: 'Mulai Rp 3 juta', description: 'Satu halaman promosi, responsif, SEO-ready.' },
          { type: 'Company Profile', range: 'Mulai Rp 5 juta', description: '3-7 halaman, design custom, konten manajemen dasar.' },
          { type: 'Toko Online', range: 'Mulai Rp 10 juta', description: 'Katalog produk, keranjang, pembayaran, integrasi pengiriman.' },
          { type: 'Web App Custom', range: 'Mulai Rp 25 juta', description: 'Dashboard, sistem manajemen, fitur khusus sesuai kebutuhan.' },
        ],
        note: 'Harga di atas adalah estimasi. Hubungi kami untuk penawaran sesuai kebutuhan spesifik Anda.',
      },
      process: {
        title: 'Proses Kerja Pembuatan Web',
        subtitle: 'Langkah-langkah pembuatan website yang transparan dan terstruktur.',
        items: [
          { step: '01', title: 'Konsultasi & Brief', description: 'Diskusi kebutuhan, target audiens, dan tujuan website Anda.' },
          { step: '02', title: 'Design & Wireframe', description: 'Pembuatan konsep visual dan struktur halaman sebelum development.' },
          { step: '03', title: 'Development', description: 'Coding dengan teknologi modern, responsif, dan SEO-optimized.' },
          { step: '04', title: 'Testing & Launch', description: 'Pengujian menyeluruh di semua device dan browser, lalu deploy.' },
        ],
      },
      faq: {
        title: 'FAQ — Jasa Pembuatan Website',
        items: [
          { question: 'Berapa lama proses pembuatan website?', answer: 'Tergantung kompleksitas, umumnya 2-6 minggu untuk website company profile, dan 4-12 minggu untuk web app custom.' },
          { question: 'Berapa biaya pembuatan web company profile?', answer: 'Biaya pembuatan web company profile mulai dari Rp 5 juta, tergantung jumlah halaman, fitur, dan kompleksitas design. Hubungi kami untuk penawaran yang sesuai.' },
          { question: 'Apakah jasa pembuatan web CoreAsia melayani di luar Jakarta?', answer: 'Ya, kami melayani klien dari seluruh Indonesia — Jakarta, Surabaya, Bandung, Tangerang, Bekasi, Makassar, dan kota lainnya. Semua proses dilakukan secara online.' },
          { question: 'Apakah bisa request revisi design?', answer: 'Ya, revisi design termasuk dalam paket. Kami memastikan hasil akhir sesuai dengan kebutuhan Anda.' },
          { question: 'Apakah website sudah termasuk hosting dan domain?', answer: 'Kami membantu setup hosting dan domain. Biaya hosting dan domain terpisah dan bisa disesuaikan.' },
          { question: 'Apakah website mobile-friendly?', answer: 'Ya, semua website yang kami buat responsif dan tampil optimal di desktop, tablet, dan smartphone.' },
          { question: 'Apakah ada jasa pembuatan web murah untuk UMKM?', answer: 'Kami menyediakan paket landing page mulai dari Rp 3 juta yang cocok untuk UMKM dan bisnis kecil. Tetap profesional dan SEO-ready.' },
          { question: 'Bagaimana dengan maintenance setelah launch?', answer: 'Kami menyediakan paket maintenance bulanan yang mencakup update, backup, dan support teknis.' },
        ],
      },
      cta: {
        title: 'Siap punya website profesional?',
        subtitle: 'Konsultasikan kebutuhan pembuatan web Anda dengan tim CoreAsia. Gratis, tanpa komitmen.',
        button: 'Hubungi Kami Sekarang',
      },
    },
    webMonitoringDashboard: {
      title: 'Dashboard Monitoring Website - Pantau GA4, GSC & SEO Indonesia',
      description: 'Dashboard monitoring website lengkap yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, dan laporan PDF otomatis. Gratis untuk 1 website.',
      kicker: 'Web Monitoring',
      hero: {
        title: 'Semua data website Anda dalam <span class="ca-gradient-text">satu dashboard</span>',
        subtitle: 'Berhenti buka banyak tab. Pantau GA4, Search Console, leads, dan performa SEO dari satu tempat yang mudah dipahami.',
        ctaPrimary: 'Coba Pantau Gratis',
        ctaSecondary: 'Pelajari Fitur',
      },
      features: {
        title: 'Fitur Lengkap untuk Monitoring Website',
        items: [
          {
            icon: 'lucide:bar-chart-3',
            title: 'Google Analytics 4 Integration',
            description: 'Data traffic, user behavior, dan konversi dari GA4 ditampilkan dalam visualisasi yang mudah dibaca.',
          },
          {
            icon: 'lucide:search',
            title: 'Google Search Console',
            description: 'Pantau ranking keyword, impressions, clicks, dan indexing status langsung dari dashboard.',
          },
          {
            icon: 'lucide:users',
            title: 'Leads Management',
            description: 'Lacak leads dari form website Anda. Terima notifikasi dan kelola pipeline dalam satu tempat.',
          },
          {
            icon: 'lucide:file-text',
            title: 'Laporan PDF Otomatis',
            description: 'Generate laporan performa website secara otomatis dan terjadwal. Cocok untuk report ke klien atau manajemen.',
          },
          {
            icon: 'lucide:brain',
            title: 'AI Performance Assistant',
            description: 'Dapatkan insight dan rekomendasi dari AI berdasarkan data performa website Anda.',
          },
          {
            icon: 'lucide:webhook',
            title: 'Webhook & Notifikasi',
            description: 'Terima notifikasi real-time saat ada leads baru, anomali traffic, atau perubahan ranking.',
          },
        ],
      },
      audience: {
        title: 'Cocok untuk Siapa?',
        items: [
          { icon: 'lucide:briefcase', title: 'Pemilik Bisnis', description: 'Monitor performa website bisnis Anda tanpa perlu memahami tools analytics yang rumit.' },
          { icon: 'lucide:palette', title: 'Freelancer & Agensi', description: 'Kelola monitoring website banyak klien dari satu dashboard. Laporan otomatis hemat waktu.' },
          { icon: 'lucide:megaphone', title: 'Tim Marketing', description: 'Lihat dampak kampanye pada traffic dan leads. Data terintegrasi untuk pengambilan keputusan.' },
        ],
      },
      faq: {
        title: 'FAQ — Web Monitoring Dashboard',
        items: [
          { question: 'Apakah perlu install software?', answer: 'Tidak. Pantau adalah web-based SaaS, cukup login dari browser untuk mengakses dashboard Anda.' },
          { question: 'Berapa website yang bisa dimonitor?', answer: 'Tergantung paket. Paket Starter mendukung 1 website, paket Professional hingga 5, dan Enterprise unlimited.' },
          { question: 'Apakah data aman?', answer: 'Ya. Data diproses dengan koneksi terenkripsi dan disimpan di server yang aman. Kami tidak membagikan data Anda ke pihak ketiga.' },
          { question: 'Bagaimana cara menghubungkan GA4?', answer: 'Cukup otentikasi akun Google Anda dari dashboard Pantau. Proses setup hanya beberapa menit.' },
        ],
      },
      cta: {
        title: 'Mulai monitoring website Anda',
        subtitle: 'Coba Pantau gratis dan lihat semua data website Anda dalam satu dashboard.',
        button: 'Mulai Gratis Sekarang',
      },
    },
    jasaPembuatanAplikasiWeb: {
      title: 'Jasa Pembuatan Aplikasi Web Custom Indonesia - CRM, LMS, ERP',
      description: 'Jasa pembuatan aplikasi web custom untuk bisnis dan enterprise di Indonesia. CRM, LMS, ERP, dashboard, dan sistem internal — dibangun dengan teknologi modern oleh CoreAsia.',
      kicker: 'Web App Development',
      hero: {
        title: 'Aplikasi web custom yang <span class="ca-gradient-text">benar-benar sesuai</span> kebutuhan bisnis',
        subtitle: 'Berhenti menyesuaikan bisnis Anda dengan software generik. Kami bangun aplikasi web yang dirancang khusus untuk proses dan skala operasi Anda.',
        ctaPrimary: 'Konsultasi Gratis',
        ctaSecondary: 'Lihat Produk Kami',
      },
      capabilities: {
        title: 'Apa yang Bisa Kami Bangun?',
        items: [
          { icon: 'lucide:layout-dashboard', title: 'Dashboard & Analytics', description: 'Dashboard bisnis custom dengan visualisasi data real-time untuk pengambilan keputusan.' },
          { icon: 'lucide:users', title: 'CRM & Lead Management', description: 'Sistem CRM yang disesuaikan dengan pipeline dan workflow bisnis Anda.' },
          { icon: 'lucide:graduation-cap', title: 'LMS & E-Learning', description: 'Platform pembelajaran online dengan sertifikasi, ujian, dan tracking progress.' },
          { icon: 'lucide:file-stack', title: 'ERP & Operasional', description: 'Sistem manajemen operasional dari inventory, billing, hingga reporting.' },
          { icon: 'lucide:plug', title: 'API & Integrasi', description: 'Integrasi dengan sistem existing, payment gateway, dan layanan pihak ketiga.' },
          { icon: 'lucide:smartphone', title: 'Progressive Web App', description: 'Aplikasi web yang bisa diinstall dan bekerja seperti native app di mobile.' },
        ],
      },
      techStack: {
        title: 'Teknologi yang Kami Gunakan',
        items: ['Vue.js / Nuxt', 'Go (Golang)', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'REST API', 'MinIO / S3', 'Redis'],
      },
      faq: {
        title: 'FAQ — Jasa Pembuatan Aplikasi Web',
        items: [
          { question: 'Berapa biaya pembuatan aplikasi web?', answer: 'Biaya tergantung kompleksitas. Kami menyediakan estimasi setelah sesi konsultasi dan scoping kebutuhan.' },
          { question: 'Apakah bisa dikembangkan bertahap?', answer: 'Ya, kami mendukung pendekatan MVP (Minimum Viable Product) — launch fitur inti dulu, lalu iterasi berdasarkan feedback.' },
          { question: 'Bagaimana dengan source code?', answer: 'Source code menjadi milik Anda sepenuhnya setelah proyek selesai dan pembayaran lunas.' },
          { question: 'Apakah ada garansi?', answer: 'Ya, kami memberikan garansi bug-fix setelah launch. Durasi garansi disesuaikan dengan lingkup proyek.' },
        ],
      },
      cta: {
        title: 'Punya ide aplikasi web?',
        subtitle: 'Ceritakan kebutuhan Anda, kami bantu dari konsep hingga deployment.',
        button: 'Diskusikan Sekarang',
      },
    },
  },
  // Articles
  blog: {
    title: 'Artikel & Tips SEO, Web Development, Digital Marketing Indonesia',
    description: 'Artikel, panduan, dan tips seputar SEO, web development, digital marketing, dan strategi pertumbuhan bisnis digital di Indonesia.',
    kicker: 'Artikel',
    browseLabel: 'Jelajahi topik',
    browseDescription: 'Pilih kategori yang paling relevan agar daftar artikel terasa lebih terarah saat dibuka dari mobile maupun desktop.',
    showMoreTopics: 'Lihat topik lainnya',
    showLessTopics: 'Sembunyikan topik',
    hero: {
      title: 'Insight & panduan untuk <span class="ca-gradient-text">pertumbuhan digital</span>',
      subtitle: 'Tips, tutorial, dan insight dari tim CoreAsia untuk membantu Anda memahami teknologi dan membuat keputusan bisnis yang lebih baik.',
    },
    readMore: 'Baca selengkapnya',
    readTime: 'menit baca',
    noArticles: 'Belum ada artikel. Nantikan konten terbaru dari kami.',
    defaultAuthor: 'Tim CoreAsia',
    coverEyebrow: 'CoreAsia Journal',
    coverTagline: 'Insight digital yang rapi, relevan, dan siap dieksekusi.',
    relatedTitle: 'Artikel terkait',
    relatedDescription: 'Lanjutkan membaca topik serupa yang masih relevan dengan artikel ini.',
    productsTitle: 'Produk CoreAsia',
    productsDescription: 'Jika topik ini terkait kebutuhan bisnis Anda, eksplor produk CoreAsia yang paling dekat dengan use case tersebut.',
    productsRoadmapTitle: 'Produk lain yang sedang disiapkan',
    noRelatedArticles: 'Belum ada artikel terkait lain untuk ditampilkan.',
    categories: {
      all: 'Semua',
      general: 'Umum',
      bisnis: 'Bisnis & Teknologi',
      seo: 'SEO & Marketing',
      teknologi: 'Teknologi',
      marketing: 'Marketing',
      edukasi: 'Edukasi',
      webDevelopment: 'Web Development',
      business: 'Bisnis & Teknologi',
      tutorial: 'Tutorial',
    },
    cta: {
      title: 'Butuh solusi digital?',
      subtitle: 'Hubungi tim CoreAsia untuk konsultasi tentang kebutuhan teknologi bisnis Anda.',
      button: 'Hubungi Kami',
    },
  },
  // FAQ page (consolidated)
  faqPage: {
    title: 'FAQ - Pertanyaan Umum Seputar Jasa Website & Layanan CoreAsia',
    description: 'Jawaban lengkap pertanyaan umum seputar jasa pembuatan website, aplikasi web custom, web monitoring dashboard, harga, dan proses kerja CoreAsia.',
    kicker: 'FAQ',
    heading: 'Pertanyaan yang Sering Diajukan',
    subtitle: 'Temukan jawaban untuk pertanyaan umum seputar layanan CoreAsia.',
    contactNote: 'Belum menemukan jawaban? Hubungi tim kami via',
    contactCta: 'halaman kontak',
    categories: {
      general: {
        label: 'Umum',
        items: [
          { question: 'Apa itu CoreAsia?', answer: 'CoreAsia Teknologi adalah digital agency dan software house di Jakarta yang membangun produk digital, menyediakan jasa pembuatan website & aplikasi web, serta dashboard monitoring website (Pantau).' },
          { question: 'Apakah CoreAsia melayani di luar Jakarta?', answer: 'Ya, kami melayani klien dari seluruh Indonesia — Surabaya, Bandung, Tangerang, Bekasi, Semarang, Yogyakarta, Medan, Makassar, dan Bali. Semua proses dilakukan secara online.' },
          { question: 'Bagaimana cara memulai kerja sama?', answer: 'Hubungi kami via WhatsApp atau halaman kontak untuk konsultasi gratis. Kami akan membahas kebutuhan Anda dan memberikan proposal yang sesuai.' },
          { question: 'Apakah data saya aman?', answer: 'Ya. Setiap tenant dipisahkan secara logis, dilindungi kontrol akses, dan backup dilakukan secara berkala.' },
        ],
      },
      website: {
        label: 'Jasa Pembuatan Website',
        items: [
          { question: 'Berapa biaya pembuatan website?', answer: 'Landing page mulai dari Rp 3 juta, company profile Rp 5 juta, toko online Rp 10 juta, dan web app custom mulai Rp 25 juta.' },
          { question: 'Berapa lama proses pembuatan website?', answer: 'Umumnya 2-6 minggu untuk company profile, dan 4-12 minggu untuk web app custom tergantung kompleksitas.' },
          { question: 'Apakah website mobile-friendly?', answer: 'Ya, semua website yang kami buat responsif dan tampil optimal di desktop, tablet, dan smartphone.' },
          { question: 'Apakah sudah termasuk hosting dan domain?', answer: 'Kami membantu setup hosting dan domain. Biaya hosting dan domain terpisah dan bisa disesuaikan.' },
          { question: 'Apakah bisa request revisi design?', answer: 'Ya, revisi design termasuk dalam paket. Kami memastikan hasil akhir sesuai kebutuhan Anda.' },
          { question: 'Ada paket murah untuk UMKM?', answer: 'Ya, paket landing page mulai Rp 3 juta cocok untuk UMKM dan bisnis kecil. Tetap profesional dan SEO-ready.' },
          { question: 'Bagaimana dengan maintenance setelah launch?', answer: 'Kami menyediakan paket maintenance bulanan: update, backup, dan support teknis.' },
        ],
      },
      webapp: {
        label: 'Aplikasi Web Custom',
        items: [
          { question: 'Aplikasi web apa saja yang bisa dibuat?', answer: 'CRM, LMS, ERP, dashboard internal, portal pelanggan, sistem inventory, dan berbagai sistem custom lainnya.' },
          { question: 'Teknologi apa yang digunakan?', answer: 'Kami menggunakan Go, Vue/Nuxt, React/Next.js, PostgreSQL, Redis, Docker — dipilih sesuai kebutuhan project.' },
          { question: 'Apakah bisa integrasi dengan sistem yang sudah ada?', answer: 'Ya, kami berpengalaman mengintegrasikan dengan berbagai API dan sistem existing.' },
        ],
      },
      monitoring: {
        label: 'Web Monitoring (Pantau)',
        items: [
          { question: 'Apa itu Pantau?', answer: 'Pantau adalah dashboard monitoring website buatan CoreAsia yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, dan AI assistant dalam satu tempat.' },
          { question: 'Apakah Pantau gratis?', answer: 'Ya, paket Starter gratis untuk 1 website dengan data 7 hari, 3 AI query/hari, dan 15 keyword ranking.' },
          { question: 'Berapa harga paket Pantau?', answer: 'Professional Rp 250.000/bln (5 website), Business Rp 600.000/bln (15 website), Enterprise Rp 1.500.000/bln (30 website). Ada juga opsi Self-Hosted.' },
          { question: 'Apakah Pantau bisa diakses di mobile?', answer: 'Ya, dashboard Pantau responsif dan bisa diakses dari browser di perangkat apa saja.' },
        ],
      },
      pricing: {
        label: 'Harga & Pembayaran',
        items: [
          { question: 'Apakah ada trial gratis?', answer: 'Untuk Pantau, paket Starter sudah gratis selamanya. Untuk jasa website, kami menyediakan konsultasi gratis sebelum Anda memutuskan.' },
          { question: 'Apa metode pembayaran yang diterima?', answer: 'Transfer bank, Virtual Account (BCA, BNI, Mandiri, BRI, Permata), QRIS, dan opsi lainnya melalui payment gateway.' },
          { question: 'Bisakah bayar secara bertahap?', answer: 'Ya, untuk project jasa pembuatan website/web app, pembayaran bisa dicicil sesuai milestone yang disepakati.' },
        ],
      },
    },
  },
  // Portfolio page
  portfolio: {
    title: 'Portfolio & Studi Kasus - Proyek Digital CoreAsia',
    description: 'Lihat portfolio proyek digital CoreAsia: web monitoring dashboard, website profesional, dan aplikasi web custom untuk bisnis di Indonesia.',
    kicker: 'Portfolio',
    heading: 'Proyek yang Sudah Kami Bangun',
    subtitle: 'Dari konsep hingga production — berikut beberapa proyek yang menunjukkan kemampuan tim CoreAsia.',
    items: [
      {
        title: 'Pantau by CoreAsia',
        category: 'SaaS Product',
        description: 'Dashboard monitoring website lengkap yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, AI assistant, dan laporan PDF otomatis. Digunakan untuk memantau performa SEO dan analytics dari satu tempat.',
        tech: ['Go', 'Nuxt 3', 'PostgreSQL', 'Redis', 'Docker', 'Xendit', 'GA4 API', 'GSC API'],
        link: 'https://pantau.coreasia.id',
        highlights: ['4 paket harga (gratis — enterprise)', 'Integrasi Xendit VA + QRIS', 'AI assistant (Dexter)', 'Laporan PDF otomatis'],
      },
      {
        title: 'CoreAsia Landing & CMS',
        category: 'Company Website',
        description: 'Website company profile dan landing page CoreAsia dengan CMS artikel, multi-bahasa (ID/EN), dan SEO-optimized. Built dengan Nuxt 4 SSR + Go API Gateway.',
        tech: ['Nuxt 4', 'Go', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
        highlights: ['Multi-bahasa ID/EN', 'CMS artikel dengan editor rich text', 'SEO schema.org lengkap', 'Prerender + SSR hybrid'],
      },
      {
        title: 'LMS Sertifikasi',
        category: 'Custom Web App',
        description: 'Learning Management System untuk sertifikasi digital — CBT online, manajemen peserta, penjadwalan ujian, dan integrasi BNSP.',
        tech: ['Go', 'Vue 3', 'PostgreSQL', 'MinIO', 'Docker'],
        highlights: ['CBT online dengan timer', 'Manajemen sertifikat digital', 'Multi-tenant', 'BNSP export'],
      },
    ],
    cta: {
      title: 'Punya proyek digital?',
      subtitle: 'Ceritakan ide Anda. Kami bantu dari konsep hingga deployment.',
      button: 'Diskusikan Proyek Anda',
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
        { label: 'Artikel & Insight', to: '/artikel' },
      ],
      partnershipLinks: [
        { label: 'SaaS Subscription', to: '/pricing' },
        { label: 'Venture Partnership', to: '/solutions/venture' },
        { label: 'Enterprise Custom', to: '/contact?subject=enterprise' },
      ],
      serviceLinks: [
        { label: 'Jasa Pembuatan Website', to: '/layanan/jasa-pembuatan-website' },
        { label: 'Web Monitoring Dashboard', to: '/layanan/web-monitoring-dashboard' },
        { label: 'Jasa Pembuatan Aplikasi Web', to: '/layanan/jasa-pembuatan-aplikasi-web' },
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

export default ID_CONTENT
