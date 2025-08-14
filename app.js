/* LifeLine – Offline Survival PWA with Content Packs + Tools
   - Hash-based views
   - Embedded content packs
   - Tools: Compass, Converter, Morse, SOS (all offline)
   - LocalStorage for notes/saved/lists/packs
   - Service Worker auto-register
*/

// ---------- Simple router ----------
const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".bottomnav .nav-item");
function showView(name){
  views.forEach(v => v.classList.toggle("active", v.dataset.view === name));
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  location.hash = "#" + name;
  // Stop any running audio/flash when leaving a tool
  if (!["tool-morse","tool-sos"].includes(name)) { stopMorse(); stopSOS(); }
}
window.addEventListener("hashchange", () => {
  const target = (location.hash || "#home").replace("#","");
  showView(target);
});
showView((location.hash || "#home").replace("#",""));

// ---------- Base Tips ----------
const CORE_TIPS = [
  { id:"first-aid-abc", group:"First Aid", tags:["bleeding","airway","breathing"],
    title:"First Aid ABCs",
    body:`<ol>
      <li><b>Airway:</b> Tilt head, lift chin. Clear obstructions.</li>
      <li><b>Breathing:</b> Look, listen, feel. 2 rescue breaths if not breathing.</li>
      <li><b>Circulation:</b> Check pulse. Begin compressions 100–120/min.</li>
    </ol>
    <p class="muted">Use clean cloth for bleeding; direct pressure > tourniquet (extremity, last resort).</p>`},
  { id:"water-safe", group:"Water", tags:["purification","boil","filter"],
    title:"Make Water Safe to Drink",
    body:`<ul>
      <li><b>Boil:</b> Rolling 1 minute (3 minutes above 6,500 ft).</li>
      <li><b>Filter + Chemical:</b> 0.1–0.2μm filter, then chlorine dioxide tablets.</li>
      <li><b>Solar UV:</b> Clear PET bottle in direct sun 6 hours (SODIS method).</li>
    </ul>`},
  { id:"signal-rescue", group:"Signal", tags:["rescue","signal","sos"],
    title:"Signal for Rescue",
    body:`<p>Rule of 3: three whistle blasts, three fires, or three mirror flashes.</p>
         <p>Ground-to-air: giant <b>V</b> (require assistance), <b>X</b> (need medical), arrow → direction of travel.</p>`},
  { id:"fire-heat", group:"Shelter/Heat", tags:["fire","warmth","hypothermia"],
    title:"Emergency Fire & Heat",
    body:`<p>Build on dry base (bark/rocks). Tinder → kindling → fuel. Shield from wind. Keep a backup: lighter + ferro rod + storm matches.</p>
         <p>Hypothermia: remove wet clothing, warm core first, warm sweet drinks if conscious.</p>`},
  { id:"earthquake", group:"Disasters", tags:["earthquake"],
    title:"Earthquake: Drop, Cover, Hold On",
    body:`<p>Drop to hands/knees, Cover head/neck, Hold on until shaking stops. Aftershocks likely--check gas leaks; text not call.</p>`},
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
    </ul>`}
];

// ---------- Content Packs ----------
const PACKS = [
  { id:"first-aid-extended", name:"First Aid Extended", desc:"Bleeding control, fractures, burns, shock, meds.",
    tips:[
      { id:"bleeding-control", group:"First Aid", tags:["bleeding","tourniquet"],
        title:"Bleeding Control (Stop the Bleed)",
        body:`<p>Direct pressure 5–10 min. Pack deep wounds with gauze (hemostatic if available). Tourniquet 2–3 inches above wound (no joints), tighten until bleeding stops; record time.</p>`},
      { id:"fractures-splint", group:"First Aid", tags:["fracture","splint"],
        title:"Splinting Fractures",
        body:`<p>Immobilize joint above & below. Pad voids. Check pulse/sensation before & after. Do not attempt reduction unless no distal pulse.</p>`},
      { id:"burns-field", group:"First Aid", tags:["burn","cooling"],
        title:"Field Care for Burns",
        body:`<p>Cool with clean water 10–20 min (not ice). Cover with non-adherent dressing. Hydrate for large burns.</p>`},
      { id:"shock-signs", group:"First Aid", tags:["shock"],
        title:"Recognize & Treat Shock",
        body:`<ul><li>Pale, clammy, fast pulse, confusion.</li><li>Lay supine, elevate legs if no trauma.</li><li>Keep warm, stop bleeding, small sips if conscious.</li></ul>`}
    ]},
  { id:"disaster-playbooks", name:"Disaster Playbooks", desc:"Hurricanes, wildfires, floods, blackouts.",
    tips:[
      { id:"hurricane-prepare", group:"Disasters", tags:["hurricane","evacuate"],
        title:"Hurricane Prep & Evac",
        body:`<p>Fuel vehicles, fill bathtubs, set freezer to coldest. Evac if in surge zones; otherwise interior room. Text not call.</p>`},
      { id:"wildfire-ready", group:"Disasters", tags:["wildfire","smoke"],
        title:"Wildfire: Ready, Set, Go",
        body:`<p>Pack go-bags, back car into driveway, clear combustibles 30ft from home, close vents. If trapped: shelter in cleared area or inside vehicle.</p>`},
      { id:"flood-escape", group:"Disasters", tags:["flood"],
        title:"Flood & Flash Flood",
        body:`<p>Turn around, don’t drown. 6\" knocks you down; 12\" moves a car. Seek higher ground immediately; avoid canyons and dry washes.</p>`},
      { id:"blackout-72", group:"Disasters", tags:["power","blackout"],
        title:"Extended Blackout",
        body:`<p>One room living. Vent generators outdoors 20ft+. Cook perishables first. Manage fridge/freezer access.</p>`}
    ]},
  { id:"wilderness-survival", name:"Wilderness Survival", desc:"Nav, shelter, water, food, wildlife.",
    tips:[
      { id:"shelter-priorities", group:"Shelter/Heat", tags:["shelter"],
        title:"Shelter Priorities (Rule of 3s)",
        body:`<p>3 minutes no air, 3 hours no shelter, 3 days no water, 3 weeks no food. Choose site above low spots, away from dead limbs, near resources.</p>`},
      { id:"trap-food", group:"Food", tags:["trapping","foraging"],
        title:"Emergency Food",
        body:`<p>Energy: nuts, seeds, fish. Simple traps where legal; conserve calories. Avoid unknown plants unless positively ID’d.</p>`},
      { id:"animal-encounters", group:"Wildlife", tags:["bears","cats","snakes"],
        title:"Animal Encounters",
        body:`<ul><li>Bear: make yourself big; spray at 25–30 ft; don’t run.</li><li>Cougar: eye contact; back away slowly.</li><li>Snakebite: immobilize limb; no cutting/sucking.</li></ul>`}
    ]},
  { id:"urban-emergencies", name:"Urban Emergencies", desc:"Active threat, building fires, elevator, crowd crush.",
    tips:[
      { id:"active-threat", group:"Urban", tags:["run hide fight"],
        title:"Active Threat: Run • Hide • Fight",
        body:`<p><b>Run:</b> clear route--go. <b>Hide:</b> lock, blockade, silence. <b>Fight:</b> last resort--improvise weapons, commit.</p>`},
      { id:"apartment-fire", group:"Urban", tags:["fire","smoke"],
        title:"Apartment / Hotel Fire",
        body:`<p>Feel door with back of hand. If hot: seal room, signal. If cool: stay low, close doors behind you. Don’t use elevators.</p>`},
      { id:"crowd-crush", group:"Urban", tags:["crowd"],
        title:"Crowd Crush Survival",
        body:`<p>Hands up (boxer stance). Move diagonally during lulls; avoid the ground; help others up.</p>`}
    ]},
  { id:"comms-navigation", name:"Comms & Navigation", desc:"Offline comms, radio basics, paper maps, field nav.",
    tips:[
      { id:"family-plan", group:"Comms", tags:["family","rally"],
        title:"Family Communication Plan",
        body:`<p>Pick two rally points. Out-of-area contact. Text format: WHO • WHERE • STATUS • NEXT. Review quarterly.</p>`},
      { id:"radio-basics", group:"Comms", tags:["frs","gmrs","ham"],
        title:"Handheld Radio Basics",
        body:`<p>FRS/GMRS to start. Keep channel + privacy code. Clear text; &lt;10s transmissions. Carry spare batteries.</p>`},
      { id:"field-nav", group:"Navigation", tags:["map","compass"],
        title:"Map & Compass in 60 Seconds",
        body:`<p>Orient map to terrain. Resection with two features. Set bearing with baseplate compass; follow handrails.</p>`}
    ]}
];

// ---------- LocalStorage ----------
const LS = {
  read:k => JSON.parse(localStorage.getItem(k) || "null"),
  write:(k,v)=> localStorage.setItem(k, JSON.stringify(v))
};
if(!LS.read("lifeline_saved")) LS.write("lifeline_saved", []);
if(!LS.read("lifeline_notes")) LS.write("lifeline_notes", {});
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
if(!LS.read("lifeline_packs_enabled")) LS.write("lifeline_packs_enabled", ["first-aid-extended","disaster-playbooks"]);

function getEnabledPacks(){
  const ids = new Set(LS.read("lifeline_packs_enabled") || []);
  return PACKS.filter(p=>ids.has(p.id));
}
function allTips(){
  const map = new Map();
  CORE_TIPS.forEach(t=>map.set(t.id,t));
  getEnabledPacks().forEach(p=>p.tips.forEach(t=>map.set(t.id,t)));
  return [...map.values()];
}

// ---------- Build UI: Guides/Library/Saved/Lists ----------
const guideList = document.getElementById("guideList");
const libraryList = document.getElementById("libraryList");
const savedList = document.getElementById("savedList");
const savedEmpty = document.getElementById("savedEmpty");
const activePacksBadge = document.getElementById("activePacksBadge");

function byGroup(tips){
  const map = {};
  tips.forEach(t => { (map[t.group] ||= []).push(t); });
  return map;
}
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
  const enabled = getEnabledPacks().map(p=>p.name);
  activePacksBadge.textContent = enabled.length ? `Active packs: ${enabled.join(", ")}` : "No packs active.";
}
function renderLibrary(){
  libraryList.innerHTML = "";
  allTips().forEach(t=>{
    const li = document.createElement("li");
    li.textContent = t.title;
    li.addEventListener("click", ()=> openTip(t.id));
    libraryList.appendChild(li);
  });
}
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
      li.querySelector(".checkmark").addEventListener("click", e=> e.currentTarget.classList.toggle("checked"));
      ul.appendChild(li);
    });
    box.append(head, ul);
    wrap.appendChild(box);
  });
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
document.getElementById("addCustomList").addEventListener("click", ()=>{
  const name = prompt("List name:"); if(!name) return;
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
  openTip(currentTip.id);
});

// ---------- Search ----------
const searchInput = document.getElementById("searchInput");
searchInput?.addEventListener("input", e => renderGuides(e.target.value));

// ---------- Packs Manager (via Tools hub button or top-right menu) ----------
const packsDialog = document.getElementById("packsDialog");
const packsList = document.getElementById("packsList");
document.getElementById("openPacks")?.addEventListener("click", ()=>{ renderPacksManager(); packsDialog.showModal(); });
document.getElementById("navMenu").addEventListener("click", ()=>{ renderPacksManager(); packsDialog.showModal(); });
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
      renderPacksManager(); renderGuides(searchInput?.value || ""); renderLibrary(); renderSaved();
    });
  });
}

// ---------- Tools: Compass ----------
const compassEnableBtn = document.getElementById("compassEnable");
const headingDeg = document.getElementById("headingDeg");
const headingCard = document.getElementById("headingCard");
const needle = document.getElementById("compassNeedle");
let compassActive = false;

function cardinal(d){
  const dirs=["N","NE","E","SE","S","SW","W","NW","N"];
  return dirs[Math.round(d/45)];
}
function setHeading(deg){
  headingDeg.textContent = `${Math.round(deg)}°`;
  headingCard.textContent = cardinal(deg);
  // Needle points to magnetic north: rotate opposite of device heading
  needle.style.transform = `translate(-50%, -100%) rotate(${-deg}deg)`;
}
function startCompass(){
  if(compassActive) return;
  const handler = (e)=>{
    let deg = null;
    // iOS Safari gives webkitCompassHeading (0=N)
    if (typeof e.webkitCompassHeading === "number") {
      deg = e.webkitCompassHeading;
    } else if (typeof e.alpha === "number") {
      // alpha: 0 = device facing north; use 360 - alpha to convert
      deg = 360 - e.alpha;
    }
    if (deg !== null) {
      deg = (deg + 360) % 360;
      setHeading(deg);
    }
  };
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    // iOS permission flow
    DeviceOrientationEvent.requestPermission().then(state=>{
      if(state === "granted"){
        window.addEventListener("deviceorientation", handler, true);
        compassActive = true;
        compassEnableBtn.style.display="none";
      }
    }).catch(()=> alert("Compass permission was denied. Try in Safari/iOS Settings."));
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientationabsolute" in window ? "deviceorientationabsolute":"deviceorientation", handler, true);
    compassActive = true;
    compassEnableBtn.style.display="none";
  } else {
    alert("Compass not supported on this device/browser.");
  }
}
compassEnableBtn?.addEventListener("click", startCompass);

// ---------- Tools: Converter ----------
const units = {
  length: { base:"m", map:{ m:1, km:1000, mi:1609.344, ft:0.3048, yd:0.9144, cm:0.01, in:0.0254 } },
  weight: { base:"kg", map:{ kg:1, g:0.001, lb:0.45359237, oz:0.028349523125 } },
  volume: { base:"L", map:{ L:1, mL:0.001, gal:3.785411784, "fl oz":0.0295735295625 } },
  speed:  { base:"m/s", map:{ "m/s":1, "km/h":0.2777777778, mph:0.44704 } },
  fuel:   { base:"km/L", map:{ "km/L":1, "L/100km":"inv", "mpg(US)":0.4251437075 } } // special for L/100km
};
const convCategory = document.getElementById("convCategory");
const fromVal = document.getElementById("convFromVal");
const toVal = document.getElementById("convToVal");
const fromUnit = document.getElementById("convFromUnit");
const toUnit = document.getElementById("convToUnit");
const convResult = document.getElementById("convResult");
document.getElementById("convSwap").addEventListener("click", ()=>{
  const a = fromUnit.value, b = toUnit.value; toUnit.value = a; fromUnit.value = b; computeConv();
});

function fillUnits(){
  const cat = convCategory.value;
  fromUnit.innerHTML = ""; toUnit.innerHTML = "";
  if(cat === "temp"){
    ["°C","°F","K"].forEach(u=>{
      fromUnit.add(new Option(u,u)); toUnit.add(new Option(u,u));
    });
  } else {
    Object.keys(units[cat].map).forEach(u=>{
      fromUnit.add(new Option(u,u)); toUnit.add(new Option(u,u));
    });
  }
  fromUnit.selectedIndex = 0; toUnit.selectedIndex = 1;
  computeConv();
}
function convertTemp(v, from, to){
  let c; // normalize to C
  if(from==="°C") c=v;
  if(from==="°F") c=(v-32)*5/9;
  if(from==="K")  c=v-273.15;
  if(to==="°C") return c;
  if(to==="°F") return c*9/5+32;
  if(to==="K")  return c+273.15;
}
function computeConv(){
  const cat = convCategory.value;
  const v = parseFloat(fromVal.value || "0");
  let out = v;

  if(cat === "temp"){
    out = convertTemp(v, fromUnit.value, toUnit.value);
  } else if (cat === "fuel"){
    // Special: L/100km is inverse of km/L scaled by 100
    const f = units.fuel.map;
    const toBase = (val, u)=>{
      if(u==="L/100km") return 100/(val); // convert to km/L
      if(u==="mpg(US)") return val * f["mpg(US)"]; // mpg → km/L
      return val; // km/L
    };
    const fromBase = (val, u)=>{
      if(u==="L/100km") return 100/(val);
      if(u==="mpg(US)") return val / f["mpg(US)"];
      return val;
    };
    out = fromBase(toBase(v, fromUnit.value), toUnit.value);
  } else {
    // Convert via base unit
    const map = units[cat].map;
    const base = (v * map[fromUnit.value]);    // to base
    out = base / map[toUnit.value];            // to target
  }

  toVal.value = out;
  convResult.textContent = `= ${Number(out).toLocaleString(undefined,{maximumFractionDigits:6})} ${toUnit.value}`;
}
convCategory.addEventListener("change", fillUnits);
[fromVal, fromUnit, toUnit].forEach(el=> el.addEventListener("input", computeConv));
fillUnits();

// ---------- Tools: Morse ----------
const MORSE = {
  a:"•--", b:"--•••", c:"--•--•", d:"--••", e:"•", f:"••--•", g:"----•", h:"••••", i:"••", j:"•------", k:"--•--",
  l:"•--••", m:"----", n:"--•", o:"------", p:"•----•", q:"----•--", r:"•--•", s:"•••", t:"--", u:"••--", v:"•••--",
  w:"•----", x:"--••--", y:"--•----", z:"----••",
  "1":"•--------","2":"••------","3":"•••----","4":"••••--","5":"•••••","6":"--••••","7":"----•••","8":"------••","9":"--------•","0":"----------",
  ".":"•--•--•--", ",":"----••----", "?":"••----••", "/":"--••--•", "@":"•----•--•", "-":"--••••--", " ":"/"
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
const morseText = document.getElementById("morseText");
const morseDots = document.getElementById("morseDots");
document.getElementById("morseEncode").addEventListener("click", ()=>{
  const msg = morseText.value.toLowerCase();
  const out = [...msg].map(ch => MORSE[ch] || "").join(" ");
  morseDots.value = out.trim();
});
document.getElementById("morseDecode").addEventListener("click", ()=>{
  const parts = morseDots.value.trim().split(/\s+/);
  const out = parts.map(p => REVERSE[p] ?? (p==="/" ? " " : "")).join("");
  morseText.value = out;
});

// Morse player (sound/screen/vibe)
let morsePlaying = false;
let ac = null, osc = null, flashTimer = null;
function beep(on){
  if(!on){ if(osc){ osc.stop(); osc.disconnect(); osc=null; } return; }
  if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  osc = ac.createOscillator(); const g = ac.createGain();
  osc.frequency.value = 700; osc.connect(g); g.connect(ac.destination);
  g.gain.value = 0.15; osc.start();
}
const flashEl = (()=>{ const d=document.createElement("div"); d.style.position="fixed"; d.style.inset="0"; d.style.background="#fff"; d.style.opacity="0"; d.style.pointerEvents="none"; d.style.transition="opacity .02s"; document.body.appendChild(d); return d; })();
function screenFlash(on){ flashEl.style.opacity = on? "1":"0"; }
function vibe(ms){ if(navigator.vibrate) navigator.vibrate(ms); }

function playMorse(seq, dot){
  let i=0;
  morsePlaying = true;
  const useSound = document.getElementById("morseSound").checked;
  const useScreen = document.getElementById("morseScreen").checked;
  const useVibe = document.getElementById("morseVibe").checked;

  function unitOn(ms){
    if(useSound) beep(true);
    if(useScreen) screenFlash(true);
    if(useVibe) vibe(ms);
    return new Promise(r=> setTimeout(r, ms));
  }
  function unitOff(ms){
    if(useSound) beep(false);
    if(useScreen) screenFlash(false);
    return new Promise(r=> setTimeout(r, ms));
  }

  (async function run(){
    const letters = seq.split(" ");
    for(let li=0; li<letters.length && morsePlaying; li++){
      const ch = letters[li];
      if(ch==="/"){ await unitOff(7*dot); continue; }
      for(let si=0; si<ch.length && morsePlaying; si++){
        const s = ch[si];
        await unitOn(s==="•" ? dot : 3*dot);
        await unitOff(dot); // gap between symbols
      }
      await unitOff(2*dot); // already had 1 dot gap; add 2 more to make 3 between letters
    }
    beep(false); screenFlash(false); morsePlaying=false;
  })();
}
function stopMorse(){ morsePlaying=false; beep(false); screenFlash(false); }

document.getElementById("morsePlay").addEventListener("click", ()=>{
  if(morsePlaying) return;
  const seq = morseDots.value.trim(); if(!seq) return;
  const dot = parseInt(document.getElementById("morseSpeed").value,10);
  playMorse(seq, dot);
});
document.getElementById("morseStop").addEventListener("click", stopMorse);

// ---------- Tools: SOS ----------
let sosTimer = null, sosRunning = false;
function runSOS(){
  const dot = parseInt(document.getElementById("sosSpeed").value,10);
  const useSound = document.getElementById("sosSound").checked;
  const useScreen = document.getElementById("sosScreen").checked;
  const useVibe = document.getElementById("sosVibe").checked;

  function on(ms){
    if(useSound) beep(true);
    if(useScreen) screenFlash(true);
    if(useVibe) vibe(ms);
    return new Promise(r=> setTimeout(r, ms));
  }
  function off(ms){
    if(useSound) beep(false);
    if(useScreen) screenFlash(false);
    return new Promise(r=> setTimeout(r, ms));
  }
  sosRunning = true;

  (async function loop(){
    while(sosRunning){
      // S: •••
      await on(dot); await off(dot);
      await on(dot); await off(dot);
      await on(dot); await off(3*dot);
      // O: -- -- --
      await on(3*dot); await off(dot);
      await on(3*dot); await off(dot);
      await on(3*dot); await off(3*dot);
      // S: •••
      await on(dot); await off(dot);
      await on(dot); await off(dot);
      await on(dot); await off(7*dot); // gap between words
    }
    beep(false); screenFlash(false);
  })();
}
function stopSOS(){ sosRunning=false; beep(false); screenFlash(false); }
document.getElementById("sosToggle").addEventListener("click", (e)=>{
  if(sosRunning){ stopSOS(); e.target.textContent="Start SOS"; }
  else { runSOS(); e.target.textContent="Stop SOS"; }
});



// ===== CPR Metronome =====
let cprTimer = null, cprAudio = null, cprRunning = false;
const cprBpm = document.getElementById("cprBpm");
const cprBpmRead = document.getElementById("cprBpmRead");
function cprBeep() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!cprAudio) cprAudio = new AC();
  const o = cprAudio.createOscillator();
  const g = cprAudio.createGain();
  o.type = "square";
  o.frequency.value = 800;
  g.gain.value = 0.2;
  o.connect(g); g.connect(cprAudio.destination);
  o.start();
  setTimeout(()=>{ o.stop(); }, 60); // short click
}
function startCPR() {
  if (cprRunning) return;
  const bpm = parseInt(cprBpm.value,10);
  const interval = 60000 / bpm;
  cprRunning = true;
  cprBeep();
  cprTimer = setInterval(cprBeep, interval);
}
function stopCPR() {
  cprRunning = false;
  if (cprTimer) clearInterval(cprTimer);
  cprTimer = null;
}
cprBpm?.addEventListener("input", ()=> { cprBpmRead.textContent = `${cprBpm.value} BPM`; });
document.getElementById("cprStart")?.addEventListener("click", startCPR);
document.getElementById("cprStop")?.addEventListener("click", stopCPR);


// ===== Sunrise / Sunset =====
// Convert degrees ↔ radians
const d2r = d=> d*Math.PI/180, r2d = r=> r*180/Math.PI;
// NOAA simplified sunrise equation
function sunTimesForDate(lat, lon, dateObj){
  // date to Julian day
  const ms = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
  const J2000 = Date.UTC(2000,0,1,12); // 2000-01-01 12:00 UTC
  const n = Math.floor((ms - J2000)/86400000);

  // solar mean anomaly
  const M = d2r((357.5291 + 0.98560028 * n) % 360);
  // equation of center
  const C = d2r((1.9148 * Math.sin(M)) + (0.0200 * Math.sin(2*M)) + (0.0003 * Math.sin(3*M)));
  // ecliptic longitude
  const λ = (M + C + d2r(102.9372) + Math.PI) % (2*Math.PI);
  // solar transit (approx)
  const Jtransit = 2451545 + n + 0.0053*Math.sin(M) - 0.0069*Math.sin(2*λ);

  // declination of sun
  const δ = Math.asin(Math.sin(λ) * Math.sin(d2r(23.44)));
  const φ = d2r(lat);
  const cosH = (Math.sin(d2r(-0.83)) - Math.sin(φ)*Math.sin(δ)) / (Math.cos(φ)*Math.cos(δ));
  if (cosH < -1 || cosH > 1) return null; // polar day/night

  const H = Math.acos(cosH);
  const Jrise = Jtransit - r2d(H)/360;
  const Jset  = Jtransit + r2d(H)/360;

  function jdToDate(jd){
    const unix = (jd - 2440587.5) * 86400000;
    return new Date(unix);
  }
  return { sunrise: jdToDate(Jrise), sunset: jdToDate(Jset) };
}
function fmtTimeLocal(d){
  return d ? d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "--";
}
const sunLat = document.getElementById("sunLat");
const sunLon = document.getElementById("sunLon");
const sunDate = document.getElementById("sunDate");
const sunriseOut = document.getElementById("sunriseOut");
const sunsetOut = document.getElementById("sunsetOut");
const sunDurOut = document.getElementById("sunDurOut");

document.getElementById("sunUseGPS")?.addEventListener("click", ()=>{
  if(!navigator.geolocation) return alert("GPS not supported.");
  navigator.geolocation.getCurrentPosition(pos=>{
    sunLat.value = pos.coords.latitude.toFixed(4);
    sunLon.value = pos.coords.longitude.toFixed(4);
  }, ()=> alert("Unable to access GPS."));
});

document.getElementById("sunCalc")?.addEventListener("click", ()=>{
  const lat = parseFloat(sunLat.value);
  const lon = parseFloat(sunLon.value);
  const d = sunDate.value ? new Date(sunDate.value+"T00:00:00") : new Date();
  if (Number.isNaN(lat) || Number.isNaN(lon)) return alert("Enter latitude and longitude.");
  // Use UTC date for calculation, then display local
  const res = sunTimesForDate(lat, lon, new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  if(!res){ sunriseOut.textContent = "--"; sunsetOut.textContent = "--"; sunDurOut.textContent = "Polar day/night"; return; }
  sunriseOut.textContent = fmtTimeLocal(res.sunrise);
  sunsetOut.textContent  = fmtTimeLocal(res.sunset);
  const durMs = res.sunset - res.sunrise;
  const hrs = Math.floor(durMs/3600000), mins = Math.round((durMs%3600000)/60000);
  sunDurOut.textContent = `${hrs}h ${mins}m`;
});


// ===== Water Purification Calculator =====
function feetToMeters(ft){ return ft * 0.3048; }
function galToLiters(g){ return g * 3.785411784; }
function mlToLiters(ml){ return ml / 1000; }

document.getElementById("purifyCalc")?.addEventListener("click", ()=>{
  const altV = parseFloat(document.getElementById("altValue").value);
  const altU = document.getElementById("altUnit").value;
  const volV = parseFloat(document.getElementById("volValue").value);
  const volU = document.getElementById("volUnit").value;
  const out = document.getElementById("purifyOut");

  if (Number.isNaN(altV) || Number.isNaN(volV)) { out.textContent = "Enter altitude and volume."; return; }

  // Normalize
  const altitude_m = altU === "m" ? altV : feetToMeters(altV);
  let liters;
  if (volU === "L") liters = volV;
  else if (volU === "mL") liters = mlToLiters(volV);
  else liters = galToLiters(volV);

  // Boiling point (approx) and boil guidance
  // Simple rule: 1 min rolling boil at low altitude; 3 min above ~2000 m (≈ 6,562 ft)
  const boilMinutes = altitude_m >= 2000 ? 3 : 1;

  // Tablet dosing (typical chlorine dioxide: 1 tablet / 1 L). Round up.
  const tablets = Math.max(1, Math.ceil(liters));

  out.innerHTML = `
    <div><b>Volume:</b> ${liters.toFixed(2)} L</div>
    <div><b>Boil time:</b> ${boilMinutes} minute(s) at rolling boil</div>
    <div><b>Tablet dose (typical):</b> ${tablets} tablet(s)</div>
    <div class="muted" style="margin-top:6px;">Always follow product label; cloudy water needs longer contact time/filtration.</div>
  `;
});


// ===== Knot Guide =====
const KNOTS = {
  bowline: [
    "Make a small loop (the rabbit hole) near the end.",
    "Pass the working end up through the loop (the rabbit comes out).",
    "Wrap it around the standing part (around the tree).",
    "Pass it back down the loop (back into the hole) and tighten."
  ],
  clove: [
    "Wrap the rope around the post once.",
    "Cross over the standing part and wrap around again.",
    "Tuck the working end under the last wrap and snug tight."
  ],
  square: [
    "Left end over right end and under (first overhand).",
    "Right end over left end and under (second overhand).",
    "Tighten both standing parts; ends exit same side."
  ]
};
const knotSelect = document.getElementById("knotSelect");
const knotSteps = document.getElementById("knotSteps");
function renderKnot(id){
  const steps = KNOTS[id] || [];
  knotSteps.innerHTML = steps.map(s=>`<li>${s}</li>`).join("");
}
knotSelect?.addEventListener("change", ()=> renderKnot(knotSelect.value));
renderKnot("bowline");













// ---------- Back button ----------
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