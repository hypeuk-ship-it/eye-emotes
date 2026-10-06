// Simple critically-ish damped springs (same family as astrid-glass, no sine on face)
export function spring(x=0, t=0, k=0.18, d=0.72) {
  return { x, v:0, t, k, d };
}
export function step(s) {
  s.v = (s.v + (s.t - s.x) * s.k) * s.d;
  s.x += s.v;
  return s.x;
}
export function setTarget(s, t) { s.t = t; }
