<script setup lang="ts">
const props = defineProps<{ kind: 'website' | 'webapp' }>()
const { locale } = useCoreI18n()
const links = computed(() =>
    props.kind === 'website'
        ? [
              { title: 'Menyusun biaya website perusahaan', to: '/artikel/berapa-biaya-pembuatan-website-perusahaan' },
              {
                  title: 'Memilih landing page, company profile atau toko online',
                  to: '/artikel/landing-page-company-profile-atau-toko-online',
              },
              { title: 'Contoh pekerjaan CoreAsia', to: '/portfolio' },
          ]
        : [
              {
                  title: 'Menyiapkan kebutuhan aplikasi dari alur kerja',
                  to: '/artikel/cara-menyusun-kebutuhan-aplikasi-web-custom',
              },
              { title: 'Studi kasus CRM LeadKu', to: '/portfolio/leadku-crm-tim-penjualan' },
              { title: 'Studi kasus monitoring Pantau', to: '/portfolio/pantau-monitoring-website' },
          ],
)
</script>
<template>
    <section class="ca-section pt-0">
        <div class="ca-container">
            <h2 class="font-display text-2xl font-bold">
                {{ locale === 'en' ? 'Guides and examples in Indonesian' : 'Panduan dan contoh sebelum memulai' }}
            </h2>
            <div class="mt-5 grid gap-5 md:grid-cols-3">
                <NuxtLink
                    v-for="item in links"
                    :key="item.to"
                    :to="item.to"
                    class="ca-card-soft flex items-center justify-between gap-4 p-6 font-semibold"
                >
                    <span>{{ item.title }}</span>
                    <Icon name="lucide:arrow-up-right" class="h-4 w-4 shrink-0 ca-tone-gold" />
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
