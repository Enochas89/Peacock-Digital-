const form = document.querySelector(".lead-form");
const contactPhone = "+14234541803";
const readablePhone = "(423) 454-1803";
let contactMethod = "call";

const methodButtons = form?.querySelectorAll("[data-contact-method]") || [];
const submitButton = form?.querySelector(".submit-button");
const status = form?.querySelector(".form-status");

const updateContactMethod = (method) => {
  contactMethod = method;

  methodButtons.forEach((button) => {
    const isActive = button.dataset.contactMethod === method;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (submitButton) {
    submitButton.textContent = method === "text" ? "Text My Audit Request" : "Call About My Audit";
  }
};

const getAuditMessage = (data) => {
  const name = String(data.get("name") || "there").trim();
  const email = String(data.get("email") || "").trim();
  const website = String(data.get("website") || "").trim();
  const priority = String(data.get("priority") || "").trim();
  const notes = String(data.get("message") || "").trim();

  return {
    name,
    body: [
      "Hi Peacock Digital Agency, I want a free SEO audit.",
      `Name: ${name}`,
      email ? `Email: ${email}` : "",
      website ? `Website: ${website}` : "",
      priority ? `SEO Priority: ${priority}` : "",
      notes ? `Notes: ${notes}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  };
};

const renderStatus = ({ name, body, smsUrl, telUrl, method }) => {
  if (!status) return;

  status.classList.add("is-visible");
  status.innerHTML = "";

  const heading = document.createElement("strong");
  const message = document.createElement("p");
  const actions = document.createElement("div");
  const textLink = document.createElement("a");
  const callLink = document.createElement("a");
  const copyButton = document.createElement("button");

  heading.textContent = `Ready, ${name}.`;
  message.textContent =
    method === "text"
      ? `Your text message should open with the audit details filled in. If it does not, use the buttons below or call ${readablePhone}.`
      : `Your phone app should open now. Your audit details are ready to copy before or after the call.`;

  actions.className = "form-status-actions";
  textLink.href = smsUrl;
  textLink.textContent = "Open Text";
  callLink.href = telUrl;
  callLink.textContent = "Call Now";
  copyButton.type = "button";
  copyButton.textContent = "Copy Details";

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(body);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy Failed";
    }
  });

  actions.append(textLink, callLink, copyButton);
  status.append(heading, message, actions);
};

methodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateContactMethod(button.dataset.contactMethod || "call");
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const auditMessage = getAuditMessage(data);
  const smsUrl = `sms:${contactPhone}?&body=${encodeURIComponent(auditMessage.body)}`;
  const telUrl = `tel:${contactPhone}`;
  const destination = contactMethod === "text" ? smsUrl : telUrl;

  renderStatus({
    ...auditMessage,
    smsUrl,
    telUrl,
    method: contactMethod
  });

  window.location.href = destination;
});

updateContactMethod(contactMethod);

document.querySelectorAll(".service-card").forEach((card) => {
  const video = card.querySelector("video[data-video-src]");
  if (!video) return;

  const loadVideo = () => {
    if (!video.src) {
      video.src = video.dataset.videoSrc;
    }
  };

  const playVideo = () => {
    loadVideo();
    video.play().catch(() => {});
  };

  const pauseVideo = () => {
    video.pause();
    video.currentTime = 0;
  };

  card.addEventListener("mouseenter", playVideo);
  card.addEventListener("focusin", playVideo);
  card.addEventListener("mouseleave", pauseVideo);
  card.addEventListener("focusout", pauseVideo);
});
