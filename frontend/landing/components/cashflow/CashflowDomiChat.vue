<script setup lang="ts">
/**
 * Panel chat Domi: latar abu, gelembung pengguna navy di kanan, jawaban di
 * kolom sebelah avatar kecil, jam di bawah jawaban. Baca saja. Pesan terlama
 * di atas, "Muat pesan lebih lama" menambah halaman di atas.
 *
 * Token warna hidup di sini: gelap memakai nilai malam navy aplikasi,
 * terang nilai putih aplikasi. Komponen di dalamnya hanya memakai var(--d-*).
 */
import type { PanelDomi } from '~/composables/cashflow/useCashflowDomi'
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

const props = defineProps<{
  panel: PanelDomi | null
  foto: ReadonlyMap<string, FotoDomi>
  memuat: boolean
  kosongDaftar: boolean
}>()
const emit = defineEmits<{ lebihLama: []; foto: [jalur: readonly string[], klik: string]; kembali: [] }>()
const { tcf } = useCashflowI18n()
const judul = computed(() => props.panel?.percakapan.judul || tcf('domi.tanpaJudul'))
</script>

<template>
  <div class="domi-chat flex flex-col overflow-hidden rounded-xl border border-[color:var(--ca-border)]">
    <div v-if="!panel" class="px-4 py-8 text-center text-sm text-[var(--ca-muted)]">
      {{ kosongDaftar ? tcf('domi.kosong') : tcf('domi.pilih') }}
    </div>
    <template v-else>
      <header class="flex items-center gap-2 border-b border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-2 py-2 sm:px-3">
        <button type="button" class="ca-btn-ghost !h-11 !w-11 shrink-0 p-0 lg:hidden" :aria-label="tcf('domi.kembali')" @click="emit('kembali')">
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
        </button>
        <span class="domi-avatar domi-avatar-besar shrink-0" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="h-5 w-5"><path d="M11 5l1.9 5.1L18 12l-5.1 1.9L11 19l-1.9-5.1L4 12l5.1-1.9z" fill="#FFBE3D" /><path d="M18.5 3v4M16.5 5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" /></svg>
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-[var(--ca-text)]">{{ judul }}</p>
          <p class="text-xs text-[var(--ca-muted)]">{{ tcf('domi.pesan')(panel.percakapan.jumlahPesan) }} · {{ tcf('domi.anakSesi') }}</p>
        </div>
      </header>
      <div class="domi-bidang" :aria-busy="memuat || undefined">
        <div v-if="panel.adaLagi" class="flex justify-center pb-1">
          <button type="button" class="domi-lebih" :disabled="memuat" @click="emit('lebihLama')">
            {{ memuat ? tcf('umum.memuat') : tcf('domi.lebihLama') }}
          </button>
        </div>
        <template v-for="p in panel.pesan" :key="p.id">
          <div v-if="p.peran === 'user'" class="flex flex-col items-end gap-1.5">
            <div v-if="p.jalur.length" class="flex flex-wrap justify-end gap-1.5" :class="p.jalur.length > 1 ? 'max-w-[92%]' : ''">
              <CashflowDomiFoto
                v-for="j in p.jalur" :key="j" :jalur="j" :foto="foto.get(j)"
                :lebar="p.jalur.length === 1 ? 148 : 72" :tinggi="p.jalur.length === 1 ? 148 : 88" :radius="p.jalur.length === 1 ? 10 : 12"
                @buka="emit('foto', p.jalur, j)"
              />
            </div>
            <span v-else-if="p.gambar" class="domi-chip-gambar">
              <Icon name="lucide:image" class="h-3.5 w-3.5" aria-hidden="true" />{{ tcf('domi.gambarLabel') }}
            </span>
            <div v-if="p.teks" class="domi-pengguna">{{ p.teks }}</div>
          </div>
          <CashflowDomiJawaban v-else :pesan="p" :foto="foto" @foto="(j, k) => emit('foto', j, k)" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.domi-chat {
  --d-latar: #0a0f1f; --d-gelembung: #19233f; --d-kertas: #3d3318; --d-garis: rgba(255, 240, 210, 0.3); --d-label: #ffbe3d;
  --d-avatar: #1f2a4a; --d-user-bg: #e9eef8; --d-user-tx: #1a2445; --d-txt: #eef2fa; --d-txt2: #b3bdd2; --d-txt3: #8c97ae;
  --d-mint: #1bc49e; --d-rose: #ff8fa6; --d-amber: #ffbe3d; --d-sky: #4cc4f5; --d-iris: #9b93f2;
  --d-line: rgba(160, 178, 220, 0.14); --d-line2: rgba(160, 178, 220, 0.08); --d-bayang: rgba(0, 0, 0, 0.35);
  background: var(--d-latar);
  color: var(--d-txt);
}
html[data-theme='light'] .domi-chat {
  --d-latar: #eef1f6; --d-gelembung: #ffffff; --d-kertas: #fff8e8; --d-garis: rgba(14, 23, 48, 0.3); --d-label: #7a5500;
  --d-avatar: #1a2445; --d-user-bg: #1a2445; --d-user-tx: #ffffff; --d-txt: #0e1730; --d-txt2: #45506a; --d-txt3: #646e85;
  --d-mint: #0a7a5c; --d-rose: #c62348; --d-amber: #7a5500; --d-sky: #0a6f9e; --d-iris: #4a41c8;
  --d-line: rgba(14, 23, 48, 0.1); --d-line2: rgba(14, 23, 48, 0.06); --d-bayang: rgba(14, 23, 48, 0.14);
}
.domi-bidang {
  display: flex; flex-direction: column; gap: 10px; padding: 14px 12px;
  max-height: 72vh; overflow-y: auto;
}
.domi-pengguna {
  max-width: 86%; padding: 9px 14px; font-size: 14px; font-weight: 600; line-height: 19px;
  border-radius: 20px 20px 6px 20px; background: var(--d-user-bg); color: var(--d-user-tx);
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.domi-chip-gambar {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 999px;
  background: var(--d-gelembung); border: 1px solid var(--d-line); font-size: 12px; font-weight: 700; color: var(--d-txt2);
}
.domi-lebih {
  height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13px; font-weight: 700;
  background: var(--d-gelembung); color: var(--d-txt2); border: 1px solid var(--d-line);
}
.domi-lebih:disabled { opacity: 0.6; }
.domi-avatar { display: inline-flex; align-items: center; justify-content: center; color: #fff; background: var(--d-avatar); }
.domi-avatar-besar { width: 40px; height: 40px; border-radius: 20px; }
</style>
