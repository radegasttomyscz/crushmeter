(() => {
  'use strict';
  const {storage,escapeHTML:E,toast,confirmAction,share,focusStage}=window.CM;
  const categories=window.CM_DATA.categories;
  const all=categories.flatMap(c=>c.terms.map(t=>({...t,category:c.name,categoryId:c.id})));
  const modes={popis:'Popis',pantomima:'Pantomima',kresleni:'Kreslení'};
  const help={popis:'Vysvětlujte bez hledaného slova a jeho částí.',pantomima:'Jen gesta a mimika. Beze slov.',kresleni:'Kreslete prstem. Bez písmen a číslic.'};
  const form=document.getElementById('guess-setup'),setup=document.getElementById('game-setup'),stage=document.getElementById('game-stage');
  let used=new Set(storage.get('guess.used',[])),s=null,timer=null,deadline=null,paths=[],observer=null;
  let saved=storage.get('guess.session',null);
  if(saved&&(!Array.isArray(saved.players)||saved.players.length!==2||!Number.isInteger(saved.index)||!saved.round))saved=null;
  const query=new URLSearchParams(location.search).get('tema');
  if(categories.some(c=>c.id===query))form.elements.category.value=query;
  const names=storage.get('guess.names',['','']);
  form.elements.player1.value=names[0]||'';form.elements.player2.value=names[1]||'';
  const pool=cat=>all.filter(t=>(cat==='mix'||t.categoryId===cat)&&!used.has(t.key));
  function updateCount(){const count=new Set(pool(form.elements.category.value).map(t=>t.key)).size;document.getElementById('available-count').textContent=count+' nepoužitých pojmů v tomto telefonu.'}
  function save(){if(s)storage.set('guess.session',s);storage.set('guess.used',[...used])}
  function syncTime(){if(deadline!==null&&s&&s.round.phase==='running')s.round.remainingMs=Math.max(0,deadline-Date.now())}
  function stopTimer(){syncTime();clearInterval(timer);timer=null;deadline=null}
  function startClock(){deadline=Date.now()+s.round.remainingMs;timer=setInterval(()=>{syncTime();updateTimer();if(s.round.remainingMs<=0){if(navigator.vibrate)navigator.vibrate([140,90,140]);finish('timeout')}},150)}
  function updateTimer(){const el=document.getElementById('timer-value');if(!el||!s)return;const secs=Math.ceil(s.round.remainingMs/1000);el.textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');el.classList.toggle('urgent',secs<=10)}
  function freshRound(){const available=pool(s.category);if(!available.length){s.total=s.index;s.finished=true;save();return}const term=available[Math.floor(Math.random()*available.length)];s.round={...term,speaker:s.index%2,mode:s.mode==='mix'?['popis','pantomima','kresleni'][s.index%3]:s.mode,phase:'hidden',remainingMs:s.duration*1000,result:null,drawOpen:false};paths=[];save()}
  function activate(){setup.hidden=true;stage.hidden=false;document.body.classList.add('game-active');render();focusStage()}
  function backToSetup(){stopTimer();stage.hidden=true;setup.hidden=false;document.body.classList.remove('game-active');s=null;saved=storage.get('guess.session',null);updateResume();updateCount();setup.scrollIntoView({block:'start'})}
  function updateResume(){document.getElementById('resume-box').hidden=!saved||saved.finished}
  function finish(result){if(!s||!['ready','running','paused'].includes(s.round.phase))return;stopTimer();s.round.phase='done';s.round.result=result;if(result==='correct')s.correct++;s.index++;save();render()}
  function render(){
    stopTimer();if(observer){observer.disconnect();observer=null}if(!s)return;
    if(s.finished){renderResult();return}
    const r=s.round,name=E(s.players[r.speaker]),roundNumber=r.phase==='done'?s.index:s.index+1;
    let card='';
    if(r.phase==='hidden')card=`<div class="stage-card"><span class="eyebrow">Kolo ${roundNumber} · telefon pro napovídače</span><span class="concealed" aria-hidden="true">•••</span><h2>Teď napovídá<br>${name}.</h2><p>Druhý hráč se zatím nedívá. Pojem se ukáže až po klepnutí.</p><button class="button" data-action="reveal">Tajně odhalit pojem ↗</button></div>`;
    else if(r.phase==='done')card=`<div class="stage-card ${r.result==='correct'?'mint':''}"><span class="eyebrow">${r.result==='correct'?'Uhodnuto · společný bod':r.result==='timeout'?'Čas vypršel':'Přeskočeno · bez bodu'}</span><h2>${E(r.text)}</h2><p>${s.index>=s.total?'To bylo poslední kolo. Jak jste dopadli?':'Další kolo napovídá '+E(s.players[s.index%2])+'. Telefon zatím držte u sebe.'}</p><button class="button" data-action="next">${s.index>=s.total?'Zobrazit výsledek':'Další kolo →'}</button></div>`;
    else {
      card=`<div class="stage-card ready-card"><span class="round-mode">${E(r.category)} · ${modes[r.mode]}</span><h2 ${r.drawOpen?'hidden':''}>${E(r.text)}</h2><p ${r.drawOpen?'hidden':''}>${help[r.mode]}</p>${r.phase==='ready'?'<button class="button pink" data-action="start">Spustit '+s.duration+' sekund</button>':''}${r.phase==='paused'?'<p class="notice">Čas je pozastavený. Pokračujte, až budete oba připravení.</p><button class="button" data-action="start">Pokračovat v kole ↗</button>':''}${r.drawOpen?'<div class="canvas-wrap"><canvas id="drawing" aria-label="Kreslicí plocha. Kreslete prstem nebo myší."></canvas></div>':''}${r.mode==='kresleni'&&r.phase!=='ready'?`<div class="drawing-tools"><button class="text-button" data-action="drawing">${r.drawOpen?'Ukázat pojem napovídači':'Skrýt pojem a kreslit'}</button>${r.drawOpen?'<button class="text-button" data-action="erase">Smazat kresbu</button>':''}</div>`:''}</div>`;
      if(r.phase!=='ready')card+=`<div class="timer-bar"><span class="timer-number" id="timer-value" aria-label="Zbývající čas"></span>${r.phase==='running'?'<button class="icon-button" aria-label="Pozastavit čas" data-action="pause">Ⅱ</button>':''}</div><div class="round-actions"><button class="button pink" data-action="correct" ${r.phase==='paused'?'disabled':''}>✓ Uhodnuto</button><button class="button light" data-action="skip">Přeskočit</button></div>`;
      else card+='<div class="round-actions"><button class="button light full-width" data-action="skip">Tenhle pojem přeskočit</button></div>';
    }
    stage.innerHTML=`<div class="stage-top"><span class="round-count">Kolo ${roundNumber} / ${s.total}</span><span>Společně <strong>${s.correct}</strong> ${s.correct===1?'bod':s.correct>=2&&s.correct<=4?'body':'bodů'}</span></div><div class="progress-track" aria-label="Průběh hry"><span style="width:${s.index/s.total*100}%"></span></div>${card}<div class="stage-bottom"><span class="quiet">${r.phase==='hidden'?'Před odhalením se ujistěte, kdo drží telefon.':'Napovídá '+name+' · '+modes[r.mode]}</span><button class="text-button" data-action="menu">Nastavení / přerušit</button></div>`;
    updateTimer();if(r.drawOpen)setupDrawing();if(r.phase==='running')startClock();
  }
  function renderResult(){
    const n=s.total,good=s.correct;
    stage.innerHTML=`<div class="panel result-panel"><span class="eyebrow">Předveď a hádej · hotovo</span><h2>${good===n?'Ani jeden pojem vám neutekl.':good>=n*.6?'Tohle vám šlo spolu.':'Příště už na ně přijdete.'}</h2><div class="result-score">${good}<span class="quiet" style="font-size:2rem"> / ${n}</span></div><p>Společně uhodnutých pojmů.<br>${E(s.players[0])} a ${E(s.players[1])}, díky za hru.</p><div class="result-note">Na který pojem budete ještě chvíli vzpomínat? Ať už ho zachránila nápověda, nebo herecký výkon.</div><div class="result-actions"><button class="button pink" data-action="again">Ještě jednu hru ↗</button><button class="button light" data-action="share">Sdílet výsledek</button></div><p style="margin-top:25px;margin-bottom:0"><a href="/jak-dobre-se-znate.html">Zkusit Jak dobře se znáte?</a></p>${s.category==='cestovani-a-dovolena'||s.category==='mista-a-staty'?'<p style="font-size:.85rem;margin-top:20px;margin-bottom:0">Tip z Putování světem: <a href="https://putovanisvetem.cz/kam-vyrazit/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=vysledek_hry" target="_blank" rel="noopener">Kam společně vyrazit příště?</a></p>':''}</div>`;
  }
  function setupDrawing(){
    const canvas=document.getElementById('drawing');if(!canvas)return;const ctx=canvas.getContext('2d');let current=null;
    function redraw(){const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineWidth=3.5;ctx.strokeStyle='#241d2e';ctx.lineCap='round';ctx.lineJoin='round';for(const path of paths){ctx.beginPath();path.forEach((p,i)=>{if(i===0)ctx.moveTo(p[0]*rect.width,p[1]*rect.height);else ctx.lineTo(p[0]*rect.width,p[1]*rect.height)});if(path.length===1){ctx.lineTo(path[0][0]*rect.width+.1,path[0][1]*rect.height+.1)}ctx.stroke()}}
    const point=e=>{const rect=canvas.getBoundingClientRect();return [(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height]};
    canvas.addEventListener('pointerdown',e=>{if(s.round.phase!=='running')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);current=[point(e)];paths.push(current);redraw()});
    canvas.addEventListener('pointermove',e=>{if(!current)return;e.preventDefault();if(current.length<2000)current.push(point(e));redraw()});
    const end=()=>{current=null};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    redraw();if('ResizeObserver'in window){observer=new ResizeObserver(redraw);observer.observe(canvas)}
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();const fd=new FormData(form),category=String(fd.get('category'));const count=new Set(pool(category).map(t=>t.key)).size;
    if(count<2){toast('V tomto tématu už chybí pojmy. Vynulujte historii nebo vyberte jiné téma.');return}
    let total=Math.min(Number(fd.get('rounds')),count);if(total%2)total--;if(total<Number(fd.get('rounds')))toast('Zbývá méně pojmů. Hra bude mít '+total+' kol.');
    const players=[String(fd.get('player1')).trim().slice(0,24)||'Hráč 1',String(fd.get('player2')).trim().slice(0,24)||'Hráč 2'];
    storage.set('guess.names',players);s={players,category,mode:String(fd.get('mode')),duration:Number(fd.get('duration')),total,index:0,correct:0,round:null,finished:false};freshRound();activate();
  });
  stage.addEventListener('click',async e=>{
    const button=e.target.closest('[data-action]');if(!button||!s)return;const action=button.dataset.action,r=s.round;
    if(action==='reveal'&&r.phase==='hidden'){used.add(r.key);r.phase='ready';save();render()}
    else if(action==='start'&&['ready','paused'].includes(r.phase)){r.phase='running';if(r.mode==='kresleni')r.drawOpen=true;save();render()}
    else if(action==='pause'&&r.phase==='running'){stopTimer();r.phase='paused';save();render()}
    else if(action==='correct'&&r.phase==='running')finish('correct');
    else if(action==='skip')finish('skip');
    else if(action==='next'&&r.phase==='done'){if(s.index>=s.total)s.finished=true;else freshRound();save();render();focusStage()}
    else if(action==='drawing'){stopTimer();r.drawOpen=!r.drawOpen;save();render()}
    else if(action==='erase'){paths=[];render()}
    else if(action==='menu'){stopTimer();if(r.phase==='running')r.phase='paused';save();backToSetup()}
    else if(action==='again'){storage.remove('guess.session');backToSetup()}
    else if(action==='share')share('V Předveď a hádej jsme společně uhodli '+s.correct+' z '+s.total+' pojmů. Kolik dáte vy?','https://crushmeter.cz/predved-a-hadej.html');
  });
  form.elements.category.addEventListener('change',updateCount);
  document.getElementById('resume-game').addEventListener('click',()=>{s=storage.get('guess.session',null);if(!s||!s.round)return;if(s.round.phase==='running')s.round.phase='paused';activate()});
  document.getElementById('discard-game').addEventListener('click',async()=>{if(await confirmAction('Zahodit rozehranou hru?','Použité pojmy zůstanou označené. Smaže se pouze rozehraný zápas.')){storage.remove('guess.session');saved=null;updateResume()}});
  document.getElementById('reset-used').addEventListener('click',async()=>{if(!await confirmAction('Znovu losovat stejné pojmy?','Vynuluje se historie vybraného tématu. U mixu se vynuluje historie všech témat.'))return;const cat=form.elements.category.value;if(cat==='mix')used.clear();else all.filter(t=>t.categoryId===cat).forEach(t=>used.delete(t.key));storage.set('guess.used',[...used]);updateCount();toast('Historie tématu je vynulovaná.')});
  document.getElementById('clear-guess-data').addEventListener('click',async()=>{if(!await confirmAction('Smazat data hádací hry?','Smažou se přezdívky, rozehraná hra i historie použitých pojmů. Druhá hra zůstane beze změny.'))return;['guess.used','guess.session','guess.names'].forEach(storage.remove);used=new Set();saved=null;form.elements.player1.value='';form.elements.player2.value='';updateResume();updateCount();toast('Data hádací hry jsou smazaná.')});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&s&&s.round.phase==='running'){stopTimer();s.round.phase='paused';save();render()}});
  window.addEventListener('pagehide',()=>{if(s){stopTimer();if(s.round.phase==='running')s.round.phase='paused';save()}});
  updateResume();updateCount();
})();
