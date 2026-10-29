const createLink = document.getElementById("create");
const guestLink = document.getElementById("guest");

function save(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
}

// Either choice finishes the intro, so it won't show again
createLink.addEventListener("click", () => save("crunchSeenWelcome", "yes"));

guestLink.addEventListener("click", () => {
    save("crunchSeenWelcome", "yes");
    save("crunchTier", "guest");
});