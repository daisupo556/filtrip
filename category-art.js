/* Transparent raster illustrations, regenerated from the supplied FILTRIP references.
 * Functional controls remain in icons-v3.js; this API supplies category artwork only.
 */
(() => {
  'use strict';
  const base = new URL('assets/category-icons/', document.currentScript.src).href;
  const aliases = { music: 'headphone', movie: 'film', games: 'game', books: 'book' };
  const names = new Set(['book', 'game', 'headphone', 'film', 'art', 'video']);
  // Viewports remove unused transparent margins; PNG pixels and alpha stay untouched.
  const geometry = {
    book: [1536, 1024, '136 98 1327 836'],
    game: [1536, 1024, '55 122 1453 847'],
    headphone: [1333, 1180, '83 77 1168 1052'],
    film: [1469, 1071, '248 72 1001 939'],
    art: [1536, 1024, '322 26 1056 980'],
    video: [1536, 1024, '306 184 924 649']
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  window.FILTRIP_CATEGORY_ART = (name, className = '') => {
    const key = aliases[name] || name;
    if (!names.has(key)) return '';
    const [width, height, viewBox] = geometry[key];
    return `<svg xmlns="http://www.w3.org/2000/svg" class="icon category-art transparent-category-art ${escape(className)}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" data-category-art="${escape(key)}" style="overflow:hidden;background:transparent"><image href="${escape(base + key + '-v1.webp')}" x="0" y="0" width="${width}" height="${height}"/></svg>`;
  };
})();
