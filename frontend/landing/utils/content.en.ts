import ID_CONTENT from './content.id'

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
    services: 'Services',
    partnerships: 'Engagement Models',
    about: 'About Us',
    contact: 'Contact',
    pricing: 'Pricing',
    articles: 'Articles',
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
    title: 'CoreAsia - Web Development & Custom Web App Agency Indonesia',
    description:
      'CoreAsia is an Indonesian digital agency offering professional web development, custom web applications, website monitoring dashboards, and enterprise digital solutions.',
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
      roadmapKicker: 'Product Roadmap',
      roadmapTitle: 'The next products we are preparing',
      roadmapSubtitle:
        'LMS remains visible as part of the CoreAsia ecosystem direction, so potential clients can understand what solutions are coming next.',
      items: [
        {
          name: 'Pantau by CoreAsia',
          badge: 'Live',
          icon: 'lucide:bar-chart-3',
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
          icon: 'lucide:code-2',
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
        {
          name: 'LeadKu by CoreAsia',
          badge: 'Live',
          icon: 'lucide:trending-up',
          tagline: 'Sales CRM',
          heroDesc: 'Leads, pipeline, follow-ups, quotations, and sales reporting in one workspace.',
          description:
            'A CRM for Indonesian sales teams. Bring lead data, activities, quotations, invoices, and manager reporting together so the path to closing stays visible and no follow-up slips through.',
          features: [
            'Visual pipeline & sales funnel',
            'Activities, follow-ups, and reminders',
            'Quotations & invoices linked to deals',
            'Dashboard, forecast, and role-based access',
          ],
          ctaLabel: 'Explore LeadKu',
          to: '/products/leadku',
        },
      ],
      comingSoon: [
        {
          name: 'CoreAsia LMS',
          badge: 'Coming Soon',
          tagline: 'Certification & Training',
          description:
            'A certification and training management platform for teams that need clean workflows, audit-ready operations, and scalable delivery.',
          ctaLabel: 'View LMS Roadmap',
          to: '/products/lms',
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
    services: {
      kicker: 'Our Services',
      title: 'Need a website or web application?',
      subtitle: 'Beyond digital products, we also provide professional web development services for various business needs.',
      items: [
        { label: 'Website Development', description: 'Company profile, online store, landing page — custom & SEO-ready.', to: '/layanan/jasa-pembuatan-website' },
        { label: 'Web App Development', description: 'Dashboards, portals, management systems — tailored to your needs.', to: '/layanan/jasa-pembuatan-aplikasi-web' },
        { label: 'Web Monitoring Dashboard', description: 'Monitor website performance from one easy-to-understand dashboard.', to: '/layanan/web-monitoring-dashboard' },
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
    macApps: [
      {
        name: 'CoreAsia Download Manager',
        badge: 'Live',
        icon: 'lucide:download',
        tagline: 'macOS Download Manager',
        description:
          'A premium download manager for macOS: save videos & files from the web in one click. Fast multi-connection download engine, quality picker, MP3 audio extraction, queue + history, and a companion browser extension.',
        features: [
          'Auto-capture media via the browser extension',
          'Quality picker & MP3 audio extraction',
          'Fast multi-connection engine',
          'Queue + saved history',
        ],
        ctaLabel: 'Explore Download Manager',
        to: '/products/downloader',
      },
      {
        name: 'CoreAsia Mounter',
        badge: 'Live',
        icon: 'lucide:hard-drive',
        tagline: 'NTFS for Mac',
        description:
          'Write to NTFS drives on Apple Silicon Macs. Plug in a drive — it is detected and mounted automatically, ready to write from the menu bar. Reading NTFS is free forever.',
        features: [
          'Write to NTFS drives right from the menu bar',
          'Auto-mount every time you plug in',
          'Your Mac stays protected, your data stays put',
          'One-time $25 payment, lifetime — no subscription',
        ],
        ctaLabel: 'Explore Mounter',
        to: '/products/mounter',
      },
    ],
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
    title: 'About CoreAsia Teknologi - Digital Agency Jakarta, Indonesia',
    description:
      'CoreAsia Teknologi is a software house and digital agency based in Jakarta, Indonesia, building digital products, web monitoring tools, and enterprise solutions.',
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
    title: 'Pricing & Plans - Web Development & Apps Starting from Rp 3M',
    description:
      'Compare CoreAsia pricing and plans: website development from Rp 3 million, custom web apps, and enterprise LMS. Free consultation available.',
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
      title: 'Pantau - Website Analytics Dashboard & SEO Monitoring Indonesia',
      description:
        'Pantau is an Indonesian website monitoring dashboard combining Google Analytics 4, Search Console, keyword ranking, SEO audit, AI assistant, and automated PDF reports. Free to start.',
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
            description: 'Start monitoring your website performance.',
            features: ['1 Website', '7-day data', '3 AI queries/day', '15 Keyword Rankings', 'Analytics Dashboard'],
          },
          {
            name: 'Professional',
            price: 'Rp 250,000/mo',
            description: 'Deep analytics for professionals.',
            popular: true,
            features: ['5 Websites', '90-day data', 'Full GA4 + GSC', '30 AI queries/day', '100 Keyword Rankings', '3 SEO Audits/month', 'PDF & Excel Export', '3 Team Members'],
          },
          {
            name: 'Business',
            price: 'Rp 600,000/mo',
            description: 'Complete solution for agencies and businesses.',
            features: ['15 Websites', '180-day data', '60 AI queries/day', '300 Keyword Rankings', '10 SEO Audits/month', 'Custom Report Schedule', '10 Team Members'],
          },
          {
            name: 'Enterprise',
            price: 'Rp 1,500,000/mo',
            description: 'Manage multiple clients with full features.',
            features: ['30 Websites', '365-day data', '150 AI queries/day', '500 Keyword Rankings', '20 SEO Audits/month', 'API Access', '25 Team Members', 'Priority Support'],
          },
          {
            name: 'Self-Hosted',
            price: 'Contact Us',
            description: 'Deploy on your own servers.',
            features: ['Unlimited Websites', 'Unlimited Data Retention', 'Unlimited AI Queries', 'Full Source Code', 'Custom Domain & Branding', 'Dedicated Support'],
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
    downloader: {
      title: 'CoreAsia Download Manager — Fast Multi-Connection Downloads for macOS',
      description:
        'CoreAsia Download Manager (CAD) is a premium download manager for macOS (Apple Silicon). Save videos & files from the web in one click: a fast multi-connection engine, quality picker, MP3 audio extraction, queue + history, and a companion browser extension.',
      kicker: 'Premium Download Manager',
      hero: {
        title:
          'Save videos &amp; files from the web <span class="ca-gradient-text">in one click</span>.',
        subtitle:
          'CoreAsia Download Manager (CAD) is a premium download manager for macOS & Windows with a fast multi-connection engine, quality picker, MP3 audio extraction, plus a saved queue and history — all in a clean, lightweight interface.',
        ctaPrimary: 'Download for macOS',
        ctaSecondary: 'See Pricing',
        ctaMac: 'Download for macOS',
        ctaWin: 'Download for Windows',
        winBadge: 'Beta',
        alsoOther: 'Also available for',
        chips: ['macOS · Windows', 'Multi-connection', 'MP3 Audio', 'Privacy-first'],
      },
      workflowAside: {
        label: 'How It Works',
        title: 'Start downloading in 4 steps',
        installWinDesc:
          'Download the .exe installer from coreasia.id, run it, then follow the wizard (per-user, no admin) and open the app. Try it free for 3 days.',
        items: [
          {
            title: '1. Install & open the app',
            description:
              'Download the .dmg from coreasia.id, drag it to your Applications folder, then launch it. Try it free for 3 days.',
          },
          {
            title: '2. Install the browser extension',
            description:
              'Add the companion extension for Chrome or Edge so downloadable media is detected right inside your browser.',
          },
          {
            title: '3. Paste a link or use the extension',
            description:
              'Copy a URL into the app, or let the extension detect media and send it to the app automatically.',
          },
          {
            title: '4. Pick a quality & download',
            description:
              'Choose a resolution or extract MP3 audio, then let the multi-connection engine finish the download fast. Everything stays organized in your queue & history.',
          },
        ],
      },
      features: {
        label: 'Key Features',
        title: 'Everything you need to download',
        subtitle:
          'From automatic media detection to audio extraction — CoreAsia Download Manager is built to make saving anything from the web feel fast and tidy.',
        items: [
          {
            title: 'Auto-capture via Extension',
            description:
              'A companion browser extension for Chrome & Edge detects downloadable media on the page and sends it straight to the CoreAsia Download Manager app on your computer.',
            icon: 'lucide:wand-sparkles',
          },
          {
            title: 'Quality Picker',
            description:
              'Choose the video resolution you want before downloading — from space-saving sizes to the highest quality available.',
            icon: 'lucide:settings-2',
          },
          {
            title: 'Fast Multi-connection Downloads',
            description:
              'The download engine opens many connections at once, so files finish far faster than an ordinary single-stream download.',
            icon: 'lucide:zap',
          },
          {
            title: 'MP3 Audio Extraction',
            description:
              'Grab just the audio and save it as MP3 — perfect for music, podcasts, or study material without the video.',
            icon: 'lucide:music',
          },
          {
            title: 'Saved Queue & History',
            description:
              'Line up multiple downloads in a queue and let them run in order. Your history is saved so you can always find older files.',
            icon: 'lucide:list-checks',
          },
          {
            title: 'Clean, Lightweight Interface',
            description:
              'A tidy, focused layout makes every download easy to manage. It runs light and feels intuitive from the first use.',
            icon: 'lucide:sparkles',
          },
        ],
      },
      workflow: {
        label: 'How to Use',
        title: 'From a web page to a saved file',
        subtitle:
          'Four simple steps — set it up once, then save anything from your favorite browser.',
        steps: [
          {
            title: 'Install the app',
            description:
              'Download the .dmg and drag it to your Applications folder. Try it free for 3 days.',
          },
          {
            title: 'Install the browser extension',
            description:
              'Add the companion extension for Chrome or Edge so media can be captured right from the page.',
          },
          {
            title: 'Click in your browser',
            description:
              'Open any site, then click the CA Download button. The extension can also capture media automatically.',
          },
          {
            title: 'Pick a quality & download',
            description:
              'Set the file name & quality (or MP3 audio), then hit Download. The multi-connection engine finishes it fast.',
          },
        ],
      },
      platforms: {
        label: 'Platform',
        title: 'Available on macOS, Windows coming soon',
        subtitle:
          'CoreAsia Download Manager arrives first for macOS (Apple Silicon). A Windows version is in the works so more people can enjoy the same experience.',
        items: [
          {
            title: 'macOS (Apple Silicon)',
            description:
              'Available now. Download the .dmg directly from coreasia.id and get started in minutes.',
            icon: 'lucide:apple',
            badge: 'Available',
            available: true,
          },
          {
            title: 'Windows',
            description:
              'In the works. A Windows version is coming to bring the same experience to more devices.',
            icon: 'lucide:monitor',
            badge: 'Coming soon',
            available: false,
          },
        ],
      },
      pricing: {
        label: 'Pricing',
        title: 'Simple pricing, no subscription',
        subtitle:
          'Try it free for 3 days. After that, buy a Lifetime License for unlimited use or grab a 1-Day Pass for occasional needs.',
        popularLabel: 'Most Popular',
        soonLabel: 'Coming soon',
        plans: [
          {
            name: 'Free Trial',
            action: 'download',
            price: '3 Days',
            description: 'Try every feature at no cost. After the trial ends, the app needs activation.',
            features: [
              'Full access for 3 days',
              'No credit card',
              'All core features active',
            ],
            cta: 'Start Free Trial',
          },
          {
            name: 'Lifetime License',
            action: 'buy',
            fsPath: 'coreasia-download-manager',
            price: '$29',
            description: 'Pay once, use forever (≈ Rp500k). The best choice for regular use.',
            popular: true,
            features: [
              'Lifetime license, one-time payment',
              'All features, unlimited',
              'Quick, easy activation',
              'Updates for the same version',
            ],
            cta: 'Buy Lifetime',
          },
          {
            name: '1-Day Pass',
            action: 'soon',
            price: '$9.90',
            description: 'Just need a day? Activate full access for a single day of use.',
            features: [
              'Full access for 1 day',
              'Great for occasional needs',
              'No recurring subscription',
            ],
            cta: 'Buy 1-Day Pass',
          },
        ],
      },
      privacy: {
        label: 'Privacy & License',
        title: 'Built to respect your privacy',
        items: [
          {
            title: 'Easy Activation',
            description:
              'Activate once and you are ready to go — enter your license and the app is up and running in seconds.',
            icon: 'lucide:shield-check',
          },
          {
            title: 'Privacy-friendly',
            description:
              'Your download activity stays on your computer. CoreAsia Download Manager is designed to respect your privacy from the start.',
            icon: 'lucide:lock',
          },
          {
            title: 'Made by CoreAsia',
            description:
              'Built by PT Inti Asia Teknologi (the CoreAsia brand). Need help? Reach us at hello@coreasia.id.',
            icon: 'lucide:badge-check',
          },
        ],
      },
      related: {
        title: 'Related Products',
        items: [
          {
            title: 'Pantau by CoreAsia',
            description: 'Website analytics & SEO monitoring dashboard',
            icon: 'lucide:bar-chart-3',
            to: '/products/pantau',
          },
          {
            title: 'Build by CoreAsia',
            description: 'Custom website & web app development services',
            icon: 'lucide:code-2',
            to: '/products/build',
          },
          {
            title: 'All Products',
            description: 'Explore the CoreAsia product & service ecosystem',
            icon: 'lucide:boxes',
            to: '/products',
          },
        ],
      },
      cta: {
        title: 'Ready to save anything from the web?',
        subtitle:
          'Download CoreAsia Download Manager for macOS and try it free for 3 days. Install the companion extension too to auto-capture media from your browser.',
        ctaPrimary: 'Download for macOS',
        ctaSecondary: 'hello@coreasia.id',
        termsPrefix: 'By downloading, you agree to the CoreAsia Download Manager',
        termsLabel: 'Terms',
        termsAnd: '&amp;',
        privacyLabel: 'Privacy',
        refundLabel: 'Refund',
        termsSuffix: '.',
      },
    },
    mounter: {
      title: 'CoreAsia Mounter — NTFS for Mac: Write to NTFS Drives on Apple Silicon',
      description:
        'CoreAsia Mounter unlocks write access to NTFS drives on Apple Silicon Macs. Plug in a drive — it is detected and mounted automatically, ready to write from the menu bar. Reading NTFS is free forever; write access is a $25 one-time lifetime purchase.',
      kicker: 'NTFS for Mac',
      hero: {
        title:
          'CoreAsia Mounter — write to NTFS drives on <span class="ca-gradient-text">Apple Silicon Macs</span>.',
        subtitle:
          'Plug in a drive and everything just works — it is detected, mounted, and ready to write from the menu bar, automatically. No complicated setup, no changes to your Mac. Reading NTFS is free forever.',
        ctaPrimary: 'Download Free for macOS',
        ctaSecondary: 'Buy $25 Lifetime',
        chips: ['macOS Tahoe · Apple Silicon', 'Auto-mount', 'One-time payment, lifetime'],
      },
      pain: {
        label: 'Problem → Solution',
        title: 'NTFS drive stuck in read-only on your Mac?',
        items: [
          {
            title: 'The problem: NTFS is read-only on macOS',
            description:
              'macOS opens NTFS drives for reading only. Want to save, edit, or delete files directly on the drive? Denied.',
          },
          {
            title: 'The old ways: messy & risky',
            description:
              'Other solutions require fiddling with your Mac’s settings, error-prone technical steps, or subscriptions that keep charging every year.',
          },
          {
            title: 'The solution: CoreAsia Mounter',
            description:
              'One lightweight menu bar app: plug in the drive and your NTFS drive is ready to write — automatic, safe, hassle-free.',
          },
        ],
      },
      security: {
        label: 'Highlights',
        title: 'Effortless up front, safe underneath',
        subtitle:
          'All the technical complexity is handled behind the scenes — you just plug in your drive and get to work.',
        items: [
          {
            title: 'Auto-mount',
            description:
              'Every NTFS drive you plug in is recognized and mounted automatically. Set it up once, and it is always ready.',
            icon: 'lucide:zap',
          },
          {
            title: 'Your Mac stays protected',
            description:
              'Nothing to change, nothing to switch off. Your Mac’s built-in protections keep working exactly as they should.',
            icon: 'lucide:shield-check',
          },
          {
            title: 'No technical steps',
            description:
              'No commands to type, no restarts. Everything happens from the menu bar with a single click.',
            icon: 'lucide:mouse-pointer-click',
          },
          {
            title: 'Your data stays put',
            description:
              'No reformatting, no shuffling files around — your drive and everything on it stays intact and still works on Windows.',
            icon: 'lucide:hard-drive',
          },
        ],
        engine: {
          badge: 'Reliable',
          title: 'Install once, works continuously',
          description:
            'CoreAsia Mounter runs quietly in your menu bar and keeps getting updates for the latest macOS. Need a hand? Our team responds quickly over email.',
        },
      },
      workflow: {
        label: 'How It Works',
        title: 'Plug in → enable → write. The rest is automatic.',
        subtitle:
          'No complicated setup. Install once, and every NTFS drive is instantly ready — mounted automatically every time you plug it in.',
        steps: [
          {
            title: 'Plug in the drive',
            description:
              'Connect an NTFS hard drive or SSD to your Mac. CoreAsia Mounter recognizes it instantly — no need to even open the app.',
          },
          {
            title: 'Enable write mode',
            description:
              'One click from the menu bar and write mode is on. From then on, the drive mounts automatically every time you plug it in — no restarts, no repeats.',
          },
          {
            title: 'Start writing',
            description:
              'Copy, edit, rename, and delete files on the NTFS drive like any regular drive. Done? Eject as usual.',
          },
        ],
      },
      pricing: {
        label: 'Pricing',
        title: 'Read free forever, write for a one-time $25',
        subtitle:
          'Not a subscription. Try write access free for 1 day; after the trial ends, reading NTFS stays free forever. Checkout via Gumroad — IDR pricing appears automatically at checkout.',
        popularLabel: 'Most Popular',
        plans: [
          {
            name: 'Free Reading',
            price: 'Free',
            description:
              'Read and copy files from NTFS drives — free forever, even after the trial ends.',
            features: [
              'Read NTFS drives with no time limit',
              'No license, no cost',
              'Stays active after the trial ends',
            ],
            cta: 'Get the App',
          },
          {
            name: '1-Day Trial',
            price: '1 Day',
            description:
              'Full unlock: every write feature active for one full day so you can put it to the test.',
            features: [
              'All write features active',
              'Valid for one full day',
              'After the trial, reading stays free',
            ],
            cta: 'Start Free 1-Day Trial',
          },
          {
            name: 'Lifetime License',
            price: '$25',
            popular: true,
            description:
              'Pay once, use forever — not a subscription. IDR pricing appears automatically at Gumroad checkout.',
            features: [
              'One-time payment, no subscription',
              'All write features, forever',
              'Auto-mount every time you plug in',
              'License key delivered via email',
              'Secure checkout via Gumroad',
            ],
            cta: 'Buy $25 Lifetime',
          },
        ],
      },
      faq: {
        label: 'FAQ',
        title: 'Frequently asked questions',
        subtitle: 'Still have questions? Email us at support@coreasia.id.',
        items: [
          {
            question: 'Which Macs and macOS versions are supported?',
            answer:
              'CoreAsia Mounter is built and tested for Apple Silicon Macs (M-series chips) running macOS Tahoe. Support for future macOS versions will follow through updates.',
          },
          {
            question: 'Is my data safe when writing to NTFS drives?',
            answer:
              'CoreAsia Mounter’s write support is built on technology that has been proven for years and is widely used across platforms. That said, no software is 100% risk-free: as with any storage media, make it a habit to back up important data before writing to any drive.',
          },
          {
            question: 'How do I activate after purchasing?',
            answer:
              'After a successful payment, your license key is sent automatically to your email. Open CoreAsia Mounter, enter the license key, and write access is unlocked instantly.',
          },
          {
            question: 'Can I pay from Indonesia?',
            answer:
              'Yes. Gumroad checkout accepts online debit cards such as Jago, Jenius, or blu, plus PayPal. Prices are shown in IDR automatically at checkout. QRIS is not available yet.',
          },
          {
            question: 'How is this different from free or subscription NTFS apps?',
            answer:
              'Free workarounds usually involve complicated technical steps and tend to break after macOS updates. Subscription apps keep charging every year. CoreAsia Mounter is effortless from day one — auto-mount, a single $25 payment for lifetime use, and your Mac stays exactly as secure as it was.',
          },
          {
            question: 'What is the refund policy?',
            answer:
              'Purchases are processed by Gumroad as the merchant of record, so refunds follow Gumroad’s standard policy.',
          },
        ],
      },
      related: {
        title: 'Related Products',
        items: [
          {
            title: 'CoreAsia Download Manager',
            description: 'Premium download manager for macOS',
            icon: 'lucide:download',
            to: '/products/downloader',
          },
          {
            title: 'Pantau by CoreAsia',
            description: 'Website analytics & SEO monitoring dashboard',
            icon: 'lucide:bar-chart-3',
            to: '/products/pantau',
          },
          {
            title: 'All Products',
            description: 'Explore the CoreAsia product & service ecosystem',
            icon: 'lucide:boxes',
            to: '/products',
          },
        ],
      },
      cta: {
        title: 'Ready to write to your NTFS drives?',
        subtitle:
          'Try it free for 1 day with every write feature unlocked. After the trial ends, reading NTFS stays free forever.',
        ctaPrimary: 'Download Free for macOS',
        ctaSecondary: 'support@coreasia.id',
        note: 'Purchases are processed by Gumroad as the merchant of record. IDR pricing appears automatically at checkout.',
      },
    },
    custom: {
      title: 'Build by CoreAsia - Custom Web Development & Web App Services',
      description:
        'Custom web development services by CoreAsia. Landing pages, company profiles, e-commerce, CRM, and digital systems — built to match your business needs.',
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
        ctaPrimary: 'Start 7-Day Free Trial',
        ctaPricing: 'See Pricing & Plans',
        ctaSecondary: 'Talk to Us First',
        appNote: 'LeadKu runs on its own app:',
        chips: ['Pipeline visibility', 'Team activity tracking', 'Multi-workspace ready'],
      },
      pricing: {
        label: 'Pricing',
        planCta: 'Choose this plan',
        title: 'Plans that follow how your team grows',
        subtitle:
          'Start with a 7-day trial, then pick a plan based on the users and data you need. Save with longer commitments: 3 months -10%, 6 months -15%, 12 months -20%.',
        plans: [
          {
            name: 'Trial',
            price: 'Free',
            description: 'Try it for 7 days before deciding.',
            features: ['3 users', '500 contacts', '20 AI credits', 'Workspace ready to use', '7-day trial'],
          },
          {
            name: 'Basic',
            price: 'Rp 750,000/mo',
            description: 'For teams just starting to organise sales.',
            features: ['3 users', '2,500 contacts', '100 AI credits/month', 'Visual pipeline', 'Activities & tasks', 'Quotations and invoices'],
          },
          {
            name: 'Pro',
            price: 'Rp 1,750,000/mo',
            description: 'For teams that want to win more often.',
            popular: true,
            features: ['6 users', '10,000 contacts', '500 AI credits/month', 'Everything in Basic', 'Products and price lists', 'Quotation/invoice templates'],
          },
          {
            name: 'Business',
            price: 'Rp 3,500,000/mo',
            description: 'For organisations operating at scale.',
            features: ['12 users', '50,000 contacts', '2,000 AI credits/month (fair use)', 'Everything in Pro', 'Light custom reporting', 'Priority support'],
          },
          {
            name: 'On-Premise',
            price: 'From Rp 100,000,000',
            description: 'Deploy on your own server.',
            features: ['Docker deployment', 'Database setup', 'Admin training', 'Maintenance 20-25%/year', 'Custom scope'],
          },
        ],
        note: 'Additional users Rp 150,000/user/month. Onboarding, data migration, and training are available as separate implementation packages.',
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
    title: 'Contact CoreAsia - Free Consultation for Web Development & Apps',
    description:
      'Contact CoreAsia for free consultation on web development, custom web applications, website monitoring, and enterprise digital solutions.',
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
  services: {
    jasaPembuatanWebsite: {
      title: 'Professional Web Development Services Jakarta - From Rp 3M',
      description: 'Professional website development for businesses, SMEs, and corporations in Jakarta and across Indonesia. Landing pages, company profiles, e-commerce, and custom web apps from Rp 3 million.',
      kicker: 'Web Development',
      hero: {
        title: 'Professional web development that <span class="ca-gradient-text">builds credibility</span> for your business',
        subtitle: 'CoreAsia is your trusted web development partner in Indonesia. Fast, SEO-ready websites designed for conversions — from company profiles to custom web applications.',
        ctaPrimary: 'Free Consultation',
        ctaSecondary: 'View Portfolio',
      },
      whyUs: {
        title: 'Why Choose CoreAsia for Your Web Development?',
        subtitle: 'Not just affordable website development — we are your technology partner for business growth across Indonesia.',
        items: [
          { icon: 'lucide:palette', title: 'Custom & Responsive Design', description: 'Every website is designed specifically for your brand and business needs. Looks perfect on all devices.' },
          { icon: 'lucide:zap', title: 'High Performance & Speed', description: 'Built with modern technology for optimal loading speed and smooth user experience.' },
          { icon: 'lucide:search', title: 'SEO-Ready from Day One', description: 'Code structure, meta tags, and performance optimized so your website is easily found on Google.' },
          { icon: 'lucide:shield-check', title: 'Security & Maintenance', description: 'SSL, automatic backups, and security monitoring ensure your website stays safe and stable.' },
          { icon: 'lucide:settings', title: 'Modern Technology', description: 'Using cutting-edge stack like Nuxt.js, Vue, Go, and PostgreSQL for scalable results.' },
          { icon: 'lucide:headphones', title: 'Ongoing Support', description: 'Our technical team is ready to help after launch. You won\'t be left alone after handover.' },
        ],
      },
      serviceTypes: {
        title: 'Types of Websites We Build',
        subtitle: 'Web development solutions for every business need.',
        items: [
          { icon: 'lucide:building-2', title: 'Company Profile Website', description: 'Showcase your company professionally. Perfect for SMEs, startups, and corporations building their digital presence.', keywords: 'company profile website development' },
          { icon: 'lucide:shopping-cart', title: 'Online Store & E-Commerce', description: 'E-commerce website with payment system, product management, and shipping integration. Ready to sell from day one.', keywords: 'e-commerce website development' },
          { icon: 'lucide:rocket', title: 'Landing Page & Promotions', description: 'Dedicated pages for marketing campaigns, product launches, or business promotions. Optimized for high conversion.', keywords: 'landing page development' },
          { icon: 'lucide:layout-dashboard', title: 'Custom Web Application', description: 'Web apps tailored to your specific business needs — dashboards, management systems, portals, and more.', keywords: 'custom web app development' },
        ],
      },
      serviceAreas: {
        title: 'Serving All of Indonesia',
        subtitle: 'Our team works remotely and serves clients from various cities across Indonesia.',
        cities: ['Jakarta', 'Surabaya', 'Bandung', 'Tangerang', 'Bekasi', 'Makassar', 'Semarang', 'Yogyakarta', 'Medan', 'Bali'],
        description: 'No location restrictions — consultation and development are done online. Get professional web development services from anywhere in Indonesia.',
      },
      pricing: {
        title: 'Website Development Cost Estimates',
        subtitle: 'Web development costs vary by type, features, and complexity. Here is a general overview:',
        items: [
          { type: 'Landing Page', range: 'From IDR 3M', description: 'Single-page promotion, responsive, SEO-ready.' },
          { type: 'Company Profile', range: 'From IDR 5M', description: '3-7 pages, custom design, basic content management.' },
          { type: 'Online Store', range: 'From IDR 10M', description: 'Product catalog, cart, payment, shipping integration.' },
          { type: 'Custom Web App', range: 'From IDR 25M', description: 'Dashboard, management system, custom features as needed.' },
        ],
        note: 'Prices above are estimates. Contact us for a quote tailored to your specific needs.',
      },
      process: {
        title: 'Our Development Process',
        subtitle: 'Transparent and structured web development workflow.',
        items: [
          { step: '01', title: 'Consultation & Brief', description: 'Discuss your needs, target audience, and website goals.' },
          { step: '02', title: 'Design & Wireframe', description: 'Create visual concepts and page structure before development.' },
          { step: '03', title: 'Development', description: 'Coding with modern tech, responsive, and SEO-optimized.' },
          { step: '04', title: 'Testing & Launch', description: 'Thorough testing across all devices and browsers, then deploy.' },
        ],
      },
      faq: {
        title: 'FAQ — Web Development Services',
        items: [
          { question: 'How long does it take to build a website?', answer: 'Depending on complexity, typically 2-6 weeks for company profile websites, and 4-12 weeks for custom web apps.' },
          { question: 'How much does a company profile website cost?', answer: 'Company profile web development starts from IDR 5 million, depending on the number of pages, features, and design complexity. Contact us for a tailored quote.' },
          { question: 'Does CoreAsia serve clients outside Jakarta?', answer: 'Yes, we serve clients across Indonesia — Jakarta, Surabaya, Bandung, Tangerang, Bekasi, Makassar, and more. Everything is done online.' },
          { question: 'Can I request design revisions?', answer: 'Yes, design revisions are included in the package. We ensure the final result meets your needs.' },
          { question: 'Does it include hosting and domain?', answer: 'We help set up hosting and domain. Hosting and domain costs are separate and customizable.' },
          { question: 'Is the website mobile-friendly?', answer: 'Yes, all websites we build are responsive and look optimal on desktop, tablet, and smartphone.' },
          { question: 'Are there affordable web development packages for SMEs?', answer: 'We offer landing page packages starting from IDR 3 million, perfect for SMEs and small businesses. Still professional and SEO-ready.' },
          { question: 'What about maintenance after launch?', answer: 'We provide monthly maintenance packages covering updates, backups, and technical support.' },
        ],
      },
      cta: {
        title: 'Ready for a professional website?',
        subtitle: 'Discuss your web development needs with the CoreAsia team. Free, no commitment.',
        button: 'Contact Us Now',
      },
    },
    webMonitoringDashboard: {
      title: 'Website Monitoring Dashboard - Track GA4, GSC & SEO Indonesia',
      description: 'Complete website monitoring dashboard combining Google Analytics 4, Search Console, keyword ranking, SEO audit, and automated PDF reports. Free for 1 website.',
      kicker: 'Web Monitoring',
      hero: {
        title: 'All your website data in <span class="ca-gradient-text">one dashboard</span>',
        subtitle: 'Stop opening multiple tabs. Monitor GA4, Search Console, leads, and SEO performance from one easy-to-understand place.',
        ctaPrimary: 'Try Pantau Free',
        ctaSecondary: 'Explore Features',
      },
      features: {
        title: 'Complete Website Monitoring Features',
        items: [
          { icon: 'lucide:bar-chart-3', title: 'Google Analytics 4 Integration', description: 'Traffic data, user behavior, and conversions from GA4 displayed in easy-to-read visualizations.' },
          { icon: 'lucide:search', title: 'Google Search Console', description: 'Monitor keyword rankings, impressions, clicks, and indexing status directly from the dashboard.' },
          { icon: 'lucide:users', title: 'Leads Management', description: 'Track leads from your website forms. Receive notifications and manage pipeline in one place.' },
          { icon: 'lucide:file-text', title: 'Automated PDF Reports', description: 'Generate website performance reports automatically and on schedule. Perfect for client or management reporting.' },
          { icon: 'lucide:brain', title: 'AI Performance Assistant', description: 'Get insights and recommendations from AI based on your website performance data.' },
          { icon: 'lucide:webhook', title: 'Webhooks & Notifications', description: 'Receive real-time notifications for new leads, traffic anomalies, or ranking changes.' },
        ],
      },
      audience: {
        title: 'Who Is It For?',
        items: [
          { icon: 'lucide:briefcase', title: 'Business Owners', description: 'Monitor your business website performance without needing to understand complex analytics tools.' },
          { icon: 'lucide:palette', title: 'Freelancers & Agencies', description: 'Manage website monitoring for multiple clients from one dashboard. Automated reports save time.' },
          { icon: 'lucide:megaphone', title: 'Marketing Teams', description: 'See campaign impact on traffic and leads. Integrated data for better decision making.' },
        ],
      },
      faq: {
        title: 'FAQ — Web Monitoring Dashboard',
        items: [
          { question: 'Do I need to install software?', answer: 'No. Pantau is a web-based SaaS, just log in from your browser to access your dashboard.' },
          { question: 'How many websites can I monitor?', answer: 'Depends on the plan. Starter supports 1 website, Professional up to 5, and Enterprise unlimited.' },
          { question: 'Is my data safe?', answer: 'Yes. Data is processed with encrypted connections and stored on secure servers. We do not share your data with third parties.' },
          { question: 'How do I connect GA4?', answer: 'Simply authenticate your Google account from the Pantau dashboard. Setup takes just a few minutes.' },
        ],
      },
      cta: {
        title: 'Start monitoring your website',
        subtitle: 'Try Pantau for free and see all your website data in one dashboard.',
        button: 'Start Free Now',
      },
    },
    jasaPembuatanAplikasiWeb: {
      title: 'Custom Web Application Development Indonesia - CRM, LMS, ERP',
      description: 'Custom web application development for businesses and enterprises in Indonesia. CRM, LMS, ERP, dashboards, and internal systems — built with modern technology by CoreAsia.',
      kicker: 'Web App Development',
      hero: {
        title: 'Custom web apps that <span class="ca-gradient-text">truly fit</span> your business needs',
        subtitle: 'Stop adapting your business to generic software. We build web applications designed specifically for your processes and operational scale.',
        ctaPrimary: 'Free Consultation',
        ctaSecondary: 'View Our Products',
      },
      capabilities: {
        title: 'What Can We Build?',
        items: [
          { icon: 'lucide:layout-dashboard', title: 'Dashboards & Analytics', description: 'Custom business dashboards with real-time data visualization for decision making.' },
          { icon: 'lucide:users', title: 'CRM & Lead Management', description: 'CRM systems tailored to your business pipeline and workflow.' },
          { icon: 'lucide:graduation-cap', title: 'LMS & E-Learning', description: 'Online learning platforms with certification, exams, and progress tracking.' },
          { icon: 'lucide:file-stack', title: 'ERP & Operations', description: 'Operational management systems from inventory, billing, to reporting.' },
          { icon: 'lucide:plug', title: 'API & Integration', description: 'Integration with existing systems, payment gateways, and third-party services.' },
          { icon: 'lucide:smartphone', title: 'Progressive Web App', description: 'Web applications that can be installed and work like native apps on mobile.' },
        ],
      },
      techStack: {
        title: 'Technologies We Use',
        items: ['Vue.js / Nuxt', 'Go (Golang)', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'REST API', 'MinIO / S3', 'Redis'],
      },
      faq: {
        title: 'FAQ — Web Application Development',
        items: [
          { question: 'How much does web app development cost?', answer: 'Cost depends on complexity. We provide estimates after consultation and requirements scoping.' },
          { question: 'Can it be developed in phases?', answer: 'Yes, we support MVP (Minimum Viable Product) approach — launch core features first, then iterate based on feedback.' },
          { question: 'What about the source code?', answer: 'Source code becomes fully yours after project completion and full payment.' },
          { question: 'Is there a warranty?', answer: 'Yes, we provide a bug-fix warranty after launch. Warranty duration is adjusted based on project scope.' },
        ],
      },
      cta: {
        title: 'Have a web app idea?',
        subtitle: 'Tell us your needs, we help from concept to deployment.',
        button: 'Discuss Now',
      },
    },
  },
  blog: {
    title: 'Articles & Tips on SEO, Web Development, Digital Marketing',
    description: 'Articles, guides, and tips about SEO, web development, digital marketing, and business growth strategies in Indonesia.',
    kicker: 'Article',
    browseLabel: 'Browse topics',
    browseDescription: 'Use a clearer category rail so the article list feels easier to scan on both mobile and desktop.',
    showMoreTopics: 'Show more topics',
    showLessTopics: 'Show fewer topics',
    hero: {
      title: 'Insights & guides for <span class="ca-gradient-text">digital growth</span>',
      subtitle: 'Tips, tutorials, and insights from the CoreAsia team to help you understand technology and make better business decisions.',
    },
    readMore: 'Read more',
    readTime: 'min read',
    noArticles: 'No articles yet. Stay tuned for our latest content.',
    defaultAuthor: 'CoreAsia Team',
    coverEyebrow: 'CoreAsia Journal',
    coverTagline: 'Digital insights that feel polished, relevant, and ready to execute.',
    relatedTitle: 'Related articles',
    relatedDescription: 'Keep exploring similar topics that connect naturally with this article.',
    productsTitle: 'CoreAsia products',
    productsDescription: 'If this topic matches your business needs, explore the CoreAsia products closest to that use case.',
    productsRoadmapTitle: 'More products in the pipeline',
    noRelatedArticles: 'No related articles are available yet.',
    categories: {
      all: 'All',
      general: 'General',
      bisnis: 'Business & Technology',
      seo: 'SEO & Marketing',
      teknologi: 'Technology',
      marketing: 'Marketing',
      edukasi: 'Education',
      webDevelopment: 'Web Development',
      business: 'Business & Technology',
      tutorial: 'Tutorial',
    },
    cta: {
      title: 'Need a digital solution?',
      subtitle: 'Contact CoreAsia to discuss your business technology needs.',
      button: 'Contact Us',
    },
  },
  faqPage: {
    title: 'FAQ - Common Questions About CoreAsia Web Services',
    description: 'Answers to frequently asked questions about website development, custom web apps, web monitoring dashboard, pricing, and how CoreAsia works.',
    heading: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about CoreAsia services.',
    contactNote: "Can't find your answer? Contact our team via",
    contactCta: 'contact page',
    categories: {
      general: {
        label: 'General',
        items: [
          { question: 'What is CoreAsia?', answer: 'CoreAsia Teknologi is a digital agency and software house based in Jakarta that builds digital products, provides web development services, and offers a website monitoring dashboard (Pantau).' },
          { question: 'Does CoreAsia serve clients outside Jakarta?', answer: 'Yes, we serve clients across Indonesia — Surabaya, Bandung, Semarang, Yogyakarta, Medan, Makassar, Bali, and more. All processes are conducted online.' },
          { question: 'How do I get started?', answer: 'Contact us via WhatsApp or our contact page for a free consultation. We will discuss your needs and provide a suitable proposal.' },
        ],
      },
      website: {
        label: 'Web Development',
        items: [
          { question: 'How much does a website cost?', answer: 'Landing pages start from Rp 3 million, company profiles from Rp 5 million, e-commerce from Rp 10 million, and custom web apps from Rp 25 million.' },
          { question: 'How long does it take to build a website?', answer: 'Typically 2-6 weeks for a company profile, and 4-12 weeks for custom web apps depending on complexity.' },
          { question: 'Are all websites mobile-friendly?', answer: 'Yes, all websites we build are fully responsive and optimized for desktop, tablet, and mobile devices.' },
        ],
      },
      monitoring: {
        label: 'Web Monitoring (Pantau)',
        items: [
          { question: 'What is Pantau?', answer: 'Pantau is a website monitoring dashboard by CoreAsia that combines Google Analytics 4, Search Console, keyword ranking, SEO audit, and AI assistant in one place.' },
          { question: 'Is Pantau free?', answer: 'Yes, the Starter plan is free forever for 1 website with 7-day data, 3 AI queries/day, and 15 keyword rankings.' },
          { question: 'How much does Pantau cost?', answer: 'Professional Rp 250,000/mo (5 websites), Business Rp 600,000/mo (15 websites), Enterprise Rp 1,500,000/mo (30 websites). Self-Hosted option also available.' },
        ],
      },
      pricing: {
        label: 'Pricing & Payment',
        items: [
          { question: 'What payment methods are accepted?', answer: 'Bank transfer, Virtual Account (BCA, BNI, Mandiri, BRI, Permata), QRIS, and other options through payment gateway.' },
          { question: 'Can I pay in installments?', answer: 'Yes, for web development projects, payments can be split according to agreed milestones.' },
        ],
      },
    },
  },
  portfolio: {
    title: 'Portfolio & Case Studies - CoreAsia Digital Projects',
    description: 'See CoreAsia digital project portfolio: web monitoring dashboard, professional websites, and custom web applications for businesses in Indonesia.',
    heading: 'Projects We Have Built',
    subtitle: 'From concept to production — here are some projects showcasing CoreAsia capabilities.',
    items: [
      {
        title: 'Pantau by CoreAsia',
        category: 'SaaS Product',
        description: 'A complete website monitoring dashboard combining Google Analytics 4, Search Console, keyword ranking, SEO audit, AI assistant, and automated PDF reports.',
        tech: ['Go', 'Nuxt 3', 'PostgreSQL', 'Redis', 'Docker', 'Xendit', 'GA4 API', 'GSC API'],
        link: 'https://pantau.coreasia.id',
        highlights: ['4 pricing tiers (free — enterprise)', 'Xendit VA + QRIS integration', 'AI assistant (Dexter)', 'Automated PDF reports'],
      },
      {
        title: 'CoreAsia Landing & CMS',
        category: 'Company Website',
        description: 'CoreAsia company profile and landing page with article CMS, multi-language (ID/EN), and SEO-optimized. Built with Nuxt 4 SSR + Go API Gateway.',
        tech: ['Nuxt 4', 'Go', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
        highlights: ['Multi-language ID/EN', 'Rich text article CMS', 'Complete schema.org SEO', 'Prerender + SSR hybrid'],
      },
      {
        title: 'Certification LMS',
        category: 'Custom Web App',
        description: 'Learning Management System for digital certification — online CBT, participant management, exam scheduling, and BNSP integration.',
        tech: ['Go', 'Vue 3', 'PostgreSQL', 'MinIO', 'Docker'],
        highlights: ['Online CBT with timer', 'Digital certificate management', 'Multi-tenant', 'BNSP export'],
      },
    ],
    cta: {
      title: 'Have a digital project?',
      subtitle: 'Tell us your idea. We help from concept to deployment.',
      button: 'Discuss Your Project',
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
    downloaderPrivacy: {
      title: 'CoreAsia Download Manager Privacy Policy',
      description:
        'CoreAsia Download Manager privacy policy (macOS app & browser extension) — how your data is handled. Privacy-friendly: data is processed locally on your device.',
      lastUpdated: 'Last updated: June 2026',
      sections: {
        intro: {
          title: '1. Summary',
          content: 'CoreAsia Download Manager ("CAD") is a desktop download manager with a companion browser extension, operated by {company} (the CoreAsia brand). Processing by the app and extension happens locally on your device, and for the core functions of CAD we do not collect your personal data to our servers — EXCEPT as described in this Policy: (a) purchase data processed by the seller of record / Merchant of Record ({mor}) per their privacy policy; (b) technical diagnostics if you enable them (see Diagnostics); (c) license activation/identification data if online license validation is introduced in a future version; and (d) disclosures required by law or valid legal process. Otherwise, we do not upload your history, download contents, or URLs to our servers, and we do not sell your personal data. If we introduce server-based features in the future, we will update this Policy before such features become active.',
        },
        controller: {
          title: '2. Data Controller & Roles',
          content: '{company} is the data controller for data processed by the app, optional diagnostics, and license activation. For purchases, {mor} acts as seller of record (Merchant of Record) and controller/processor of your payment data (name, email, billing address, card/tax data) per its privacy policy; {company} does not store your card data. Privacy questions may be sent to {email}.',
        },
        extension: {
          title: '3. Browser Extension (Chrome/Edge)',
          content: 'The companion extension helps detect downloadable media on the page you are viewing. To do this, the extension may read:',
          items: [
            'The active tab URL and media links (e.g. video/audio) present on the page you open',
            'ONLY when you start a download that requires it: cookies for the relevant site, so the app can download content that needs your logged-in session',
          ],
        },
        extensionLocal: {
          title: '4. Where Extension Data Is Sent',
          content: 'The data above is sent ONLY to the CoreAsia Download Manager application running LOCALLY on your computer (address 127.0.0.1 / localhost). This data is NOT sent to CoreAsia servers or any third party. The extension does not sell data, does not show ads, and does not track your browsing activity for advertising purposes.',
        },
        desktop: {
          title: '5. Desktop Application',
          content: 'The desktop application runs on your computer and:',
          items: [
            'Downloads the files you request to the folder you choose',
            'Stores settings, license, and download history LOCALLY on your device',
            'Does not upload your download history to our servers',
          ],
        },
        license: {
          title: '6. License Activation',
          content: 'Activation requires no account. Currently licenses are validated locally (offline, Ed25519) without sending personal data to our servers. In a future version, we may introduce online license validation; if enabled, only minimal license/installation identifiers are sent to prevent abuse, and this Policy will be updated before that feature is active. Purchase and license issuance are handled by the seller of record ({mor}) per their privacy policy.',
        },
        trial: {
          title: '7. Trial Period',
          content: 'The 3-day free trial is tracked using a local timestamp on your device. No personal data is collected to run the trial.',
        },
        diagnostics: {
          title: '8. Optional Diagnostics (Opt-In)',
          content: 'Technical diagnostics are optional and OFF by default; they are active only if you turn them on yourself, and you can turn them off at any time. When enabled, we send limited technical data: a pseudonymized installation identifier (a one-way hash that cannot be reversed to your identity), plus app version, operating-system version, locale, and time zone. We do not send your history, download contents, or URLs. This data is used solely for diagnostics and product-quality improvement.',
        },
        legalBasis: {
          title: '9. Legal Bases & Cross-Border Transfers',
          content: 'Our legal bases: performance of a contract (processing your purchase and license), consent (optional diagnostics), and legitimate interests (security and product improvement). Purchase data may be processed outside your country of residence (e.g., via {mor} in the United States) with safeguards required by applicable law (e.g., standard contractual clauses).',
        },
        security: {
          title: '10. Data Security & Breach Notification',
          content: 'We apply reasonable technical and organizational measures to protect data, but no method of transmission or storage is 100% secure; we cannot guarantee absolute security. If a personal-data breach occurs that poses a risk to you, we will notify you and the competent authority within the time limits required by applicable law — including no later than 3x24 hours under the Indonesian PDP Law No. 27 of 2022, and, where applicable, without undue delay / within 72 hours under GDPR Article 33.',
        },
        noSale: {
          title: '11. No Sale of Data',
          content: 'We do not sell, rent, or trade your personal data to third parties.',
        },
        rights: {
          title: '12. Your Rights',
          content: 'Because most data is stored locally on your device, you remain in full control. Depending on your jurisdiction (e.g., EU/UK under GDPR/UK GDPR, or Indonesia under the PDP Law), you have the right to: access, rectify, erase, restrict, or object to processing of your personal data, request portability, and withdraw consent at any time without affecting prior lawful processing. For payment data, submit a request through us or directly to {mor}. You also have the right to lodge a complaint with the competent data-protection authority (e.g., the Indonesian PDP Authority, or an EU/UK data-protection authority). Contact us at {email}. You can exercise these rights directly as follows:',
          items: [
            'Delete history, settings, and app data directly from your device',
            'Turn off optional diagnostics at any time',
            'Remove the app and extension to stop all related data processing',
          ],
        },
        retention: {
          title: '13. Data Storage and Retention',
          content: 'Settings, license, and download history are stored locally on your device until you delete them. We do not keep copies of that data on our servers. Optional diagnostics data (if you enable it) is retained for at most 12 (twelve) months, then deleted or anonymized. License-activation data is retained for the license term for support and anti-abuse purposes. Purchase data is retained by {mor} per its policies and tax obligations.',
        },
        recipients: {
          title: '14. Data Recipients / Sub-processors',
          content: 'Our categories of data recipients are limited to: (a) {mor} (seller of record / payment processor); (b) our analytics/diagnostics provider (only for the optional diagnostics data you enable); and (c) infrastructure/hosting providers supporting our limited services. We do not share your personal data with others except as described in this Policy or required by law.',
        },
        thirdPartyContent: {
          title: '15. Third-Party Content/Sites',
          content: 'This Policy covers only the handling of data by CAD. Third-party content, sites, and services you access through CAD are governed by their own policies and terms, beyond our control. Responsibility for the legality of content you download is governed by the Terms of Use.',
        },
        changes: {
          title: '16. Policy Changes',
          content: 'We may update this Policy from time to time, marked by a revision date on this page. For material changes to how we process personal data, we will give reasonable notice (in-app or on this page) before they take effect and — where required by law — request your renewed consent.',
        },
        governingLaw: {
          title: '17. Governing Law',
          content: 'This privacy policy is governed by and interpreted under the laws of the Republic of Indonesia. CoreAsia Download Manager is operated by {company}.',
        },
        contact: {
          title: '18. Contact Us',
          content: 'For questions about the CoreAsia Download Manager privacy policy, contact us at {email}.',
        },
      },
    },
    downloaderTerms: {
      title: 'CoreAsia Download Manager Terms and Conditions',
      description:
        'Terms and conditions for using CoreAsia Download Manager (macOS app & browser extension). Please review them carefully before using the product.',
      lastUpdated: 'Last updated: June 2026',
      sections: {
        intro: {
          title: '1. General Terms',
          content: 'CoreAsia Download Manager ("CAD") is a download manager for macOS (Apple Silicon) with a companion browser extension, operated by {company} (the CoreAsia brand). By downloading, installing, or using CAD, you agree to be bound by these terms and conditions.',
        },
        natureRoles: {
          title: '2. Nature of the Tool, No Hosting, & Roles of the Parties',
          content: 'CAD is a general-purpose, dual-use tool that runs and processes entirely on your device. {company} does not host, store on our servers, copy, index, cache, mirror/proxy, re-upload, or distribute any content you access or download through CAD. All content is transferred directly from third-party sources to your device; we are not an intermediary, provider, or publisher of that content. CAD has substantial lawful uses, including downloading content you own, openly licensed content, or content for which you have obtained permission. Roles of the parties: {company} is the licensor of the CAD software. {mor} is the seller of record (Merchant of Record) for your purchase; {mor}—not {company}—is your counterparty to the sale and handles payment, invoicing, taxes, and seller obligations under applicable law. The {mor} terms and policies govern that sale. The {company} refund policy is an additional good-will policy layered on top of your statutory rights, which are fulfilled through {mor}.',
        },
        license: {
          title: '3. License Grant',
          content: 'We grant you a limited, non-exclusive, non-transferable license to use CoreAsia Download Manager in accordance with the plan you purchased, for your personal use. You may not resell, rent, distribute, reverse engineer, or redistribute license keys without our written permission. The license remains valid for as long as your rights are not terminated under Section 14 (Termination) or by refund/chargeback as set out in the Refund Policy. Assignment: You may not assign your rights or obligations under these Terms without our written consent. We may assign these Terms, in whole or in part, to an affiliate or in connection with a merger, acquisition, reorganization, or sale of assets, while respecting your rights under mandatory consumer law.',
        },
        trial: {
          title: '4. Trial Period',
          content: 'CAD offers a free 3-day trial. After the trial ends, you need to activate a paid license to keep using features that require activation. The trial is tracked using a local timestamp on your device.',
        },
        pricing: {
          title: '5. Payment and Licensing',
          content: 'Prices may change at any time for new purchases; price changes do not affect a license you have already bought. The Lifetime product is a one-time payment with no recurring subscription fees. The seller of record (Merchant of Record) for the transaction is {mor}, which is your counterparty to the sale and processes payment, invoicing, and taxes per its policies; applicable taxes may be shown or added based on your jurisdiction at checkout. Available license options:',
          items: [
            'Lifetime License — one-time payment, no recurring subscription fees',
            '1-Day Pass — 1-day access',
            'License purchase and issuance are handled by {mor} as seller of record (Merchant of Record); applicable taxes may be added based on your jurisdiction at checkout',
          ],
        },
        refund: {
          title: '6. Refund Policy',
          content: 'We offer a 14 (fourteen)-day money-back guarantee from the date of a Lifetime license purchase — no reason required, declined only where abuse is established — plus a free 3-day trial before purchase. Outside that window, requests are reviewed case-by-case, in particular for technical issues that make the app unusable and that we cannot resolve. When a refund or dispute is approved, the related license legally ends and is no longer valid for use. Purchases are processed by {mor} as Merchant of Record. This policy does not limit your mandatory statutory consumer rights under applicable law. Full terms, exceptions, and how to request are set out in our Refund Policy at coreasia.id/downloader/refund; in case of any conflict, the Refund Policy prevails. Contact us at {email}.',
        },
        acceptableUse: {
          title: '7. Acceptable Use',
          content: 'CoreAsia Download Manager is a general-purpose tool for managing downloads. You are solely responsible for ensuring that each download is lawful in your jurisdiction and does not infringe third-party rights. You must not use CAD to remove, bypass, or circumvent technological protection measures / digital rights management (DRM) or access controls, to the extent prohibited by applicable law (including Article 52 of the Indonesian Copyright Law and comparable anti-circumvention provisions). CAD is not intended for, and must not be used to, defeat paywalls, DRM, or paid-access restrictions without authorization. You MUST:',
          items: [
            'Only download content you own the rights to, or that you are permitted to download',
            'Comply with the terms of service, copyright, and rules of the third-party sites the content comes from',
            'Not use CAD to break the law or infringe the rights of others',
          ],
        },
        sanctions: {
          title: '8. Sanctions/Export Compliance & Availability',
          content: 'You represent that you are not located in, and do not use CAD for or on behalf of any party in, any jurisdiction or list subject to sanctions or export restrictions that prohibit provision of this software, and that your use complies with applicable export-control and sanctions laws. {company} may restrict or discontinue availability of CAD in certain jurisdictions to comply with law.',
        },
        indemnity: {
          title: '9. Indemnification — Business Users',
          content: 'This clause applies only to business/commercial users and does not apply to consumers (natural persons using CAD outside their trade or profession). To the extent permitted by applicable law, if you are a business user, you agree to defend, indemnify, and hold harmless {company} and its affiliates, directors, and employees from any third-party claims, demands, suits, losses, liabilities, fines, damages, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of CAD; (b) content you download, store, or distribute using CAD; (c) your breach of these Terms or Section 7 (Acceptable Use); or (d) your infringement of any third-party copyright, trademark, privacy, or other rights, or of any third-party site/service Terms of Service. This obligation survives termination of your license. Consumers: If you are a consumer, you bear no indemnification obligation under these Terms. This does not relieve you of liability under law for your own unlawful acts.',
        },
        acceptableUseLiability: {
          title: '10. Responsibility for Use',
          content: 'CoreAsia Download Manager is a general-purpose tool; you are fully responsible for how you use it and for the content you download. {company} is not responsible for misuse of the app, including downloading content that infringes copyright or third-party terms.',
        },
        thirdParty: {
          title: '11. Third-Party Services and Sites',
          content: 'CAD may interact with third-party sites and services. We do not control and are not responsible for the availability, content, or policies of those third-party sites. Changes to third-party sites may affect certain download functionality.',
        },
        warranty: {
          title: '12. Disclaimer of Warranties (As-Is)',
          content: 'CAD is provided "as-is" and "as-available," without warranties of any kind, express or implied. To the maximum extent permitted by applicable law, we EXPRESSLY DISCLAIM all implied warranties, including merchantability, fitness for a particular purpose, non-infringement, title, and quiet enjoyment. We do not warrant that CAD will be error-free, uninterrupted, secure, or compatible with every site, service, or device configuration. Consumer safeguard (affirmative): If you are a consumer, nothing in this Section excludes, limits, or affects your statutory warranties and rights that cannot be waived under the consumer-protection law of your country of residence — including the Indonesian Law No. 8 of 1999 and, where applicable to you, EU/UK consumer law (including rights to conformity of digital content). The exclusions in this Section do not apply to consumers to the extent such mandatory law prohibits them. Seller conformity/warranty obligations are fulfilled through {mor} as seller of record (see Section 2).',
        },
        liability: {
          title: '13. Limitation of Liability',
          content: '(1) Exclusion of damages (general, with consumer carve-out). To the extent permitted by applicable law, {company} is not liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, or business interruption, arising from use of or inability to use CAD. (2) Aggregate cap — business users only. For business/commercial users, to the extent permitted by law, total aggregate liability of {company} arising out of or relating to CAD, the license, or these Terms—whether in contract, tort (including negligence), or otherwise—shall not exceed the license fees actually received by {company} for the relevant product in the 12 (twelve) months preceding the event giving rise to the claim. This cap is cumulative across all claims and does not reset per event. (3) Consumers (affirmative). The aggregate cap in (2) does not apply to consumers. Our liability to consumers is determined by applicable law; nothing in this Section limits liability to consumers below the levels guaranteed by mandatory consumer law (including the Indonesian Law No. 8 of 1999 and, where applicable, EU/UK consumer law). (4) Non-derogable carve-out & severability. Nothing in Sections 12 and 13 excludes or limits liability that cannot be excluded under law, including for: (i) death or personal injury caused by our negligence; (ii) fraud or fraudulent misrepresentation; (iii) gross negligence or willful misconduct; and (iv) non-waivable consumer statutory rights. If any limitation is held unenforceable, it is severable and the remainder stays in full force.',
        },
        termination: {
          title: '14. Termination',
          content: 'We reserve the right to terminate or suspend your license if you violate these terms and conditions. You may also stop using CAD at any time by removing the app and extension from your device. The license also terminates automatically and immediately if your payment is refunded, reversed, or charged back. For technical reasons, offline license keys cannot always be deactivated remotely; any use of CAD after valid termination is unlicensed use and breaches these Terms. Consumer-rights exception: This does not apply to—and does not render a "breach"—lawful use in the course of exercising your statutory refund or withdrawal rights; while and to the extent those rights apply, your use remains licensed until the refund/withdrawal is fully processed.',
        },
        disputeResolution: {
          title: '15. Governing Law & Dispute Resolution',
          content: 'These Terms are governed by the laws of the Republic of Indonesia, without regard to conflict-of-laws rules. Tiered resolution: Any dispute shall first be addressed amicably via our official contact within 30 (thirty) days before any formal proceedings. Forum — business users: For business/commercial users, unresolved disputes are subject to the exclusive jurisdiction of the competent courts in Jakarta, Indonesia, and any claim must be brought within 1 (one) year of the event giving rise to it, to the extent permitted by law. Forum & time limit — consumers (affirmative): The Jakarta forum and the 1 (one) year time limit above do not apply to consumers. Indonesian consumers may pursue consumer dispute resolution through the Consumer Dispute Resolution Body (BPSK) and/or the District Court of their domicile, under Law No. 8 of 1999. EU/UK and other consumers may rely on the mandatory provisions and bring proceedings in the courts of their domicile, and enjoy the claim/warranty periods guaranteed by their law (e.g., the 2-year statutory guarantee in the EU). Nothing in this Section shortens any period guaranteed by mandatory consumer law. No class-action waiver: We do not require arbitration and do not impose a class-action waiver on consumers. Consumer rights to collective redress guaranteed by law (including Directive (EU) 2020/1828) remain intact.',
        },
        copyright: {
          title: '16. Copyright Policy & Repeat Infringers',
          content: '{company} respects intellectual property rights. CAD hosts no content (see Section 2); accordingly, the DMCA Section 512(c) notice-and-takedown mechanism for hosted content does not fully apply to us. A rights holder who believes CAD is being used to infringe its rights may send written notice to {email} including: (a) identification of the work; (b) the basis of the claim; (c) contact details; and (d) a good-faith statement. Our action is limited to reasonable steps within our control. Repeat-infringer policy: We may suspend or terminate the license of any user who, based on valid notices and/or adequate evidence, is shown on two or more occasions to have used CAD for copyright infringement. Termination for repeat infringement gives rise to no refund.',
        },
        changes: {
          title: '17. Changes to the Terms',
          content: 'We may update these Terms from time to time. Non-material changes take effect upon publication with a revision date. For material changes that are adverse to consumers, we will give reasonable notice (e.g., in-app or on this page) before they take effect, and you may stop using CAD if you do not agree. Changes are not retroactive to rights already acquired through purchases already made, and do not affect your mandatory consumer rights.',
        },
        general: {
          title: '18. General',
          content: '(a) Severability. If any provision is held invalid or unenforceable, it shall be construed/limited minimally to remain effective; if impossible, it is severed and the remainder stays in full force. (b) Entire Agreement & Hierarchy. These Terms together with the Privacy Policy and Refund Policy are the entire agreement regarding CAD and supersede prior communications. Marketing materials are illustrative and not part of the agreement unless confirmed in writing. In case of conflict: refund matters are governed by the Refund Policy; data matters by the Privacy Policy; otherwise by these Terms. For the sale transaction, the {mor} terms as seller of record govern. These Terms do not waive consumer rights to non-misleading information. (c) Force Majeure. We are not liable for delay/failure due to causes beyond our reasonable control (natural disasters, network outages, government action/legal changes, third-party site blocking/changes). This does not remove refund rights or consumer statutory rights. (d) No Waiver. Failure or delay in enforcing a provision is not a waiver; a waiver is valid only if in writing by our authorized representative. (e) Notices. Legal notices to us: {email} (or the registered address of {company}). Notices to you may be given via the app, your purchase email, or this page. (f) Governing Language. These Terms are made in Bahasa Indonesia; translations are provided for convenience. Between business users, the Bahasa Indonesia version prevails in case of discrepancy. For consumers, the version in the language in which these Terms were presented to you (or a language you can understand under mandatory local law) binds you; it may not be used to bind you to a meaning you do not understand.',
        },
        contact: {
          title: '19. Contact Us',
          content: 'For questions about the CoreAsia Download Manager terms and conditions, contact us at {email}.',
        },
      },
    },
    downloaderRecover: {
      title: 'Find Your License Key',
      description: 'Lost your CoreAsia Download Manager license key or switching Macs? Follow these recovery steps — check your purchase email, Gumroad Library, or contact us.',
      subtitle: 'Lost your key or moving to a new Mac? Most cases are solved in two minutes with the steps below — no need to wait for support.',
      cta: 'Email us for key recovery',
      ctaSubject: 'CADM license key recovery',
      sections: {
        email: {
          title: '1. Check your purchase email',
          content: 'Your license key is emailed automatically right after purchase — from CoreAsia, and (for Gumroad purchases) it also appears on your Gumroad receipt. Try this first:',
          items: [
            'Search your inbox for "CoreAsia Download Manager" or "license key".',
            'Check your Spam / Junk / Promotions folders — automated emails sometimes land there.',
            'Make sure you are searching the email address you used at checkout (it may differ from your main address).',
          ],
        },
        gumroad: {
          title: '2. Bought on Gumroad? Open your Library',
          content: 'Every Gumroad purchase is stored permanently in your account. Go to gumroad.com/library, sign in with the email you used to buy, and open "CoreAsia Download Manager" — the receipt inside contains your license key and a button to resend it to your email.',
        },
        transfer: {
          title: '3. New Mac, or key rejected as "already active on another device"?',
          content: 'Your license works on one Mac at a time, and you can move it yourself:',
          items: [
            'On your old Mac: open CoreAsia Download Manager → Settings → License → "Deactivate this device".',
            'On your new Mac: open the app → Activate → enter the same license key.',
            'Old Mac no longer accessible (broken/sold)? Contact us — after verifying your purchase, we will release the device lock from our server.',
          ],
        },
        contact: {
          title: '4. Still stuck? We will help',
          content: 'Email {email} FROM the address you used to purchase, and include: your approximate purchase date and order number (if available — shown on your Gumroad receipt). We reply within 24 hours. For your security, never share your license key with anyone.',
        },
      },
    },
    downloaderRefund: {
      title: 'CoreAsia Download Manager Refund Policy',
      description: 'Refund policy for CoreAsia Download Manager — 14-day money-back guarantee, consumer rights, and Merchant of Record ({mor}) terms.',
      lastUpdated: 'Last updated: June 2026',
      sections: {
        intro: {
          title: '1. Overview',
          content: 'This policy explains the refund terms for purchases of CoreAsia Download Manager ("CAD") licenses from {company}. We provide a free 3-day trial so you can assess compatibility before you buy, and a 14-day money-back guarantee for Lifetime licenses. This policy is offered in addition to, and does not limit, your mandatory consumer rights under applicable law. Your purchase is processed by {mor} as Merchant of Record.',
        },
        trialFirst: {
          title: '2. Try It Free First',
          content: 'CAD offers a free 3-day trial before purchase. We recommend using this trial to confirm compatibility with your device and needs before buying. The trial is offered as a goodwill gesture and does not limit your cancellation or mandatory consumer rights. Your license key is delivered electronically immediately after purchase.',
        },
        guarantee: {
          title: '3. 14-Day Money-Back Guarantee',
          content: 'For Lifetime licenses, you may request a full refund within 14 (fourteen) days of the purchase date. You do not need to give a reason to request a refund within this period. We will decline a request within this period only where abuse is established, as described in "Abuse Prevention". A refund under this guarantee causes your license to end, as set out in "Effect of Refund on Your License".',
        },
        outsideWindow: {
          title: '4. Requests Outside the 14-Day Window',
          content: 'Requests outside the 14-day guarantee window fall outside this guarantee and create no entitlement to a refund. At our discretion and in good faith, we may still consider them on a case-by-case basis — in particular where there is (i) a technical issue that makes the application unusable and that we cannot resolve within a reasonable time; (ii) a verifiable duplicate or accidental purchase; or (iii) a product that materially fails to match our official description. For accidental duplicate purchases, we refund the extra (duplicate) copy, not a license you keep and use. Nothing here limits broader rights you may have under applicable law, which still apply.',
        },
        effect: {
          title: '5. Effect of Refund on Your License',
          content: 'When your refund request is approved and the funds are returned, the CAD license tied to that purchase legally ends and is no longer valid for use as of the refund date. You agree to stop using CAD and to delete the application and the license key from all your devices. Any use, copying, sharing, or resale of the license key after a refund is unlicensed use and a breach of our Terms of Use, which we may act on under applicable law. By requesting and accepting a refund, you agree to these terms.',
        },
        abuse: {
          title: '6. Abuse Prevention',
          content: 'We may decline or limit refund requests we reasonably consider to be abuse of this policy — including, without limitation: repeated or patterned requests, serial buy-then-refund behavior, signs of license-key use after a prior refund, sharing or reselling a key, or purchases that appear intended to obtain temporary access without paying. Refunds are generally granted once per customer for the same product, unless we decide otherwise. A CAD license is granted to a single user for reasonable use on devices you own; it is personal and non-transferable. You must not share, resell, publish, or distribute your license key.',
        },
        digitalConsent: {
          title: '7. Digital Content & Consent to Immediate Performance (EU/UK)',
          content: 'For EU/UK consumers, the 14-day right of withdrawal for digital content/services may be lost only if all three of the following are met before performance begins: (a) you give prior explicit consent for performance to begin immediately; (b) you acknowledge that you thereby lose the 14-day right of withdrawal; and (c) you receive confirmation on a durable medium (e.g., email). This durable-medium confirmation is provided by {mor} as seller of record. If any of these is not met, this waiver is void and you retain the right to withdraw and obtain a full refund as provided by law, even if the download has begun. In all cases, this does not remove our 14-day money-back guarantee, which we continue to offer as a commercial policy, and does not limit your statutory rights.',
        },
        statutory: {
          title: '8. Your Statutory Rights',
          content: 'This policy and guarantee are offered in addition to, and do not limit, the mandatory consumer rights you have under applicable law — including cancellation and conformity rights for consumers in the EU, EEA, and the UK (except where that right has validly ended because you requested and consented to immediate performance at checkout), and rights under Indonesia Law No. 8 of 1999 on Consumer Protection. Where mandatory rights give you broader protection, those rights prevail.',
        },
        products: {
          title: '9. Products: Lifetime & 1-Day Pass',
          content: '"Lifetime" means a one-time license valid with no recurring fees for the major version line of CoreAsia Download Manager current at purchase, including all updates within that line. Upgrades to a future major version may be offered separately. If we discontinue the product, your license continues to work on the last released version. The 14-day money-back guarantee applies to Lifetime licenses. For the 1-Day Pass: the validity period begins when the license key is delivered to you; because the service is performed immediately upon delivery, the 1-Day Pass is non-refundable once the key has been delivered, unless applicable law provides otherwise.',
        },
        howTo: {
          title: '10. How to Request',
          content: 'Email us at {email} with your order number / Order Reference and the email you used at purchase. Tell us what went wrong and we will help quickly.',
        },
        processing: {
          title: '11. Processing & Timing',
          content: 'Once approved, refunds are processed via {mor} to your original payment method, with an estimated 5–10 business days after approval; actual timing depends on the payment provider and your issuing bank. Refunds are issued in the original transaction currency. If your payment was converted by your bank or card provider, the amount you receive may differ slightly due to exchange-rate movements or third-party conversion fees, which are outside our control and that of {mor}.',
        },
        dispute: {
          title: '12. Before Filing a Dispute (Chargeback)',
          content: 'For valid purchases, please contact us first at {email} before filing a dispute (chargeback) with your bank; most issues are resolved faster by email. Your statement may reference {mor} (e.g. "{morStatement}"), CoreAsia, or CAD — please recognize this before reporting an unrecognized charge. Contacting us first does not limit your right to raise a dispute with your bank or card provider at any time. Like a refund, a dispute resolved in your favor legally terminates the related license as of that date on the same terms as "Effect of Refund on Your License", and you agree to stop using CAD.',
        },
        mor: {
          title: '13. Merchant of Record',
          content: 'Your purchase is processed by {mor} as Merchant of Record and seller of record. The purchase contract and tax handling (VAT/GST) are legally performed by {mor}; your mandatory consumer rights may be exercised through {mor}. This refund policy supplements and does not override the {mor} Terms of Sale; where they conflict on matters {mor} handles as Merchant of Record, the {mor} Terms of Sale prevail. {company} is responsible for the product, license, and support.',
        },
        integration: {
          title: '14. Governing Law, Integration & Seller Role',
          content: 'This Refund Policy forms part of and is subject to the CAD Terms of Use, and is governed by the laws of the Republic of Indonesia, without diminishing the mandatory consumer rights applicable to you (including EU/UK consumer withdrawal rights and rights under Law No. 8 of 1999). {mor} is the seller of record (Merchant of Record); the seller statutory obligations for refunds, withdrawal, and conformity/warranty are fulfilled through {mor}. The {company} refund policy is an additional good-will policy layered on top of those statutory rights. If there is any conflict regarding refunds between this document and the Terms of Use, this Refund Policy prevails for refund matters. Consequences of breach, indemnification, and dispute resolution are further governed by the Terms of Use (Sections 9 and 15).',
        },
        contact: {
          title: '15. Contact Us',
          content: '{company}. For questions about this policy or to request a refund, contact us at {email}.',
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
        { label: 'LeadKu', to: '/products/leadku' },
        { label: 'Articles & Insights', to: '/artikel' },
      ],
      partnershipLinks: [
        { label: 'SaaS Subscription', to: '/pricing' },
        { label: 'Venture Partnership', to: '/solutions/venture' },
        { label: 'Enterprise Custom', to: '/contact?subject=enterprise' },
      ],
      serviceLinks: [
        { label: 'Website Development', to: '/layanan/jasa-pembuatan-website' },
        { label: 'Web Monitoring Dashboard', to: '/layanan/web-monitoring-dashboard' },
        { label: 'Web App Development', to: '/layanan/jasa-pembuatan-aplikasi-web' },
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

export default EN_CONTENT
