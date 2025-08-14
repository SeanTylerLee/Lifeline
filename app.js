/* Lifeline -- Offline PWA
   Full app logic (no Popular Guides on Home)
   - SPA router (#home, #library, #tools/<sub>, #checklists[/edit/<i>], #inventory)
   - Install banner
   - Home: live search
   - Library: reads markdown files in /content
   - Tools: Compass, Knots, Unit Converter, SOS Flasher
   - Checklists: create/edit with autosave, localStorage
   - Inventory: add/delete/export/clear, localStorage
*/

/* ---------------- Small helpers ---------------- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function downloadText(text, filename){
  const blob = new Blob([text], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download=filename; a.click();
}
function csvEsc(s){ return `"${String(s).replace(/"/g,'""')}"`; }

function readText(path){
  return fetch(path).then(r=>r.ok ? r.text() : Promise.reject(new Error(`${path} not found`)));
}

/* ---------------- Install banner ---------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('#installBanner')?.classList.remove('hidden');
});
document.addEventListener('click', async (e)=>{
  if(e.target?.id === 'installBtn' && deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#installBanner')?.classList.add('hidden');
  }
  if(e.target?.id === 'dismissInstall'){
    $('#installBanner')?.classList.add('hidden');
  }
});

/* ---------------- Router ---------------- */
const ROUTES = ['home','library','tools','checklists','inventory'];

function parseHash(){
  const raw = (location.hash || '#home').slice(1);       // e.g. "tools/compass"
  const parts = raw.split('/');                           // ["tools","compass"]
  const route = ROUTES.includes(parts[0]) ? parts[0] : 'home';
  const sub   = parts[1];
  const param = parts[2];
  return {route, sub, param};
}

function setActiveTab(route){
  $$('.tabs [role="tab"]').forEach(btn=>{
    btn.setAttribute('aria-selected', String(btn.dataset.route===route));
  });
}

function render(){
  const {route, sub, param} = parseHash();
  setActiveTab(route);
  const view = $('#view'); if(!view) return;
  view.innerHTML = '';

  const tpl = document.getElementById(`tpl-${route}`);
  if(!tpl){ view.textContent = 'Template missing.'; return; }
  view.appendChild(tpl.content.cloneNode(true));

  if(route==='home') renderHome();
  if(route==='library') renderLibrary(sub, param);
  if(route==='tools') renderTools(sub);
  if(route==='checklists') renderChecklists(sub, param);
  if(route==='inventory') renderInventory();
  view.focus();
}

window.addEventListener('hashchange', render);
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.tabs [data-route]');
  if(t){ location.hash = '#'+t.dataset.route; }
});
render();

/* ---------------- Library data & markdown ---------------- */
const TOPICS = [
  { id:'intro',       title:'Survival Mindset & Priorities', file:'content/intro.md' },
  { id:'first_aid',   title:'First Aid: Stabilize & Treat',  file:'content/first_aid.md' },
  { id:'fire',        title:'Fire: Methods & Safety',         file:'content/fire.md' },
  { id:'water',       title:'Water: Find, Filter, Purify',    file:'content/water.md' },
  { id:'shelter',     title:'Shelter: Stay Warm & Dry',       file:'content/shelter.md' },
  { id:'navigation',  title:'Navigation Without GPS',         file:'content/navigation.md' },
  { id:'weather',     title:'Read the Weather',               file:'content/weather.md' },
  { id:'foraging',    title:'Foraging: Edible vs. Toxic',     file:'content/foraging.md' },
  { id:'signals',     title:'Signals: SOS, Ground-to-Air',    file:'content/signals.md' }
];

function mdToHtml(h){
  return h
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.*)$/gm,'<h3>$1</h3>')
    .replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^- (.*)$/gm,'<li>$1</li>')
    .replace(/\n<li>/g,'<ul><li>')
    .replace(/<\/li>\n(?!<li>)/g,'</li></ul>\n')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n{2,}/g,'<br/>');
}

/* ---------------- HOME ---------------- */
function renderHome(){
  // Live search over topics
  const input = $('#homeSearch');
  const list = $('#homeSearchResults');
  if(!input || !list) return;

  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if(!q){ list.hidden = true; return; }
    const found = TOPICS.filter(t => (t.title + ' ' + t.id).toLowerCase().includes(q));
    found.forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<a href="#library/read/${t.id}"><strong>${t.title}</strong></a>`;
      list.appendChild(li);
    });
    list.hidden = found.length===0;
  });
}

/* ---------------- LIBRARY ---------------- */
async function renderLibrary(sub, param){
  const list = $('#guideList');
  const reader = $('#guideReader');
  const content = $('#guideContent');

  // Build list
  if(list){
    list.innerHTML = '';
    TOPICS.forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${t.title}</span> <a class="btn secondary" href="#library/read/${t.id}">Open</a>`;
      list.appendChild(li);
    });
  }

  // Open reader if requested
  if(sub==='read' && param && reader && content){
    reader.classList.remove('hidden');
    const t = TOPICS.find(x=>x.id===param);
    const raw = await readText(t?.file || '').catch(()=> '# Missing\nContent not found.');
    content.innerHTML = mdToHtml(raw);
    $('[data-back="library"]')?.addEventListener('click', ()=> location.hash = '#library');
  }
}

/* ---------------- TOOLS ---------------- */
function renderTools(sub){
  const toolView = $('#toolView');
  if(!toolView) return;

  if(!sub){
    toolView.innerHTML = `<p class="muted">Pick a tool.</p>`;
    return;
  }

  if(sub==='compass'){
    toolView.innerHTML = `
      <h3>Compass</h3>
      <div class="card">
        <p class="muted">Move your phone to calibrate. Uses device orientation (alpha).</p>
        <p style="font-size:42px;margin:.5rem 0 0"><strong id="heading">--</strong>°</p>
      </div>`;
    if('DeviceOrientationEvent' in window){
      window.addEventListener('deviceorientation', (e)=>{
        const h = Math.round((e.alpha||0));
        $('#heading').textContent = String((h+360)%360);
      });
    }
    return;
  }

  if(sub==='knots'){
    toolView.innerHTML = `
      <h3>Essential Knots</h3>
      <ul class="list" id="knotList"></ul>`;
    const knots = [
      {name:'Square Knot', steps:'Left over right, right over left. Joins ropes.'},
      {name:'Bowline', steps:'Loop → rabbit out → around tree → back down hole.'},
      {name:'Clove Hitch', steps:'Two turns around post, tuck under standing part.'}
    ];
    const ul = $('#knotList');
    knots.forEach(k=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${k.name}</strong><div class="muted">${k.steps}</div></div>`;
      ul.appendChild(li);
    });
    return;
  }

  if(sub==='convert'){
    toolView.innerHTML = `
      <h3>Unit Converter</h3>
      <div class="card">
        <div class="row">
          <input id="val" type="number" placeholder="Value" />
          <select id="conv" aria-label="Conversion type">
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
      const o = { c2f:v*9/5+32, f2c:(v-32)*5/9, km2mi:v*0.621371, mi2km:v/0.621371, kg2lb:v*2.20462, lb2kg:v/2.20462 }[t];
      $('#convOut').textContent = String(Math.round(o*1000)/1000);
    });
    return;
  }

  if(sub==='sos'){
    toolView.innerHTML = `
      <h3>SOS Flasher</h3>
      <div class="card">
        <p class="muted">Flashes the screen in Morse for SOS (· · · -- -- -- · · ·). Turn brightness up.</p>
        <div class="row">
          <button id="startSOS" class="btn">Start</button>
          <button id="stopSOS" class="btn secondary">Stop</button>
        </div>
      </div>`;
    let playing = false, timer = null, idx = 0;
    const seq = '...---...';              // S O S
    const DOT = 200, DASH = 600, GAP = 200, LETTERGAP = 600;
    function step(){
      if(!playing){ document.body.style.background=''; return; }
      if(idx>=seq.length){ idx=0; setTimeout(()=>step(), LETTERGAP); return; }
      const ch = seq[idx++];
      const dur = (ch==='.') ? DOT : DASH;
      document.body.style.background = '#ffffff';
      timer = setTimeout(()=>{
        document.body.style.background = '';
        setTimeout(step, GAP);
      }, dur);
    }
    $('#startSOS').addEventListener('click', ()=>{
      if(playing) return;
      playing = true; idx=0; step();
    });
    $('#stopSOS').addEventListener('click', ()=>{
      playing = false; clearTimeout(timer); document.body.style.background='';
    });
    return;
  }

  toolView.innerHTML = `<p class="muted">Tool not found.</p>`;
}

/* ---------------- CHECKLISTS ---------------- */
const CHECKLIST_KEY = 'lifeline_checklists';

function loadChecklists(){ return JSON.parse(localStorage.getItem(CHECKLIST_KEY)||'[]'); }
function saveChecklists(v){ localStorage.setItem(CHECKLIST_KEY, JSON.stringify(v)); }

function renderChecklists(sub, param){
  const listEl = $('#checklistList');
  const editor = $('#checklistEditor');

  function paintList(){
    const data = loadChecklists();
    listEl.innerHTML = '';
    if(!data.length){
      const li = document.createElement('li');
      li.innerHTML = `<div class="muted">No checklists yet. Tap "+ New Checklist".</div>`;
      listEl.appendChild(li);
    }else{
      data.forEach((c, i)=>{
        const remaining = c.items.filter(it=>!it.done).length;
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="row" style="justify-content:space-between;align-items:center">
            <div><strong>${c.title||'Checklist'}</strong><div class="muted">${remaining} remaining</div></div>
            <div class="row">
              <a class="btn secondary" href="#checklists/edit/${i}">Open</a>
              <button class="btn danger" data-del="${i}">Delete</button>
            </div>
          </div>`;
        listEl.appendChild(li);
      });
    }
  }

  // Base render
  paintList();

  // Delete handler
  listEl.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-del]');
    if(!del) return;
    const idx = parseInt(del.dataset.del,10);
    const data = loadChecklists();
    data.splice(idx,1);
    saveChecklists(data);
    paintList();
  });

  // Add new checklist
  $('#addChecklistBtn')?.addEventListener('click', ()=>{
    const data = loadChecklists();
    data.unshift({ title:'Untitled Checklist', items:[] });
    saveChecklists(data);
    location.hash = `#checklists/edit/0`;
  });

  // Editor mode
  if(sub==='edit' && typeof param !== 'undefined'){
    const i = parseInt(param,10);
    const data = loadChecklists();
    if(!data[i]) return;

    // show editor section
    editor.classList.remove('hidden');
    const titleEl = $('#checklistTitle');
    const itemsEl = $('#checklistItems');
    const newInput = $('#newItemText');
    const addBtn = $('#addItemBtn');

    titleEl.contentEditable = 'true';
    titleEl.textContent = data[i].title || 'Checklist';
    itemsEl.innerHTML = '';

    function paintItems(){
      itemsEl.innerHTML = '';
      data[i].items.forEach((it, idx)=>{
        const li = document.createElement('li');
        li.innerHTML = `
          <label class="row" style="justify-content:space-between;gap:10px">
            <span class="row" style="gap:10px">
              <input type="checkbox" data-toggle="${idx}" ${it.done?'checked':''}/>
              <span>${it.text}</span>
            </span>
            <button class="btn danger" data-remove="${idx}">Remove</button>
          </label>`;
        itemsEl.appendChild(li);
      });
    }
    paintItems();

    // interactions
    itemsEl.addEventListener('click', (e)=>{
      const tog = e.target.closest('[data-toggle]');
      const rem = e.target.closest('[data-remove]');
      if(tog){
        const idx = parseInt(tog.dataset.toggle,10);
        data[i].items[idx].done = !data[i].items[idx].done;
        saveChecklists(data);
      }
      if(rem){
        const idx = parseInt(rem.dataset.remove,10);
        data[i].items.splice(idx,1);
        saveChecklists(data); paintItems();
      }
    });

    addBtn?.addEventListener('click', ()=>{
      const txt = (newInput.value||'').trim();
      if(!txt) return;
      data[i].items.unshift({text:txt, done:false});
      newInput.value = '';
      saveChecklists(data); paintItems();
    });

    // Title autosave
    titleEl.addEventListener('input', ()=>{
      data[i].title = titleEl.textContent.trim() || 'Checklist';
      saveChecklists(data);
    });

    // Export
    $('#exportChecklistBtn')?.addEventListener('click', ()=>{
      const text = `${data[i].title}\n\n` + data[i].items.map(it=>`${it.done?'[x]':'[ ]'} ${it.text}`).join('\n');
      downloadText(text, (data[i].title||'checklist') + '.txt');
    });

    // Back
    $('[data-back="checklists"]')?.addEventListener('click', ()=>{
      editor.classList.add('hidden');
      location.hash = '#checklists';
    });
  }
}

/* ---------------- INVENTORY ---------------- */
const INV_KEY = 'lifeline_inventory';
function loadInv(){ return JSON.parse(localStorage.getItem(INV_KEY)||'[]'); }
function saveInv(v){ localStorage.setItem(INV_KEY, JSON.stringify(v)); }

function renderInventory(){
  const name = $('#invName'), qty = $('#invQty'), cat = $('#invCat');
  const add = $('#invAddBtn'), list = $('#invList');

  function paint(){
    const items = loadInv();
    list.innerHTML = '';
    if(!items.length){
      const li = document.createElement('li');
      li.innerHTML = `<div class="muted">No items yet. Add your first piece of gear.</div>`;
      list.appendChild(li);
      return;
    }
    items.forEach((it, idx)=>{
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="row" style="justify-content:space-between;align-items:center">
          <div><strong>${it.name}</strong><div class="muted">${it.qty||0} • ${it.cat||'Other'}</div></div>
          <button class="btn danger" data-del="${idx}">Delete</button>
        </div>`;
      list.appendChild(li);
    });
  }

  paint();

  add?.addEventListener('click', ()=>{
    const n = (name.value||'').trim(); if(!n) return;
    const q = Number(qty.value)||0;
    const c = (cat.value||'Other').trim();
    const items = loadInv();
    items.unshift({name:n, qty:q, cat:c});
    saveInv(items);
    name.value=''; qty.value=''; cat.value='';
    paint();
  });

  list.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-del]');
    if(!del) return;
    const idx = parseInt(del.dataset.del,10);
    const items = loadInv();
    items.splice(idx,1); saveInv(items); paint();
  });

  $('#invExportBtn')?.addEventListener('click', ()=>{
    const rows = [['Name','Qty','Category']];
    loadInv().forEach(i=>rows.push([i.name,i.qty,i.cat||'Other']));
    const csv = rows.map(r=>r.map(csvEsc).join(',')).join('\n');
    downloadText(csv, 'lifeline-inventory.csv');
  });

  $('#invClearBtn')?.addEventListener('click', ()=>{
    if(confirm('Clear all inventory items?')){
      saveInv([]); paint();
    }
  });
}