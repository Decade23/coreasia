/* eslint-disable no-unused-vars -- fungsi bantu bersama, tidak semua dipakai di setiap adegan */
const clamp = n => Math.min(1, Math.max(0, n));
const ease = (t, a, b) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const f = v => Number(v.toFixed(4));
const wave = (t, period, amp, phase = 0) => amp * Math.sin((t / period + phase) * Math.PI * 2);
const loop = (s, d) => ((s % d) + d) % d;
const bump = (t, a, up = .2, hold = .5, down = .4) => ease(t, a, a + up) * (1 - ease(t, a + up + hold, a + up + hold + down));
const DURATION = 15;
const V = "mobile";
const P = {"chatFly": [-10, 10], "sheetFly": [0, 0], "enter": 120, "cursor": [300, 330, 219, 250]};
export function poseStyles(seconds) {
  const t = loop(seconds, DURATION);
  const s = {};
  const back = ease(t, 14.55, 14.95);
  // Keterangan adegan 1 sampai 4. Adegan 5 tanpa keterangan, kartu ajakan yang bicara.
  s['cap-0'] = { opacity: f(Math.min(1, 1 - ease(t, 2.6, 2.9) + back)) };
  s['cap-1'] = { opacity: f(ease(t, 2.95, 3.25) * (1 - ease(t, 5.7, 6.0))) };
  s['cap-2'] = { opacity: f(ease(t, 5.95, 6.25) * (1 - ease(t, 8.7, 9.0))) };
  s['cap-3'] = { opacity: f(ease(t, 8.95, 9.25) * (1 - ease(t, 11.7, 12.0))) };

  // 1. Masalah: chat menumpuk, notifikasi naik, wajah cemas, tangan gemetar.
  const fly = ease(t, 3.8, 4.6);
  for (let i = 0; i < 4; i++) {
    const e = ease(t, .3 + i * .45, .55 + i * .45);
    s[`chat-${i}`] = { opacity: f(e * (1 - ease(t, 4.1, 4.6))), transform: `translate(${f(P.chatFly[0] * fly)}px, ${f(P.chatFly[1] * fly + 10 * (1 - e))}px)` };
  }
  if (V === 'desktop') {
    const e = ease(t, 1.5, 1.9);
    s['sheet'] = { opacity: f(e * (1 - ease(t, 4.1, 4.6))), transform: `translate(${f(P.sheetFly[0] * fly)}px, ${f(P.sheetFly[1] * fly + 10 * (1 - e))}px)` };
  }
  s['badge-red'] = { opacity: f(ease(t, .3, .5) * (1 - ease(t, 9.4, 9.7))) };
  s['badge-12'] = { opacity: f(ease(t, .3, .5) * (1 - ease(t, 1.2, 1.35))) };
  s['badge-27'] = { opacity: f(ease(t, 1.2, 1.35) * (1 - ease(t, 2.0, 2.15))) };
  s['badge-48'] = { opacity: f(ease(t, 2.0, 2.15) * (1 - ease(t, 9.4, 9.7))) };
  s['badge-ok'] = { opacity: f(ease(t, 9.6, 9.9) * (1 - ease(t, 14.4, 14.7))) };
  const stress = ease(t, .6, .9) * (1 - ease(t, 2.6, 3.0));
  const waveEnv = ease(t, 9.7, 10.1) * (1 - ease(t, 14.2, 14.6));
  s['rina-arm'] = { transform: `rotate(${f(-26 * ease(t, .1, .5) * (1 - back) + 2.5 * Math.sin(t * Math.PI * 2 / .5) * stress + (-16 + 10 * Math.sin(t * Math.PI * 2 / .75)) * waveEnv)}deg)` };
  s['rina-head'] = { transform: `rotate(${f(wave(t, 5, 1.4) + 1.8 * Math.sin(t * Math.PI * 2 / .5) * stress - 3 * waveEnv)}deg)` };
  s['face-worry'] = { opacity: f(Math.min(1, 1 - ease(t, 4.8, 5.1) + back)) };
  s['face-calm'] = { opacity: f(ease(t, 4.8, 5.1) * (1 - ease(t, 9.4, 9.7))) };
  s['face-happy'] = { opacity: f(ease(t, 9.4, 9.7) * (1 - back)) };

  // 2. Bertemu: konsultan masuk, chat dan Excel tersusun jadi catatan kebutuhan.
  const enter = ease(t, 3.0, 3.7);
  s['consult-enter'] = { opacity: f(ease(t, 3.0, 3.4) * (1 - back)), transform: `translate(${f(P.enter * (1 - enter))}px, 0px)` };
  s['consult-bubble'] = { opacity: f(bump(t, 3.6, .3, 1.6, .3)), transform: `translateY(${f(6 * (1 - ease(t, 3.6, 3.9)))}px)` };
  s['consult-arm'] = { transform: `rotate(${f(-55 * ease(t, 3.9, 4.4) * (1 - ease(t, 11.4, 11.9)) - 42 * ease(t, 12.3, 12.7) * (1 - ease(t, 14.2, 14.6)) + wave(t, 3, 2.5))}deg)` };
  s['consult-head'] = { transform: `rotate(${f(wave(t, 7.5, 1.2) + 4 * bump(t, 10.2, .2, .3, .3))}deg)` };
  s['need-card'] = { opacity: f(ease(t, 4.2, 4.6) * (1 - ease(t, 6.0, 6.4))), transform: `translateY(${f(12 * (1 - ease(t, 4.2, 4.6)))}px)` };
  for (let i = 0; i < 3; i++) s[`need-check-${i}`] = { opacity: f(ease(t, 4.7 + i * .35, 4.95 + i * .35)) };

  // 3. Dibangun: laptop dan ponsel tersusun.
  const out = 1 - ease(t, 12.0, 12.4);
  s['build-laptop'] = { opacity: f(ease(t, 6.1, 6.6) * out), transform: `translateY(${f(14 * (1 - ease(t, 6.1, 6.6)))}px)` };
  s['build-row-0'] = { opacity: f(ease(t, 6.9, 7.2)) };
  s['build-row-1'] = { opacity: f(ease(t, 7.3, 7.6)) };
  s['build-phone'] = { opacity: f(ease(t, 7.6, 8.1) * out), transform: `translateY(${f(14 * (1 - ease(t, 7.6, 8.1)))}px)` };

  // 4. Beres: peserta mendaftar sendiri, baris baru Lunas, konfirmasi otomatis, notifikasi nol.
  s['tap'] = { opacity: f(bump(t, 9.3, .1, .15, .35)) };
  s['phone-done'] = { opacity: f(ease(t, 9.6, 9.9)) };
  const row = ease(t, 10.0, 10.4);
  s['row-new'] = { opacity: f(row), transform: `translate(${f(24 * (1 - row))}px, 0px)` };
  s['toast-sent'] = { opacity: f(bump(t, 10.4, .25, 1.15, .3)), transform: `translateY(${f(8 * (1 - ease(t, 10.4, 10.65)))}px)` };

  // 5. Ajakan: kartu besar dengan tombol yang sama dengan tombol hero, kursor mengetuknya.
  const cta = ease(t, 12.2, 12.6);
  s['cta-card'] = { opacity: f(cta * (1 - back)), transform: `translateY(${f(14 * (1 - cta))}px)` };
  const cur = ease(t, 12.6, 13.1);
  s['cta-cursor'] = { opacity: f(ease(t, 12.55, 12.75) * (1 - ease(t, 14.3, 14.6))), transform: `translate(${f(P.cursor[0] + (P.cursor[2] - P.cursor[0]) * cur)}px, ${f(P.cursor[1] + (P.cursor[3] - P.cursor[1]) * cur)}px)` };
  s['cta-press'] = { opacity: f(bump(t, 13.15, .08, .22, .2)) };
  s['cta-ripple'] = { opacity: f(bump(t, 13.15, .1, .2, .45)) };

  const periods = [5, 7.5, 15];
  for (let i = 0; i < 3; i++) s[`node-${i}`] = { opacity: f(.3 + .7 * (.5 + .5 * Math.sin((t / periods[i] + i / 3) * Math.PI * 2))) };
  return s;
}
