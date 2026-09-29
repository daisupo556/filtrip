(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const easing='cubic-bezier(.2,0,0,1)';
 let pending=null, previousScreen='', previousGuide='', outgoing=null, sequence=0;
 const live=new Set();
 function animate(node,keyframes,options){
  if(!node||reduce.matches||!node.animate)return;
  const animation=node.animate(keyframes,{easing,fill:'none',...options});live.add(animation);
  animation.finished.catch(()=>{}).finally(()=>live.delete(animation));return animation;
 }
 function clean(){for(const a of live)a.cancel();live.clear();outgoing?.remove();outgoing=null;}
 function prepare(kind='forward'){
  clean();const root=document.querySelector('#app');
  pending={kind,screen:document.body.dataset.screen};sequence++;
  if(reduce.matches||!root||kind==='select')return;
  const source=root.querySelector('.app-scroll');if(!source)return;
  const clone=source.cloneNode(true);
  clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','');
  clone.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  clone.querySelectorAll('button,input,textarea,a,select').forEach(x=>{
   x.tabIndex=-1;
   for(const attr of [...x.attributes])if(attr.name.startsWith('data-'))x.removeAttribute(attr.name);
  });
  clone.classList.add('motion-outgoing');
  // Coordinates are measured in the unscaled phone layout, not the desktop viewport.
  Object.assign(clone.style,{position:'absolute',left:`${source.offsetLeft}px`,top:`${source.offsetTop}px`,width:`${source.offsetWidth}px`,height:`${source.offsetHeight}px`,margin:'0',zIndex:'3',pointerEvents:'none',background:'var(--white,#fff)'});
  root.appendChild(clone);clone.scrollTop=source.scrollTop;outgoing=clone;
 }
 function afterRender(){
  const screen=document.body.dataset.screen;
  const changed=screen!==previousScreen;
  let kind=pending?.kind||(changed?'forward':'select');
  if(!previousScreen)kind='initial';
  previousScreen=screen;pending=null;
  if(reduce.matches){clean();return;}
  const panel=document.querySelector('#app .app-scroll');
  // Retained snapshot may be detached by innerHTML; put it over the new panel.
  const old=outgoing;if(old)document.querySelector('#app')?.appendChild(old);
  let duration=300,from='translateX(32%)',to='translateX(-12%)';
  if(/back|prev|pop/.test(kind)){duration=260;from='translateX(-16%)';to='translateX(32%)';}
  if(/tab|fade|nav/.test(kind)){duration=190;from='translateY(9px)';to='translateY(0)';}
  if(kind==='select'||kind==='initial'){old?.remove();outgoing=null;return;}
  const stamp=sequence;
  if(old){const leave=animate(old,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:to}],{duration:Math.min(duration,150)});leave?.finished.catch(()=>{}).finally(()=>{old.remove();if(stamp===sequence)outgoing=null;});}
  animate(panel,[{opacity:.45,transform:from},{opacity:1,transform:'translate(0)'}],{duration});
  const guide=document.querySelector('#guide-content');const text=guide?.textContent;
  if(text&&text!==previousGuide){animate(guide,[{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});previousGuide=text;}
  const success=document.querySelector('.success-icon');if(success)animate(success,[{transform:'scale(.86)',opacity:.3},{transform:'scale(1)',opacity:1}],{duration:260});
 }
 function tapEcho(button){
  if(reduce.matches||!button.closest('.phone'))return;
  const phone=document.querySelector('.phone'),rect=phone.getBoundingClientRect(),r=button.getBoundingClientRect(),scale=rect.width/phone.offsetWidth;
  const dot=document.createElement('span');dot.className='touch-echo';dot.setAttribute('aria-hidden','true');dot.style.left=((r.left+r.width/2-rect.left)/scale-12)+'px';dot.style.top=((r.top+r.height/2-rect.top)/scale-12)+'px';phone.append(dot);
  dot.animate([{transform:'translate(-50%,-50%) scale(.35)',opacity:.5},{transform:'translate(-50%,-50%) scale(1.7)',opacity:0}],{duration:340,easing:'ease-out'}).finished.then(()=>dot.remove()).catch(()=>dot.remove());
 }
 document.addEventListener('click',event=>{const button=event.target.closest('button,summary');if(button&&!button.disabled)tapEcho(button);},true);
 document.addEventListener('pointerdown',event=>{
  const b=event.target.closest('button,summary');if(!b||b.disabled||event.button!==0)return;
  b.classList.add('is-pressed');
  const release=()=>{b.classList.remove('is-pressed');removeEventListener('pointerup',release);removeEventListener('pointercancel',release);};
  addEventListener('pointerup',release,{once:true});addEventListener('pointercancel',release,{once:true});
 },true);
 document.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){const b=event.target.closest('button');if(b&&!b.disabled)b.classList.add('is-pressed');}},true);
 document.addEventListener('keyup',()=>document.querySelectorAll('.is-pressed').forEach(b=>b.classList.remove('is-pressed')),true);
 // Native click remains immediate; animation never delays a state change or blocks another tap.
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled||reduce.matches)return;
  if(b.matches('[aria-pressed],[data-work],[data-select],[data-action="follow"],[data-action="like"]')){
   const identity=b.dataset.work?`[data-work="${CSS.escape(b.dataset.work)}"]`:b.dataset.select?`[data-select="${CSS.escape(b.dataset.select)}"][data-value="${CSS.escape(b.dataset.value||'')}"]`:b.dataset.action?`[data-action="${b.dataset.action}"]`:null;
   requestAnimationFrame(()=>{const target=identity?document.querySelector(identity):b;animate(target,[{transform:'scale(.94)'},{transform:'scale(1.025)',offset:.65},{transform:'scale(1)'}],{duration:240});});
  }
 },true);
 reduce.addEventListener('change',()=>{if(reduce.matches)clean();});
 window.FILTRIP_MOTION={prepare,afterRender,clear:clean,get reduced(){return reduce.matches;}};
})();
