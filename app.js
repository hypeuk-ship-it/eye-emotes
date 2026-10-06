import { spring, step, setTarget } from './springs.js';
import { SHEETS, renderEmote, listSheets } from './emotes.js';

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const params = new URLSearchParams(location.search);
let sheetId = params.get('sheet') || 'polly';
let emoteId = params.get('emote') || SHEETS[sheetId]?.emotes[0]?.id || 'cheerful';
if (!SHEETS[sheetId]) sheetId = 'polly';

const gazeX = spring(0, 0, 0.14, 0.78);
const gazeY = spring(0, 0, 0.14, 0.78);
const blinkS = spring(0, 0, 0.35, 0.55);

let blinkPhase = 0; // 0 idle, 1 closing, 2 open
let nextBlinkAt = performance.now() + 1800 + Math.random()*2200;
let lookUntil = 0;
let last = performance.now();
const FIXED_DT = 1000/60;
let acc = 0;

const previewHost = $('#preview');
const gridHost = $('#grid');
const nameEl = $('#emote-name');
const sheetEl = $('#emote-sheet');
const creditEl = $('#credit');

function syncUrl() {
  const u = new URL(location.href);
  u.searchParams.set('sheet', sheetId);
  u.searchParams.set('emote', emoteId);
  history.replaceState(null, '', u);
}

function currentEmote() {
  return SHEETS[sheetId].emotes.find(e => e.id === emoteId) || SHEETS[sheetId].emotes[0];
}

function paint(opts={}) {
  const em = currentEmote();
  nameEl.textContent = em.name;
  sheetEl.textContent = SHEETS[sheetId].credit;
  creditEl.textContent = SHEETS[sheetId].credit;
  const svg = renderEmote(sheetId, em.id, {
    gazeX: gazeX.x,
    gazeY: gazeY.x,
    blink: blinkS.x,
    ...opts,
  });
  previewHost.replaceChildren(svg);
}

function paintThumbs() {
  gridHost.replaceChildren();
  const sheet = SHEETS[sheetId];
  $('#grid-title').textContent = `${sheet.label} · ${sheet.emotes.length} emotes`;
  for (const em of sheet.emotes) {
    const btn = document.createElement('button');
    btn.className = 'emote';
    btn.type = 'button';
    btn.setAttribute('aria-selected', em.id === emoteId ? 'true' : 'false');
    const svg = renderEmote(sheetId, em.id, { gazeX:0, gazeY:0, blink:0 });
    btn.appendChild(svg);
    const lab = document.createElement('span');
    lab.className = 'label';
    lab.textContent = em.name;
    btn.appendChild(lab);
    btn.addEventListener('click', () => {
      emoteId = em.id;
      syncUrl();
      $$('.emote', gridHost).forEach(b => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      paint();
    });
    gridHost.appendChild(btn);
  }
}

function selectSheet(id) {
  sheetId = id;
  if (!SHEETS[sheetId].emotes.find(e => e.id === emoteId)) {
    emoteId = SHEETS[sheetId].emotes[0].id;
  }
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.sheet === sheetId ? 'true' : 'false'));
  syncUrl();
  paintThumbs();
  paint();
}

// Tabs
for (const s of listSheets()) {
  const b = document.createElement('button');
  b.className = 'tab';
  b.type = 'button';
  b.dataset.sheet = s.id;
  b.textContent = s.label;
  b.setAttribute('aria-selected', s.id === sheetId ? 'true' : 'false');
  b.addEventListener('click', () => selectSheet(s.id));
  $('#tabs').appendChild(b);
}

// Pointer look
const frame = $('#preview-frame');
frame.addEventListener('pointermove', (e) => {
  const r = frame.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
  setTarget(gazeX, Math.max(-14, Math.min(14, nx * 14)));
  setTarget(gazeY, Math.max(-10, Math.min(10, ny * 10)));
  lookUntil = performance.now() + 900;
});
frame.addEventListener('pointerleave', () => {
  lookUntil = performance.now() + 400;
});

// Gentle auto look when idle
function maybeWander(now) {
  if (now < lookUntil) return;
  if (Math.random() < 0.008) {
    setTarget(gazeX, (Math.random()*2-1)*10);
    setTarget(gazeY, (Math.random()*2-1)*6);
    lookUntil = now + 600 + Math.random()*1200;
  } else if (Math.random() < 0.004) {
    setTarget(gazeX, 0);
    setTarget(gazeY, 0);
  }
}

function triggerBlink(now) {
  blinkPhase = 1;
  setTarget(blinkS, 1);
  nextBlinkAt = now + 2200 + Math.random()*3500;
}

frame.addEventListener('click', () => triggerBlink(performance.now()));

function tick(now) {
  let dt = now - last;
  last = now;
  if (dt > 50) dt = 50;
  acc += dt;
  while (acc >= FIXED_DT) {
    // blink state machine — fast close, slower open (Disney-ish), no sine
    if (blinkPhase === 0 && now >= nextBlinkAt) triggerBlink(now);
    if (blinkPhase === 1 && blinkS.x > 0.92) {
      blinkPhase = 2;
      setTarget(blinkS, 0);
    }
    if (blinkPhase === 2 && blinkS.x < 0.05) blinkPhase = 0;
    // faster k while closing
    blinkS.k = blinkPhase === 1 ? 0.55 : 0.22;
    blinkS.d = blinkPhase === 1 ? 0.5 : 0.62;

    maybeWander(now);
    step(gazeX); step(gazeY); step(blinkS);
    acc -= FIXED_DT;
  }
  paint();
  requestAnimationFrame(tick);
}

selectSheet(sheetId);
requestAnimationFrame(t => { last = t; requestAnimationFrame(tick); });
