/* LifeLine – Offline Survival PWA
   - Hash-based views
   - Local, embedded data for true offline use
   - Saved tips and personal notes in localStorage
   - Service Worker registers automatically
*/

// ---------- Simple router ----------
const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".bottomnav .nav-item");
function showView(name){
  views.forEach(v => v.classList.toggle("active", v.dataset.view === name));
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  location.hash = "#" + name;
}
window.addEventListener("hashchange", () => {
  const target = (location.hash || "#home").replace("#","");
  showView(target);
});
showView((location.hash || "#home").replace("#",""));

// ---------- Data (all local/offline) ----------
/* Each tip has:
   id, title, body (HTML allowed), tags [strings], group (category)
*/
const TIPS = [
  { id:"first-aid-abc", group:"First Aid", tags:["bleeding","airway","breathing"],
    title:"First Aid ABCs",
    body:`<ol>
      <li><b>Airway:</b> Tilt head, lift chin. Clear obstructions.</li>
      <li><b>Breathing:</b> Look, listen, feel. 2 rescue breaths if not breathing.</li>
      <li><b>Circulation:</b> Check pulse. Begin compressions 100–120/min.</li>
    </ol>
    <p class="muted">Use clean cloth for bleeding; direct pressure > tourniquet (extremity, last resort).</p>`
  },
  { id:"water-safe", group:"Water", tags:["purification","boil","filter"],
    title:"Make Water Safe to Drink",
    body:`<ul>
      <li><b>Boil:</b> Rolling 1 minute (3 minutes above 6,500 ft).</li>
      <li><b>Filter + Chemical:</b> 0.1–0.2μm filter, then chlorine dioxide tablets.</li>
      <li><b>Solar UV:</b> Clear PET bottle in direct sun 6 hours (SODIS method).</li>
    </ul>`
  },
  { id:"signal-rescue", group:"Signal", tags:["rescue","signal","sos"],
    title:"Signal for Rescue",
    body:`<p>Rule of 3: three whistle blasts, three fires, or three mirror flashes.</p>
         <p>Ground-to-air: giant <b>V</b> (require assistance), <b>X</b> (need medical), arrow → direction of travel.</p>`
  },
  { id:"fire-heat", group:"Shelter/Heat", tags:["fire","warmth","hypothermia"],
    title:"Emergency Fire & Heat",
    body:`<p>Build on dry base (bark/rocks). Tinder → kindling → fuel. Shield from wind. Keep a backup: lighter + ferro rod + storm matches.</p>
         <p>Hypothermia: remove wet clothing, warm core first (chest, neck, groin), warm, sweet drinks if conscious.</p>`
  },
  { id:"earthquake", group:"Disasters", tags:["earthquake"],
    title:"Earthquake: Drop, Cover, Hold On",
    body:`<p>Drop to hands/knees, Cover head/neck under sturdy furniture, Hold on until shaking stops. After shocks likely--get away from hazards, check gas leaks, text not call.</p>`
  },
  { id:"storm-kit", group:"Kits", tags:["go bag","72 hour"],
    title:"72-Hour Go-Bag Essentials",
    body:`<ul>
      <li>Water: 3L per person/day; filter & tablets.</li>
      <li>Calories: 2,000/day; high-cal, no-cook.</li>
      <li>Light: headlamp + spare batteries.</li>
      <li>First aid: pressure bandage, meds, tape, gloves.</li>
      <li>Tools: multi-tool, cordage, tape, knife.</li>
      <li>Comms: whistle, mirror, power bank, radio.</li>
      <li>Docs: IDs, cash, emergency contacts.</li>
    </ul>`
  }
];

// Default checklists (local, editable)
const DEFAULT_LISTS = [
  { id:"gobag", name:"Go-Bag", items:[
    "3L water / person", "High-cal food (no-cook)", "Headlamp + batteries",
    "Multitool / knife", "First aid kit", "Power bank + cable",
    "Copy of IDs + cash", "Whistle / signal mirror"
  ]},
  { id:"homekit", name:"Home Kit", items:[
    "Water (1 gal/person/day, 7 days)", "Portable water filter",
    "Fire extinguisher", "Battery/hand-crank radio",
    "Sanitation supplies", "Spare meds for 7–14 days"
  ]},
  { id:"vehicle", name:"Vehicle", items:[
    "Jumper cables", "Tire repair / inflator", "Blanket", "Rain gear",
    "First aid kit", "Water + snacks", "Maps (paper)"
  ]}
];

// ---------- Local storage helpers ----------
const LS = {
  read:k => JSON.parse(localStorage.getItem(k) || "null"),
  write:(k,v)=> localStorage.setItem(k, JSON.stringify(v))
};
if(!LS.read("lifeline_saved")) LS.write("lifeline_saved", []);      // saved tip ids
if(!LS.read("lifeline_notes")) LS.write("lifeline_notes", {});       // id -> note
if(!LS.read("lifeline_lists")) LS.write("lifeline_lists", DEFAULT_LISTS);

// ---------- Build UI ----------
const guideList = document.getElementById("guideList");
const libraryList = document.getElementById("libraryList");
const savedList = document.getElementById("savedList");
const savedEmpty = document.getElementById("savedEmpty");

// group TIPS by category
function byGroup(){
  const map = {};
  TIPS.forEach(t => { (map[t.group] ||= []).push(t); });
  return map;
}

// render Guides accordion
function renderGuides(filter=""){
  guideList.innerHTML = "";
  const groups = byGroup();
  const q = filter.trim().toLowerCase();
  Object.entries(groups).forEach(([group, items])=>{
    const filtered = q ? items.filter(t => (t.title+" "+t.tags.join(" ")+t.group).toLowerCase().includes(q)) : items;
    if(!filtered.length) return;
    const details = document.createElement("details");
    details.className = "group";
    const summary = document.createElement("summary");
    summary.innerHTML = `${group} <span class="badge">${filtered.length}</span>`;
    const wrap = document.createElement("div"); wrap.className = "items";
    filtered.forEach(t=>{
      const li = document.createElement("div");
      li.className = "list";
      li.innerHTML = `<li data-tip="${t.id}">${t.title} <span class="muted">• ${t.tags.join(", ")}</span></li>`;
      li.addEventListener("click", ()=> openTip(t.id));
      wrap.appendChild(li);
    });
    details.append(summary, wrap);
    guideList.appendChild(details);
  });
}

// render Library (all tips)
function renderLibrary(){
  libraryList.innerHTML = "";
  TIPS.forEach(t=>{
    const li = document.createElement("li");
    li.textContent = t.title;
    li.addEventListener("click", ()=> openTip(t.id));
    libraryList.appendChild(li);
  });
}

// render Saved section on Home
function renderSaved(){
  const saved = LS.read("lifeline_saved");
  savedList.innerHTML = "";
  if(!saved.length){ savedEmpty.style.display="block"; return; }
  savedEmpty.style.display="none";
  saved.forEach(id=>{
    const tip = TIPS.find(t=>t.id===id);
    if(!tip) return;
    const li = document.createElement("li");
    li.textContent = tip.title;
    li.addEventListener("click", ()=> openTip(tip.id));
    savedList.appendChild(li);
  });
}

// render Checklists
function renderLists(){
  const wrap = document.getElementById("checklistWrap");
  wrap.innerHTML = "";
  const lists = LS.read("lifeline_lists");
  lists.forEach(list=>{
    const box = document.createElement("div");
    box.className = "checklist";
    const head = document.createElement("div");
    head.className = "checklist-header";
    head.innerHTML = `<span>${list.name}</span>
      <span>
        <button class="small ghost" data-act="add" data-id="${list.id}">+ Item</button>
        <button class="small ghost" data-act="del" data-id="${list.id}">Delete</button>
      </span>`;
    const ul = document.createElement("ul");
    list.items.forEach((txt, idx)=>{
      const li = document.createElement("li");
      li.innerHTML = `<span class="checkmark"></span><span contenteditable="true">${txt}</span>
                      <button class="small ghost" data-act="rm-item" data-id="${list.id}" data-idx="${idx}">Remove</button>`;
      li.querySelector(".checkmark").addEventListener("click", e=>{
        e.currentTarget.classList.toggle("checked");
      });
      ul.appendChild(li);
    });
    box.append(head, ul);
    wrap.appendChild(box);
  });

  // list actions (add/remove/delete)
  wrap.querySelectorAll("button[data-act]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const lists = LS.read("lifeline_lists");
      const id = btn.dataset.id;
      const i = lists.findIndex(l=>l.id===id);
      if(btn.dataset.act==="del"){ lists.splice(i,1); }
      if(btn.dataset.act==="add"){
        const txt = prompt("New item:");
        if(txt) lists[i].items.push(txt);
      }
      if(btn.dataset.act==="rm-item"){
        lists[i].items.splice(parseInt(btn.dataset.idx),1);
      }
      LS.write("lifeline_lists", lists);
      renderLists();
    });
  });
}

// create custom list
document.getElementById("addCustomList").addEventListener("click", ()=>{
  const name = prompt("List name:");
  if(!name) return;
  const lists = LS.read("lifeline_lists");
  lists.push({ id: "custom-"+Date.now(), name, items: [] });
  LS.write("lifeline_lists", lists);
  renderLists();
});

// ---------- Tip drawer ----------
const drawer = document.getElementById("tipDrawer");
const tipTitle = document.getElementById("tipTitle");
const tipBody = document.getElementById("tipBody");
const saveBtn = document.getElementById("saveTip");
const noteBtn = document.getElementById("noteTip");
const noteDialog = document.getElementById("noteDialog");
const noteInput = document.getElementById("noteInput");
let currentTip = null;

function openTip(id){
  const tip = TIPS.find(t=>t.id===id);
  if(!tip) return;
  currentTip = tip;
  tipTitle.textContent = tip.title;
  const notes = LS.read("lifeline_notes")[id] || "";
  tipBody.innerHTML = tip.body + (notes ? `<hr/><p><b>Your note:</b> ${notes}</p>` : "");
  drawer.classList.add("open");
}
document.getElementById("closeDrawer").addEventListener("click", ()=> drawer.classList.remove("open"));

saveBtn.addEventListener("click", ()=>{
  if(!currentTip) return;
  const saved = new Set(LS.read("lifeline_saved"));
  if(saved.has(currentTip.id)) { saved.delete(currentTip.id); saveBtn.textContent="★ Save"; }
  else { saved.add(currentTip.id); saveBtn.textContent="★ Saved"; }
  LS.write("lifeline_saved", [...saved]);
  renderSaved();
});

noteBtn.addEventListener("click", ()=>{
  if(!currentTip) return;
  noteInput.value = (LS.read("lifeline_notes")[currentTip.id] || "");
  noteDialog.showModal();
});
document.getElementById("noteSaveBtn").addEventListener("click", ()=>{
  if(!currentTip) return;
  const notes = LS.read("lifeline_notes");
  notes[currentTip.id] = noteInput.value.trim();
  LS.write("lifeline_notes", notes);
  noteDialog.close();
  openTip(currentTip.id); // refresh body to show note
});

// ---------- Search ----------
const searchInput = document.getElementById("searchInput");
searchInput?.addEventListener("input", e => renderGuides(e.target.value));

// ---------- Quick actions on Home ----------
document.querySelectorAll("[data-quick]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const map = {
      firstAid:"first-aid-abc",
      water:"water-safe",
      fire:"fire-heat",
      signal:"signal-rescue",
    };
    openTip(map[btn.dataset.quick]);
  });
});

// ---------- Back / Menu ----------
document.getElementById("navBack").addEventListener("click", ()=>{
  history.length > 1 ? history.back() : showView("home");
});
document.getElementById("navMenu").addEventListener("click", ()=>{
  alert("Coming soon: Downloads, data export/import, and offline map tiles.");
});

// ---------- Initial renders ----------
renderGuides();
renderLibrary();
renderSaved();
renderLists();

// ---------- Service Worker ----------
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js'));
}