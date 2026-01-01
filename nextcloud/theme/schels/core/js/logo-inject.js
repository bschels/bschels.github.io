// Logo und schwarzer Balken für Share-Seiten einfügen
(function() {
  // Warte, bis DOM geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // Nur auf Share-Seiten ausführen
    if (!document.querySelector('.public-page-user-menu')) {
      return;
    }
    
    // Prüfe, ob bereits eingefügt
    if (document.querySelector('.schels-logo-container')) {
      return;
    }
    
    const main = document.querySelector('main');
    if (!main) {
      // Warte auf main, falls es noch nicht da ist
      setTimeout(init, 100);
      return;
    }
    
    // Logo-Container erstellen
    const logoContainer = document.createElement('div');
    logoContainer.className = 'schels-logo-container';
    
    // Logo erstellen
    const logo = document.createElement('img');
    logo.src = 'https://schels.info/images/abs-logo.svg';
    logo.onerror = function() {
      this.src = '/custom_apps/schels/core/img/logo.svg';
    };
    logo.alt = 'architekturbüro schels';
    logoContainer.appendChild(logo);
    
    // Schwarzer Balken erstellen
    const blackBar = document.createElement('div');
    blackBar.className = 'schels-black-bar';
    blackBar.textContent = 'DATEIEN';
    logoContainer.appendChild(blackBar);
    
    // Am Anfang von main einfügen
    main.insertBefore(logoContainer, main.firstChild);
    
    // User-Buttons auf Share-Seiten ausblenden
    const allUserButtons = document.querySelectorAll('button.header-menu__trigger');
    allUserButtons.forEach(btn => {
      btn.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important;';
    });
  }
})();
