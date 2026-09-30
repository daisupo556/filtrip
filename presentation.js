/* Chapter-driven presentation. Uses the app's actual controls; never persists its scenario. */
(() => {
 'use strict';
 const q=s=>document.querySelector(s), reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const chapters=[
 {name:'好きを共有する',title:'あなたの/「好き」が、\n誰かの/旅先に/なる。',copy:'誰かの「好き」を通して、\nまだ知らない/世界へ。'},
 {name:'自分の世界',title:'音楽も、/動画も、/読みものも。',copy:'アプリを行き来しなくても、\n好きなものに/出会えます。'},
 {name:'新しい出会い',title:'普段、自分が見ない\nものとの出会いを。',copy:'気になる誰かの視点から、\nいつもと違う/コンテンツを/見つける。'},
 {name:'好きから会話へ',title:'同じ「好き」から、\n話が/広がる。',copy:'気になる人のページから、\nそのまま/話しかけられます。'}
 ];
 // Opening slides shown before chapter 1: text only, one click each.
 const stepIcons=['heart','search','person','bookmark'],stepLabels=['好きを選ぶ','気になる人を探す','その人の世界をのぞく','気に入ったら持ち帰る'];
 const prologue=[
 {title:'気になるあの人の\n“おすすめ欄”、\nのぞいてみたくない？',copy:'好きな人は、/ふだん何を/見ているんだろう。'},
 {title:'あなたのおすすめは、\nあなたの「好き」だけで\nできている。',copy:'見るほど似たものが集まり、/気づけば同じ景色の中。\nこれを“フィルターバブル”と言います。'},
 {title:'FILTRIP =\u00a0/FILTER × TRIP',copy:'誰かのフィルターを借りて、\n泡の外へ/旅に出る。'},
 {title:'好きから、人の世界へ。',copy:'',steps:true}
 ];
 let pIndex=0,opening=false,openingTimers=[],launching=null;
 const STORY_LAUNCH={delay:600,fadeIn:1000,hold:700,fadeOut:600,appear:600};
 const modeKey='filtrip-mode',rememberMode=v=>{try{sessionStorage.setItem(modeKey,v);}catch{}},recalledMode=()=>{try{return sessionStorage.getItem(modeKey);}catch{return null;}};
 let active=false,freeState=null,chapter=0,token=0,paused=false,running=false,phase='intro';
 let chapterEnds=[],advance=null,noteSeen=false,segment=0;
 // Skipping: a click while an operation plays finishes the rest of that segment instantly, then moves to the next explanation.
 // noteLock protects a freshly shown explanation from being skipped before it can be read; skipLock stops a burst of clicks from skipping a second one.
 let skip=false,noteLock=0,skipLock=0,skipWaiter=null;const NOTE_LOCK=650,SKIP_LOCK=900;
 const intro=q('#chapter-intro'),controls=q('#story-controls'),pointer=q('#story-pointer');
 const copy=document.createElement('div');copy.id='story-copy';copy.setAttribute('aria-live','polite');q('#guide').append(copy);
 q('#chapter-select').innerHTML=chapters.map((c,i)=>`<option value="${i}">${i+1}　${c.name}</option>`).join('');
 // '/' marks a place where a line may break (phrase unit); '\n' forces a break. Long copy never splits mid-phrase.
 const ph=t=>escapeHTML(t).split('\n').map(line=>line.split('/').filter(Boolean).map(x=>`<span class="ph">${x}</span>`).join('')).join('<br>');
 function status(text){q('#story-status').textContent=text;}
 function stop(){if(advance){const pending=advance;advance=null;pending(false);}window.FILTRIP_APP_UI?.close();token++;running=false;paused=false;skip=false;skipWaiter=null;pointer.hidden=true;q('#story-pause').textContent='一時停止';}

 // Headings break only where the copy says so ('\n'); each line stays on one line and the font shrinks to fit the column.
 function fitHeading(el,minRatio=.6){if(!el||!el.clientWidth)return;el.classList.add('fit-nowrap');el.style.fontSize='';const base=parseFloat(getComputedStyle(el).fontSize);let size=base;while(el.scrollWidth>el.clientWidth+.5&&size>base*minRatio){size-=.5;el.style.fontSize=size+'px';}if(el.scrollWidth>el.clientWidth+.5){el.classList.remove('fit-nowrap');el.style.fontSize='';}}
 function fitHeadings(){fitHeading(q('#intro-title'));fitHeading(q('#story-copy h2'));fitHeading(q('#guide-content h2'));}
 addEventListener('resize',fitHeadings);{const gc=q('#guide-content');if(gc)new MutationObserver(()=>fitHeading(gc.querySelector('h2'))).observe(gc,{childList:true});}
document.fonts?.ready?.then(fitHeadings);

 // Images: story mode never shows a half-loaded thumbnail. Scene images are prefetched during the opening slides;
 // each scene waits (with a cap) for the images in view to finish decoding, and anything still loading stays blank until ready.
 const mediaReady=new Map(),GATE_MS=4000,CLICK_GATE_MS=2500;
 const absUrl=u=>{try{return new URL(u,location.href).href;}catch{return u;}};
 function preload(u){u=absUrl(u);if(!mediaReady.has(u)){const im=new Image();im.decoding='async';im.src=u;mediaReady.set(u,{done:false,p:(im.decode?im.decode():new Promise(r=>{im.onload=r;})).catch(()=>{}).then(()=>{mediaReady.get(u).done=true;})});}return mediaReady.get(u).p;}
 const mediaUrl=el=>absUrl(el.getAttribute('href')||el.getAttribute('src')||'');
 function urlsIn(html){const out=[];String(html).replace(/(?:href|src)="([^"]+\.(?:png|webp|jpe?g|gif|svg))"/g,(m,u)=>{out.push(u);return m;});return out;}
 function visibleMedia(){const app=q('#app');if(!app)return[];const box=(q('#app .app-scroll')||app).getBoundingClientRect();return [...app.querySelectorAll('image,img')].filter(el=>!el.closest('.motion-outgoing')).filter(el=>{const r=(el.closest('svg')||el).getBoundingClientRect();return r.width>0&&r.bottom>box.top&&r.top<box.bottom&&r.right>box.left&&r.left<box.right;});}
 async function mediaGate(id,ms){if(skip)return;const urls=[...new Set(visibleMedia().map(mediaUrl).filter(Boolean))].filter(u=>!(mediaReady.get(u)?.done));if(!urls.length)return;await Promise.race([Promise.all(urls.map(preload)),new Promise(r=>setTimeout(r,ms))]);assertRun(id);}
 function holdMedia(el){const u=mediaUrl(el);if(!u||mediaReady.get(u)?.done)return;el.style.transition='none';el.style.opacity='0';preload(u).then(()=>{el.style.transition='';void getComputedStyle(el).opacity;el.style.opacity='';});}
 function guardMedia(root){for(const el of root.querySelectorAll?.('image,img')||[])holdMedia(el);}
 {const app=q('#app');if(app)new MutationObserver(list=>{if(!active)return;for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches?.('image,img'))holdMedia(n);else guardMedia(n);}}).observe(app,{childList:true,subtree:true});}
 // Data-side prefetch of what the scenes will show (best effort, never throws).
 function prefetchScenes(){const keep=state;try{const s=structuredClone(state);state=s;s.favorites=['book-0-0','game-0-0'];s.homeMode='recommend';const items=[];
  for(const tab of ['すべて','音楽','動画','記事']){s.homeTab=tab;items.push(...homeItems().slice(0,8));}
  s.personQuery='古着が好きな大学生';s.searchCategories=[];s.searchFilters.genres=[];s.searchFilters.contentTypes=[];s.workQuery='';const ids=searchPeople().map(x=>x.id);s.searchResultIds=ids;
  for(const cid of resultGroup().contentIds.slice(0,40)){const c=contentById(cid);if(c)items.push(c);}
  const topic=contentById('curated-01');if(topic)items.push(topic);const who=people.find(x=>(personLikes.get(x.id)||[]).includes('curated-01'))||people[0];
  for(const cid of (personLikes.get(who.id)||[]).slice(0,6)){const c=contentById(cid);if(c)items.push(c);}
  const urls=[];for(const c of items)urls.push(...urlsIn(thumb(c)));for(const x of [...ids.map(personById),who])urls.push(...urlsIn(avatar(x)));
  state=keep;const list=[...new Set(urls.map(absUrl))];let i=0;const lane=async()=>{while(i<list.length)await preload(list[i++]);};lane();lane();}catch(e){state=keep;}}
 const PLAYING='操作を紹介しています。クリックで次へ';
 function finishSkip(){skip=false;skipLock=performance.now()+SKIP_LOCK;}
 function requestSkip(){const t=performance.now();if(!running||skip||t<noteLock||t<skipLock)return;skip=true;paused=false;q('#story-pause').textContent='一時停止';pointer.hidden=true;skipWaiter?.();}
 // Launch animation: a skip removes the splash at once so the welcome screen never lingers.
 async function launch(id){const done=launching||window.FILTRIP_APP_UI.playWelcome(STORY_LAUNCH);launching=null;await Promise.race([done,new Promise(r=>{skipWaiter=r;})]);skipWaiter=null;if(skip){const w=q('#app .welcome');if(w){w.querySelector('.launch-splash')?.remove();w.classList.remove('welcome-launching');w.querySelectorAll('button').forEach(b=>{b.disabled=false;});}}assertRun(id);}
 function assertRun(id){if(!active||id!==token)throw new Error('cancelled');}
 async function wait(ms,id){let left=ms;while(left>0&&!skip){assertRun(id);await new Promise(r=>setTimeout(r,40));if(!paused)left-=40;}assertRun(id);}
 function setCopy(title,body){noteLock=performance.now()+NOTE_LOCK;copy.innerHTML=`<h2>${ph(title)}</h2><p class="description">${ph(body)}</p>`;fitHeading(copy.querySelector('h2'));if(!reduced())copy.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});}
 function seed(index){
 const prior=index>0?chapterEnds[index-1]:null;
 if(prior)state=structuredClone(prior);
 else{state=newState();state.profile={nickname:'はる',age:'24',job:'会社員',region:'東京都',gender:'',portraitIndex:2};state.age='20代';state.answers=[0,1,0,1,0,1,0,1,0,1,0,1];if(index>0)state.favorites=['book-0-0','game-0-0'];}
 chapterEnds.length=index;state.guideOn=true;state.history=[];state.quizPage=0;state.screen=['welcome','home','search','home'][index];render();
 }
 function introChapter(index){stop();chapter=Math.max(0,Math.min(chapters.length-1,index));phase='intro';seed(chapter);document.body.classList.add('story-intro');intro.hidden=false;q('.presentation').inert=true;controls.hidden=false;q('#intro-index').textContent=`${chapter+1} / ${chapters.length}　${chapters[chapter].name}`;q('#intro-title').innerHTML=ph(chapters[chapter].title);q('#intro-copy').innerHTML=ph(chapters[chapter].copy);fitHeading(q('#intro-title'));q('#chapter-select').value=String(chapter);q('#story-prev').disabled=false;const sb=q('#intro-steps');if(sb)sb.hidden=true;q('#intro-copy').hidden=false;replayIntro();q('#story-next').disabled=false;q('#story-next').textContent='→';q('#story-pause').disabled=true;status('クリックで進む');intro.tabIndex=0;intro.focus({preventScroll:true});}
 // Opening: starts from a blank white page; the catch fades in slowly (headline, then sub-line), then the header and controls.
 function finishOpening(){if(!opening)return;opening=false;openingTimers.forEach(clearTimeout);openingTimers=[];for(const el of [q('#intro-title'),q('#intro-copy')]){el.getAnimations().forEach(a=>a.cancel());el.style.opacity='';}document.body.classList.remove('story-opening');}
 function startOpening(){const t=q('#intro-title'),c=q('#intro-copy');if(reduced()){document.body.classList.remove('story-opening');return;}opening=true;t.style.opacity='0';c.style.opacity='0';const rise=[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],at=(ms,fn)=>openingTimers.push(setTimeout(fn,ms));at(700,()=>{t.style.opacity='';t.animate(rise,{duration:950,easing:'ease-out',fill:'backwards'});});at(1650,()=>{c.style.opacity='';c.animate(rise,{duration:900,easing:'ease-out',fill:'backwards'});});at(2650,finishOpening);}
 function stepsBox(){let box=q('#intro-steps');if(!box){box=document.createElement('ol');box.id='intro-steps';box.className='intro-steps';box.hidden=true;q('#intro-copy').before(box);}return box;}
 function replayIntro(){const inner=q('.chapter-intro-inner');if(!inner||reduced())return;inner.style.animation='none';void inner.offsetWidth;inner.style.animation='';}
 function showPrologue(index,first=false){finishOpening();stop();pIndex=Math.max(0,Math.min(prologue.length-1,index));chapter=0;phase='prologue';seed(0);const slide=prologue[pIndex];document.body.classList.add('story-intro');intro.hidden=false;q('.presentation').inert=true;controls.hidden=false;q('#intro-title').innerHTML=ph(slide.title);q('#intro-copy').innerHTML=ph(slide.copy);fitHeading(q('#intro-title'));q('#intro-copy').hidden=!slide.copy;const box=stepsBox();box.hidden=!slide.steps;box.innerHTML=slide.steps?stepLabels.map((t,i)=>`<li><span class="step-icon">${functionalIcon(stepIcons[i])}</span><b>${t}</b></li>`).join(''):'';q('#chapter-select').value='0';q('#story-prev').disabled=pIndex===0;q('#story-next').disabled=false;q('#story-next').textContent='→';q('#story-pause').disabled=true;status('クリックで進む');if(first){startOpening();prefetchScenes();}else replayIntro();intro.tabIndex=0;intro.focus({preventScroll:true});}
 function enter(){if(active)return;freeState=structuredClone(state);chapterEnds=[];active=true;window.FILTRIP_PRESENTING=true;q('.phone').inert=true;document.body.dataset.mode='story';document.body.classList.remove('guide-hidden');q('.mode-switch [data-mode=story]').setAttribute('aria-pressed','true');q('.mode-switch [data-mode=free]').setAttribute('aria-pressed','false');rememberMode('story');showPrologue(0,true);dispatchEvent(new Event('resize'));}
 function leave(){if(!active)return;stop();active=false;window.FILTRIP_PRESENTING=false;q('.phone').inert=false;document.body.dataset.mode='free';document.body.classList.remove('story-intro');intro.hidden=true;controls.hidden=true;q('.presentation').inert=false;state=newState();freeState=null;rememberMode('free');persist();render();q('.mode-switch [data-mode=story]').setAttribute('aria-pressed','false');q('.mode-switch [data-mode=free]').setAttribute('aria-pressed','true');dispatchEvent(new Event('resize'));q('.mode-switch [data-mode=free]').focus({preventScroll:true});}
 // Smooth scroll via FILTRIP_MOTION.scrollTo (instant when motion is reduced or a skip is running).
 async function smooth(el,top,id,duration){const max=Math.max(0,el.scrollHeight-el.clientHeight),end=Math.max(0,Math.min(top,max));if(skip||!window.FILTRIP_MOTION?.scrollTo){el.scrollTop=end;return;}const done=window.FILTRIP_MOTION.scrollTo(el,end,{duration});await Promise.race([done,new Promise(r=>{skipWaiter=r;})]);skipWaiter=null;if(skip){el._scrollAnim=null;el.scrollTop=end;}assertRun(id);}
 async function target(selector,id){await wait(40,id);let el=q(selector);for(let n=0;!el&&n<40;n++){await new Promise(r=>setTimeout(r,25));assertRun(id);el=q(selector);}if(!el)throw new Error('操作対象が見つかりません: '+selector);const scroll=el.closest('.app-scroll,.sheet-options');if(scroll){const a=el.getBoundingClientRect(),b=scroll.getBoundingClientRect();if(a.top<b.top+8||a.bottom>b.bottom-8){await smooth(scroll,scroll.scrollTop+(a.top+a.height/2)-(b.top+b.height/2),id);await wait(100,id);}}return el;}
 async function mark(el,id){if(skip){pointer.hidden=true;return;}const r=el.getBoundingClientRect();pointer.hidden=false;pointer.style.left=`${r.left+r.width*.65}px`;pointer.style.top=`${r.top+r.height*.5}px`;pointer.classList.remove('press');await wait(100,id);pointer.classList.add('press');await wait(100,id);pointer.hidden=true;}
 async function click(selector,id){const el=await target(selector,id);if(el.disabled)throw new Error('操作対象が無効です: '+selector);await mark(el,id);el.click();await wait(320,id);await mediaGate(id,CLICK_GATE_MS);}
 async function type(selector,value,id){let el=await target(selector,id);el.focus({preventScroll:true});await mark(el,id);el.value='';for(const letter of value){await wait(55,id);el.value+=letter;el.dispatchEvent(new Event('input',{bubbles:true}));}el.blur();await wait(180,id);}
 async function select(selector,value,id){const el=q(selector),trigger=el?.nextElementSibling;if(trigger?.classList.contains('device-select')){await click(selector+' + .device-select',id);const index=[...el.options].findIndex(o=>o.value===value);await click(`[data-option-index="${index}"]`,id);}else{const input=await target(selector,id);await mark(input,id);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));await wait(260,id);}}

 async function scrollContent(distance,id){const el=q('#app .app-scroll');await smooth(el,el.scrollTop+distance,id,650);await wait(80,id);await mediaGate(id,CLICK_GATE_MS);}
 async function reply(text,id){const panel=q('#app .app-scroll'),typing=document.createElement('div');typing.className='story-typing';typing.textContent=personById(state.chatId).name+'が入力中…';panel.append(typing);await smooth(panel,panel.scrollHeight,id);await wait(1000,id);typing.remove();state.threads[state.chatId].push({text,mine:false,time:'今',sentAt:Date.now()});render(true);await smooth(q('#app .app-scroll'),q('#app .app-scroll').scrollHeight,id);await wait(350,id);}
 async function gate(id){assertRun(id);if(skip){finishSkip();return;}phase='waiting';q('#story-pause').disabled=true;q('#story-next').disabled=false;q('#story-next').textContent='→';status('クリックで進む');q('#story-next').focus({preventScroll:true});const proceed=await new Promise(resolve=>advance=resolve);assertRun(id);if(!proceed)throw new Error('cancelled');phase='playing';q('#story-next').disabled=false;q('#story-pause').disabled=false;status(PLAYING);}
 async function note(title,body,id){if(noteSeen){await gate(id);if(!reduced()){copy.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});await wait(160,id);}copy.getAnimations().forEach(a=>a.cancel());}noteSeen=true;segment++;setCopy(title,body);await wait(reduced()?40:260,id);}

 async function run(){if(!active||running)return;if(phase!=='intro'){introChapter(chapter);}const id=++token;running=true;paused=false;phase='playing';status('画像を読み込んでいます…');noteSeen=false;segment=0;skip=false;noteLock=performance.now()+1000;q('#story-next').disabled=false;q('#story-pause').disabled=false;copy.innerHTML='';
 try{
 if(chapter>0){await mediaGate(id,GATE_MS);}status(PLAYING);
 if(!reduced())intro.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out'});await wait(reduced()?40:180,id);if(chapter===0)launching=window.FILTRIP_APP_UI.playWelcome(STORY_LAUNCH);document.body.classList.remove('story-intro');intro.hidden=true;q('.presentation').inert=false;q('#story-next').focus({preventScroll:true});await wait(350,id);
 if(chapter===0){
 // Name, age, job, region, icon and the 12 diagnosis answers are already filled in seed(); only the favourites are shown.
 await note('好きな作品を選ぶと、\nあなたのフィルターになる。','本もゲームも、\nジャンルをまたいで選べます。',id);
 await launch(id);await wait(300,id);
 const begin=await target('[data-action=start]',id);await mark(begin,id);state.favoriteMode='onboarding';go('favorites',{guided:true});await wait(450,id);
 await click('[data-category=book]',id);await scrollContent(380,id);await click('[data-work="'+works.find(w=>w.title==='こころ').id+'"]',id);await click('.favorite-switcher [data-category=game]',id);await scrollContent(380,id);await click('[data-work="'+works.find(w=>w.title==='ポケットモンスター スカーレット・バイオレット').id+'"]',id);await wait(500,id);
 }else if(chapter===1){
 await note('好きなものが、\nひとつの場所に集まる。','音楽も動画も記事も、\n掲載元をまたいで並びます。',id);
 await click('[data-home-tab="音楽"]',id);await scrollContent(310,id);await click('[data-home-tab="動画"]',id);await scrollContent(390,id);await click('[data-home-tab="記事"]',id);await scrollContent(260,id);await wait(400,id);
 }else if(chapter===2){
 await note('「こんな人」の目で/見てみる。','服の好みや立場からでも、\n気になる人を探せます。',id);
 await type('#person-query','古着が好きな大学生',id);await click('[data-action=search-run]',id);await click('[data-action=open-result-world]',id);
 await note('古着から探し始めたのに、\nカフェやビートの動画や記事へ。','人を経由すると、服から喫茶店やビートメイクまで、\nジャンルを越えて広がります。',id);
 await click('[data-tab="動画"]',id);await scrollContent(350,id);await click('[data-tab="記事"]',id);await scrollContent(240,id);await click('.world-feed [data-action=detail]',id);
 await note('なぜ出会えたのかが/分かる。','何人が好きか、/自分とどこが重なるかを確かめてから、/自分の世界へ持ち帰ります。',id);
 await click('[data-action=why-current]',id);await click('.action-foot [data-action=add]',id);await click('[data-action=show-mine]',id);
 }else{
 const topic=contentById('curated-01');const person=people.find(p=>(personLikes.get(p.id)||[]).includes(topic.id))||people[0];
 await note('コンテンツの先に、\nそれを好きな人がいる。','同じ動画を好きな人のページへ。\nその人の「好き」を、フォローできます。',id);
 openProfile(person.id);await wait(400,id);if(!state.followIds.includes(person.id))await click('[data-action=follow]',id);
 await note('「このコンテンツ、\n好きなんですか？」','見つけた一本をきっかけに、\n選び方や楽しみ方を話してみる。',id);
 state.storySharedContent=topic.id;openThread(person.id);await wait(350,id);await type('#thread-input','はじめまして！「'+topic.title+'」、好きなんですか？',id);await click('[data-v3-thread] button',id);
 await reply('はじめまして！ 好きです、何回も見ちゃいました。動かなかったものが点いた瞬間って、ほんとにうれしいんですよね。',id);
 await note('好きな理由を聞くと、\n次に見たいものが増える。','作品の感想から、その人の視点へ。\n話の続きを、自分の次の発見につなげます。',id);
 await type('#thread-input','わかります！ 私も画面が点いたところで声出ました。ふだんも修理の動画、よく見るんですか？',id);await click('[data-v3-thread] button',id);
 await reply('見ます見ます(笑) 道具の手入れとか、古い機械の掃除とか。完成したところより、手を動かしてる途中のほうが好きで。',id);
 await gate(id);setCopy('次は、あなたの視点で。','気になる人の世界を、\n自由に旅してみてください。');segment++;
 }

 assertRun(id);chapterEnds[chapter]=structuredClone(state);running=false;if(skip&&chapter<chapters.length-1){finishSkip();introChapter(chapter+1);return;}skip=false;phase='done';q('#story-next').disabled=false;q('#story-next').textContent=chapter===chapters.length-1?'自由に操作する →':'→';pointer.hidden=true;q('#story-pause').disabled=true;status(chapter===chapters.length-1?'クリックで自由に操作':'クリックで進む');q('#story-next').focus({preventScroll:true});
 }catch(error){if(error.message==='cancelled')return;running=false;phase='error';pointer.hidden=true;q('#story-pause').disabled=true;status('操作を再開できませんでした。「もう一度」でこの章を再生できます。');console.error(error);}
 }
 document.addEventListener('click',event=>{const mode=event.target.closest('.mode-switch [data-mode]')?.dataset.mode;if(mode==='story')enter();if(mode==='free')leave();});
 function advanceStory(){if(opening){finishOpening();return;}if(phase==='prologue'){if(pIndex<prologue.length-1)showPrologue(pIndex+1);else introChapter(0);return;}if(phase==='playing'){requestSkip();return;}if(performance.now()<skipLock)return;if(phase==='waiting'&&advance){const pending=advance;advance=null;q('#story-next').disabled=false;pending(true);}else if(phase==='intro')run();else if(phase==='done'){if(chapter===chapters.length-1)leave();else introChapter(chapter+1);}}
 // One click advances one segment. A click during an animation finishes that segment instantly and moves on; extra clicks in a burst are ignored, never queued.
 document.addEventListener('click',event=>{if(!active||!event.isTrusted||event.target.closest('.mode-switch,.story-controls,.brand'))return;event.preventDefault();event.stopImmediatePropagation();advanceStory();},true);
 document.addEventListener('keydown',event=>{if(!active||!event.isTrusted)return;const onNext=event.target.matches?.('#story-next');if(event.target.closest('button,select,input,a')&&!(onNext&&event.key==='ArrowRight'))return;if(['ArrowRight',' ','Enter'].includes(event.key)){event.preventDefault();advanceStory();}},true);
 q('#story-start').onclick=advanceStory;q('#story-replay').onclick=()=>phase==='prologue'?showPrologue(pIndex):introChapter(chapter);q('#story-prev').onclick=()=>{if(phase==='prologue')showPrologue(pIndex-1);else if(chapter===0&&phase==='intro')showPrologue(prologue.length-1);else introChapter(chapter-1);};q('#story-next').onclick=advanceStory;q('#chapter-select').onchange=e=>introChapter(Number(e.target.value));q('#story-pause').onclick=()=>{if(!running)return;paused=!paused;q('#story-pause').textContent=paused?'再生する':'一時停止';status(paused?'一時停止中':'操作を紹介しています。');};
 addEventListener('pagehide',()=>{if(active){window.FILTRIP_PRESENTING=true;}});
 document.body.dataset.mode='free';
 // Exposed read-only progress supports verification without skipping the actual interactions.
 window.FILTRIP_STORY={get progress(){return {active,chapter,phase,running,paused,segment,prologue:pIndex,opening}},get ends(){return structuredClone(chapterEnds)}};
 if(recalledMode()==='free'){document.body.classList.remove('story-opening');}else enter();
})();
