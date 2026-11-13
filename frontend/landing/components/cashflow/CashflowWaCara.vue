<script setup lang="ts">
/**
 * Cara verifikasi WhatsApp di Kesehatan: mode dari Sakelar, cara mana yang
 * jalan, apa yang sedang menghalangi tiap cara, dan penerus pesan masuk di Sapa.
 *
 * Hanya tampilan: data datang dari CashflowStatusWa (satu panggilan
 * admin_wa_status). Setiap bagian disembunyikan bila server tidak mengirim
 * kuncinya. Kalimat sebab dirakit induknya (teksSebab), supaya kalimat yang
 * sama dipakai di daftar sebab dan di sini.
 */
import type { CaraVerifikasiWa, KeadaanCaraWa, KodeGangguanWa, LamaWa } from '~/adapters/cashflowWa'

defineProps<{ cara: CaraVerifikasiWa; teksSebab: (k: KodeGangguanWa) => string }>()
const { tcf, formatWaktu } = useCashflowI18n()

const PIL: Record<KeadaanCaraWa, string> = { sehat: 'ca-pill-emerald', sakit: 'ca-pill-danger', diluarMode: 'ca-pill-muted' }
const IKON_CARA = { terbalik: 'lucide:message-square-reply', kirim: 'lucide:send' } as const
const waktu = (v: string | null) => (v ? tcf('kesehatan.wa.terbalik.waktu')(formatWaktu(v)) : tcf('kesehatan.wa.belumAda'))
const lama = (l: LamaWa | null) => (l ? tcf('kesehatan.wa.terbalik.lama')(l.n, l.satuan) : tcf('kesehatan.wa.belumAda'))
</script>

<template>
  <section class="ca-console-dialog p-5">
    <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.wa.terbalik.judul') }}</h2>
    <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.ket') }}</p>

    <dl v-if="cara.mode" class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div class="min-w-0">
        <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.labelMode') }}</dt>
        <dd class="font-semibold text-[var(--ca-text)]">{{ tcf(`kesehatan.wa.terbalik.mode.${cara.mode.mode}`) }}</dd>
        <dd class="text-xs text-[var(--ca-muted)]">{{ tcf(`kesehatan.wa.terbalik.modeKet.${cara.mode.mode}`) }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.labelUji') }}</dt>
        <dd class="font-semibold text-[var(--ca-text)]">{{ cara.mode.ujiMode ? tcf(`kesehatan.wa.terbalik.mode.${cara.mode.ujiMode}`) : tcf('kesehatan.wa.terbalik.ikutUmum') }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.labelTujuan') }}</dt>
        <dd class="font-semibold tabular-nums" :class="cara.mode.tujuanTersamar ? 'text-[var(--ca-text)]' : 'text-[var(--ca-subtle)]'">{{ cara.mode.tujuanTersamar ?? tcf('kesehatan.wa.terbalik.belumDiisi') }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.labelBalas') }}</dt>
        <dd class="font-semibold text-[var(--ca-text)]">{{ cara.mode.balas ? tcf('kesehatan.wa.terbalik.nyala') : tcf('kesehatan.wa.terbalik.mati') }}</dd>
      </div>
    </dl>

    <ul v-if="cara.cara" class="mt-4 grid gap-3 sm:grid-cols-2">
      <li v-for="c in cara.cara" :key="c.cara" class="flex min-w-0 items-start gap-3 rounded-xl border border-[color:var(--ca-border)] p-3">
        <Icon :name="IKON_CARA[c.cara]" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--ca-muted)]" aria-hidden="true" />
        <div class="min-w-0 grow">
          <p class="font-semibold text-[var(--ca-text)]">{{ tcf(`kesehatan.wa.terbalik.cara.${c.cara}`) }}</p>
          <p class="text-xs text-[var(--ca-muted)]">{{ tcf(`kesehatan.wa.terbalik.caraKet.${c.cara}`) }}</p>
        </div>
        <span class="shrink-0 whitespace-nowrap text-xs" :class="PIL[c.keadaan]">{{ tcf(`kesehatan.wa.terbalik.keadaan.${c.keadaan}`) }}</span>
      </li>
    </ul>

    <template v-if="cara.lapis">
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.lapisJudul') }}</h3>
      <div class="mt-2 grid gap-3 lg:grid-cols-3">
        <div v-for="g in cara.lapis" :key="g.kelompok" class="min-w-0 rounded-xl bg-[var(--ca-panel-bg-strong)] p-3">
          <p class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf(`kesehatan.wa.terbalik.kelompok.${g.kelompok}`) }}</p>
          <p v-if="!g.kode.length" class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.lapisKosong') }}</p>
          <ul v-else class="mt-1 space-y-1 text-sm" :class="g.berpengaruh ? 'text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'">
            <li v-for="k in g.kode" :key="k" class="flex items-start gap-2">
              <Icon :name="g.berpengaruh ? 'lucide:circle-alert' : 'lucide:circle-minus'" class="mt-0.5 h-3.5 w-3.5 shrink-0" :class="g.berpengaruh ? 'ca-tone-danger' : 'text-[var(--ca-subtle)]'" aria-hidden="true" />
              <span>{{ teksSebab(k) }}</span>
            </li>
          </ul>
          <p v-if="g.kode.length && !g.berpengaruh" class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.lapisTakBerpengaruh') }}</p>
        </div>
      </div>
    </template>

    <template v-if="cara.sapa">
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.sapaJudul') }}</h3>
      <p v-if="!cara.sapa.ada" class="mt-2 text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.sapaBelum') }}</p>
      <dl v-else class="mt-2 grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
        <div class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.sapaKeadaan') }}</dt>
          <dd class="font-semibold" :class="cara.sapa.aktif === false ? 'ca-tone-danger' : 'text-[var(--ca-text)]'">
            {{ cara.sapa.aktif === null ? tcf('kesehatan.wa.terbalik.sapaTakTahu') : cara.sapa.aktif ? tcf('kesehatan.wa.terbalik.sapaAktif') : tcf('kesehatan.wa.terbalik.sapaMati') }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.sapaTertahan') }}</dt>
          <dd class="font-semibold tabular-nums" :class="cara.sapa.tertahan ? 'ca-tone-gold' : 'text-[var(--ca-text)]'">{{ tcf('kesehatan.wa.terbalik.pesan')(cara.sapa.tertahan) }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.sapaTertua') }}</dt>
          <dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ cara.sapa.tertahan ? lama(cara.sapa.tertua) : tcf('kesehatan.wa.belumAda') }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.sapaTerakhir') }}</dt>
          <dd class="font-semibold text-[var(--ca-text)]">{{ waktu(cara.sapa.terakhirOk) }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.sapaDicek') }}</dt>
          <dd class="font-semibold text-[var(--ca-text)]">{{ waktu(cara.sapa.dicekPada) }}</dd>
        </div>
      </dl>
    </template>
  </section>
</template>
