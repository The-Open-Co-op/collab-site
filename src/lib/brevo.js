const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API = "https://api.brevo.com/v3";

export async function addBrevoContact({ email, name, tier }) {
  if (!BREVO_API_KEY) {
    console.log("Brevo: no API key, skipping");
    return;
  }

  try {
    const [firstName, ...rest] = (name || "").split(" ");
    const lastName = rest.join(" ");

    const res = await fetch(`${BREVO_API}/contacts`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName || "",
          LASTNAME: lastName || "",
          ...(tier && { OC_TIER: tier }),
        },
        updateEnabled: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      // "duplicate_parameter" means contact already exists and was updated
      if (data.code !== "duplicate_parameter") {
        console.error("Brevo add contact error:", data);
      }
    } else {
      console.log("Brevo: added/updated contact", email);
    }
  } catch (err) {
    console.error("Brevo error:", err.message);
  }
}
