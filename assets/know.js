(() => {
  'use strict';
  const {storage, escapeHTML:E, shuffle, toast, confirmAction, share}=window.CM;
  const questions=window.CM_DATA.questions;
  const form=document.getElementById('know-setup'), setup=document.getElementById('game-setup'), stage=document.getElementById('game-stage');
  const topicNames={mix:'Od všeho trochu',den:'Obyčejné dny',spolu:'Čas spolu',cesty:'Na cestách'};
  const topicSymbols={mix:'✳',den:'☀',spolu:'♡',cesty:'↗'};
  let used=new Set(storage.get('know.used',[])), s=null;
  function validSession(value){return value&&Array.isArray(value.players)&&value.players.length===2&&value.players.every(p=>typeof p==='string')&&Array.isArray(value.ids)&&value.ids.length>0&&value.ids.every(id=>questions.some(q=>q.id===id))&&Number.isInteger(value.index)&&value.index>=0&&Array.isArray(value.score)&&Array.isArray(value.attempts)&&['self-intro','self','pass','guess','reveal'].includes(value.phase)}
  let saved=storage.get('know.session',null); if(!validSession(saved))saved=null;
  const query=new URLSearchParams(location.search).get('tema'); if(Object.hasOwn(topicNames,query))form.elements.topic.value=query;
  const names=storage.get('know.names',['','']); form.elements.player1.value=names[0]||''; form.elements.player2.value=names[1]||'';
  const pool=topic=>questions.filter(q=>(topic==='mix'||q.topic===topic)&&!used.has(q.id));
  const current=()=>questions.find(q=>q.id===s.ids[s.index]);
  const initial=name=>E([...name.trim()][0]?.toLocaleUpperCase('cs')||'?');
  function avatar(i,extra=''){return `<span class="player-avatar player-${i===0?'one':'two'} ${extra}" aria-hidden="true">${initial(s.players[i])}</span>`}
  function icon(name){const paths={lock:'<rect x="6" y="10" width="12" height="10" rx="3"/><path d="M9 10V7a3 3 0 0 1 6 0v3M12 14v2"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4M3 8l-2 4 2 4m18-8 2 4-2 4"/>',check:'<path d="m5 12 4 4L19 6"/>',spark:'<path d="m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5ZM20 2v4m-2-2h4"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`}
  function save(){if(s)storage.set('know.session',s);storage.set('know.used',[...used])}
  function updateCount(){const count=pool(form.elements.topic.value).length;document.getElementById('available-count').textContent=count+' nepoužitých otázek připraveno';form.querySelector('[type="submit"]').disabled=count<2}
  function updateResume(){document.getElementById('resume-box').hidden=!saved||saved.finished}
  function focusScreen(){const heading=stage.querySelector('.screen-heading');if(heading)heading.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
  function activate(){setup.hidden=true;stage.hidden=false;document.body.classList.add('game-active');render();focusScreen()}
  function back(){stage.hidden=true;setup.hidden=false;document.body.classList.remove('game-active');s=null;saved=storage.get('know.session',null);if(!validSession(saved))saved=null;updateResume();updateCount();window.scrollTo({top:0,behavior:'instant'});document.getElementById('setup-title').setAttribute('tabindex','-1');document.getElementById('setup-title').focus({preventScroll:true})}
  function prepare(){s.phase='self-intro';s.answer=null;s.guess=null;s.pending=null;save()}
  function shell(content){
    const total=s.ids.length, number=Math.min(s.index+1,total), progress=s.finished?total:s.index;
    const phase=s.phase==='self-intro'||s.phase==='self'?0:s.phase==='pass'||s.phase==='guess'?1:2;
    stage.innerHTML=`<div class="session-nav"><a class="session-brand" href="/" aria-label="CrushMeter – hlavní stránka">crushmeter<span>.</span></a><button class="pause-button" data-action="menu" aria-label="Pozastavit hru a vrátit se do nastavení"><span aria-hidden="true">Ⅱ</span> Pauza</button></div>
    <div class="scoreboard" aria-label="Průběžné skóre">${s.players.map((p,i)=>`<div class="score-player ${!s.finished&&i===(['pass','guess'].includes(s.phase)?1-s.index%2:s.index%2)?'is-turn':''}">${avatar(i)}<span class="score-name">${E(p)}</span><strong>${s.score[i]}<small> bod${s.score[i]===1?'':s.score[i]>1&&s.score[i]<5?'y':'ů'}</small></strong></div>`).join('')}</div>
    <div class="session-progress"><div><span>${s.finished?'DOHRÁNO':`OTÁZKA <b>${number}</b> / ${total}`}</span><span>${E(topicNames[s.topic]||topicNames.mix)}</span></div><div class="round-segments" aria-label="${progress} z ${total} otázek dokončeno">${s.ids.map((_,i)=>`<span class="${i<progress?'done':i===s.index&&!s.finished?'current':''}"></span>`).join('')}</div></div>
    ${!s.finished?`<ol class="phase-steps" aria-label="Kroky otázky">${['Odpověď','Tvůj tip','Odhalení'].map((label,i)=>`<li class="${i===phase?'active':i<phase?'complete':''}" ${i===phase?'aria-current="step"':''}><span>${i<phase?'✓':i+1}</span>${label}</li>`).join('')}</ol>`:''}
    ${content}
    ${!s.finished?`<div class="session-bottom">${s.phase!=='reveal'?'<button class="skip-question" data-action="skip">Přeskočit otázku <span aria-hidden="true">↷</span></button>':'<span>Další otázka, obrácené role.</span>'}<span class="private-note">${icon('lock')} Jen v tomto telefonu</span></div>`:''}`;
  }
  function options(q){return `<div class="know-options" role="group" aria-label="Možnosti odpovědi">${q.options.map((answer,i)=>`<button class="know-option ${s.pending===i?'selected':''}" data-option="${i}" aria-pressed="${s.pending===i}"><span class="answer-letter">${'ABCD'[i]}</span><span>${E(answer)}</span><span class="answer-tick" aria-hidden="true">✓</span></button>`).join('')}</div>`}
  function render(){
    if(!s)return;if(s.finished){renderResult();return}const q=current();if(!q){s.finished=true;save();renderResult();return}
    const self=s.index%2, guesser=1-self, selfName=E(s.players[self]), guessName=E(s.players[guesser]);
    const phase=s.phase;stage.dataset.phase=phase;stage.dataset.player=phase==='pass'||phase==='guess'?guesser:self;
    let content='';
    if(phase==='self-intro'||phase==='pass'){
      const passing=phase==='pass', target=passing?guesser:self;
      content=`<div class="know-screen handoff-screen ${passing?'handoff-guess':''}"><div class="handoff-art" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span>${avatar(target,'hero-avatar')}<span class="handoff-mini">${passing?icon('lock'):icon('spark')}</span><span class="handoff-star">✳</span></div>
      <span class="screen-kicker">${passing?'ODPOVĚĎ JE V BEZPEČÍ':'ZAČÍNÁ MALÁ CHVILKA PRAVDY'}</span><h2 class="screen-heading" tabindex="-1">${passing?'Telefon přebírá':'Teď odpovídá'}<br><span>${E(s.players[target])}.</span></h2><p>${passing?`Zkus odhadnout odpověď druhého.<br>Vlastní odpověď zatím neuvidíš.`:`Vyber odpověď podle sebe.<br><strong>${guessName}</strong> se zatím nedívá.`}</p>
      <button class="button screen-cta" data-action="${passing?'guess-start':'self-start'}">${passing?'Mám telefon. Jdu hádat':'Mám telefon. Jdu odpovídat'} ${icon('arrow')}</button><span class="handoff-hint">${icon(passing?'lock':'phone')}${passing?'Předchozí odpověď jsme schovali.':'Otázka se ukáže až po klepnutí.'}</span></div>`;
    }else if(phase==='self'||phase==='guess'){
      const guessing=phase==='guess',target=guessing?guesser:self;
      content=`<div class="know-screen question-screen"><div class="question-person">${avatar(target)}<span><strong>${E(s.players[target])}</strong><small>${guessing?'Tipuješ odpověď druhého':'Odpovídáš za sebe'}</small></span><span class="question-topic" aria-label="Téma: ${E(topicNames[q.topic])}">${topicSymbols[q.topic]}</span></div><h2 class="screen-heading" tabindex="-1">${E(q.text)}</h2><p class="question-instruction">${guessing?`Co podle tebe vybral protějšek?`:'Co na tebe sedí nejvíc? Vyber jednu možnost.'}</p>${options(q)}<div class="question-submit"><p id="choice-hint" role="status">${Number.isInteger(s.pending)?'Vybráno. Před potvrzením můžeš odpověď změnit.':'Tvůj výběr potvrdíš až dalším tlačítkem.'}</p><button class="button screen-cta" data-action="${guessing?'confirm-guess':'confirm-self'}" ${Number.isInteger(s.pending)?'':'disabled'}>${guessing?'Odhalit odpovědi':'Potvrdit a předat telefon'} ${icon(guessing?'spark':'arrow')}</button></div></div>`;
    }else if(phase==='reveal'){
      const hit=s.answer===s.guess;
      content=`<div class="know-screen reveal-screen ${hit?'is-hit':'is-miss'}"><div class="reveal-mark" aria-hidden="true">${hit?icon('check'):'↔'}</div><span class="screen-kicker">${hit?`+1 BOD · ${guessName}`:'KAŽDÁ ODPOVĚĎ MÁ SVŮJ PŘÍBĚH'}</span><h2 class="screen-heading" tabindex="-1">${hit?'Tohle sedlo!':'Malé překvapení.'}</h2><p class="reveal-question">${E(q.text)}</p><div class="reveal-answers"><div class="reveal-answer actual">${avatar(self)}<div><small>${selfName} · vlastní odpověď</small><strong>${E(q.options[s.answer])}</strong></div><span class="reveal-answer-symbol" aria-hidden="true">${hit?'✓':'♡'}</span></div><div class="reveal-answer guessed">${avatar(guesser)}<div><small>${guessName} · tvůj tip</small><strong>${E(q.options[s.guess])}</strong></div><span class="reveal-answer-symbol" aria-hidden="true">${hit?'✓':'↔'}</span></div></div><div class="conversation-prompt"><span aria-hidden="true">☞</span><p>${hit?'Znáte se. Ale víte taky, proč padla právě tahle odpověď?':'Tady se na chvíli zastavte: „Co tě k té odpovědi vedlo?“'}</p></div><button class="button screen-cta" data-action="next">${s.index+1>=s.ids.length?'Mrknout na výsledek':'Další otázka'} ${icon('arrow')}</button></div>`;
    }
    shell(content);
  }
  function renderResult(){
    stage.dataset.phase='result';const score=s.score[0]+s.score[1],answered=s.attempts[0]+s.attempts[1],percent=answered?Math.round(score/answered*100):0;
    const headline=answered===0?'Někdy stačí si povídat.':score===answered?'Čtete si myšlenky?':score>=answered*.6?'Máte na sebe čuch.':'Ještě je co objevovat.';
    const history=s.history||[];
    shell(`<div class="know-screen final-screen"><span class="screen-kicker">VAŠE CHVILKA VE DVOU</span><h2 class="screen-heading" tabindex="-1">${headline}</h2><div class="result-meter" style="--result:${percent}%"><div><strong>${score}<span> / ${answered}</span></strong><small>správných odhadů</small></div><span class="meter-spark" aria-hidden="true">✳</span></div><p class="result-description">${answered?`Trefili jste ${percent} % vyhodnocených odpovědí.`:'Tentokrát bez vyhodnocených odpovědí.'}${s.skipped?`<br>Přeskočené otázky: ${s.skipped}.`:''}</p><div class="final-player-stats">${s.players.map((p,i)=>`<div>${avatar(i)}<strong>${E(p)}</strong><span><b>${s.score[i]}</b> / ${s.attempts[i]}</span><small>správné odhady</small></div>`).join('')}</div><div class="result-takeaway">Skóre patří téhle hře, ne vašemu vztahu.<br>Nejlepší je to, co jste se o sobě dozvěděli.</div><button class="button screen-cta" data-action="again">Ještě jedno kolo ${icon('arrow')}</button><button class="share-result" data-action="share">Sdílet výsledek ↗</button><button class="text-button" data-action="menu">Změnit téma nebo hráče</button></div>
    ${history.length?`<details class="round-recap"><summary>Vaše momenty <span>${history.length} otázek</span></summary><div>${history.map((h,i)=>{const q=questions.find(q=>q.id===h.id);if(!q)return '';return `<article><span class="recap-status ${h.answer===h.guess?'hit':''}" aria-label="${h.answer===h.guess?'Správný odhad':'Jiný odhad'}">${h.answer===h.guess?'✓':'↔'}</span><div><h3>${E(q.text)}</h3><p>${E(s.players[h.self])}: <strong>${E(q.options[h.answer])}</strong></p><p>Tip · ${E(s.players[1-h.self])}: ${E(q.options[h.guess])}</p></div></article>`}).join('')}</div></details>`:''}
    <div class="final-links"><a href="/predved-a-hadej.html">A co pantomima? Vyzkoušet druhou hru →</a>${s.topic==='cesty'?'<p>Tip z Putování světem: <a href="https://putovanisvetem.cz/kam-vyrazit/?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign=poznavaci_hra" target="_blank" rel="noopener">Kam spolu vyrazíte příště?</a></p>':''}</div>`);
  }
  function startGame(){
    const fd=new FormData(form), topic=String(fd.get('topic')),available=pool(topic);
    if(available.length<2){toast('Tohle téma už máte prozkoumané. Zkuste jiné nebo obnovte otázky v historii.');if(s)back();return}
    let count=Math.min(Number(fd.get('rounds')),available.length);if(count%2)count--;
    if(count<Number(fd.get('rounds')))toast('Zbývá '+count+' otázek. Každý dostane stejný počet tahů.');
    const players=[String(fd.get('player1')).trim().slice(0,24)||'Hráč 1',String(fd.get('player2')).trim().slice(0,24)||'Hráč 2'];
    storage.set('know.names',players);s={players,topic,ids:shuffle(available).slice(0,count).map(q=>q.id),index:0,phase:'self-intro',score:[0,0],attempts:[0,0],skipped:0,answer:null,guess:null,pending:null,history:[],finished:false};prepare();activate();
  }
  form.addEventListener('submit',e=>{e.preventDefault();startGame()});
  stage.addEventListener('click',e=>{
    if(!s)return;const option=e.target.closest('[data-option]');
    if(option&&stage.contains(option)&&['self','guess'].includes(s.phase)){
      s.pending=Number(option.dataset.option);save();stage.querySelectorAll('[data-option]').forEach(el=>{const selected=Number(el.dataset.option)===s.pending;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected))});
      stage.querySelector('.question-submit button').disabled=false;stage.querySelector('#choice-hint').textContent='Vybráno. Před potvrzením můžeš odpověď změnit.';return;
    }
    const button=e.target.closest('[data-action]');if(!button||!stage.contains(button))return;const action=button.dataset.action;
    if(action==='self-start'&&s.phase==='self-intro'){used.add(current().id);s.phase='self';s.pending=null}
    else if(action==='confirm-self'&&s.phase==='self'&&Number.isInteger(s.pending)){s.answer=s.pending;s.pending=null;s.phase='pass'}
    else if(action==='guess-start'&&s.phase==='pass'){s.phase='guess';s.pending=null}
    else if(action==='confirm-guess'&&s.phase==='guess'&&Number.isInteger(s.pending)){s.guess=s.pending;s.pending=null;const self=s.index%2,guesser=1-self;s.attempts[guesser]++;if(s.guess===s.answer)s.score[guesser]++;s.history=s.history||[];s.history.push({id:current().id,self,answer:s.answer,guess:s.guess});s.phase='reveal'}
    else if(action==='next'&&s.phase==='reveal'){s.index++;if(s.index>=s.ids.length)s.finished=true;else prepare()}
    else if(action==='skip'&&s.phase!=='reveal'){used.add(current().id);s.skipped++;s.index++;if(s.index>=s.ids.length)s.finished=true;else prepare()}
    else if(action==='menu'){save();back();return}
    else if(action==='again'&&s.finished){startGame();return}
    else if(action==='share'&&s.finished){share('Ve hře Jak dobře se znáte jsme trefili '+(s.score[0]+s.score[1])+' z '+(s.attempts[0]+s.attempts[1])+' odpovědí. Zkuste to taky.','https://crushmeter.cz/jak-dobre-se-znate.html');return}
    else return;
    save();render();focusScreen();
  });
  form.elements.topic.forEach(input=>input.addEventListener('change',updateCount));
  document.getElementById('resume-game').addEventListener('click',()=>{s=storage.get('know.session',null);if(validSession(s))activate();else {saved=null;s=null;updateResume();toast('Uložená hra už není dostupná. Spusťte novou.')}});
  document.getElementById('discard-game').addEventListener('click',async()=>{if(await confirmAction('Zahodit rozehranou hru?','Použité otázky zůstanou v historii. Smaže se pouze rozehraný zápas.')){storage.remove('know.session');saved=null;updateResume()}});
  document.getElementById('reset-used').addEventListener('click',async()=>{if(!await confirmAction('Znovu použít otázky?','Vynuluje se historie vybraného tématu. U mixu se obnoví všechny otázky.'))return;const topic=form.elements.topic.value;if(topic==='mix')used.clear();else questions.filter(q=>q.topic===topic).forEach(q=>used.delete(q.id));storage.set('know.used',[...used]);updateCount();toast('Otázky jsou znovu připravené.')});
  document.getElementById('clear-know-data').addEventListener('click',async()=>{if(!await confirmAction('Smazat data této hry?','Smažou se přezdívky, odpovědi rozehrané hry, skóre i historie otázek.'))return;['know.used','know.session','know.names'].forEach(storage.remove);used=new Set();saved=null;form.elements.player1.value='';form.elements.player2.value='';updateResume();updateCount();toast('Data této hry jsou smazaná.')});
  updateResume();updateCount();
})();
