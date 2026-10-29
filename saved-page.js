const savedList = document.getElementById("saved-list");
const savedMessage = document.getElementById("saved-message");

let student = null;

// NOTE: these two copies come from script.js. If you change the campus
// coordinates there, change them here too (a shared file would fix this later).
const SCHOOL = { lat: 33.553, lng: -117.665 };

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function capitalize(word) {
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
    const button = el("button", "remove-saved", "Remove");
    button.type = "button";
    button.addEventListener("click", () => removeSaved(shopId));
    return button;
}

function makeSavedCard(shop, shopId) {
    const card = el("article", "card shop-card");
    const info = el("div", "shop-info");

    // A saved id that is no longer in shops.json
    if (!shop) {
        info.append(el("h3", "", "This place is no longer listed"), makeRemoveButton(shopId));
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

    const distance = getDistance(SCHOOL.lat, SCHOOL.lng, shop.lat, shop.lng).toFixed(1);

    const tags = el("div", "shop-tags");
    [
        shop.wifi ? "✓ Wi-Fi" : "No Wi-Fi",
        "Outlets: " + capitalize(shop.outlets),
        "Noise: " + capitalize(shop.noise),
        "Seating: " + capitalize(shop.seating)
    ].forEach((text) => tags.append(el("span", "shop-tag", text)));

    info.append(
        el("h3", "", shop.name),
        el("p", "shop-distance", `📍 ${distance} miles from campus`),
        el("p", "address", shop.address),
        tags,
        makeRemoveButton(shopId)
    );

    card.append(imageBox, info);
    return card;
}

async function loadSavedPlaces() {
    student = await getVerifiedStudent();

    if (!student) {
        savedMessage.textContent = "Verify your student account to view saved places.";

        const link = document.createElement("a");
        link.href = "account.html";
        link.textContent = "Sign up or log in";

        savedList.replaceChildren(link);
        return;
    }

    const { data, error } = await db
        .from("saved_places")
        .select("shop_id")
        .order("created_at", { ascending: false });

    if (error) {
        savedMessage.textContent = error.message;
        return;
    }

    savedList.replaceChildren();

    if (data.length === 0) {
        savedMessage.textContent = "Nothing saved yet. Tap the heart on a place in Explore to add it here.";
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