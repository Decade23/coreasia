<script setup lang="ts">
import { tombolPengumuman } from '~/adapters/cashflowPengumumanTautan'
const props = defineProps<{ judul: string; isi: string; level: string; tombol: string; url: string }>()
const { tcf } = useCashflowI18n()
const tautan = computed(() => tombolPengumuman(props.tombol, props.url))
</script>

<template>
  <div class="cf-pratinjau rounded-2xl border border-[color:var(--ca-border)] p-4">
    <p class="cf-preview-label text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.beranda') }}</p>
    <div class="cf-spanduk" :class="level">
      <component :is="tautan ? 'a' : 'div'" :href="tautan?.url" :target="tautan ? '_blank' : undefined" :rel="tautan ? 'noopener noreferrer' : undefined" class="cf-cardlink">
        <div class="cf-heading"><Icon :name="level === 'info' ? 'lucide:info' : 'lucide:triangle-alert'" class="cf-ikon" /><h4>{{ judul || tcf('pengumuman.judulKolom') }}</h4></div>
        <p class="whitespace-pre-wrap break-words">{{ isi || tcf('pengumuman.isi') }}</p>
        <div v-if="tautan" class="cf-footer"><span class="cf-tombol">{{ tautan.label }}<Icon name="lucide:arrow-up-right" class="h-4 w-4 shrink-0" /></span><span class="cf-domain">{{ tautan.host }}</span></div>
      </component>
      <span class="cf-close" aria-hidden="true"><Icon name="lucide:x" class="h-4 w-4" /></span>
    </div>
  </div>
</template>

<style scoped>
/* Nilai dari token CashFlow yang sudah dipakai aplikasi, tanpa palet baru. */
.cf-pratinjau { --cf-bg:#fff; --cf-txt:#0E1730; --cf-muted:#45506A; --cf-line:#E7EBF2; --cf-warning:#7a5500; --cf-warning-bg:#FFF2D8; --cf-danger:#c62348; --cf-danger-bg:#FBEBEE; background:#fff; }
:global(html[data-theme="dark"]) .cf-pratinjau { --cf-bg:#111932; --cf-txt:#EEF2FA; --cf-muted:#B3BDD2; --cf-line:#1E2946; --cf-warning:#FFBE3D; --cf-warning-bg:#30281D; --cf-danger:#FF8FA6; --cf-danger-bg:#40222F; background:#0A0F1F; }
.cf-pratinjau { position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;min-height:320px;padding:24px; }
.cf-pratinjau::before { content:'';position:absolute;inset:0;border-radius:inherit;background:rgba(0,0,0,.35);z-index:-1; }
.cf-preview-label { position:absolute;top:16px;left:16px;opacity:.5; }
.cf-spanduk { width:100%;position:relative;overflow:hidden;border:1px solid var(--cf-line);border-radius:18px;background:var(--cf-bg);color:var(--cf-txt); }
.cf-spanduk::before { content:'';position:absolute;inset:0 auto 0 0;width:3px;background:#FFBE3D;pointer-events:none; }
.cf-cardlink { display:block;padding:16px;color:inherit;text-decoration:none; }
.cf-cardlink:focus-visible { outline:2px solid var(--ca-gold-text);outline-offset:-3px; }
.cf-heading { display:flex;align-items:center;gap:8px;padding-right:32px; }
.cf-ikon { width:18px;height:18px;flex-shrink:0;color:var(--cf-muted); }
.warning .cf-ikon { color:var(--cf-warning); }.critical .cf-ikon { color:var(--cf-danger); }
.cf-spanduk h4 { margin:0;font-size:15px;font-weight:800;line-height:23px;overflow-wrap:anywhere; }
.cf-spanduk p { margin-top:8px;color:var(--cf-muted);font-size:12.5px;line-height:20px; }
.cf-footer { display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;column-gap:12px;margin-top:8px; }
.cf-tombol { display:inline-flex;align-items:center;gap:6px;max-width:100%;min-height:44px;color:var(--cf-warning);font-size:12.5px;font-weight:800;overflow-wrap:anywhere; }
.cf-domain { overflow-wrap:anywhere;font-size:11px;color:var(--cf-muted); }
.cf-close { position:absolute;right:2px;top:2px;width:44px;height:44px;display:grid;place-items:center;color:var(--cf-muted); }
</style>
