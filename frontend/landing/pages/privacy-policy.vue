<script setup lang="ts">
import { CONTACT, COMPANY } from '~/utils/constants'

const { useReveal } = useScrollReveal()
const heroSection = useReveal('fadeUp')
const contentCard = useReveal('fadeUp', 100)

useCoreSeo({
    title: 'Kebijakan Privasi',
    description: `Kebijakan privasi ${COMPANY.name} menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.`,
    path: '/privacy-policy',
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
                    Kebijakan Privasi
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
                    <h2>1. Informasi yang Kami Kumpulkan</h2>
                    <p>
                        {{ COMPANY.name }} mengumpulkan informasi yang Anda
                        berikan secara sukarela melalui formulir kontak di
                        website kami, termasuk:
                    </p>
                    <ul>
                        <li>Nama lengkap</li>
                        <li>Alamat email</li>
                        <li>Nomor WhatsApp (opsional)</li>
                        <li>Informasi kebutuhan bisnis yang disampaikan</li>
                    </ul>

                    <h2>2. Penggunaan Informasi</h2>
                    <p>Informasi yang dikumpulkan digunakan untuk:</p>
                    <ul>
                        <li>
                            Merespons pertanyaan dan permintaan konsultasi Anda
                        </li>
                        <li>
                            Memberikan informasi tentang layanan kami yang
                            relevan
                        </li>
                        <li>
                            Meningkatkan kualitas layanan dan pengalaman
                            pengguna
                        </li>
                    </ul>

                    <h2>3. Perlindungan Data</h2>
                    <p>
                        Kami menerapkan langkah-langkah keamanan yang wajar
                        untuk melindungi informasi pribadi Anda dari akses yang
                        tidak sah, perubahan, pengungkapan, atau penghancuran.
                    </p>

                    <h2>4. Pembagian Informasi</h2>
                    <p>
                        Kami tidak menjual, memperdagangkan, atau menyewakan
                        informasi pribadi Anda kepada pihak ketiga. Informasi
                        hanya dibagikan jika diperlukan untuk memenuhi
                        permintaan layanan Anda.
                    </p>

                    <h2>5. Cookie dan Teknologi Pelacakan</h2>
                    <p>
                        Website ini menggunakan cookie teknis yang diperlukan
                        untuk fungsi dasar situs. Kami tidak menggunakan cookie
                        pelacakan pihak ketiga tanpa persetujuan Anda.
                    </p>

                    <h2>6. Hak Anda</h2>
                    <p>Anda berhak untuk:</p>
                    <ul>
                        <li>Meminta akses ke data pribadi Anda</li>
                        <li>Meminta koreksi data yang tidak akurat</li>
                        <li>Meminta penghapusan data pribadi Anda</li>
                        <li>Menarik persetujuan penggunaan data</li>
                    </ul>

                    <h2>7. Perubahan Kebijakan</h2>
                    <p>
                        Kami dapat memperbarui kebijakan privasi ini dari waktu
                        ke waktu. Perubahan akan diinformasikan melalui halaman
                        ini.
                    </p>

                    <h2>8. Hubungi Kami</h2>
                    <p>
                        Untuk pertanyaan terkait kebijakan privasi, hubungi kami
                        di
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
