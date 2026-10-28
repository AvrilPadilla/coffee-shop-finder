// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");

let allShops = [];

// Turn true/false into words people can read
function wifiText(hasWifi) {
  return hasWifi ? "Yes" : "No";
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Build the HTML for ONE shop
function makeCard(shop) {
  return `
    <article class="card">
      <h3>${shop.name}</h3>
      <p class="address">${shop.address}</p>
      <ul>
        <li>Wifi: ${wifiText(shop.wifi)}</li>
        <li>Outlets: ${capitalize(shop.outlets)}</li>
        <li>Noise: ${capitalize(shop.noise)}</li>
        <li>Seating: ${capitalize(shop.seating)}</li>
      </ul>
    </article>
  `;
}

// Put a list of shops onto the page
function showShops(shops) {
  // For each shop, make a card, then join them all into one big string
  cardContainer.innerHTML = shops.map(makeCard).join("");
}

// Load the data file, then show it
async function loadShops() {
  try {
    const response = await fetch("shops.json");
    const shops = await response.json();
    allShops = shops;
    showShops(shops);
  } catch (error) {
    // If something goes wrong, tell the user and log details for you
    cardContainer.innerHTML = "<p>Could not load shops. Check shops.json for typos.</p>";
    console.error("Problem loading shops:", error);
  }
}

// Words turned into numbers so we can compare them
const RANK = {
  limited: 0, some: 1, plenty: 2,   // outlets
  quiet: 0, moderate: 1, loud: 2,   // noise
  small: 0, medium: 1, large: 2     // seating
};

const wifiBox = document.getElementById("filter-wifi");
const outletsSelect = document.getElementById("filter-outlets");
const noiseSelect = document.getElementById("filter-noise");
const seatingSelect = document.getElementById("filter-seating");

// Does ONE shop pass ALL the filters? "return false" means reject it.
function matchesFilters(shop) {
  if (wifiBox.checked && shop.wifi !== true) return false;

  // Outlets and seating: at least this much
  if (outletsSelect.value !== "any" && RANK[shop.outlets] < RANK[outletsSelect.value]) return false;
  if (seatingSelect.value !== "any" && RANK[shop.seating] < RANK[seatingSelect.value]) return false;

  // Noise: no louder than this
  if (noiseSelect.value !== "any" && RANK[shop.noise] > RANK[noiseSelect.value]) return false;

  return true;   // survived every test
}

function updateResults() {
  showShops(allShops.filter(matchesFilters));
}

// Every control runs the same function
[wifiBox, outletsSelect, noiseSelect, seatingSelect].forEach((control) => {
  control.addEventListener("change", updateResults);
});

loadShops();
