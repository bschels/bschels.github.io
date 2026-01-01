# Technik-Audit - schels.info

**Datum**: 2025-12-23  
**Scope**: Vollständige technische Analyse (Performance, SEO, Accessibility, Code-Qualität)

---

## 📊 PERFORMANCE

### ✅ Gut gemacht:
- **Preload/Prefetch**: CSS, JS und wichtige Bilder werden vorgeladen
- **DNS-Prefetch**: Externe Domains (GoatCounter, Google Maps)
- **WebP-Format**: Portrait-Bild als WebP (moderne, kompakte Formate)
- **Defer/Async**: Scripts werden nicht-blockierend geladen
- **Code-Größe**: ~153 KB total (HTML+CSS+JS) - sehr kompakt

### ⚠️ Verbesserungspotenzial:

#### 1. Bilder nicht optimiert
**Problem**: Projekt-Bilder sind JPG/PNG, nicht WebP
- `projekte/AlteAllee7_Muenchen-01.jpg`
- `projekte/Bad-Aibling.jpg`
- `projekte/donnersberger.jpg`
- etc.

**Impact**: Größere Dateien = langsamere Ladezeiten  
**Fix**: 
- Bilder zu WebP konvertieren
- Lazy Loading für Projekt-Bilder (nicht im Viewport)
- Responsive Images (`srcset`)

#### 2. Kein Lazy Loading für Projekt-Bilder
**Problem**: Alle Bilder werden sofort geladen, auch wenn nicht sichtbar  
**Fix**: `loading="lazy"` für Bilder außerhalb Viewport

#### 3. Portrait-Bild: PNG + WebP
**Problem**: Beide Formate vorhanden (`portrait.png` + `portrait.webp`)  
**Impact**: Doppelte Dateien  
**Fix**: Nur WebP behalten, PNG entfernen (moderne Browser unterstützen WebP)

#### 4. Keine Bildgrößen-Angaben
**Problem**: Projekt-Bilder haben keine `width`/`height` Attribute  
**Impact**: Layout Shift (CLS) beim Laden  
**Fix**: `width` und `height` Attribute hinzufügen

#### 5. Große Schema.org JSON-Blöcke
**Problem**: 8 große JSON-LD Scripts im `<head>` (Zeilen 52-61)  
**Impact**: Größere HTML-Datei, längere Parse-Zeit  
**Fix**: 
- JSON-LD in externe Datei auslagern
- Oder: Minifizieren (keine Leerzeichen)

---

## 🎯 SEO

### ✅ Exzellent:
- **Schema.org**: Umfassende strukturierte Daten (LocalBusiness, Person, FAQ, etc.)
- **Meta-Tags**: Vollständig (description, keywords, OG-Tags)
- **Sitemap**: Vorhanden und korrekt
- **Robots.txt**: Korrekt konfiguriert
- **Canonical URLs**: Gesetzt
- **Hreflang**: Konfiguriert
- **Structured Data**: 8 verschiedene Schema-Typen

### ⚠️ Kleine Optimierungen:

#### 1. Sitemap: Hash-URLs (#profil, #leistungen)
**Problem**: Hash-URLs werden als separate Seiten gelistet  
**Impact**: Crawler könnten Probleme haben  
**Fix**: Hash-URLs aus Sitemap entfernen (oder als separate HTML-Seiten)

#### 2. Meta-Description Länge
**Aktuell**: 108 Zeichen  
**Optimal**: 150-160 Zeichen  
**Status**: ✅ OK (kann länger sein, aber passt)

#### 3. Keywords-Tag
**Status**: Vorhanden, aber Google ignoriert ihn  
**Empfehlung**: Kann bleiben, hat aber keinen SEO-Wert mehr

---

## ♿ ACCESSIBILITY

### ✅ Sehr gut:
- **ARIA-Labels**: Umfassend verwendet (`aria-expanded`, `aria-controls`, `aria-label`)
- **Semantic HTML**: `<header>`, `<main>`, `<footer>`, `<section>`
- **Skip-Link**: Vorhanden (`.skip-link`)
- **Role-Attribute**: Korrekt gesetzt
- **Alt-Texte**: Vorhanden für Bilder
- **Tabindex**: Korrekt verwendet
- **Focus-Management**: JavaScript aktualisiert ARIA-States

### ⚠️ Kleine Verbesserungen:

#### 1. Kontrast-Verhältnisse
**Status**: Nicht geprüft  
**Empfehlung**: Mit Tool prüfen (WCAG AA: 4.5:1 für Text)

#### 2. Keyboard-Navigation
**Status**: ✅ Funktioniert (Tabindex, ARIA)  
**Verbesserung**: Focus-Styles könnten sichtbarer sein

#### 3. Screen-Reader-Tests
**Status**: Nicht getestet  
**Empfehlung**: Mit NVDA/JAWS testen

---

## 💻 CODE-QUALITÄT

### ✅ Gut:
- **Moderne JavaScript**: ES6+, async/await
- **CSS**: CSS Variables, moderne Features
- **Struktur**: Klar organisiert
- **Keine Dependencies**: Keine großen Frameworks (schnell)

### ⚠️ Verbesserungen:

#### 1. CSS: Minifiziert, aber nicht komprimiert
**Status**: CSS ist minifiziert (eine Zeile)  
**Verbesserung**: Gzip/Brotli Kompression aktivieren (Server-seitig)

#### 2. JavaScript: Keine Minifizierung
**Datei**: `js/main.js` (~519 Zeilen)  
**Fix**: Minifizieren für Production

#### 3. HTML: Viele Inline-Scripts
**Problem**: 8 JSON-LD Scripts inline  
**Fix**: Externe Datei oder minifizieren

#### 4. Keine Source Maps
**Status**: Keine `.map` Dateien  
**Impact**: Debugging schwieriger  
**Fix**: Source Maps generieren (optional)

---

## 🖼️ BILDER-OPTIMIERUNG

### Aktuelle Situation:
- **Portrait**: WebP + PNG (doppelt)
- **Projekt-Bilder**: Nur JPG/PNG (nicht WebP)
- **Logo**: SVG (✅ optimal)
- **Favicons**: Vollständig (✅ gut)

### Empfehlungen:

1. **Portrait**: PNG entfernen, nur WebP behalten
2. **Projekt-Bilder**: Zu WebP konvertieren
3. **Lazy Loading**: Für Projekt-Bilder
4. **Responsive Images**: `srcset` für verschiedene Bildschirmgrößen
5. **Bildgrößen**: `width`/`height` Attribute hinzufügen

**Geschätzte Einsparung**: 50-70% kleinere Dateien bei WebP

---

## 🚀 GESCHWINDIGKEIT

### Aktuelle Metriken (geschätzt):
- **HTML**: ~15-20 KB (mit JSON-LD)
- **CSS**: ~5-8 KB (minifiziert)
- **JS**: ~10-15 KB
- **Bilder**: Unbekannt (nicht optimiert)

### Optimierungen:

#### 1. Critical CSS
**Status**: Nicht implementiert  
**Fix**: Above-the-fold CSS inline, Rest asynchron laden

#### 2. Font-Loading
**Status**: System Fonts (✅ schnell)  
**Verbesserung**: `font-display: swap` falls Webfonts kommen

#### 3. Service Worker
**Status**: Nicht vorhanden  
**Fix**: Service Worker für Offline-Caching

#### 4. HTTP/2 Server Push
**Status**: GitHub Pages unterstützt es  
**Fix**: Wichtige Assets pushen

---

## 📱 MOBILE

### ✅ Gut:
- **Viewport**: Korrekt gesetzt
- **Responsive**: CSS mit Media Queries
- **Touch-Targets**: Ausreichend groß
- **Mobile-First**: Media Queries beginnen bei Mobile

### ⚠️ Verbesserungen:

#### 1. Viewport-Fit
**Status**: `viewport-fit=cover` gesetzt (✅ gut für Notch)

#### 2. Touch-Actions
**Status**: Nicht explizit gesetzt  
**Fix**: `touch-action: manipulation` für bessere Performance

---

## 🚨 KRITISCHE PROBLEME (PageSpeed Insights)

### 1. 404-Fehler: abs-logo.svg
**Problem**: `/images/abs-logo.svg` gibt 404  
**Impact**: Browser-Fehler, schlechte User Experience  
**Fix**: 
- Datei existiert, aber Pfad könnte falsch sein
- Prüfe ob Datei wirklich unter `/images/abs-logo.svg` liegt
- Oder: Referenz korrigieren

### 2. Security Best Practices fehlen
**PageSpeed Insights meldet**:
- ❌ CSP effektiv gegen XSS (aktuell: `unsafe-inline` erlaubt)
- ❌ HSTS-Richtlinie fehlt
- ❌ COOP (Cross-Origin-Opener-Policy) fehlt
- ❌ Clickjacking-Schutz (XFO/CSP) unvollständig
- ❌ Trusted Types für DOM-XSS fehlt

**Impact**: Sicherheitslücken, niedrigere PageSpeed-Score  
**Fix**: Siehe Security-Section unten

---

## 🔧 TECHNISCHE SCHULDEN

### 1. Unbenutzte Dateien
- `projekte/originale/` - Original-Bilder (nicht verwendet)
- Verschiedene Optimierungs-Scripts (Python)

**Empfehlung**: Aufräumen oder dokumentieren

### 2. Keine Build-Pipeline
**Status**: Manuelle Optimierung  
**Fix**: Automatisierung (z.B. GitHub Actions)

### 3. Keine Tests
**Status**: Keine automatisierten Tests  
**Empfehlung**: Optional, aber nicht kritisch für statische Seite

---

## 📈 METRIKEN (Geschätzt)

### Lighthouse Score (geschätzt):
- **Performance**: 85-90/100 (gut, könnte besser sein)
- **Accessibility**: 95-100/100 (exzellent)
- **Best Practices**: 90-95/100 (gut)
- **SEO**: 95-100/100 (exzellent)

### Verbesserungspotenzial:
- **Performance**: +10-15 Punkte durch Bild-Optimierung
- **Best Practices**: +5 Punkte durch CSP-Verschärfung

---

## ✅ POSITIVE ASPEKTE

1. ✅ **Keine Dependencies**: Keine großen Frameworks (schnell)
2. ✅ **Semantic HTML**: Sehr gut strukturiert
3. ✅ **Accessibility**: Exzellent umgesetzt
4. ✅ **SEO**: Umfassend optimiert
5. ✅ **Progressive Enhancement**: Funktioniert ohne JS
6. ✅ **Modern CSS**: CSS Variables, clamp(), etc.
7. ✅ **PWA-Ready**: Manifest vorhanden
8. ✅ **Security Headers**: CSP, Permissions-Policy

---

## 🎯 PRIORITÄTEN

### Sofort (Hoher Impact):
1. 🟠 Projekt-Bilder zu WebP konvertieren
2. 🟠 Lazy Loading für Projekt-Bilder
3. 🟡 Portrait PNG entfernen (nur WebP)

### Kurzfristig (Mittlerer Impact):
4. 🟡 JSON-LD minifizieren
5. 🟡 JavaScript minifizieren
6. 🟡 Bildgrößen-Attribute hinzufügen

### Langfristig (Nice-to-have):
7. 🟢 Critical CSS
8. 🟢 Service Worker
9. 🟢 Responsive Images (srcset)

### Security (PageSpeed Insights):
10. 🔴 404-Fehler abs-logo.svg beheben
11. 🟠 CSP verschärfen (unsafe-inline entfernen)
12. 🟠 HSTS Header hinzufügen
13. 🟡 COOP Header hinzufügen
14. 🟡 Trusted Types implementieren

---

## 📝 ZUSAMMENFASSUNG

**Gesamtbewertung**: ⭐⭐⭐⭐ (4/5)

**Stärken**:
- Exzellente Accessibility
- Umfassendes SEO
- Moderne, saubere Codebase
- Keine unnötigen Dependencies

**Schwächen**:
- Bilder nicht optimiert (WebP)
- Kein Lazy Loading
- JSON-LD nicht minifiziert

**Fazit**: Sehr gute Basis, hauptsächlich Bild-Optimierung würde Performance deutlich verbessern.

---

**Nächster Audit**: In 6 Monaten oder nach größeren Änderungen
