const createButton = document.getElementById("create");
const guestLink = document.getElementById("guest");
const message = document.getElementById("message");

function save(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
}

// Accounts don't exist yet, so tell the student instead of pretending
createButton.addEventListener("click", () => {
    message.textContent = "Accounts are coming soon. For now, continue as a guest.";
});

// Continue as guest: remember the intro is finished, then the link goes to index.html
guestLink.addEventListener("click", () => {
    save("crunchSeenWelcome", "yes");
    save("crunchTier", "guest");
});