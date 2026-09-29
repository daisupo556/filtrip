/* Crisp functional icons. Decorative reference illustrations remain in assets.js. */
(() => {
 const paths = {
  home:'<path d="m3.5 10 8.5-7 8.5 7v11h-6v-7h-5v7h-6Z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.7"/><path d="m15.5 15.5 5 5"/>',
  book:'<path d="M12 5v16M12 5C9 3 5.8 3 2.5 4v16c3.3-1 6.5-1 9.5 1 3-2 6.2-2 9.5-1V4c-3.3-1-6.5-1-9.5 1Z"/>',
  message:'<path d="M21 11.2a9 8.4 0 0 1-9 8.4c-1.4 0-2.8-.3-4-.8l-5.4 2 1.6-5.2A8 8 0 0 1 3 11.2a9 8.4 0 0 1 18 0Z"/><circle cx="8" cy="11" r=".65"/><circle cx="12" cy="11" r=".65"/><circle cx="16" cy="11" r=".65"/>',
  people:'<circle cx="12" cy="7" r="3"/><circle cx="4.5" cy="9" r="2.5"/><circle cx="19.5" cy="9" r="2.5"/><path d="M7 21v-3a5 5 0 0 1 10 0v3M2 20v-3a3.5 3.5 0 0 1 3-3.5M22 20v-3a3.5 3.5 0 0 0-3-3.5"/>',
  person:'<circle cx="12" cy="7.5" r="4"/><path d="M4 21v-2a8 7 0 0 1 16 0v2"/>',
  addCircle:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>',
  heart:'<path d="M12 21 3.5 12.4C-2 6.3 6.3.3 12 7c5.7-6.7 14 .3 8.5 5.4Z"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
  settings:'<path d="m9 3 6 0 .8 3 2.5 1.5 3 .1 1 5-2.5 1.8-1 2.6.5 3-4.5 2-2.3-2-2.8-.2-2.5 1.8-4-3 .9-3-.8-2.5L.5 11l2-4.5 3 .5L8 5.5Z" transform="translate(1 0) scale(.91)"/><circle cx="12" cy="12" r="3"/>',
  bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5ZM10 21h4M12 2v2"/>',
  back:'<path d="m14.5 5-7 7 7 7"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  send:'<path d="m3 3 18 9-18 9 3-9ZM6 12h15"/>',
  filter:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--white,#fff)"/><circle cx="16" cy="12" r="2" fill="var(--white,#fff)"/><circle cx="10" cy="18" r="2" fill="var(--white,#fff)"/>',
  headphone:'<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="11" width="5" height="10" rx="2"/><rect x="17" y="11" width="5" height="10" rx="2"/>',
  music:'<path d="M9 17V5l11-2v12M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
  video:'<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m10 8 6 4-6 4Z"/>',
  article:'<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  film:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4M7 12h10"/>',
  game:'<path d="M8 7h8c3 0 4 3 5.5 11 .5 3-3 3-6-1h-7c-3 4-6.5 4-6-1C4 8 5 7 8 7Z"/><path d="M7 10v5m-2.5-2.5h5M15 11h.1M18 14h.1M12 7V3"/>',
  art:'<path d="M12 3a9 9 0 1 0 0 18h1a2.5 2.5 0 0 0 1.4-4.6 1.5 1.5 0 0 1 1-2.7H18a4 4 0 0 0 3-4C20.3 5.8 16.3 3 12 3Z"/><circle cx="7" cy="10" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 3 12 3 18 0M10 13v3h4v-3"/>',
  location:'<path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  overlap:'<circle cx="8.5" cy="12" r="6"/><circle cx="15.5" cy="12" r="6"/>'
 };
 const aliases={navHome:'home',navSearch:'search',navBook:'book',navMessage:'message',whyPeople:'people',statBookmark:'bookmark',statOverlap:'overlap',post:'message'};
 window.FILTRIP_CATEGORY=(name,cls='')=>{
  const key=({music:'headphone',headphone:'headphone',artPlain:'art'})[name]||name;
  if(!paths[key])return '';
  const tint=key==='art'?'#e0ecd9':'#dcecf6';
  let art=paths[key].replace(/<(path|rect|ellipse)(?= )/,`<$1 fill="${tint}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="category-graphic ${String(cls).replace(/[^a-zA-Z0-9 _-]/g,'')}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-category-art="${key}">${art}</svg>`;
 };
 window.FILTRIP_ICON=(name,cls='')=>{
  name=aliases[name.replace(/Active$/,'')]||name;
  if(!paths[name]) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon functional-icon ${String(cls).replace(/[^a-zA-Z0-9 _-]/g,'')}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-vector="${name}">${paths[name]}</svg>`;
 };
})();
