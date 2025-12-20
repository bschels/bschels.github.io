// Einfaches Rate Limiting (in-memory, resets bei Deploy)
const rateLimitMap = new Map();
const RATE_LIMIT = 5; // Max Anfragen
const RATE_WINDOW = 60 * 60 * 1000; // 1 Stunde in ms

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  // Reset wenn Zeitfenster abgelaufen
  if (now - record.firstRequest > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  // Limit erreicht?
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  // Rate Limiting prüfen
  const clientIP = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
  if (isRateLimited(clientIP)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }),
    };
  }

  try {
    const data = new URLSearchParams(event.body);
    const name = data.get("name") || "Unbekannt";
    const email = data.get("email") || "keine@angabe.de";
    const phone = data.get("phone") || "nicht angegeben";
    const message = data.get("message") || "";
    const datenschutz = data.get("datenschutz");

    // Datenschutz-Checkbox prüfen
    if (!datenschutz) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Bitte stimmen Sie der Datenschutzerklärung zu." }),
      };
    }

    // E-Mail an dich senden
    const responseToOwner = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kontaktformular <hello@schels.info>",
        to: ["hello@schels.info"],
        reply_to: email,
        subject: `Neue Anfrage von ${name}`,
        html: `
          <h2>Neue Kontaktanfrage</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Telefon:</strong> ${phone}</p>
          <hr>
          <p><strong>Nachricht:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Datenschutz akzeptiert: Ja</p>
        `,
        text: `Neue Kontaktanfrage\n\nName: ${name}\nE-Mail: ${email}\nTelefon: ${phone}\n\nNachricht:\n${message}\n\nDatenschutz akzeptiert: Ja`,
      }),
    });

    if (!responseToOwner.ok) {
      const error = await responseToOwner.json();
      console.error("Resend error (to owner):", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "E-Mail konnte nicht gesendet werden." }),
      };
    }

    // Bestätigungs-E-Mail an Besucher senden
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Benjamin Schels <hello@schels.info>",
        to: [email],
        reply_to: "hello@schels.info",
        subject: "Ihre Anfrage bei architekturbüro schels",
        html: `
          <p>Guten Tag ${name},</p>
          <p>vielen Dank für Ihre Nachricht.</p>
          <p>Ich habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen.</p>
          <br>
          <p>Mit freundlichen Grüßen</p>
          <p><strong>Benjamin Schels</strong><br>
          Architekt M.A.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            architekturbüro schels<br>
            Schlachterstraße 9, 85283 Wolnzach<br>
            Tel: +49 8442 929 2291<br>
            Web: <a href="https://schels.info">schels.info</a>
          </p>
        `,
        text: `Guten Tag ${name},\n\nvielen Dank für Ihre Nachricht.\n\nIch habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen.\n\nMit freundlichen Grüßen\nBenjamin Schels\nArchitekt M.A.\n\n---\narchitekturbüro schels\nSchlachterstraße 9, 85283 Wolnzach\nTel: +49 8442 929 2291\nWeb: schels.info`,
      }),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
