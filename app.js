/* Survive -- Offline PWA
   SPA router + offline library + tools + checklists + inventory
   All data stored locally, no servers. */

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

// ----- Router -----
const routes = ['home','library','tools','checklists','inventory'];
function setActiveTab(route){
  $$('.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.route===route));
}
function go(routeHash){
  const [base, sub, param] = routeHash.replace('#','').split('/');
  const route = routes.includes(base) ? base : 'home';
  setActiveTab(route);

  switch(route){
    case 'home': renderHome(); break;
    case 'library': renderLibrary(sub, param); break;
    case 'tools': renderTools(sub); break;
    case 'checklists': renderChecklists(sub, param); break;
    case 'inventory': renderInventory(); break;
    default: renderHome();
  }
}
window.addEventListener('hashchange', ()=>go(location.hash||'#home'));
window.addEventListener('load', ()=>go(location.hash||'#home'));

// ----- Views -----
function renderHome(){
  const tpl = $('#tpl-home').content.cloneNode(true);
  $('#view').innerHTML = '';
  $('#view').appendChild(tpl);
  // Popular links
  const popular = [
    { id:'water', title:'Find & Purify Water' },
    { id:'shelter', title:'Build Emergency Shelter' },
    { id:'fire', title:'Start Fire (No Lighter)' }
  ];
  const ul = $('#popularGuides', $('#view'));
  popular.forEach(g=>{
    const li = document.createElement('li');
    li.innerHTML = `<a href="#library/read/${g.id}">${g.title}</a>`;
    ul.appendChild(li);
  });
}

const LIBRARY = [
  { id:'intro', title:'Survival Mindset & Priorities' },
  { id:'shelter', title:'Shelter: Stay Warm & Dry' },
  { id:'fire', title:'Fire: Methods & Safety' },
  { id:'water', title:'Water: Find, Filter, Purify' },
  { id:'first_aid', title:'First Aid: Stabilize & Treat' },
  { id:'navigation', title:'Navigation Without GPS' },
  { id:'weather', title:'Read the Weather' },
  { id:'foraging', title:'Foraging: Edible vs. Toxic' },
  { id:'signals', title:'Signals: SOS, Ground-to-Air' },
];

async function renderLibrary(sub, param){
  const root = $('#tpl-library').content.cloneNode(true);
  const list = $('#guideList', root);
  LIBRARY.forEach(g=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${g.title}</span> <a class="btn secondary" href="#library/read/${g.id}">Open</a>`;
    list.appendChild(li);
  });

  $('#view').innerHTML='';
  $('#view').appendChild(root);

  if(sub==='read' && param){
    $('#guideReader').classList.remove('hidden');
    const md = await fetch(`./content/${param}.md`).then(r=>r.text()).catch(()=>`# Missing\nContent not found.`);
    $('#guideContent').innerHTML = renderMarkdown(md);
    $('[data-back="library"]').addEventListener('click', ()=>location.hash='#library');
  }
}

function renderTools(sub){
  const tpl = $('#tpl-tools').content.cloneNode(true);
  $('#view').innerHTML=''; $('#view').appendChild(tpl);
  const toolView = $('#toolView');

  if(!sub){ toolView.innerHTML = `<p class="muted">Pick a tool.</p>`; return; }

  if(sub==='compass'){
    toolView.innerHTML = `
      <h3>Compass</h3>
      <div id="compassCard" class="card" style="text-align:center">
        <div id="heading" style="font-size:42px; margin:10px 0">--°</div>
        <canvas id="rose" width="260" height="260" style="max-width:260px;"></canvas>
        <p class="muted">Move your phone to calibrate. Works best on modern devices.</p>
      </div>`;
    renderCompass();
  }

  if(sub==='sos'){
    toolView.innerHTML = `
      <h3>SOS & Morse</h3>
      <div class="card">
        <div class="row">
          <input id="morseInput" placeholder="Message to flash (A–Z, 0–9)" />
          <button id="flashBtn" class="btn">Flash</button>
        </div>
        <div class="row">
          <button id="sosBtn" class="btn secondary">Flash SOS</button>
          <button id="stopFlashBtn" class="btn danger">Stop</button>
        </div>
        <p class="muted">If your device has a flashlight, we’ll use it; otherwise the screen will blink.</p>
      </div>`;
    initMorse();
  }

  if(sub==='knots'){
    toolView.innerHTML = `
      <h3>Knot Guide</h3>
      <ul class="list" id="knotList"></ul>`;
    const knots = [
      {name:'Square Knot', steps:'Join two ropes of equal diameter.'},
      {name:'Bowline', steps:'Fixed loop that won’t slip.'},
      {name:'Clove Hitch', steps:'Quick tie to a post.'},
    ];
    const ul = $('#knotList');
    knots.forEach(k=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${k.name}</strong><div class="muted">${k.steps}</div></div>`;
      ul.appendChild(li);
    });
  }

  if(sub==='convert'){
    toolView.innerHTML = `
     <h3>Unit Converter</h3>
     <div class="card">
       <div class="row"><input id="val" type="number" placeholder="Value" />
         <select id="conv">
            <option value="c2f">°C → °F</option>
            <option value="f2c">°F → °C</option>
            <option value="km2mi">km → miles</option>
            <option value="mi2km">miles → km</option>
            <option value="kg2lb">kg → lb</option>
            <option value="lb2kg">lb → kg</option>
         </select>
         <button id="doConv" class="btn">Convert</button>
       </div>
       <p id="convOut"></p>
     </div>`;
    $('#doConv').addEventListener('click', ()=>{
      const v = parseFloat($('#val').value); const t = $('#conv').value; if(isNaN(v)) return;
      const o = {
        c2f: v*9/5+32, f2c:(v-32)*5/9, km2mi:v*0.621371, mi2km:v/0.621371, kg2lb:v*2.20462, lb2kg:v/2.20462
      }[t];
      $('#convOut').textContent = String(Math.round(o*100)/100);
    });
  }

  if(sub==='map'){
    toolView.innerHTML = `
      <h3>Offline Map Snapshot</h3>
      <div class="card">
        <p>Load a map image (screenshot or saved map). You can pan & zoom offline.</p>
        <input id="mapFile" type="file" accept="image/*" />
        <div id="mapStage" style="height:320px;border:1px solid #1c232b;border-radius:12px;margin-top:10px;overflow:hidden;touch-action:pinch-zoom;"></div>
      </div>`;
    initMapViewer();
  }
}

async function renderChecklists(sub, id){
  const tpl = $('#tpl-checklists').content.cloneNode(true);
  $('#view').innerHTML=''; $('#view').appendChild(tpl);

  // Load defaults once
  if(!localStorage.getItem('checklists')){
    const defaults = await fetch('./data/default_checklists.json').then(r=>r.json());
    localStorage.setItem('checklists', JSON.stringify(defaults));
  }
  const db = JSON.parse(localStorage.getItem('checklists')||'[]');
  const list = $('#checklistList');
  list.innerHTML='';
  db.forEach((c, idx)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${c.title}</span>
      <span>
        <button class="btn secondary" data-open="${idx}">Open</button>
        <button class="btn danger" data-del="${idx}">Delete</button>
      </span>`;
    list.appendChild(li);
  });
  list.addEventListener('click', (e)=>{
    const open = e.target.closest('[data-open]'); const del = e.target.closest('[data-del]');
    if(open){ location.hash = `#checklists/edit/${open.dataset.open}`; }
    if(del){ db.splice(parseInt(del.dataset.del),1); localStorage.setItem('checklists', JSON.stringify(db)); renderChecklists(); }
  });
  $('#addChecklistBtn').addEventListener('click', ()=>{
    const title = prompt('Checklist name'); if(!title) return;
    db.push({ title, items: [] }); localStorage.setItem('checklists', JSON.stringify(db)); renderChecklists();
  });

  if(sub==='edit' && typeof id!=='undefined'){
    $('#checklistEditor').classList.remove('hidden');
    const idx = parseInt(id,10); const ck = db[idx];
    $('#checklistTitle').textContent = ck.title;
    const ul = $('#checklistItems'); ul.innerHTML='';
    ck.items.forEach((it,i)=> addChecklistRow(ul, it.text, it.done, i, db, idx));
    $('#addItemBtn').onclick = ()=> {
      const t = $('#newItemText').value.trim(); if(!t) return;
      ck.items.push({text:t,done:false}); localStorage.setItem('checklists', JSON.stringify(db));
      addChecklistRow(ul, t, false, ck.items.length-1, db, idx); $('#newItemText').value='';
    };
    $('#exportChecklistBtn').onclick = ()=>{
      const lines = [`Checklist: ${ck.title}`, ...ck.items.map(i=>`[${i.done?'x':' '}] ${i.text}`)];
      downloadText(lines.join('\n'), `${ck.title.replace(/\s+/g,'_')}.txt`);
    };
  }
}

function addChecklistRow(ul, text, done, i, db, idx){
  const li = document.createElement('li');
  li.innerHTML = `<label style="display:flex;gap:10px;align-items:center">
    <input type="checkbox" ${done?'checked':''} />
    <span>${text}</span>
  </label>
  <button class="btn danger" data-rm="${i}">Remove</button>`;
  ul.appendChild(li);
  li.querySelector('input').addEventListener('change', (e)=>{
    db[idx].items[i].done = e.target.checked;
    localStorage.setItem('checklists', JSON.stringify(db));
  });
  li.querySelector('[data-rm]').addEventListener('click', ()=>{
    db[idx].items.splice(i,1);
    localStorage.setItem('checklists', JSON.stringify(db));
    li.remove();
  });
}

function renderInventory(){
  const tpl = $('#tpl-inventory').content.cloneNode(true);
  $('#view').innerHTML=''; $('#view').appendChild(tpl);

  const listEl = $('#invList');
  const items = JSON.parse(localStorage.getItem('inventory')||'[]');
  const redraw = ()=>{
    listEl.innerHTML='';
    items.forEach((it, i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<div>
        <strong>${it.name}</strong> <span class="muted">• ${it.qty} • ${it.cat||'General'}</span>
      </div>
      <span>
        <button class="btn secondary" data-edit="${i}">Edit</button>
        <button class="btn danger" data-del="${i}">Del</button>
      </span>`;
      listEl.appendChild(li);
    });
  };
  redraw();

  $('#invAddBtn').addEventListener('click', ()=>{
    const name = $('#invName').value.trim();
    const qty = parseInt($('#invQty').value||'0',10);
    const cat = $('#invCat').value.trim();
    if(!name) return;
    items.push({name, qty:isNaN(qty)?0:qty, cat});
    localStorage.setItem('inventory', JSON.stringify(items)); redraw();
    $('#invName').value=''; $('#invQty').value=''; $('#invCat').value='';
  });
  listEl.addEventListener('click', (e)=>{
    const ed = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
    if(ed){
      const i = parseInt(ed.dataset.edit,10);
      const name = prompt('Item name', items[i].name)||items[i].name;
      const qty = parseInt(prompt('Qty', items[i].qty)||items[i].qty,10);
      const cat = prompt('Category', items[i].cat||'')||items[i].cat;
      items[i]={name,qty:isNaN(qty)?items[i].qty:qty,cat};
      localStorage.setItem('inventory', JSON.stringify(items)); redraw();
    }
    if(del){
      const i = parseInt(del.dataset.del,10);
      items.splice(i,1); localStorage.setItem('inventory', JSON.stringify(items)); redraw();
    }
  });
  $('#invExportBtn').addEventListener('click', ()=>{
    const csv = ['Name,Qty,Category', ...items.map(i=>`${csvEsc(i.name)},${i.qty},${csvEsc(i.cat||'')}`)].join('\n');
    downloadText(csv, 'inventory.csv');
  });
  $('#invClearBtn').addEventListener('click', ()=>{
    if(confirm('Clear all inventory items?')){ localStorage.removeItem('inventory'); location.reload(); }
  });
}

// ----- Tools: Compass -----
function renderCompass(){
  const canvas = $('#rose'); const ctx = canvas.getContext('2d');
  function draw(angle=0){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const c = {x:canvas.width/2,y:canvas.height/2}; const r=120;
    ctx.beginPath(); ctx.arc(c.x,c.y,r,0,Math.PI*2); ctx.strokeStyle='#2c7f3a'; ctx.lineWidth=4; ctx.stroke();
    // Needle
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate((-angle*Math.PI/180));
    ctx.fillStyle='#e5534b';
    ctx.beginPath(); ctx.moveTo(0,-r+10); ctx.lineTo(8,0); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  draw();

  const headingEl = $('#heading');
  const update = (deg)=>{ headingEl.textContent = `${Math.round((deg+360)%360)}°`; draw(deg); };

  if('Magnetometer' in window){
    try{
      const sensor = new Magnetometer({frequency:10});
      sensor.addEventListener('reading', ()=>{
        const deg = (Math.atan2(sensor.y, sensor.x) * (180/Math.PI)) - 90;
        update(deg);
      });
      sensor.start();
    }catch{ fallbackOrientation(update); }
  }else{
    fallbackOrientation(update);
  }
}
function fallbackOrientation(update){
  if(window.DeviceOrientationEvent){
    window.addEventListener('deviceorientation', (e)=>{
      const deg = e.webkitCompassHeading ?? (e.alpha? 360 - e.alpha : 0);
      update(deg||0);
    });
  }
}

// ----- Tools: SOS / Morse -----
let flashInterval=null;
function initMorse(){
  $('#flashBtn').addEventListener('click', ()=> playMorse($('#morseInput').value || 'SOS'));
  $('#sosBtn').addEventListener('click', ()=> playMorse('SOS'));
  $('#stopFlashBtn').addEventListener('click', stopFlash);
}
const MORSE = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
async function playMorse(text){
  stopFlash();
  const seq = text.toUpperCase().split('').map(c=>MORSE[c]||'').join(' ');
  const api = await torchApi(); const screen = $('body');
  const unit=120; // ms
  let i=0;
  flashInterval = setInterval(async ()=>{
    if(i>=seq.length){ stopFlash(); return; }
    const s = seq[i++];
    if(s==='.'||s==='-'){
      await setFlash(true, api, screen);
      setTimeout(()=>setFlash(false, api, screen), s==='.'?unit:unit*3);
    }
  }, unit*4);
}
function stopFlash(){ if(flashInterval){ clearInterval(flashInterval); flashInterval=null; } setFlash(false); }
async function torchApi(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const track = stream.getVideoTracks()[0];
    const cap = track.getCapabilities();
    if(cap.torch){ return { track }; }
  }catch{}
  return null;
}
async function setFlash(on, api=null, screenEl=null){
  if(api?.track){ try{ await api.track.applyConstraints({advanced:[{torch:!!on}]}); }catch{} }
  if(screenEl){ screenEl.style.background = on ? '#ffffff' : ''; }
}

// ----- Tools: Offline map viewer -----
function initMapViewer(){
  const file = $('#mapFile'); const stage = $('#mapStage');
  let img=null, scale=1, tx=0, ty=0, dragging=false, last={x:0,y:0};

  file.addEventListener('change', async ()=>{
    const f=file.files[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    img = new Image(); img.onload=()=>{ scale=1; tx=ty=0; draw(); }; img.src=url;
  });
  stage.addEventListener('mousedown',(e)=>{ dragging=true; last={x:e.clientX,y:e.clientY}; });
  stage.addEventListener('mouseup',()=>dragging=false);
  stage.addEventListener('mouseleave',()=>dragging=false);
  stage.addEventListener('mousemove',(e)=>{ if(!dragging) return; tx+=e.clientX-last.x; ty+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; draw(); });
  stage.addEventListener('wheel',(e)=>{ e.preventDefault(); const k=e.deltaY<0?1.1:0.9; scale*=k; draw(); }, {passive:false});

  function draw(){
    stage.innerHTML=''; if(!img) return;
    const c=document.createElement('canvas'); c.width=stage.clientWidth; c.height=stage.clientHeight; stage.appendChild(c);
    const ctx=c.getContext('2d'); ctx.fillStyle='#0f1419'; ctx.fillRect(0,0,c.width,c.height);
    const iw = img.naturalWidth*scale, ih=img.naturalHeight*scale;
    const x = (c.width - iw)/2 + tx; const y=(c.height - ih)/2 + ty;
    ctx.drawImage(img, x, y, iw, ih);
  }
}

// ----- Utils -----
function renderMarkdown(md){
  // Tiny, safe markdown subset: # ## ###, **bold**, *ital*, lists, links.
  let h = md
    .replace(/^### (.*)$/gm,'<h3>$1</h3>')
    .replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^- (.*)$/gm,'<li>$1</li>')
    .replace(/\n<li>/g,'<ul><li>').replace(/<\/li>\n(?!<li>)/g,'</li></ul>\n')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n{2,}/g,'<br/>');
  return h;
}
function downloadText(text, filename){
  const blob = new Blob([text], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download=filename; a.click();
}
function csvEsc(s){ return `"${String(s).replace(/"/g,'""')}"`; }