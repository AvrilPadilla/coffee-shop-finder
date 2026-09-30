// Find the empty box on the page where our cards will go
const cardContainer = document.getElementById("shop-cards");

// Turn true/false into words people can read
function wifiText(hasWifi) {
  return hasWifi ? "Yes" : "No";
}

// Build the HTML for ONE shop
function makeCard(shop) {
  return `
    <article class="card">
      <h3>${shop.name}</h3>
      <p class="address">${shop.address}</p>
      <ul>
        <li>Wifi: ${wifiText(shop.wifi)}</li>
        <li>Outlets: ${shop.outlets}</li>
        <li>Noise: ${shop.noise}</li>
        <li>Seating: ${shop.seating}</li>
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
    showShops(shops);
  } catch (error) {
    // If something goes wrong, tell the user and log details for you
    cardContainer.innerHTML = "<p>Could not load shops. Check shops.json for typos.</p>";
    console.error("Problem loading shops:", error);
  }
}

loadShops();
