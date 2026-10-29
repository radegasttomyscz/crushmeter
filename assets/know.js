(() => {
  'use strict';
  const {storage,escapeHTML:E,shuffle,toast,confirmAction,share,focusStage}=window.CM;
  const questions=window.CM_DATA.questions;
  const form=document.getElementById('know-setup'),setup=document.getElementById('game-setup'),stage=document.getElementById('game-stage');
  let used=new Set(storage.get('know.used',[])),s=null,saved=storage.get('know.session',null);
  if(saved&&(!Array.isArray(saved.players)||saved.players.length!==2||!Array.isArray(saved.ids)||!Number.isInteger(saved.index)))saved=null;
  const query=new URLSearchParams(location.search).get('tema');if(['den','spolu','cesty'].includes(query))form.elements.topic.value=query;
  const names=storage.get('know.names',['','']);form.elements.player1.value=names[0]||'';form.elements.player2.value=names[1]||'';
  const pool=topic=>questions.filter(q=>(topic==='mix'||q.topic===topic)&&!used.has(q.id));
  const current=()=>questions.find(q=>q.id===s.ids[s.index]);
  function save(){if(s)storage.set('know.session',s);storage.set('know.used',[...used])}
  function updateCount(){document.getElementById('available-count').textContent=pool(form.elements.topic.value).length+' nepoužitých otázek v tomto telefonu.'}
  function updateResume(){document.getElementById('resume-box').hidden=!saved||saved.finished}
  function activate(){setup.hidden=true;stage.hidden=false;document.body.classList.add('game-active');render();focusStage()}
  function back(){stage.hidden=true;setup.hidden=false;document.body.classList.remove('game-active');s=null;saved=storage.get('know.session',null);updateResume();updateCount();setup.scrollIntoView({block:'start'})}
  function prepare(){s.phase='self-intro';s.answer=null;s.guess=null;save()}
  function options(q){return '<div class="question-options">'+q.options.map((answer,i)=>`<button class="answer-option" data-option="${i}"><span class="option-letter">${'ABCD'[i]}</span><span>${E(answer)}</span></button>`).join('')+'</div>'}
  function render(){
    if(!s)return;if(s.finished){renderResult();return}const q=current();if(!q){s.finished=true;save();renderResult();return}
    const self=s.index%2,guesser=1-self,selfName=E(s.players[self]),guessName=E(s.players[guesser]);
    let content='';
    if(s.phase==='self-intro')content=`<div class="stage-card"><span class="eyebrow">Nejdřív vlastní odpověď</span><span class="pass-icon" aria-hidden="true">↳</span><h2>Odpovídá<br>${selfName}.</h2><p>Odpovězte podle sebe. ${guessName} se zatím nedívá.</p><button class="button" data-action="self-start">Mám telefon. Ukázat otázku ↗</button></div>`;
    else if(s.phase==='self'){content=`<div class="stage-card"><span class="eyebrow">${selfName} vybírá za sebe</span><h2 style="font-size:clamp(1.6rem,4vw,2.3rem)">${E(q.text)}</h2>${options(q)}</div>`}
    else if(s.phase==='pass')content=`<div class="stage-card mint"><span class="eyebrow">Odpověď je schovaná</span><span class="pass-icon" aria-hidden="true">⇄</span><h2>Teď hádá<br>${guessName}.</h2><p>Tipněte si, co vybral druhý hráč. Bez napovídání.</p><button class="button" data-action="guess-start">Mám telefon. Jdu hádat ↗</button></div>`;
    else if(s.phase==='guess')content=`<div class="stage-card"><span class="eyebrow">Tipuje ${guessName} · odpovídá ${selfName}</span><h2 style="font-size:clamp(1.6rem,4vw,2.3rem)">${E(q.text)}</h2>${options(q)}</div>`;
    else if(s.phase==='reveal'){const hit=s.answer===s.guess;content=`<div class="stage-card ${hit?'mint':''}"><span class="eyebrow">${hit?'Správný odhad · bod pro '+guessName:'Tentokrát jiná odpověď'}</span><h2>${hit?'Trefa.':'Tohle překvapilo?'}</h2><p>${E(q.text)}</p><div class="answer-reveal"><div><small>Odpověď · ${selfName}</small><strong>${E(q.options[s.answer])}</strong></div><div><small>Odhad · ${guessName}</small><strong>${E(q.options[s.guess])}</strong></div></div><p>${hit?'Tohle už o sobě víte.':'Zeptejte se proč. Odpověď možná bude zajímavější než samotný bod.'}</p><button class="button" data-action="next">${s.index+1>=s.ids.length?'Zobrazit výsledek':'Další otázka →'}</button></div>`}
    stage.innerHTML=`<div class="stage-top"><span class="round-count">Otázka ${s.index+1} / ${s.ids.length}</span><span>Správné odhady <strong>${s.score[0]+s.score[1]}</strong></span></div><div class="progress-track" aria-label="Průběh hry"><span style="width:${s.index/s.ids.length*100}%"></span></div>${content}<div class="stage-bottom">${s.phase!=='reveal'?'<button class="text-button" data-action="skip">Otázku přeskočit</button>':'<span class="quiet">V další otázce si role vyměníte.</span>'}<button class="text-button" data-action="menu">Nastavení / přerušit</button></div>`;
  }
  function renderResult(){const score=s.score[0]+s.score[1],answered=s.attempts[0]+s.attempts[1],skipped=s.skipped;
    stage.innerHTML=`<div class="panel result-panel"><span class="eyebrow">Jak dobře se znáte? · hotovo</span><h2>${answered===0?'Dnes jste nechali otázky otevřené.':score===answered?'Dnes vás nic nepřekvapilo.':score>=answered*.6?'Dobrý odhad máte oba.':'Aspoň je o čem si povídat.'}</h2><div class="result-score">${score}<span class="quiet" style="font-size:2rem"> / ${answered}</span></div><p>Správných odhadů z vyhodnocených otázek.${skipped?'<br>Přeskočené otázky: '+skipped+'.':''}</p><div class="player-stats">${s.players.map((p,i)=>`<div class="player-stat"><strong>${s.score[i]} / ${s.attempts[i]}</strong><span>${E(p)} · správné odhady</span></div>`).join('')}</div><div class="result-note">Tohle je výsledek hry, ne hodnocení vašeho vztahu. Vyberte si jednu odpověď, která vás překvapila, a zkuste si o ní chvíli povídat.</div><div class="result-actions"><button class="button pink" data-action="again">Dát si další otázky ↗</button><button class="button light" data-action="share">Sdílet výsledek</button></div><p style="margin-top:25px;margin-bottom:0"><a href="/predved-a-hadej.html">Raději si dát hádání a pantomimu?</a></p>${s.topic==='cesty'?'<p style="font-size:.85rem;margin-top:20px;margin-bottom:0">Tip z Putování světem: <a href="https://putovanisvetem.cz/kam-vyrazit/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=poznavaci_hra" target="_blank" rel="noopener">Vyberte, kam spolu vyrazíte příště.</a></p>':''}</div>`;
  }
  form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),topic=String(fd.get('topic')),available=pool(topic);if(available.length<2){toast('Otázky tohoto tématu jsou vyčerpané. Vynulujte historii nebo zvolte jiné téma.');return}let count=Math.min(Number(fd.get('rounds')),available.length);if(count%2)count--;if(count<Number(fd.get('rounds')))toast('Zbývá méně otázek. Zahrajete si jich '+count+'.');const players=[String(fd.get('player1')).trim().slice(0,24)||'Hráč 1',String(fd.get('player2')).trim().slice(0,24)||'Hráč 2'];storage.set('know.names',players);s={players,topic,ids:shuffle(available).slice(0,count).map(q=>q.id),index:0,phase:'self-intro',score:[0,0],attempts:[0,0],skipped:0,answer:null,guess:null,finished:false};prepare();activate()});
  stage.addEventListener('click',e=>{
    if(!s)return;const option=e.target.closest('[data-option]');if(option){const value=Number(option.dataset.option);if(s.phase==='self'){s.answer=value;used.add(current().id);s.phase='pass'}else if(s.phase==='guess'){s.guess=value;const guesser=1-s.index%2;s.attempts[guesser]++;if(value===s.answer)s.score[guesser]++;s.phase='reveal'}else return;save();render();return}
    const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
    if(action==='self-start'&&s.phase==='self-intro'){used.add(current().id);s.phase='self';save();render()}
    else if(action==='guess-start'&&s.phase==='pass'){s.phase='guess';save();render()}
    else if(action==='next'&&s.phase==='reveal'){s.index++;if(s.index>=s.ids.length)s.finished=true;else prepare();save();render();focusStage()}
    else if(action==='skip'&&s.phase!=='reveal'){used.add(current().id);s.skipped++;s.index++;if(s.index>=s.ids.length)s.finished=true;else prepare();save();render();focusStage()}
    else if(action==='menu'){save();back()}
    else if(action==='again'){storage.remove('know.session');back()}
    else if(action==='share')share('Ve hře Jak dobře se znáte jsme trefili '+(s.score[0]+s.score[1])+' z '+(s.attempts[0]+s.attempts[1])+' odpovědí. Zkuste to taky.','https://crushmeter.cz/jak-dobre-se-znate.html');
  });
  form.elements.topic.addEventListener('change',updateCount);
  document.getElementById('resume-game').addEventListener('click',()=>{s=storage.get('know.session',null);if(s)activate()});
  document.getElementById('discard-game').addEventListener('click',async()=>{if(await confirmAction('Zahodit rozehranou hru?','Použité otázky zůstanou označené. Smaže se pouze rozehraný zápas.')){storage.remove('know.session');saved=null;updateResume()}});
  document.getElementById('reset-used').addEventListener('click',async()=>{if(!await confirmAction('Znovu použít stejné otázky?','Vynuluje se historie vybraného tématu. U mixu se vynuluje celá historie otázek.'))return;const topic=form.elements.topic.value;if(topic==='mix')used.clear();else questions.filter(q=>q.topic===topic).forEach(q=>used.delete(q.id));storage.set('know.used',[...used]);updateCount();toast('Historie otázek je vynulovaná.')});
  document.getElementById('clear-know-data').addEventListener('click',async()=>{if(!await confirmAction('Smazat data poznávací hry?','Smažou se přezdívky, odpovědi rozehrané hry, skóre i historie otázek. Hádací hra zůstane beze změny.'))return;['know.used','know.session','know.names'].forEach(storage.remove);used=new Set();saved=null;form.elements.player1.value='';form.elements.player2.value='';updateResume();updateCount();toast('Data poznávací hry jsou smazaná.')});
  updateResume();updateCount();
})();
