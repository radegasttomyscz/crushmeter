(() => {
 'use strict';
 const {storage,escapeHTML:E,toast,confirmAction,share}=window.CM;
 const {icon:I,initials,restore,wireLobby}=window.CM_PLAY;
 const categories=window.CM_DATA.categories;
 const all=categories.flatMap(c=>c.terms.map(t=>({...t,category:c.name,categoryId:c.id})));
 const modes={popis:'Popis',pantomima:'Pantomima',kresleni:'Kreslení'};
 const help={popis:'Popiš ho bez hledaného slova a jeho částí.',pantomima:'Jen gesta a mimika. Ani slovo.',kresleni:'Kresli prstem. Bez písmen a číslic.'};
 const form=document.getElementById('guess-setup'),setup=document.getElementById('game-setup'),stage=document.getElementById('game-stage');
 let used=new Set(storage.get('guess.used',[])),s=null,timer=null,deadline=null,paths=[],observer=null,launching=false;
 restore(form,'guess');
 const query=new URLSearchParams(location.search).get('tema');if(categories.some(c=>c.id===query))form.elements.category.value=query;
 const names=storage.get('guess.names',['','']);form.elements.player1.value=names[0]||'';form.elements.player2.value=names[1]||'';
 function valid(value){return value&&Array.isArray(value.players)&&value.players.length===2&&value.players.every(p=>typeof p==='string')&&Number.isInteger(value.index)&&value.index>=0&&Number.isInteger(value.total)&&value.total>=2&&value.index<=value.total&&Number.isInteger(value.correct)&&value.correct>=0&&value.correct<=value.index&&[30,60,90].includes(value.duration)&&['mix','popis','pantomima','kresleni'].includes(value.mode)&&(value.category==='mix'||categories.some(c=>c.id===value.category))&&value.round&&['hidden','ready','running','paused','done'].includes(value.round.phase)&&all.some(t=>t.key===value.round.key)&&[0,1].includes(value.round.speaker)}
 let saved=storage.get('guess.session',null);if(!valid(saved))saved=null;
 const pool=cat=>all.filter(t=>(cat==='mix'||t.categoryId===cat)&&!used.has(t.key));
 function save(){if(s){s.round.paths=paths;storage.set('guess.session',s)}storage.set('guess.used',[...used])}
 function updateCount(){const count=new Set(pool(form.elements.category.value).map(t=>t.key)).size;document.getElementById('available-count').textContent=count+' nehraných pojmů v balíčku';form.querySelector('[type="submit"]').disabled=count<2}
 function updateResume(){document.getElementById('resume-box').hidden=!saved||saved.finished;if(saved)document.getElementById('resume-detail').textContent='Kolo '+Math.min(saved.index+1,saved.total)+' / '+saved.total+' · '+saved.players.join(' + ')}
 function focusScreen(){stage.querySelector('.game-heading')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
 function syncTime(){if(deadline!==null&&s&&s.round.phase==='running')s.round.remainingMs=Math.max(0,deadline-Date.now())}
 function stopTimer(){syncTime();clearInterval(timer);timer=null;deadline=null}
 function updateTimer(){if(!s)return;const el=document.getElementById('timer-value');if(!el)return;const secs=Math.ceil(s.round.remainingMs/1000);el.textContent=String(secs);const dial=stage.querySelector('.game-timer');if(dial){dial.style.setProperty('--remaining',Math.max(0,s.round.remainingMs/(s.duration*1000)*100)+'%');dial.classList.toggle('urgent',secs<=10)}}
 function startClock(){deadline=Date.now()+s.round.remainingMs;timer=setInterval(()=>{syncTime();updateTimer();if(s.round.remainingMs<=0){navigator.vibrate?.([120,80,120]);finish('timeout')}},100)}
 function freshRound(){const available=pool(s.category);if(!available.length){s.total=s.index;s.finished=true;save();return}const term=available[Math.floor(Math.random()*available.length)];s.round={...term,speaker:s.index%2,mode:s.mode==='mix'?['popis','pantomima','kresleni'][s.index%3]:s.mode,phase:'hidden',remainingMs:s.duration*1000,result:null,drawOpen:false,peek:false,paths:[]};paths=[];save()}
 function activate(){setup.hidden=true;stage.hidden=false;document.body.classList.add('game-active');render();focusScreen()}
 function back(){stopTimer();stage.hidden=true;setup.hidden=false;document.body.classList.remove('game-active');s=null;saved=storage.get('guess.session',null);if(!valid(saved))saved=null;updateResume();updateCount();lobby.summary();window.scrollTo({top:0,behavior:'instant'});const heading=document.getElementById('setup-title');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
 function person(i){return `<span class="avatar avatar-${i}" aria-hidden="true">${E(initials(s.players[i]))}</span>`}
 function shell(content){const r=s.round,round=Math.min(r.phase==='done'?s.index:s.index+1,s.total);stage.dataset.phase=s.finished?'result':r.phase;stage.dataset.mode=r.mode;
  stage.innerHTML=`<div class="game-toolbar"><a href="/" class="session-brand" aria-label="CrushMeter – hlavní stránka">crushmeter<span>.</span></a><button class="pause-button" data-action="${s.finished?'menu':r.phase==='running'?'pause':'menu'}">${I(s.finished?'cards':r.phase==='running'?'pause':'gear')}<span>${s.finished?'Změnit hru':r.phase==='running'?'Pauza':'Nastavení'}</span></button></div><div class="game-match"><div class="team-players">${person(0)}${person(1)}<span>VÁŠ TÝM<strong>${E(s.players[0])} + ${E(s.players[1])}</strong></span></div><div class="team-score">${I('star')}<strong>${s.correct}</strong><small>${s.correct===1?'BOD':s.correct>=2&&s.correct<=4?'BODY':'BODŮ'}</small></div></div><div class="round-meter"><span>${s.finished?'DOHRÁNO':`KOLO <b>${round}</b> / ${s.total}`}</span><div class="round-track" aria-label="${s.index} z ${s.total} kol dokončeno">${Array.from({length:s.total},(_,i)=>`<span class="${i<s.index?'done':i===s.index&&!s.finished?'current':''}"></span>`).join('')}</div></div>${content}`;
 }
 function render(){
  stopTimer();observer?.disconnect();observer=null;if(!s)return;if(s.finished){result();return}
  const r=s.round,name=E(s.players[r.speaker]),other=E(s.players[1-r.speaker]);let content='';
  if(r.phase==='hidden'){
   content=`<section class="turn-screen"><span class="turn-label">TELEFON SI BERE</span><h2 class="game-heading" tabindex="-1">${name}<span class="turn-underline" aria-hidden="true"></span></h2><div class="turn-roles">${I(r.mode)}<span>Teď přijde <strong>${modes[r.mode].toLocaleLowerCase('cs')}</strong></span></div><button class="mystery-card" data-action="reveal" aria-label="Tajně odhalit pojem"><span class="mystery-corner">CRUSH<br>METER</span><span class="mystery-glyph" aria-hidden="true">?</span><span class="mystery-tap">${I('lock')} KLEPNI A ODHAL</span><span class="mystery-star" aria-hidden="true">✳</span></button><p class="turn-help"><strong>${other}</strong> se zatím nedívá.<br>Pojem je jen pro napovídače.</p></section>`;
  }else if(r.phase==='done'){
   const hit=r.result==='correct';content=`<section class="round-feedback ${hit?'feedback-hit':'feedback-miss'}"><div class="feedback-stamp">${I(hit?'check':r.result==='timeout'?'clock':'repeat')}</div><span class="game-kicker">${hit?'+1 SPOLEČNÝ BOD':r.result==='timeout'?'ČAS VYPRŠEL':'TENTOKRÁT BEZ BODU'}</span><h2 class="game-heading" tabindex="-1">${hit?'Máte to!':r.result==='timeout'?'O fous.':'Jdeme dál.'}</h2><div class="feedback-term"><small>BYL TO POJEM</small><strong>${E(r.text)}</strong></div><p>${s.index>=s.total?'Poslední kolo je za vámi. Jdeme spočítat body.':`Další napovídá <strong>${E(s.players[s.index%2])}</strong>.<br>Teď si vyměňte role.`}</p><button class="arcade-button" data-action="next">${s.index>=s.total?'Jak jsme dopadli?':'Další kolo'} ${I('arrow')}</button></section>`;
  }else if(r.phase==='paused'){
   content=`<section class="pause-screen"><div class="pause-illustration">${I(r.peek?'lock':'pause')}</div><span class="game-kicker">${r.peek?'JEN PRO NAPOVÍDAČE':'NIKAM NESPĚCHÁME'}</span><h2 class="game-heading" tabindex="-1">${r.peek?E(r.text):'Pauza.'}</h2><p>${r.peek?'Druhý hráč se teď nedívá. Po pokračování pojem znovu schováme.':'Čas stojí. Telefon zůstává u napovídače.'}</p><span class="paused-time">Zbývá ${Math.ceil(r.remainingMs/1000)} sekund</span><button class="arcade-button" data-action="start">${r.mode==='kresleni'?'Zpět ke kreslení':'Pokračovat v kole'} ${I('arrow')}</button><button class="subtle-button" data-action="menu">Uložit a vrátit se k nastavení</button></section>`;
  }else{
   const ready=r.phase==='ready',drawing=r.mode==='kresleni'&&r.drawOpen&&!ready;
   content=`<section class="live-round ${drawing?'is-drawing':''}"><div class="live-round-head"><span class="mode-token">${I(r.mode)}${modes[r.mode]}</span><span class="live-speaker">${name} napovídá</span></div>${ready?`<div class="word-card ready-word"><span class="game-kicker">${E(r.category)}</span><h2 class="game-heading" tabindex="-1">${E(r.text)}</h2><p>${help[r.mode]}</p><span class="word-card-corner" aria-hidden="true">✳</span></div><div class="ready-note">${I('clock')} Čas začne až po klepnutí.</div><button class="arcade-button" data-action="start">Spustit kolo <span class="button-time">${s.duration} s ${I('arrow')}</span></button><button class="subtle-button" data-action="skip">Tenhle pojem přeskočit ↷</button>`:`<div class="timer-row"><div class="game-timer" role="timer" aria-live="off" aria-label="Zbývající čas"><span id="timer-value"></span><small>SEKUND</small></div><span class="timer-instruction">${drawing?'Čáry místo slov.':help[r.mode]}</span></div>${drawing?'<div class="drawing-board"><div class="drawing-topline"><span>KRESLÍ '+name+'</span><button data-action="erase" aria-label="Smazat kresbu">'+I('repeat')+'</button></div><canvas id="drawing" aria-label="Kreslicí plocha. Kreslete prstem nebo myší."></canvas><button class="peek-word" data-action="peek">'+I('lock')+' Připomenout pojem (pozastaví čas)</button></div>':`<div class="word-card live-word"><span class="game-kicker">${E(r.category)}</span><h2 class="game-heading" tabindex="-1">${E(r.text)}</h2><span class="word-card-corner" aria-hidden="true">✳</span></div>`}<div class="live-actions"><button class="arcade-button got-it" data-action="correct">${I('check')} Máme to!</button><button class="skip-round" data-action="skip" aria-label="Přeskočit kolo">${I('repeat')}<span>Přeskočit</span></button></div>`}</section>`;
  }
  shell(content);updateTimer();if(r.drawOpen&&r.phase==='running')setupDrawing();if(r.phase==='running')startClock();
 }
 function finish(outcome){if(!s||!['ready','running','paused'].includes(s.round.phase))return;syncTime();if(outcome==='correct'&&s.round.remainingMs<=0)outcome='timeout';stopTimer();const r=s.round;r.phase='done';r.result=outcome;if(outcome==='correct'){s.correct++;navigator.vibrate?.(30)}s.history=s.history||[];s.history.push({text:r.text,mode:r.mode,result:outcome});s.index++;save();render();focusScreen()}
 function result(){const good=s.correct,total=s.total,percent=total?good/total:0;
  shell(`<section class="game-result"><div class="trophy-illustration">${I('cup')}<span aria-hidden="true">✳</span></div><span class="game-kicker">VÁŠ TÝM DOHRÁL</span><h2 class="game-heading" tabindex="-1">${good===total?'Bez jediného zaváhání.':percent>=.6?'Tohle vám spolu jde.':'Příště to rozbalíte.'}</h2><div class="result-ticket"><span>UHODNUTÉ POJMY</span><strong>${good}<small> / ${total}</small></strong><div class="result-stars" aria-hidden="true">${[1,2,3].map((_,i)=>`<span class="${percent>=[.01,.4,.8][i]?'earned':''}">${I('star')}</span>`).join('')}</div></div><p class="team-thanks">${E(s.players[0])} + ${E(s.players[1])}<br>Jeden tým. Jeden společný výsledek.</p><button class="arcade-button" data-action="again">Dáme odvetu? ${I('repeat')}</button><button class="subtle-button share-button" data-action="share">Pochlubit se výsledkem ↗</button><button class="subtle-button" data-action="menu">Změnit hráče nebo nastavení</button></section>${s.history?.length?`<details class="game-recap"><summary>Jaké pojmy padly? <span>${s.history.length} kol</span></summary><div>${s.history.map(h=>`<p><span class="recap-dot ${h.result==='correct'?'hit':''}">${I(h.result==='correct'?'check':'repeat')}</span><strong>${E(h.text)}</strong><small>${modes[h.mode]}</small></p>`).join('')}</div></details>`:''}<a class="other-game-link" href="/jak-dobre-se-znate.html">A jak dobře se znáte? Zkusit druhou hru →</a>${['cestovani-a-dovolena','mista-a-staty'].includes(s.category)?'<p class="game-trip">Tip z Putování světem: <a href="https://putovanisvetem.cz/kam-vyrazit/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=vysledek_hry" target="_blank" rel="noopener">Kam spolu vyrazíte příště?</a></p>':''}`);
 }
 function setupDrawing(){
  const canvas=document.getElementById('drawing');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;let currentPath=null;
  function redraw(){const b=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;canvas.width=Math.round(b.width*ratio);canvas.height=Math.round(b.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineWidth=4;ctx.strokeStyle='#30263e';ctx.lineCap='round';ctx.lineJoin='round';for(const path of paths){ctx.beginPath();path.forEach((point,i)=>i?ctx.lineTo(point[0]*b.width,point[1]*b.height):ctx.moveTo(point[0]*b.width,point[1]*b.height));if(path.length===1)ctx.lineTo(path[0][0]*b.width+.1,path[0][1]*b.height+.1);ctx.stroke()}}
  const point=e=>{const b=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,Math.round((e.clientX-b.left)/b.width*10000)/10000)),Math.max(0,Math.min(1,Math.round((e.clientY-b.top)/b.height*10000)/10000))]};
  canvas.addEventListener('pointerdown',e=>{if(s.round.phase!=='running'||paths.length>=150)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);currentPath=[point(e)];paths.push(currentPath);redraw()});
  canvas.addEventListener('pointermove',e=>{if(!currentPath||s.round.phase!=='running')return;e.preventDefault();if(currentPath.length<1500&&paths.reduce((n,p)=>n+p.length,0)<20000)currentPath.push(point(e));redraw()});
  const end=()=>{currentPath=null;save()};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);redraw();if('ResizeObserver'in window){observer=new ResizeObserver(redraw);observer.observe(canvas)}
 }
 async function startGame(){
  if(launching)return;launching=true;
  try{
   const old=storage.get('guess.session',null);if(!s?.finished&&valid(old)&&!old.finished&&!await confirmAction('Začít novou hru?','Rozehraná partie se nahradí novou. Použité pojmy zůstanou v historii.'))return;
   const fd=new FormData(form),category=String(fd.get('category')),count=new Set(pool(category).map(t=>t.key)).size;
   if(count<2){toast('Balíček je vyčerpaný. Vyberte jiné téma nebo obnovte historii v nastavení.');if(s)back();return}
   let total=Math.min(Number(fd.get('rounds')),count);if(total%2)total--;if(total<Number(fd.get('rounds')))toast('Zbývá '+total+' pojmů. Každý dostane stejný počet tahů.');
   const players=[String(fd.get('player1')).trim().slice(0,24)||'Hráč 1',String(fd.get('player2')).trim().slice(0,24)||'Hráč 2'];storage.set('guess.names',players);
   s={players,category,mode:String(fd.get('mode')),duration:Number(fd.get('duration')),total,index:0,correct:0,round:null,finished:false,history:[]};freshRound();activate();
  }finally{launching=false}
 }
 form.addEventListener('submit',e=>{e.preventDefault();startGame()});
 stage.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');if(!button||!stage.contains(button)||!s)return;const action=button.dataset.action,r=s.round;
  if(action==='reveal'&&r.phase==='hidden'){used.add(r.key);r.phase='ready';save();render();focusScreen()}
  else if(action==='start'&&['ready','paused'].includes(r.phase)){r.phase='running';r.peek=false;if(r.mode==='kresleni')r.drawOpen=true;save();render();focusScreen()}
  else if(action==='pause'&&r.phase==='running'){stopTimer();r.phase='paused';r.peek=false;save();render();focusScreen()}
  else if(action==='correct'&&r.phase==='running')finish('correct');
  else if(action==='skip'&&['ready','running','paused'].includes(r.phase))finish('skip');
  else if(action==='next'&&r.phase==='done'){if(s.index>=s.total)s.finished=true;else freshRound();save();render();focusScreen()}
  else if(action==='peek'&&r.mode==='kresleni'&&r.phase==='running'){stopTimer();r.phase='paused';r.peek=true;r.drawOpen=false;save();render();focusScreen()}
  else if(action==='erase'&&r.mode==='kresleni'&&r.phase==='running'){stopTimer();paths=[];save();render()}
  else if(action==='menu'){stopTimer();if(r.phase==='running')r.phase='paused';save();back()}
  else if(action==='again'&&s.finished)startGame();
  else if(action==='share'&&s.finished)share('V Předveď a hádej jsme společně uhodli '+s.correct+' z '+s.total+' pojmů. Dáte víc?','https://crushmeter.cz/predved-a-hadej.html');
 });
 form.elements.category.forEach(el=>el.addEventListener('change',updateCount));
 document.getElementById('resume-game').addEventListener('click',()=>{s=storage.get('guess.session',null);if(!valid(s)){s=null;saved=null;updateResume();toast('Uloženou partii už nelze obnovit.');return}paths=Array.isArray(s.round.paths)?s.round.paths:[];if(s.round.phase==='running')s.round.phase='paused';activate()});
 document.getElementById('discard-game').addEventListener('click',async()=>{if(await confirmAction('Zahodit rozehranou hru?','Použité pojmy zůstanou označené. Smaže se pouze rozehraná partie.')){storage.remove('guess.session');saved=null;updateResume()}});
 document.getElementById('reset-used').addEventListener('click',async()=>{if(!await confirmAction('Znovu losovat stejné pojmy?','Obnoví se historie vybraného tématu. U mixu se obnoví všechny pojmy.'))return;const cat=form.elements.category.value;if(cat==='mix')used.clear();else all.filter(t=>t.categoryId===cat).forEach(t=>used.delete(t.key));storage.set('guess.used',[...used]);updateCount();toast('Pojmy jsou znovu připravené.')});
 document.getElementById('clear-guess-data').addEventListener('click',async()=>{if(!await confirmAction('Smazat data hádací hry?','Smažou se přezdívky, rozehraná hra, nastavení i historie pojmů. Druhá hra zůstane beze změny.'))return;['guess.used','guess.session','guess.names','guess.settings'].forEach(storage.remove);used=new Set();saved=null;form.reset();updateResume();updateCount();lobby.summary();storage.remove('guess.settings');toast('Data hádací hry jsou smazané.')});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&s&&s.round.phase==='running'){stopTimer();s.round.phase='paused';rPeekOff();save();render()}});
 function rPeekOff(){s.round.peek=false}
 window.addEventListener('pagehide',()=>{if(s){stopTimer();if(s.round.phase==='running')s.round.phase='paused';save()}});
 const lobby=wireLobby(form,'guess');updateResume();updateCount();
})();
