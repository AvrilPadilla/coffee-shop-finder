function shopNameFor(shopId) {
  const shop = allShops.find((item) => item.id === shopId);
  return shop ? shop.name : "this place";
}

// Load Explore's card hearts from the shared saved places
// Load saved places and update Explore's card hearts
async function loadSavedHearts() {
  await loadSharedSavedPlaces();
  updateSavedHearts();
}

function updateSavedHearts() {
  const buttons = document.querySelectorAll(".save-button, .modal-save");

  buttons.forEach((button) => {
    let shopId;

    if (button.classList.contains("save-button")) {
      const card = button.closest(".shop-card");
      if (!card) return;
      shopId = card.dataset.shopId;
    } else {
      if (!sharedCurrentShop) return;
      shopId = sharedCurrentShop.id;
    }

    const isSaved = sharedSavedPlaces.has(shopId);
    const name = shopNameFor(shopId);

    button.classList.toggle("is-saved", isSaved);

    if (button.classList.contains("modal-save")) {
      button.textContent = isSaved ? "Remove saved spot" : "Save this spot";
    } else {
      button.innerHTML = `
        <svg class="heart-icon" viewBox="0 0 24 24"
             fill="${isSaved ? "currentColor" : "none"}"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    }

    button.setAttribute(
      "aria-label",
      isSaved ? `Remove ${name} from saved places` : `Save ${name}`,
    );
    button.setAttribute("aria-pressed", String(isSaved));
  });
}

// Save or remove a shop using the shared saving system
async function toggleSavedPlace(shopId) {
  await toggleSharedSavedPlace(shopId);
}

// Heart buttons on shop cards
cardContainer.addEventListener("click", async (event) => {
  const button = event.target.closest(".save-button");

  if (!button || button.disabled) return;

  event.stopPropagation();

  const card = button.closest(".shop-card");
  if (!card) return;

  button.disabled = true;

  try {
    await toggleSavedPlace(card.dataset.shopId);
  } finally {
    button.disabled = false;
  }
});

// Load saved places when the page opens
loadSavedHearts();
