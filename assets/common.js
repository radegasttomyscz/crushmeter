(() => {
  'use strict';
  const PREFIX='crushmeter.free.v1.';
  const storage={
    get(key,fallback){try{const raw=localStorage.getItem(PREFIX+key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}},
    set(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true}catch{return false}},
    remove(key){try{localStorage.removeItem(PREFIX+key)}catch{}}
  };
  const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=input=>{const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  let toastTimer;
  function toast(message){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.append(el)}el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500)}
  async function confirmAction(title,message){const dialog=document.getElementById('confirm-dialog');if(!dialog||!dialog.showModal)return window.confirm(message);dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=message;dialog.returnValue='cancel';dialog.showModal();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}))}
  async function share(text,url=location.origin+location.pathname){try{if(navigator.share){await navigator.share({title:'CrushMeter: hry pro dva',text,url});return}if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text+'\n'+url);toast('Výsledek a odkaz jsou zkopírované.');return}const area=document.createElement('textarea');area.value=text+'\n'+url;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();toast(ok?'Výsledek a odkaz jsou zkopírované.':'Sdílení tady není dostupné. Zkopírujte adresu stránky.')}catch(error){if(error.name!=='AbortError')toast('Sdílení se nepodařilo. Zkuste zkopírovat adresu stránky.')}}
  function focusStage(){const stage=document.getElementById('game-stage');if(stage){stage.focus({preventScroll:true});stage.scrollIntoView({behavior:'instant',block:'start'})}}
  window.CM={storage,escapeHTML,shuffle,toast,confirmAction,share,focusStage};
  const demo=document.getElementById('demo-card');if(demo)demo.addEventListener('click',()=>{const revealed=demo.getAttribute('aria-pressed')==='true';demo.setAttribute('aria-pressed',String(!revealed));demo.querySelector('.demo-symbol').classList.toggle('revealed',!revealed);demo.querySelector('.demo-symbol').textContent=revealed?'?':'Hádka kvůli navigaci';demo.querySelector('.demo-card-bottom').textContent=revealed?'Klepni a zkus ho předvést.':'A teď to zkuste beze slov.'});
  const search=document.getElementById('article-search');if(search)search.addEventListener('input',()=>{const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');const q=norm(search.value.trim());let count=0;document.querySelectorAll('#article-list .article-link').forEach(card=>{card.hidden=!norm(card.textContent).includes(q);if(!card.hidden)count++});document.querySelectorAll('.mag-topic').forEach(t=>{t.hidden=!t.querySelector('.article-link:not([hidden])')});document.getElementById('article-count').textContent=count+(count===1?' článek':count>1&&count<5?' články':' článků');document.getElementById('no-articles').hidden=count!==0});
  if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol))window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{const el=document.getElementById('offline-status');if(el)el.textContent='Herní stránky jsou připravené i pro hraní bez připojení.'}).catch(()=>{const el=document.getElementById('offline-status');if(el)el.textContent='Pro hraní zatím ponechte připojení k internetu.'})});
  else {const el=document.getElementById('offline-status');if(el)el.textContent='Offline režim tu není dostupný. Pro hraní ponechte připojení k internetu.'}
})();
(()=>{const g=document.querySelector('.mag-grid'),f=document.querySelector('.mag-filter'),more=document.querySelector('.mag-more');if(!g||!f||!more)return;const cards=[...g.querySelectorAll('.mag-card')],LIMIT=8;let cur='',open=false;f.querySelectorAll('button[data-f]').forEach(b=>{if(b.dataset.f&&!cards.some(c=>c.dataset.type===b.dataset.f))b.hidden=true});function render(){const list=cards.filter(c=>!cur||c.dataset.type===cur);cards.forEach(c=>{c.hidden=true;c.classList.remove('is-lead')});list.forEach((c,i)=>{if(cur||open||i<LIMIT){c.hidden=false;if(i<2)c.classList.add('is-lead')}});const rest=list.length-LIMIT;more.hidden=!!cur||open||rest<=0;more.textContent='Zobrazit další tipy ('+rest+')'}f.hidden=false;f.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cur=b.dataset.f;f.querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('is-on',on);x.setAttribute('aria-pressed',on?'true':'false')});render()});more.addEventListener('click',()=>{open=true;render();const n=cards.filter(c=>!c.hidden)[LIMIT];if(n)n.focus()});render()})();
/* Jména hráčů: před startem hry vždy křestní jména obou hráčů */
(()=>{const S=window.CM&&CM.storage;if(!S)return;const PAIRS=[['p1','p2'],['player1','player2']];
const fields=f=>{for(const [a,b] of PAIRS){const x=f.elements[a],y=f.elements[b];if(x&&y)return[x,y]}return null};
const saved=()=>{const n=S.get('names',[]);return Array.isArray(n)?n:[]};
function prefill(root){root.querySelectorAll('form').forEach(f=>{const fl=fields(f);if(!fl)return;const n=saved();let ch=false;fl.forEach((el,i)=>{if(!el.value.trim()&&n[i]){el.value=n[i];ch=true}});if(ch)fl[0].dispatchEvent(new Event('change',{bubbles:true}))})}
let dlg;function dialog(){if(dlg)return dlg;dlg=document.createElement('dialog');dlg.className='names-dialog';dlg.setAttribute('aria-labelledby','names-h');dlg.innerHTML='<form method="dialog" class="names-form" novalidate><h2 id="names-h">Kdo hraje?</h2><p>Stačí křestní jména. Hra vás bude oslovovat a uloží si je v tomto telefonu.</p><label><span>První hráč</span><input name="n1" maxlength="18" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" placeholder="Třeba Anna"></label><label><span>Druhý hráč</span><input name="n2" maxlength="18" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="Třeba Tomáš"></label><p class="names-err" role="alert" hidden>Vyplňte prosím obě jména.</p><div class="names-actions"><button type="submit" class="names-go">Hrát</button><button type="button" class="names-cancel">Zpět</button></div></form>';document.body.appendChild(dlg);dlg.querySelector('.names-cancel').addEventListener('click',()=>dlg.close());return dlg}
function ask(f,fl){const d=dialog(),fm=d.querySelector('form'),[a,b]=[fm.elements.n1,fm.elements.n2],err=d.querySelector('.names-err');a.value=fl[0].value.trim();b.value=fl[1].value.trim();err.hidden=true;
fm.onsubmit=e=>{e.preventDefault();const v=[a.value.trim(),b.value.trim()];if(!v[0]||!v[1]){err.hidden=false;(v[0]?b:a).focus();return}fl[0].value=v[0];fl[1].value=v[1];S.set('names',v);fl[0].dispatchEvent(new Event('change',{bubbles:true}));d.close();f.requestSubmit()};
a.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();b.focus()}};
d.showModal();(a.value?b:a).focus()}
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.classList.contains('names-form'))return;const fl=fields(f);if(!fl)return;const v=fl.map(x=>x.value.trim());if(v[0]&&v[1]){S.set('names',v);return}e.preventDefault();e.stopImmediatePropagation();ask(f,fl)},true);
const run=()=>prefill(document);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0));else setTimeout(run,0);window.addEventListener('load',run);new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes)if(n.nodeType===1)prefill(n)}).observe(document.body,{childList:true,subtree:true})})();
/* Přidat na plochu: nenápadná nabídka po dohrané hře */
(()=>{const S=window.CM&&CM.storage;if(!S)return;let deferred=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),iosSafari=ios&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|GSA/.test(ua);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
addEventListener('appinstalled',()=>{S.set('install',{done:1});document.querySelectorAll('.install-card').forEach(n=>n.remove())});
const snoozed=()=>{const v=S.get('install',{});return v.done||(v.until&&Date.now()<v.until)};
function card(){const c=document.createElement('aside');c.className='install-card';c.setAttribute('aria-label','Přidat na plochu');
c.innerHTML='<img src="/icon-192.png" alt="" width="44" height="44"><div><strong>Příště jedním klepnutím</strong><p>Přidejte si CrushMeter na plochu telefonu. Otevře se jako aplikace, bez stahování.</p><p class="install-ios" hidden>V Safari klepněte dole na <b>Sdílet</b> <span aria-hidden="true">(čtvereček se šipkou)</span> a pak na <b>Přidat na plochu</b>.</p><div class="install-actions"><button type="button" class="install-go">Přidat na plochu</button><button type="button" class="install-no">Teď ne</button></div></div>';
c.querySelector('.install-no').onclick=()=>{S.set('install',{until:Date.now()+30*864e5});c.remove()};
c.querySelector('.install-go').onclick=async()=>{if(deferred){deferred.prompt();const r=await deferred.userChoice.catch(()=>null);deferred=null;if(r&&r.outcome==='accepted'){S.set('install',{done:1})}c.remove()}else{c.querySelector('.install-ios').hidden=false;c.querySelector('.install-go').hidden=true}};
return c}
function offer(root){if(standalone()||snoozed()||!(deferred||iosSafari))return;const t=root.querySelector&&root.querySelector('.final-screen,.game-result,.a-end');if(!t||t.querySelector('.install-card'))return;t.appendChild(card())}
new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes)if(n.nodeType===1)offer(n.matches&&n.matches('.final-screen,.game-result,.a-end')?n.parentNode:n)}).observe(document.body,{childList:true,subtree:true})})();

/* Kdo už má plnou hru Odvážně 18+ odemčenou, jde z menu rovnou hrát. */
(()=>{try{const r=JSON.parse(localStorage.getItem('crushmeter.adult.access')||'null');if(!r||!r.email||!(Date.parse(r.expires)>Date.now()))return;const go=()=>document.querySelectorAll('.top-nav a[href="/odvazne-18.html"],.top-menu-panel a[href="/odvazne-18.html"]').forEach(a=>{a.href='/odvazne-18-hrat.html'});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()}catch{}})();

/* Nenápadné tipy na další weby provozovatele. Každý web se ve hře ukáže nejvýš u jedné otázky (seed). */
(()=>{const U='?utm_source=crushmeter&utm_medium=referral&utm_campaign=';
const P={putovani:['Láká vás cestování?','Tipy na výlety a dovolené najdete na Putování světem','https://putovanisvetem.cz/kam-vyrazit/','click_putovani_svetem'],
syte:['Dostali jste hlad?','Recepty, které zasytí a nezatíží, má Sytě a lehce','https://www.sytealehce.cz/','click_syte_a_lehce'],
flambro:['Chuť na grilování?','Mrkněte na Flambro','https://www.flambro.cz/','click_flambro'],
kartarka:['Baví vás věštby?','Vytáhněte si karty u Virtuální kartářky','https://virtualnikartarka.cz/','click_virtualni_kartarka'],
tomys:['Chystáte vlastní web?','Weby, marketing a online identitu dělá tomys.cz','https://www.tomys.cz/','click_tomys']};
const seen={};
window.CM.tipFor=(text,cat)=>{const t=String(text||'');
if(/gril|flamb|steak|barbecue|BBQ/i.test(t))return 'flambro';
if(/tarot|věšt|arkán|horoskop/i.test(t))return 'kartarka';
if(cat==='tech'&&/web|internet|Google|sociální|Facebook|YouTube|Wikipedi|vyhledáva|Instagram|TikTok|reklam|marketing/i.test(t))return 'tomys';
if(['geo','mesta','cesty','cestovani-a-dovolena','mista-a-staty'].includes(cat))return 'putovani';
if(['jidlo','jidlo-a-piti','vareni-a-kuchyne'].includes(cat))return 'syte';
if(cat==='technika-a-internet')return 'tomys';
return ''};
window.CM.tip=(key,seed,placement)=>{const p=P[key];if(!p)return '';if(seen[key]!==undefined&&seen[key]!==String(seed))return '';seen[key]=String(seed);
return `<p class="cm-tip">${p[0]} <a href="${p[2]+U+encodeURIComponent(placement)}" target="_blank" rel="noopener" data-track="${p[3]}" data-track-placement="${placement}">${p[1]}</a>.</p>`}})();
