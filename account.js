const accountForm = document.getElementById("account-form");
const emailInput = document.getElementById("account-email");
const passwordInput = document.getElementById("account-password");

const accountTitle = document.getElementById("account-title");
const submitButton = document.getElementById("submit-account");
const switchButton = document.getElementById("switch-mode");
const logoutButton = document.getElementById("logout-button");
const accountMessage = document.getElementById("account-message");
const continueButton = document.getElementById("continue-button");

let accountMode = "signup";

function updateAccountMode() {
    const signingUp = accountMode === "signup";

    accountTitle.textContent = signingUp
        ? "Create your student account"
        : "Welcome back!";

    submitButton.textContent = signingUp
        ? "Create account"
        : "Log in";

    switchButton.textContent = signingUp
        ? "Already have an account? Log in"
        : "New to crunch.? Create an account";

    passwordInput.autocomplete = signingUp
        ? "new-password"
        : "current-password";

    accountMessage.textContent = "";
}

switchButton.addEventListener("click", () => {
    accountMode = accountMode === "signup"
        ? "login"
        : "signup";

    updateAccountMode();
});

accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!isSchoolEmail(email)) {
        accountMessage.textContent =
            "Please enter an email from a supported college.";
        return;
    }

    submitButton.disabled = true;
    accountMessage.textContent = "Please wait...";

    try {
        if (accountMode === "signup") {
            const { data, error } = await db.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            accountMessage.textContent =
                "Check your school inbox for a confirmation link. " +
                "After confirming, return here to log in.";
        } else {
            const { error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            await checkAccount();
        }
    } catch (error) {
        accountMessage.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

logoutButton.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
        accountMessage.textContent = error.message;
        return;
    }

    await checkAccount();
});


async function checkAccount() {
    const { data, error } = await db.auth.getUser();

    const user = error ? null : data?.user || null;

    if (!user) {
        accountForm.hidden = false;
        switchButton.hidden = false;
        logoutButton.hidden = true;
        continueButton.hidden = true;

        updateAccountMode();
        return;
    }

    accountForm.hidden = true;
    switchButton.hidden = true;
    logoutButton.hidden = false;
    continueButton.hidden = false;

    const verified = await getVerifiedStudent();

    if (verified) {
        accountTitle.textContent = "You're verified!";
        accountMessage.textContent =
            "Your student account is ready. You can now save places.";
    } else {
        accountTitle.textContent = "Verification required";
        accountMessage.textContent =
            "Please confirm your school email to unlock student features. " +
            "You can still explore crunch. as a guest.";
    }
}


checkAccount();
