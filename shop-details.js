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

  sharedModalDetails.innerHTML = /* HTML */ `
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
          <strong>
            ${shop.wifi === true
              ? "Available"
              : shop.wifi === false
                ? "Not available"
                : "Not confirmed"}
          </strong>
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🔌</span>
          <span class="amenity-label">Outlets</span>
          <strong>
            ${shop.outlets
              ? shop.outlets.charAt(0).toUpperCase() + shop.outlets.slice(1)
              : "Not confirmed"}
          </strong>
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🔈</span>
          <span class="amenity-label">Noise level</span>
          <strong>
            ${shop.noise
              ? shop.noise.charAt(0).toUpperCase() + shop.noise.slice(1)
              : "Not confirmed"}
          </strong>
        </div>

        <div class="amenity-card">
          <span class="amenity-icon">🪑</span>
          <span class="amenity-label">Seating</span>
          <strong>
            ${shop.seating
              ? shop.seating.charAt(0).toUpperCase() + shop.seating.slice(1)
              : "Not confirmed"}
          </strong>
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
  loadSharedShopReviews(shop.id);
  loadSharedReviewForm(shop.id);
}

// Close the shared shop details popup
function closeSharedShopDetails() {
  sharedShopModal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  sharedCurrentShop = null;
}

// Close popup with X
sharedCloseModal.addEventListener("click", closeSharedShopDetails);

// Close popup when clicking outside
sharedShopModal.addEventListener("click", (event) => {
  if (event.target === sharedShopModal) {
    closeSharedShopDetails();
  }
});

// Close popup with Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !sharedShopModal.classList.contains("hidden")) {
    closeSharedShopDetails();
  }
});

// Display student reviews in the shared popup
async function loadSharedShopReviews(shopId) {
  const container = sharedModalDetails.querySelector("#student-reviews");

  if (!container) return;

  const student = await getVerifiedStudent();

  // Prevent an older request from updating a different shop
  if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

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

  if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

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
  count.textContent = `${reviews.length} student ${
    reviews.length === 1 ? "review" : "reviews"
  }`;

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

// Load the review form for verified students
async function loadSharedReviewForm(shopId) {
  const container = sharedModalDetails.querySelector("#review-form-container");

  if (!container) return;

  const student = await getVerifiedStudent();

  // Prevent older requests from updating another shop
  if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

  // Guests cannot write reviews
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

  if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

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
  const message = container.querySelector(".review-form-message");
  const submitButton = container.querySelector(".submit-review");
  const deleteButton = container.querySelector(".delete-review");

  // Post a new review or update an existing one
  submitButton.addEventListener("click", async () => {
    const comment = textarea.value.trim();

    // Require a rating between 1 and 5 stars
    if (selectedRating < 1 || selectedRating > 5) {
      message.textContent = "Please select a star rating.";
      return;
    }

    // Require a comment between 1 and 2000 characters
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

    // Don't update a popup that has already been closed
    if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

    // Refresh the reviews and form
    await loadSharedShopReviews(shopId);
    await loadSharedReviewForm(shopId);
  });
  // Delete an existing student review
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

      // Don't update a popup that has been closed or changed
      if (!container.isConnected || sharedCurrentShop?.id !== shopId) return;

      // Refresh the reviews and form
      await loadSharedShopReviews(shopId);
      await loadSharedReviewForm(shopId);
    });
  }
}
