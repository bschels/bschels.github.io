// Cloudflare Worker für Cache-Header auf statischen Assets
// Setzt längere Cache-TTL für CSS, JS, Bilder

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Nur für statische Assets (CSS, JS, Bilder)
    const staticExtensions = ['.css', '.js', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2'];
    const isStaticAsset = staticExtensions.some(ext => url.pathname.endsWith(ext));
    
    if (!isStaticAsset) {
      // Nicht für statische Assets - weiterleiten zu GitHub Pages
      return fetch(`https://schels.info${url.pathname}${url.search}`, {
        method: request.method,
        headers: request.headers,
      });
    }
    
    // Statische Assets von GitHub Pages holen
    const response = await fetch(`https://schels.info${url.pathname}${url.search}`, {
      method: request.method,
      headers: request.headers,
    });
    
    if (!response.ok) {
      return response;
    }
    
    // Cache-Header setzen
    const headers = new Headers(response.headers);
    
    // Längere Cache-TTL für statische Assets
    // 1 Jahr für unveränderliche Assets (mit Version/Hash im Namen)
    // 1 Woche für andere Assets
    if (url.pathname.match(/\.(css|js|jpg|jpeg|png|webp|svg|gif|ico|woff|woff2)$/i)) {
      // Prüfe ob Dateiname einen Hash/Version enthält
      const hasVersion = url.pathname.match(/[.-]([a-f0-9]{8,}|v\d+)/i);
      
      if (hasVersion) {
        // Unveränderliche Assets: 1 Jahr
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Andere Assets: 1 Woche
        headers.set('Cache-Control', 'public, max-age=604800');
      }
    }
    
    // ETag und Last-Modified beibehalten
    if (response.headers.get('ETag')) {
      headers.set('ETag', response.headers.get('ETag'));
    }
    if (response.headers.get('Last-Modified')) {
      headers.set('Last-Modified', response.headers.get('Last-Modified'));
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  },
};
