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
          to: '/products/lms',
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
          to: '/products/pantau',
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
    pantau: {
      title: 'Pantau - Dashboard Monitoring Web yang Lebih Mudah Dibaca',
      description:
        'Pantau menggabungkan GA4 dan Google Search Console ke dashboard monitoring yang lebih ringkas untuk owner, freelancer, dan agency.',
      kicker: 'Website Monitoring Dashboard',
      hero: {
        title:
          'Pantau performa website dengan <span class="ca-gradient-text">dashboard yang langsung bisa dipahami</span>.',
        subtitle:
          'Pantau membantu tim marketing, freelancer, dan agency membaca insight penting dari GA4 serta Google Search Console tanpa tenggelam di dashboard yang rumit.',
        ctaPrimary: 'Minta Preview Pantau',
        ctaSecondary: 'WhatsApp',
        chips: ['GA4 + GSC', 'Readable dashboard', 'Monitoring rutin lebih cepat'],
      },
      detailedFeatures: [
        {
          title: 'Ringkasan Traffic Cepat',
          description: 'Lihat trafik, user aktif, dan tren performa utama dalam satu panel yang lebih mudah dipahami.',
          icon: 'lucide:activity',
        },
        {
          title: 'Search Console Snapshot',
          description: 'Pantau query, impresi, klik, dan halaman penting tanpa harus berpindah-pindah dashboard.',
          icon: 'lucide:search-check',
        },
        {
          title: 'Insight untuk Audit Rutin',
          description: 'Bantu tim Anda membaca perubahan performa mingguan untuk kebutuhan evaluasi dan reporting.',
          icon: 'lucide:clipboard-list',
        },
        {
          title: 'Ringkas untuk Klien atau Owner',
          description: 'Insight disusun agar tetap nyaman dibaca oleh non-teknis, bukan hanya analyst internal.',
          icon: 'lucide:layout-dashboard',
        },
      ],
      audience: {
        label: 'Best Fit',
        title: 'Siapa yang paling cocok memakai Pantau',
        subtitle:
          'Produk ini dirancang untuk tim yang butuh monitoring performa web yang cepat dibaca dan mudah dijelaskan kembali.',
        items: [
          {
            icon: 'lucide:briefcase-business',
            title: 'Freelancer & consultant',
            description: 'Memudahkan audit performa web dan penyusunan insight tanpa dashboard yang terlalu berat.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Agency kecil sampai menengah',
            description: 'Monitoring beberapa website jadi lebih rapi untuk kebutuhan review internal dan laporan klien.',
          },
          {
            icon: 'lucide:megaphone',
            title: 'Owner & marketing team',
            description: 'Membaca sinyal performa lebih cepat tanpa harus memahami detail teknis GA4 dan GSC.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'Alur monitoring yang lebih ringkas dari dashboard standar',
        items: [
          {
            title: 'Hubungkan data source',
            description: 'Sinkronkan data dari GA4 dan Google Search Console ke satu tempat yang lebih fokus.',
          },
          {
            title: 'Baca sinyal terpenting',
            description: 'Tim Anda langsung melihat angka, halaman, dan tren yang paling layak ditindaklanjuti.',
          },
          {
            title: 'Tindak lanjuti insight',
            description: 'Gunakan insight untuk audit rutin, review klien, atau keputusan optimasi konten dan SEO.',
          },
        ],
      },
      cta: {
        title: 'Ingin monitoring web yang lebih cepat dibaca?',
        subtitle: 'Ceritakan alur reporting Anda saat ini. Kami bantu tunjukkan bagaimana Pantau bisa masuk ke workflow tim.',
        button: 'Diskusikan Pantau',
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
      'Pilih paket CoreAsia LMS yang sesuai dengan kebutuhan organisasi Anda, dari tim kecil hingga kebutuhan enterprise.',
    kicker: 'Pricing',
    hero: {
      title: 'Pilih plan yang tepat <span class="ca-gradient-text">untuk organisasi Anda</span>',
      subtitle:
        'Mulai dari LSP kecil hingga enterprise, kami menyiapkan opsi yang realistis untuk launch, operasional, dan pertumbuhan berikutnya.',
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
      helper: 'Huruf kecil, angka, dan dash. Minimal 3 karakter.',
      available: '{slug}.coreasia.id tersedia',
      usedSuggestion: 'Sudah digunakan. Coba:',
    },
    validation: {
      orgNameRequired: 'Nama organisasi wajib diisi',
      slugMin: 'Subdomain minimal 3 karakter',
      slugFormat: 'Hanya huruf kecil, angka, dan dash. Tidak boleh diawali atau diakhiri dash.',
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
        { label: 'CoreAsia LMS', to: '/products/lms' },
        { label: 'Pantau', to: '/products/pantau' },
        { label: 'LeadKu', to: '/products/leadku' },
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
          to: '/products/lms',
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
          to: '/products/pantau',
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
          to: '/products/leadku',
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
  about: {
    title: 'About Us - Strategic Technology Partner',
    description:
      'Get to know CoreAsia as a strategic technology partner for certification, digital operations, and scalable product delivery.',
    hero: {
      title: 'Building <span class="ca-gradient-text">digital infrastructure for the future</span>',
      subtitle:
        'CoreAsia grew from hands-on work in certification operations into a technology partner for organizations that need cleaner execution and room to scale.',
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
      title: 'Our Journey',
      subtitle: 'From training operations to product ecosystem builder',
      events: [
        {
          year: '2020',
          title: 'Training Center Foundation',
          description: 'Started as a technology training center with a strong focus on digital certification.',
          icon: 'lucide:graduation-cap',
        },
        {
          year: '2022',
          title: 'Technology Integration',
          description: 'Built the first internal learning management workflows to support operational delivery.',
          icon: 'lucide:cpu',
        },
        {
          year: '2024',
          title: 'SaaS Platform Launch',
          description: 'Launched LMS delivery for certification bodies and training organizations across Indonesia.',
          icon: 'lucide:rocket',
        },
        {
          year: '2026',
          title: 'Product Ecosystem Expansion',
          description: 'Expanded into a broader product ecosystem and strategic technology partnership model.',
          icon: 'lucide:building-2',
        },
      ],
    },
    leadership: {
      title: 'Leadership',
      subtitle: 'Technology-led direction with pragmatic execution',
      name: 'Dedi - Founder & Principal Tech Lead',
      description:
        'A product-minded tech lead focused on turning operational complexity into scalable systems and monetizable digital products.',
      chips: ['10+ Years Experience', 'SaaS Architecture', 'Education Technology'],
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
      helper: 'Use lowercase letters, numbers, and dashes. Minimum 3 characters.',
      available: '{slug}.coreasia.id is available',
      usedSuggestion: 'Already taken. Try:',
    },
    validation: {
      orgNameRequired: 'Organization name is required',
      slugMin: 'Subdomain must be at least 3 characters',
      slugFormat: 'Use lowercase letters, numbers, and dashes only. It cannot start or end with a dash.',
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
      title: 'Pantau - A Web Monitoring Dashboard That Is Easier to Read',
      description:
        'Pantau brings GA4 and Google Search Console into a more focused monitoring dashboard for owners, freelancers, and agencies.',
      kicker: 'Website Monitoring Dashboard',
      hero: {
        title:
          'Monitor website performance with a <span class="ca-gradient-text">dashboard that is easier to understand</span>.',
        subtitle:
          'Pantau helps marketing teams, freelancers, and agencies read the most important insights from GA4 and Google Search Console without drowning in complex dashboards.',
        ctaPrimary: 'Request Pantau Preview',
        ctaSecondary: 'WhatsApp',
        chips: ['GA4 + GSC', 'Readable dashboard', 'Faster recurring monitoring'],
      },
      detailedFeatures: [
        {
          title: 'Fast traffic overview',
          description: 'See traffic, active users, and top performance trends in a single summary panel.',
          icon: 'lucide:activity',
        },
        {
          title: 'Search Console snapshot',
          description: 'Track queries, impressions, clicks, and key pages without jumping across multiple views.',
          icon: 'lucide:search-check',
        },
        {
          title: 'Insight for recurring audits',
          description: 'Helps your team read weekly performance changes for routine reviews and decision making.',
          icon: 'lucide:clipboard-list',
        },
        {
          title: 'Readable for clients or owners',
          description: 'Insights are shaped to be useful for non-technical stakeholders, not only analysts.',
          icon: 'lucide:layout-dashboard',
        },
      ],
      audience: {
        label: 'Best Fit',
        title: 'Who gets the most value from Pantau',
        subtitle:
          'Designed for teams that need website monitoring insight that is fast to read and easy to explain back to stakeholders.',
        items: [
          {
            icon: 'lucide:briefcase-business',
            title: 'Freelancers and consultants',
            description: 'Useful for faster performance audits and simpler insight delivery without heavy dashboards.',
          },
          {
            icon: 'lucide:building-2',
            title: 'Small to mid agencies',
            description: 'Makes recurring website monitoring cleaner for internal reviews and client reporting.',
          },
          {
            icon: 'lucide:megaphone',
            title: 'Owners and marketing teams',
            description: 'Lets teams read the main performance signals faster without deep GA4 or GSC expertise.',
          },
        ],
      },
      workflow: {
        label: 'How It Works',
        title: 'A leaner monitoring flow than standard dashboards',
        items: [
          {
            title: 'Connect the data source',
            description: 'Bring GA4 and Google Search Console data into one focused view.',
          },
          {
            title: 'Read the most important signals',
            description: 'Your team sees the metrics, pages, and trends that deserve action first.',
          },
          {
            title: 'Act on the insight',
            description: 'Use the insight for recurring audits, client reviews, or SEO and content decisions.',
          },
        ],
      },
      cta: {
        title: 'Need website monitoring that is easier to read?',
        subtitle: 'Show us how your reporting works today and we will map how Pantau can fit your team workflow.',
        button: 'Discuss Pantau',
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
        { label: 'CoreAsia LMS', to: '/products/lms' },
        { label: 'Pantau', to: '/products/pantau' },
        { label: 'LeadKu', to: '/products/leadku' },
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
