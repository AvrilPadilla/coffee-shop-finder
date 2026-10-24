// ---------- The colleges ----------
// available: true means we have study-spot data for that school.
// Right now that's only Saddleback.
const colleges = [
    { id: "saddleback", name: "Saddleback College", city: "Mission Viejo, CA", available: true },
    { id: "ivc", name: "Irvine Valley College", city: "Irvine, CA", available: false },
    { id: "occ", name: "Orange Coast College", city: "Costa Mesa, CA", available: false },
    { id: "sac", name: "Santa Ana College", city: "Santa Ana, CA", available: false },
    { id: "fullerton", name: "Fullerton College", city: "Fullerton, CA", available: false },
    { id: "uci", name: "UC Irvine", city: "Irvine, CA", available: false },
    { id: "cpp", name: "Cal Poly Pomona", city: "Pomona, CA", available: false }
];

// ---------- Page elements ----------
const list = document.getElementById("college-list");
const searchBox = document.getElementById("college-search");
const listLabel = document.getElementById("list-label");
const message = document.getElementById("message");
const startButton = document.getElementById("start");

// ---------- Saving to the browser ----------
// localStorage remembers things on this device. It can fail (for example in
// private browsing), so every use is wrapped in try/catch.
function save(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
}
function load(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
}

let selectedId = load("crunchSchool");   // remembers the choice from last time

// ---------- Drawing the list ----------
const pinIcon =
    '<svg class="pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

function rightSide(college) {
    if (!college.available) return '<span class="badge">Coming soon</span>';
    if (college.id === selectedId) return '<span class="tag">&#10003;</span>';
    return '<span class="tag">&rsaquo;</span>';
}

function render() {
    const query = searchBox.value.trim().toLowerCase();

    // Keep colleges whose name or city contains what was typed
    const matches = colleges.filter((c) =>
        (c.name + " " + c.city).toLowerCase().includes(query)
    );

    listLabel.textContent = query ? "Results" : "Popular nearby";

    list.innerHTML = matches.map((c) => `
    <button class="college ${c.available ? "" : "soon"} ${c.id === selectedId ? "selected" : ""}"
            type="button" data-id="${c.id}">
      ${pinIcon}
      <span class="info">
        <span class="name">${c.name}</span>
        <span class="city">${c.city}</span>
      </span>
      ${rightSide(c)}
    </button>
  `).join("");

    // Nothing matched: this school has no data yet
    if (matches.length === 0) {
        message.textContent = `We don't have "${searchBox.value.trim()}" yet. Coming soon!`;
    } else if (!message.dataset.sticky) {
        message.textContent = "";
    }
}

// ---------- Events ----------
// Typing in the search bar redraws the list
searchBox.addEventListener("input", () => {
    delete message.dataset.sticky;
    render();
});

// Clicking a college (one listener for the whole list)
list.addEventListener("click", (event) => {
    const button = event.target.closest(".college");
    if (!button) return;

    const college = colleges.find((c) => c.id === button.dataset.id);

    if (!college.available) {
        message.dataset.sticky = "yes";
        message.textContent = `${college.name} is coming soon. We're starting with Saddleback.`;
        return;
    }

    selectedId = college.id;
    save("crunchSchool", selectedId);
    delete message.dataset.sticky;
    render();
});

render();