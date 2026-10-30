(() => {
'use strict';
const icons={"mix": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 7h3c4 0 6 10 10 10h3m-4-4 4 4-4 4M4 17h3c1 0 2-1 3-3m4-4c1-2 2-3 4-3h2m-4-4 4 4-4 4\"/></svg>", "popis": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 18 0Z\"/><path d=\"M7 9h8M7 13h5\"/></svg>", "pantomima": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"5\" r=\"3\"/><path d=\"m5 10 7 3 7-3M12 13v6m-6 3 6-3 6 3M3 6l2 4m16-4-2 4\"/></svg>", "kresleni": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m4 16 12-12a2.8 2.8 0 0 1 4 4L8 20l-5 1 1-5Zm9-9 4 4M5 16l3 3\"/></svg>", "gear": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m9 3 1-1h4l1 4 4-1 2 4-3 3 3 3-2 4-4-1-1 4h-4l-1-4-4 1-2-4 3-3-3-3 2-4 4 1 1-3Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>", "arrow": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 12h15m-6-6 6 6-6 6\"/></svg>", "clock": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"13\" r=\"9\"/><path d=\"M9 1h6m-3 0v3m0 4v5l3 2\"/></svg>", "cards": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"3\" width=\"15\" height=\"19\" rx=\"3\"/><path d=\"M2 6v12m8-9h5m-5 4h5\"/></svg>", "people": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"8\" cy=\"8\" r=\"3\"/><path d=\"M2 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 5 5v1\"/></svg>", "globe": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z\"/></svg>", "sun": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2\"/></svg>", "heart": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13Z\"/></svg>", "spark": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z\"/></svg>", "star": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z\"/></svg>", "cup": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 3h12v6a6 6 0 0 1-12 0V3Zm0 2H2v3a4 4 0 0 0 4 4m12-7h4v3a4 4 0 0 1-4 4M12 15v6m-5 0h10\"/></svg>", "pause": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M8 5v14M16 5v14\"/></svg>", "check": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m5 12 5 5L21 5\"/></svg>", "lock": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"12\" rx=\"3\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4m-4 5v2\"/></svg>", "repeat": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 9a8 8 0 0 0-14-4L3 8m0-6v6h6m-5 7a8 8 0 0 0 14 4l3-3m0 6v-6h-6\"/></svg>", "close": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m6 6 12 12M6 18 18 6\"/></svg>"};

const {storage}=window.CM;
const icon=name=>icons[name]||icons.spark;
function restore(form,key){
 const config=storage.get(key+'.settings',{});
 if(!config||typeof config!=='object')return;
 for(const [name,value] of Object.entries(config)){
  if(!['category','mode','duration','rounds','topic'].includes(name))continue;
  const input=[...form.elements].find(el=>el.name===name&&el.value===String(value));if(input)input.checked=true;
 }
}
function wireLobby(form,key){
 const sheet=document.getElementById('game-settings');let opener=null;
 const categoryNames=Object.fromEntries(window.CM_DATA.categories.map(c=>[c.id,c.name]));categoryNames.mix='Všechna témata';
 function summary(){
  const fd=new FormData(form),guess=key==='guess';
  const players=[String(fd.get('player1')||'').trim()||'Hráč 1',String(fd.get('player2')||'').trim()||'Hráč 2'];
  document.getElementById('players-summary').textContent=players.join(' + ');
  document.querySelector('[data-open-sheet="player-settings"]').setAttribute('aria-label','Změnit jména hráčů: '+players.join(' a '));
  document.getElementById('length-summary').textContent=guess?fd.get('duration')+' s · '+fd.get('rounds')+' kol':fd.get('rounds')+' otázek · asi '+(fd.get('rounds')==='8'?'5':'10')+' minut';
  if(guess)document.getElementById('category-summary').textContent=categoryNames[fd.get('category')]||categoryNames.mix;
  const settings={};for(const field of guess?['category','mode','duration','rounds']:['topic','rounds'])settings[field]=fd.get(field);storage.set(key+'.settings',settings);
 }
 function close(){sheet.close();document.body.classList.remove('sheet-open')}
 document.querySelectorAll('[data-open-sheet]').forEach(button=>button.addEventListener('click',()=>{
  opener=button;sheet.showModal();document.body.classList.add('sheet-open');const section=button.dataset.openSheet;
  if(section)document.getElementById(section)?.scrollIntoView({block:'start',behavior:'instant'});else sheet.querySelector('.sheet-scroll').scrollTop=0;
 }));
 sheet.querySelectorAll('[data-close-sheet]').forEach(button=>button.addEventListener('click',close));
 sheet.addEventListener('close',()=>{document.body.classList.remove('sheet-open');summary();opener?.focus({preventScroll:true})});
 sheet.addEventListener('click',e=>{if(e.target!==sheet)return;const b=sheet.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close()});
 [...form.elements].forEach(el=>{el.addEventListener('change',summary);if(el.name==='player1'||el.name==='player2')el.addEventListener('input',summary)});
 summary();return {summary};
}
function initials(name){return [...String(name).trim()][0]?.toLocaleUpperCase('cs')||'?'}
window.CM_PLAY={icon,restore,wireLobby,initials};
})();
