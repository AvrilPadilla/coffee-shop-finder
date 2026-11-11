// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");
let allShops = [];
let shopRatings = {};
let ratingsVerified = false;

const SCHOOLS = {
  saddleback: {
    name: "Saddleback College",
    lat: 33.553,
    lng: -117.665,
  },
  ivc: {
    name: "Irvine Valley College",
    lat: 33.676,
    lng: -117.778,
  },
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth's radius in miles

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const selectedSchool = localStorage.getItem("selectedSchool") || "saddleback";

const school = SCHOOLS[selectedSchool] || SCHOOLS.saddleback;

const map = L.map("map").setView([school.lat, school.lng], 14);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
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
    shop.lng,
  ).toFixed(1);

  const image = shop.image || "images/default-cafe.jpg";

  return `
       <article class="card shop-card" data-shop-id="${shop.id}" tabindex="0" role="button">

      <div class="shop-image">
        <img src="${image}" alt="${shop.name}">
      </div>

      <div class="shop-info">

        <div class="shop-heading">
          <div>
            <h3>${shop.name}</h3>

            <div class="card-rating" data-rating-shop="${shop.id}">
              <span class="rating-placeholder">Sign in to see ratings</span>
            </div>

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
  const kind = type in PIN_SIZES ? type : "study"; // unknown types fall back to study
  const size = PIN_SIZES[kind];
  return L.divIcon({
    className: "",
    html: `<div class="pin pin-${kind}" style="width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

async function loadShopRatings() {
  const student = await getVerifiedStudent();
  ratingsVerified = Boolean(student);

  // Only verified students can read reviews
  if (!student) {
    shopRatings = {};
    updateCardRatings();
    return;
  }

  const { data, error } = await db.from("reviews").select("shop_id, rating");

  if (error) {
    console.error("Could not load shop ratings:", error);
    return;
  }

  const totals = {};

  data.forEach((review) => {
    if (!totals[review.shop_id]) {
      totals[review.shop_id] = {
        total: 0,
        count: 0,
      };
    }

    totals[review.shop_id].total += review.rating;
    totals[review.shop_id].count++;
  });

  shopRatings = {};

  Object.keys(totals).forEach((shopId) => {
    shopRatings[shopId] = {
      average: totals[shopId].total / totals[shopId].count,
      count: totals[shopId].count,
    };
  });

  updateCardRatings();
  if (sortSelect.value === "rating") {
    updateResults();
  }
}

function updateCardRatings() {
  document.querySelectorAll(".card-rating").forEach((element) => {
    const shopId = element.dataset.ratingShop;
    const rating = shopRatings[shopId];

    if (!rating) {
      element.textContent = "No reviews yet";

      if (!ratingsVerified) {
        element.textContent = "Sign in to see ratings";
      }

      return;
    }

    element.replaceChildren();

    const star = document.createElement("span");
    star.className = "card-rating-star";
    star.textContent = "★";

    const score = document.createElement("strong");
    score.textContent = rating.average.toFixed(1);

    const count = document.createElement("span");
    count.className = "card-rating-count";
    count.textContent = `(${rating.count} ${rating.count === 1 ? "review" : "reviews"})`;

    element.append(star, score, count);
  });
}

// Put a list of shops onto the page

function showShops(shops) {
  if (shops.length === 0) {
    cardContainer.innerHTML =
      "<p>No shops match those filters. Try loosening one.</p>";
  } else {
    cardContainer.innerHTML = shops.map(makeCard).join("");
  }

  if (typeof updateSavedHearts === "function") {
    updateSavedHearts();
  }

  updateCardRatings();

  markerLayer.clearLayers();

  shops.forEach((shop) => {
    if (typeof shop.lat !== "number" || typeof shop.lng !== "number") return;

    const marker = L.marker([shop.lat, shop.lng], {
      icon: makePin(shop.type),
    });

    // Calculate distance from the selected campus
    const distance = getDistance(
      school.lat,
      school.lng,
      shop.lat,
      shop.lng,
    ).toFixed(1);

    // Create the shop preview
    const preview = document.createElement("div");
    preview.className = "map-shop-preview";

    // Shop photo
    const photo = document.createElement("img");
    photo.src = shop.image || "images/default-cafe.jpg";
    photo.alt = shop.name;

    // Shop name
    const name = document.createElement("h3");
    name.textContent = shop.name;

    // Distance from campus
    const distanceText = document.createElement("p");
    distanceText.textContent = `📍 ${distance} miles from campus`;

    // View Details button
    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.textContent = "View Details";

    detailsButton.addEventListener("click", () => {
      marker.closePopup();
      openShopDetails(shop);
    });

    // Put everything inside the preview
    preview.append(photo, name, distanceText, detailsButton);

    // Attach preview to the marker
    marker.bindPopup(preview);

    marker.addTo(markerLayer);
  });
}

// Open the shared shop details popup
function openShopDetails(shop) {
  map.closePopup();

  openSharedShopDetails(shop);
  updateSharedSavedButton();
}

// Open details when a shop card is clicked
cardContainer.addEventListener("click", (event) => {
  if (event.target.closest(".save-button")) return;

  const card = event.target.closest(".shop-card");
  if (!card) return;

  const shop = allShops.find((item) => item.id === card.dataset.shopId);

  if (shop) openShopDetails(shop);
});

// Keyboard access for shop cards
cardContainer.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest(".save-button")) return;

  const card = event.target.closest(".shop-card");
  if (!card) return;

  event.preventDefault();

  const shop = allShops.find((item) => item.id === card.dataset.shopId);

  if (shop) openShopDetails(shop);
});

// Load the data file, then show it
async function loadShops() {
  try {
    const response = await fetch("shops.json");
    const shops = await response.json();

    allShops = shops;

    updateResults();
    await loadShopRatings();

    // Open a specific shop when arriving from Home
    const urlParams = new URLSearchParams(window.location.search);
    const requestedShopId = urlParams.get("shop");

    if (requestedShopId) {
      const requestedShop = allShops.find(
        (shop) => shop.id === requestedShopId,
      );

      if (requestedShop) {
        openShopDetails(requestedShop);
      }
    }
  } catch (error) {
    // If something goes wrong, tell the user and log details for you
    cardContainer.innerHTML =
      "<p>Could not load shops. Check shops.json for typos.</p>";

    console.error("Problem loading shops:", error);
  }
}

// Words turned into numbers so we can compare them
const RANK = {
  limited: 0,
  some: 1,
  plenty: 2, // outlets
  quiet: 0,
  moderate: 1,
  loud: 2, // noise
  small: 0,
  medium: 1,
  large: 2, // seating
};

const wifiBox = document.getElementById("filter-wifi");
const outletsSelect = document.getElementById("filter-outlets");
const noiseSelect = document.getElementById("filter-noise");
const seatingSelect = document.getElementById("filter-seating");
const distanceSelect = document.getElementById("filter-distance");
const searchInput = document.getElementById("search-shops");
const sortSelect = document.getElementById("sort-shops");
const resultsCount = document.getElementById("results-count");
const resetButton = document.getElementById("reset-filters");

// Does ONE shop pass ALL the filters? "return false" means reject it.

function matchesFilters(shop) {
  const search = searchInput.value.trim().toLowerCase();

  if (!shop.name.toLowerCase().includes(search)) {
    return false;
  }

  if (wifiBox.checked && shop.wifi !== true) return false;

  // Outlets and seating: at least this much
  if (
    outletsSelect.value !== "any" &&
    RANK[shop.outlets] < RANK[outletsSelect.value]
  ) {
    return false;
  }

  if (
    seatingSelect.value !== "any" &&
    RANK[shop.seating] < RANK[seatingSelect.value]
  ) {
    return false;
  }

  // Noise: no louder than this
  if (
    noiseSelect.value !== "any" &&
    RANK[shop.noise] > RANK[noiseSelect.value]
  ) {
    return false;
  }

  // Distance from selected campus
  if (distanceSelect.value !== "any") {
    if (typeof shop.lat !== "number" || typeof shop.lng !== "number") {
      return false;
    }

    const distance = getDistance(school.lat, school.lng, shop.lat, shop.lng);

    if (distance > Number(distanceSelect.value)) {
      return false;
    }
  }

  return true;
}

function updateResults() {
  const filteredShops = allShops.filter(matchesFilters);

  if (sortSelect.value === "az") {
    // Sort alphabetically
    filteredShops.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortSelect.value === "rating" && ratingsVerified) {
    // Sort from highest to lowest rating
    filteredShops.sort((a, b) => {
      const ratingA = shopRatings[a.id]?.average ?? -1;
      const ratingB = shopRatings[b.id]?.average ?? -1;

      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }

      // If ratings match, prioritize more reviews
      const countA = shopRatings[a.id]?.count ?? 0;
      const countB = shopRatings[b.id]?.count ?? 0;

      if (countA !== countB) {
        return countB - countA;
      }

      return a.name.localeCompare(b.name);
    });
  } else {
    // Default: closest to campus
    filteredShops.sort((a, b) => {
      const distanceA = getDistance(school.lat, school.lng, a.lat, a.lng);

      const distanceB = getDistance(school.lat, school.lng, b.lat, b.lng);

      return distanceA - distanceB;
    });
  }

  resultsCount.textContent = `Showing ${filteredShops.length} of ${allShops.length} shops`;

  showShops(filteredShops);
}

// Every control runs the same function
[wifiBox, outletsSelect, noiseSelect, seatingSelect, distanceSelect].forEach(
  (control) => {
    control.addEventListener("change", updateResults);
  },
);

searchInput.addEventListener("input", updateResults);

sortSelect.addEventListener("change", updateResults);

resetButton.addEventListener("click", () => {
  searchInput.value = "";
  sortSelect.value = "closest";

  wifiBox.checked = false;
  outletsSelect.value = "any";
  noiseSelect.value = "any";
  seatingSelect.value = "any";
  distanceSelect.value = "any";

  updateResults();
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
