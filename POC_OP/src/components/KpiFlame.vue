<template>
  <div class="kpi-stat-icon-wrap kpi-flame">
    <span class="kpi-flame__glow" aria-hidden="true" />
    <svg class="kpi-flame__svg" viewBox="0 0 32 36" aria-hidden="true">
      <defs>
        <linearGradient :id="ids.outer" x1="16" y1="36" x2="16" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#9a3412" />
          <stop offset="28%" stop-color="#c2410c" />
          <stop offset="58%" stop-color="#ea580c" />
          <stop offset="82%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#fef08a" />
        </linearGradient>
        <linearGradient :id="ids.mid" x1="16" y1="34" x2="14" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f97316" />
          <stop offset="55%" stop-color="#facc15" />
          <stop offset="100%" stop-color="#fff7ed" />
        </linearGradient>
        <radialGradient :id="ids.hot" cx="50%" cy="72%" r="50%">
          <stop offset="0%" stop-color="#fffbeb" />
          <stop offset="55%" stop-color="#fde68a" />
          <stop offset="100%" stop-color="#fb923c" stop-opacity="0" />
        </radialGradient>
        <filter :id="ids.wobble" x="-35%" y="-25%" width="170%" height="170%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.14" numOctaves="2" seed="3" result="n">
            <animate
              attributeName="baseFrequency"
              dur="0.36s"
              values="0.04 0.11;0.07 0.2;0.035 0.16;0.06 0.12;0.04 0.11"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g :filter="`url(#${ids.wobble})`">
        <path :fill="`url(#${ids.outer})`" d="M16.2 35c-6.1 0-10.4-4.6-10.4-10.8C5.8 16.4 10.6 10.8 14 3.2c.4 4.6 1.2 7.4 3.6 10.2 1.6-3.4 2.2-6.6 1.6-11.4 5.4 6.8 8.8 12.4 8.8 20.2C28 30.4 23 35 16.2 35z" />
        <path :fill="`url(#${ids.mid})`" d="M15.6 32.6c-3.7 0-6.2-2.8-6.2-6.8 0-4.6 3.2-8.4 6.4-14.2 1.1 3.8 2.4 6.2 4.6 8.4-.2-2.8.2-5.6-.6-8.8 3.2 4.6 5 8.2 5 13.4 0 4.4-3.2 8-9.2 8z" />
        <ellipse cx="15.4" cy="26.8" rx="3.1" ry="5.2" :fill="`url(#${ids.hot})`" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const raw = `k${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  outer: `fl-o-${raw}`,
  mid: `fl-m-${raw}`,
  hot: `fl-h-${raw}`,
  wobble: `fl-w-${raw}`,
};
</script>
