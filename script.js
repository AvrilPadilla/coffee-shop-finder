// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");

let allShops = [];

const SCHOOLS = {
  saddleback: {
    name: "Saddleback College",
    lat: 33.553,
    lng: -117.665
  },
  ivc: {
    name: "Irvine Valley College",
    lat: 33.676,
    lng: -117.778
  }
}

const selectedSchool = localStorage.getItem("selectedSchool") || "saddleback";

const school = SCHOOLS[selectedSchool] || SCHOOLS.saddleback;

const map = L.map("map").setView([school.lat, school.lng], 14);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

// Turn true/false into words people can read
function wifiText(hasWifi) {
  return hasWifi ? "Yes" : "No";
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Build the HTML for ONE shop
function makeCard(shop) {
  return `
    <article class="card">
      <h3>${shop.name}</h3>
      <p class="address">${shop.address}</p>
      <ul>
        <li>Wifi: ${wifiText(shop.wifi)}</li>
        <li>Outlets: ${capitalize(shop.outlets)}</li>
        <li>Noise: ${capitalize(shop.noise)}</li>
        <li>Seating: ${capitalize(shop.seating)}</li>
      </ul>
    </article>
  `;
}

const PIN_SIZES = { study: 28, food: 20, activity: 16, campus: 12 };

function makePin(type) {
  const kind = type in PIN_SIZES ? type : "study";   // unknown types fall back to study
  const size = PIN_SIZES[kind];
  return L.divIcon({
    className: "",
    html: `<div class="pin pin-${kind}" style="width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// Put a list of shops onto the page

function showShops(shops) {
  if (shops.length === 0) {
    cardContainer.innerHTML = "<p>No shops match those filters. Try loosening one.</p>";
  } else {
    cardContainer.innerHTML = shops.map(makeCard).join("");
  }

  markerLayer.clearLayers();

  shops.forEach((shop) => {
    if (typeof shop.lat !== "number" || typeof shop.lng !== "number") return;

    L.marker([shop.lat, shop.lng], {
      icon: makePin(shop.type)
    })
      .bindPopup(`<strong>${shop.name}</strong><br>${shop.address}`)
      .addTo(markerLayer);
  });
}


// Load the data file, then show it
async function loadShops() {
  try {
    const response = await fetch("shops.json");
    const shops = await response.json();
    allShops = shops;
    showShops(shops);
  } catch (error) {
    // If something goes wrong, tell the user and log details for you
    cardContainer.innerHTML = "<p>Could not load shops. Check shops.json for typos.</p>";
    console.error("Problem loading shops:", error);
  }
}

// Words turned into numbers so we can compare them
const RANK = {
  limited: 0, some: 1, plenty: 2,   // outlets
  quiet: 0, moderate: 1, loud: 2,   // noise
  small: 0, medium: 1, large: 2     // seating
};

const wifiBox = document.getElementById("filter-wifi");
const outletsSelect = document.getElementById("filter-outlets");
const noiseSelect = document.getElementById("filter-noise");
const seatingSelect = document.getElementById("filter-seating");

// Does ONE shop pass ALL the filters? "return false" means reject it.
function matchesFilters(shop) {
  if (wifiBox.checked && shop.wifi !== true) return false;

  // Outlets and seating: at least this much
  if (outletsSelect.value !== "any" && RANK[shop.outlets] < RANK[outletsSelect.value]) return false;
  if (seatingSelect.value !== "any" && RANK[shop.seating] < RANK[seatingSelect.value]) return false;

  // Noise: no louder than this
  if (noiseSelect.value !== "any" && RANK[shop.noise] > RANK[noiseSelect.value]) return false;

  return true;   // survived every test
}

function updateResults() {
  showShops(allShops.filter(matchesFilters));
}

// Every control runs the same function
[wifiBox, outletsSelect, noiseSelect, seatingSelect].forEach((control) => {
  control.addEventListener("change", updateResults);
});


const mapButton = document.getElementById("map-button");
const listButton = document.getElementById("list-button");

const mapView = document.getElementById("map-view");
const listView = document.getElementById("list-view");

// Switch to Map
mapButton.addEventListener("click", () => {
  mapView.classList.remove("hidden");
  listView.classList.add("hidden");

  mapButton.classList.add("active");
  listButton.classList.remove("active");

  map.invalidateSize();
});

// Switch to List
listButton.addEventListener("click", () => {
  listView.classList.remove("hidden");
  mapView.classList.add("hidden");

  listButton.classList.add("active");
  mapButton.classList.remove("active");
});

loadShops();
