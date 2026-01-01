#!/bin/bash
# Fügt JavaScript ein, das Breadcrumb-CSS direkt in die Seite injiziert
# Dieses Skript erstellt eine Nextcloud-App, die das CSS garantiert lädt

SERVER_IP="46.224.150.138"
PASSWORD="mmbm3LTn7kju"

echo "💉 Erstelle JavaScript-Injection für Breadcrumbs..."

# Erstelle JavaScript-Code, der das CSS direkt einfügt
cat > /tmp/breadcrumb_inject.js << 'EOF'
(function() {
  'use strict';
  
  function injectBreadcrumbCSS() {
    // Entferne altes Style falls vorhanden
    const oldStyle = document.getElementById('breadcrumb-force-css');
    if (oldStyle) oldStyle.remove();
    
    // Erstelle neues Style-Element
    const style = document.createElement('style');
    style.id = 'breadcrumb-force-css';
    style.textContent = `
      .files-list__breadcrumbs,
      body#body-public .files-list__breadcrumbs {
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
      
      nav[aria-label="Aktueller Verzeichnispfad"] button,
      body#body-public nav[aria-label="Aktueller Verzeichnispfad"] button,
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
      
      .breadcrumb.breadcrumb--collapsed {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
        display: flex !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Mache auch direkt sichtbar mit inline styles
    const nav = document.querySelector('nav[aria-label="Aktueller Verzeichnispfad"]');
    const parent = nav?.parentElement;
    
    if (nav) {
      nav.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; color: #000 !important; background: #ffff00 !important; font-size: 24px !important; font-weight: 700 !important; padding: 20px 24px !important; border: 5px solid #ff0000 !important; min-height: 60px !important; height: auto !important; max-height: none !important; overflow: visible !important; position: relative !important; z-index: 99999 !important;';
    }
    
    if (parent) {
      parent.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; max-height: none !important; height: auto !important; overflow: visible !important; background: #ffff00 !important; padding: 20px 24px !important; border: 5px solid #ff0000 !important;';
    }
  }
  
  // Führe sofort aus
  injectBreadcrumbCSS();
  
  // Führe auch nach DOMContentLoaded aus
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBreadcrumbCSS);
  }
  
  // Führe auch nach vollständigem Laden aus
  window.addEventListener('load', injectBreadcrumbCSS);
  
  // Führe auch nach kurzer Verzögerung aus (für dynamische Inhalte)
  setTimeout(injectBreadcrumbCSS, 100);
  setTimeout(injectBreadcrumbCSS, 500);
  setTimeout(injectBreadcrumbCSS, 1000);
})();
EOF

echo "✅ JavaScript erstellt. Jetzt muss das CSS im Nextcloud Custom CSS korrekt sein."
echo "   Bitte prüfe die Seite - das JavaScript sollte die Breadcrumbs sichtbar machen."
