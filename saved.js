
async function savePlace(shopName) {
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

    const { error } = await db
        .from("saved_places")
        .insert({
            user_id: student.id,
            shop_name: shopName
        });

    if (error) {
        if (error.code === "23505") {
            alert("You've already saved this place!");
        } else {
            alert("Could not save this place: " + error.message);
        }

        return;
    }

    alert("Place saved to your crunch. account!");
}

// Save from a shop card
cardContainer.addEventListener("click", async (event) => {
    const button = event.target.closest(".save-button");

    if (!button) return;

    event.stopPropagation();

    const card = button.closest(".shop-card");
    if (!card) return;

    await savePlace(card.dataset.shop);
});

// Save from the shop details popup
modalDetails.addEventListener("click", async (event) => {
    if (!event.target.closest(".modal-save")) return;

    if (!currentShop) return;

    await savePlace(currentShop.name);
});
