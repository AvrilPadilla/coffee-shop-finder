/* =========================================
   crunch. - Home Screen
   ========================================= */

let homeShops = [];
let homeHighlights = null;

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

  const image = shop.image || "";

  return /* HTML */ `
    <article
      class="home-place-card"
      data-shop-id="${shop.id}"
      tabindex="0"
      role="button"
      aria-label="View details for ${shop.name}"
    >
      <div class="home-place-image">
        ${image
          ? `<img src="${image}" alt="${shop.name}" loading="lazy" />`
          : `<div class="home-image-placeholder">Photo coming soon</div>`}
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

// Display the monthly crunch. highlights
function renderHomeHighlights() {
  if (!homeHighlights || homeShops.length === 0) return;

  // Display the current highlight month
  const monthLabel = document.getElementById("highlights-month");

  if (monthLabel && homeHighlights.currentMonth) {
    const [year, month] = homeHighlights.currentMonth.split("-");

    const date = new Date(Number(year), Number(month) - 1, 1);

    monthLabel.textContent =
      date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }) + " Edition";
  }

  const highlightTypes = ["study", "food"];

  highlightTypes.forEach((type) => {
    const highlight = homeHighlights.highlights?.[type];
    const card = document.getElementById(`${type}-highlight`);

    if (!card || !highlight) return;

    const shop = homeShops.find(
      (item) => String(item.id) === String(highlight.shopId),
    );

    const title = card.querySelector("h3");
    const description = card.querySelector(".highlight-content p");

    if (!title || !description) return;

    // Make the highlight card clickable only when a shop is selected
    card.dataset.shopId = shop ? String(shop.id) : "";

    card.tabIndex = shop ? 0 : -1;

    if (shop) {
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `View details for ${shop.name}`);
    } else {
      card.removeAttribute("role");
      card.removeAttribute("aria-label");
    }

    if (!shop) {
      title.textContent = "Coming soon";

      description.textContent =
        type === "study"
          ? "Our next study favorite is brewing. Check back soon!"
          : "Something delicious is on its way. Stay tuned!";

      return;
    }

    title.textContent = shop.name;
    description.textContent =
      highlight.review || "A new crunch. highlight is on its way!";
  });
}

// Load monthly highlights
async function loadHomeHighlights() {
  try {
    const response = await fetch("highlights.json");

    if (!response.ok) {
      throw new Error("Could not fetch highlights.json");
    }

    homeHighlights = await response.json();

    renderHomeHighlights();
  } catch (error) {
    console.error("Error loading crunch. highlights:", error);
  }
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
    renderHomeHighlights();
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
loadHomeHighlights();

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

// Open shop details when clicking a crunch. highlight
document.addEventListener("click", (event) => {
  const card = event.target.closest(".highlight-card");

  if (!card || !card.dataset.shopId) return;

  const shop = homeShops.find(
    (item) => String(item.id) === card.dataset.shopId,
  );

  if (shop) {
    openHomeShopDetails(shop);
  }
});

// Allow keyboard users to open highlights
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".highlight-card");

  if (!card || !card.dataset.shopId) return;

  event.preventDefault();

  const shop = homeShops.find(
    (item) => String(item.id) === card.dataset.shopId,
  );

  if (shop) {
    openHomeShopDetails(shop);
  }
});
