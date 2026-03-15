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
      title:
        'Bangun operasi digital lebih cepat dengan <span class="ca-gradient-text">ekosistem produk CoreAsia</span>.',
      subtitle:
        'Dari sertifikasi digital, web monitoring, sampai CRM multi-workspace, CoreAsia membantu bisnis Anda memilih produk yang tepat dan model kerja sama yang realistis untuk launch, scale, dan monetisasi.',
      ctaPrimary: 'Diskusikan Kebutuhan',
      ctaSecondary: 'WhatsApp',
      powerStatement:
        'Berangkat dari pengalaman membangun sistem sertifikasi skala besar, kini CoreAsia berkembang sebagai product ecosystem untuk bisnis yang ingin bertumbuh lebih cepat.',
      chips: ['Product Ecosystem', 'Growth Partnership', 'Enterprise Delivery'],
    },
    products: {
      kicker: 'Produk Kami',
      title: 'Pilih produk yang sesuai dengan kebutuhan tim Anda',
      subtitle:
        'Setiap produk dirancang untuk menyelesaikan masalah yang spesifik, tetapi tetap bisa berkembang dalam satu ekosistem yang terhubung.',
      items: [
        {
          name: 'CoreAsia LMS',
          badge: 'Flagship',
          description:
            'Platform sertifikasi dan training management untuk operasional yang butuh workflow rapi, audit-ready, dan siap di-scale.',
          features: [
            'Workflow sertifikasi end-to-end',
            'White-label untuk brand organisasi',
            'Assessment, CBT, dan sertifikat digital',
          ],
          ctaLabel: 'Lihat Solusi LMS',
          to: '/solutions/lms',
        },
        {
          name: 'Pantau by CoreAsia',
          badge: 'New',
          description:
            'Dashboard monitoring yang menggabungkan GA4 dan Google Search Console untuk freelancer, agensi, dan bisnis yang butuh insight web yang cepat dibaca.',
          features: [
            'GA4 & GSC dalam satu dashboard',
            'Ringkasan performa yang mudah dipahami',
            'Cocok untuk audit performa rutin',
          ],
          ctaLabel: 'Pelajari Pantau',
          to: '/contact?subject=pantau',
        },
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Early Access',
          description:
            'CRM multi-workspace untuk tim sales yang perlu pipeline lebih rapi, aktivitas tim terlacak, dan reporting yang cepat.',
          features: [
            'Pipeline management yang ringan',
            'Multi-workspace dalam satu akun',
            'Aktivitas tim dan reporting lebih jelas',
          ],
          ctaLabel: 'Pelajari LeadKu',
          to: '/contact?subject=leadku',
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
  about: {
    title: 'Tentang Kami - Strategic Technology Partner',
    description:
      'Mengenal lebih dekat CoreAsia — mitra transformasi digital untuk lembaga pendidikan, bisnis berbasis layanan, dan product ecosystem yang sedang bertumbuh.',
    kicker: 'Our Vision',
    hero: {
      title: 'Building <span class="ca-gradient-text">Digital Infrastructure for Future</span>',
      subtitle:
        'CoreAsia berkembang dari pengalaman di sektor sertifikasi menjadi mitra teknologi untuk organisasi yang ingin membangun operasi digital yang lebih siap scale.',
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
      title: 'Perjalanan Kami',
      subtitle: 'Evolusi dari Training Center hingga Product Ecosystem Builder',
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
          title: 'Product Ecosystem Expansion',
          description: 'CoreAsia berkembang menjadi ekosistem produk dan partner teknologi untuk bisnis yang ingin scale.',
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
  // Legal pages
  legal: {
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
        { label: 'CoreAsia LMS', to: '/solutions/lms' },
        { label: 'Pantau', to: '/contact?subject=pantau' },
        { label: 'LeadKu', to: '/contact?subject=leadku' },
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
      title: 'Move faster with the <span class="ca-gradient-text">CoreAsia product ecosystem</span>.',
      subtitle:
        'From certification operations to web monitoring and multi-workspace CRM, CoreAsia helps you choose the right product and engagement model for launch, scale, and monetization.',
      ctaPrimary: 'Discuss Your Needs',
      powerStatement:
        'Built on experience delivering large-scale certification systems, CoreAsia is growing into a product ecosystem for businesses that want sharper digital execution.',
      chips: ['Product Ecosystem', 'Growth Partnership', 'Enterprise Delivery'],
    },
    products: {
      kicker: 'Our Products',
      title: 'Choose the product that fits your team',
      subtitle:
        'Each product solves a focused operational problem while still fitting into a broader ecosystem built for business growth.',
      items: [
        {
          name: 'CoreAsia LMS',
          badge: 'Flagship',
          description:
            'A certification and training management platform for teams that need clean workflows, audit-ready operations, and scalable delivery.',
          features: [
            'End-to-end certification workflow',
            'White-label delivery for your organization',
            'Assessment, CBT, and digital certificates',
          ],
          ctaLabel: 'Explore LMS',
          to: '/solutions/lms',
        },
        {
          name: 'Pantau by CoreAsia',
          badge: 'New',
          description:
            'A monitoring dashboard that brings GA4 and Google Search Console together for freelancers, agencies, and businesses that need web insights in one place.',
          features: [
            'GA4 and GSC in a single view',
            'Readable performance summaries',
            'Useful for recurring monitoring audits',
          ],
          ctaLabel: 'Explore Pantau',
          to: '/contact?subject=pantau',
        },
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Early Access',
          description:
            'A multi-workspace CRM for sales teams that need cleaner pipelines, visible team activity, and faster reporting.',
          features: [
            'Lightweight pipeline management',
            'Multi-workspace under one account',
            'Sharper activity tracking and reporting',
          ],
          ctaLabel: 'Explore LeadKu',
          to: '/contact?subject=leadku',
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
  components: {
    header: {
      ctaText: 'Consult',
      responseTime: 'Team response',
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
        { label: 'CoreAsia LMS', to: '/solutions/lms' },
        { label: 'Pantau', to: '/contact?subject=pantau' },
        { label: 'LeadKu', to: '/contact?subject=leadku' },
      ],
      partnershipLinks: [
        { label: 'SaaS Subscription', to: '/pricing' },
        { label: 'Venture Partnership', to: '/solutions/venture' },
        { label: 'Enterprise Custom', to: '/contact?subject=enterprise' },
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
