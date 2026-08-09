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
        'LMS tetap ditampilkan sebagai arah ekosistem CoreAsia, sehingga calon client bisa melihat rencana solusi yang akan tersedia berikutnya.',
      items: [
        {
          name: 'Pantau by CoreAsia',
          badge: 'Live',
          icon: 'lucide:bar-chart-3',
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
          icon: 'lucide:code-2',
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
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Live',
          icon: 'lucide:trending-up',
          tagline: 'Sales CRM',
          heroDesc: 'Lead, pipeline, follow-up, quotation, dan laporan sales dalam satu workspace.',
          description:
            'CRM untuk tim sales Indonesia. Satukan data lead, aktivitas, quotation, invoice, dan laporan manager supaya proses closing lebih terlihat dan tidak ada follow-up yang tertinggal.',
          features: [
            'Pipeline visual & sales funnel',
            'Aktivitas, follow-up, dan reminder',
            'Quotation & invoice terhubung deal',
            'Dashboard, forecast, dan role access',
          ],
          ctaLabel: 'Pelajari LeadKu',
          to: '/products/leadku',
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
      subtitle: 'Selain produk digital, kami juga mengerjakan pembuatan website dan aplikasi web untuk bisnis.',
      items: [
        { label: 'Jasa Pembuatan Website', description: 'Company profile, toko online, dan landing page yang dibangun khusus dan siap SEO.', to: '/layanan/jasa-pembuatan-website' },
        { label: 'Jasa Pembuatan Aplikasi Web', description: 'Dashboard, portal, dan sistem manajemen sesuai kebutuhan bisnis.', to: '/layanan/jasa-pembuatan-aplikasi-web' },
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
    macApps: [
      {
        name: 'CoreAsia Download Manager',
        badge: 'Live',
        icon: 'lucide:download',
        tagline: 'Download Manager macOS',
        description:
          'Download manager premium untuk macOS: simpan video & file dari web dengan satu klik. Engine unduhan cepat multi-koneksi, pemilih kualitas, ekstraksi audio MP3, antrean + riwayat, dan companion browser extension.',
        features: [
          'Auto-capture media via browser extension',
          'Pemilih kualitas & ekstraksi audio MP3',
          'Engine cepat multi-koneksi',
          'Antrean + riwayat tersimpan',
        ],
        ctaLabel: 'Pelajari Download Manager',
        to: '/products/downloader',
      },
      {
        name: 'CoreAsia Mounter',
        badge: 'Live',
        icon: 'lucide:hard-drive',
        tagline: 'NTFS for Mac',
        description:
          'Tulis ke drive NTFS di Mac Apple Silicon. Colok drive — langsung dikenali dan ter-mount otomatis, siap ditulis dari menu bar. Membaca NTFS gratis selamanya.',
        features: [
          'Tulis ke drive NTFS langsung dari menu bar',
          'Mount otomatis setiap kali drive dicolok',
          'Keamanan Mac tetap utuh, data tetap di tempatnya',
          'Sekali bayar $25, lifetime — bukan langganan',
        ],
        ctaLabel: 'Pelajari Mounter',
        to: '/products/mounter',
      },
    ],
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
            features: ['1 Website', 'Data 7 hari', '3 kueri AI per hari', '15 Keyword Ranking', 'Dashboard Analytics'],
          },
          {
            name: 'Professional',
            price: 'Rp 250.000/bln',
            description: 'Analitik mendalam untuk profesional.',
            popular: true,
            features: ['5 Website', 'Data 90 hari', 'GA4 Lengkap + GSC', '30 kueri AI per hari', '100 Keyword Ranking', '3 SEO Audit per bulan', 'Ekspor PDF & Excel', '3 Anggota Tim'],
          },
          {
            name: 'Business',
            price: 'Rp 600.000/bln',
            description: 'Solusi lengkap untuk agensi dan bisnis.',
            features: ['15 Website', 'Data 180 hari', '60 kueri AI per hari', '300 Keyword Ranking', '10 SEO Audit per bulan', 'Jadwal Laporan Kustom', '10 Anggota Tim'],
          },
          {
            name: 'Enterprise',
            price: 'Rp 1.500.000/bln',
            description: 'Kelola banyak klien dengan fitur lengkap.',
            features: ['30 Website', 'Data 365 hari', '150 kueri AI per hari', '500 Keyword Ranking', '20 SEO Audit per bulan', 'API Access', '25 Anggota Tim', 'Prioritas Support'],
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
    downloader: {
      title: 'CoreAsia Download Manager — Unduh Cepat Multi-Koneksi untuk macOS',
      description:
        'CoreAsia Download Manager (CAD) adalah download manager premium untuk macOS (Apple Silicon). Simpan video & file dari web dengan satu klik: engine unduhan cepat multi-koneksi, pemilih kualitas, ekstraksi audio MP3, antrean + riwayat, dan companion browser extension.',
      kicker: 'Download Manager Premium',
      hero: {
        title:
          'Simpan video &amp; file dari web <span class="ca-gradient-text">dengan satu klik</span>.',
        subtitle:
          'CoreAsia Download Manager (CAD) adalah download manager premium untuk macOS & Windows dengan engine unduhan cepat multi-koneksi, pemilih kualitas, ekstraksi audio MP3, serta antrean dan riwayat tersimpan — dalam antarmuka yang bersih dan ringan.',
        ctaPrimary: 'Unduh untuk macOS',
        ctaSecondary: 'Lihat Harga',
        ctaMac: 'Unduh untuk macOS',
        ctaWin: 'Unduh untuk Windows',
        winBadge: 'Beta',
        alsoOther: 'Juga tersedia untuk',
        chips: ['macOS · Windows', 'Multi-koneksi', 'MP3 Audio', 'Privasi-first'],
      },
      workflowAside: {
        label: 'How It Works',
        title: 'Mulai mengunduh dalam 4 langkah',
        installWinDesc:
          'Unduh installer .exe dari coreasia.id, jalankan, lalu ikuti wizard (per-user, tanpa admin) dan buka aplikasi. Coba gratis selama 3 hari.',
        items: [
          {
            title: '1. Pasang & buka aplikasi',
            description:
              'Unduh file .dmg dari coreasia.id, seret ke folder Applications, lalu jalankan. Coba gratis selama 3 hari.',
          },
          {
            title: '2. Pasang extension browser',
            description:
              'Tambahkan companion extension untuk Chrome atau Edge agar media yang bisa diunduh terdeteksi langsung dari browser.',
          },
          {
            title: '3. Tempel tautan atau pakai extension',
            description:
              'Salin URL ke aplikasi, atau biarkan extension mendeteksi media dan mengirimkannya otomatis ke aplikasi.',
          },
          {
            title: '4. Pilih kualitas & unduh',
            description:
              'Pilih resolusi atau ekstrak audio MP3, lalu biarkan engine multi-koneksi menyelesaikan unduhan dengan cepat. Semua tersimpan rapi di antrean & riwayat.',
          },
        ],
      },
      features: {
        label: 'Fitur Utama',
        title: 'Semua yang Anda butuhkan untuk mengunduh',
        subtitle:
          'Dari deteksi media otomatis hingga ekstraksi audio — CoreAsia Download Manager dirancang agar menyimpan apa pun dari web terasa cepat dan rapi.',
        items: [
          {
            title: 'Auto-capture via Extension',
            description:
              'Companion browser extension untuk Chrome & Edge mendeteksi media yang bisa diunduh di halaman dan mengirimkannya langsung ke aplikasi CoreAsia Download Manager di komputer Anda.',
            icon: 'lucide:wand-sparkles',
          },
          {
            title: 'Pemilih Kualitas',
            description:
              'Pilih resolusi video yang Anda inginkan sebelum mengunduh — dari yang hemat ruang hingga kualitas tertinggi yang tersedia.',
            icon: 'lucide:settings-2',
          },
          {
            title: 'Unduhan Cepat Multi-koneksi',
            description:
              'Engine unduhan membuka banyak koneksi sekaligus sehingga file selesai jauh lebih cepat dibanding unduhan satu jalur biasa.',
            icon: 'lucide:zap',
          },
          {
            title: 'Ekstraksi Audio MP3',
            description:
              'Ambil hanya audionya dan simpan sebagai MP3 — cocok untuk musik, podcast, atau materi belajar tanpa video.',
            icon: 'lucide:music',
          },
          {
            title: 'Antrean & Riwayat Tersimpan',
            description:
              'Susun banyak unduhan dalam antrean dan biarkan berjalan berurutan. Riwayat tersimpan sehingga Anda selalu bisa menemukan file lama.',
            icon: 'lucide:list-checks',
          },
          {
            title: 'Antarmuka Bersih & Ringan',
            description:
              'Tata letak yang rapi dan fokus membuat setiap unduhan mudah diatur. Ringan dijalankan dan langsung enak dipakai tanpa perlu belajar.',
            icon: 'lucide:sparkles',
          },
        ],
      },
      workflow: {
        label: 'Cara Pakai',
        title: 'Dari halaman web ke file tersimpan',
        subtitle:
          'Empat langkah sederhana — pasang sekali, lalu simpan apa pun dari browser favorit Anda.',
        steps: [
          {
            title: 'Pasang aplikasi',
            description:
              'Unduh file .dmg lalu seret ke folder Applications. Coba gratis 3 hari.',
          },
          {
            title: 'Pasang extension browser',
            description:
              'Tambahkan companion extension untuk Chrome atau Edge supaya media bisa ditangkap langsung dari halaman.',
          },
          {
            title: 'Klik di browser',
            description:
              'Buka situs apa pun, lalu klik tombol CA Download. Extension juga bisa menangkap media secara otomatis.',
          },
          {
            title: 'Pilih kualitas & unduh',
            description:
              'Atur nama file & kualitas (atau audio MP3), lalu tekan Download. Engine multi-koneksi menyelesaikannya dengan cepat.',
          },
        ],
      },
      platforms: {
        label: 'Platform',
        title: 'Tersedia di macOS, Windows menyusul',
        subtitle:
          'CoreAsia Download Manager hadir lebih dulu untuk macOS (Apple Silicon). Versi Windows sedang disiapkan agar lebih banyak orang bisa menikmati pengalaman yang sama.',
        items: [
          {
            title: 'macOS (Apple Silicon)',
            description:
              'Tersedia sekarang. Unduh file .dmg langsung dari coreasia.id dan mulai dalam hitungan menit.',
            icon: 'lucide:apple',
            badge: 'Tersedia',
            available: true,
          },
          {
            title: 'Windows',
            description:
              'Sedang disiapkan. Versi Windows akan menyusul untuk membawa pengalaman yang sama ke lebih banyak perangkat.',
            icon: 'lucide:monitor',
            badge: 'Menyusul',
            available: false,
          },
        ],
      },
      pricing: {
        label: 'Pricing',
        title: 'Harga sederhana, tanpa langganan',
        subtitle:
          'Coba gratis 3 hari. Setelah itu, beli Lifetime License untuk pemakaian selamanya atau ambil 1-Day Pass untuk kebutuhan sesekali.',
        popularLabel: 'Paling Populer',
        soonLabel: 'Segera hadir',
        plans: [
          {
            name: 'Free Trial',
            action: 'download',
            price: '3 Hari',
            description: 'Coba semua fitur tanpa biaya. Setelah masa coba berakhir, aplikasi perlu diaktivasi.',
            features: [
              'Akses penuh selama 3 hari',
              'Tanpa kartu kredit',
              'Semua fitur inti aktif',
            ],
            cta: 'Mulai Coba Gratis',
          },
          {
            name: 'Lifetime License',
            action: 'buy',
            fsPath: 'coreasia-download-manager',
            price: '$29',
            description: 'Sekali bayar, pakai selamanya (≈ Rp500rb). Pilihan terbaik untuk pemakaian rutin.',
            popular: true,
            features: [
              'Lisensi seumur hidup, sekali bayar',
              'Semua fitur tanpa batas',
              'Aktivasi mudah & cepat',
              'Update untuk versi yang sama',
            ],
            cta: 'Beli Lifetime',
          },
          {
            name: '1-Day Pass',
            action: 'soon',
            price: '$9.90',
            description: 'Butuh sehari saja? Aktifkan akses penuh untuk satu hari pemakaian.',
            features: [
              'Akses penuh selama 1 hari',
              'Cocok untuk kebutuhan sesekali',
              'Tanpa langganan berulang',
            ],
            cta: 'Beli 1-Day Pass',
          },
        ],
      },
      privacy: {
        label: 'Privasi & Lisensi',
        title: 'Dirancang untuk menghormati privasi Anda',
        items: [
          {
            title: 'Aktivasi Mudah',
            description:
              'Aktivasi cukup sekali dan langsung jalan — masukkan lisensi Anda, lalu aplikasi siap dipakai dalam hitungan detik.',
            icon: 'lucide:shield-check',
          },
          {
            title: 'Ramah Privasi',
            description:
              'Aktivitas unduhan Anda tetap di komputer Anda. CoreAsia Download Manager dirancang untuk menghormati privasi sejak awal.',
            icon: 'lucide:lock',
          },
          {
            title: 'Dibuat oleh CoreAsia',
            description:
              'Dikembangkan oleh PT Inti Asia Teknologi (brand CoreAsia). Butuh bantuan? Hubungi kami di hello@coreasia.id.',
            icon: 'lucide:badge-check',
          },
        ],
      },
      related: {
        title: 'Produk Terkait',
        items: [
          {
            title: 'Pantau by CoreAsia',
            description: 'Dashboard analytics & SEO monitoring website',
            icon: 'lucide:bar-chart-3',
            to: '/products/pantau',
          },
          {
            title: 'Build by CoreAsia',
            description: 'Jasa development website & web app custom',
            icon: 'lucide:code-2',
            to: '/products/build',
          },
          {
            title: 'Semua Produk',
            description: 'Jelajahi ekosistem produk & layanan CoreAsia',
            icon: 'lucide:boxes',
            to: '/products',
          },
        ],
      },
      cta: {
        title: 'Siap menyimpan apa pun dari web?',
        subtitle:
          'Unduh CoreAsia Download Manager untuk macOS dan coba gratis selama 3 hari. Pasang juga companion extension untuk auto-capture media dari browser.',
        ctaPrimary: 'Unduh untuk macOS',
        ctaSecondary: 'hello@coreasia.id',
        termsPrefix: 'Dengan mengunduh, Anda menyetujui',
        termsLabel: 'Terms',
        termsAnd: '&amp;',
        privacyLabel: 'Privacy',
        refundLabel: 'Refund',
        termsSuffix: 'CoreAsia Download Manager.',
      },
    },
    mounter: {
      title: 'CoreAsia Mounter — NTFS for Mac: Tulis ke Drive NTFS di Apple Silicon',
      description:
        'CoreAsia Mounter membuka fitur tulis ke drive NTFS di Mac Apple Silicon. Colok drive — langsung dikenali dan ter-mount otomatis, siap ditulis dari menu bar. Membaca NTFS gratis selamanya; fitur tulis $25 sekali bayar, lifetime.',
      kicker: 'NTFS for Mac',
      hero: {
        title:
          'CoreAsia Mounter — tulis ke drive NTFS di <span class="ca-gradient-text">Mac Apple Silicon</span>.',
        subtitle:
          'Colok drive, dan semuanya bekerja otomatis — drive langsung dikenali, ter-mount, dan siap ditulis dari menu bar. Tanpa setup rumit, tanpa mengubah pengaturan Mac Anda. Membaca NTFS gratis selamanya.',
        ctaPrimary: 'Unduh Gratis untuk macOS',
        ctaSecondary: 'Beli $25 Lifetime',
        chips: ['macOS Tahoe · Apple Silicon', 'Mount otomatis', 'Sekali bayar, lifetime'],
      },
      pain: {
        label: 'Masalah → Solusi',
        title: 'Drive NTFS cuma bisa dibaca di Mac?',
        items: [
          {
            title: 'Masalahnya: NTFS read-only di macOS',
            description:
              'macOS membuka drive NTFS hanya untuk dibaca. Mau menyimpan, mengedit, atau menghapus file langsung di drive? Ditolak.',
          },
          {
            title: 'Cara lama: ribet & berisiko',
            description:
              'Solusi lain mengharuskan utak-atik pengaturan Mac, langkah teknis yang rawan salah, atau biaya langganan yang menagih setiap tahun.',
          },
          {
            title: 'Solusinya: CoreAsia Mounter',
            description:
              'Satu aplikasi ringan di menu bar: colok drive, dan drive NTFS Anda langsung siap ditulis — otomatis, aman, tanpa ribet.',
          },
        ],
      },
      security: {
        label: 'Keunggulan',
        title: 'Praktis di depan, aman di belakang',
        subtitle:
          'Semua kerumitan teknis kami tangani di balik layar — Anda cukup colok drive dan langsung bekerja seperti biasa.',
        items: [
          {
            title: 'Mount otomatis',
            description:
              'Setiap drive NTFS yang dicolok langsung dikenali dan ter-mount otomatis. Sekali diatur, selalu siap dipakai.',
            icon: 'lucide:zap',
          },
          {
            title: 'Keamanan Mac tetap utuh',
            description:
              'Tidak ada pengaturan yang perlu diubah atau dimatikan. Perlindungan bawaan Mac Anda tetap bekerja sepenuhnya.',
            icon: 'lucide:shield-check',
          },
          {
            title: 'Tanpa langkah teknis',
            description:
              'Tidak ada perintah yang harus diketik, tidak perlu restart. Semua cukup dari menu bar dengan sekali klik.',
            icon: 'lucide:mouse-pointer-click',
          },
          {
            title: 'Data tetap di tempatnya',
            description:
              'Tanpa format ulang, tanpa pindah-pindah file — drive dan seluruh isinya tetap utuh, tetap bisa dipakai di Windows.',
            icon: 'lucide:hard-drive',
          },
        ],
        engine: {
          badge: 'Andalan',
          title: 'Pasang sekali, bekerja terus',
          description:
            'CoreAsia Mounter berjalan senyap di menu bar dan terus diperbarui mengikuti macOS terbaru. Ada kendala? Tim kami siap membantu via email dengan respons cepat.',
        },
      },
      workflow: {
        label: 'Cara Kerja',
        title: 'Colok → aktifkan → tulis. Selebihnya otomatis.',
        subtitle:
          'Tidak ada setup rumit. Pasang sekali, dan setiap drive NTFS langsung siap dipakai — ter-mount otomatis setiap kali dicolok.',
        steps: [
          {
            title: 'Colok drive',
            description:
              'Hubungkan hardisk atau SSD NTFS ke Mac Anda. CoreAsia Mounter langsung mengenalinya — bahkan tanpa perlu membuka aplikasi.',
          },
          {
            title: 'Aktifkan mode tulis',
            description:
              'Satu klik dari menu bar, mode tulis aktif. Selanjutnya drive ter-mount otomatis setiap kali dicolok — tanpa restart, tanpa diulang.',
          },
          {
            title: 'Langsung tulis',
            description:
              'Copy, edit, rename, dan hapus file di drive NTFS seperti drive biasa. Selesai? Eject seperti biasa.',
          },
        ],
      },
      pricing: {
        label: 'Pricing',
        title: 'Baca gratis selamanya, tulis $25 sekali bayar',
        subtitle:
          'Bukan langganan. Coba fitur tulis gratis 1 hari; setelah trial berakhir, membaca NTFS tetap gratis selamanya. Checkout via Gumroad — harga IDR muncul otomatis saat checkout.',
        popularLabel: 'Paling Populer',
        plans: [
          {
            name: 'Baca Gratis',
            price: 'Gratis',
            description:
              'Membaca dan menyalin file dari drive NTFS — gratis selamanya, bahkan setelah trial berakhir.',
            features: [
              'Baca drive NTFS tanpa batas waktu',
              'Tanpa lisensi, tanpa biaya',
              'Tetap aktif setelah trial berakhir',
            ],
            cta: 'Dapatkan Aplikasinya',
          },
          {
            name: 'Trial 1 Hari',
            price: '1 Hari',
            description:
              'Full-unlock: semua fitur tulis aktif selama 1 hari penuh untuk Anda uji.',
            features: [
              'Semua fitur tulis aktif',
              'Berlaku 1 hari penuh',
              'Setelah trial, baca tetap gratis',
            ],
            cta: 'Coba Gratis 1 Hari',
          },
          {
            name: 'Lifetime License',
            price: '$25',
            popular: true,
            description:
              'Sekali bayar, pakai selamanya — bukan langganan. Harga IDR otomatis saat checkout Gumroad.',
            features: [
              'Sekali bayar, bukan langganan',
              'Semua fitur tulis, selamanya',
              'Mount otomatis setiap drive dicolok',
              'License key dikirim via email',
              'Checkout aman via Gumroad',
            ],
            cta: 'Beli $25 Lifetime',
          },
        ],
      },
      faq: {
        label: 'FAQ',
        title: 'Pertanyaan yang sering diajukan',
        subtitle: 'Masih ada pertanyaan lain? Email kami di support@coreasia.id.',
        items: [
          {
            question: 'Mac dan macOS apa saja yang didukung?',
            answer:
              'CoreAsia Mounter dibuat dan diuji untuk Mac Apple Silicon (chip M-series) dengan macOS Tahoe. Dukungan versi macOS berikutnya menyusul lewat update.',
          },
          {
            question: 'Apakah data saya aman saat menulis ke drive NTFS?',
            answer:
              'Fitur tulis CoreAsia Mounter dibangun di atas teknologi yang sudah teruji bertahun-tahun dan dipakai luas di berbagai platform. Meski begitu, tidak ada perangkat lunak yang 100% bebas risiko: seperti pada media penyimpanan apa pun, biasakan mem-backup data penting sebelum menulis ke drive mana pun.',
          },
          {
            question: 'Bagaimana cara aktivasi setelah membeli?',
            answer:
              'Setelah pembayaran berhasil, license key dikirim otomatis ke email Anda. Buka CoreAsia Mounter, masukkan license key, dan fitur tulis langsung aktif.',
          },
          {
            question: 'Bisa bayar dari Indonesia?',
            answer:
              'Bisa. Checkout via Gumroad menerima kartu debit online seperti Jago, Jenius, atau blu, serta PayPal. Harga tampil dalam IDR otomatis saat checkout. QRIS belum tersedia.',
          },
          {
            question: 'Apa bedanya dengan aplikasi NTFS gratisan atau berlangganan?',
            answer:
              'Solusi gratisan umumnya menuntut langkah teknis yang rumit dan sering bermasalah setelah update macOS. Aplikasi berlangganan menagih terus setiap tahun. CoreAsia Mounter praktis sejak awal — mount otomatis, cukup sekali bayar $25 untuk selamanya, dan keamanan Mac Anda tetap utuh.',
          },
          {
            question: 'Bagaimana kebijakan refund?',
            answer:
              'Pembelian diproses oleh Gumroad sebagai merchant of record, sehingga refund mengikuti kebijakan standar Gumroad.',
          },
        ],
      },
      related: {
        title: 'Produk Terkait',
        items: [
          {
            title: 'CoreAsia Download Manager',
            description: 'Download manager premium untuk macOS',
            icon: 'lucide:download',
            to: '/products/downloader',
          },
          {
            title: 'Pantau by CoreAsia',
            description: 'Dashboard analytics & SEO monitoring website',
            icon: 'lucide:bar-chart-3',
            to: '/products/pantau',
          },
          {
            title: 'Semua Produk',
            description: 'Jelajahi ekosistem produk & layanan CoreAsia',
            icon: 'lucide:boxes',
            to: '/products',
          },
        ],
      },
      cta: {
        title: 'Siap menulis ke drive NTFS Anda?',
        subtitle:
          'Coba gratis 1 hari dengan semua fitur tulis aktif. Setelah trial berakhir, membaca NTFS tetap gratis selamanya.',
        ctaPrimary: 'Unduh Gratis untuk macOS',
        ctaSecondary: 'support@coreasia.id',
        note: 'Pembelian diproses oleh Gumroad sebagai merchant of record. Harga IDR muncul otomatis saat checkout.',
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
        ctaPrimary: 'Coba Gratis 7 Hari',
        ctaPricing: 'Lihat Harga & Paket',
        ctaSecondary: 'Konsultasi Dulu',
        appNote: 'LeadKu berjalan di aplikasinya sendiri:',
        chips: ['Pipeline visibility', 'Team activity tracking', 'Multi-workspace ready'],
      },
      pricing: {
        label: 'Pricing',
        planCta: 'Pilih paket ini',
        title: 'Paket disusun mengikuti tahap pertumbuhan tim',
        subtitle:
          'Mulai dari trial 7 hari, lalu pilih paket sesuai jumlah pengguna dan data yang dibutuhkan. Hemat dengan komitmen durasi: 3 bulan -10%, 6 bulan -15%, 12 bulan -20%.',
        plans: [
          {
            name: 'Trial',
            price: 'Gratis',
            description: 'Coba dulu 7 hari sebelum memutuskan.',
            features: ['3 pengguna', '500 kontak', '20 kredit AI', 'Workspace siap pakai', 'Trial 7 hari'],
          },
          {
            name: 'Personal',
            price: 'Rp 100.000/bln',
            description: 'Untuk yang jalan sendiri dan cukup butuh pipeline rapi.',
            features: ['1 pengguna', '50 kontak', '10 kredit AI/bulan', 'Pipeline visual', 'Quotation dan invoice'],
          },
          {
            // Angka di sini WAJIB mengikuti katalog billing LeadKu
            // (GET /api/v1/public/billing/catalog). Sebelumnya halaman ini
            // menampilkan 750.000 tanpa keterangan apa pun, padahal itu
            // list_amount alias harga sebelum promo, sementara harga jualnya
            // 450.000. Prospek yang membandingkan halaman ini dengan
            // leadku.coreasia.id melihat dua angka berbeda untuk paket yang sama.
            name: 'Starter',
            price: 'Rp 450.000/bln',
            listPrice: 'Rp 750.000',
            promo: 'Harga perdana sampai 31 Okt 2026',
            description: 'Untuk yang baru mulai merapikan penjualan.',
            features: ['3 pengguna', '2.500 kontak', '100 kredit AI/bulan', 'Pipeline visual', 'Aktivitas & task', 'Quotation dan invoice'],
          },
          {
            name: 'Pro',
            price: 'Rp 1.750.000/bln',
            description: 'Untuk tim yang mau menang lebih sering.',
            popular: true,
            features: ['6 pengguna', '10.000 kontak', '500 kredit AI/bulan', 'Semua fitur Starter', 'Produk dan price list', 'Template quotation/invoice'],
          },
          {
            name: 'Business',
            price: 'Rp 3.500.000/bln',
            description: 'Untuk organisasi yang bermain besar.',
            features: ['12 pengguna', '50.000 kontak', '2.000 kredit AI/bulan (fair use)', 'Semua fitur Pro', 'Custom report ringan', 'Priority support'],
          },
          {
            name: 'On-Premise',
            price: 'Mulai Rp 100.000.000',
            description: 'Deploy di server Anda sendiri.',
            features: ['Deployment Docker', 'Setup database', 'Training admin', 'Maintenance 20-25%/tahun', 'Scope custom'],
          },
        ],
        note: 'Tambah pengguna Rp 150.000/user/bulan. Onboarding, migrasi data, dan training tersedia sebagai paket implementasi terpisah.',
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
      subtitle: 'Brief akan disimpan terlebih dahulu, lalu WhatsApp dibuka agar tim dapat menindaklanjuti lebih cepat.',
      fields: {
        name: 'Nama lengkap',
        email: 'Email',
        phone: 'No. WhatsApp',
        subject: 'Subjek',
        message: 'Pesan',
        consent: 'Saya menyetujui data ini digunakan untuk tindak lanjut konsultasi.',
      },
      subjects: {
        website: 'Jasa Pembuatan Website',
        webapp: 'Jasa Pembuatan Aplikasi Web',
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
      success: 'Brief berhasil disimpan. WhatsApp telah disiapkan untuk melanjutkan percakapan.',
      error: 'Brief belum tersimpan karena koneksi atau server bermasalah. Data Anda belum terkirim. Silakan coba lagi atau lanjutkan lewat WhatsApp.',
      whatsappContinue: 'Lanjutkan percakapan di WhatsApp',
      whatsappFallback: 'Lanjutkan lewat WhatsApp',
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
    title: 'Harga & Paket Langganan Produk',
    description:
      'Bandingkan paket langganan produk CoreAsia. Estimasi biaya jasa pembuatan website dan aplikasi web tersedia di halaman layanan. Konsultasi gratis.',
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
    services: {
      title: 'Mencari harga jasa pembuatan website?',
      description: 'Paket di atas adalah langganan produk CoreAsia. Estimasi biaya jasa pembuatan website dan aplikasi web ada di halaman layanan berikut.',
      websiteCta: 'Estimasi Biaya Website',
      webAppCta: 'Jasa Aplikasi Web Custom',
    },
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
      title: 'Jasa Pembuatan Website Jakarta',
      description: 'Jasa pembuatan website bisnis di Jakarta dan seluruh Indonesia. Harga mulai Rp 3 juta landing page, Rp 5 juta company profile, Rp 10 juta toko online.',
      kicker: 'Jasa Pembuatan Web',
      hero: {
        title: 'Jasa pembuatan website untuk <span class="ca-gradient-text">bisnis di Indonesia</span>',
        subtitle: 'CoreAsia membangun website untuk bisnis di berbagai kota di Indonesia. Website cepat, SEO-ready, dan disusun agar pengunjung mudah menghubungi Anda, mulai dari company profile hingga web app custom.',
        ctaPrimary: 'Konsultasi Gratis',
        ctaSecondary: 'Lihat Portofolio',
        ctaTertiary: 'Lihat Estimasi Biaya',
      },
      whyUs: {
        title: 'Mengapa Pilih CoreAsia untuk Pembuatan Web Anda?',
        subtitle: 'Bukan sekadar jasa pembuatan website murah. Kami mitra teknologi untuk pertumbuhan bisnis Anda di seluruh Indonesia.',
        items: [
          {
            icon: 'lucide:palette',
            title: 'Design Custom & Responsif',
            description: 'Setiap website dirancang khusus sesuai brand dan kebutuhan bisnis Anda, dengan tata letak yang menyesuaikan layar desktop, tablet, dan ponsel.',
          },
          {
            icon: 'lucide:zap',
            title: 'Kecepatan Halaman',
            description: 'Dibangun dengan rendering modern, gambar terkompresi, dan aset yang diminimalkan agar halaman terbuka cepat.',
          },
          {
            icon: 'lucide:search',
            title: 'SEO-Ready dari Awal',
            description: 'Struktur heading, meta tag, sitemap, dan data terstruktur disiapkan sejak awal agar mesin pencari mudah membaca isi halaman.',
          },
          {
            icon: 'lucide:shield-check',
            title: 'Keamanan & Maintenance',
            description: 'Kami menyiapkan SSL, backup terjadwal, dan pemantauan agar gangguan cepat terdeteksi dan website bisa segera dipulihkan.',
          },
          {
            icon: 'lucide:settings',
            title: 'Teknologi Modern',
            description: 'Kami memakai Nuxt.js, Vue, Go, dan PostgreSQL, teknologi yang sama dengan yang kami pakai untuk produk sendiri.',
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
        subtitle: 'Jenis pengerjaan website dan aplikasi web yang kami tangani.',
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
            description: 'Website toko online dengan sistem pembayaran, manajemen produk, dan integrasi pengiriman. Diserahkan dalam kondisi siap menerima pesanan.',
            keywords: 'jasa pembuatan web toko online',
          },
          {
            icon: 'lucide:rocket',
            title: 'Landing Page & Promosi',
            description: 'Halaman khusus untuk kampanye marketing, peluncuran produk, atau promosi bisnis. Disusun ringkas dengan satu ajakan bertindak yang jelas.',
            keywords: 'jasa pembuatan landing page',
          },
          {
            icon: 'lucide:layout-dashboard',
            title: 'Web Application Custom',
            description: 'Aplikasi web sesuai kebutuhan spesifik bisnis Anda, mulai dashboard, sistem manajemen, hingga portal.',
            keywords: 'jasa pembuatan web app custom',
          },
        ],
      },
      serviceAreas: {
        title: 'Melayani Seluruh Indonesia',
        subtitle: 'Tim kami bekerja secara remote dan melayani klien dari berbagai kota di Indonesia.',
        cities: ['Jakarta', 'Surabaya', 'Bandung', 'Tangerang', 'Bekasi', 'Makassar', 'Semarang', 'Yogyakarta', 'Medan', 'Bali'],
        description: 'Tidak terbatas lokasi. Konsultasi dan pengerjaan dilakukan secara online. Anda bisa mendapatkan jasa pembuatan web profesional dari mana saja di Indonesia.',
      },
      pricing: {
        title: 'Estimasi Biaya Pembuatan Website',
        subtitle: 'Biaya pembuatan web bervariasi tergantung jenis, fitur, dan kompleksitas. Berikut gambaran umum:',
        items: [
          { type: 'Landing Page', range: 'Mulai Rp 3 juta', lowPrice: '3000000', description: 'Satu halaman promosi, responsif, SEO-ready.' },
          { type: 'Company Profile', range: 'Mulai Rp 5 juta', lowPrice: '5000000', description: '3-7 halaman, design custom, konten manajemen dasar.' },
          { type: 'Toko Online', range: 'Mulai Rp 10 juta', lowPrice: '10000000', description: 'Katalog produk, keranjang, pembayaran, integrasi pengiriman.' },
          { type: 'Web App Custom', range: 'Mulai Rp 25 juta', lowPrice: '25000000', description: 'Dashboard, sistem manajemen, fitur khusus sesuai kebutuhan.' },
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
          { step: '04', title: 'Testing & Launch', description: 'Pengujian di ukuran layar dan peramban yang umum dipakai, lalu deploy.' },
        ],
      },
      faq: {
        title: 'FAQ Jasa Pembuatan Website',
        items: [
          { question: 'Berapa lama proses pembuatan website?', answer: 'Tergantung kompleksitas, umumnya 2-6 minggu untuk website company profile, dan 4-12 minggu untuk web app custom.' },
          { question: 'Berapa biaya pembuatan web company profile?', answer: 'Biaya pembuatan web company profile mulai dari Rp 5 juta, tergantung jumlah halaman, fitur, dan kompleksitas design. Hubungi kami untuk penawaran yang sesuai.' },
          { question: 'Apakah jasa pembuatan web CoreAsia melayani di luar Jakarta?', answer: 'Ya, kami melayani klien dari seluruh Indonesia, mulai Jakarta, Surabaya, Bandung, Tangerang, Bekasi, Makassar, dan kota lainnya. Semua proses dilakukan secara online.' },
          { question: 'Apakah bisa request revisi design?', answer: 'Bisa. Jumlah putaran revisi desain disepakati di awal dan dicantumkan pada penawaran, sehingga lingkupnya jelas untuk kedua pihak.' },
          { question: 'Apakah website sudah termasuk hosting dan domain?', answer: 'Kami membantu setup hosting dan domain. Biaya hosting dan domain terpisah dan bisa disesuaikan.' },
          { question: 'Apakah website mobile-friendly?', answer: 'Ya, semua website yang kami buat responsif. Tata letaknya menyesuaikan ukuran layar desktop, tablet, dan smartphone.' },
          { question: 'Apakah ada jasa pembuatan web murah untuk UMKM?', answer: 'Kami menyediakan paket landing page mulai dari Rp 3 juta yang cocok untuk UMKM dan bisnis kecil. Tetap profesional dan SEO-ready.' },
          { question: 'Bagaimana dengan maintenance setelah launch?', answer: 'Kami menyediakan paket maintenance bulanan yang mencakup update, backup, dan support teknis.' },
        ],
      },
      cta: {
        title: 'Siap punya website profesional?',
        subtitle: 'Konsultasikan kebutuhan pembuatan web Anda dengan tim CoreAsia. Gratis, tanpa komitmen.',
        button: 'Hubungi Kami Sekarang',
      },
      relatedProduct: {
        kicker: 'Produk Terkait',
        title: 'Build by CoreAsia',
        description: 'Layanan pembuatan website dan aplikasi web custom kami. Lihat detail proses, teknologi, dan cara kerja kami.',
        ctaPrimary: 'Pelajari Build',
        ctaSecondary: 'Jasa Aplikasi Web Custom',
      },
      schema: {
        serviceName: 'Jasa Pembuatan Website Profesional',
        offerCatalogName: 'Paket Jasa Pembuatan Website',
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
        title: 'FAQ Web Monitoring Dashboard',
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
      title: 'Jasa Pembuatan Aplikasi Web Custom',
      description: 'Jasa pembuatan aplikasi web custom di Indonesia: CRM, LMS, ERP, dashboard, dan sistem internal sesuai proses kerja bisnis Anda.',
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
        items: ['Vue.js dan Nuxt', 'Go (Golang)', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'REST API', 'MinIO atau S3', 'Redis'],
      },
      faq: {
        title: 'FAQ Jasa Pembuatan Aplikasi Web',
        items: [
          { question: 'Berapa biaya pembuatan aplikasi web?', answer: 'Biaya tergantung kompleksitas. Kami menyediakan estimasi setelah sesi konsultasi dan scoping kebutuhan.' },
          { question: 'Apakah bisa dikembangkan bertahap?', answer: 'Ya, kami mendukung pengerjaan bertahap. Fitur inti dirilis lebih dulu, lalu dikembangkan berdasarkan masukan pengguna.' },
          { question: 'Bagaimana dengan source code?', answer: 'Source code menjadi milik Anda sepenuhnya setelah proyek selesai dan pembayaran lunas.' },
          { question: 'Apakah ada garansi?', answer: 'Ya, kami memberikan garansi perbaikan bug setelah peluncuran. Durasinya ditetapkan bersama lingkup proyek dan ditulis pada kontrak sebelum pengerjaan dimulai.' },
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
          { question: 'Apakah CoreAsia melayani di luar Jakarta?', answer: 'Ya, kami melayani klien dari seluruh Indonesia, mulai Surabaya, Bandung, Tangerang, Bekasi, Semarang, Yogyakarta, Medan, Makassar, hingga Bali. Semua proses dilakukan secara online.' },
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
          { question: 'Teknologi apa yang digunakan?', answer: 'Kami menggunakan Go, Vue atau Nuxt, React atau Next.js, PostgreSQL, Redis, Docker, dipilih sesuai kebutuhan project.' },
          { question: 'Apakah bisa integrasi dengan sistem yang sudah ada?', answer: 'Ya, kami berpengalaman mengintegrasikan dengan berbagai API dan sistem existing.' },
        ],
      },
      monitoring: {
        label: 'Web Monitoring (Pantau)',
        items: [
          { question: 'Apa itu Pantau?', answer: 'Pantau adalah dashboard monitoring website buatan CoreAsia yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, dan AI assistant dalam satu tempat.' },
          { question: 'Apakah Pantau gratis?', answer: 'Ya, paket Starter gratis untuk 1 website dengan data 7 hari, 3 kueri AI per hari, dan 15 keyword ranking.' },
          { question: 'Berapa harga paket Pantau?', answer: 'Professional Rp 250.000/bln (5 website), Business Rp 600.000/bln (15 website), Enterprise Rp 1.500.000/bln (30 website). Ada juga opsi Self-Hosted.' },
          { question: 'Apakah Pantau bisa diakses di mobile?', answer: 'Ya, dashboard Pantau responsif dan bisa diakses dari browser di perangkat apa saja.' },
        ],
      },
      pricing: {
        label: 'Harga & Pembayaran',
        items: [
          { question: 'Apakah ada trial gratis?', answer: 'Untuk Pantau, paket Starter sudah gratis selamanya. Untuk jasa website, kami menyediakan konsultasi gratis sebelum Anda memutuskan.' },
          { question: 'Apa metode pembayaran yang diterima?', answer: 'Transfer bank, Virtual Account (BCA, BNI, Mandiri, BRI, Permata), QRIS, dan opsi lainnya melalui payment gateway.' },
          { question: 'Bisakah bayar secara bertahap?', answer: 'Ya, untuk project jasa pembuatan website atau web app, pembayaran bisa dicicil sesuai milestone yang disepakati.' },
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
    subtitle: 'Dari konsep hingga production, berikut beberapa proyek yang menunjukkan kemampuan tim CoreAsia.',
    items: [
      {
        title: 'Pantau by CoreAsia',
        category: 'SaaS Product',
        description: 'Dashboard monitoring website lengkap yang menggabungkan Google Analytics 4, Search Console, keyword ranking, SEO audit, AI assistant, dan laporan PDF otomatis. Digunakan untuk memantau performa SEO dan analytics dari satu tempat.',
        tech: ['Go', 'Nuxt 3', 'PostgreSQL', 'Redis', 'Docker', 'Xendit', 'GA4 API', 'GSC API'],
        link: 'https://pantau.coreasia.id',
        highlights: ['4 paket harga (gratis sampai enterprise)', 'Integrasi Xendit VA + QRIS', 'AI assistant (Dexter)', 'Laporan PDF otomatis'],
      },
      {
        title: 'CoreAsia Landing & CMS',
        category: 'Company Website',
        description: 'Website company profile dan landing page CoreAsia dengan CMS artikel, multi-bahasa (Indonesia dan Inggris), dan SEO-optimized. Built dengan Nuxt 4 SSR + Go API Gateway.',
        tech: ['Nuxt 4', 'Go', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
        highlights: ['Multi-bahasa Indonesia dan Inggris', 'CMS artikel dengan editor rich text', 'SEO schema.org lengkap', 'Prerender + SSR hybrid'],
      },
      {
        title: 'LMS Sertifikasi',
        category: 'Custom Web App',
        description: 'Learning Management System untuk sertifikasi digital, mencakup CBT online, manajemen peserta, penjadwalan ujian, dan integrasi BNSP.',
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
    downloaderPrivacy: {
      title: 'Kebijakan Privasi CoreAsia Download Manager',
      description: 'Kebijakan privasi CoreAsia Download Manager (aplikasi macOS & browser extension) — bagaimana data Anda diperlakukan. Ramah privasi: data diproses lokal di perangkat Anda.',
      lastUpdated: 'Terakhir diperbarui: Juni 2026',
      sections: {
        intro: {
          title: '1. Ringkasan',
          content: 'CoreAsia Download Manager (selanjutnya "CAD") adalah download manager untuk desktop beserta browser extension pendamping, dikelola oleh {company} (brand CoreAsia). Pemrosesan oleh aplikasi dan extension dilakukan secara lokal di perangkat Anda, dan untuk fungsi inti CAD kami tidak mengumpulkan data pribadi Anda ke server kami — KECUALI sebagaimana dijelaskan dalam Kebijakan ini, yaitu: (a) data pembelian yang diproses oleh penjual sah/Merchant of Record ({mor}) sesuai kebijakan privasi mereka; (b) data diagnostik teknis bila Anda mengaktifkannya (lihat Diagnostik); (c) data aktivasi/identifikasi lisensi bila validasi lisensi daring diaktifkan pada versi mendatang; dan (d) pengungkapan yang diwajibkan hukum atau perintah resmi yang sah. Selebihnya, kami tidak mengunggah riwayat, isi unduhan, atau URL Anda ke server kami, dan kami tidak menjual data pribadi Anda. Bila kami memperkenalkan fitur berbasis server di masa depan, kami akan memperbarui Kebijakan ini sebelum fitur tersebut aktif.',
        },
        controller: {
          title: '2. Pengendali Data & Peran',
          content: '{company} adalah pengendali data (data controller) untuk data yang diproses oleh aplikasi, diagnostik opsional, dan aktivasi lisensi. Untuk pembelian, {mor} bertindak sebagai penjual sah (Merchant of Record) dan pengendali/pemroses data pembayaran Anda (nama, email, alamat tagih, data kartu/pajak) sesuai kebijakan privasinya; {company} tidak menyimpan data kartu Anda. Pertanyaan privasi dapat dikirim ke {email}.',
        },
        extension: {
          title: '3. Browser Extension (Chrome/Edge)',
          content: 'Extension pendamping membantu mendeteksi media yang dapat diunduh di halaman yang sedang Anda buka. Untuk itu, extension dapat membaca:',
          items: [
            'URL tab aktif dan tautan media (mis. video/audio) yang ada di halaman yang Anda buka',
            'HANYA saat Anda memulai unduhan yang memerlukannya: cookie untuk situs terkait, agar aplikasi dapat mengunduh konten yang membutuhkan sesi login Anda',
          ],
        },
        extensionLocal: {
          title: '4. Ke Mana Data Extension Dikirim',
          content: 'Data di atas dikirim HANYA ke aplikasi CoreAsia Download Manager yang berjalan secara LOKAL di komputer Anda (alamat 127.0.0.1 / localhost). Data ini TIDAK dikirim ke server CoreAsia maupun pihak ketiga mana pun. Extension tidak menjual data, tidak menampilkan iklan, dan tidak melacak aktivitas browsing Anda untuk tujuan periklanan.',
        },
        desktop: {
          title: '5. Aplikasi Desktop',
          content: 'Aplikasi desktop berjalan di komputer Anda dan:',
          items: [
            'Mengunduh file yang Anda minta ke folder pilihan Anda',
            'Menyimpan setelan, lisensi, dan riwayat unduhan secara LOKAL di perangkat Anda',
            'Tidak mengunggah riwayat unduhan Anda ke server kami',
          ],
        },
        license: {
          title: '6. Aktivasi Lisensi',
          content: 'Aktivasi tidak memerlukan akun. Saat ini lisensi divalidasi secara lokal (offline, Ed25519) tanpa mengirim data pribadi ke server kami. Pada versi mendatang, kami dapat memperkenalkan validasi lisensi daring; jika diaktifkan, hanya pengenal lisensi/instalasi minimum yang dikirim untuk mencegah penyalahgunaan, dan Kebijakan ini akan diperbarui sebelum fitur tersebut aktif. Pembelian dan penerbitan lisensi diproses oleh penjual sah ({mor}) sesuai kebijakan privasi mereka.',
        },
        trial: {
          title: '7. Masa Coba (Trial)',
          content: 'Masa coba (trial) 3 hari dihitung menggunakan cap waktu lokal di perangkat Anda. Tidak ada data pribadi yang dikumpulkan untuk menjalankan trial.',
        },
        diagnostics: {
          title: '8. Diagnostik Opsional (Opt-In)',
          content: 'Diagnostik teknis bersifat opsional dan MATI secara default; hanya aktif bila Anda mengaktifkannya sendiri, dan dapat Anda matikan kapan saja. Bila diaktifkan, kami mengirim data teknis terbatas berupa pengenal instalasi yang di-pseudonimkan (hash satu-arah yang tidak dapat dikembalikan ke identitas Anda) beserta versi aplikasi, versi sistem operasi, locale, dan zona waktu. Kami tidak mengirim riwayat, isi unduhan, atau URL Anda. Data ini hanya digunakan untuk diagnostik dan peningkatan kualitas produk.',
        },
        legalBasis: {
          title: '9. Dasar Pemrosesan & Transfer Lintas Negara',
          content: 'Dasar pemrosesan kami: pelaksanaan kontrak (memproses pembelian dan lisensi Anda), persetujuan (diagnostik opsional), dan kepentingan sah (keamanan serta peningkatan produk). Data pembelian dapat diproses di luar negara tempat tinggal Anda (misalnya melalui {mor} di Amerika Serikat) dengan perlindungan yang sesuai hukum yang berlaku (mis. klausa kontraktual standar).',
        },
        security: {
          title: '10. Keamanan Data & Pemberitahuan Pelanggaran',
          content: 'Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data, namun tidak ada metode transmisi atau penyimpanan yang 100% aman; kami tidak dapat menjamin keamanan absolut. Apabila terjadi kegagalan pelindungan data pribadi yang menimbulkan risiko bagi Anda, kami akan memberitahukan kepada Anda dan otoritas yang berwenang sesuai tenggat hukum yang berlaku — termasuk paling lambat 3x24 jam berdasarkan UU PDP No. 27 Tahun 2022, dan, bila berlaku, tanpa penundaan yang tidak wajar / dalam 72 jam berdasarkan GDPR Pasal 33.',
        },
        noSale: {
          title: '11. Tidak Ada Penjualan Data',
          content: 'Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga.',
        },
        rights: {
          title: '12. Hak Anda',
          content: 'Karena sebagian besar data disimpan secara lokal di perangkat Anda, Anda memegang kendali penuh. Tergantung yurisdiksi Anda (mis. Uni Eropa/Inggris di bawah GDPR/UK GDPR, atau Indonesia di bawah UU PDP), Anda berhak: mengakses, memperbaiki, menghapus, membatasi, atau menolak pemrosesan data pribadi Anda, meminta portabilitas, dan menarik persetujuan kapan saja tanpa memengaruhi keabsahan pemrosesan sebelumnya. Untuk data pembayaran, ajukan melalui kami atau langsung ke {mor}. Anda juga berhak mengadu ke otoritas pelindungan data yang berwenang (mis. Lembaga PDP di Indonesia, atau otoritas perlindungan data di Uni Eropa/Inggris). Hubungi kami di {email}. Hak-hak ini dapat Anda jalankan langsung dengan cara berikut:',
          items: [
            'Menghapus riwayat, setelan, dan data aplikasi langsung dari perangkat Anda',
            'Menonaktifkan diagnostik opsional kapan saja',
            'Menghapus aplikasi dan extension untuk menghentikan seluruh pemrosesan data terkait',
          ],
        },
        retention: {
          title: '13. Penyimpanan dan Retensi Data',
          content: 'Setelan, lisensi, dan riwayat unduhan disimpan secara lokal di perangkat Anda hingga Anda menghapusnya. Kami tidak menyimpan salinan data tersebut di server kami. Data diagnostik opsional (bila Anda aktifkan) disimpan maksimal 12 (dua belas) bulan, lalu dihapus atau di-anonimkan. Data aktivasi lisensi disimpan selama lisensi berlaku untuk keperluan dukungan dan anti-penyalahgunaan. Data pembelian disimpan oleh {mor} sesuai kebijakan dan kewajiban pajaknya.',
        },
        recipients: {
          title: '14. Penerima Data / Sub-pemroses',
          content: 'Kategori penerima data kami terbatas pada: (a) {mor} (penjual sah / pemroses pembayaran); (b) penyedia analitik/diagnostik kami (hanya untuk data diagnostik opsional yang Anda aktifkan); dan (c) penyedia infrastruktur/hosting yang mendukung layanan terbatas kami. Kami tidak membagikan data pribadi Anda kepada pihak lain selain sebagaimana dijelaskan dalam Kebijakan ini atau diwajibkan hukum.',
        },
        thirdPartyContent: {
          title: '15. Konten/Situs Pihak Ketiga',
          content: 'Kebijakan ini hanya mengatur penanganan data oleh CAD. Konten, situs, dan layanan pihak ketiga yang Anda akses melalui CAD diatur oleh kebijakan dan ketentuan mereka sendiri, di luar kendali kami. Tanggung jawab atas legalitas konten yang Anda unduh diatur dalam Ketentuan Penggunaan.',
        },
        changes: {
          title: '16. Perubahan Kebijakan',
          content: 'Kami dapat memperbarui Kebijakan ini dari waktu ke waktu, ditandai tanggal revisi pada halaman ini. Untuk perubahan material terhadap cara kami memproses data pribadi, kami akan memberi pemberitahuan yang wajar (di dalam aplikasi atau pada halaman ini) sebelum berlaku, dan — bila diwajibkan hukum — meminta persetujuan baru Anda.',
        },
        governingLaw: {
          title: '17. Hukum yang Berlaku',
          content: 'Kebijakan privasi ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. CoreAsia Download Manager dikelola oleh {company}.',
        },
        contact: {
          title: '18. Hubungi Kami',
          content: 'Untuk pertanyaan terkait kebijakan privasi CoreAsia Download Manager, hubungi kami di {email}.',
        },
      },
    },
    downloaderTerms: {
      title: 'Syarat dan Ketentuan CoreAsia Download Manager',
      description: 'Syarat dan ketentuan penggunaan CoreAsia Download Manager (aplikasi macOS & browser extension). Harap baca dengan saksama sebelum menggunakan produk.',
      lastUpdated: 'Terakhir diperbarui: Juni 2026',
      sections: {
        intro: {
          title: '1. Ketentuan Umum',
          content: 'CoreAsia Download Manager ("CAD") adalah download manager untuk macOS (Apple Silicon) beserta browser extension pendamping, dikelola oleh {company} (brand CoreAsia). Dengan mengunduh, memasang, atau menggunakan CAD, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini.',
        },
        natureRoles: {
          title: '2. Sifat Alat, Tanpa Hosting, & Peran Para Pihak',
          content: 'CAD adalah alat berfungsi-ganda (general-purpose) yang dijalankan dan diproses sepenuhnya di perangkat Anda. {company} tidak meng-host, menyimpan ke server kami, menyalin, mengindeks, men-cache, mem-mirror/proxy, mengunggah ulang, maupun mendistribusikan konten apa pun yang Anda akses atau unduh melalui CAD. Seluruh konten ditransfer langsung dari sumber pihak ketiga ke perangkat Anda; kami bukan perantara, penyedia, atau penerbit konten tersebut. CAD memiliki kegunaan sah yang substansial, termasuk mengunduh konten milik Anda sendiri, konten berlisensi terbuka, atau konten yang telah Anda peroleh izinnya. Peran para pihak: {company} adalah pemberi lisensi (licensor) perangkat lunak CAD. {mor} adalah penjual sah (Merchant of Record / seller of record) atas transaksi pembelian Anda; {mor}—bukan {company}—yang berkontrak jual-beli dengan Anda, serta menangani pembayaran, faktur, pajak, dan kewajiban penjual menurut hukum yang berlaku. Ketentuan dan kebijakan {mor} mengatur transaksi jual-beli tersebut. Kebijakan refund {company} merupakan kebijakan tambahan (good-will) di atas hak statutori Anda yang dipenuhi melalui {mor}.',
        },
        license: {
          title: '3. Pemberian Lisensi',
          content: 'Kami memberikan Anda lisensi yang terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk menggunakan CoreAsia Download Manager sesuai dengan paket yang Anda beli, untuk penggunaan pribadi Anda. Anda tidak diperbolehkan menjual ulang, menyewakan, mendistribusikan, melakukan rekayasa balik, atau mendistribusikan ulang kunci lisensi tanpa izin tertulis dari kami. Lisensi berlaku selama hak Anda tidak berakhir berdasarkan Pasal 14 (Penghentian) atau karena refund/chargeback sebagaimana diatur dalam Kebijakan Refund. Pengalihan: Anda tidak dapat mengalihkan hak/kewajiban berdasarkan Ketentuan ini tanpa persetujuan tertulis kami. Kami dapat mengalihkan Ketentuan ini, seluruhnya atau sebagian, kepada afiliasi atau dalam rangka merger, akuisisi, reorganisasi, atau penjualan aset, dengan tetap menghormati hak Anda berdasarkan hukum konsumen wajib.',
        },
        trial: {
          title: '4. Masa Coba (Trial)',
          content: 'CAD menyediakan masa coba (trial) gratis selama 3 hari. Setelah masa coba berakhir, Anda perlu mengaktifkan lisensi berbayar untuk terus menggunakan fitur yang memerlukan aktivasi. Masa coba dihitung menggunakan cap waktu lokal di perangkat Anda.',
        },
        pricing: {
          title: '5. Pembayaran dan Lisensi',
          content: 'Harga dapat berubah sewaktu-waktu untuk pembelian baru; perubahan harga tidak memengaruhi lisensi yang telah Anda beli. Produk Lifetime adalah pembayaran satu kali tanpa biaya berlangganan berulang. Penjual sah (Merchant of Record / seller of record) untuk transaksi adalah {mor}, yang berkontrak jual-beli dengan Anda serta memproses pembayaran, faktur, dan pajak sesuai kebijakannya; pajak yang berlaku dapat ditampilkan atau ditambahkan sesuai yurisdiksi Anda saat checkout. Pilihan lisensi yang tersedia:',
          items: [
            'Lifetime License — sekali bayar, tanpa biaya berlangganan berulang',
            '1-Day Pass — akses selama 1 hari',
            'Pembelian dan penerbitan lisensi ditangani oleh {mor} sebagai penjual sah (Merchant of Record); pajak yang berlaku dapat ditambahkan sesuai yurisdiksi Anda saat checkout',
          ],
        },
        refund: {
          title: '6. Kebijakan Pengembalian Dana (Refund)',
          content: 'Kami menyediakan jaminan uang kembali 14 (empat belas) hari sejak tanggal pembelian lisensi Lifetime — tanpa perlu memberi alasan, dan hanya ditolak bila terbukti penyalahgunaan — serta masa coba gratis 3 hari sebelum pembelian. Di luar jendela tersebut, permintaan ditinjau berdasarkan keadaan masing-masing kasus, terutama untuk masalah teknis yang membuat aplikasi tidak dapat digunakan dan tidak dapat kami selesaikan. Saat pengembalian dana atau sengketa disetujui, lisensi terkait berakhir secara hukum dan tidak lagi sah digunakan. Pembelian diproses oleh {mor} sebagai Merchant of Record. Kebijakan ini tidak mengurangi hak konsumen wajib Anda menurut hukum yang berlaku. Ketentuan lengkap, pengecualian, dan cara mengajukan diatur dalam Kebijakan Refund kami di coreasia.id/downloader/refund; bila terdapat perbedaan, Kebijakan Refund yang berlaku. Hubungi kami di {email}.',
        },
        acceptableUse: {
          title: '7. Penggunaan yang Dapat Diterima',
          content: 'CoreAsia Download Manager adalah alat serbaguna untuk mengelola unduhan. Anda bertanggung jawab penuh memastikan bahwa setiap pengunduhan adalah sah di yurisdiksi Anda dan tidak melanggar hak pihak ketiga. Anda dilarang menggunakan CAD untuk membongkar, menghindari, atau mengakali (circumvent) tindakan pengamanan teknologi/manajemen hak digital (DRM) atau kontrol akses, sejauh hal itu dilarang oleh hukum yang berlaku (termasuk Pasal 52 UU Hak Cipta dan ketentuan anti-circumvention serupa). CAD tidak ditujukan dan tidak boleh digunakan untuk menembus paywall, DRM, atau pembatasan akses berbayar tanpa hak. Anda WAJIB:',
          items: [
            'Hanya mengunduh konten yang Anda miliki haknya, atau yang Anda diizinkan untuk mengunduhnya',
            'Mematuhi syarat layanan, hak cipta, dan ketentuan situs pihak ketiga tempat konten berasal',
            'Tidak menggunakan CAD untuk melanggar hukum atau hak pihak lain',
          ],
        },
        sanctions: {
          title: '8. Kepatuhan Sanksi/Ekspor & Ketersediaan',
          content: 'Anda menyatakan bahwa Anda tidak berada di, dan tidak menggunakan CAD untuk kepentingan pihak di, yurisdiksi atau daftar yang dikenai sanksi atau pembatasan ekspor yang melarang penyediaan perangkat lunak ini, dan bahwa penggunaan Anda mematuhi hukum pengendalian ekspor dan sanksi yang berlaku. {company} dapat membatasi atau menghentikan ketersediaan CAD di yurisdiksi tertentu untuk mematuhi hukum.',
        },
        indemnity: {
          title: '9. Ganti Rugi (Indemnifikasi) — Pengguna Bisnis',
          content: 'Klausul ini hanya berlaku bagi pengguna bisnis/komersial dan tidak berlaku bagi konsumen (orang perseorangan yang menggunakan CAD di luar kegiatan usaha atau profesinya). Sejauh diizinkan hukum yang berlaku, jika Anda pengguna bisnis, Anda setuju membela, mengganti rugi, dan membebaskan {company} beserta afiliasi, direktur, dan karyawannya dari segala klaim, tuntutan, gugatan, kerugian, kewajiban, denda, kerusakan, biaya, dan ongkos pihak ketiga (termasuk biaya hukum yang wajar) yang timbul dari atau berkaitan dengan: (a) penggunaan CAD oleh Anda; (b) konten yang Anda unduh, simpan, atau distribusikan menggunakan CAD; (c) pelanggaran Anda atas Ketentuan ini atau Pasal 7 (Penggunaan yang Dapat Diterima); atau (d) pelanggaran Anda atas hak cipta, merek, privasi, atau hak pihak ketiga lain, maupun Ketentuan Layanan situs/layanan pihak ketiga. Kewajiban ini tetap berlaku setelah lisensi berakhir. Konsumen: Jika Anda konsumen, Anda tidak menanggung kewajiban indemnifikasi apa pun berdasarkan Ketentuan ini. Hal ini tidak menghapus tanggung jawab Anda berdasarkan hukum atas perbuatan Anda sendiri yang melanggar hukum.',
        },
        acceptableUseLiability: {
          title: '10. Tanggung Jawab atas Penggunaan',
          content: 'CoreAsia Download Manager adalah alat serbaguna; Anda bertanggung jawab penuh atas cara Anda menggunakannya dan atas konten yang Anda unduh. {company} tidak bertanggung jawab atas penyalahgunaan aplikasi, termasuk pengunduhan konten yang melanggar hak cipta atau ketentuan pihak ketiga.',
        },
        thirdParty: {
          title: '11. Layanan dan Situs Pihak Ketiga',
          content: 'CAD dapat berinteraksi dengan situs dan layanan pihak ketiga. Kami tidak mengendalikan dan tidak bertanggung jawab atas ketersediaan, konten, atau kebijakan situs pihak ketiga tersebut. Perubahan pada situs pihak ketiga dapat memengaruhi fungsi unduhan tertentu.',
        },
        warranty: {
          title: '12. Tanpa Jaminan (As-Is)',
          content: 'CAD disediakan "sebagaimana adanya" (as-is) dan "sebagaimana tersedia" (as-available), tanpa jaminan apa pun, tersurat maupun tersirat. Sejauh maksimum diizinkan hukum yang berlaku, kami secara TEGAS MENOLAK seluruh jaminan tersirat, termasuk jaminan kelayakan untuk diperdagangkan (merchantability), kesesuaian untuk tujuan tertentu (fitness for a particular purpose), tidak adanya pelanggaran hak (non-infringement), kepemilikan (title), dan kenikmatan tanpa gangguan (quiet enjoyment). Kami tidak menjamin CAD bebas error, tidak terputus, aman, atau kompatibel dengan setiap situs, layanan, atau konfigurasi perangkat. Penyelamat hak konsumen (afirmatif): Jika Anda konsumen, tidak ada dalam Pasal ini yang mengecualikan, membatasi, atau memengaruhi jaminan dan hak statutori Anda yang tidak dapat dikesampingkan menurut hukum perlindungan konsumen di negara tempat tinggal Anda — termasuk UU No. 8 Tahun 1999 dan, bila berlaku bagi Anda, hukum konsumen Uni Eropa/Inggris (termasuk hak atas kesesuaian/conformity konten digital). Pengecualian dalam Pasal ini tidak berlaku bagi konsumen sejauh hukum wajib tersebut melarangnya. Kewajiban kesesuaian/garansi penjual dipenuhi melalui {mor} sebagai penjual sah (lihat Pasal 2).',
        },
        liability: {
          title: '13. Batasan Tanggung Jawab',
          content: '(1) Pengecualian kerugian (berlaku umum, dengan carve-out konsumen). Sejauh diizinkan hukum yang berlaku, {company} tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau punitif, termasuk kehilangan data, kehilangan keuntungan, atau gangguan usaha, yang timbul dari penggunaan atau ketidakmampuan menggunakan CAD. (2) Plafon agregat (cap) — hanya pengguna bisnis. Bagi pengguna bisnis/komersial, sejauh diizinkan hukum, tanggung jawab total dan agregat {company} yang timbul dari atau terkait CAD, lisensi, atau Ketentuan ini—dalam kontrak, perbuatan melawan hukum (termasuk kelalaian), maupun dasar lain—tidak melebihi jumlah biaya lisensi yang benar-benar diterima {company} atas produk terkait dalam 12 (dua belas) bulan sebelum peristiwa yang menimbulkan klaim. Batas ini bersifat akumulatif atas seluruh klaim dan tidak diperbarui per kejadian. (3) Konsumen (afirmatif). Plafon agregat pada ayat (2) tidak berlaku bagi konsumen. Tanggung jawab kami kepada konsumen ditentukan oleh hukum yang berlaku; tidak ada dalam Pasal ini yang membatasi tanggung jawab kepada konsumen di bawah batas yang dijamin hukum konsumen wajib (termasuk UU No. 8 Tahun 1999 dan, bila berlaku, hukum konsumen Uni Eropa/Inggris). (4) Carve-out non-derogable & keterpisahan. Tidak ada dalam Pasal 12 dan 13 yang mengecualikan atau membatasi tanggung jawab yang tidak dapat dikecualikan menurut hukum, termasuk atas: (i) kematian atau cedera badan akibat kelalaian kami; (ii) penipuan atau pernyataan keliru yang disengaja; (iii) kelalaian berat (gross negligence) atau kesalahan yang disengaja; dan (iv) hak statutori konsumen yang tidak dapat dikesampingkan. Apabila suatu pembatasan dinyatakan tidak berlaku, pembatasan tersebut dipisahkan (severable) dan sisanya tetap berlaku penuh.',
        },
        termination: {
          title: '14. Penghentian',
          content: 'Kami berhak menghentikan atau menangguhkan lisensi Anda apabila Anda melanggar syarat dan ketentuan ini. Anda juga dapat berhenti menggunakan CAD kapan saja dengan menghapus aplikasi dan extension dari perangkat Anda. Lisensi juga berakhir secara otomatis dan seketika apabila pembayaran Anda di-refund, dibatalkan, atau di-chargeback. Karena alasan teknis, kunci lisensi luring (offline) tidak selalu dapat dinonaktifkan dari jarak jauh; setiap penggunaan CAD setelah pengakhiran yang sah merupakan penggunaan tanpa lisensi dan melanggar Ketentuan ini. Pengecualian hak konsumen: Ketentuan ini tidak berlaku bagi—dan tidak menjadikan "pelanggaran"—penggunaan yang sah dalam rangka Anda menjalankan hak refund atau hak pembatalan (withdrawal) statutori Anda; selama dan sepanjang hak tersebut berlaku, penggunaan Anda tetap sah hingga refund/pembatalan tuntas diproses.',
        },
        disputeResolution: {
          title: '15. Hukum yang Berlaku & Penyelesaian Sengketa',
          content: 'Ketentuan ini diatur oleh hukum Republik Indonesia tanpa memperhatikan kaidah konflik hukum. Penyelesaian bertahap: Setiap sengketa terlebih dahulu diupayakan diselesaikan secara musyawarah melalui kontak resmi kami dalam waktu 30 (tiga puluh) hari sebelum menempuh jalur formal. Forum — pengguna bisnis: Bagi pengguna bisnis/komersial, sengketa yang tidak terselesaikan tunduk pada yurisdiksi eksklusif pengadilan yang berwenang di Jakarta, Indonesia, dan setiap klaim harus diajukan dalam waktu 1 (satu) tahun sejak peristiwa yang menimbulkannya, sejauh diizinkan hukum. Forum & batas waktu — konsumen (afirmatif): Ketentuan forum Jakarta dan batas waktu 1 (satu) tahun di atas tidak berlaku bagi konsumen. Konsumen Indonesia berhak menempuh penyelesaian sengketa konsumen melalui Badan Penyelesaian Sengketa Konsumen (BPSK) dan/atau Pengadilan Negeri di tempat domisilinya, sesuai UU No. 8 Tahun 1999. Konsumen Uni Eropa/Inggris dan yurisdiksi lain dapat mengandalkan ketentuan wajib dan berperkara di pengadilan domisilinya, serta menikmati jangka waktu klaim/garansi yang dijamin hukumnya (misalnya garansi statutori 2 tahun di Uni Eropa). Tidak ada dalam Pasal ini yang memperpendek jangka waktu yang dijamin hukum konsumen wajib. Tanpa pelepasan gugatan kelompok: Kami tidak mewajibkan arbitrase dan tidak memberlakukan pelepasan hak gugatan kelompok (class-action waiver) terhadap konsumen. Hak konsumen atas upaya hukum kolektif yang dijamin hukum (termasuk Directive (EU) 2020/1828) tetap utuh.',
        },
        copyright: {
          title: '16. Kebijakan Hak Cipta & Pelanggar Berulang',
          content: '{company} menghormati hak kekayaan intelektual. CAD tidak meng-host konten apa pun (lihat Pasal 2); karena itu, mekanisme notice-and-takedown DMCA Pasal 512(c) untuk konten yang di-host tidak berlaku penuh bagi kami. Pemegang hak yang meyakini CAD digunakan untuk melanggar haknya dapat mengirim pemberitahuan tertulis ke {email} yang memuat: (a) identifikasi karya; (b) dasar klaim; (c) data kontak; dan (d) pernyataan itikad baik. Tindakan kami terbatas pada langkah wajar atas kendali kami. Kebijakan pelanggar berulang: Kami dapat menangguhkan atau menghentikan lisensi pengguna yang, berdasarkan pemberitahuan yang sah dan/atau bukti yang memadai, terbukti dua kali atau lebih menggunakan CAD untuk pelanggaran hak cipta. Penghentian karena pelanggaran berulang tidak menimbulkan hak refund.',
        },
        changes: {
          title: '17. Perubahan Ketentuan',
          content: 'Kami dapat memperbarui Ketentuan ini dari waktu ke waktu. Perubahan non-material berlaku saat dipublikasikan beserta tanggal revisi. Untuk perubahan material yang merugikan konsumen, kami akan memberi pemberitahuan yang wajar (misalnya melalui aplikasi atau halaman ini) sebelum berlaku, dan Anda dapat berhenti menggunakan CAD bila tidak menyetujuinya. Perubahan tidak berlaku surut atas hak yang telah Anda peroleh atas pembelian yang sudah dilakukan, dan tidak memengaruhi hak konsumen wajib Anda.',
        },
        general: {
          title: '18. Ketentuan Umum',
          content: '(a) Keterpisahan. Apabila ada ketentuan yang dinyatakan tidak sah atau tidak dapat diberlakukan, ketentuan tersebut ditafsirkan/dibatasi seminimal mungkin agar tetap berlaku; bila tidak mungkin, ketentuan tersebut dipisahkan dan sisanya tetap berlaku penuh. (b) Keseluruhan Perjanjian & Hierarki. Ketentuan ini bersama Kebijakan Privasi dan Kebijakan Refund merupakan keseluruhan perjanjian terkait CAD dan menggantikan komunikasi sebelumnya. Materi pemasaran bersifat ilustratif dan bukan bagian perjanjian kecuali ditegaskan tertulis. Bila terjadi pertentangan: untuk refund berlaku Kebijakan Refund; untuk data berlaku Kebijakan Privasi; selebihnya Ketentuan ini. Untuk transaksi jual-beli, ketentuan {mor} sebagai penjual sah yang mengatur. Ketentuan ini tidak mengesampingkan hak konsumen atas informasi yang tidak menyesatkan. (c) Keadaan Kahar. Kami tidak bertanggung jawab atas keterlambatan/kegagalan akibat keadaan di luar kendali wajar kami (bencana alam, gangguan jaringan, tindakan pemerintah/perubahan hukum, pemblokiran/perubahan situs pihak ketiga). Hal ini tidak menghapus hak refund atau hak statutori konsumen. (d) Tanpa Pengesampingan. Kelalaian/keterlambatan menegakkan suatu ketentuan bukan pengesampingan; pengesampingan hanya sah bila tertulis oleh wakil kami yang berwenang. (e) Pemberitahuan. Pemberitahuan hukum kepada kami: {email} (atau alamat terdaftar {company}). Pemberitahuan kepada Anda dapat melalui aplikasi, email pembelian, atau halaman ini. (f) Bahasa yang Mengatur. Ketentuan ini dibuat dalam Bahasa Indonesia; terjemahan disediakan untuk kemudahan. Antar pengguna bisnis, bila terdapat perbedaan penafsiran, versi Bahasa Indonesia yang berlaku. Bagi konsumen, versi dalam bahasa tempat Ketentuan ini disajikan kepada Anda (atau bahasa yang dapat Anda pahami sesuai hukum wajib setempat) yang mengikat Anda; versi tersebut tidak boleh dipakai untuk mengikat Anda pada makna yang tidak Anda pahami.',
        },
        contact: {
          title: '19. Hubungi Kami',
          content: 'Untuk pertanyaan terkait syarat dan ketentuan CoreAsia Download Manager, hubungi kami di {email}.',
        },
      },
    },
    downloaderRecover: {
      title: 'Temukan License Key Anda',
      description: 'Kehilangan license key CoreAsia Download Manager atau pindah Mac? Ikuti langkah pemulihan ini — cek email pembelian, Gumroad Library, atau hubungi kami.',
      subtitle: 'Key hilang atau ganti Mac? Hampir semua kasus selesai dalam dua menit lewat langkah di bawah — tanpa perlu menunggu balasan support.',
      cta: 'Email kami untuk pemulihan key',
      ctaSubject: 'Pemulihan license key CADM',
      sections: {
        email: {
          title: '1. Cek email pembelian Anda',
          content: 'License key dikirim otomatis ke email Anda segera setelah pembelian — dari CoreAsia dan (untuk pembelian Gumroad) juga tercantum di receipt Gumroad. Coba langkah ini dulu:',
          items: [
            'Cari di inbox dengan kata kunci "CoreAsia Download Manager" atau "license key".',
            'Periksa folder Spam / Junk / Promotions — email otomatis kadang tersaring ke sana.',
            'Pastikan Anda mencari di alamat email yang dipakai saat checkout (bisa berbeda dari email utama Anda).',
          ],
        },
        gumroad: {
          title: '2. Beli lewat Gumroad? Buka Library Anda',
          content: 'Semua pembelian Gumroad tersimpan permanen di akun Anda. Buka gumroad.com/library, masuk dengan email yang Anda pakai saat membeli, lalu buka produk "CoreAsia Download Manager" — receipt di dalamnya memuat license key Anda dan tombol kirim-ulang receipt ke email.',
        },
        transfer: {
          title: '3. Ganti Mac atau key tertolak "sudah aktif di perangkat lain"?',
          content: 'Lisensi Anda berlaku untuk satu Mac pada satu waktu, dan Anda bisa memindahkannya sendiri:',
          items: [
            'Di Mac lama: buka CoreAsia Download Manager → Settings → License → "Deactivate this device".',
            'Di Mac baru: buka aplikasi → Activate → masukkan license key yang sama.',
            'Mac lama sudah tidak bisa diakses (rusak/terjual)? Hubungi kami — setelah verifikasi pembelian, kami lepaskan kunci perangkatnya dari server.',
          ],
        },
        contact: {
          title: '4. Masih belum ketemu? Kami bantu',
          content: 'Kirim email ke {email} DARI alamat email yang Anda pakai saat membeli, dan sertakan: perkiraan tanggal pembelian serta nomor order (jika ada — tertera di receipt Gumroad). Kami balas maksimal 1×24 jam. Demi keamanan, jangan pernah membagikan license key Anda kepada siapa pun.',
        },
      },
    },
    downloaderRefund: {
      title: 'Kebijakan Pengembalian Dana CoreAsia Download Manager',
      description: 'Kebijakan refund CoreAsia Download Manager — jaminan uang kembali 14 hari, hak konsumen, dan ketentuan Merchant of Record ({mor}).',
      lastUpdated: 'Terakhir diperbarui: Juni 2026',
      sections: {
        intro: {
          title: '1. Ringkasan',
          content: 'Kebijakan ini menjelaskan ketentuan pengembalian dana untuk pembelian lisensi CoreAsia Download Manager ("CAD") dari {company}. Kami menyediakan masa coba gratis 3 hari agar Anda dapat menilai kompatibilitas sebelum membeli, dan jaminan uang kembali 14 hari untuk lisensi Lifetime. Kebijakan ini diberikan sebagai tambahan atas, dan tidak mengurangi, hak konsumen wajib Anda menurut hukum yang berlaku. Pembelian Anda diproses oleh {mor} sebagai Merchant of Record.',
        },
        trialFirst: {
          title: '2. Coba Gratis Dulu',
          content: 'CAD menyediakan masa coba gratis 3 hari sebelum pembelian. Kami menyarankan Anda menggunakan masa coba ini untuk memastikan kompatibilitas dengan perangkat dan kebutuhan Anda sebelum membeli. Masa coba ini disediakan sebagai bentuk niat baik dan tidak mengurangi hak pembatalan atau hak konsumen wajib Anda. License key dikirim secara elektronik segera setelah pembelian.',
        },
        guarantee: {
          title: '3. Jaminan Uang Kembali 14 Hari',
          content: 'Untuk lisensi Lifetime, Anda dapat meminta pengembalian dana penuh dalam waktu 14 (empat belas) hari sejak tanggal pembelian. Anda tidak perlu memberikan alasan untuk meminta pengembalian dana dalam masa ini. Kami hanya akan menolak permintaan dalam masa ini bila terbukti terjadi penyalahgunaan sebagaimana diuraikan pada bagian "Pencegahan Penyalahgunaan". Pengembalian dana berdasarkan jaminan ini menyebabkan lisensi Anda berakhir, sebagaimana diatur pada bagian "Efek Refund atas Lisensi Anda".',
        },
        outsideWindow: {
          title: '4. Permintaan di Luar Jendela 14 Hari',
          content: 'Permintaan di luar masa jaminan 14 hari berada di luar jaminan ini dan tidak menciptakan hak atas pengembalian dana. Atas kebijaksanaan kami dan dengan itikad baik, kami tetap dapat mempertimbangkannya kasus per kasus — terutama bila terdapat (i) masalah teknis yang membuat aplikasi tidak dapat digunakan dan tidak dapat kami selesaikan dalam waktu yang wajar; (ii) pembelian ganda atau keliru yang dapat diverifikasi; atau (iii) produk secara material tidak sesuai dengan deskripsi resmi kami. Untuk pembelian ganda yang tidak disengaja, kami mengembalikan dana atas salinan berlebih (duplikat), bukan atas lisensi yang Anda pertahankan dan gunakan. Ketentuan ini tidak mengurangi hak Anda yang lebih luas berdasarkan hukum yang berlaku, yang tetap berlaku.',
        },
        effect: {
          title: '5. Efek Refund atas Lisensi Anda',
          content: 'Saat permintaan pengembalian dana Anda disetujui dan dana dikembalikan, lisensi CAD yang terkait dengan pembelian tersebut berakhir secara hukum dan tidak lagi sah digunakan sejak tanggal refund. Anda setuju untuk berhenti menggunakan CAD dan menghapus aplikasi beserta license key dari seluruh perangkat Anda. Setiap penggunaan, penyalinan, pembagian, atau penjualan ulang license key setelah refund merupakan penggunaan tanpa lisensi yang sah dan merupakan pelanggaran Ketentuan Penggunaan kami, yang dapat kami tindak lanjuti sesuai hukum yang berlaku. Dengan mengajukan dan menerima pengembalian dana, Anda menyetujui ketentuan ini.',
        },
        abuse: {
          title: '6. Pencegahan Penyalahgunaan',
          content: 'Kami berhak menolak atau membatasi permintaan pengembalian dana yang kami nilai secara wajar menyalahgunakan kebijakan ini — termasuk, namun tidak terbatas pada: permintaan berulang atau berpola, perilaku beli-lalu-refund secara serial, indikasi penggunaan license key setelah refund sebelumnya, pembagian atau penjualan ulang key, atau pembelian yang tampaknya dilakukan untuk memperoleh akses sementara tanpa membayar. Pengembalian dana pada umumnya diberikan satu kali per pelanggan untuk produk yang sama, kecuali kami menentukan lain. Lisensi CAD diberikan kepada satu pengguna untuk penggunaan wajar pada perangkat milik Anda sendiri; lisensi bersifat pribadi dan tidak dapat dipindahtangankan. Anda tidak boleh membagikan, menjual ulang, mempublikasikan, atau menyebarkan license key Anda.',
        },
        digitalConsent: {
          title: '7. Konten Digital & Persetujuan Mulai Segera (EU/UK)',
          content: 'Untuk konsumen Uni Eropa/Inggris, hak pembatalan (withdrawal) 14 hari atas konten/layanan digital dapat hilang hanya bila ketiga syarat berikut terpenuhi sebelum pelaksanaan dimulai: (a) Anda memberikan persetujuan eksplisit terlebih dahulu agar pelaksanaan dimulai segera; (b) Anda mengakui bahwa dengan demikian Anda kehilangan hak pembatalan 14 hari; dan (c) Anda menerima konfirmasi pada media yang tahan lama (durable medium, mis. email). Konfirmasi durable medium ini disampaikan oleh {mor} sebagai penjual sah. Apabila salah satu syarat tidak terpenuhi, pelepasan hak ini batal dan Anda tetap berhak atas pembatalan dan refund penuh sesuai hukum, meskipun unduhan telah dimulai. Dalam keadaan apa pun, hal ini tidak menghapus jaminan uang kembali 14 hari kami, yang tetap kami berikan sebagai kebijakan komersial, dan tidak mengurangi hak statutori Anda.',
        },
        statutory: {
          title: '8. Hak Statutori Anda',
          content: 'Kebijakan dan jaminan ini diberikan sebagai tambahan atas, dan tidak mengurangi, hak konsumen wajib yang Anda miliki menurut hukum yang berlaku — termasuk hak pembatalan dan jaminan kesesuaian produk bagi konsumen di Uni Eropa, EEA, dan Inggris (kecuali bila hak tersebut telah berakhir secara sah karena Anda meminta dan menyetujui pelaksanaan segera saat checkout), serta hak menurut Undang-Undang No. 8 Tahun 1999 tentang Perlindungan Konsumen di Indonesia. Bila hak wajib memberi Anda perlindungan lebih luas, hak itulah yang berlaku.',
        },
        products: {
          title: '9. Produk: Lifetime & 1-Day Pass',
          content: '"Lifetime" berarti lisensi sekali bayar yang berlaku tanpa biaya berulang untuk lini versi mayor CoreAsia Download Manager yang berlaku saat pembelian, termasuk semua update dalam lini versi tersebut. Peningkatan ke versi mayor berikutnya dapat ditawarkan secara terpisah. Jika kami menghentikan produk, lisensi Anda tetap berfungsi pada versi terakhir yang dirilis. Jaminan uang kembali 14 hari berlaku untuk lisensi Lifetime. Untuk 1-Day Pass: masa berlaku dimulai sejak license key dikirim kepada Anda; karena layanan dilaksanakan segera setelah pengiriman, 1-Day Pass tidak dapat dikembalikan setelah key dikirim, kecuali hukum yang berlaku menentukan lain.',
        },
        howTo: {
          title: '10. Cara Mengajukan',
          content: 'Kirim email ke {email} dengan menyertakan nomor order / Order Reference dan email yang Anda pakai saat pembelian. Ceritakan kendala Anda dan kami bantu secepatnya.',
        },
        processing: {
          title: '11. Proses & Waktu',
          content: 'Setelah disetujui, pengembalian dana diproses melalui {mor} ke metode pembayaran asli Anda, dengan estimasi 5–10 hari kerja setelah persetujuan; waktu aktual bergantung pada penyedia pembayaran dan bank penerbit Anda. Refund diproses dalam mata uang transaksi asli. Jika pembayaran Anda dikonversi oleh bank atau penyedia kartu, jumlah yang Anda terima dapat sedikit berbeda akibat selisih kurs atau biaya konversi pihak ketiga, yang berada di luar kendali kami maupun {mor}.',
        },
        dispute: {
          title: '12. Sebelum Mengajukan Sengketa (Chargeback)',
          content: 'Untuk pembelian yang sah, mohon hubungi kami lebih dulu di {email} sebelum mengajukan sengketa (chargeback) ke bank Anda; sebagian besar masalah dapat kami selesaikan lebih cepat lewat email. Tagihan Anda dapat muncul menyebut {mor} (mis. "{morStatement}"), CoreAsia, atau CAD — mohon kenali ini sebelum melaporkan tagihan tak dikenal. Menghubungi kami lebih dulu tidak membatasi hak Anda untuk mengajukan sengketa melalui bank atau penyedia kartu kapan pun. Sama seperti refund, sengketa yang dikabulkan untuk Anda mengakhiri lisensi terkait secara hukum sejak tanggal tersebut dengan ketentuan yang sama seperti bagian "Efek Refund atas Lisensi Anda", dan Anda setuju untuk berhenti menggunakan CAD.',
        },
        mor: {
          title: '13. Penjual Tercatat (Merchant of Record)',
          content: 'Pembelian Anda diproses oleh {mor} sebagai Merchant of Record dan penjual tercatat. Kontrak pembelian dan penanganan pajak (VAT/GST) secara hukum dilakukan oleh {mor}; hak konsumen wajib Anda dapat dijalankan melalui {mor}. Kebijakan refund ini melengkapi dan tidak menggantikan Terms of Sale {mor}; bila terdapat pertentangan atas hal yang ditangani {mor} sebagai Merchant of Record, Terms of Sale {mor} yang berlaku. {company} bertanggung jawab atas produk, lisensi, dan dukungan.',
        },
        integration: {
          title: '14. Hukum yang Berlaku, Keterpaduan & Peran Penjual',
          content: 'Kebijakan Refund ini merupakan bagian dari dan tunduk pada Ketentuan Penggunaan CAD, dan diatur oleh hukum Republik Indonesia, tanpa mengurangi hak konsumen wajib yang berlaku bagi Anda (termasuk hak pembatalan konsumen Uni Eropa/Inggris dan hak berdasarkan UU No. 8 Tahun 1999). {mor} adalah penjual sah (Merchant of Record); kewajiban statutori penjual atas refund, pembatalan (withdrawal), dan kesesuaian/garansi dipenuhi melalui {mor}. Kebijakan refund {company} merupakan kebijakan tambahan (good-will) di atas hak statutori tersebut. Apabila terdapat pertentangan mengenai refund antara dokumen ini dan Ketentuan Penggunaan, Kebijakan Refund ini yang berlaku untuk hal refund. Konsekuensi pelanggaran, ganti rugi, dan penyelesaian sengketa diatur lebih lanjut dalam Ketentuan Penggunaan (Pasal 9 dan Pasal 15).',
        },
        contact: {
          title: '15. Hubungi Kami',
          content: '{company}. Untuk pertanyaan tentang kebijakan ini atau pengajuan pengembalian dana, hubungi kami di {email}.',
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
    whatsappFloat: {
      ariaLabel: 'Chat WhatsApp dengan tim CoreAsia',
      tooltip: 'Chat WhatsApp',
      message:
        'Halo CoreAsia, saya ingin berkonsultasi soal produk dan layanan yang cocok untuk bisnis saya.',
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
        services: 'Layanan',
        privacy: 'Privacy Policy',
        terms: 'TOS',
      },
      productLinks: [
        { label: 'Pantau', to: '/products/pantau' },
        { label: 'Build by CoreAsia', to: '/products/build' },
        { label: 'LeadKu', to: '/products/leadku' },
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
