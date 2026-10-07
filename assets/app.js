/* MEY website interactions. Works on ordinary hosting and from index.html. */
(function () {
  'use strict';
  const B=window.MeyBooking;
  const lang=document.documentElement.lang==='en'?'en':'de';
  const tr=(de,en)=>lang==='de'?de:en;
  const menuButton=document.querySelector('.menu-toggle');
  const menu=document.querySelector('#mobile-menu');
  let menuCloseTimer=null;
  const MENU_ANIMATION_MS=360;
  function setMenuState(open,{focusButton=false,immediate=false}={}){
    if(!menuButton||!menu)return;
    clearTimeout(menuCloseTimer);
    if(open){
      menu.hidden=false;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        menu.classList.add('is-open');
        menuButton.classList.add('is-open');
        document.body.classList.add('menu-open');
      }));
    }else{
      menu.classList.remove('is-open');
      menuButton.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      const finish=()=>{if(!menu.classList.contains('is-open'))menu.hidden=true;};
      if(immediate)finish();else menuCloseTimer=setTimeout(finish,MENU_ANIMATION_MS);
    }
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?tr('Menü schließen','Close menu'):tr('Menü öffnen','Open menu'));
    if(focusButton)menuButton.focus();
  }
  function closeMenu(options){setMenuState(false,options);}
  if(menuButton&&menu){
    menuButton.addEventListener('click',()=>setMenuState(menuButton.getAttribute('aria-expanded')!=='true'));
    menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
    document.addEventListener('click',e=>{
      if(menuButton.getAttribute('aria-expanded')==='true'&&!e.target.closest('.site-header'))closeMenu();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true')closeMenu({focusButton:true});});
    const wide=window.matchMedia('(min-width: 931px)');
    wide.addEventListener('change',e=>{if(e.matches)closeMenu({immediate:true});});
  }



  /* Address/place suggestions for pickup and destination fields. */
  const PLACE_SUGGESTIONS=[
    ['Flughafen München (MUC)','Flughafen'],
    ['Flughafen München – Terminal 1','Flughafen'],
    ['Flughafen München – Terminal 2','Flughafen'],
    ['Munich Airport Center (MAC)','Flughafen'],
    ['München Hauptbahnhof','Bahnhof'],
    ['München Ostbahnhof','Bahnhof'],
    ['München-Pasing Bahnhof','Bahnhof'],
    ['München ZOB / Hackerbrücke','Busbahnhof'],
    ['Marienplatz, München','Zentrum'],
    ['Karlsplatz (Stachus), München','Zentrum'],
    ['Sendlinger Tor, München','Zentrum'],
    ['Odeonsplatz, München','Zentrum'],
    ['Isartor, München','Zentrum'],
    ['Messe München / Messe Riem','Messe'],
    ['Allianz Arena, München','Stadion'],
    ['Olympiapark München','Freizeit'],
    ['BMW Welt, München','Sehenswürdigkeit'],
    ['Theresienwiese, München','Veranstaltungsort'],
    ['Deutsches Museum, München','Sehenswürdigkeit'],
    ['Englischer Garten, München','Freizeit'],
    ['Schloss Nymphenburg, München','Sehenswürdigkeit'],
    ['Klinikum Großhadern, München','Klinik'],
    ['LMU Klinikum Innenstadt, München','Klinik'],
    ['München Schwabing','Stadtteil'],
    ['München Maxvorstadt','Stadtteil'],
    ['München Altstadt-Lehel','Stadtteil'],
    ['München Au-Haidhausen','Stadtteil'],
    ['München Sendling','Stadtteil'],
    ['München Giesing','Stadtteil'],
    ['München Neuhausen-Nymphenburg','Stadtteil'],
    ['München Bogenhausen','Stadtteil'],
    ['München Trudering-Riem','Stadtteil'],
    ['München Moosach','Stadtteil'],
    ['München Freimann','Stadtteil'],
    ['Leopoldstraße, München','Straße'],
    ['Landsberger Straße, München','Straße'],
    ['Dachauer Straße, München','Straße'],
    ['Schleißheimer Straße, München','Straße'],
    ['Rosenheimer Straße, München','Straße'],
    ['Lindwurmstraße, München','Straße'],
    ['Arnulfstraße, München','Straße'],
    ['Maximilianstraße, München','Straße'],
    ['Sonnenstraße, München','Straße'],
    ['Bayerstraße, München','Straße'],
    ['Prinzregentenstraße, München','Straße'],
    ['Nymphenburger Straße, München','Straße'],
    ['Garching Forschungszentrum','Umgebung'],
    ['Unterföhring','Umgebung'],
    ['Ismaning','Umgebung'],
    ['Haar','Umgebung'],
    ['Vaterstetten','Umgebung'],
    ['Ottobrunn','Umgebung'],
    ['Unterhaching','Umgebung'],
    ['Grünwald','Umgebung'],
    ['Dachau','Umgebung'],
    ['Erding','Umgebung'],
    ['Freising','Umgebung']
  ];
  const normalizePlace=s=>String(s||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
  function editDistance(a,b){
    if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
    const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
    for(let i=1;i<=a.length;i++){cur[0]=i;for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)prev[j]=cur[j];}
    return prev[b.length];
  }
  function placeScore(query,label,index){
    const q=normalizePlace(query),s=normalizePlace(label);if(!q)return index;
    if(s===q)return -50;if(s.startsWith(q))return -35+index/100;if(s.includes(q))return -20+s.indexOf(q)/10+index/100;
    const qs=q.split(' '),words=s.split(' ');let score=0;
    for(const token of qs){
      let best=99;
      for(const word of words){
        if(word.startsWith(token))best=Math.min(best,0);
        else if(word.includes(token))best=Math.min(best,4);
        else if(token.length>=3){const d=editDistance(token,word.slice(0,Math.max(token.length,Math.min(word.length,token.length+2))));if(d<=2)best=Math.min(best,7+d);}
      }
      if(best===99)return 999;
      score+=best;
    }
    return score+index/100;
  }
  function initPlaceAutocomplete(input){
    if(!input||input.dataset.placeAutocomplete==='1')return;
    input.dataset.placeAutocomplete='1';input.setAttribute('autocomplete','off');input.setAttribute('aria-autocomplete','list');
    const field=input.closest('.field');if(!field)return;field.classList.add('has-place-suggestions');
    const list=document.createElement('div');list.className='place-suggestions';list.setAttribute('role','listbox');list.hidden=true;field.appendChild(list);
    let active=-1,shown=[];
    const close=()=>{list.hidden=true;list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');};
    const choose=i=>{const item=shown[i];if(!item)return;input.value=item[0];input.dispatchEvent(new Event('input',{bubbles:true}));input.setCustomValidity('');close();input.focus();};
    const setActive=i=>{if(!shown.length)return;active=(i+shown.length)%shown.length;[...list.children].forEach((el,n)=>el.classList.toggle('is-active',n===active));const el=list.children[active];if(el){input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}};
    const render=()=>{
      const q=input.value.trim();
      shown=PLACE_SUGGESTIONS.map((p,i)=>[p[0],p[1],placeScore(q,p[0],i)]).filter(x=>x[2]<50).sort((a,b)=>a[2]-b[2]).slice(0,6);
      if(!q)shown=PLACE_SUGGESTIONS.slice(0,6).map((p,i)=>[p[0],p[1],i]);
      if(!shown.length){close();return;}
      list.replaceChildren();active=-1;
      shown.forEach((item,i)=>{
        const option=document.createElement('div');option.className='place-suggestion';option.id=`place-option-${Math.random().toString(36).slice(2)}`;option.setAttribute('role','option');
        option.innerHTML=`<span class="place-suggestion-copy"><strong></strong><small></small></span>`;
        option.querySelector('strong').textContent=item[0];option.querySelector('small').textContent=tr(item[1],item[1]==='Bahnhof'?'Station':item[1]==='Flughafen'?'Airport':item[1]==='Straße'?'Street':item[1]);
        option.addEventListener('pointerdown',e=>{e.preventDefault();choose(i);});
        option.addEventListener('mousemove',()=>setActive(i));
        list.appendChild(option);
      });
      list.hidden=false;input.setAttribute('aria-expanded','true');
    };
    input.addEventListener('focus',render);input.addEventListener('input',render);
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();if(list.hidden)render();setActive(active+1);}
      else if(e.key==='ArrowUp'){e.preventDefault();if(list.hidden)render();setActive(active-1);}
      else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(active);}
      else if(e.key==='Escape'){close();}
    });
    input.addEventListener('blur',()=>setTimeout(close,120));
  }
  document.querySelectorAll('input[name="pickup"],input[name="destination"]').forEach(initPlaceAutocomplete);

  const dialog=document.querySelector('#booking-dialog');
  const form=document.querySelector('#details-form');
  const tripForm=document.querySelector('#trip-form');
  const details=document.querySelector('#request-details');
  const ready=document.querySelector('#request-ready');
  const preview=document.querySelector('#request-preview');
  let previousFocus=null;
  let currentMessage='';
  const read=element=>Object.fromEntries(new FormData(element).entries());
  function setDateMinimums(){document.querySelectorAll('input[type="date"]').forEach(e=>{e.min=B.munichTime().date;});}
  function fillDefaults(target){const d=B.defaultTime();if(!target.elements.date.value)target.elements.date.value=d.date;if(!target.elements.time.value)target.elements.time.value=d.time;}
  function validate(target,full){setDateMinimums();for(const control of target.elements)if(typeof control.setCustomValidity==='function')control.setCustomValidity('');const errors=B.validate(read(target),lang,full);for(const [key,message] of Object.entries(errors))if(target.elements[key])target.elements[key].setCustomValidity(message);return target.reportValidity();}
  function showDetails(){details.hidden=false;ready.hidden=true;dialog.scrollTop=0;document.querySelector('#copy-status').textContent='';}
  function openBooking(values=null){
    if(typeof dialog.showModal!=='function'){window.location.href=`tel:${B.CONTACT.phone}`;return;}
    previousFocus=document.activeElement;showDetails();setDateMinimums();
    if(values)for(const key of ['pickup','destination','ride_type','date','time'])if(values[key]!==undefined&&form.elements[key])form.elements[key].value=values[key];
    if(!form.elements.destination.value && document.body.dataset.page==='flughafentransfer') form.elements.destination.value='Flughafen München (MUC)';
    fillDefaults(form);dialog.showModal();
    const empty=[...form.querySelectorAll('input[required]')].find(e=>!e.value);
    (empty||form.elements.name).focus();
  }
  document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>openBooking(tripForm?read(tripForm):null)));
  dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(previousFocus&&previousFocus.isConnected)previousFocus.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.querySelectorAll('form').forEach(f=>f.addEventListener('input',()=>{for(const e of f.elements)if(typeof e.setCustomValidity==='function')e.setCustomValidity('');}));
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!validate(form,true))return;
    currentMessage=B.buildMessage(read(form),lang);const links=B.contactLinks(currentMessage,lang);
    preview.textContent=currentMessage;
    document.querySelector('#request-whatsapp').href=links.whatsapp;
    document.querySelector('#request-email').href=links.email;
    details.hidden=true;ready.hidden=false;dialog.scrollTop=0;preview.focus();
  });
  document.querySelector('#edit-request').addEventListener('click',()=>{showDetails();form.elements.pickup.focus();});
  document.querySelector('#copy-request').addEventListener('click',async()=>{
    const status=document.querySelector('#copy-status');
    try{if(!navigator.clipboard)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(currentMessage);status.textContent=tr('Nachricht kopiert.','Message copied.');}
    catch{const range=document.createRange();range.selectNodeContents(preview);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent=tr('Bitte den markierten Text mit Strg+C oder über „Kopieren“ kopieren.','Please copy the selected text with Ctrl+C or the Copy command.');}
  });
  if(tripForm){
    fillDefaults(tripForm);setDateMinimums();
    tripForm.addEventListener('submit',e=>{e.preventDefault();if(validate(tripForm,false))openBooking(read(tripForm));});
    document.querySelectorAll('[data-trip-type]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-trip-type]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      const field=tripForm.elements.destination;
      if(button.dataset.tripType==='airport')field.value='Flughafen München (MUC)';
      else if(field.value==='Flughafen München (MUC)')field.value='';
      field.setCustomValidity('');
    }));
    document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>{tripForm.elements.destination.value=button.dataset.destination;tripForm.elements.destination.setCustomValidity('');tripForm.elements.pickup.focus();}));
    document.querySelector('#swap-route').addEventListener('click',()=>{const a=tripForm.elements.pickup,b=tripForm.elements.destination;[a.value,b.value]=[b.value,a.value];a.setCustomValidity('');b.setCustomValidity('');(!a.value?a:b).focus();});
  }
})();
