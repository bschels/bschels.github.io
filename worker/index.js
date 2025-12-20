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
              <p style="font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:10pt; line-height:1.5;">
                Guten Tag ${name},<br><br>
                vielen Dank für Ihre Nachricht.<br><br>
                Ich habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen.<br><br>
                Mit freundlichen Grüßen
              </p>
              <table cellpadding="0" cellspacing="0" border="0" role="presentation"
                style="max-width:320px; font-family:Avenir,-apple-system,'Segoe UI',Arial,sans-serif; font-size:10pt; line-height:1.35;">
                <tr>
                  <td style="padding:10px 0 10px 0; border-top:1px solid #D0D0D0;">
                    <span style="font-size:16pt; letter-spacing:0.12em;">architekturbüro schels</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px 0;">
                    <span>Benjamin Schels</span><br>
                    <span>Architekt M.A.</span>&nbsp;<span style="opacity:0.6;">|</span>&nbsp;<span>Büroinhaber</span>
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
            `,
            text: `Guten Tag ${name},\n\nvielen Dank für Ihre Nachricht.\n\nIch habe Ihre Anfrage erhalten und melde mich zeitnah persönlich bei Ihnen.\n\nMit freundlichen Grüßen\nBenjamin Schels\nArchitekt M.A.\n\n---\narchitekturbüro schels\nSchlachterstraße 9, 85283 Wolnzach\nTel: +49 8442 929 2291\nWeb: schels.info`,
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
