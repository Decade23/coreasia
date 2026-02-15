<script setup lang="ts">
import { CONTACT, COMPANY } from '~/utils/constants'

const { useReveal } = useScrollReveal()
const heroSection = useReveal('fadeUp')
const contentCard = useReveal('fadeUp', 100)

useCoreSeo({
    title: 'Syarat dan Ketentuan',
    description: `Syarat dan ketentuan penggunaan layanan ${COMPANY.name}. Harap baca dengan seksama sebelum menggunakan layanan kami.`,
    path: '/terms',
})
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_0%,rgba(251,191,36,0.08),transparent_62%)]"
                />
            </div>

            <div ref="heroSection" class="ca-container relative ca-section pb-8">
                <span class="ca-kicker">Legal</span>
                <h1
                    class="mt-5 font-display text-4xl font-bold text-white sm:text-5xl"
                >
                    Syarat dan Ketentuan
                </h1>
                <p class="ca-copy mt-4">
                    Terakhir diperbarui: Februari 2026
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <article
                    ref="contentCard"
                    class="ca-card prose prose-invert max-w-none p-6 sm:p-8 lg:p-10"
                >
                    <h2>1. Ketentuan Umum</h2>
                    <p>
                        Dengan mengakses dan menggunakan website
                        {{ COMPANY.name }}, Anda menyetujui untuk terikat
                        dengan syarat dan ketentuan ini.
                    </p>

                    <h2>2. Deskripsi Layanan</h2>
                    <p>
                        {{ COMPANY.name }} menyediakan layanan teknologi
                        meliputi:
                    </p>
                    <ul>
                        <li>
                            Platform SaaS LMS untuk lembaga sertifikasi dan
                            training center
                        </li>
                        <li>
                            Program venture partnership dengan model bagi hasil
                        </li>
                        <li>
                            Solusi enterprise kustom untuk kebutuhan korporasi
                        </li>
                    </ul>

                    <h2>3. Penggunaan Website</h2>
                    <p>Anda setuju untuk:</p>
                    <ul>
                        <li>
                            Menggunakan website hanya untuk tujuan yang sah
                        </li>
                        <li>
                            Tidak melakukan tindakan yang dapat merusak atau
                            mengganggu fungsi website
                        </li>
                        <li>
                            Memberikan informasi yang akurat pada formulir
                            kontak
                        </li>
                    </ul>

                    <h2>4. Hak Kekayaan Intelektual</h2>
                    <p>
                        Seluruh konten di website ini termasuk teks, grafis,
                        logo, dan kode sumber merupakan milik
                        {{ COMPANY.name }} dan dilindungi oleh hukum hak cipta
                        Indonesia.
                    </p>

                    <h2>5. Batasan Tanggung Jawab</h2>
                    <p>
                        {{ COMPANY.name }} berupaya menjaga keakuratan
                        informasi di website ini. Namun, kami tidak menjamin
                        bahwa semua informasi selalu terkini atau bebas
                        kesalahan.
                    </p>

                    <h2>6. Perjanjian Layanan</h2>
                    <p>
                        Detail perjanjian layanan spesifik (SaaS, venture,
                        enterprise) akan diatur dalam kontrak terpisah antara
                        {{ COMPANY.name }} dan klien.
                    </p>

                    <h2>7. Hukum yang Berlaku</h2>
                    <p>
                        Syarat dan ketentuan ini diatur dan ditafsirkan
                        berdasarkan hukum Republik Indonesia.
                    </p>

                    <h2>8. Perubahan Ketentuan</h2>
                    <p>
                        {{ COMPANY.name }} berhak mengubah syarat dan ketentuan
                        ini sewaktu-waktu. Perubahan berlaku efektif setelah
                        dipublikasikan di halaman ini.
                    </p>

                    <h2>9. Hubungi Kami</h2>
                    <p>
                        Untuk pertanyaan terkait syarat dan ketentuan, hubungi
                        kami di
                        <a
                            :href="`mailto:${CONTACT.email}`"
                            class="text-amber-300 hover:text-amber-200"
                            >{{ CONTACT.email }}</a
                        >.
                    </p>
                </article>
            </div>
        </section>
    </div>
</template>
