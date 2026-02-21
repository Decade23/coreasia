<template>
  <div class="relative min-h-screen overflow-hidden font-sans text-slate-100">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 ca-grid-bg opacity-[0.08]" />
      <div class="absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
      <div class="absolute bottom-[-8rem] right-[-5rem] h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-[120px]" />
    </div>

    <TheHeader />

    <main id="main-content" class="relative">
      <slot />
    </main>

    <TheFooter />
    
    <ClientOnly>
      <BackToTop />
    </ClientOnly>
  </div>
</template>
