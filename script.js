const form = document.querySelector(".lead-form");

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = new FormData(form).get("name") || "there";
  form.replaceChildren();

  const status = document.createElement("div");
  const content = document.createElement("div");
  const heading = document.createElement("strong");
  const message = document.createElement("p");

  status.className = "form-success";
  status.role = "status";
  status.setAttribute("aria-live", "polite");
  heading.textContent = `Thanks, ${String(name).trim()}.`;
  message.textContent =
    "Peacock Digital Agency will review your site details and prepare your SEO growth plan.";

  content.append(heading, message);
  status.append(content);
  form.append(status);
});
