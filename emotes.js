// Three independent eye-emote sheets — each keeps its own style.
// SVG builders; animation params (gaze, blink, look) applied by app.js via data attrs / groups.

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs={}, kids=[]) {
  const n = document.createElementNS(NS, tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    n.setAttribute(k, String(v));
  }
  for (const c of kids) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
}

function svgRoot(vb='0 0 320 200') {
  return el('svg', { viewBox: vb, xmlns: NS, 'aria-hidden': 'true' });
}

/* ───────────── Polly Von Dominique style ─────────────
   Soft lavender sclera, thick black outline, thick coloured bean brows,
   motif pupils (crescent / star / heart / spiral / flower). */

function pollyBrows(g, color, L, R, y, tilt=0, arch=1) {
  // Thick capsule / bean brows (Polly)
  const bw=54, bh=13*arch;
  const mk = (cx, side) => el('ellipse', {
    cx, cy: y, rx: bw/2, ry: Math.max(7, bh*0.55),
    fill: color, stroke: '#1a1a1a', 'stroke-width': 3.4,
    transform: `rotate(${tilt * side} ${cx} ${y})`,
    class: 'brow'
  });
  g.appendChild(mk(L, -1));
  g.appendChild(mk(R, 1));
}

function pollyEyeShape(cx, cy, w, h, flatTop=0, slant=0) {
  // Rounded stadium/oval; flatTop 0..1 squashes top; slant tilts inner/outer
  const hw=w/2, hh=h/2;
  const topY = cy - hh + flatTop*hh*0.9;
  const botY = cy + hh;
  const li = cx - hw + slant*6;
  const ri = cx + hw + slant*6;
  // Use ellipse path approximated with rounded rect via path
  if (flatTop > 0.55) {
    // D-shape / flat top
    return `M ${li+8} ${topY}
      L ${ri-8} ${topY}
      Q ${ri} ${topY} ${ri} ${topY+10}
      Q ${ri} ${botY} ${cx} ${botY}
      Q ${li} ${botY} ${li} ${topY+10}
      Q ${li} ${topY} ${li+8} ${topY} Z`;
  }
  // Full oval with optional inward anger slant (top edges)
  const topIn = slant; // positive = angry (inner higher? actually angry = outer higher)
  return `M ${cx} ${topY}
    C ${cx+hw*0.55} ${topY - topIn*4}, ${ri} ${cy-hh*0.25}, ${ri} ${cy}
    C ${ri} ${cy+hh*0.55}, ${cx+hw*0.55} ${botY}, ${cx} ${botY}
    C ${cx-hw*0.55} ${botY}, ${li} ${cy+hh*0.55}, ${li} ${cy}
    C ${li} ${cy-hh*0.25}, ${cx-hw*0.55} ${topY - topIn*4}, ${cx} ${topY} Z`;
}

function motif(kind, cx, cy, color, size=14) {
  if (kind === 'crescent') {
    // C-shaped vertical mark
    return el('path', {
      d: `M ${cx+size*0.25} ${cy-size*0.7}
        A ${size*0.55} ${size*0.7} 0 1 0 ${cx+size*0.25} ${cy+size*0.7}
        A ${size*0.35} ${size*0.5} 0 1 1 ${cx+size*0.25} ${cy-size*0.7} Z`,
      fill: color
    });
  }
  if (kind === 'dot') {
    return el('circle', { cx, cy, r: size*0.35, fill: '#111' });
  }
  if (kind === 'star') {
    // 4-point sparkle (Polly starry)
    const pts=[];
    for (let i=0;i<8;i++){
      const a = -Math.PI/2 + i*Math.PI/4;
      const r = i%2===0 ? size*1.05 : size*0.28;
      pts.push(`${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`);
    }
    return el('polygon', { points: pts.join(' '), fill: color, stroke:'#e07030', 'stroke-width':1 });
  }
  if (kind === 'heart') {
    const s=size*0.9;
    return el('path', {
      d: `M ${cx} ${cy+s*0.55}
        C ${cx-s*1.1} ${cy-s*0.05}, ${cx-s*0.55} ${cy-s*0.85}, ${cx} ${cy-s*0.25}
        C ${cx+s*0.55} ${cy-s*0.85}, ${cx+s*1.1} ${cy-s*0.05}, ${cx} ${cy+s*0.55} Z`,
      fill: color
    });
  }
  if (kind === 'flower') {
    const g = el('g');
    for (let i=0;i<4;i++){
      const a = i*Math.PI/2 + Math.PI/4;
      g.appendChild(el('ellipse', {
        cx: cx+Math.cos(a)*size*0.45,
        cy: cy+Math.sin(a)*size*0.45,
        rx: size*0.38, ry: size*0.22,
        fill: color,
        transform: `rotate(${a*180/Math.PI+90} ${cx+Math.cos(a)*size*0.45} ${cy+Math.sin(a)*size*0.45})`
      }));
    }
    g.appendChild(el('circle', { cx, cy, r: size*0.18, fill: '#fff' }));
    return g;
  }
  if (kind === 'spiral') {
    // Approximate spiral with thick stroke path
    let d=`M ${cx} ${cy}`;
    for (let i=0;i<=40;i++){
      const t=i/40;
      const a=t*Math.PI*3.2;
      const r=size*0.15 + t*size*0.75;
      d += ` L ${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r}`;
    }
    return el('path', { d, fill:'none', stroke:'#111', 'stroke-width': size*0.28, 'stroke-linecap':'round' });
  }
  return el('circle', { cx, cy, r: size*0.4, fill: color });
}

function pollyMarks(g, kind, L, R, y) {
  if (kind === 'vein') {
    // Anger pop marks near outer corners
    const mk = (x, flip) => {
      const s = flip ? -1 : 1;
      g.appendChild(el('path', {
        d: `M ${x} ${y-10} L ${x+s*8} ${y-18} M ${x+s*2} ${y-6} L ${x+s*12} ${y-8} M ${x+s*1} ${y} L ${x+s*10} ${y+4}`,
        stroke: '#c00', 'stroke-width': 2.4, fill:'none', 'stroke-linecap':'round'
      }));
    };
    mk(L-48, 1); mk(R+48, -1);
  }
  if (kind === 'vein-heavy') {
    const mk = (x, flip) => {
      const s = flip ? -1 : 1;
      for (let i=0;i<4;i++){
        g.appendChild(el('path', {
          d: `M ${x+s*i*2} ${y-14+i*5} L ${x+s*(10+i*2)} ${y-18+i*4}`,
          stroke: '#8b0000', 'stroke-width': 2.2, fill:'none', 'stroke-linecap':'round'
        }));
      }
    };
    mk(L-50, 1); mk(R+50, -1);
    // pink under-eye marks
    g.appendChild(el('path', { d:`M ${L-20} ${y+28} Q ${L} ${y+34} ${L+20} ${y+28}`, stroke:'#e89', 'stroke-width':3, fill:'none', 'stroke-linecap':'round' }));
    g.appendChild(el('path', { d:`M ${R-20} ${y+28} Q ${R} ${y+34} ${R+20} ${y+28}`, stroke:'#e89', 'stroke-width':3, fill:'none', 'stroke-linecap':'round' }));
  }
  if (kind === 'tears') {
    const tear = (x) => el('path', {
      d: `M ${x} ${y+32} Q ${x-7} ${y+44} ${x} ${y+52} Q ${x+7} ${y+44} ${x} ${y+32} Z`,
      fill: '#cfefff', stroke:'#7ec8e8', 'stroke-width':1.5
    });
    g.appendChild(tear(L+36));
    g.appendChild(tear(R+36));
  }
  if (kind === 'blush') {
    const blush = (x) => el('g', {}, [
      el('line', { x1:x-14, y1:y+30, x2:x-6, y2:y+36, stroke:'#f06', 'stroke-width':3, 'stroke-linecap':'round', opacity:0.85 }),
      el('line', { x1:x-4, y1:y+28, x2:x+4, y2:y+36, stroke:'#f06', 'stroke-width':3, 'stroke-linecap':'round', opacity:0.85 }),
      el('line', { x1:x+6, y1:y+30, x2:x+14, y2:y+36, stroke:'#f06', 'stroke-width':3, 'stroke-linecap':'round', opacity:0.85 }),
    ]);
    g.appendChild(blush(L));
    g.appendChild(blush(R));
  }
  if (kind === 'blush-cloud') {
    g.appendChild(el('ellipse', { cx:160, cy:y+34, rx:70, ry:18, fill:'#c87878', opacity:0.85 }));
    g.appendChild(el('ellipse', { cx:160, cy:y+30, rx:58, ry:12, fill:'#e8a0b8', opacity:0.7 }));
  }
}

function drawPolly(emote, opts={}) {
  const {
    iris, brow, motif: mk='crescent', motifColor,
    flatTop=0, lid=0, narrow=0, slant=0, gazeX=0, gazeY=0, blink=0,
    marks=null, lookAside=0, browTilt=0, browArch=1, eyeW=78, eyeH=88
  } = { ...emote, ...opts };

  const root = svgRoot('0 0 320 200');
  const L = 100, R = 220, cy = 108;
  const h = eyeH * (1 - narrow*0.55) * (1 - blink*0.92);
  const w = eyeW * (1 - blink*0.08);
  const topFlat = Math.max(flatTop, lid, blink*0.85);

  const eyes = el('g', { class: 'eyes' });
  const sclera = '#c9b4d8';
  const stroke = '#141414';

  for (const [cx, side] of [[L, -1],[R, 1]]) {
    const gx = gazeX * side * (lookAside ? 1.4 : 1) + (lookAside * side * -10);
    const gy = gazeY;
    const eg = el('g', { class: 'eye', 'data-side': side });
    // clip
    const clipId = `pc${emote.id}-${side}`;
    const defs = el('defs', {}, [
      el('clipPath', { id: clipId }, [
        el('path', { d: pollyEyeShape(cx, cy, w, h, topFlat, slant*side) })
      ])
    ]);
    eg.appendChild(defs);
    const baseFill = emote.fullFill ? iris : sclera;
    eg.appendChild(el('path', {
      d: pollyEyeShape(cx, cy, w, h, topFlat, slant*side),
      fill: baseFill, stroke, 'stroke-width': 5.5, 'stroke-linejoin': 'round'
    }));
    const irisG = el('g', { 'clip-path': `url(#${clipId})` });
    // soft iris wash
    irisG.appendChild(el('ellipse', {
      cx: cx+gx, cy: cy+gy+2, rx: w*0.48, ry: h*0.52,
      fill: iris, opacity: 0.95
    }));
    // subtle bottom lighten
    irisG.appendChild(el('ellipse', {
      cx: cx+gx, cy: cy+gy+h*0.18, rx: w*0.28, ry: h*0.2,
      fill: '#fff', opacity: 0.18
    }));
    irisG.appendChild(motif(mk, cx+gx, cy+gy, motifColor || iris, 15));
    eg.appendChild(irisG);
    // upper lid overlay when half-lidded
    if (lid > 0.2 || blink > 0.15) {
      const lidH = h * Math.max(lid, blink) * 0.55;
      eg.appendChild(el('path', {
        d: pollyEyeShape(cx, cy - h*0.35, w*0.98, lidH*2, 0.8, slant*side),
        fill: sclera, stroke, 'stroke-width': 0, opacity: 0.0
      }));
    }
    eyes.appendChild(eg);
  }
  root.appendChild(eyes);
  pollyBrows(root, brow, L, R, cy - h*0.5 - 28 + blink*10, browTilt, browArch);
  if (marks) pollyMarks(root, marks, L, R, cy);
  return root;
}

const POLLY = [
  { id:'cheerful', name:'Cheerful', iris:'#9a7db0', brow:'#c4a8d4', motif:'crescent', motifColor:'#6a4e80', browArch:1.15 },
  { id:'confident', name:'Confident', iris:'#f0d048', brow:'#f0d048', motif:'dot', flatTop:0.25, browTilt:12, eyeH:78, fullFill:1 },
  { id:'bored', name:'Bored', iris:'#4a98ff', brow:'#4a98ff', motif:'dot', flatTop:0.85, lid:0.35, gazeY:6, browArch:0.35, eyeH:70, fullFill:1 },
  { id:'angry', name:'Angry', iris:'#d00000', brow:'#d00000', motif:'dot', narrow:0.35, slant:0.8, browTilt:22, marks:'vein', eyeH:62, fullFill:1 },
  { id:'sleepy', name:'Sleepy', iris:'#b030f0', brow:'#b030f0', motif:'dot', lid:0.55, flatTop:0.4, gazeY:8, browArch:0.7, eyeH:72, fullFill:1 },
  { id:'smug', name:'Smug', iris:'#10b000', brow:'#10b000', motif:'dot', lid:0.5, lookAside:1, gazeX:8, browTilt:-6, eyeH:68, fullFill:1 },
  { id:'furious', name:'Furious', iris:'#6a0000', brow:'#6a0000', motif:'dot', narrow:0.55, slant:1.1, browTilt:28, marks:'vein-heavy', eyeH:52, fullFill:1 },
  { id:'starry', name:'Starry', iris:'#c9b4d8', brow:'#ff9848', motif:'star', motifColor:'#ff9848', browArch:1.1 },
  { id:'pleading', name:'Pleading', iris:'#50f0f0', brow:'#50f0f0', motif:'flower', motifColor:'#e8ffff', slant:-0.35, browTilt:-10, marks:'tears', browArch:0.9, fullFill:1 },
  { id:'love', name:'Love-struck', iris:'#f868c0', brow:'#f868c0', motif:'heart', motifColor:'#ff4aa8', lid:0.4, marks:'blush', eyeH:70, fullFill:1 },
  { id:'dizzy', name:'Dizzy', iris:'#c9b4d8', brow:'#222', motif:'spiral', browArch:1.05, browTilt:4 },
  { id:'blush', name:'Blushing', iris:'#c9b4d8', brow:'#f8a0c8', motif:'dot', lid:0.15, gazeY:10, gazeX:-4, marks:'blush-cloud', eyeH:80 },
];

/* ───────────── El_azushu style ─────────────
   Clean singles mirrored to pairs. Soft upper-lid shadow on pale sclera,
   flat iris + dark rim + white highlight. No brows. */

function elEyePath(cx, cy, w, h, style) {
  const hw=w/2, hh=h/2;
  if (style === 'round') {
    return { tag:'ellipse', attrs:{ cx, cy, rx:hw, ry:hh } };
  }
  if (style === 'flatTop') {
    return { tag:'path', attrs:{ d:
      `M ${cx-hw} ${cy-hh+6}
       L ${cx+hw} ${cy-hh+6}
       Q ${cx+hw} ${cy-hh} ${cx+hw} ${cy-hh+14}
       A ${hw} ${hh} 0 0 1 ${cx-hw} ${cy-hh+14}
       Q ${cx-hw} ${cy-hh} ${cx-hw} ${cy-hh+6} Z` }};
  }
  if (style === 'heavyLid') {
    // almond-ish with thick top
    return { tag:'path', attrs:{ d:
      `M ${cx-hw} ${cy-hh*0.2}
       Q ${cx-hw*0.3} ${cy-hh} ${cx+hw*0.15} ${cy-hh*0.85}
       Q ${cx+hw} ${cy-hh*0.5} ${cx+hw} ${cy}
       Q ${cx+hw*0.7} ${cy+hh} ${cx} ${cy+hh}
       Q ${cx-hw*0.7} ${cy+hh} ${cx-hw} ${cy}
       Z` }};
  }
  if (style === 'slit') {
    return { tag:'path', attrs:{ d:
      `M ${cx-hw} ${cy}
       Q ${cx-hw*0.4} ${cy-hh} ${cx} ${cy-hh}
       Q ${cx+hw*0.4} ${cy-hh} ${cx+hw} ${cy}
       Q ${cx+hw*0.4} ${cy+hh} ${cx} ${cy+hh}
       Q ${cx-hw*0.4} ${cy+hh} ${cx-hw} ${cy} Z` }};
  }
  return { tag:'ellipse', attrs:{ cx, cy, rx:hw, ry:hh } };
}

function drawEl(emote, opts={}) {
  const {
    iris, irisDark, shape='round', w=72, h=72, lidShade=0.35,
    lashes=0, underLines=0, gazeX=0, gazeY=0, blink=0,
    outlineHeavy=0, bag=0, look=0
  } = { ...emote, ...opts };

  const root = svgRoot('0 0 320 200');
  const L=100, R=220, cy=100;
  const bh = Math.max(6, h * (1 - blink*0.9));
  const bw = w * (1 - blink*0.05);
  const sclera = '#dce4ea';
  const shade = '#b8c4ce';

  for (const [cx, side] of [[L,-1],[R,1]]) {
    const gx = (gazeX + look*10) * (side === -1 ? 1 : shape==='heavyLid' ? 1 : 1);
    // Mirror look direction for pairs from single refs: both look same world dir
    const gxx = gazeX + look * (emote.mirrorLook ? side : 1) * 8;
    const gy = gazeY + blink*2;
    const eg = el('g', { class:'eye' });
    const clipId = `ec${emote.id}${side}`;
    const shapeDesc = elEyePath(cx, cy, bw, bh, blink>0.7 ? 'slit' : shape);
    const outlineW = 4.2 + outlineHeavy*2.5;

    const defs = el('defs');
    const cp = el('clipPath', { id: clipId });
    cp.appendChild(el(shapeDesc.tag, shapeDesc.attrs));
    defs.appendChild(cp);
    eg.appendChild(defs);

    // sclera
    const scl = el(shapeDesc.tag, { ...shapeDesc.attrs, fill:sclera, stroke:'#1a1a1a', 'stroke-width': outlineW });
    eg.appendChild(scl);

    const clipped = el('g', { 'clip-path': `url(#${clipId})` });
    // upper lid shade
    clipped.appendChild(el('ellipse', {
      cx, cy: cy - bh*0.45, rx: bw*0.55, ry: bh*lidShade,
      fill: shade, opacity: 0.85
    }));
    // iris
    const ir = Math.min(bw, bh) * 0.58;
    clipped.appendChild(el('circle', { cx: cx+gxx, cy: cy+gy, r: ir, fill: iris }));
    clipped.appendChild(el('circle', { cx: cx+gxx, cy: cy+gy, r: ir*0.92, fill:'none', stroke: irisDark || iris, 'stroke-width': ir*0.18 }));
    // pupil
    clipped.appendChild(el('circle', { cx: cx+gxx, cy: cy+gy, r: ir*0.42, fill:'#111' }));
    // highlight
    clipped.appendChild(el('circle', { cx: cx+gxx - ir*0.28, cy: cy+gy - ir*0.28, r: ir*0.16, fill:'#fff' }));
    if (emote.doubleHighlight) {
      clipped.appendChild(el('circle', { cx: cx+gxx + ir*0.22, cy: cy+gy - ir*0.1, r: ir*0.08, fill:'#fff' }));
    }
    // bottom iris light crescent
    clipped.appendChild(el('path', {
      d: `M ${cx+gxx-ir*0.55} ${cy+gy+ir*0.15}
          A ${ir*0.7} ${ir*0.45} 0 0 0 ${cx+gxx+ir*0.55} ${cy+gy+ir*0.15}
          A ${ir*0.55} ${ir*0.3} 0 0 1 ${cx+gxx-ir*0.55} ${cy+gy+ir*0.15} Z`,
      fill: '#fff', opacity: 0.22
    }));
    eg.appendChild(clipped);

    // heavy gray lid cap
    if (emote.lidCap) {
      const lidH = bh * emote.lidCap;
      eg.appendChild(el('path', {
        d: `M ${cx-bw/2} ${cy-bh/2+2} L ${cx+bw/2} ${cy-bh/2+2}
            L ${cx+bw/2} ${cy-bh/2+lidH} Q ${cx} ${cy-bh/2+lidH+4} ${cx-bw/2} ${cy-bh/2+lidH} Z`,
        fill: '#6a7078', stroke:'#1a1a1a', 'stroke-width': 3
      }));
    }

    // lashes on outer side (left eye lashes on left, right mirrored)
    if (lashes) {
      const baseX = side < 0 ? cx - bw*0.42 : cx + bw*0.42;
      for (let i=0;i<lashes;i++){
        const a = (side<0 ? -1 : 1) * (0.6 + i*0.35);
        const lx = baseX + side*(-4 - i*3);
        const ly = cy - bh*0.35 + i*2;
        eg.appendChild(el('path', {
          d: `M ${lx} ${ly} Q ${lx+side*(-8)} ${ly-14-i*2} ${lx+side*(-4)} ${ly-22-i}`,
          stroke:'#1a1a1a', 'stroke-width': 3.2, fill:'none', 'stroke-linecap':'round'
        }));
      }
    }

    // under-eye stress lines
    if (underLines) {
      for (let i=0;i<underLines;i++){
        eg.appendChild(el('path', {
          d: `M ${cx-10+i*2} ${cy+bh*0.55+i*4} Q ${cx} ${cy+bh*0.58+i*4} ${cx+10-i*2} ${cy+bh*0.55+i*4}`,
          stroke:'#1a1a1a', 'stroke-width': 1.8, fill:'none', opacity:0.7
        }));
      }
    }
    if (bag) {
      eg.appendChild(el('path', {
        d: `M ${cx-bw*0.4} ${cy+bh*0.35} Q ${cx} ${cy+bh*0.55} ${cx+bw*0.4} ${cy+bh*0.35}`,
        stroke:'#6a6068', 'stroke-width': 5, fill:'none', opacity:0.5, 'stroke-linecap':'round'
      }));
    }

    // crease above heavy lid
    if (shape === 'heavyLid' || emote.lidCap) {
      eg.appendChild(el('path', {
        d: `M ${cx-bw*0.35} ${cy-bh*0.55} Q ${cx} ${cy-bh*0.72} ${cx+bw*0.4} ${cy-bh*0.5}`,
        stroke:'#1a1a1a', 'stroke-width': 2.5, fill:'none'
      }));
    }

    root.appendChild(eg);
  }
  // credit tiny
  return root;
}

const ELAZUSHU = [
  { id:'gold-open', name:'Gold Open', iris:'#e8a028', irisDark:'#c87810', shape:'round', doubleHighlight:false },
  { id:'gold-open-2', name:'Gold Open B', iris:'#d89020', irisDark:'#b06808', shape:'round' },
  { id:'seafoam-lid', name:'Seafoam Side-eye', iris:'#3cb89a', irisDark:'#2a8a72', shape:'heavyLid', look:1, gazeX:6, underLines:2, w:78, h:64 },
  { id:'magenta-lash', name:'Magenta Lashes', iris:'#e040a0', irisDark:'#b02878', shape:'round', lashes:3, w:76, h:76 },
  { id:'lime-sleepy', name:'Lime Sleepy', iris:'#8fd820', irisDark:'#68a010', shape:'flatTop', underLines:3, h:58, w:74, lidShade:0.4 },
  { id:'teal-bored', name:'Teal Bored', iris:'#48b8c8', irisDark:'#2a8898', shape:'round', lidCap:0.42, gazeX:-4, gazeY:4, underLines:1, h:70 },
  { id:'red-intense', name:'Red Intense', iris:'#e02028', irisDark:'#a01018', shape:'round', outlineHeavy:1, bag:1, look:1, gazeX:10, w:80, h:78 },
  { id:'gold-puppy', name:'Gold Puppy', iris:'#e8b040', irisDark:'#c88818', shape:'round', lashes:3, doubleHighlight:true, w:78, h:78 },
  { id:'smile-slit', name:'Smile Slit', iris:'#4050a0', irisDark:'#283878', shape:'slit', h:28, w:82, lidShade:0.1, underLines:2 },
];

/* ───────────── Eye designs sheet ─────────────
   Varied graphic styles per pair — each drawn specially. */

function drawDesigns(emote, opts={}) {
  const o = { gazeX:0, gazeY:0, blink:0, ...emote, ...opts };
  const root = svgRoot('0 0 320 200');
  const L=95, R=225, cy=105;
  const blink = o.blink;

  const pair = (drawOne) => {
    drawOne(root, L, -1);
    drawOne(root, R, 1);
  };

  if (emote.id === 'heartglow') {
    pair((g, cx, side) => {
      const h = 78*(1-blink*0.85), w=70;
      const gx=o.gazeX*side, gy=o.gazeY;
      const clipId=`dhg${side}`;
      g.appendChild(el('defs', {}, [el('clipPath',{id:clipId},[el('rect',{x:cx-w/2,y:cy-h/2,width:w,height:h,rx:14})])]));
      // yellow body
      g.appendChild(el('rect', { x:cx-w/2, y:cy-h/2, width:w, height:h, rx:14, fill:'#ffe86a', stroke:'#e07040', 'stroke-width':4 }));
      // top thick orange lid line
      g.appendChild(el('path', { d:`M ${cx-w/2+4} ${cy-h/2+2} Q ${cx} ${cy-h/2-2} ${cx+w/2-4} ${cy-h/2+2}`, stroke:'#d06030', 'stroke-width':7, fill:'none', 'stroke-linecap':'round' }));
      // bottom pink
      g.appendChild(el('path', { d:`M ${cx-w/2+6} ${cy+h/2-2} Q ${cx} ${cy+h/2+2} ${cx+w/2-6} ${cy+h/2-2}`, stroke:'#f8a0c0', 'stroke-width':4, fill:'none', 'stroke-linecap':'round' }));
      const clipped=el('g',{'clip-path':`url(#${clipId})`});
      // rings
      clipped.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy,rx:22,ry:26,fill:'none',stroke:'#f0c040','stroke-width':3,opacity:0.7}));
      clipped.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy,rx:12,ry:14,fill:'none',stroke:'#e8a830','stroke-width':2.5,opacity:0.7}));
      // heart pupil
      const s=9;
      clipped.appendChild(el('path',{d:`M ${cx+gx} ${cy+gy+s*0.5} C ${cx+gx-s} ${cy+gy-s*0.1}, ${cx+gx-s*0.5} ${cy+gy-s*0.8}, ${cx+gx} ${cy+gy-s*0.2} C ${cx+gx+s*0.5} ${cy+gy-s*0.8}, ${cx+gx+s} ${cy+gy-s*0.1}, ${cx+gx} ${cy+gy+s*0.5} Z`, fill:'#ff68a8'}));
      // highlights
      clipped.appendChild(el('rect',{x:cx-w/2+8,y:cy-h/2+10,width:14,height:6,rx:3,fill:'#fff',opacity:0.9}));
      clipped.appendChild(el('rect',{x:cx+w/2-22,y:cy-h/2+12,width:10,height:5,rx:2,fill:'#fff',opacity:0.75}));
      g.appendChild(clipped);
      // pink tuft brow
      g.appendChild(el('path',{d:`M ${cx-8} ${cy-h/2-8} L ${cx} ${cy-h/2-22} L ${cx+8} ${cy-h/2-8} Z`, fill:'#f8a0c0', stroke:'#e07090','stroke-width':1.5}));
      // sparkle dots under
      g.appendChild(el('circle',{cx:cx-10,cy:cy+h/2+10,r:3,fill:'#f8b0d0',opacity:0.8}));
      g.appendChild(el('circle',{cx:cx+4,cy:cy+h/2+14,r:2.2,fill:'#f8b0d0',opacity:0.7}));
      g.appendChild(el('circle',{cx:cx+12,cy:cy+h/2+8,r:2.5,fill:'#f8b0d0',opacity:0.75}));
    });
  } else if (emote.id === 'drip') {
    pair((g, cx, side) => {
      const h=70*(1-blink*0.85), w=62;
      const isLeft = side<0;
      const iris = isLeft ? '#00e8e8' : '#ff4800';
      const iris2 = isLeft ? '#00c8a0' : '#ff2000';
      const gx=o.gazeX*(isLeft?1:1), gy=o.gazeY;
      // thick drippy outline (Designs sheet)
      const d = `M ${cx-w/2} ${cy-h/2+14}
        Q ${cx-w/2} ${cy-h/2} ${cx-w/2+14} ${cy-h/2}
        L ${cx+w/2-14} ${cy-h/2}
        Q ${cx+w/2} ${cy-h/2} ${cx+w/2} ${cy-h/2+14}
        L ${cx+w/2} ${cy+h/2-4}
        Q ${cx+w/2+2} ${cy+h/2+22} ${cx+w/2-18} ${cy+h/2+8}
        L ${cx-w/2+10} ${cy+h/2+2}
        Q ${cx-w/2-4} ${cy+h/2+16} ${cx-w/2} ${cy+h/2-6} Z`;
      g.appendChild(el('path',{d, fill:iris, stroke:'#111','stroke-width':9, 'stroke-linejoin':'round'}));
      // outer drip blob
      g.appendChild(el('ellipse',{cx: cx+(isLeft?-w*0.15:w*0.15), cy:cy+h/2+16, rx:8, ry:11, fill:'#111'}));
      // inner gradient suggestion
      g.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy+6,rx:18,ry:20,fill:iris2,opacity:0.55}));
      g.appendChild(el('circle',{cx:cx+gx,cy:cy+gy,r:14,fill:'#111'}));
      g.appendChild(el('circle',{cx:cx+gx-5,cy:cy+gy-5,r:4,fill:'#fff'}));
      // three dots outer
      const ox = isLeft ? cx-w/2-8 : cx+w/2+8;
      for (let i=0;i<3;i++) g.appendChild(el('circle',{cx:ox, cy:cy-h/2+8+i*12, r:4.5, fill:'#111'}));
    });
  } else if (emote.id === 'fierce') {
    pair((g, cx, side) => {
      const h=48*(1-blink*0.7), w=78;
      const gx=o.gazeX*side, gy=o.gazeY;
      // half-moon iris
      g.appendChild(el('path', {
        d:`M ${cx-w/2} ${cy-h/2+4} L ${cx+w/2} ${cy-h/2+4}
           A ${w/2} ${h} 0 0 1 ${cx-w/2} ${cy-h/2+4} Z`,
        fill:'#ff9010', stroke:'#111', 'stroke-width':4
      }));
      g.appendChild(el('circle',{cx:cx+gx,cy:cy+gy+4,r:10,fill:'#111'}));
      g.appendChild(el('circle',{cx:cx+gx-3,cy:cy+gy,r:2.5,fill:'#fff'}));
      // thick jagged half-moon lashes under the eye
      let lash=`M ${cx-w/2-4} ${cy+h/2-4}`;
      for (let i=0;i<11;i++){
        const x=cx-w/2-4 + i*((w+8)/10);
        const up = (i%2===0 ? 18 : 8) + (i===5?6:0);
        lash += ` L ${x+((w+8)/20)} ${cy+h/2-4+up} L ${x+((w+8)/10)} ${cy+h/2-4}`;
      }
      g.appendChild(el('path',{d:lash+' Z', fill:'#1a1008', stroke:'#111','stroke-width':2}));
      // thick brow
      g.appendChild(el('path',{
        d:`M ${cx-28} ${cy-h/2-18} Q ${cx} ${cy-h/2-28-side*4} ${cx+28} ${cy-h/2-14}`,
        stroke:'#2a1810','stroke-width':10, fill:'none','stroke-linecap':'round'
      }));
    });
  } else if (emote.id === 'sleepy') {
    pair((g, cx, side) => {
      const h=72*(1-blink*0.5), w=70;
      // teal bottom iris area
      g.appendChild(el('ellipse',{cx,cy,rx:w/2,ry:h/2,fill:'#70c8b8',stroke:'#3a2028','stroke-width':4}));
      // heavy burgundy lid covering top
      const lidH = h*0.58;
      g.appendChild(el('path',{
        d:`M ${cx-w/2} ${cy-h/2} A ${w/2} ${h/2} 0 0 1 ${cx+w/2} ${cy-h/2}
           L ${cx+w/2} ${cy-h/2+lidH} Q ${cx} ${cy-h/2+lidH+8} ${cx-w/2} ${cy-h/2+lidH} Z`,
        fill:'#5a2030', stroke:'#3a2028','stroke-width':3
      }));
      // thin upper lash line on lid edge
      g.appendChild(el('path',{
        d:`M ${cx-w/2+2} ${cy-h/2+lidH-2} Q ${cx} ${cy-h/2+lidH+4} ${cx+w/2-2} ${cy-h/2+lidH-2}`,
        stroke:'#2a1018','stroke-width':3, fill:'none'
      }));
      // brow bean
      g.appendChild(el('ellipse',{cx, cy:cy-h/2-16, rx:18, ry:7, fill:'#3a2028'}));
      // tiny pupil peek
      g.appendChild(el('circle',{cx:cx+o.gazeX*side, cy:cy+h*0.22+o.gazeY, r:5, fill:'#1a1018'}));
    });
  } else if (emote.id === 'hypnotic') {
    pair((g, cx, side) => {
      const h=88*(1-blink*0.85), w=48;
      const gx=o.gazeX*side, gy=o.gazeY;
      g.appendChild(el('ellipse',{cx,cy,rx:w/2,ry:h/2,fill:'#c8a0c8',stroke:'#4a2058','stroke-width':4}));
      g.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy,rx:w*0.32,ry:h*0.38,fill:'none',stroke:'#7850a0','stroke-width':5}));
      g.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy,rx:w*0.18,ry:h*0.22,fill:'none',stroke:'#5a3080','stroke-width':4}));
      // white dash pupil
      g.appendChild(el('rect',{x:cx+gx-7, y:cy+gy-2.5, width:14, height:5, rx:2, fill:'#fff'}));
    });
  } else if (emote.id === 'almond') {
    pair((g, cx, side) => {
      const h=36*(1-blink*0.8), w=72;
      const gx=o.gazeX*side, gy=o.gazeY;
      // almond tilted inward
      const tilt = side * -8;
      const eg=el('g',{transform:`rotate(${tilt} ${cx} ${cy})`});
      eg.appendChild(el('ellipse',{cx,cy,rx:w/2,ry:h/2,fill:'#d8f0c0',stroke:'#1a1a1a','stroke-width':4}));
      eg.appendChild(el('path',{d:`M ${cx-w/2+4} ${cy-h/2+2} Q ${cx} ${cy-h/2-4} ${cx+w/2-4} ${cy-h/2+2}`, stroke:'#1a1a1a','stroke-width':6, fill:'none','stroke-linecap':'round'}));
      eg.appendChild(el('circle',{cx:cx+gx,cy:cy+gy,r:11,fill:'#88c060'}));
      eg.appendChild(el('circle',{cx:cx+gx,cy:cy+gy,r:5,fill:'#1a1a1a'}));
      eg.appendChild(el('circle',{cx:cx+gx-3,cy:cy+gy-3,r:2,fill:'#fff'}));
      g.appendChild(eg);
      // brow
      g.appendChild(el('ellipse',{
        cx: cx - side*4, cy: cy - 32,
        rx: 16, ry: 5,
        fill:'#3a2820',
        transform:`rotate(${side*-18} ${cx} ${cy-32})`
      }));
    });
  } else if (emote.id === 'surprised') {
    pair((g, cx, side) => {
      const h=92*(1-blink*0.85), w=52;
      const gx=o.gazeX*side, gy=o.gazeY;
      g.appendChild(el('ellipse',{cx,cy,rx:w/2,ry:h/2,fill:'#f5e8d8',stroke:'#5a4038','stroke-width':3.5}));
      g.appendChild(el('ellipse',{cx:cx+gx,cy:cy+gy+8,rx:w*0.32,ry:h*0.22,fill:'#ff8030',opacity:0.35}));
      // tiny heart near bottom
      const hx=cx+gx, hy=cy+h*0.28+gy; const s=7;
      g.appendChild(el('path',{d:`M ${hx} ${hy+s*0.5} C ${hx-s} ${hy-s*0.1}, ${hx-s*0.5} ${hy-s*0.8}, ${hx} ${hy-s*0.2} C ${hx+s*0.5} ${hy-s*0.8}, ${hx+s} ${hy-s*0.1}, ${hx} ${hy+s*0.5} Z`, fill:'#ff5020'}));
    });
  } else if (emote.id === 'angry') {
    pair((g, cx, side) => {
      const h=40*(1-blink*0.7), w=70;
      const gx=o.gazeX*side, gy=o.gazeY;
      const tilt = side * 14;
      const eg=el('g',{transform:`rotate(${tilt} ${cx} ${cy})`});
      eg.appendChild(el('ellipse',{cx,cy,rx:w/2,ry:h/2,fill:'#c8d888',stroke:'#1a1a1a','stroke-width':4}));
      eg.appendChild(el('circle',{cx:cx+gx,cy:cy+gy,r:9,fill:'#88a850'}));
      eg.appendChild(el('circle',{cx:cx+gx,cy:cy+gy,r:3.5,fill:'#1a1a1a'}));
      g.appendChild(eg);
      // jagged brow
      const bx = cx, by = cy - 36;
      g.appendChild(el('path',{
        d:`M ${bx-30} ${by+8} L ${bx-12} ${by-10} L ${bx-4} ${by+2} L ${bx+8} ${by-14} L ${bx+28} ${by+4}`,
        stroke:'#1a1a1a','stroke-width':5, fill:'none','stroke-linejoin':'round','stroke-linecap':'round'
      }));
    });
    // center twitch mark
    root.appendChild(el('path',{
      d:'M 160 68 L 156 78 L 164 76 L 158 88',
      stroke:'#1a1a1a','stroke-width':2.5, fill:'none','stroke-linejoin':'round'
    }));
  }

  return root;
}

const DESIGNS = [
  { id:'heartglow', name:'Heart Glow' },
  { id:'drip', name:'Drip Mismatch' },
  { id:'fierce', name:'Fierce Amber' },
  { id:'sleepy', name:'Sleepy Cap' },
  { id:'hypnotic', name:'Hypnotic' },
  { id:'almond', name:'Almond Green' },
  { id:'surprised', name:'Surprised Hearts' },
  { id:'angry', name:'Angry Jagged' },
];

export const SHEETS = {
  polly: {
    id: 'polly',
    label: 'Polly',
    credit: 'EYES EMOTES — style after Polly Von Dominique',
    emotes: POLLY,
    draw: drawPolly,
  },
  elazushu: {
    id: 'elazushu',
    label: 'El_azushu',
    credit: 'Style after El_azushu',
    emotes: ELAZUSHU,
    draw: drawEl,
  },
  designs: {
    id: 'designs',
    label: 'Designs',
    credit: 'Eye designs for your art',
    emotes: DESIGNS,
    draw: drawDesigns,
  },
};

export function renderEmote(sheetId, emoteId, opts={}) {
  const sheet = SHEETS[sheetId];
  if (!sheet) return svgRoot();
  const emote = sheet.emotes.find(e => e.id === emoteId) || sheet.emotes[0];
  return sheet.draw(emote, opts);
}

export function listSheets() { return Object.values(SHEETS); }
