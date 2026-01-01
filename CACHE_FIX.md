# Cache-Header Fix für PageSpeed Insights

## Problem
GitHub Pages setzt standardmäßig nur 10 Minuten Cache-TTL für statische Assets. PageSpeed Insights empfiehlt längere Cache-Zeiten.

## Lösung

### Option 1: Cloudflare Worker als Proxy (Empfohlen)
Ein Worker, der als Proxy für statische Assets fungiert und längere Cache-Header setzt.

**Setup:**
1. Erstelle neuen Worker: `cache-proxy` in Cloudflare Dashboard
2. Kopiere Code aus `worker/cache-proxy.js`
3. Route konfigurieren: `schels.info/*` → Worker
4. Assets werden dann über Worker ausgeliefert mit längeren Cache-Headern

**Cache-Strategie:**
- Assets mit Hash/Version im Namen: 1 Jahr (`max-age=31536000, immutable`)
- Andere Assets: 1 Woche (`max-age=604800`)

### Option 2: Asset-Versioning (Einfacher, aber manuell)
Füge Versions-Parameter zu Asset-URLs hinzu:

```html
<link rel="stylesheet" href="style.css?v=1.0">
<script src="/js/main.js?v=1.0"></script>
```

Bei Änderungen: Version erhöhen → Browser lädt neu.

### Option 3: GitHub Pages akzeptieren
10 Minuten Cache ist für eine statische Seite eigentlich OK. PageSpeed Insights ist hier sehr streng.

## Empfehlung

**Für jetzt**: Option 2 (Version-Parameter) - einfach, funktioniert sofort  
**Langfristig**: Option 1 (Cloudflare Worker) - professioneller, automatisch

## Was bereits gemacht wurde:

1. ✅ Worker-Code erstellt (`worker/cache-proxy.js`)
2. ⏳ Du musst noch:
   - Worker in Cloudflare erstellen
   - Route konfigurieren
   - Oder: Version-Parameter zu Assets hinzufügen
