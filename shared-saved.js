/* =========================================
   crunch. - Shared Saved Places
   ========================================= */

// Shared collection of saved shop IDs
const sharedSavedPlaces = new Set();

// Load saved places for the verified student
async function loadSharedSavedPlaces() {
  const student = await getVerifiedStudent();

  sharedSavedPlaces.clear();
  updateSharedSavedButton();

  // Guests cannot access saved places
  if (!student) {
    return;
  }

  const { data, error } = await db
    .from("saved_places")
    .select("shop_id")
    .eq("user_id", student.id);

  if (error) {
    console.error("Could not load saved places:", error);
    return;
  }

  data.forEach((place) => {
    sharedSavedPlaces.add(place.shop_id);
  });

  updateSharedSavedButton();
}

updateSharedSavedButton();

// Save or remove a shop for a verified student
async function toggleSharedSavedPlace(shopId) {
  const student = await getVerifiedStudent();

  // Guests cannot save places
  if (!student) {
    const goToAccount = confirm(
      "Verify your school email to save places on crunch.\n\n" +
        "Would you like to create an account or log in?",
    );

    if (goToAccount) {
      window.location.href = "account.html";
    }

    return;
  }

  const alreadySaved = sharedSavedPlaces.has(shopId);

  let error;

  if (alreadySaved) {
    // Remove an existing saved place
    const result = await db
      .from("saved_places")
      .delete()
      .eq("user_id", student.id)
      .eq("shop_id", shopId);

    error = result.error;
  } else {
    // Save a new place
    const result = await db.from("saved_places").insert({
      user_id: student.id,
      shop_id: shopId,
    });

    error = result.error;
  }

  if (error) {
    alert("Could not update saved place: " + error.message);
    return;
  }

  // Update the local collection after Supabase succeeds
  if (alreadySaved) {
    sharedSavedPlaces.delete(shopId);
  } else {
    sharedSavedPlaces.add(shopId);
  }

  // Update Explore's card hearts when available
  if (typeof updateSavedHearts === "function") {
    updateSavedHearts();
  }

  // We'll connect the Save button's appearance in the next step
}

// Update the Save button inside the shared shop popup
function updateSharedSavedButton() {
  const button = document.querySelector("#modal-details .modal-save");

  if (!button || !sharedCurrentShop) return;

  const shopId = sharedCurrentShop.id;
  const isSaved = sharedSavedPlaces.has(shopId);

  button.classList.toggle("is-saved", isSaved);

  button.textContent = isSaved ? "Remove saved spot" : "Save this spot";

  button.setAttribute("aria-pressed", String(isSaved));

  button.setAttribute(
    "aria-label",
    isSaved
      ? `Remove ${sharedCurrentShop.name} from saved places`
      : `Save ${sharedCurrentShop.name}`,
  );
}

// Save or remove a shop from the shared popup
sharedModalDetails.addEventListener("click", async (event) => {
  const button = event.target.closest(".modal-save");

  if (!button || button.disabled || !sharedCurrentShop) return;

  const shopId = sharedCurrentShop.id;

  button.disabled = true;

  try {
    await toggleSharedSavedPlace(shopId);
    updateSharedSavedButton();
  } finally {
    button.disabled = false;
  }
});

// Load saved places when the page opens
loadSharedSavedPlaces();
