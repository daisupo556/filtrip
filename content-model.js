/* External publisher identity is distinct from FILTRIP membership. */
(() => {
 const providers={youtube:'YouTube',instagram:'Instagram',x:'X',spotify:'Spotify',soundcloud:'SoundCloud',web:'Web',filtrip:'ORIGINAL'};
 window.FILTRIP_PROVIDERS=providers;
 window.FILTRIP_NORMALIZE_CONTENT=(item,index=0)=>{
  const original=item.original===true||item.source==='filtrip';
  const source=original?'filtrip':item.source||({'動画':'youtube','音楽':index%3?'spotify':'soundcloud','投稿':index%2?'instagram':'x','記事':'web'})[item.type];
  const creator=item.providerCreator||{name:item.type==='投稿'?(item.author||(item.by.startsWith('@')?item.title:item.by)):item.by,handle:item.handle||(item.by.startsWith('@')?item.by:'')};
  const {personId,...content}=item;
  return {...content,source,original,providerCreator:creator,externalCreatorId:source+':'+creator.name};
 };
})();
