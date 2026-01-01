(function() {
  // Logo einfügen
  if (!document.querySelector('.schels-logo-container')) {
    const main = document.querySelector('main');
    if (main) {
      const logoContainer = document.createElement('div');
      logoContainer.className = 'schels-logo-container';
      logoContainer.style.cssText = 'display: flex; flex-direction: column; width: 100%; padding: 1rem 0 0 1.5rem; margin-bottom: 0.5rem;';
      const logo = document.createElement('img');
      logo.src = '/core/img/logo.svg';
      logo.onerror = function() { this.src = 'https://schels.info/images/abs-logo.svg'; };
      logo.style.cssText = 'height: 60px; width: auto; max-height: 60px; display: block;';
      logo.alt = 'architekturbüro schels';
      logoContainer.appendChild(logo);
      const blackBar = document.createElement('div');
      blackBar.className = 'schels-black-bar';
      blackBar.textContent = 'DATEIEN';
      blackBar.style.cssText = 'display: block; width: 100%; background: #000; color: #fff; padding: 0.8em 1.5rem; font-size: 1em; letter-spacing: 0.2em; font-weight: 200; text-transform: uppercase; margin-top: 0.5rem; margin-bottom: 1.5rem; text-align: left; font-family: -apple-system, BlinkMacSystemFont, "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif;';
      logoContainer.appendChild(blackBar);
      main.insertBefore(logoContainer, main.firstChild);
    }
  }
  
  // User-Buttons auf Share-Seiten ausblenden
  const publicPageUserMenu = document.querySelector('.public-page-user-menu');
  if (publicPageUserMenu) {
    const allUserButtons = document.querySelectorAll('button.header-menu__trigger');
    allUserButtons.forEach(btn => {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      btn.style.opacity = '0';
      btn.style.height = '0';
      btn.style.width = '0';
      btn.style.overflow = 'hidden';
      btn.style.position = 'absolute';
      btn.style.left = '-9999px';
      btn.style.pointerEvents = 'none';
    });
  }
})();
