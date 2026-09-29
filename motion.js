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

 // ---- Content-type tabs: per-tab scroll memory, directional slide and horizontal swipe ----
 const memory=new Map();let memoryScope='',swipeDx=0,syntheticClick=false;
 const SLIDE_MS=300;
 const scaleOf=el=>{const r=el.getBoundingClientRect();return el.offsetWidth?r.width/el.offsetWidth:1;};
 function tabBar(root){
  const bar=[...(root?.querySelectorAll('.tabs')||[])].find(t=>t.querySelector('[data-home-tab],[data-tab]'));
  if(!bar)return null;
  const buttons=[...bar.querySelectorAll('button[role=tab]')];
  const index=buttons.findIndex(b=>b.getAttribute('aria-selected')==='true');
  return {bar,buttons,index,label:buttons[index]?.textContent.trim()||''};
 }
 const siblingsAfter=el=>{const out=[];for(let n=el.nextElementSibling;n;n=n.nextElementSibling)out.push(n);return out;};
 function scopeKey(){return [document.body.dataset.screen,document.querySelector('.world-title')?.textContent||'',document.querySelector('.home-modes [aria-selected=true]')?.dataset.homeMode||''].join('|');}
 function currentLimit(){try{return document.body.dataset.screen==='home'?state.homeLimit:state.worldLimit;}catch{return undefined;}}
 // Called by the tab handlers so a tab that was scrolled/expanded before comes back the same length.
 function limitFor(label){return memoryScope===scopeKey()?memory.get(label)?.limit:undefined;}
 // After the new tab is rendered: put the scroll where that tab was left (or keep the view when it is new), and return the slide direction.
 function settleTab(panel,from){
  const now=panel&&tabBar(panel);if(!now||now.index<0||now.index===from.index||from.scope!==scopeKey())return null;
  const box=panel.getBoundingClientRect(),scale=scaleOf(panel);
  const saved=memory.get(now.label);
  const barTop=(now.bar.getBoundingClientRect().top-box.top)/scale+panel.scrollTop;
  panel.scrollTop=saved?saved.top:Math.max(0,Math.min(from.top,barTop-8));
  return {dir:Math.sign(now.index-from.index),dx:from.dx,clip:Math.max(from.clip,(now.bar.getBoundingClientRect().bottom-panel.getBoundingClientRect().top)/scale),bar:now.bar};
 }
 // The old list slides out one side while the new one comes in from the other; the tab bar itself stays put.
 function slideTabs(panel,old,s,stamp){
  const w=panel.clientWidth,offset=Math.abs(s.dx)>1?s.dx:0,ms=offset?Math.round(SLIDE_MS*.85):SLIDE_MS;
  for(const n of siblingsAfter(s.bar))animate(n,[{transform:`translate3d(${s.dir*w+offset}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:ms});
  if(old){
   old.style.clipPath=`inset(${Math.max(0,s.clip)}px 0 0 0)`;
   const leave=animate(old,[{transform:`translate3d(${offset}px,0,0)`},{transform:`translate3d(${-s.dir*w}px,0,0)`}],{duration:ms,fill:'forwards'});
   const done=()=>{old.remove();if(stamp===sequence)outgoing=null;};
   if(leave)leave.finished.then(done,done);else done();
  }
 }
 // Smooth programmatic scroll (300-450ms, decelerating). Falls back to an instant jump when motion is reduced.
 function scrollTo(el,top,{duration}={}){
  if(!el)return Promise.resolve();
  const max=Math.max(0,el.scrollHeight-el.clientHeight),end=Math.max(0,Math.min(top,max)),start=el.scrollTop,dist=end-start;
  if(el._scrollAnim)cancelAnimationFrame(el._scrollAnim.id);
  if(reduce.matches||Math.abs(dist)<2){el.scrollTop=end;return Promise.resolve();}
  const ms=duration||Math.round(Math.min(450,Math.max(300,300+Math.abs(dist)*.08)));
  return new Promise(resolve=>{
   const t0=performance.now(),state_={id:0};el._scrollAnim=state_;
   const stop=()=>{el.removeEventListener('wheel',stop);el.removeEventListener('touchstart',stop);el._scrollAnim=null;resolve();};
   el.addEventListener('wheel',stop,{once:true,passive:true});el.addEventListener('touchstart',stop,{once:true,passive:true});
   const step=now=>{
    if(el._scrollAnim!==state_){resolve();return;}
    const p=Math.min(1,(now-t0)/ms),e=1-Math.pow(1-p,4);
    el.scrollTop=start+dist*e;
    if(p<1)state_.id=requestAnimationFrame(step);else stop();
   };
   state_.id=requestAnimationFrame(step);
  });
 }
 function prepare(kind='forward'){
  clean();const root=document.querySelector('#app');
  pending={kind,screen:document.body.dataset.screen};sequence++;
  const source=root?.querySelector('.app-scroll');
  // Content-type tabs: remember where this tab was scrolled and which way the next one lies.
  const info=kind==='tab'&&source?tabBar(source):null;
  if(info&&info.index>=0){
   const scope=scopeKey();if(scope!==memoryScope){memory.clear();memoryScope=scope;}
   memory.set(info.label,{top:source.scrollTop,limit:currentLimit()});
   const box=source.getBoundingClientRect(),scale=scaleOf(source);
   pending.tab={scope,index:info.index,top:source.scrollTop,dx:swipeDx,clip:(info.bar.getBoundingClientRect().bottom-box.top)/scale};
  }
  swipeDx=0;
  if(reduce.matches||!root||kind==='select')return;
  if(!source)return;
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
  previousScreen=screen;const tabFrom=pending?.tab;pending=null;
  if(changed)memory.clear();
  const panel=document.querySelector('#app .app-scroll');
  const slide=tabFrom?settleTab(panel,tabFrom):null;
  if(reduce.matches){clean();return;}
  // Retained snapshot may be detached by innerHTML; put it over the new panel.
  const old=outgoing;if(old)document.querySelector('#app')?.appendChild(old);
  let duration=300,from='translateX(32%)',to='translateX(-12%)';
  if(/back|prev|pop/.test(kind)){duration=260;from='translateX(-16%)';to='translateX(32%)';}
  if(/tab|fade|nav/.test(kind)){duration=190;from='translateY(9px)';to='translateY(0)';}
  if(kind==='select'||kind==='initial'){old?.remove();outgoing=null;return;}
  const stamp=sequence;
  if(slide){slideTabs(panel,old,slide,stamp);return;}
  if(old){const leave=animate(old,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:to}],{duration:Math.min(duration,150)});leave?.finished.catch(()=>{}).finally(()=>{old.remove();if(stamp===sequence)outgoing=null;});}
  animate(panel,[{opacity:.45,transform:from},{opacity:1,transform:'translate(0)'}],{duration});
  const guide=document.querySelector('#guide-content');const text=guide?.textContent;
  if(text&&text!==previousGuide){animate(guide,[{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});previousGuide=text;}
  const success=document.querySelector('.success-icon');if(success)animate(success,[{transform:'scale(.86)',opacity:.3},{transform:'scale(1)',opacity:1}],{duration:260});
 }
 function tapEcho(button){
  if(reduce.matches||syntheticClick||!button.closest('.phone'))return;
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

 // Horizontal drag (mouse) / swipe (touch) on the list area switches to the neighbouring content type.
 let drag=null,suppressUntil=0;
 const scrollsSideways=(el,stop)=>{for(let n=el;n&&n!==stop;n=n.parentElement){if(n.scrollWidth>n.clientWidth+2&&/auto|scroll/.test(getComputedStyle(n).overflowX))return true;}return false;};
 document.addEventListener('pointerdown',e=>{
  if(drag||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
  const panel=e.target.closest?.('#app .app-scroll');if(!panel)return;
  const info=tabBar(panel);if(!info||info.index<0||info.bar.contains(e.target))return;
  if(!(info.bar.compareDocumentPosition(e.target)&Node.DOCUMENT_POSITION_FOLLOWING))return;
  if(e.target.closest('input,textarea,select,[contenteditable],summary')||scrollsSideways(e.target,panel))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,scale:scaleOf(panel),panel,info,items:siblingsAfter(info.bar),w:panel.clientWidth,dx:0,locked:false,samples:[{x:e.clientX,t:e.timeStamp}]};
 },true);
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const rx=(e.clientX-drag.x)/drag.scale,ry=(e.clientY-drag.y)/drag.scale;
  if(!drag.locked){
   if(Math.abs(rx)<8&&Math.abs(ry)<8)return;
   // Mostly vertical movement is a normal scroll: never turn it into a tab switch.
   if(Math.abs(rx)<=Math.abs(ry)*1.4){drag=null;return;}
   drag.locked=true;try{drag.panel.setPointerCapture(e.pointerId);}catch{}
   drag.panel.classList.add('is-swiping');getSelection()?.removeAllRanges();
  }
  const next=drag.info.index+(rx<0?1:-1),has=next>=0&&next<drag.info.buttons.length;
  drag.dx=Math.max(-drag.w,Math.min(drag.w,has?rx:rx*.28));
  if(!reduce.matches)for(const n of drag.items)n.style.transform=`translate3d(${drag.dx}px,0,0)`;
  drag.samples.push({x:e.clientX,t:e.timeStamp});while(drag.samples.length>2&&e.timeStamp-drag.samples[0].t>120)drag.samples.shift();
 },{passive:true});
 function endDrag(e,cancelled){
  if(!drag||e.pointerId!==drag.id)return;
  const d=drag;drag=null;
  d.panel.classList.remove('is-swiping');try{d.panel.releasePointerCapture(d.id);}catch{}
  if(!d.locked)return;
  suppressUntil=performance.now()+80;
  const dir=d.dx<0?1:-1,next=d.info.index+dir,has=next>=0&&next<d.info.buttons.length;
  const a=d.samples[0],b=d.samples.at(-1),velocity=(b.x-a.x)/d.scale/Math.max(1,b.t-a.t);
  const flick=Math.abs(velocity)>.45&&Math.abs(d.dx)>24&&Math.sign(velocity)===Math.sign(d.dx);
  if(!cancelled&&has&&(Math.abs(d.dx)>d.w*.22||flick)){
   for(const n of d.items)n.style.transform='';
   swipeDx=d.dx;syntheticClick=true;
   try{d.info.buttons[next].click();}finally{syntheticClick=false;swipeDx=0;}
  }else for(const n of d.items){
   n.style.transform='';
   if(!reduce.matches&&Math.abs(d.dx)>1)animate(n,[{transform:`translate3d(${d.dx}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:220});
  }
 }
 document.addEventListener('pointerup',e=>endDrag(e,false),true);
 document.addEventListener('pointercancel',e=>endDrag(e,true),true);
 // The click that follows a drag must not open whatever card the pointer ended on.
 document.addEventListener('click',e=>{if(!syntheticClick&&performance.now()<suppressUntil){e.stopPropagation();e.preventDefault();}},true);
 document.addEventListener('dragstart',e=>{if(drag?.locked)e.preventDefault();},true);
 reduce.addEventListener('change',()=>{if(reduce.matches)clean();});
 window.FILTRIP_MOTION={prepare,afterRender,clear:clean,scrollTo,limitFor,get reduced(){return reduce.matches;}};
})();
