
const savedList = document.getElementById("saved-list");
const savedMessage = document.getElementById("saved-message");

async function loadSavedPlaces() {
    const student = await getVerifiedStudent();

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
        .select("id, shop_name")
        .order("created_at", { ascending: false });

    if (error) {
        savedMessage.textContent = error.message;
        return;
    }

    savedList.replaceChildren();

    if (data.length === 0) {
        savedMessage.textContent =
            "You haven't saved any places yet.";
        return;
    }

    savedMessage.textContent = "";

    data.forEach((place) => {
        const card = document.createElement("article");
        card.className = "card shop-card saved-item";

        const name = document.createElement("h3");
        name.textContent = place.shop_name;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Remove";

        button.addEventListener("click", async () => {
            const { error } = await db
                .from("saved_places")
                .delete()
                .eq("id", place.id);

            if (error) {
                savedMessage.textContent = error.message;
                return;
            }

            await loadSavedPlaces();
        });

        card.append(name, button);
        savedList.appendChild(card);
    });
}

loadSavedPlaces();
