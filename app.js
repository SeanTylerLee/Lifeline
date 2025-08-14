// ==================== TOOL ORDER DRAG-AND-DROP ====================
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".tool-grid");
    let draggedItem = null;

    grid.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("tool-card")) {
            draggedItem = e.target;
            e.target.style.opacity = "0.5";
        }
    });

    grid.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("tool-card")) {
            e.target.style.opacity = "1";
            saveToolOrder();
        }
    });

    grid.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(grid, e.clientY);
        if (afterElement == null) {
            grid.appendChild(draggedItem);
        } else {
            grid.insertBefore(draggedItem, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".tool-card:not(.dragging)")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveToolOrder() {
        const order = [...grid.children].map(card => card.dataset.tool);
        localStorage.setItem("toolOrder", JSON.stringify(order));
    }

    function loadToolOrder() {
        const order = JSON.parse(localStorage.getItem("toolOrder"));
        if (order) {
            order.forEach(toolName => {
                const card = document.querySelector(`.tool-card[data-tool="${toolName}"]`);
                if (card) grid.appendChild(card);
            });
        }
    }
    loadToolOrder();
});

// ==================== COMPASS ====================
let compassDial = document.querySelector(".dial");
let headingText = document.querySelector(".heading");

if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
}

function handleOrientation(event) {
    let heading = event.alpha;
    if (typeof event.webkitCompassHeading !== "undefined") {
        heading = event.webkitCompassHeading; // iOS
    }
    if (heading !== null) {
        compassDial.style.transform = `rotate(${heading}deg)`;
        headingText.textContent = `${Math.round(heading)}°`;
    }
}

// ==================== UNIT CONVERTER ====================
document.getElementById("convertBtn").addEventListener("click", () => {
    const value = parseFloat(document.getElementById("convertValue").value);
    const from = document.getElementById("convertFrom").value;
    const to = document.getElementById("convertTo").value;
    let result = 0;

    // Simple length conversions example
    const conversions = {
        m: 1,
        km: 0.001,
        ft: 3.28084,
        mi: 0.000621371
    };
    result = value * (conversions[to] / conversions[from]);

    document.getElementById("convertResult").textContent = `${value} ${from} = ${result.toFixed(3)} ${to}`;
});

// ==================== MORSE CODE TRANSLATOR ====================
const morseMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..',
    'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....',
    '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
};

document.getElementById("morseBtn").addEventListener("click", () => {
    const input = document.getElementById("morseInput").value.toUpperCase();
    const output = input.split('').map(char => morseMap[char] || '').join(' ');
    document.getElementById("morseOutput").textContent = output;
});

// ==================== SOS FLASH TOOL ====================
document.getElementById("sosBtn").addEventListener("click", () => {
    const body = document.body;
    let pattern = [1,1,1,3,3,3,1,1,1]; // SOS in morse timing (short=1, long=3)
    let i = 0;

    function flash() {
        body.style.background = i % 2 === 0 ? "#fff" : "#000";
        setTimeout(() => {
            body.style.background = "#121212";
            i++;
            if (i < pattern.length * 2) {
                setTimeout(flash, pattern[Math.floor(i / 2)] * 200);
            }
        }, pattern[Math.floor(i / 2)] * 200);
    }
    flash();
});

// ==================== OFFLINE MAP PLACEHOLDER ====================
if (document.getElementById("mapContainer")) {
    document.getElementById("mapContainer").textContent = "Offline map feature placeholder";
}

// ==================== KNOT GALLERY ====================
function loadKnots() {
    const gallery = document.getElementById("knotGallery");
    const knots = [
        { name: "Square Knot", img: "images/knot-square.png" },
        { name: "Bowline Knot", img: "images/knot-bowline.png" },
        { name: "Clove Hitch", img: "images/knot-clove.png" }
    ];
    knots.forEach(knot => {
        let img = document.createElement("img");
        img.src = knot.img;
        img.alt = knot.name;
        gallery.appendChild(img);
    });
}
loadKnots();