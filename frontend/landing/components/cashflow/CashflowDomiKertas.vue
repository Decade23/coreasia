<script setup lang="ts">
/** Kertas struk bertepi gerigi: wadah jawaban soal uang dan draf struk. */
withDefaults(defineProps<{ baris?: boolean }>(), { baris: false })
</script>

<template>
  <div class="domi-kertas-luar">
    <div class="domi-kertas" :class="{ 'domi-kertas-baris': baris }"><slot /></div>
    <div class="domi-gerigi" aria-hidden="true" />
  </div>
</template>

<style scoped>
.domi-kertas-luar { align-self: stretch; filter: drop-shadow(0 1px 3px var(--d-bayang)); }
.domi-kertas {
  background: var(--d-kertas); padding: 15px 16px 12px; border-radius: 12px 12px 0 0; position: relative;
  display: flex; flex-direction: column; gap: 10px;
}
.domi-kertas-baris { flex-direction: row; align-items: center; padding: 10px 12px; }
.domi-gerigi {
  height: 6px;
  background-image: linear-gradient(135deg, var(--d-kertas) 25%, transparent 25%), linear-gradient(225deg, var(--d-kertas) 25%, transparent 25%);
  background-size: 12px 12px; background-repeat: repeat-x;
}
</style>
