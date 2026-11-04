<script setup lang="ts">
import { tombolPengumuman } from '~/adapters/cashflowPengumumanTautan'
const props = defineProps<{ judul: string; isi: string; level: string; tombol: string; url: string }>()
const { tcf } = useCashflowI18n()
const tautan = computed(() => tombolPengumuman(props.tombol, props.url))
</script>

<template>
  <div class="cf-pratinjau rounded-2xl border border-[color:var(--ca-border)] p-4">
    <p class="mb-4 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.beranda') }}</p>
    <div class="cf-spanduk" :class="level">
      <span class="cf-ikon"><Icon :name="level === 'info' ? 'lucide:info' : 'lucide:triangle-alert'" class="h-4 w-4" /></span>
      <div class="min-w-0 flex-1">
        <h4>{{ judul || tcf('pengumuman.judulKolom') }}</h4>
        <p class="whitespace-pre-wrap break-words">{{ isi || tcf('pengumuman.isi') }}</p>
        <template v-if="tautan">
          <a :href="tautan.url" target="_blank" rel="noopener noreferrer" class="cf-tombol"><Icon name="lucide:globe" class="h-4 w-4 shrink-0" /><span class="min-w-0 break-words">{{ tautan.label }}</span></a>
          <span class="cf-domain">{{ tautan.host }}</span>
        </template>
      </div>
      <Icon name="lucide:x" class="mt-1 h-4 w-4 shrink-0 opacity-65" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
/* Nilai dari token CashFlow yang sudah dipakai aplikasi, tanpa palet baru. */
.cf-pratinjau { --cf-bg:#F4F6FA; --cf-txt:#0E1730; --cf-muted:#45506A; --cf-line:#E7EBF2; --cf-warning:#7a5500; --cf-warning-bg:#FFF2D8; --cf-danger:#c62348; --cf-danger-bg:#FBEBEE; background:#fff; }
:global(html[data-theme="dark"]) .cf-pratinjau { --cf-bg:#19233F; --cf-txt:#EEF2FA; --cf-muted:#B3BDD2; --cf-line:#1E2946; --cf-warning:#FFBE3D; --cf-warning-bg:#30281D; --cf-danger:#FF8FA6; --cf-danger-bg:#40222F; background:#0A0F1F; }
.cf-spanduk { display:flex;align-items:flex-start;gap:11px;padding:14px 10px 14px 14px;border:1px solid var(--cf-line);border-radius:16px;background:var(--cf-bg);color:var(--cf-txt); }
.cf-spanduk.warning { background:var(--cf-warning-bg);border-color:color-mix(in srgb,var(--cf-warning) 34%,transparent); }
.cf-spanduk.critical { background:var(--cf-danger-bg);border-color:color-mix(in srgb,var(--cf-danger) 34%,transparent); }
.cf-ikon { display:grid;place-items:center;width:32px;height:32px;flex-shrink:0;border-radius:11px;background:color-mix(in srgb,var(--cf-muted) 14%,transparent); }
.warning .cf-ikon,.warning h4 { color:var(--cf-warning); }.critical .cf-ikon,.critical h4 { color:var(--cf-danger); }
.cf-spanduk h4 { margin:0 0 4px;font-size:13.5px;font-weight:700;line-height:20px;overflow-wrap:anywhere; }
.cf-spanduk p { color:var(--cf-muted);font-size:11px;line-height:17px; }
.cf-tombol { display:inline-flex;align-items:center;gap:8px;max-width:100%;min-height:44px;margin-top:10px;padding:10px 12px;border-radius:12px;background:#FFBE3D;color:#1a1204;font-size:12.5px;font-weight:700;text-decoration:none; }
.cf-tombol:focus-visible { outline:2px solid var(--ca-gold-text);outline-offset:3px; }
.cf-domain { display:block;margin-top:5px;overflow-wrap:anywhere;font-size:10px;color:var(--cf-muted); }
</style>
