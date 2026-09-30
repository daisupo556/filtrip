/* FILTRIP user identities; generated eight-character family, separate from content authors. */
(() => {
  'use strict';
  const source = new URL('assets/user-portraits/filtrip-people-v1.webp', document.currentScript.src).href;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const indexFor = person => {
    if (Number.isInteger(person?.portraitIndex)) return ((person.portraitIndex % 8) + 8) % 8;
    let hash = 2166136261;
    for (const char of String(person?.id ?? person?.handle ?? person?.name ?? person ?? 'user')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0) % 8;
  };
  window.FILTRIP_USER_PORTRAIT_INDEX = indexFor;
  window.FILTRIP_USER_AVATAR = (person, className = '') => {
    if (!person) return '';
    const p = typeof person === 'string' ? {id: person} : person;
    if (p.id === 'mina') return window.FILTRIP_ART?.('mina', className) || '';
    if (['self', 'me', 'myself', 'you'].includes(p.id)) return window.FILTRIP_ART?.('you', className) || '';
    const index = indexFor(p), col = index % 4, row = Math.floor(index / 4);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="reference-art icon avatar-art filtrip-user-avatar ${escape(className)}" viewBox="${col} ${row} 1 1" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" data-user-portrait="${index}" data-person-image="${escape(p.id)}" style="display:block;aspect-ratio:1;overflow:hidden"><image href="${escape(source)}" x="0" y="0" width="4" height="2" preserveAspectRatio="none"/></svg>`;
  };
})();
