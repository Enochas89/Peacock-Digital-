const RESEND_ENDPOINT = "https://api.resend.com/emails";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });

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

export function GET() {
  return json({ ok: true, message: "Audit request endpoint is live" });
}

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "Peacock Digital Agency <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return json(
      {
        error: "Email service is not configured",
        missing: {
          RESEND_API_KEY: !apiKey,
          RESEND_TO_EMAIL: !to
        }
      },
      500
    );
  }

  let body = {};

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  if (clean(body.company)) {
    return json({ ok: true });
  }

  const payload = {
    name: clean(body.name),
    email: clean(body.email),
    website: clean(body.website),
    priority: clean(body.priority),
    message: clean(body.message)
  };

  if (!payload.name || !payload.email) {
    return json({ error: "Name and email are required" }, 400);
  }

  const email = buildEmail(payload);

  let resendResponse;

  try {
    resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: payload.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      })
    });
  } catch (error) {
    return json(
      {
        error: "Email request failed before reaching Resend",
        details: error.message
      },
      502
    );
  }

  if (!resendResponse.ok) {
    const details = await resendResponse.text();

    return json(
      {
        error: "Email could not be sent",
        status: resendResponse.status,
        details
      },
      502
    );
  }

  return json({ ok: true });
}
