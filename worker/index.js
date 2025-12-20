export default {
  async fetch(request, env) {
    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Security Headers
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    };

    // Combine headers
    const allHeaders = { ...corsHeaders, ...securityHeaders };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: allHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: allHeaders });
    }

    try {
      const formData = await request.text();
      const data = new URLSearchParams(formData);
      
      const name = data.get("name") || "Unbekannt";
      const email = data.get("email") || "keine@angabe.de";
      const phone = data.get("phone") || "nicht angegeben";
      const message = data.get("message") || "";

      // Datum und Uhrzeit formatieren
      const now = new Date();
      const dateOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' };
      const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' };
      const dateStr = now.toLocaleDateString('de-DE', dateOptions);
      const timeStr = now.toLocaleTimeString('de-DE', timeOptions) + ' Uhr';

      // E-Mail an dich senden
      const responseToOwner = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kontaktformular <kontaktformular@schels.info>",
          to: ["hello@schels.info"],
          reply_to: email,
          subject: `Neue Anfrage von ${name}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff;">
          
          <tr>
            <td align="right" style="padding:24px 40px 16px 40px;">
              <span style="font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:12pt; letter-spacing:0.12em; color:#1a1a1a;">architekturbüro schels</span>
            </td>
          </tr>
          
          <tr>
            <td style="padding:16px 40px 32px 40px; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:11pt; line-height:1.6; color:#333333;">
              <h2 style="margin:0 0 24px 0; font-weight:normal; font-size:14pt;">Neue Kontaktanfrage über schels.info</h2>
              
              <p style="margin:0 0 8px 0;"><span style="letter-spacing:0.05em;">NAME:</span> ${name}</p>
              <p style="margin:0 0 8px 0;"><span style="letter-spacing:0.05em;">EMAIL:</span> <a href="mailto:${email}" style="color:#333;">${email}</a></p>
              <p style="margin:0 0 8px 0;"><span style="letter-spacing:0.05em;">TELEFON:</span> ${phone}</p>
              <p style="margin:0 0 8px 0;"><span style="letter-spacing:0.05em;">DATUM:</span> ${dateStr}</p>
              <p style="margin:0 0 24px 0;"><span style="letter-spacing:0.05em;">UHRZEIT:</span> ${timeStr}</p>
              
              <p style="margin:0 0 8px 0; letter-spacing:0.05em;">NACHRICHT:</p>
              <p style="margin:0; padding:16px; background:#f9f9f9; border-left:3px solid #D0D0D0;">
                ${message.replace(/\n/g, "<br>")}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
          text: `Neue Kontaktanfrage über schels.info\n\nNAME: ${name}\nEMAIL: ${email}\nTELEFON: ${phone}\nDATUM: ${dateStr}\nUHRZEIT: ${timeStr}\n\nNACHRICHT:\n${message}`,
        }),
      });

      if (!responseToOwner.ok) {
        const error = await responseToOwner.json();
        console.error("Resend error:", error);
        return new Response(
          JSON.stringify({ error: "E-Mail konnte nicht gesendet werden." }),
          { status: 500, headers: { ...allHeaders, "Content-Type": "application/json" } }
        );
      }

      // Bestätigungs-E-Mail an Besucher
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Benjamin Schels <hello@schels.info>",
            to: [email],
            reply_to: "hello@schels.info",
            subject: "Ihre Anfrage bei architekturbüro schels",
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff;">
          
          <tr>
            <td style="padding:32px 40px; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:11pt; line-height:1.6; color:#333333;">
              <p style="margin:0 0 16px 0;">Guten Tag ${name},</p>
              <p style="margin:0 0 16px 0;">vielen Dank für Ihre Nachricht.<br>Ich habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen zurück.</p>
              <p style="margin:24px 0 0 0;">Mit freundlichen Grüßen</p>
              <p style="margin:16px 0 0 0;">Benjamin Schels</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation"
                style="max-width:320px; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:10pt; line-height:1.35; color:#333333;">
                
                <tr>
                  <td style="padding:10px 0 10px 0; border-top:1px solid #D0D0D0;">
                    <span style="font-size:16pt; letter-spacing:0.12em;">architekturbüro schels</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 8px 0;">
                    <span>Benjamin Schels</span><br>
                    <span>Architekt M.A.</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 8px 0;">
                    Schlachterstraße&nbsp;9<br>
                    D-85283&nbsp;Wolnzach
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 8px 0;">
                    <a href="tel:+4984429292291" style="color:inherit; text-decoration:none;">T&nbsp;+49&nbsp;8442&nbsp;929&nbsp;229&nbsp;1</a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0;">
                    <a href="mailto:hello@schels.info" style="color:inherit; text-decoration:none;">hello@schels.info</a><br>
                    <a href="https://www.schels.info/" style="color:inherit; text-decoration:none;">www.schels.info</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `,
            text: `Guten Tag ${name},\n\nvielen Dank für Ihre Nachricht.\nIch habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen zurück.\n\nMit freundlichen Grüßen\n\nBenjamin Schels\n\n---\narchitekturbüro schels\nBenjamin Schels\nArchitekt M.A.\nSchlachterstraße 9, D-85283 Wolnzach\nT +49 8442 929 229 1\nhello@schels.info\nwww.schels.info`,
          }),
        });
      } catch (e) {
        console.error("Confirmation email error:", e);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...allHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...allHeaders, "Content-Type": "application/json" } }
      );
    }
  },
};
