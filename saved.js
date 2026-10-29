let savedPlaces = new Set();   // holds shop ids, like "moongoat-irvine"

function shopNameFor(shopId) {
    const shop = allShops.find((item) => item.id === shopId);
    return shop ? shop.name : "this place";
}

async function loadSavedHearts() {
    const student = await getVerifiedStudent();

    savedPlaces.clear();

    if (!student) {
        updateSavedHearts();
        return;
    }

    const { data, error } = await db
        .from("saved_places")
        .select("shop_id");

    if (error) {
        console.error("Could not load saved places:", error);
        return;
    }

    data.forEach((place) => savedPlaces.add(place.shop_id));

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
            if (!currentShop) return;
            shopId = currentShop.id;
        }

        const isSaved = savedPlaces.has(shopId);
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
            isSaved ? `Remove ${name} from saved places` : `Save ${name}`
        );
        button.setAttribute("aria-pressed", String(isSaved));
    });
}

async function toggleSavedPlace(shopId) {
    const student = await getVerifiedStudent();

    if (!student) {
        const goToAccount = confirm(
            "Verify your school email to save places on crunch.\n\n" +
            "Would you like to create an account or log in?"
        );

        if (goToAccount) {
            window.location.href = "account.html";
        }

        return;
    }

    const alreadySaved = savedPlaces.has(shopId);

    let error;

    if (alreadySaved) {
        const result = await db
            .from("saved_places")
            .delete()
            .eq("user_id", student.id)
            .eq("shop_id", shopId);

        error = result.error;
    } else {
        const result = await db
            .from("saved_places")
            .insert({
                user_id: student.id,
                shop_id: shopId
            });

        error = result.error;
    }

    if (error) {
        alert("Could not update saved place: " + error.message);
        return;
    }

    if (alreadySaved) {
        savedPlaces.delete(shopId);
    } else {
        savedPlaces.add(shopId);
    }

    updateSavedHearts();
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

// Save button inside the shop details popup
modalDetails.addEventListener("click", async (event) => {
    const button = event.target.closest(".modal-save");

    if (!button || button.disabled || !currentShop) return;

    button.disabled = true;

    try {
        await toggleSavedPlace(currentShop.id);
    } finally {
        button.disabled = false;
    }
});

// Load saved places when the page opens
loadSavedHearts();