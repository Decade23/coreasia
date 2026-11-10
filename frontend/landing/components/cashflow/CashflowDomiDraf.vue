<script setup lang="ts">
/**
 * Kartu draf Domi di console: baca saja. Draf struk memakai kertas dengan foto
 * dijepit, draf rencana memakai kertas, draf lain kartu gelembung. Tanpa
 * Simpan, Batal, atau cap TERSIMPAN karena keadaan simpan hanya ada di HP
 * pengguna. Bentuk yang tidak bisa dibaca jatuh ke kotak nama tipe.
 */
import { rancangDraf, rancangTransaksi, type AlatDraf, type SusunanDomi } from '~/adapters/cashflowDomi'
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

const props = defineProps<{ s: Extract<SusunanDomi, { jenis: 'transaksi' | 'draf' }>; foto: ReadonlyMap<string, FotoDomi> }>()
const emit = defineEmits<{ foto: [jalur: readonly string[], klik: string] }>()
const { tcf, formatTanggal } = useCashflowI18n()
const t: AlatDraf['t'] = (kunci, ...arg) => {
  const v = tcf(`domi.${kunci}`) as unknown
  if (typeof v !== 'function') return String(v ?? kunci)
  // Nilai enum rusak bisa menunjuk Object.prototype.valueOf: jangan dipanggil.
  return arg.length > 0 ? (v as (...x: unknown[]) => string)(...arg) : kunci
}
const alat: AlatDraf = { t, tanggal: iso => formatTanggal(iso) }
const kartu = computed(() => {
  if (props.s.jenis !== 'draf') return null
  try { return rancangDraf(props.s, alat) } catch { return null }
})
const trx = computed(() => (props.s.jenis === 'transaksi' ? rancangTransaksi(props.s.draf, alat) : null))
const WARNA: Record<string, string> = {
  sky: 'var(--d-sky)', iris: 'var(--d-iris)', rose: 'var(--d-rose)', mint: 'var(--d-mint)', amber: 'var(--d-amber)', abu: 'var(--d-txt2)',
}
const labelAsing = computed(() => (props.s.jenis === 'draf' ? `draf:${props.s.aksi}` : 'transaksi'))
const dibuka = ref(false)
const fotoStruk = computed(() => (kartu.value?.jenis === 'struk' ? kartu.value.jalur : null))
</script>

<template>
  <!-- Draf transaksi: baris putih. -->
  <div v-if="s.jenis === 'transaksi' && trx" class="domi-baris-trx">
    <div class="min-w-0 flex-1 py-1.5">
      <p class="truncate text-[14px] font-bold text-[var(--d-txt)]">{{ trx.nama }}</p>
      <p class="truncate text-[12px] font-semibold text-[var(--d-txt3)]">{{ trx.anak }}</p>
    </div>
    <span class="shrink-0 text-[14px] font-extrabold tabular-nums" :style="{ color: trx.masuk ? 'var(--d-mint)' : 'var(--d-txt)' }">{{ trx.nominal }}</span>
    <CashflowDomiFoto v-if="trx.jalur" :jalur="trx.jalur" :foto="foto.get(trx.jalur)" :lebar="46" :tinggi="56" :radius="9" @buka="emit('foto', [trx!.jalur!], trx!.jalur!)" />
  </div>

  <!-- Draf struk: kertas, foto dijepit di sudut kanan atas. Draf ke-2 dan seterusnya terlipat. -->
  <CashflowDomiKertas v-else-if="kartu?.jenis === 'struk' && kartu.lipat && !dibuka" baris>
    <CashflowDomiFoto v-if="fotoStruk" :jalur="fotoStruk" :foto="foto.get(fotoStruk)" :lebar="38" :tinggi="46" :radius="6" @buka="emit('foto', [fotoStruk!], fotoStruk!)" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-[14.5px] font-extrabold text-[var(--d-txt)]">{{ kartu.toko }}</p>
      <p class="text-[14px] font-extrabold tabular-nums text-[var(--d-txt)]">{{ kartu.nominal }}</p>
    </div>
    <button type="button" class="domi-buka" :aria-label="tcf('domi.draf.strukCap')" @click="dibuka = true"><Icon name="lucide:chevron-down" class="h-[18px] w-[18px]" /></button>
  </CashflowDomiKertas>
  <CashflowDomiKertas v-else-if="kartu?.jenis === 'struk'">
    <button
      v-if="fotoStruk" type="button" class="domi-jepit" :aria-label="tcf('domi.bukaFoto')"
      :disabled="foto.get(fotoStruk)?.keadaan !== 'siap'" @click="emit('foto', [fotoStruk!], fotoStruk!)"
    >
      <span class="domi-jepit-dalam">
        <img v-if="foto.get(fotoStruk)?.src" :src="foto.get(fotoStruk)!.src!" alt="" class="h-full w-full object-cover" draggable="false">
        <Icon v-else :name="foto.get(fotoStruk)?.keadaan === 'memuat' || !foto.get(fotoStruk) ? 'lucide:loader-2' : 'lucide:image-off'" class="h-4 w-4 text-[var(--d-txt3)]" :class="{ 'animate-spin': foto.get(fotoStruk)?.keadaan === 'memuat' || !foto.get(fotoStruk) }" aria-hidden="true" />
      </span>
    </button>
    <div :class="fotoStruk ? 'pr-[62px]' : ''">
      <p class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--d-label)]">{{ tcf('domi.draf.strukCap') }}</p>
      <p class="mt-0.5 text-[17px] font-extrabold text-[var(--d-txt)]">{{ kartu.toko }}</p>
      <p class="mt-px text-[12.5px] font-semibold text-[var(--d-txt2)]">{{ kartu.rincian }}</p>
    </div>
    <div class="flex flex-col gap-[5px]">
      <div v-for="(b, i) in kartu.barang" :key="`${b.nama}-${i}`">
        <CashflowDomiBarisTitik :kiri="b.nama" :kanan="b.nilai" />
        <p v-if="b.bawah" class="text-[11.5px] font-semibold" :style="{ color: b.bawahHijau ? 'var(--d-mint)' : 'var(--d-txt3)' }">{{ b.bawah }}</p>
      </div>
      <CashflowDomiBarisTitik v-for="b in kartu.ringkasan" :key="b.label" :kiri="b.label" :kanan="b.nilai" :warna="b.hijau ? 'mint' : undefined" />
    </div>
    <div class="flex items-center justify-between gap-2.5 border-t-[1.5px] border-dashed border-[color:var(--d-garis)] pt-[7px]">
      <span class="text-[13.5px] font-extrabold uppercase tracking-[0.06em] text-[var(--d-txt)]">{{ tcf('domi.draf.strukTotal') }}</span>
      <span class="text-[21px] font-extrabold tabular-nums text-[var(--d-txt)]">{{ kartu.total }}</span>
    </div>
    <p v-if="kartu.kategori" class="text-[12px] font-semibold text-[var(--d-txt2)]">{{ tcf('domi.draf.kategori') }}: {{ kartu.kategori }}</p>
    <p v-if="kartu.catatan" class="text-[12px] font-semibold text-[var(--d-txt2)]">{{ tcf('domi.draf.catatan') }}: {{ kartu.catatan }}</p>
  </CashflowDomiKertas>

  <!-- Draf rencana: kertas, target besar, pos bertitik. -->
  <CashflowDomiKertas v-else-if="kartu?.jenis === 'rencana'">
    <div>
      <p class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--d-label)]">{{ tcf('domi.draf.rencana') }}</p>
      <p class="mt-0.5 text-[17px] font-extrabold text-[var(--d-txt)]">{{ kartu.nama }}</p>
      <p class="mt-1 text-[36px] font-extrabold leading-[44px] tabular-nums text-[var(--d-txt)]">{{ kartu.target }}</p>
      <p v-if="kartu.tenggat" class="mt-0.5 text-[12.5px] font-semibold text-[var(--d-txt2)]">{{ tcf('domi.draf.tenggat') }}: {{ kartu.tenggat }}</p>
    </div>
    <div v-if="kartu.pos.length" class="flex flex-col gap-[7px] border-t-[1.5px] border-dashed border-[color:var(--d-garis)] pt-2.5">
      <CashflowDomiBarisTitik v-for="(p, i) in kartu.pos" :key="`${p.nama}-${i}`" :kiri="p.nama" :kanan="p.nilai" />
    </div>
  </CashflowDomiKertas>

  <!-- Kartu gelembung: draf lain. -->
  <div v-else-if="kartu?.jenis === 'kartu'" class="domi-kartu">
    <div class="flex items-center gap-2">
      <span class="domi-ikon" :style="{ color: WARNA[kartu.warna] }"><span class="domi-ikon-latar" :style="{ background: WARNA[kartu.warna] }" /><Icon :name="kartu.ikon" class="relative h-4 w-4" aria-hidden="true" /></span>
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-bold text-[var(--d-txt3)]">{{ kartu.judul }}</p>
        <p class="line-clamp-2 text-[13px] font-bold text-[var(--d-txt)]">{{ kartu.sub }}</p>
      </div>
      <span v-if="kartu.tanggal" class="shrink-0 text-[12px] font-semibold text-[var(--d-txt3)]">{{ formatTanggal(kartu.tanggal) }}</span>
    </div>
    <p v-if="kartu.nominal" class="mt-2.5 text-[26px] font-extrabold tabular-nums" :style="{ color: kartu.nominalWarna === 'mint' ? 'var(--d-mint)' : 'var(--d-txt)' }">{{ kartu.nominal }}</p>
    <div v-if="kartu.baris.length" class="mt-2">
      <div v-for="b in kartu.baris" :key="b.label" class="flex gap-2.5 border-t border-[color:var(--d-line2)] py-[7px]">
        <span class="w-[104px] shrink-0 text-[11px] font-bold text-[var(--d-txt3)]">{{ b.label }}</span>
        <div class="min-w-0 flex-1">
          <p v-if="b.lama != null" class="text-[12px] font-semibold text-[var(--d-txt3)] line-through">{{ b.lama }}</p>
          <p class="text-[13px] font-bold text-[var(--d-txt)]">{{ b.nilai }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="domi-asing">
    <Icon name="lucide:box" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>{{ tcf('domi.asing')(labelAsing) }}</span>
  </div>
</template>

<style scoped>
.domi-baris-trx {
  align-self: stretch; display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 2px 8px 2px 14px;
  background: var(--d-gelembung); border-radius: 12px; box-shadow: 0 1px 2px var(--d-bayang);
}
.domi-jepit {
  position: absolute; top: -8px; right: 16px; width: 50px; height: 64px; border-radius: 3px; background: #fff;
  transform: rotate(5deg); box-shadow: 0 2px 6px var(--d-bayang); display: flex; align-items: center; justify-content: center;
}
.domi-jepit:not(:disabled) { cursor: zoom-in; }
.domi-jepit-dalam { width: 40px; height: 54px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--d-line2); }
.domi-buka { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: var(--d-txt); flex-shrink: 0; }
.domi-kartu { align-self: stretch; background: var(--d-gelembung); border-radius: 20px; padding: 14px; box-shadow: 0 1px 2px var(--d-bayang); }
.domi-ikon { position: relative; width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.domi-ikon-latar { position: absolute; inset: 0; opacity: 0.13; }
.domi-asing {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px;
  font-size: 12px; font-weight: 600; color: var(--d-txt2); background: var(--d-gelembung); border: 1px dashed var(--d-line);
}
</style>
