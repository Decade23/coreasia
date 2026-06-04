<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import { CalendarDays, Clock, MapPin, Users, Video } from 'lucide-vue-next'

const schedules = [
    {
        id: 'SCH-JWD-001',
        title: 'Uji Kompetensi JWD Demo',
        scheme: 'Junior Web Developer',
        date: '23 Mei 2026',
        time: '09:00 WIB',
        location: 'Online',
        participants: 12,
        status: 'published',
    },
]
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-xl font-bold text-content">Jadwal Asesmen</h1>
                    <p class="text-[10px] text-brand font-black uppercase tracking-widest mt-1">Agenda asesor</p>
                </div>
            </div>
        </template>

        <div class="max-w-5xl mx-auto w-full py-6 space-y-6">
            <div class="grid grid-cols-1 gap-4">
                <article
                    v-for="schedule in schedules"
                    :key="schedule.id"
                    class="ca-card p-6 md:p-8"
                >
                    <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div class="min-w-0 space-y-3">
                            <div class="flex flex-wrap items-center gap-3">
                                <span class="text-[10px] font-black uppercase tracking-widest text-brand">{{ schedule.id }}</span>
                                <BaseBadge text="Terpublikasi" variant="success" type="soft" />
                            </div>
                            <div>
                                <h2 class="text-lg md:text-xl font-bold text-content">{{ schedule.title }}</h2>
                                <p class="mt-1 text-sm text-content-muted">{{ schedule.scheme }}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-[420px]">
                            <div class="rounded-xl bg-input p-4">
                                <div class="flex items-center gap-2 text-content-subtle">
                                    <CalendarDays class="w-4 h-4 text-brand" />
                                    <span class="text-[10px] font-black uppercase tracking-widest">Tanggal</span>
                                </div>
                                <p class="mt-2 text-sm font-bold text-content">{{ schedule.date }}</p>
                            </div>

                            <div class="rounded-xl bg-input p-4">
                                <div class="flex items-center gap-2 text-content-subtle">
                                    <Clock class="w-4 h-4 text-brand" />
                                    <span class="text-[10px] font-black uppercase tracking-widest">Waktu</span>
                                </div>
                                <p class="mt-2 text-sm font-bold text-content">{{ schedule.time }}</p>
                            </div>

                            <div class="rounded-xl bg-input p-4">
                                <div class="flex items-center gap-2 text-content-subtle">
                                    <MapPin class="w-4 h-4 text-brand" />
                                    <span class="text-[10px] font-black uppercase tracking-widest">Lokasi</span>
                                </div>
                                <p class="mt-2 text-sm font-bold text-content flex items-center gap-2">
                                    <Video class="w-4 h-4" />
                                    {{ schedule.location }}
                                </p>
                            </div>

                            <div class="rounded-xl bg-input p-4">
                                <div class="flex items-center gap-2 text-content-subtle">
                                    <Users class="w-4 h-4 text-brand" />
                                    <span class="text-[10px] font-black uppercase tracking-widest">Peserta</span>
                                </div>
                                <p class="mt-2 text-sm font-bold text-content">{{ schedule.participants }} asesi</p>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    </DashboardLayout>
</template>
