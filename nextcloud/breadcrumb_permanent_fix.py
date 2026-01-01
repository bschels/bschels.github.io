#!/usr/bin/env python3
"""
Erstellt eine dauerhafte JavaScript-Lösung für Breadcrumbs
die direkt in Nextcloud eingebunden wird
"""
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("💉 Erstelle dauerhafte JavaScript-Lösung für Breadcrumbs...")

# JavaScript das dauerhaft das CSS einfügt
js_code = """
(function() {
  'use strict';
  
  function forceBreadcrumbsVisible() {
    // Entferne altes Style falls vorhanden
    const oldStyle = document.getElementById('breadcrumb-permanent-fix');
    if (oldStyle) oldStyle.remove();
    
    // Erstelle neues Style-Element
    const style = document.createElement('style');
    style.id = 'breadcrumb-permanent-fix';
    style.textContent = `
      html body#body-public main .files-list__breadcrumbs.breadcrumb,
      html body#body-public main .files-list__breadcrumbs,
      html body#body-public .files-list__breadcrumbs.breadcrumb,
      html body#body-public .files-list__breadcrumbs,
      body#body-public .files-list__breadcrumbs,
      .files-list__breadcrumbs {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
        padding: 20px 24px !important;
        background: #ffff00 !important;
        border: 5px solid #ff0000 !important;
        margin: 10px 0 !important;
      }
      
      html body#body-public main .files-list__breadcrumbs nav[aria-label="Aktueller Verzeichnispfad"],
      html body#body-public main .files-list__breadcrumbs.breadcrumb nav[aria-label="Aktueller Verzeichnispfad"],
      html body#body-public .files-list__breadcrumbs.breadcrumb nav[aria-label="Aktueller Verzeichnispfad"],
      html body#body-public .files-list__breadcrumbs nav[aria-label="Aktueller Verzeichnispfad"],
      html body#body-public nav[aria-label="Aktueller Verzeichnispfad"],
      nav[aria-label="Aktueller Verzeichnispfad"],
      body#body-public nav[aria-label="Aktueller Verzeichnispfad"],
      .files-list__breadcrumbs nav,
      body#body-public .files-list__breadcrumbs nav {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #000 !important;
        background: #ffff00 !important;
        font-size: 24px !important;
        font-weight: 700 !important;
        padding: 20px 24px !important;
        border: 5px solid #ff0000 !important;
        min-height: 60px !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        position: relative !important;
        z-index: 99999 !important;
        line-height: 1.8 !important;
        margin: 10px 0 !important;
      }
      
      html body#body-public main .files-list__breadcrumbs nav[aria-label="Aktueller Verzeichnispfad"] button,
      html body#body-public .files-list__breadcrumbs nav[aria-label="Aktueller Verzeichnispfad"] button,
      nav[aria-label="Aktueller Verzeichnispfad"] button,
      .files-list__breadcrumbs nav button {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #000 !important;
        font-size: 24px !important;
        font-weight: 700 !important;
        border: 2px solid #000 !important;
        padding: 10px 15px !important;
      }
      
      .breadcrumb.breadcrumb--collapsed,
      body#body-public .breadcrumb.breadcrumb--collapsed {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
        display: flex !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Mache auch direkt sichtbar mit inline styles als Fallback
    const nav = document.querySelector('nav[aria-label="Aktueller Verzeichnispfad"]');
    const parent = nav?.parentElement;
    
    if (nav) {
      nav.style.setProperty('display', 'block', 'important');
      nav.style.setProperty('visibility', 'visible', 'important');
      nav.style.setProperty('opacity', '1', 'important');
      nav.style.setProperty('color', '#000', 'important');
      nav.style.setProperty('background', '#ffff00', 'important');
      nav.style.setProperty('font-size', '24px', 'important');
      nav.style.setProperty('font-weight', '700', 'important');
      nav.style.setProperty('padding', '20px 24px', 'important');
      nav.style.setProperty('border', '5px solid #ff0000', 'important');
      nav.style.setProperty('min-height', '60px', 'important');
      nav.style.setProperty('height', 'auto', 'important');
      nav.style.setProperty('max-height', 'none', 'important');
      nav.style.setProperty('overflow', 'visible', 'important');
      nav.style.setProperty('position', 'relative', 'important');
      nav.style.setProperty('z-index', '99999', 'important');
    }
    
    if (parent) {
      parent.style.setProperty('display', 'flex', 'important');
      parent.style.setProperty('visibility', 'visible', 'important');
      parent.style.setProperty('opacity', '1', 'important');
      parent.style.setProperty('max-height', 'none', 'important');
      parent.style.setProperty('height', 'auto', 'important');
      parent.style.setProperty('overflow', 'visible', 'important');
      parent.style.setProperty('background', '#ffff00', 'important');
      parent.style.setProperty('padding', '20px 24px', 'important');
      parent.style.setProperty('border', '5px solid #ff0000', 'important');
    }
  }
  
  // Führe sofort aus
  forceBreadcrumbsVisible();
  
  // Führe auch nach DOMContentLoaded aus
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceBreadcrumbsVisible);
  }
  
  // Führe auch nach vollständigem Laden aus
  window.addEventListener('load', forceBreadcrumbsVisible);
  
  // Führe auch nach kurzer Verzögerung aus (für dynamische Inhalte)
  setTimeout(forceBreadcrumbsVisible, 100);
  setTimeout(forceBreadcrumbsVisible, 500);
  setTimeout(forceBreadcrumbsVisible, 1000);
  setTimeout(forceBreadcrumbsVisible, 2000);
  
  // Beobachte DOM-Änderungen
  const observer = new MutationObserver(function(mutations) {
    forceBreadcrumbsVisible();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
"""

# Füge JavaScript zum Custom CSS hinzu (als CSS mit content property)
# Oder besser: Füge es direkt in die HTML-Seite ein

print("\n📝 JavaScript-Code erstellt.")
print("   Dieses JavaScript muss in Nextcloud eingebunden werden.")
print("   Option 1: Als Custom JavaScript in Nextcloud")
print("   Option 2: Als Bookmarklet im Browser")
print("   Option 3: Als Browser-Erweiterung")

# Erstelle Bookmarklet
bookmarklet = "javascript:(function(){" + js_code.replace(/\n/g, " ").replace(/\s+/g, " ") + "})();"

print("\n📖 BOOKMARKLET (kopiere in Browser-Lesezeichen):")
print("=" * 60)
print(bookmarklet[:200] + "...")
print("=" * 60)

print("\n💡 LÖSUNG: Füge dieses JavaScript als Bookmarklet hinzu:")
print("   1. Erstelle neues Lesezeichen in Chrome")
print("   2. Name: 'Breadcrumbs sichtbar machen'")
print("   3. URL: (den kompletten Bookmarklet-Code)")
print("   4. Klicke auf das Lesezeichen wenn du auf der Share-Seite bist")
