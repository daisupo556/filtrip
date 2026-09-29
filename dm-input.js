/* DM input: a textarea that grows downward (up to 5 lines), returns to one line after sending. Enter sends, Shift+Enter breaks a line. */
(() => {
 const MAX_LINES=5;
 function fit(box){
  if(!box||box.id!=='thread-input')return;
  const css=getComputedStyle(box),line=parseFloat(css.lineHeight)||24,pad=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom),border=parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
  const max=line*MAX_LINES+pad+border;
  box.style.height='auto';
  const wanted=Math.max(line+pad+border,box.scrollHeight+border);
  box.style.height=Math.min(wanted,max)+'px';
  box.style.overflowY=wanted>max?'auto':'hidden';
  if(wanted>max)box.scrollTop=box.scrollHeight;
 }
 const fitAll=()=>fit(document.querySelector('#thread-input'));
 document.addEventListener('input',e=>fit(e.target));
 document.addEventListener('keydown',e=>{
  if(e.target.id!=='thread-input'||e.key!=='Enter'||e.shiftKey||e.isComposing||e.keyCode===229)return;
  e.preventDefault();e.target.form?.requestSubmit();
 });
 addEventListener('resize',fitAll);
 new MutationObserver(fitAll).observe(document.querySelector('#app'),{childList:true,subtree:true});
 fitAll();
})();
