const savedList = document.getElementById("saved-list");
const savedMessage = document.getElementById("saved-message");

let student = null;

// NOTE: these two copies come from script.js. If you change the campus
// coordinates there, change them here too (a shared file would fix this later).
const SCHOOL = { lat: 33.553, lng: -117.665 };

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function capitalize(word) {
  if (typeof word !== "string" || word.length === 0) {
    return "Not listed";
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Small helper: make an element with a class and plain text
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

async function removeSaved(shopId) {
  const { error } = await db
    .from("saved_places")
    .delete()
    .eq("user_id", student.id)
    .eq("shop_id", shopId);

  if (error) {
    savedMessage.textContent = error.message;
    return;
  }

  await loadSavedPlaces();
}

function makeRemoveButton(shopId) {
  const button = el("button", "remove-saved");

  button.type = "button";
  button.setAttribute("aria-label", "Remove from saved places");
  button.setAttribute("title", "Remove from saved places");

  button.innerHTML = `
    <svg class="heart-icon" viewBox="0 0 24 24"
         fill="currentColor"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  `;

  button.addEventListener("click", async () => {
    if (button.disabled) return;

    button.disabled = true;

    try {
      await removeSaved(shopId);
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

function makeSavedCard(shop, shopId) {
  const card = el("article", "card shop-card");
  const info = el("div", "shop-info");

  // A saved id that is no longer in shops.json
  if (!shop) {
    info.append(
      el("h3", "", "This place is no longer listed"),
      makeRemoveButton(shopId),
    );
    card.append(info);
    return card;
  }

  // Photo (hidden if the image file is missing)
  const imageBox = el("div", "shop-image");
  const img = document.createElement("img");
  img.src = shop.image || "images/default-cafe.jpg";
  img.alt = shop.name;
  img.addEventListener("error", () => imageBox.remove());
  imageBox.append(img);

  const distance = getDistance(
    SCHOOL.lat,
    SCHOOL.lng,
    shop.lat,
    shop.lng,
  ).toFixed(1);

  const tags = el("div", "shop-tags");
  [
    shop.wifi ? "✓ Wi-Fi" : "No Wi-Fi",
    "Outlets: " + capitalize(shop.outlets),
    "Noise: " + capitalize(shop.noise),
    "Seating: " + capitalize(shop.seating),
  ].forEach((text) => tags.append(el("span", "shop-tag", text)));

  const heading = el("div", "shop-heading");

  heading.append(el("h3", "", shop.name), makeRemoveButton(shopId));

  info.append(
    heading,
    el("p", "shop-distance", `📍 ${distance} miles from campus`),
    el("p", "address", shop.address),
    tags,
  );

  card.append(imageBox, info);

  // Open shop details when the card is clicked
  card.addEventListener("click", (event) => {
    // Don't open the popup when clicking the remove button
    if (event.target.closest(".remove-saved")) {
      return;
    }

    openSharedShopDetails(shop);
  });

  // Allow keyboard users to open shop details
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${shop.name}`);

  card.addEventListener("keydown", (event) => {
    if (event.target !== card) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSharedShopDetails(shop);
    }
  });

  return card;
}

async function loadSavedPlaces() {
  student = await getVerifiedStudent();

  if (!student) {
    savedMessage.textContent =
      "Verify your student account to view saved places.";

    const link = document.createElement("a");
    link.href = "account.html";
    link.textContent = "Sign up or log in";

    savedList.replaceChildren(link);
    return;
  }

  const { data, error } = await db
    .from("saved_places")
    .select("shop_id")
    .eq("user_id", student.id)
    .order("created_at", { ascending: false });

  if (error) {
    savedMessage.textContent = error.message;
    return;
  }

  savedList.replaceChildren();

  if (data.length === 0) {
    savedMessage.textContent = "";

    savedList.innerHTML = `
    <div class="saved-empty">
      <div class="saved-empty-icon">
        <i data-lucide="heart"></i>
      </div>

      <h2>No saved spots yet</h2>

      <p>
        Your favorite study spots, coffee shops, and local finds
        will appear here once you save them.
      </p>

      <a href="explore.html" class="saved-explore-button">
        Explore places
      </a>
    </div>
  `;

    if (window.lucide) {
      lucide.createIcons({
        root: savedList,
        attrs: { "stroke-width": 1.8 },
      });
    }

    return;
  }

  savedMessage.textContent = "";

  let shops = [];
  try {
    const response = await fetch("shops.json");
    shops = await response.json();
  } catch (loadError) {
    savedMessage.textContent = "Could not load place details.";
    return;
  }

  data.forEach((place) => {
    const shop = shops.find((item) => item.id === place.shop_id);
    savedList.append(makeSavedCard(shop, place.shop_id));
  });
}

loadSavedPlaces();
