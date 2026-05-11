const https = require("https");

const RESEND_HOST = "api.resend.com";
const RESEND_PATH = "/emails";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const clean = (value) => String(value || "").trim();

const buildEmail = ({ name, email, website, priority, message }) => {
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Website", website || "Not provided"],
    ["SEO Priority", priority || "Not provided"],
    ["Message", message || "Not provided"]
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <th align="left" style="padding:8px 12px;border-bottom:1px solid #e6ecea;">${escapeHtml(label)}</th>
          <td style="padding:8px 12px;border-bottom:1px solid #e6ecea;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `New SEO audit request from ${name}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;color:#14211f;line-height:1.5;">
        <h1 style="font-size:20px;margin:0 0 16px;">New SEO audit request</h1>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;border:1px solid #e6ecea;">
          ${htmlRows}
        </table>
      </div>`
  };
};

const sendEmail = (apiKey, payload) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: RESEND_HOST,
        path: RESEND_PATH,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (resendResponse) => {
        let data = "";

        resendResponse.on("data", (chunk) => {
          data += chunk;
        });

        resendResponse.on("end", () => {
          resolve({
            ok: resendResponse.statusCode >= 200 && resendResponse.statusCode < 300,
            status: resendResponse.statusCode,
            details: data
          });
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "Peacock Digital Agency <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return response.status(500).json({
      error: "Email service is not configured",
      missing: {
        RESEND_API_KEY: !apiKey,
        RESEND_TO_EMAIL: !to
      }
    });
  }

  let body = request.body || {};

  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return response.status(400).json({ error: "Invalid request body" });
    }
  }

  if (clean(body.company)) {
    return response.status(200).json({ ok: true });
  }

  const payload = {
    name: clean(body.name),
    email: clean(body.email),
    website: clean(body.website),
    priority: clean(body.priority),
    message: clean(body.message)
  };

  if (!payload.name || !payload.email) {
    return response.status(400).json({ error: "Name and email are required" });
  }

  const email = buildEmail(payload);

  let resendResponse;

  try {
    resendResponse = await sendEmail(apiKey, {
      from,
      to,
      reply_to: payload.email,
      subject: email.subject,
      text: email.text,
      html: email.html
    });
  } catch (error) {
    console.error("Resend request crashed:", error);
    return response.status(502).json({
      error: "Email request failed before reaching Resend",
      details: error.message
    });
  }

  if (!resendResponse.ok) {
    console.error("Resend request failed:", resendResponse.details);
    return response.status(502).json({
      error: "Email could not be sent",
      status: resendResponse.status,
      details: resendResponse.details
    });
  }

  return response.status(200).json({ ok: true });
};
