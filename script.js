const form = document.querySelector(".lead-form");
const contactPhone = "+14234541803";

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") || "there").trim();
  const email = String(data.get("email") || "").trim();
  const website = String(data.get("website") || "").trim();
  const priority = String(data.get("priority") || "").trim();
  const notes = String(data.get("message") || "").trim();
  const smsBody = [
    "Hi Peacock Digital Agency, I want a free SEO audit.",
    `Name: ${name}`,
    email ? `Email: ${email}` : "",
    website ? `Website: ${website}` : "",
    priority ? `SEO Priority: ${priority}` : "",
    notes ? `Notes: ${notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  window.location.href = `sms:${contactPhone}?&body=${encodeURIComponent(smsBody)}`;
  form.replaceChildren();

  const status = document.createElement("div");
  const content = document.createElement("div");
  const heading = document.createElement("strong");
  const confirmation = document.createElement("p");

  status.className = "form-success";
  status.role = "status";
  status.setAttribute("aria-live", "polite");
  heading.textContent = `Thanks, ${name}.`;
  confirmation.textContent =
    "Your text message should be ready to send. If it did not open, call or text (423) 454-1803.";

  content.append(heading, confirmation);
  status.append(content);
  form.append(status);
});
