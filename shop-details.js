/* =========================================
   crunch. - Shared Shop Details
   ========================================= */

// Shared modal elements
const sharedShopModal = document.getElementById("shop-modal");
const sharedModalDetails = document.getElementById("modal-details");
const sharedCloseModal = document.getElementById("close-modal");

// Track the shop currently being viewed
let sharedCurrentShop = null;

// Open the shared shop details popup
function openSharedShopDetails(shop) {
  sharedCurrentShop = shop;

  const image = shop.image || "images/default-cafe.jpg";
  const photos =
    Array.isArray(shop.photos) && shop.photos.length > 0
      ? shop.photos
      : [image];

  const selectedSchool = localStorage.getItem("selectedSchool") || "saddleback";

  const campuses = {
    saddleback: { lat: 33.553, lng: -117.665 },
    ivc: { lat: 33.676, lng: -117.778 },
  };

  const campus = campuses[selectedSchool] || campuses.saddleback;

  // Calculate distance in miles
  const R = 3958.8;
  const dLat = ((shop.lat - campus.lat) * Math.PI) / 180;
  const dLng = ((shop.lng - campus.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((campus.lat * Math.PI) / 180) *
      Math.cos((shop.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const distance = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(
    1,
  );

  sharedModalDetails.innerHTML = `
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

  <p class="modal-distance">
    📍 ${distance} miles from campus
  </p>

  <p class="address">${shop.address}</p>

  <h3>Study-friendly amenities</h3>

  <div class="modal-amenities">
    <div class="amenity-card">
      <span class="amenity-icon">📶</span>
      <span class="amenity-label">Wi-Fi</span>
      <strong>
        ${
          shop.wifi === true
            ? "Available"
            : shop.wifi === false
              ? "Not available"
              : "Not confirmed"
        }
      </strong>
    </div>

    <div class="amenity-card">
      <span class="amenity-icon">🔌</span>
      <span class="amenity-label">Outlets</span>
      <strong>
        ${
          shop.outlets
            ? shop.outlets.charAt(0).toUpperCase() + shop.outlets.slice(1)
            : "Not confirmed"
        }
      </strong>
    </div>

    <div class="amenity-card">
      <span class="amenity-icon">🔈</span>
      <span class="amenity-label">Noise level</span>
      <strong>
        ${
          shop.noise
            ? shop.noise.charAt(0).toUpperCase() + shop.noise.slice(1)
            : "Not confirmed"
        }
      </strong>
    </div>

    <div class="amenity-card">
      <span class="amenity-icon">🪑</span>
      <span class="amenity-label">Seating</span>
      <strong>
        ${
          shop.seating
            ? shop.seating.charAt(0).toUpperCase() + shop.seating.slice(1)
            : "Not confirmed"
        }
      </strong>
    </div>
  </div>

  <h3>About this spot</h3>

  <p class="modal-description">
    ${shop.description || "More details coming soon!"}
  </p>
</div>

  `;
  // Photo gallery controls
  let currentPhotoIndex = 0;

  const galleryImage = sharedModalDetails.querySelector("#gallery-main-image");
  const galleryCounter = sharedModalDetails.querySelector("#gallery-counter");
  const prevButton = sharedModalDetails.querySelector("#gallery-prev");
  const nextButton = sharedModalDetails.querySelector("#gallery-next");

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

  // Disable arrows when there is only one photo
  prevButton.disabled = photos.length <= 1;
  nextButton.disabled = photos.length <= 1;
  sharedShopModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

// Close the shared shop details popup
function closeSharedShopDetails() {
  sharedShopModal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  sharedCurrentShop = null;
}
