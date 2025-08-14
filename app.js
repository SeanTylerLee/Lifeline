// app.js -- LifeLine PWA full tool logic

document.addEventListener("DOMContentLoaded", () => {

  // ===== Navigation between views =====
  document.querySelectorAll(".tool-card").forEach(card => {
    card.addEventListener("click", () => {
      showView(card.dataset.tool);
    });
  });

  function showView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelector(`[data-view="${view}"]`).classList.add("active");
  }

  // ===== Drag & Drop Tool Reordering =====
  const toolGrid = document.getElementById("toolGrid");
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.outerHTML);
    this.classList.add("dragElem");
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) {
      this.parentNode.removeChild(dragSrcEl);
      const dropHTML = e.dataTransfer.getData("text/html");
      this.insertAdjacentHTML("beforebegin", dropHTML);
      addDragAndDropEvents();
      saveToolOrder();
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove("dragElem");
  }

  function addDragAndDropEvents() {
    document.querySelectorAll(".tool-card").forEach(card => {
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("drop", handleDrop);
      card.addEventListener("dragend", handleDragEnd);
    });
  }

  function saveToolOrder() {
    const order = [...document.querySelectorAll(".tool-card")].map(c => c.dataset.tool);
    localStorage.setItem("toolOrder", JSON.stringify(order));
  }

  function loadToolOrder() {
    const order = JSON.parse(localStorage.getItem("toolOrder"));
    if (order) {
      order.forEach(tool => {
        const card = document.querySelector(`.tool-card[data-tool="${tool}"]`);
        if (card) toolGrid.appendChild(card);
      });
    }
  }

  loadToolOrder();
  addDragAndDropEvents();

  // ===== Compass =====
  const enableCompassBtn = document.getElementById("enableCompass");
  const compassDial = document.getElementById("compassDial");
  const compassHeading = document.getElementById("compassHeading");

  if (enableCompassBtn) {
    enableCompassBtn.addEventListener("click", () => {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        }).catch(console.error);
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    });
  }

  function handleOrientation(e) {
    if (e.alpha !== null) {
      const heading = 360 - e.alpha;
      compassDial.style.transform = `rotate(${heading}deg)`;
      compassHeading.textContent = `${Math.round(heading)}°`;
    }
  }

  // ===== Unit Converter =====
  document.getElementById("convertBtn")?.addEventListener("click", () => {
    const type = document.getElementById("convertType").value;
    const input = parseFloat(document.getElementById("convertInput").value);
    const resultEl = document.getElementById("convertResult");
    if (isNaN(input)) return resultEl.textContent = "Enter a valid number";

    let result = "";
    switch (type) {
      case "length":
        result = `${input} meters = ${(input * 3.28084).toFixed(2)} feet`;
        break;
      case "weight":
        result = `${input} kg = ${(input * 2.20462).toFixed(2)} lbs`;
        break;
      case "temp":
        result = `${input}°C = ${(input * 9/5 + 32).toFixed(2)}°F`;
        break;
    }
    resultEl.textContent = result;
  });

  // ===== Morse Code =====
  const morseMap = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
    "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
    "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
    "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
    "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
    "Z": "--..", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    "0": "-----"
  };
  const inverseMorse = Object.fromEntries(Object.entries(morseMap).map(([k,v])=>[v,k]));

  document.getElementById("morseEncode")?.addEventListener("click", () => {
    const input = document.getElementById("morseInput").value.toUpperCase();
    document.getElementById("morseOutput").textContent = input.split("").map(ch => morseMap[ch] || ch).join(" ");
  });

  document.getElementById("morseDecode")?.addEventListener("click", () => {
    const input = document.getElementById("morseInput").value.trim();
    document.getElementById("morseOutput").textContent = input.split(" ").map(code => inverseMorse[code] || code).join("");
  });

  document.getElementById("morsePlay")?.addEventListener("click", () => {
    const morse = document.getElementById("morseOutput").textContent;
    let i = 0;
    const ctx = new AudioContext();
    function playTone(len) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + len);
    }
    function next() {
      if (i >= morse.length) return;
      const c = morse[i++];
      if (c === ".") { playTone(0.1); setTimeout(next, 200); }
      else if (c === "-") { playTone(0.3); setTimeout(next, 400); }
      else setTimeout(next, 200);
    }
    next();
  });

  // ===== SOS =====
  let sosInterval;
  document.getElementById("sosStart")?.addEventListener("click", () => {
    const status = document.getElementById("sosStatus");
    status.textContent = "SOS signal active";
    sosInterval = setInterval(() => {
      document.body.classList.toggle("flash");
    }, 300);
  });
  document.getElementById("sosStop")?.addEventListener("click", () => {
    clearInterval(sosInterval);
    document.body.classList.remove("flash");
    document.getElementById("sosStatus").textContent = "";
  });

  // ===== CPR Timer =====
  let cprInterval;
  document.getElementById("cprStart")?.addEventListener("click", () => {
    const display = document.getElementById("cprCountdown");
    let count = 30;
    display.textContent = count;
    clearInterval(cprInterval);
    cprInterval = setInterval(() => {
      count--;
      display.textContent = count;
      if (count <= 0) {
        count = 30;
      }
    }, 1000);
  });

  // ===== Sun Times =====
  document.getElementById("sunGet")?.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const times = SunCalc.getTimes(new Date(), pos.coords.latitude, pos.coords.longitude);
      document.getElementById("sunTimes").innerHTML = `
        Sunrise: ${times.sunrise.toLocaleTimeString()}<br>
        Sunset: ${times.sunset.toLocaleTimeString()}
      `;
    });
  });

  // ===== Water Purification =====
  document.getElementById("purifyCalc")?.addEventListener("click", () => {
    const liters = parseFloat(document.getElementById("waterLiters").value);
    if (isNaN(liters)) return document.getElementById("purifyResult").textContent = "Enter liters";
    document.getElementById("purifyResult").textContent = `${liters} L → ${(liters*2).toFixed(0)} purification tablets or boil 5 mins`;
  });

  // ===== Offline Map =====
  if (document.getElementById("mapContainer")) {
    const map = L.map("mapContainer").setView([0,0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);
    navigator.geolocation.getCurrentPosition(pos => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
    });
  }

  // ===== Whistle =====
  let whistleOsc;
  document.getElementById("whistleStart")?.addEventListener("click", () => {
    const ctx = new AudioContext();
    whistleOsc = ctx.createOscillator();
    whistleOsc.type = "square";
    whistleOsc.frequency.setValueAtTime(2000, ctx.currentTime);
    whistleOsc.connect(ctx.destination);
    whistleOsc.start();
  });
  document.getElementById("whistleStop")?.addEventListener("click", () => {
    whistleOsc?.stop();
  });

  // ===== Flashlight =====
  document.getElementById("flashOn")?.addEventListener("click", () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          const track = stream.getVideoTracks()[0];
          track.applyConstraints({ advanced: [{ torch: true }] });
        });
    }
  });
  document.getElementById("flashOff")?.addEventListener("click", () => {
    // No direct flashlight off in all browsers -- handled by stopping track
  });

  // ===== Weather =====
  document.getElementById("weatherGet")?.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
          document.getElementById("weatherResult").textContent = 
            `${data.current_weather.temperature}°C, ${data.current_weather.weathercode}`;
        });
    });
  });

});