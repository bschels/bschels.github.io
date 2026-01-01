// Logo und schwarzer Balken für Share-Seiten einfügen
(function() {
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
})();
