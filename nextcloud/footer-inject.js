// Footer-Inhalt wie auf Homepage ersetzen
(function() {
  'use strict';
  
  function replaceFooter() {
    const footer = document.querySelector('body#body-public footer');
    if (!footer) {
      // Warte auf Footer
      setTimeout(replaceFooter, 100);
      return;
    }
    
    // Prüfe ob bereits ersetzt
    if (footer.querySelector('.footer-bottom-container')) {
      return;
    }
    
    // Erstelle neuen Footer-Inhalt wie auf Homepage
    footer.innerHTML = `
      <div class="footer-bottom-container">
        <div class="footer-info-left">
          <span class="footer-name-title">
            <span class="footer-name">Benjamin Schels</span>
            <span class="footer-comma-name">, </span>
            <span class="footer-title">Architekt M.A.</span>
          </span>
          <span class="footer-separator-name-address"> - </span>
          <span class="footer-address-line">
            <span class="footer-street">Schlachterstraße 9</span>
            <span class="footer-comma-street">, </span>
            <span class="footer-postal">
              <span class="footer-plz-ort">D-85283 Wolnzach</span>
            </span>
          </span>
        </div>
        <div class="footer-legal-links">
          <div class="lb-link">
            <a href="https://schels.info/pages/impressum.html" target="_blank" rel="noopener noreferrer" aria-label="Impressum">
              <span class="white">Impressum</span>
            </a>
          </div>
          <div class="lb-link">
            <a href="https://schels.info/pages/datenschutz.html" target="_blank" rel="noopener noreferrer" aria-label="Datenschutz">
              <span class="white">Datenschutz</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }
  
  // Führe sofort aus
  replaceFooter();
  
  // Führe auch nach DOMContentLoaded aus
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceFooter);
  }
  
  // Führe auch nach vollständigem Laden aus
  window.addEventListener('load', replaceFooter);
  
  // Führe auch nach kurzer Verzögerung aus (für dynamische Inhalte)
  setTimeout(replaceFooter, 100);
  setTimeout(replaceFooter, 500);
  setTimeout(replaceFooter, 1000);
})();
