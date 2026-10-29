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
  async function share(text,url=location.origin+location.pathname){try{if(navigator.share){await navigator.share({title:'CrushMeter — hry pro dva',text,url});return}if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text+'\n'+url);toast('Výsledek a odkaz jsou zkopírované.');return}const area=document.createElement('textarea');area.value=text+'\n'+url;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();toast(ok?'Výsledek a odkaz jsou zkopírované.':'Sdílení tady není dostupné. Zkopírujte adresu stránky.')}catch(error){if(error.name!=='AbortError')toast('Sdílení se nepodařilo. Zkuste zkopírovat adresu stránky.')}}
  function focusStage(){const stage=document.getElementById('game-stage');if(stage){stage.focus({preventScroll:true});stage.scrollIntoView({behavior:'instant',block:'start'})}}
  window.CM={storage,escapeHTML,shuffle,toast,confirmAction,share,focusStage};
  const demo=document.getElementById('demo-card');if(demo)demo.addEventListener('click',()=>{const revealed=demo.getAttribute('aria-pressed')==='true';demo.setAttribute('aria-pressed',String(!revealed));demo.querySelector('.demo-symbol').classList.toggle('revealed',!revealed);demo.querySelector('.demo-symbol').textContent=revealed?'?':'Hádka kvůli navigaci';demo.querySelector('.demo-card-bottom').textContent=revealed?'Klepni a zkus ho předvést.':'A teď to zkuste beze slov.'});
  const search=document.getElementById('article-search');if(search)search.addEventListener('input',()=>{const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');const q=norm(search.value.trim());let count=0;document.querySelectorAll('.article-link').forEach(card=>{card.hidden=!norm(card.textContent).includes(q);if(!card.hidden)count++});document.getElementById('article-count').textContent=count+' článků';document.getElementById('no-articles').hidden=count!==0});
  if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol))window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{const el=document.getElementById('offline-status');if(el)el.textContent='Herní stránky jsou připravené i pro hraní bez připojení.'}).catch(()=>{const el=document.getElementById('offline-status');if(el)el.textContent='Pro hraní zatím ponechte připojení k internetu.'})});
  else {const el=document.getElementById('offline-status');if(el)el.textContent='Offline režim tu není dostupný. Pro hraní ponechte připojení k internetu.'}
})();
