export default {
  async fetch(request, env) {
    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.text();
      const data = new URLSearchParams(formData);
      
      const name = data.get("name") || "Unbekannt";
      const email = data.get("email") || "keine@angabe.de";
      const phone = data.get("phone") || "nicht angegeben";
      const message = data.get("message") || "";

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
            <h2>Neue Kontaktanfrage</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <hr>
            <p><strong>Nachricht:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
          text: `Neue Kontaktanfrage\n\nName: ${name}\nE-Mail: ${email}\nTelefon: ${phone}\n\nNachricht:\n${message}`,
        }),
      });

      if (!responseToOwner.ok) {
        const error = await responseToOwner.json();
        console.error("Resend error:", error);
        return new Response(
          JSON.stringify({ error: "E-Mail konnte nicht gesendet werden." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px 40px; border-bottom:1px solid #e0e0e0;">
              <span style="font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:18pt; letter-spacing:0.1em; color:#1a1a1a;">architekturbüro schels</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:11pt; line-height:1.6; color:#333333;">
              <p style="margin:0 0 16px 0;">Guten Tag ${name},</p>
              <p style="margin:0 0 16px 0;">vielen Dank für Ihre Nachricht.<br>Ich habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen zurück.</p>
              <p style="margin:24px 0 0 0;">Mit freundlichen Grüßen</p>
              <p style="margin:16px 0 0 0;"><strong>Benjamin Schels</strong></p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding:24px 40px 32px 40px; border-top:1px solid #e0e0e0; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:9pt; line-height:1.5; color:#666666;">
              <p style="margin:0 0 4px 0;"><strong style="color:#333;">Benjamin Schels</strong></p>
              <p style="margin:0 0 12px 0;">Architekt M.A. · Büroinhaber</p>
              <p style="margin:0 0 4px 0;">Schlachterstraße 9<br>D-85283 Wolnzach</p>
              <p style="margin:12px 0 0 0;">
                <a href="tel:+4984429292291" style="color:#666666; text-decoration:none;">T +49 8442 929 229 1</a><br>
                <a href="mailto:hello@schels.info" style="color:#666666; text-decoration:none;">hello@schels.info</a><br>
                <a href="https://www.schels.info/" style="color:#666666; text-decoration:none;">www.schels.info</a>
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
            text: `Guten Tag ${name},\n\nvielen Dank für Ihre Nachricht.\nIch habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen zurück.\n\nMit freundlichen Grüßen\n\nBenjamin Schels\n\n---\narchitekturbüro schels\nBenjamin Schels | Architekt M.A. | Büroinhaber\nSchlachterstraße 9, D-85283 Wolnzach\nT +49 8442 929 229 1\nhello@schels.info\nwww.schels.info`,
          }),
        });
      } catch (e) {
        console.error("Confirmation email error:", e);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  },
};
