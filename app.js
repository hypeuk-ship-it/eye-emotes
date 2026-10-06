import { spring, step, setTarget } from './springs.js';
import { loadCatalog, emoteUrl } from './emotes.js';

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const CACHE = '10070122';
const params = new URLSearchParams(location.search);
let catalog = null;
let sheetId = params.get('sheet') || 'polly';
let emoteId = params.get('emote') || null;

const gazeX = spring(0, 0, 0.14, 0.78);
const gazeY = spring(0, 0, 0.14, 0.78);
const blinkS = spring(0, 0, 0.35, 0.55);

let blinkPhase = 0;
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
const frame = $('#preview-frame');

function syncUrl() {
  const u = new URL(location.href);
  u.searchParams.set('sheet', sheetId);
  u.searchParams.set('emote', emoteId);
  history.replaceState(null, '', u);
}

function sheet() { return catalog[sheetId]; }
function emote() {
  return sheet().emotes.find(e => e.id === emoteId) || sheet().emotes[0];
}

function applyAnim(img) {
  if (!img) return;
  const b = blinkS.x;
  // Fast close / slower open already in spring k; squash toward bottom center
  const sy = Math.max(0.08, 1 - b * 0.92);
  const ty = b * 18;
  const gx = gazeX.x;
  const gy = gazeY.x;
  img.style.transform = `translate(${gx}px, ${gy + ty}px) scaleY(${sy})`;
  img.style.transformOrigin = '50% 65%';
}

function paint() {
  const em = emote();
  nameEl.textContent = em.name;
  sheetEl.textContent = sheet().credit;
  creditEl.textContent = sheet().credit;
  let img = previewHost.querySelector('img');
  const want = emoteUrl(em.file, CACHE);
  if (!img) {
    img = document.createElement('img');
    img.alt = em.name;
    img.draggable = false;
    previewHost.replaceChildren(img);
  }
  if (img.dataset.file !== em.file) {
    img.src = want;
    img.dataset.file = em.file;
  }
  applyAnim(img);
}

function paintThumbs() {
  gridHost.replaceChildren();
  const s = sheet();
  $('#grid-title').textContent = `${s.label} · ${s.emotes.length} emotes`;
  for (const em of s.emotes) {
    const btn = document.createElement('button');
    btn.className = 'emote';
    btn.type = 'button';
    btn.setAttribute('aria-selected', em.id === emoteId ? 'true' : 'false');
    const img = document.createElement('img');
    img.src = emoteUrl(em.file, CACHE);
    img.alt = em.name;
    img.draggable = false;
    btn.appendChild(img);
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
  if (!sheet().emotes.find(e => e.id === emoteId)) {
    emoteId = sheet().emotes[0].id;
  }
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.sheet === sheetId ? 'true' : 'false'));
  frame.dataset.sheet = sheetId;
  syncUrl();
  paintThumbs();
  paint();
}

frame.addEventListener('pointermove', (e) => {
  const r = frame.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
  setTarget(gazeX, Math.max(-16, Math.min(16, nx * 16)));
  setTarget(gazeY, Math.max(-12, Math.min(12, ny * 12)));
  lookUntil = performance.now() + 900;
});
frame.addEventListener('pointerleave', () => { lookUntil = performance.now() + 400; });
frame.addEventListener('click', () => {
  blinkPhase = 1;
  setTarget(blinkS, 1);
  nextBlinkAt = performance.now() + 2200 + Math.random()*3500;
});

function maybeWander(now) {
  if (now < lookUntil) return;
  if (Math.random() < 0.008) {
    setTarget(gazeX, (Math.random()*2-1)*10);
    setTarget(gazeY, (Math.random()*2-1)*6);
    lookUntil = now + 600 + Math.random()*1200;
  } else if (Math.random() < 0.004) {
    setTarget(gazeX, 0); setTarget(gazeY, 0);
  }
}

function tick(now) {
  let dt = now - last; last = now;
  if (dt > 50) dt = 50;
  acc += dt;
  while (acc >= FIXED_DT) {
    if (blinkPhase === 0 && now >= nextBlinkAt) {
      blinkPhase = 1; setTarget(blinkS, 1);
      nextBlinkAt = now + 2200 + Math.random()*3500;
    }
    if (blinkPhase === 1 && blinkS.x > 0.92) { blinkPhase = 2; setTarget(blinkS, 0); }
    if (blinkPhase === 2 && blinkS.x < 0.05) blinkPhase = 0;
    blinkS.k = blinkPhase === 1 ? 0.55 : 0.22;
    blinkS.d = blinkPhase === 1 ? 0.5 : 0.62;
    maybeWander(now);
    step(gazeX); step(gazeY); step(blinkS);
    acc -= FIXED_DT;
  }
  applyAnim(previewHost.querySelector('img'));
  requestAnimationFrame(tick);
}

async function main() {
  catalog = await loadCatalog();
  if (!catalog[sheetId]) sheetId = 'polly';
  if (!emoteId || !catalog[sheetId].emotes.find(e => e.id === emoteId)) {
    emoteId = catalog[sheetId].emotes[0].id;
  }
  for (const s of Object.values(catalog)) {
    const b = document.createElement('button');
    b.className = 'tab';
    b.type = 'button';
    b.dataset.sheet = s.id;
    b.textContent = s.label;
    b.setAttribute('aria-selected', s.id === sheetId ? 'true' : 'false');
    b.addEventListener('click', () => selectSheet(s.id));
    $('#tabs').appendChild(b);
  }
  selectSheet(sheetId);
  requestAnimationFrame(t => { last = t; requestAnimationFrame(tick); });
}

main();
