function shopNameFor(shopId) {
  const shop = allShops.find((item) => item.id === shopId);
  return shop ? shop.name : "this place";
}

function updateSavedHearts() {
  const buttons = document.querySelectorAll(".save-button");
  buttons.forEach((button) => {
    const card = button.closest(".shop-card");
    if (!card) return;

    const shopId = card.dataset.shopId;

    const isSaved = sharedSavedPlaces.has(shopId);
    const name = shopNameFor(shopId);

    button.classList.toggle("is-saved", isSaved);

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
