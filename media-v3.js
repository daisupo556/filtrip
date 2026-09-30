/* Generated media sheets: 4 columns x 5 rows; each source remains unchanged. */
(() => {
  const base = new URL('assets/generated/', document.currentScript.src).href;
  const types = {'記事':'article','音楽':'music','動画':'video','投稿':'post',article:'article',music:'music',video:'video',post:'post'};
  const escape = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const render = (type,index,className,label='') => {
    if (!type || !Number.isInteger(index) || index < 0 || index > 119) return '';
    const tile=index%20, col=tile%4, row=Math.floor(tile/4), sheet=Math.floor(index/20);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="generated-media ${escape(className)}" viewBox="${col} ${row} 1 1" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escape(label)}" focusable="false" data-media="${type}-${index}" style="display:block;aspect-ratio:1;overflow:hidden"><image href="${base}${type}${sheet}.webp" x="0" y="0" width="4" height="5" preserveAspectRatio="none"/></svg>`;
  };
  window.FILTRIP_MEDIA = (item,className='') => item && Number.isInteger(item.mediaIndex) ? render(types[item.type],item.mediaIndex,className,item.title || '') : '';
  const reservedAvatars={'night-editor':81,deadline:31,'rocket-bus':62,'design-note':42,'craft-imagination':41,naco:52,'tools-margin':40,'midnight-kitchen':72,'neon-parade':61,snackmemo:71,'nemui-game':11,'creator-repair-handheld':10,'creator-repair-cleaning':12};
  window.FILTRIP_AVATAR = (person,className='') => {
    if (!person) return '';
    let index=person.mediaIndex ?? reservedAvatars[person.id];
    if (!Number.isInteger(index)) { let hash=2166136261; for(const char of String(person.id ?? person.name ?? 'person')) hash=Math.imul(hash ^ char.charCodeAt(0),16777619); index=(hash>>>0)%120; }
    return render('post',index,'avatar-art '+className,person.name || 'プロフィール');
  };
})();
