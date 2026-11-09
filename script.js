// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");
let allShops = [];
let shopRatings = {};
let ratingsVerified = false;
let currentShop = null;

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

    L.marker([shop.lat, shop.lng], {
      icon: makePin(shop.type),
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
    shop.lng,
  ).toFixed(1);

  const image = shop.image || "images/default-cafe.jpg";

  const photos =
    Array.isArray(shop.photos) && shop.photos.length > 0
      ? shop.photos
      : [image];

  modalDetails.innerHTML = /* HTML */ `
    <div class="modal-gallery">
      <img
        id="gallery-main-image"
        class="modal-image"
        src="${photos[0]}"
        alt="${shop.name}"
      />

      <div class="gallery-controls">
        <button id="gallery-prev" type="button" aria-label="Previous photo">
          &#10094;
        </button>

        <span id="gallery-counter">1 of ${photos.length}</span>

        <button id="gallery-next" type="button" aria-label="Next photo">
          &#10095;
        </button>
      </div>
    </div>

    <div class="modal-body">
      <h2>${shop.name}</h2>

      <p class="modal-distance">📍 ${distance} miles from campus</p>

      <p class="address">${shop.address}</p>

      <h3>Study-friendly amenities</h3>

      <div class="modal-amenities">
        <div class="amenity-card">
          <span class="amenity-icon">📶</span>
          <span class="amenity-label">Wi-Fi</span>
          <strong
            >${shop.wifi === true
              ? "Available"
              : shop.wifi === false
                ? "Not available"
                : "Not confirmed"}</strong
          >
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🔌</span>
          <span class="amenity-label">Outlets</span>
          <strong
            >${shop.outlets
              ? capitalize(shop.outlets)
              : "Not confirmed"}</strong
          >
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🔈</span>
          <span class="amenity-label">Noise level</span>
          <strong
            >${shop.noise ? capitalize(shop.noise) : "Not confirmed"}</strong
          >
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🪑</span>
          <span class="amenity-label">Seating</span>
          <strong
            >${shop.seating
              ? capitalize(shop.seating)
              : "Not confirmed"}</strong
          >
        </div>
      </div>

      <h3>About this spot</h3>
      <p class="modal-description">
        ${shop.description || "More details coming soon!"}
      </p>

      <h3>Student reviews</h3>

      <div class="modal-reviews" id="student-reviews">
        <p>Loading student reviews...</p>
      </div>

      <div id="review-form-container"></div>

      <button class="modal-save" type="button">♡ Save this spot</button>

      <a
        class="modal-directions"
        href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${shop.lat},${shop.lng}`,
        )}"
        target="_blank"
        rel="noopener noreferrer"
      >
        📍 Get Directions
      </a>
    </div>
  `;

  let currentPhotoIndex = 0;

  const galleryImage = document.getElementById("gallery-main-image");
  const galleryCounter = document.getElementById("gallery-counter");
  const prevButton = document.getElementById("gallery-prev");
  const nextButton = document.getElementById("gallery-next");

  function showPhoto(index) {
    currentPhotoIndex = (index + photos.length) % photos.length;

    galleryImage.src = photos[currentPhotoIndex];
    galleryImage.alt = `${shop.name} - photo ${currentPhotoIndex + 1}`;

    galleryCounter.textContent = `${currentPhotoIndex + 1} of ${photos.length}`;
  }

  prevButton.addEventListener("click", () => {
    showPhoto(currentPhotoIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    showPhoto(currentPhotoIndex + 1);
  });

  prevButton.disabled = photos.length <= 1;
  nextButton.disabled = photos.length <= 1;

  shopModal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  updateSavedHearts();
  loadShopReviews(shop.id);
  loadReviewForm(shop.id);
}

async function loadShopReviews(shopId) {
  const container = document.getElementById("student-reviews");

  if (!container) return;

  const student = await getVerifiedStudent();

  // Prevent an older request from updating a different popup
  if (!container.isConnected || currentShop?.id !== shopId) return;

  if (!student) {
    container.innerHTML = `
      <p>Verify your student email to read reviews
      and share your experience.</p>
      <a href="account.html" class="reviews-account-link">
        Log in or create an account
      </a>
    `;
    return;
  }

  const { data: reviews, error } = await db
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (!container.isConnected || currentShop?.id !== shopId) return;

  if (error) {
    console.error("Error loading reviews:", error);
    container.textContent = "Could not load reviews. Please try again.";
    return;
  }

  if (!reviews || reviews.length === 0) {
    container.textContent = "No student reviews yet. Be the first!";
    return;
  }

  const average =
    reviews.reduce((total, review) => total + review.rating, 0) /
    reviews.length;

  // Clear the loading message
  container.replaceChildren();

  const summary = document.createElement("div");
  summary.className = "reviews-summary";

  const score = document.createElement("strong");
  score.className = "reviews-average";
  score.textContent = average.toFixed(1);

  const summaryInfo = document.createElement("div");

  const stars = document.createElement("div");
  stars.className = "review-stars";
  stars.textContent =
    "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average));

  const count = document.createElement("p");
  count.className = "reviews-count";
  count.textContent = `${reviews.length} student ${reviews.length === 1 ? "review" : "reviews"}`;

  summaryInfo.append(stars, count);
  summary.append(score, summaryInfo);
  container.append(summary);

  reviews.forEach((review) => {
    const card = document.createElement("div");
    card.className = "review-card";

    const header = document.createElement("div");
    header.className = "review-header";

    const rating = document.createElement("span");
    rating.className = "review-stars";
    rating.textContent =
      "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    const date = document.createElement("span");
    date.className = "review-date";
    date.textContent = new Date(review.created_at).toLocaleDateString();

    header.append(rating, date);

    const author = document.createElement("strong");
    author.textContent = "Verified student";

    const comment = document.createElement("p");
    comment.className = "review-comment";
    comment.textContent = review.comment;

    card.append(header, author, comment);
    container.append(card);
  });
}

async function loadReviewForm(shopId) {
  const container = document.getElementById("review-form-container");

  if (!container) return;

  const student = await getVerifiedStudent();

  if (!container.isConnected || currentShop?.id !== shopId) return;

  // Guests cannot submit reviews
  if (!student) {
    container.replaceChildren();
    return;
  }

  const { data: existingReview, error } = await db
    .from("reviews")
    .select("id, rating, comment")
    .eq("shop_id", shopId)
    .eq("user_id", student.id)
    .maybeSingle();

  if (!container.isConnected || currentShop?.id !== shopId) return;

  if (error) {
    console.error("Could not load your review:", error);
    container.textContent = "Could not load your review form.";
    return;
  }

  let selectedRating = existingReview?.rating || 0;

  container.innerHTML = /* HTML */ `
    <div class="review-form">
      <h3>${existingReview ? "Edit your review" : "Leave a review"}</h3>

      <p>How was your experience studying here?</p>

      <div class="rating-input" role="group" aria-label="Star rating">
        ${[1, 2, 3, 4, 5]
          .map(
            (star) => `
              <button
                type="button"
                class="rating-star"
                data-rating="${star}"
                aria-label="${star} stars"
                aria-pressed="${star === selectedRating}"
              >${star <= selectedRating ? "★" : "☆"}</button>
            `,
          )
          .join("")}
      </div>

      <textarea
        id="review-comment"
        maxlength="2000"
        placeholder="Was the Wi-Fi reliable? Were there enough outlets? Was it quiet enough to study?"
        rows="4"
      ></textarea>

      <p class="review-form-message" role="status"></p>

      <button type="button" class="submit-review">
        ${existingReview ? "Update review" : "Post review"}
      </button>

      ${existingReview
        ? `<button type="button" class="delete-review">Delete my review</button>`
        : ""}
    </div>
  `;

  const textarea = container.querySelector("#review-comment");
  const message = container.querySelector(".review-form-message");
  const submitButton = container.querySelector(".submit-review");
  const deleteButton = container.querySelector(".delete-review");
  const stars = container.querySelectorAll(".rating-star");

  textarea.value = existingReview?.comment || "";

  function updateStars() {
    stars.forEach((button) => {
      const value = Number(button.dataset.rating);
      button.textContent = value <= selectedRating ? "★" : "☆";
      button.setAttribute("aria-pressed", String(value === selectedRating));
    });
  }

  stars.forEach((button) => {
    button.addEventListener("click", () => {
      selectedRating = Number(button.dataset.rating);
      updateStars();
    });
  });

  submitButton.addEventListener("click", async () => {
    const comment = textarea.value.trim();

    if (selectedRating < 1 || selectedRating > 5) {
      message.textContent = "Please select a star rating.";
      return;
    }

    if (!comment || comment.length > 2000) {
      message.textContent = "Write a review between 1 and 2000 characters.";
      return;
    }

    submitButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;
    message.textContent = "Saving your review...";

    const payload = {
      shop_id: shopId,
      user_id: student.id,
      rating: selectedRating,
      comment: comment,
    };

    const result = existingReview
      ? await db
          .from("reviews")
          .update({
            rating: selectedRating,
            comment: comment,
          })
          .eq("id", existingReview.id)
          .eq("user_id", student.id)
      : await db.from("reviews").insert(payload);

    if (result.error) {
      message.textContent = "Could not save review: " + result.error.message;
      submitButton.disabled = false;
      if (deleteButton) deleteButton.disabled = false;
      return;
    }

    if (!container.isConnected || currentShop?.id !== shopId) return;

    await loadShopReviews(shopId);
    await loadShopRatings();
    await loadReviewForm(shopId);
  });

  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to delete your review?");

      if (!confirmed) return;

      submitButton.disabled = true;
      deleteButton.disabled = true;
      message.textContent = "Deleting your review...";

      const { error: deleteError } = await db
        .from("reviews")
        .delete()
        .eq("id", existingReview.id)
        .eq("user_id", student.id);

      if (deleteError) {
        message.textContent = "Could not delete review: " + deleteError.message;
        submitButton.disabled = false;
        deleteButton.disabled = false;
        return;
      }

      if (!container.isConnected || currentShop?.id !== shopId) return;

      await loadShopReviews(shopId);
      await loadReviewForm(shopId);
    });
  }
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
