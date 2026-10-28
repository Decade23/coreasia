<template>
    <span class="brief-success-mark" aria-hidden="true">
        <svg viewBox="0 0 56 56" fill="none">
            <circle class="success-disc" cx="28" cy="28" r="28" fill="var(--ca-emerald-bg)" />
            <path class="success-tick" d="m17 28 7 7 15-15" stroke="var(--ca-emerald-text)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" />
        </svg>
    </span>
</template>

<style scoped>
.brief-success-mark { display: block; width: 4rem; height: 4rem; flex-shrink: 0; }
.brief-success-mark svg { width: 100%; height: 100%; overflow: visible; }
.success-disc { transform-origin: center; animation: success-disc 450ms cubic-bezier(.2,.8,.2,1) both; }
.success-tick { stroke-dasharray: 1; stroke-dashoffset: 0; animation: success-tick 380ms 180ms ease-out both; }
@keyframes success-disc { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
@keyframes success-tick { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .success-disc, .success-tick { animation: none; } }
</style>
