const SUPABASE_URL = "https://clbooexaponyisrufajf.supabase.co";
const SUPABASE_KEY = "sb_publishable_J2WIsvrKbijm5CKqJYE_qg_PoEYcmL1";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function isSchoolEmail(email) {
    if (typeof email !== "string") return false;

    const domain = email.trim().toLowerCase().split("@")[1];

    return ["saddleback.edu"].includes(domain);
}

async function getVerifiedStudent() {
    const { data, error } = await db.auth.getUser();

    if (error || !data.user) return null;

    const user = data.user;

    if (!user.email_confirmed_at) return null;
    if (!isSchoolEmail(user.email)) return null;

    return user;
}
