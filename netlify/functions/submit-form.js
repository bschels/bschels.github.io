exports.handler = async (event, context) => {
  // CORS Headers für GitHub Pages
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Preflight request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const data = new URLSearchParams(event.body);
    
    // An Netlify Forms senden
    const response = await fetch("https://abschels.netlify.app/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString(),
    });

    if (response.ok || response.status === 303 || response.status === 302) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    } else {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "Form submission failed" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
