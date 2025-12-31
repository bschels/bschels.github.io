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
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
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
      // Referrer-Check: Blockiere nur verdächtige externe Referrer
      const referer = request.headers.get("Referer") || request.headers.get("Referrer") || "";
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const refererDomain = refererUrl.hostname.toLowerCase();
          const allowedDomains = ["schels.info", "www.schels.info", "bschels.github.io", "localhost"];
          
          // Wenn Referrer vorhanden, muss er von erlaubter Domain kommen
          if (!allowedDomains.some(domain => refererDomain.includes(domain))) {
            return new Response(
              JSON.stringify({ error: "Ungültige Anfragequelle." }),
              { status: 403, headers: { ...allHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e) {
          // Ungültiger Referrer-URL = verdächtig
          return new Response(
            JSON.stringify({ error: "Ungültige Anfragequelle." }),
            { status: 403, headers: { ...allHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      // User-Agent-Check: Bekannte Bot-User-Agents blockieren
      const userAgent = request.headers.get("User-Agent") || "";
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
        /python/i, /java/i, /php/i, /ruby/i, /perl/i,
        /^$/, // Leerer User-Agent
        /^Mozilla\/5\.0$/, // Minimaler User-Agent
      ];
      if (botPatterns.some(pattern => pattern.test(userAgent))) {
        // Erlaube nur bekannte Browser-User-Agents
        const allowedBrowsers = /Mozilla\/5\.0.*(Chrome|Safari|Firefox|Edge|Opera)/i;
        if (!allowedBrowsers.test(userAgent)) {
          return new Response(
            JSON.stringify({ error: "Ungültiger Browser." }),
            { status: 403, headers: { ...allHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      const formData = await request.text();
      const data = new URLSearchParams(formData);
      
      // Honeypot-Check: Alle Honeypot-Felder prüfen
      const honeypotFields = ["website", "url", "homepage"];
      for (const field of honeypotFields) {
        const value = data.get(field);
        if (value && value.trim().length > 0) {
          // Honeypot ausgefüllt = Spam
          return new Response(
            JSON.stringify({ error: "Ungültige Anfrage." }),
            { status: 400, headers: { ...allHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      // JavaScript-Token prüfen
      const jsToken = data.get("js_token");
      if (!jsToken || jsToken.trim().length === 0) {
        // Kein Token = Bot ohne JavaScript
        return new Response(
          JSON.stringify({ error: "JavaScript muss aktiviert sein." }),
          { status: 400, headers: { ...allHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const name = data.get("name") || "Unbekannt";
      const email = data.get("email") || "keine@angabe.de";
      const phone = data.get("phone") || "nicht angegeben";
      const message = data.get("message") || "";

      // Qualitätsprüfung: Erkenne zufällige Zeichenketten und sinnlose Nachrichten
      function isSpamMessage(text, isName = false) {
        // Prüfe zuerst auf leeren Text
        if (!text || typeof text !== 'string') {
          return { isSpam: true, reason: "Die Nachricht ist leer oder ungültig." };
        }
        
        const trimmed = text.trim();
        
        // Prüfe auf leeren Text nach trim
        if (trimmed.length === 0) {
          return { isSpam: true, reason: "Die Nachricht ist leer." };
        }
        
        // Mindestlänge: Nachrichten müssen mindestens 20 Zeichen haben, Namen mindestens 2
        const minLength = isName ? 2 : 20;
        if (trimmed.length < minLength) {
          return { isSpam: true, reason: `Die Nachricht ist zu kurz. Bitte geben Sie mindestens ${minLength} Zeichen ein.` };
        }
        
        const withoutSpaces = trimmed.replace(/\s+/g, '');
        
        // Prüfe auf zu viele Konsonanten hintereinander (z.B. "aowijweopifpoweiFN")
        const consonantPattern = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/g;
        if (consonantPattern.test(withoutSpaces)) {
          return { isSpam: true, reason: "Die Nachricht enthält verdächtige Zeichenmuster." };
        }
        
        // Prüfe auf zu viele Großbuchstaben mitten im Wort (z.B. "aowijweopifpoweiFN")
        const mixedCasePattern = /[a-z][A-Z]{2,}|[A-Z]{2,}[a-z]/;
        if (mixedCasePattern.test(trimmed)) {
          return { isSpam: true, reason: "Die Nachricht enthält verdächtige Zeichenmuster." };
        }
        
        // Prüfe auf zu viele aufeinanderfolgende gleiche Zeichen (z.B. "aaaaaa")
        const repeatedPattern = /(.)\1{3,}/;
        if (repeatedPattern.test(trimmed)) {
          return { isSpam: true, reason: "Die Nachricht enthält verdächtige Zeichenmuster." };
        }
        
        // Prüfe auf zu viele Sonderzeichen
        const specialCharCount = (trimmed.match(/[^a-zA-Z0-9äöüÄÖÜß\s]/g) || []).length;
        if (specialCharCount > trimmed.length * 0.25) {
          return { isSpam: true, reason: "Die Nachricht enthält zu viele Sonderzeichen." };
        }
        
        // Prüfe auf fehlende Vokale (zu viele Konsonanten ohne Vokale)
        if (trimmed.length >= 8) {
          const vowels = trimmed.match(/[aeiouäöüAEIOUÄÖÜ]/gi) || [];
          const consonants = trimmed.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/gi) || [];
          if (consonants.length > 0 && vowels.length / consonants.length < 0.25) {
            return { isSpam: true, reason: "Die Nachricht enthält verdächtige Zeichenmuster." };
          }
        }
        
        // Prüfe auf zufällige Zeichenketten: Wenn mehr als 50% des Textes aus Konsonanten besteht
        if (trimmed.length >= 6) {
          const letterCount = trimmed.match(/[a-zA-ZäöüÄÖÜ]/g) || [];
          const consonantCount = trimmed.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/gi) || [];
          if (letterCount.length > 0 && consonantCount.length / letterCount.length > 0.7) {
            return { isSpam: true, reason: "Die Nachricht enthält verdächtige Zeichenmuster." };
          }
        }
        
        return { isSpam: false };
      }
      
      // E-Mail-Format-Validierung: Erkenne verdächtige E-Mail-Adressen
      function isSuspiciousEmail(emailAddr) {
        if (!emailAddr || !emailAddr.includes("@")) {
          return true;
        }
        
        const [localPart, domain] = emailAddr.split("@");
        
        // Prüfe auf zu viele Zahlen im lokalen Teil
        const numbersInLocal = (localPart.match(/[0-9]/g) || []).length;
        if (numbersInLocal > localPart.length * 0.5) {
          return true; // Mehr als 50% Zahlen
        }
        
        // Prüfe auf zu viele aufeinanderfolgende Konsonanten im lokalen Teil
        const consonantPattern = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{6,}/g;
        if (consonantPattern.test(localPart)) {
          return true;
        }
        
        // Prüfe auf verdächtige Domain-Muster (z.B. "test123.com", "temp-mail.org")
        const suspiciousDomains = ["tempmail", "10minutemail", "guerrillamail", "mailinator", "throwaway"];
        const domainLower = domain.toLowerCase();
        if (suspiciousDomains.some(susp => domainLower.includes(susp))) {
          return true;
        }
        
        // Prüfe auf zu viele Sonderzeichen im lokalen Teil
        const specialCharCount = (localPart.match(/[^a-zA-Z0-9._-]/g) || []).length;
        if (specialCharCount > localPart.length * 0.2) {
          return true; // Mehr als 20% Sonderzeichen
        }
        
        return false;
      }
      
      // Prüfe Nachricht auf Spam
      const messageCheck = isSpamMessage(message, false);
      if (messageCheck.isSpam) {
        return new Response(
          JSON.stringify({ error: messageCheck.reason }),
          { status: 400, headers: { ...allHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Prüfe Name auf Spam
      const nameCheck = isSpamMessage(name, true);
      if (nameCheck.isSpam) {
        return new Response(
          JSON.stringify({ error: nameCheck.reason }),
          { status: 400, headers: { ...allHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Prüfe E-Mail auf verdächtige Muster
      if (isSuspiciousEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Die E-Mail-Adresse ist ungültig oder verdächtig." }),
          { status: 400, headers: { ...allHeaders, "Content-Type": "application/json" } }
        );
      }

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
