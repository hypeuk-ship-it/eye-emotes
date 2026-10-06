// Catalog of 1:1 reference-cropped emote sprites (per-sheet styles preserved).
export async function loadCatalog() {
  const res = await fetch(`assets/catalog.json?v=${Date.now()}`);
  return res.json();
}

export function emoteUrl(file, bust) {
  return `${file}?v=${bust}`;
}
