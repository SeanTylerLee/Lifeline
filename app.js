/* LifeLine – Offline Survival PWA with Content Packs
   - Hash-based views
   - Embedded content packs (all offline)
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

// ---------- Base Data (core tips) ----------
const CORE_TIPS = [
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

// ---------- Content Packs (all offline, toggleable) ----------
/* Each pack has: id, name, desc, tips[] (same shape as CORE_TIPS) */
const PACKS = [
  {
    id: "first-aid-extended",
    name: "First Aid Extended",
    desc: "Bleeding control, fractures, burns, shock, meds.",
    tips: [
      { id:"bleeding-control", group:"First Aid", tags:["bleeding","tourniquet"],
        title:"Bleeding Control (Stop the Bleed)",
        body:`<p>Direct pressure 5–10 min continuous. Pack deep wounds with gauze (hemostatic if available). Tourniquet 2–3 inches above wound (no joints), tighten until bleeding stops; record time.</p>`},
      { id:"fractures-splint", group:"First Aid", tags:["fracture","splint"],
        title:"Splinting Fractures",
        body:`<p>Immobilize joint above & below. Pad voids. Check pulse/sensation before & after. Do not attempt reduction unless no distal pulse.</p>`},
      { id:"burns-field", group:"First Aid", tags:["burn","cooling"],
        title:"Field Care for Burns",
        body:`<p>Stop the burn, cool with clean water 10–20 min (not ice). Cover loosely with sterile non-adherent dressing. Avoid popping blisters. Hydrate aggressively for large burns.</p>`},
      { id:"shock-signs", group:"First Aid", tags:["shock"],
        title:"Recognize & Treat Shock",
        body:`<ul><li>Pale, clammy, fast pulse, confusion.</li><li>Lay supine, elevate legs if no trauma suspicion.</li><li>Keep warm, stop bleeding, small sips if conscious.</li></ul>`}
    ]
  },
  {
    id: "disaster-playbooks",
    name: "Disaster Playbooks",
    desc: "Specific steps for hurricanes, wildfires, floods, blackouts.",
    tips: [
      { id:"hurricane-prepare", group:"Disasters", tags:["hurricane","evacuate"],
        title:"Hurricane Prep & Evac",
        body:`<p>Fuel vehicles, fill bathtubs with water, set freezer to coldest. Evac if in surge/evac zones; otherwise shelter in interior room. Text not call.</p>`},
      { id:"wildfire-ready", group:"Disasters", tags:["wildfire","smoke"],
        title:"Wildfire: Ready, Set, Go",
        body:`<p>Pack go-bags, back car into driveway, move combustibles 30ft from home, close vents. If trapped: shelter in cleared area or inside vehicle; cover mouth with cloth.</p>`},
      { id:"flood-escape", group:"Disasters", tags:["flood"],
        title:"Flood & Flash Flood",
        body:`<p>Turn around, don’t drown. 6 inches knocks you down; 12 inches moves a car. Seek higher ground immediately; avoid canyons and dry washes.</p>`},
      { id:"blackout-72", group:"Disasters", tags:["power","blackout"],
        title:"Extended Blackout",
        body:`<p>One room living: insulate a small room, cover windows. Rotate fridge/freezer access, cook perishables first. Vent generators outdoors 20ft+ from openings.</p>`}
    ]
  },
  {
    id: "wilderness-survival",
    name: "Wilderness Survival",
    desc: "Navigation, shelter, water, food, animals.",
    tips: [
      { id:"shelter-priorities", group:"Shelter/Heat", tags:["shelter"],
        title:"Shelter Priorities (Rule of 3s)",
        body:`<p>3 minutes without air, 3 hours without shelter, 3 days without water, 3 weeks without food. Site: above low spots, away from dead limbs, near resources.</p>`},
      { id:"trap-food", group:"Food", tags:["trapping","foraging"],
        title:"Emergency Food",
        body:`<p>Energy first: nuts, seeds, fish. Simple traps (figure-4, snare) where legal; conserve calories. Avoid unknown plants unless <b>positively identified</b>.</p>`},
      { id:"animal-encounters", group:"Wildlife", tags:["bears","cats","snakes"],
        title:"Animal Encounters",
        body:`<ul><li>Bear: make yourself big, speak calmly; spray at 25–30 ft; do not run.</li><li>Cougar: maintain eye contact, back away slowly.</li><li>Snakebite: immobilize limb, no cutting/sucking; reach care.</li></ul>`}
    ]
  },
  {
    id: "urban-emergencies",
    name: "Urban Emergencies",
    desc: "Active threat, building fires, elevator stuck, crowd crush.",
    tips: [
      { id:"active-threat", group:"Urban", tags:["run hide fight"],
        title:"Active Threat: Run • Hide • Fight",
        body:`<p><b>Run:</b> if clear route--leave belongings, help others if you can. <b>Hide:</b> lock, blockade, silence devices. <b>Fight:</b> last resort--improvise weapons, commit decisively.</p>`},
      { id:"apartment-fire", group:"Urban", tags:["fire","smoke"],
        title:"Apartment / Hotel Fire",
        body:`<p>Feel door with back of hand. If hot, seal room, signal at window. If cool, stay low, close doors behind you. Never use elevators during a fire.</p>`},
      { id:"crowd-crush", group:"Urban", tags:["crowd"],
        title:"Crowd Crush Survival",
        body:`<p>Hands up in front of chest (boxer stance) to protect space. Move diagonally toward edges when waves subside; avoid the ground; help others up.</p>`}
    ]
  },
  {
    id: "comms-navigation",
    name: "Comms & Navigation",
    desc: "Offline comms, radio basics, paper maps, field nav.",
    tips: [
      { id:"family-plan", group:"Comms", tags:["family","rally"],
        title:"Family Communication Plan",
        body:`<p>Pick 2 rally points (local & regional). Agree on an out-of-area contact. Text format: WHO • WHERE • STATUS • NEXT. Review quarterly.</p>`},
      { id:"radio-basics", group:"Comms", tags:["frs","gmrs","ham"],
        title:"Handheld Radio Basics",
        body:`<p>Start with FRS/GMRS. Keep radios on channel + privacy code. Use clear text; keep transmissions &lt;10 seconds. Carry spare batteries and a paper frequency card.</p>`},
      { id:"field-nav", group:"Navigation", tags:["map","compass"],
        title:"Map & Compass in 60 Seconds",
        body:`<p>Orient map to terrain. Identify your position with two features (resection). Set bearing with baseplate compass, follow handrail features (ridges, streams, roads).</p>`}
    ]
  }
];

// ---------- Local storage helpers ----------
const LS = {
  read:k => JSON.parse(localStorage.getItem(k) || "null"),
  write:(k,v)=> localStorage.setItem(k, JSON.stringify(v))
};
if(!LS.read("lifeline_saved")) LS.write("lifeline_saved", []);      // saved tip ids
if(!LS.read("lifeline_notes")) LS.write("lifeline_notes", {});       // id -> note
if(!LS.read("lifeline_lists")) LS.write("lifeline_lists", [
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
]);
// Enable a couple of packs by default (can change here)
if(!LS.read("lifeline_packs_enabled")) LS.write("lifeline_packs_enabled", ["first-aid-extended","disaster-playbooks"]);

// ---------- Helpers for packs ----------
function getEnabledPacks(){
  const ids = new Set(LS.read("lifeline_packs_enabled") || []);
  return PACKS.filter(p=>ids.has(p.id));
}
function allTips(){
  // Combine core + enabled packs; ensure unique IDs
  const map = new Map();
  CORE_TIPS.forEach(t=>map.set(t.id,t));
  getEnabledPacks().forEach(pack => pack.tips.forEach(t => map.set(t.id,t)));
  return Array.from(map.values());
}

// ---------- Build UI ----------
const guideList = document.getElementById("guideList");
const libraryList = document.getElementById("libraryList");
const savedList = document.getElementById("savedList");
const savedEmpty = document.getElementById("savedEmpty");
const activePacksBadge = document.getElementById("activePacksBadge");

// group tips by category
function byGroup(tips){
  const map = {};
  tips.forEach(t => { (map[t.group] ||= []).push(t); });
  return map;
}

// render Guides accordion
function renderGuides(filter=""){
  guideList.innerHTML = "";
  const tips = allTips();
  const groups = byGroup(tips);
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

  // show active packs
  const enabled = getEnabledPacks().map(p=>p.name);
  activePacksBadge.textContent = enabled.length ? `Active packs: ${enabled.join(", ")}` : "No packs active.";
}

// render Library (all tips)
function renderLibrary(){
  libraryList.innerHTML = "";
  allTips().forEach(t=>{
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
    const tip = allTips().find(t=>t.id===id);
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

  // list actions
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
  const tip = allTips().find(t=>t.id===id);
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

// ---------- Packs Manager ----------
const packsDialog = document.getElementById("packsDialog");
const packsList = document.getElementById("packsList");
document.getElementById("navMenu").addEventListener("click", ()=>{
  renderPacksManager();
  packsDialog.showModal();
});
document.getElementById("closePacksBtn").addEventListener("click", ()=> packsDialog.close());

function renderPacksManager(){
  const enabled = new Set(LS.read("lifeline_packs_enabled") || []);
  packsList.innerHTML = "";
  PACKS.forEach(pack=>{
    const card = document.createElement("div");
    card.className = "card";
    const on = enabled.has(pack.id);
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-weight:700">${pack.name}</div>
          <div class="muted" style="font-size:13px;margin-top:4px;">${pack.desc}</div>
        </div>
        <button class="ghost small" data-pack="${pack.id}">${on ? "Disable" : "Enable"}</button>
      </div>
      <div class="muted" style="margin-top:8px;font-size:12px;">${pack.tips.length} tips</div>`;
    packsList.appendChild(card);
  });

  packsList.querySelectorAll("button[data-pack]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.pack;
      const set = new Set(LS.read("lifeline_packs_enabled") || []);
      if(set.has(id)) set.delete(id); else set.add(id);
      LS.write("lifeline_packs_enabled", [...set]);
      // Re-render everything so changes take effect immediately
      renderPacksManager();
      renderGuides(searchInput?.value || "");
      renderLibrary();
      renderSaved();
    });
  });
}

// ---------- Back ----------
document.getElementById("navBack").addEventListener("click", ()=>{
  history.length > 1 ? history.back() : showView("home");
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