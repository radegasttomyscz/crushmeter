/* Načítá se v hlavičce, aby se uložený motiv použil před vykreslením. */
(() => {
 'use strict';
 const root=document.documentElement, KEY='crushmeter.appearance', allowed=['system','light','dark'];
 const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;
 function read(){try{const value=localStorage.getItem(KEY);return allowed.includes(value)?value:'dark'}catch{return 'dark'}}
 let preference=read(),dialog=null,opener=null;
 const icons={system:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',dark:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.7 8.7 0 1 0 20.5 14Z"/>'};
 function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>'}
 function resolved(){return preference==='system'?(media?.matches?'dark':'light'):preference}
 function syncControls(){
  document.querySelectorAll('[name="appearance"]').forEach(input=>input.checked=input.value===preference);
  document.querySelectorAll('[data-theme-open]').forEach(button=>{button.innerHTML=icon(resolved());button.setAttribute('aria-label','Změnit vzhled. '+(preference==='system'?'Podle telefonu':preference==='dark'?'Tmavý motiv':'Světlý motiv'));});
  const status=document.getElementById('appearance-status');if(status)status.textContent=preference==='system'?'Řídí se nastavením zařízení. Právě je '+(resolved()==='dark'?'tmavý':'světlý')+' motiv.':'Tato volba se zapamatuje v tomto prohlížeči.';
 }
 function apply(){
  const theme=resolved();root.dataset.theme=theme;root.dataset.themePreference=preference;root.style.colorScheme=theme;
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='dark'?'#121118':'#ffffff');
  if(document.readyState!=='loading'){syncControls();document.dispatchEvent(new CustomEvent('cm:themechange',{detail:{preference,theme}}));}
 }
 function setPreference(value){if(!allowed.includes(value))return;preference=value;try{localStorage.setItem(KEY,value)}catch{}apply()}
 function button(){return '<button type="button" class="theme-trigger" data-theme-open aria-label="Změnit vzhled">'+icon(resolved())+'</button>'}
 apply();
 function follow(){if(preference==='system')apply()}
 if(media?.addEventListener)media.addEventListener('change',follow);else if(media?.addListener)media.addListener(follow);
 window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){preference=read();apply()}});
 function mount(){
  const slot=document.querySelector('.site-top .top-actions');
  if(slot)slot.insertAdjacentHTML('afterbegin',button());
  dialog=document.createElement('dialog');dialog.id='appearance-dialog';dialog.className='appearance-dialog';dialog.setAttribute('aria-labelledby','appearance-title');
  dialog.innerHTML='<div class="appearance-heading"><div><span>Nastavení</span><h2 id="appearance-title">Vzhled hry</h2></div><button class="appearance-close" type="button" data-theme-close aria-label="Zavřít vzhled">×</button></div><fieldset><legend>Vzhled</legend>'+[['system','Podle telefonu','Automaticky podle zařízení'],['light','Světlý','Světlé pozadí a pastelové akcenty'],['dark','Tmavý','Tlumený vzhled na večer']].map(([value,label,help])=>'<label class="appearance-option"><input type="radio" name="appearance" value="'+value+'"><span class="appearance-icon">'+icon(value)+'</span><span><strong>'+label+'</strong><small>'+help+'</small></span><span class="appearance-check" aria-hidden="true"></span></label>').join('')+'</fieldset><p id="appearance-status" role="status"></p><button type="button" class="appearance-done" data-theme-close>Hotovo</button>';
  document.body.append(dialog);dialog.addEventListener('change',event=>{if(event.target.name==='appearance')setPreference(event.target.value)});
  dialog.addEventListener('close',()=>{document.body.classList.remove('appearance-open');(opener?.isConnected?opener:document.querySelector('.game-active [data-theme-open]')||document.querySelector('[data-theme-open]'))?.focus({preventScroll:true})});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close()});
  document.addEventListener('click',event=>{const open=event.target.closest('[data-theme-open]');if(open){opener=open;document.dispatchEvent(new CustomEvent('cm:appearanceopen'));syncControls();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');document.body.classList.add('appearance-open')}if(event.target.closest('[data-theme-close]')){if(typeof dialog.close==='function')dialog.close();else {dialog.removeAttribute('open');document.body.classList.remove('appearance-open');opener?.focus()}}});
  syncControls();
 }
 window.CM_THEME={button,setPreference};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
