export interface PublicNavLink {
    label: string
    description: string
    to: string
    icon: string
    soon?: boolean
}
export interface PublicNavItem {
    key: string
    label: string
    to?: string
    paths?: string[]
    children?: PublicNavLink[]
}

const GROUPS = {
    layanan: [
        {
            label: ['Jasa pembuatan website', 'Website development'],
            desc: ['Company profile dan landing page', 'Company profiles and landing pages'],
            url: '/layanan/jasa-pembuatan-website',
            icon: 'web',
        },
        {
            label: ['Aplikasi web custom', 'Custom web applications'],
            desc: ['Portal dan sistem operasional', 'Portals and operational software'],
            url: '/layanan/jasa-pembuatan-aplikasi-web',
            icon: 'code',
        },
        {
            label: ['Pemantauan website', 'Website monitoring'],
            desc: ['Analitik, SEO, dan laporan', 'Analytics, SEO, and reporting'],
            url: '/layanan/web-monitoring-dashboard',
            icon: 'chart',
        },
        {
            label: ['Sistem pelaporan K3', 'Safety reporting systems'],
            desc: ['Catatan kegiatan dan pelaporan', 'Operational records and reporting'],
            url: '/layanan/sistem-pelaporan-k3',
            icon: 'shield',
        },
        {
            label: ['Sistem informasi klinik', 'Clinic information systems'],
            desc: ['Integrasi dan kebutuhan klinik', 'Clinical integrations and workflows'],
            url: '/layanan/sistem-informasi-klinik',
            icon: 'clinic',
        },
        {
            label: ['Sistem transaksi', 'Transaction systems'],
            desc: ['Pesanan, penagihan, dan stok', 'Orders, billing, and inventory'],
            url: '/layanan/sistem-manajemen-transaksi',
            icon: 'box',
        },
    ],
    produk: [
        {
            label: ['LeadKu', 'LeadKu'],
            desc: ['CRM untuk tim penjualan', 'CRM for sales teams'],
            url: '/products/leadku',
            icon: 'people',
        },
        {
            label: ['Pantau', 'Pantau'],
            desc: ['Analitik dan pemantauan website', 'Website analytics and monitoring'],
            url: '/products/pantau',
            icon: 'chart',
        },
        {
            label: ['CoreAsia LMS', 'CoreAsia LMS'],
            desc: ['Pelatihan dan sertifikasi', 'Training and certification'],
            url: '/products/lms',
            icon: 'shield',
            soon: true,
        },
        {
            label: ['Downloader', 'Downloader'],
            desc: ['Kelola unduhan dari web', 'Manage downloads from the web'],
            url: '/products/downloader',
            icon: 'download',
        },
        {
            label: ['Mounter', 'Mounter'],
            desc: ['Drive NTFS untuk Mac', 'NTFS drives on Mac'],
            url: '/products/mounter',
            icon: 'drive',
        },
        {
            label: ['Beres', 'Beres'],
            desc: ['Alat untuk berkas dan kontak', 'Tools for files and contacts'],
            url: '/products/beres',
            icon: 'file',
        },
    ],
    tentang: [
        {
            label: ['Tentang CoreAsia', 'About CoreAsia'],
            desc: ['Kenali orang dan cara kerjanya', 'Meet the people and our approach'],
            url: '/about',
            icon: 'people',
        },
        {
            label: ['Kerja sama', 'Partnerships'],
            desc: ['Pilih cara bekerja bersama', 'Find the right way to work together'],
            url: '/partnerships',
            icon: 'hand',
        },
        {
            label: ['Hubungi kami', 'Contact us'],
            desc: ['Ceritakan kebutuhanmu', 'Tell us what you need'],
            url: '/contact',
            icon: 'chat',
        },
    ],
}
const NAV = [
    {
        key: 'layanan',
        label: ['Layanan', 'Services'],
        paths: ['/layanan'],
    },
    {
        key: 'portfolio',
        label: ['Portofolio', 'Portfolio'],
        url: '/portfolio',
    },
    {
        key: 'produk',
        label: ['Produk', 'Products'],
        paths: ['/products'],
    },
    {
        key: 'pricing',
        label: ['Harga', 'Pricing'],
        url: '/pricing',
    },
    {
        key: 'artikel',
        label: ['Artikel', 'Articles'],
        url: '/artikel',
    },
    {
        key: 'tentang',
        label: ['Tentang', 'About'],
        paths: ['/about', '/partnerships', '/solutions'],
    },
]

export const getPublicNavigation = (locale = 'id'): PublicNavItem[] => {
    const i = locale === 'en' ? 1 : 0
    return NAV.map((item) => ({
        key: item.key,
        label: item.label[i],
        to: 'url' in item ? item.url : undefined,
        paths: 'paths' in item ? item.paths : undefined,
        children:
            item.key in GROUPS
                ? GROUPS[item.key as keyof typeof GROUPS].map((link) => ({
                      label: link.label[i],
                      description: link.desc[i],
                      to: link.url,
                      icon: link.icon,
                      soon: 'soon' in link && link.soon,
                  }))
                : undefined,
    }))
}

export const getNavItems = (locale = 'id') =>
    getPublicNavigation(locale).map((item) => ({ label: item.label, to: item.to || item.children![0]!.to }))
