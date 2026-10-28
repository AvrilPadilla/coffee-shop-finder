// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");
let allShops = [];
let currentShop = null;

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


function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth's radius in miles

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
  const distance = getDistance(
    school.lat,
    school.lng,
    shop.lat,
    shop.lng
  ).toFixed(1);

  const image = shop.image || "images/default-cafe.jpg";

  return `
    <article class="card shop-card" data-shop="${shop.name}" tabindex="0" role="button">

      <div class="shop-image">
        <img src="${image}" alt="${shop.name}">
      </div>

      <div class="shop-info">

        <div class="shop-heading">
          <div>
            <h3>${shop.name}</h3>
            <p class="shop-distance">
              📍 ${distance} miles from campus
            </p>
          </div>

          <button class="save-button" type="button"
            aria-label="Save ${shop.name}">
            ♡
          </button>
        </div>

        <p class="address">${shop.address}</p>

        <div class="shop-tags">
          <span class="shop-tag">
            ${shop.wifi ? "✓ Wi-Fi" : "No Wi-Fi"}
          </span>

          <span class="shop-tag">
            Outlets: ${capitalize(shop.outlets)}
          </span>

          <span class="shop-tag">
            Noise: ${capitalize(shop.noise)}
          </span>

          <span class="shop-tag">
            Seating: ${capitalize(shop.seating)}
          </span>
        </div>

      </div>
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
      .on("click", () => {
        openShopDetails(shop);
      })
      .addTo(markerLayer);
  });
}


const shopModal = document.getElementById("shop-modal");
const modalDetails = document.getElementById("modal-details");
const closeModalButton = document.getElementById("close-modal");

function openShopDetails(shop) {
  currentShop = shop;

  const distance = getDistance(
    school.lat,
    school.lng,
    shop.lat,
    shop.lng
  ).toFixed(1);

  const image = shop.image || "images/default-cafe.jpg";

  modalDetails.innerHTML = `
    <img class="modal-image" src="${image}" alt="${shop.name}">

    <div class="modal-body">
      <h2>${shop.name}</h2>

      <p class="modal-distance">
        📍 ${distance} miles from campus
      </p>

      <p class="address">${shop.address}</p>

      <div class="shop-tags">
        <span class="shop-tag">
          ${shop.wifi ? "✓ Wi-Fi" : "No Wi-Fi"}
        </span>

        <span class="shop-tag">
          Outlets: ${capitalize(shop.outlets)}
        </span>

        <span class="shop-tag">
          Noise: ${capitalize(shop.noise)}
        </span>

        <span class="shop-tag">
          Seating: ${capitalize(shop.seating)}
        </span>
      </div>

      <h3>About this spot</h3>
      <p class="modal-description">
        ${shop.description || "More details coming soon!"}
      </p>

      <h3>Student reviews</h3>
      <div class="modal-reviews">
        Verify your student email to read all reviews
        and share your experience.
      </div>

      <button class="modal-save" type="button">
        ♡ Save this spot
      </button>
    </div>
  `;

  shopModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeShopDetails() {
  shopModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  currentShop = null;
}

// Open details when a shop card is clicked
cardContainer.addEventListener("click", (event) => {
  if (event.target.closest(".save-button")) return;

  const card = event.target.closest(".shop-card");
  if (!card) return;

  const shop = allShops.find(item => item.name === card.dataset.shop);

  if (shop) openShopDetails(shop);
});

// Keyboard access for shop cards
cardContainer.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest(".save-button")) return;

  const card = event.target.closest(".shop-card");
  if (!card) return;

  event.preventDefault();

  const shop = allShops.find(item => item.name === card.dataset.shop);

  if (shop) openShopDetails(shop);
});

// Close popup with X
closeModalButton.addEventListener("click", closeShopDetails);

// Close popup when clicking outside
shopModal.addEventListener("click", (event) => {
  if (event.target === shopModal) {
    closeShopDetails();
  }
});

// Close popup with Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeShopDetails();
});

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
const distanceSelect = document.getElementById("filter-distance");

// Does ONE shop pass ALL the filters? "return false" means reject it.

function matchesFilters(shop) {
  if (wifiBox.checked && shop.wifi !== true) return false;

  // Outlets and seating: at least this much
  if (outletsSelect.value !== "any" &&
    RANK[shop.outlets] < RANK[outletsSelect.value]) {
    return false;
  }

  if (seatingSelect.value !== "any" &&
    RANK[shop.seating] < RANK[seatingSelect.value]) {
    return false;
  }

  // Noise: no louder than this
  if (noiseSelect.value !== "any" &&
    RANK[shop.noise] > RANK[noiseSelect.value]) {
    return false;
  }

  // Distance from selected campus
  if (distanceSelect.value !== "any") {
    if (typeof shop.lat !== "number" ||
      typeof shop.lng !== "number") {
      return false;
    }

    const distance = getDistance(
      school.lat,
      school.lng,
      shop.lat,
      shop.lng
    );

    if (distance > Number(distanceSelect.value)) {
      return false;
    }
  }

  return true;
}


function updateResults() {
  showShops(allShops.filter(matchesFilters));
}

// Every control runs the same function
[wifiBox, outletsSelect, noiseSelect, seatingSelect, distanceSelect].forEach((control) => {
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
