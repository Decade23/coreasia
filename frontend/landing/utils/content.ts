import { DEFAULT_LOCALE } from './i18n'

export const CONTENT = {
  id: {
    // Navigation
    nav: {
      home: 'Beranda',
      solutions: 'Solusi',
      venture: 'Venture',
      about: 'Tentang Kami',
      contact: 'Hubungi Kami',
      pricing: 'Harga',
    },
    // Common (only keep actively used + essential UI strings)
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
    },
    // Home page
    home: {
      title: 'Infrastruktur Teknologi Pendidikan & Sertifikasi',
      description: 'Mitra strategis untuk Lembaga Sertifikasi Profesi (LSP) dan Training Center. Platform SaaS LMS, venture partnership, dan solusi enterprise.',
      kicker: 'Strategic Technology Partner',
      hero: {
        title: 'Platform Sertifikasi <span class="ca-gradient-text">Standar Enterprise</span> untuk Bisnis Pendidikan yang Serius',
        subtitle: 'Tinggalkan sistem manual yang menghambat audit. CoreAsia memberikan infrastruktur teknologi yang compliant, aman, dan siap menangani jutaan sertifikasi tanpa <i>downtime</i>.',
        ctaPrimary: 'Mulai Konsultasi',
        ctaSecondary: 'WhatsApp',
        powerStatement: 'Dipercaya mengelola 1.2M+ sertifikasi tanpa insiden keamanan data.',
        chips: ['SaaS Platform', 'Enterprise Solutions'],
      },
      readyCTA: {
        title: 'Siap transformasi bisnis pendidikan Anda?',
        subtitle: 'Tim kami siap berdiskusi tentang kebutuhan Anda dan memberikan rekomendasi terbaik.',
        ctaPrimary: 'Jadwalkan Konsultasi',
        ctaSecondary: 'Chat via WhatsApp',
      },
    },
    // About page
    about: {
      title: 'Tentang Kami - Strategic Technology Partner',
      description: 'Mengenal lebih dekat CoreAsia — mitra transformasi digital untuk lembaga pendidikan dan badan sertifikasi profesional di Indonesia.',
      kicker: 'Our Vision',
      hero: {
        title: 'Building <span class="ca-gradient-text">Digital Infrastructure for Future</span>',
        subtitle: 'CoreAsia adalah tulang punggung teknologi untuk ekosistem pendidikan dan sertifikasi profesional di Indonesia.',
        ctaPrimary: 'Hubungi Kami',
        ctaSecondary: 'WhatsApp',
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
        title: 'Perjalanan Kami',
        subtitle: 'Evolusi dari Training Center hingga Infrastructure Provider',
        events: [
          {
            year: '2020',
            title: 'Training Center Foundation',
            description: 'Dimulai sebagai pusat pelatihan teknologi dengan fokus pada sertifikasi digital.',
            icon: 'lucide:graduation-cap',
          },
          {
            year: '2022',
            title: 'Technology Integration',
            description: 'Pengembangan sistem manajemen pembelajaran pertama untuk internal use.',
            icon: 'lucide:cpu',
          },
          {
            year: '2024',
            title: 'SaaS Platform Launch',
            description: 'Meluncurkan platform SaaS LMS untuk lembaga sertifikasi di seluruh Indonesia.',
            icon: 'lucide:rocket',
          },
          {
            year: '2026',
            title: 'Infrastructure Provider',
            description: 'Evolusi menjadi mitra infrastruktur teknologi lengkap untuk ekosistem pendidikan.',
            icon: 'lucide:building-2',
          },
        ],
      },
      leadership: {
        title: 'Leadership',
        subtitle: 'Visi yang Dipimpin oleh Teknologi',
        name: 'Dedi - Founder & Principal Tech Lead',
        description: 'Teknologi enthusiast dengan visi untuk mengintegrasikan pendidikan dengan solusi SaaS yang cutting-edge.',
        chips: ['10+ Years Experience', 'SaaS Architecture', 'Education Technology'],
      },
      readyCTA: {
        title: 'Siap Transformasi Bisnis Pendidikan Anda?',
        subtitle: 'Diskusikan kebutuhan teknologi pendidikan Anda dengan tim ahli kami. Kami siap membantu dari konsep hingga implementasi.',
        ctaPrimary: 'Hubungi Kami',
        ctaSecondary: 'WhatsApp',
      },
    },
    // Solutions pages
    solutions: {
      title: 'Solusi Kami',
      subtitle: 'Pilih jalur pertumbuhan sesuai stage bisnis Anda',
      kicker: 'Our Solutions',
      lms: {
        title: 'SaaS LMS Platform - Online Certification Solution',
        description: 'Luncurkan akademi digital Anda dalam hitungan hari. Platform all-in-one untuk penjualan kursus, ujian online, dan sertifikasi digital.',
        kicker: 'SaaS LMS for Certification',
        hero: {
          title: 'LMS white-label untuk <span class="ca-gradient-text">sertifikasi online</span> yang siap dijual.',
          subtitle: 'Solusi end-to-end untuk pendaftaran, assessment, dan sertifikat digital. Dirancang agar team operasional tetap nyaman dari mobile sampai desktop.',
          ctaPrimary: 'Request Demo',
          ctaSecondary: 'WhatsApp Sales',
          chips: ['APL-01 & APL-02 digital', 'CBT + Essay grading', 'QR certificate validation'],
        },
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
      venture: {
        title: 'Venture Partner',
        description: 'Akselerasi bisnis tanpa risiko modal. Kami investasi teknologi senilai ratusan juta, kita bagi hasil dari profit.',
        kicker: 'Venture Partnership',
        hero: {
          title: 'Launch bisnis digital dengan model <span class="bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent">bagi hasil</span> yang transparan.',
          subtitle: 'Cocok untuk owner yang punya market dan eksekusi bisnis, tetapi ingin meminimalkan beban investasi teknologi di awal.',
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
          subtitle: 'Banyak bisnis gagal scale bukan karena market, tapi karena cost awal product development terlalu berat.',
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
      description: 'Hubungi tim CoreAsia untuk konsultasi strategis terkait SaaS LMS, venture partnership, dan solusi enterprise.',
      kicker: 'Hubungi Kami',
      hero: {
        title: 'Konsultasi strategi produk <span class="ca-gradient-text">tanpa ribet</span>',
        subtitle: 'Ceritakan kebutuhan bisnis Anda. Tim kami bantu memetakan opsi paling realistis untuk launch, scale, dan monetisasi.',
        ctaPrimary: 'Jadwalkan Konsultasi',
        ctaSecondary: 'Chat via WhatsApp',
      },
      channels: {
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
          demo: 'Request Demo SaaS LMS',
          pricing: 'Informasi Pricing',
          venture: 'Venture Partnership',
          enterprise: 'Custom Enterprise Solution',
          support: 'Technical Support',
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
    },
    // Legal pages
    legal: {
      privacy: {
        title: 'Kebijakan Privasi',
        description: 'Kebijakan privasi CoreAsia menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.',
        lastUpdated: 'Terakhir diperbarui: Februari 2026',
        sections: {
          informationCollected: 'Informasi yang Kami Kumpulkan',
          informationUsage: 'Penggunaan Informasi',
          dataProtection: 'Perlindungan Data',
          dataSharing: 'Pembagian Informasi',
          cookies: 'Cookie dan Teknologi Pelacakan',
          userRights: 'Hak Anda',
          policyChanges: 'Perubahan Kebijakan',
          contact: 'Contact Us',
        },
      },
      terms: {
        title: 'Syarat dan Ketentuan',
        description: `Syarat dan ketentuan penggunaan layanan CoreAsia. Harap baca dengan seksama sebelum menggunakan layanan kami.`,
        lastUpdated: 'Terakhir diperbarui: Februari 2026',
        sections: {
          generalTerms: 'Ketentuan Umum',
          serviceDescription: 'Deskripsi Layanan',
          websiteUsage: 'Penggunaan Website',
          intellectualProperty: 'Hak Kekayaan Intelektual',
          liabilityLimitation: 'Batasan Tanggung Jawab',
          serviceAgreement: 'Perjanjian Layanan',
          applicableLaw: 'Hukum yang Berlaku',
          termsChanges: 'Perubahan Ketentuan',
          contact: 'Contact Us',
        },
      },
    },
    // Error pages
    errors: {
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
      header: {
        ariaLabel: 'Main Navigation',
        mobileMenuAriaOpen: 'Buka menu',
        mobileMenuAriaClose: 'Tutup menu',
        ctaText: 'Konsultasi',
        responseTime: 'Respon tim',
      },
      footer: {
        copyright: 'All rights reserved.',
        description: 'Mitra transformasi digital untuk LSP, training center, dan bisnis yang ingin scale dengan model SaaS atau venture partnership.',
        chips: ['BNSP workflow ready', 'SaaS & Enterprise', 'Jakarta, Indonesia'],
        links: {
          products: 'Produk',
          contact: 'Kontak',
          privacy: 'Privacy Policy',
          terms: 'TOS',
        },
      },
      solutionsGrid: {
        title: 'Solusi Kami',
        subtitle: 'Pilih jalur pertumbuhan sesuai stage bisnis Anda',
        learnMore: 'Pelajari lebih lanjut',
        solutions: [
          {
            title: 'SaaS LMS Platform',
            description: 'Solusi end-to-end untuk LSP & Training Centers. Dashboard manajemen lengkap dengan sertifikat digital.',
            icon: 'lucide:monitor',
            features: [
              'E-Certificate Verifiable',
              'Client Portal (White Label)',
              'Integrated Payment Gateway',
            ],
          },
          {
            title: 'Venture Partnership',
            description: 'Model revenue sharing tanpa biaya di depan. Kami berinvestasi teknologi, Anda fokus mengajar.',
            icon: 'lucide:handshake',
            features: [
              'Zero Upfront Cost',
              'Technical Advisory',
              'Growth Marketing Support',
            ],
          },
          {
            title: 'Custom Enterprise',
            description: 'Infrastruktur teknologi khusus untuk kebutuhan unik korporasi dan lembaga pemerintahan.',
            icon: 'lucide:building-2',
            features: [
              'Dedicated Server',
              'SLA 99.9%',
              'Custom Integrations',
            ],
          },
        ],
      },
      trustedBy: {
        ariaLabel: 'Trusted by partners',
        title: 'Trusted By',
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
      defaultTitle: 'CoreAsia Technology - Strategic Technology Partner',
      defaultDescription: 'Digital transformation partner for LSP, training centers, and businesses wanting to scale with SaaS or venture partnership models.',
      siteName: 'CoreAsia Teknologi',
      tagline: 'Strategic Technology Partner',
      domain: 'coreasia.id',
      url: 'https://coreasia.id',
      ogImage: '/social/og-image.png',
      twitterImage: '/social/twitter-card.webp',
    },
  },
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