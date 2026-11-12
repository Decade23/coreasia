<script setup lang="ts">
/**
 * Pratinjau satu kartu paket seperti di lembar kredit aplikasi: jumlah kredit,
 * label, harga yang ditagih, harga normal dicoret, cap "Hemat N%", dan batas
 * promo. Hanya menampilkan; angkanya dihitung adapter (hargaTampil) dengan
 * aturan yang sama dengan server.
 *
 * Warna memakai token aplikasi CashFlow (terang dan gelap), bukan token
 * console, supaya yang terlihat di sini sama dengan yang dilihat pengguna.
 */
import { rupiah } from '~/adapters/cashflow'
import type { HargaTampil } from '~/adapters/cashflowPaket'

const props = defineProps<{ kredit: number; label: string | null; tampil: HargaTampil }>()
const { tcf, formatTanggal, formatJam } = useCashflowI18n()
const batas = computed(() => (props.tampil.promoSampai ? `${formatTanggal(props.tampil.promoSampai)} ${formatJam(props.tampil.promoSampai)}` : ''))
</script>

<template>
  <div class="cf-paket-pratinjau">
    <p class="cf-lembar-judul">{{ tcf('paket.pratinjau.judulLembar') }}</p>
    <div class="cf-kartu" role="img" :aria-label="`${tcf('paket.kredit')(kredit)} ${rupiah(tampil.harga)}`">
      <span class="cf-radio" aria-hidden="true" />
      <div class="cf-tengah">
        <div class="cf-baris">
          <strong class="cf-nama">{{ tcf('paket.kredit')(kredit) }}</strong>
          <span v-if="label" class="cf-label">{{ label }}</span>
        </div>
        <div v-if="tampil.hematPersen !== null" class="cf-baris cf-kecil">
          <span class="cf-hemat">{{ tcf('paket.pratinjau.hemat')(tampil.hematPersen) }}</span>
          <span v-if="batas" class="cf-batas">{{ tcf('paket.pratinjau.promoSampai')(batas) }}</span>
        </div>
      </div>
      <div class="cf-harga">
        <strong class="cf-tagih">{{ rupiah(tampil.harga) }}</strong>
        <s v-if="tampil.hargaNormal !== null" class="cf-normal">{{ rupiah(tampil.hargaNormal) }}</s>
      </div>
    </div>
    <div class="cf-tombol" aria-hidden="true">{{ tcf('paket.pratinjau.lanjutBayar')(rupiah(tampil.harga)) }}</div>
  </div>
</template>

<style>
/* Token aplikasi CashFlow (src/theme/tokens.ts), tanpa palet baru. Sengaja
   TIDAK scoped: pemilih global di blok scoped dikompilasi menjadi pemilih
   html-nya saja, jadi token gelap jatuh ke <html> dan token terang milik
   kartu tetap menang. Nama kelasnya khusus komponen ini. */
.cf-paket-pratinjau {
  --cf-layar:#ffffff; --cf-txt:#0E1730; --cf-txt2:#45506A; --cf-txt3:#646E85; --cf-line:rgba(14,23,48,0.10);
  --cf-inti:#1A2445; --cf-on-inti:#ffffff; --cf-mint:#0A7A5C; --cf-mint-bg:#E6F2EF; --cf-emas:#7a5500; --cf-emas-bg:#FFF2D8;
}
html[data-theme="dark"] .cf-paket-pratinjau {
  --cf-layar:#0A0F1F; --cf-txt:#EEF2FA; --cf-txt2:#B3BDD2; --cf-txt3:#8C97AE; --cf-line:rgba(160,178,220,0.14);
  --cf-inti:#E9EEF8; --cf-on-inti:#1A2445; --cf-mint:#1BC49E; --cf-mint-bg:#173A33; --cf-emas:#FFBE3D; --cf-emas-bg:#3D3318;
}
</style>

<style scoped>
.cf-paket-pratinjau { display:flex; flex-direction:column; gap:12px; padding:18px 16px 16px; border-radius:24px; background:var(--cf-layar); color:var(--cf-txt); border:1px solid var(--cf-line); }
.cf-lembar-judul { margin:0; font-size:16px; font-weight:800; line-height:22px; }
.cf-kartu { display:flex; align-items:center; gap:12px; min-height:60px; padding:10px 14px; border-radius:16px; border:2px solid var(--cf-inti); background:var(--cf-layar); }
.cf-radio { flex-shrink:0; width:22px; height:22px; border-radius:11px; border:6px solid var(--cf-inti); }
.cf-tengah { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.cf-baris { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-width:0; }
.cf-nama { font-size:15.5px; font-weight:800; line-height:20px; }
.cf-label { display:inline-flex; align-items:center; max-width:100%; padding:1px 8px; border-radius:999px; background:var(--cf-emas-bg); color:var(--cf-emas); font-size:11px; font-weight:800; line-height:18px; overflow-wrap:anywhere; }
.cf-kecil { font-size:11.5px; line-height:16px; }
.cf-hemat { padding:1px 7px; border-radius:999px; background:var(--cf-mint-bg); color:var(--cf-mint); font-weight:800; }
.cf-batas { color:var(--cf-txt3); font-weight:600; }
.cf-harga { display:flex; flex-direction:column; align-items:flex-end; flex-shrink:0; gap:2px; font-variant-numeric:tabular-nums; }
.cf-tagih { font-size:14.5px; font-weight:800; color:var(--cf-txt); line-height:19px; }
.cf-normal { font-size:12px; font-weight:600; color:var(--cf-txt3); line-height:16px; }
.cf-tombol { display:flex; align-items:center; justify-content:center; min-height:48px; padding:0 16px; border-radius:16px; background:var(--cf-inti); color:var(--cf-on-inti); font-size:14.5px; font-weight:800; text-align:center; }
</style>
