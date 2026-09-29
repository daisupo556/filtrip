/* Original artwork only. Coordinates refer to unmodified source PNGs.
 * This file intentionally does not redraw or generate replacement art.
 */
(() => {
  'use strict';
  const sourceBase = new URL('assets/references/', document.currentScript.src).href;
  const sources = {
    about: ['02_about_you.png', 853, 1844],
    messages: ['12_messages.png', 1024, 1536],
    welcome: ['01_welcome.png', 853, 1844], favorites: ['03_choose_favorites.png', 853, 1844],
    result: ['03c_personality_result.png', 853, 1844], mine: ['04_my_world.png', 1024, 1536],
    sources: ['05_content_sources.png', 853, 1844], home: ['06_home.png', 853, 1844],
    results: ['08_world_results.png', 853, 1844], world: ['09_other_world.png', 853, 1844],
    articles: ['09a_other_world_articles.png', 853, 1844], videos: ['09b_other_world_videos.png', 853, 1844],
    music: ['09c_other_world_music.png', 853, 1844], posts: ['09d_other_world_posts.png', 853, 1844],
    profile: ['11_public_profile.png', 1024, 1536],
    videoDetail: ['13_video_viewing.png', 853, 1843],
    why: ['10_why_this_content.png', 852, 1847],
    added: ['10b_added_to_my_world.png', 852, 1846]
  };
  // [source key, x, y, width, height]; only the illustration area is exposed.
  const regions = {
    addCircle: ['world', 666, 650, 82, 82],
    welcome: ['welcome', 87, 470, 666, 570],
    book: ['favorites', 133, 986, 233, 165],
    music: ['sources', 119, 627, 96, 104],
    game: ['favorites', 486, 997, 234, 151],
    art: ['favorites', 484, 1307, 200, 189],
    mountain: ['favorites', 123, 1314, 255, 186],
    film: ['favorites', 514, 644, 174, 177],
    headphone: ['favorites', 161, 647, 178, 171],
    building: ['welcome', 636, 699, 115, 113],
    video: ['sources', 116, 448, 112, 79],
    message: ['sources', 121, 1010, 102, 102],
    people: ['home', 114, 800, 49, 44],
    person: ['results', 99, 1287, 206, 207],
    lamp: ['articles', 92, 611, 223, 226],
    soda: ['music', 93, 900, 222, 232],
    leaf: ['result', 108, 1257, 101, 97],
    repair: ['videos', 90, 601, 263, 244],
    history: ['articles', 92, 900, 223, 235],
    craft: ['videos', 90, 894, 263, 246],
    night: ['music', 93, 610, 223, 228],
    tools: ['articles', 92, 1197, 223, 225],
    food: ['videos', 90, 1192, 263, 240],
    neon: ['music', 93, 1196, 223, 229],
    post: ['posts', 92, 602, 97, 99],
    snack: ['posts', 92, 969, 97, 96],
    play: ['posts', 92, 1338, 97, 97],
    artPalette: ['results', 99, 923, 200, 188],
    record: ['mine', 230, 495, 196, 179],
    mina: ['profile', 215, 239, 207, 214],
    you: ['mine', 192, 140, 114, 119],
    cat: ['posts', 92, 602, 97, 99],
    pudding: ['posts', 92, 969, 97, 96],
    result: ['result', 275, 486, 327, 256],
    // Context-specific artwork from the same supplied references.
    homeSoda: ['home', 104, 481, 265, 291],
    homeHistory: ['home', 104, 909, 265, 295],
    homeCraft: ['home', 104, 1324, 265, 267],
    worldBook: ['results', 99, 553, 211, 187],
    mineLamp: ['mine', 194, 1006, 143, 145],
    profileHistory: ['profile', 215, 758, 181, 164],
    profileCraft: ['profile', 423, 758, 180, 164],
    profileSoda: ['profile', 630, 758, 182, 164],
    calendar: ['result', 105, 1381, 117, 107],
    repairHandheld: ['videoDetail', 76, 1416, 279, 126],
    repairCleaning: ['videoDetail', 76, 1553, 279, 122],
    repairPlayer: ['videoDetail', 70, 257, 715, 382],
    repairChannel: ['videoDetail', 74, 729, 91, 93],
    repairAudience: ['videoDetail', 84, 1188, 368, 85],
    whyPeople: ['why', 103, 512, 145, 100],
    whyOverlap: ['why', 98, 1266, 319, 175],
    addedCheck: ['added', 271, 217, 316, 160],
    aboutArt: ['about', 165, 1129, 89, 92],
    aboutHeadphone: ['about', 601, 1135, 90, 86],
    aboutGame: ['about', 366, 1138, 122, 82],
    aboutBuilding: ['about', 158, 1321, 101, 87],
    aboutBook: ['about', 362, 1326, 124, 84],
    aboutMountain: ['about', 576, 1313, 137, 100],
    artPlain: ['welcome', 566, 856, 107, 131],
    headphonePlain: ['welcome', 365, 923, 122, 115],
    navHome: ['world', 126, 1662, 57, 56],
    navSearch: ['home', 313, 1689, 55, 56],
    navBook: ['world', 489, 1662, 63, 56],
    navMessage: ['world', 671, 1662, 61, 56],
    navHomeActive: ['home', 127, 1689, 61, 56],
    navSearchActive: ['world', 304, 1662, 61, 56],
    navBookActive: ['mine', 568, 1353, 62, 59],
    navMessageActive: ['messages', 740, 1351, 64, 65],
    statBookmark: ['profile', 250, 548, 55, 74],
    statOverlap: ['profile', 552, 550, 85, 72],
    addCircle: ['world', 667, 649, 81, 82]
  };
  const esc = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  window.FILTRIP_ART_REGIONS = Object.freeze(regions);
  let instance = 0;
  window.FILTRIP_ART = (name, className = '') => {
    const crop = regions[name];
    if (!crop) return '';
    const [source, x, y, width, height] = crop;
    const [file, imageWidth, imageHeight] = sources[source];
    const clip = `filtrip-art-crop-${++instance}`;
    // The brush is next to a decorative ray; exclude that corner without changing pixels.
    const cropShape = name === 'artPlain' ? '<polygon points="580,856 673,856 673,987 566,987 566,899 580,899"/>' : `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="reference-art icon ${esc(className)}" viewBox="${x} ${y} ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="overflow:hidden" aria-hidden="true" focusable="false" data-art="${esc(name)}"><defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse">${cropShape}</clipPath></defs><image clip-path="url(#${clip})" href="${esc(sourceBase + file)}" x="0" y="0" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="none"/></svg>`;
  };
})();
