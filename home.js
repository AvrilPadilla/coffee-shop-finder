/* =========================================
   crunch. - Home Screen
   ========================================= */

let homeShops = [];

const popularContainer = document.getElementById("popular-now");
const nearbyContainer = document.getElementById("near-campus");
const homeSearch = document.getElementById("home-search");
const homeDistanceSlider = document.getElementById("home-distance-slider");
const homeDistanceValue = document.getElementById("home-distance-value");

const HOME_SCHOOLS = {
  saddleback: {
    lat: 33.553,
    lng: -117.665,
  },
  ivc: {
    lat: 33.676,
    lng: -117.778,
  },
};

const homeSchoolKey = localStorage.getItem("selectedSchool") || "saddleback";

const homeSchool = HOME_SCHOOLS[homeSchoolKey] || HOME_SCHOOLS.saddleback;

// Calculate distance in miles
function homeDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Build one Home screen card
function makeHomeCard(shop) {
  const distance = homeDistance(
    homeSchool.lat,
    homeSchool.lng,
    shop.lat,
    shop.lng,
  ).toFixed(1);

  const image = shop.image || "images/default-cafe.jpg";

  return /* HTML */ `
    <article
      class="home-place-card"
      data-shop-id="${shop.id}"
      tabindex="0"
      role="button"
      aria-label="View details for ${shop.name}"
    >
      <div class="home-place-image">
        <img src="${image}" alt="${shop.name}" loading="lazy" />
      </div>

      <div class="home-place-info">
        <h3>${shop.name}</h3>

        <p class="home-place-distance">📍 ${distance} miles from campus</p>

        <div class="home-place-tags">
          <span>${shop.wifi ? "✓ Wi-Fi" : "No Wi-Fi"}</span>
          <span>${shop.noise || "Study spot"}</span>
        </div>
      </div>
    </article>
  `;
}

// Display coffee shops on Home

function renderHomeShops() {
  const search = homeSearch.value.trim().toLowerCase();
  const maxDistance = Number(homeDistanceSlider.value);

  // Filter by name and distance
  const filteredShops = homeShops.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(search);

    const distance = homeDistance(
      homeSchool.lat,
      homeSchool.lng,
      shop.lat,
      shop.lng,
    );

    return matchesSearch && distance <= maxDistance;
  });

  // Sort closest first
  filteredShops.sort((a, b) => {
    const distanceA = homeDistance(
      homeSchool.lat,
      homeSchool.lng,
      a.lat,
      a.lng,
    );

    const distanceB = homeDistance(
      homeSchool.lat,
      homeSchool.lng,
      b.lat,
      b.lng,
    );

    return distanceA - distanceB;
  });

  // Near Your Campus
  nearbyContainer.innerHTML = filteredShops.length
    ? filteredShops.slice(0, 6).map(makeHomeCard).join("")
    : `<p class="home-empty-message">No places found. Try adjusting your search or distance.</p>`;

  // Popular Now (temporary featured selection)
  popularContainer.innerHTML = filteredShops.length
    ? filteredShops.slice(0, 4).map(makeHomeCard).join("")
    : `<p class="home-empty-message">No places match your filters.</p>`;
}

// Load shops.json
async function loadHomeShops() {
  try {
    const response = await fetch("shops.json");

    if (!response.ok) {
      throw new Error("Could not fetch shops.json");
    }

    homeShops = await response.json();

    renderHomeShops();
  } catch (error) {
    console.error("Error loading Home shops:", error);

    popularContainer.textContent = "Could not load places.";
    nearbyContainer.textContent = "Could not load places.";
  }
}

// Update the displayed distance

function updateHomeDistance() {
  const distance = Number(homeDistanceSlider.value);

  homeDistanceValue.textContent = `${distance} ${distance === 1 ? "mile" : "miles"}`;

  // Calculate the slider's filled percentage
  const min = Number(homeDistanceSlider.min);
  const max = Number(homeDistanceSlider.max);

  const percentage = ((distance - min) / (max - min)) * 100;

  homeDistanceSlider.style.background = `
    linear-gradient(
      to right,
      #637b5a ${percentage}%,
      #dce4d6 ${percentage}%
    )
  `;

  renderHomeShops();
}

homeDistanceSlider.addEventListener("input", updateHomeDistance);
updateHomeDistance();

// Filter coffee shops as the student types
homeSearch.addEventListener("input", renderHomeShops);

loadHomeShops();

// =========================================
// crunch. - Home Shop Details Modal
// =========================================

const homeShopModal = document.getElementById("shop-modal");
const homeModalDetails = document.getElementById("modal-details");
const homeCloseModal = document.getElementById("close-modal");

// Open a shop's details without leaving Home
function openHomeShopDetails(shop) {
  openSharedShopDetails(shop);
  updateSharedSavedButton();
}

// Close the popup
function closeHomeShopDetails() {
  closeSharedShopDetails();
}

// Handle clicks on Home shop cards
document.addEventListener("click", (event) => {
  const card = event.target.closest(".home-place-card");

  if (!card) return;

  const shop = homeShops.find((item) => item.id === card.dataset.shopId);

  if (shop) openHomeShopDetails(shop);
});

// Close using the X button
homeCloseModal.addEventListener("click", closeHomeShopDetails);

// Close when clicking outside the popup
homeShopModal.addEventListener("click", (event) => {
  if (event.target === homeShopModal) {
    closeHomeShopDetails();
  }
});

// Close using Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHomeShopDetails();
  }
});

// Open a focused shop card using Enter or Space
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".home-place-card");

  if (!card) return;

  event.preventDefault();

  const shop = homeShops.find((item) => item.id === card.dataset.shopId);

  if (shop) openHomeShopDetails(shop);
});
