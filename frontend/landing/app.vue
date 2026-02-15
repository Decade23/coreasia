<template>
  <div class="relative">
    <NuxtLoadingIndicator color="url(#coreasia-gradient)" :height="3" />

    <svg style="position: absolute; width: 0; height: 0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="coreasia-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffd670" />
          <stop offset="55%" stop-color="#ffbe3d" />
          <stop offset="100%" stop-color="#1bc49e" />
        </linearGradient>
      </defs>
    </svg>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.985);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.995);
}
</style>
