// Admin Panel JavaScript
// Main application state
const AppState = {
  isAuthenticated: false,
  githubToken: null,
  githubConfig: null,
  currentSection: null,
  contentCache: {},
  hasChanges: false,
  projects: [],
  editingProjectIndex: -1,
  structuredContent: [],
  undoStack: {},
  redoStack: {},
  backups: {},
  darkMode: localStorage.getItem('admin_dark_mode') === 'true'
};

// SHA-256 Hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initLogin();
  initLogout();
  initSetup();
  initNavigation();
  loadStoredConfig();
  initKeyboardShortcuts();
  initAutoSaveWarning();
  initDarkMode();
  
  // Load saved password if "remember" was enabled
  try {
    const rememberPassword = localStorage.getItem('admin_remember_password') === 'true';
    if (rememberPassword) {
      const savedPassword = localStorage.getItem('admin_saved_password');
      if (savedPassword) {
        try {
          const decodedPassword = decodeURIComponent(escape(atob(savedPassword)));
          const savedPasswordField = document.getElementById('password');
          const savedRememberField = document.getElementById('remember-password');
          if (savedPasswordField) {
            savedPasswordField.value = decodedPassword;
          }
          if (savedRememberField) {
            savedRememberField.checked = true;
          }
        } catch (e) {
          // Silent fail - password just won't be pre-filled
        }
      }
    }
  } catch (e) {
    // localStorage might be disabled or full
  }
  
  // Check if already authenticated (only if password hash matches)
  const storedHash = localStorage.getItem('admin_password_hash');
  if (storedHash && storedHash === ADMIN_CONFIG.passwordHash && localStorage.getItem('admin_authenticated') === 'true') {
    showEditor();
  } else {
    // Clear invalid auth
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_password_hash');
    showLogin();
  }
});

// Login functionality
function initLogin() {
  const loginBtn = document.getElementById('login-btn');
  const loginForm = document.getElementById('login-form');
  
  // Handle button click
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  
  // Handle form submit (Enter key)
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleLogin();
    });
  }
  
  // Also handle Enter key in password field
  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }
}

async function handleLogin() {
  const passwordField = document.getElementById('password');
  const rememberField = document.getElementById('remember-password');
  
  if (!passwordField) {
    showError('Passwort-Feld nicht gefunden!');
    return;
  }
  
  const password = passwordField.value;
  const rememberPassword = rememberField ? rememberField.checked : false;
  
  if (!password) {
    showError('Bitte Passwort eingeben!');
    return;
  }
  
  // Check if ADMIN_CONFIG is loaded
  if (typeof ADMIN_CONFIG === 'undefined') {
    showError('Konfiguration nicht geladen! Bitte Seite neu laden.');
    return;
  }
  
  const hash = await sha256(password);
  
  if (hash === ADMIN_CONFIG.passwordHash) {
    try {
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_password_hash', hash);
      
      // Save password if "remember" is checked (encrypted with simple base64)
      if (rememberPassword) {
        // Simple encoding (not real encryption, but better than plain text)
        const encodedPassword = btoa(unescape(encodeURIComponent(password)));
        localStorage.setItem('admin_saved_password', encodedPassword);
        localStorage.setItem('admin_remember_password', 'true');
      } else {
        localStorage.removeItem('admin_saved_password');
        localStorage.removeItem('admin_remember_password');
      }
      
      AppState.isAuthenticated = true;
      showEditor();
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        showError('Speicher voll! Bitte Browser-Cache löschen.');
      } else {
        showError('Fehler beim Speichern: ' + e.message);
      }
    }
  } else {
    showError('Falsches Passwort!');
  }
}

// Initialize logout button
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_password_hash');
      // Don't remove saved password on logout - user might want to stay logged in
      AppState.isAuthenticated = false;
      showLogin();
    });
  }
}

// Setup functionality
function initSetup() {
  const saveSetupBtn = document.getElementById('save-setup-btn');
  if (saveSetupBtn) {
    saveSetupBtn.addEventListener('click', function() {
      const tokenField = document.getElementById('github-token');
      const token = tokenField ? tokenField.value.trim() : '';
      const username = document.getElementById('github-username').value.trim();
      const repo = document.getElementById('github-repo').value.trim();
      const branch = document.getElementById('github-branch').value.trim();
      
      // Wenn Token-Feld leer ist, aber Token bereits in AppState existiert, verwende den bestehenden Token
      const tokenToSave = token || AppState.githubToken || '';
      
      if (!tokenToSave || !username || !repo) {
        showError('Bitte alle GitHub-Felder ausfüllen!');
        return;
      }
      
      AppState.githubToken = tokenToSave;
      AppState.githubConfig = {
        owner: username,
        repo: repo,
        branch: branch || 'main'
      };
      
      // Speichere Token und Konfiguration in localStorage
      localStorage.setItem('github_token', tokenToSave);
      localStorage.setItem('github_config', JSON.stringify(AppState.githubConfig));
      
      // Debug: Bestätige, dass gespeichert wurde
      console.log('Token gespeichert:', tokenToSave ? tokenToSave.substring(0, 10) + '...' : 'LEER');
      console.log('Config gespeichert:', AppState.githubConfig);
      
      showStatus('Einstellungen gespeichert!', 'success');
      
      // Update repository info display
      updateRepoInfo();
      
      document.getElementById('setup-screen').style.display = 'none';
      loadContentForSection('profil');
    });
  }
}

// Load stored configuration
function loadStoredConfig() {
  const token = localStorage.getItem('github_token');
  const config = localStorage.getItem('github_config');
  
  if (token) {
    AppState.githubToken = token;
  }
  
  if (config) {
    AppState.githubConfig = JSON.parse(config);
    document.getElementById('setup-screen').style.display = 'none';
  } else {
    // Use default from config
    AppState.githubConfig = ADMIN_CONFIG.repository;
  }
  
  // Update repository info display
  updateRepoInfo();
  
  // Pre-fill setup form - use setTimeout to ensure DOM is ready
  setTimeout(() => {
    const usernameField = document.getElementById('github-username');
    const tokenField = document.getElementById('github-token');
    
    if (usernameField) {
      document.getElementById('github-username').value = AppState.githubConfig.owner;
      document.getElementById('github-repo').value = AppState.githubConfig.repo;
      document.getElementById('github-branch').value = AppState.githubConfig.branch;
      
      // Pre-fill token if available (for user convenience)
      if (token && tokenField) {
        tokenField.value = token;
      }
    }
    
    // Update repo info after form is filled
    updateRepoInfo();
  }, 100);
}

// Update repository information display
function updateRepoInfo() {
  const repoInfo = document.getElementById('repo-info');
  if (!repoInfo) return;
  
  const config = AppState.githubConfig || ADMIN_CONFIG.repository;
  const token = AppState.githubToken;
  
  // Update info fields
  const infoRepo = document.getElementById('info-repo');
  const infoOwner = document.getElementById('info-owner');
  const infoBranch = document.getElementById('info-branch');
  const infoTokenStatus = document.getElementById('info-token-status');
  const repoLink = document.getElementById('repo-link');
  
  if (infoRepo) infoRepo.textContent = config.repo || '-';
  if (infoOwner) infoOwner.textContent = config.owner || '-';
  if (infoBranch) infoBranch.textContent = config.branch || 'main';
  
  if (infoTokenStatus) {
    if (token) {
      const tokenPreview = token.substring(0, 7) + '...' + token.substring(token.length - 4);
      infoTokenStatus.textContent = `✓ Konfiguriert (${tokenPreview})`;
      infoTokenStatus.style.color = '#28a745';
    } else {
      infoTokenStatus.textContent = '✗ Nicht konfiguriert';
      infoTokenStatus.style.color = '#dc3545';
    }
  }
  
  if (repoLink && config.owner && config.repo) {
    repoLink.href = `https://github.com/${config.owner}/${config.repo}`;
  }
  
  // Show info section if config exists
  if (config && (config.owner || config.repo)) {
    repoInfo.style.display = 'block';
  } else {
    repoInfo.style.display = 'none';
  }
}

// Navigation
function initNavigation() {
  // Use event delegation for navigation links
  document.addEventListener('click', function(e) {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      e.preventDefault();
      const section = navItem.getAttribute('data-section');
      if (section) {
        switchSection(section);
      }
    }
  });
}

// Switch between sections
function switchSection(section) {
  // Hide setup screen
  const setupScreen = document.getElementById('setup-screen');
  const editorSections = document.getElementById('editor-sections');
  
  if (setupScreen) {
    setupScreen.style.display = 'none';
  }
  
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const itemSection = item.getAttribute('data-section');
    if (itemSection === section) {
      item.classList.add('active');
    }
  });
  
  AppState.currentSection = section;
  
  if (section === 'password') {
    // Show editor sections for password editor
    if (editorSections) {
      editorSections.style.display = 'block';
    }
    renderPasswordEditor();
  } else if (section === 'setup') {
    // Show setup screen for GitHub settings
    if (setupScreen) {
      setupScreen.style.display = 'block';
    }
    if (editorSections) {
      editorSections.style.display = 'none';
    }
    // Pre-fill form with current values
    loadStoredConfig();
  } else {
    loadContentForSection(section);
  }
}

// Load content for a section
async function loadContentForSection(section) {
  const setupScreen = document.getElementById('setup-screen');
  const editorSections = document.getElementById('editor-sections');
  
  // Hide setup screen initially
  if (setupScreen) {
    setupScreen.style.display = 'none';
  }
  
  if (!AppState.githubToken) {
    if (setupScreen) {
      setupScreen.style.display = 'block';
    }
    if (editorSections) {
      editorSections.style.display = 'none';
    }
    return;
  }
  
  // Always show editor sections when token is available
  if (editorSections) {
    editorSections.style.display = 'block';
  }
  
  showLoading(true);
  
  try {
    let content = '';
    
    if (section === 'kontakt' || section === 'meta') {
      // Load from index.html
      content = await fetchGitHubFile('index.html');
      if (section === 'kontakt') {
        content = extractContactContent(content);
      } else if (section === 'meta') {
        content = extractMetaContent(content);
      }
    } else {
      // Load from pages directory
      const filePath = ADMIN_CONFIG.contentFiles[section];
      if (!filePath) {
        throw new Error(`Keine Datei für Sektion '${section}' konfiguriert`);
      }
      content = await fetchGitHubFile(filePath);
    }
    
    if (!content) {
      throw new Error('Kein Inhalt geladen');
    }
    
    AppState.contentCache[section] = content;
    
    // Clear fetch cache for this file to ensure fresh data
    const filePath = ADMIN_CONFIG.contentFiles[section];
    if (filePath && fetchCache[filePath]) {
      delete fetchCache[filePath];
    }
    
    // For projects, extract and store in AppState BEFORE rendering
    if (section === 'projekte') {
      // Store content in cache first
      AppState.contentCache[section] = content;
      // Extract projects from HTML - try multiple times if needed
      let extractedProjects = extractProjectsFromHTML(content);
      if (!extractedProjects || extractedProjects.length === 0) {
        // Try with wrapped HTML
        const wrappedContent = `<html><body>${content}</body></html>`;
        extractedProjects = extractProjectsFromHTML(wrappedContent);
      }
      // If still no projects, try parsing the raw HTML string directly
      if (!extractedProjects || extractedProjects.length === 0) {
        // Try to find project-page divs using regex as last resort
        const projectPageMatches = content.match(/<div class="project-page">[\s\S]*?<\/div>\s*<\/div>/g);
        if (projectPageMatches && projectPageMatches.length > 0) {
          // Parse each project page
          extractedProjects = [];
          projectPageMatches.forEach(pageHTML => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageHTML, 'text/html');
            const germanTable = doc.querySelector('#german table');
            const englishTable = doc.querySelector('#english table');
            if (germanTable && englishTable) {
              const germanRows = germanTable.querySelectorAll('tr');
              const englishRows = englishTable.querySelectorAll('tr');
              const maxRows = Math.max(germanRows.length, englishRows.length);
              for (let i = 0; i < maxRows; i++) {
                const germanRow = germanRows[i];
                const englishRow = englishRows[i];
                if (germanRow && englishRow) {
                  const yearCell = germanRow.querySelector('td:first-child');
                  const contentCellDE = germanRow.querySelector('td:last-child');
                  const contentCellEN = englishRow.querySelector('td:last-child');
                  if (yearCell && contentCellDE && contentCellEN) {
                    const year = yearCell.textContent.trim().replace(/\s+/g, ' ').replace(/\n/g, ' ');
                    const contentDE = contentCellDE.innerHTML;
                    const contentEN = contentCellEN.innerHTML;
                    const nameMatchDE = contentDE.match(/<strong>(.*?)<\/strong>/);
                    const nameMatchEN = contentEN.match(/<strong>(.*?)<\/strong>/);
                    const nameDE = nameMatchDE ? nameMatchDE[1] : '';
                    const nameEN = nameMatchEN ? nameMatchEN[1] : '';
                    const afterNameDE = contentDE.replace(/<strong>.*?<\/strong>/, '').trim();
                    const afterNameEN = contentEN.replace(/<strong>.*?<\/strong>/, '').trim();
                    const partsDE = afterNameDE.split('<br>');
                    const partsEN = afterNameEN.split('<br>');
                    const locationDE = partsDE[0] ? partsDE[0].replace(/^,\s*/, '').trim() : '';
                    const locationEN = partsEN[0] ? partsEN[0].replace(/^,\s*/, '').trim() : '';
                    const descriptionDE = partsDE[1] ? partsDE[1].trim() : '';
                    const descriptionEN = partsEN[1] ? partsEN[1].trim() : '';
                    extractedProjects.push({
                      year: year,
                      nameDE: nameDE,
                      nameEN: nameEN,
                      locationDE: locationDE,
                      locationEN: locationEN,
                      descriptionDE: descriptionDE,
                      descriptionEN: descriptionEN
                    });
                  }
                }
              }
            }
          });
        }
      }
      if (extractedProjects && extractedProjects.length > 0) {
        AppState.projects = extractedProjects;
      } else {
        // If extraction failed, set empty array but keep content in cache
        AppState.projects = [];
      }
      // Ensure content is passed to renderEditor
      renderEditor(section, content);
    } else {
      renderEditor(section, content);
    }
    
  } catch (error) {
    // Log error to console for debugging
    console.error('Fehler beim Laden:', error);
    
    // Don't log to console, show error to user instead
    let errorMessage = 'Fehler beim Laden: ' + error.message;
    
    // Provide more specific error messages
    if (error.message.includes('403') || error.message.includes('not accessible')) {
      errorMessage = 'Zugriff verweigert! Bitte überprüfen Sie den GitHub Token und dessen Berechtigungen.';
    } else if (error.message.includes('404')) {
      errorMessage = `Datei nicht gefunden: ${ADMIN_CONFIG.contentFiles[section] || section}`;
    } else if (error.message.includes('401')) {
      errorMessage = 'Authentifizierung fehlgeschlagen! Bitte Token erneuern.';
    } else if (error.message.includes('GitHub Konfiguration fehlt') || error.message.includes('Token')) {
      errorMessage = 'GitHub Token nicht konfiguriert! Bitte Token in den Einstellungen eingeben.';
      // Show setup screen if token is missing
      const setupScreen = document.getElementById('setup-screen');
      if (setupScreen) {
        setupScreen.style.display = 'block';
      }
      const editorSections = document.getElementById('editor-sections');
      if (editorSections) {
        editorSections.style.display = 'none';
      }
    }
    
    showError(errorMessage);
    
    // Try to load from cache if available
    if (AppState.contentCache[section]) {
      renderEditor(section, AppState.contentCache[section]);
      showStatus('Inhalt aus Cache geladen (möglicherweise veraltet)', 'info');
    } else {
      // Show empty editor if no cache available, but only if token exists
      if (AppState.githubToken) {
        renderEditor(section, '');
      }
    }
  } finally {
    showLoading(false);
  }
}

// Fetch file from GitHub with caching
const fetchCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchGitHubFile(path, useCache = true) {
  // Check cache first
  if (useCache && fetchCache[path]) {
    const cached = fetchCache[path];
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.content;
    }
  }
  
  const config = AppState.githubConfig;
  if (!config || !AppState.githubToken) {
    throw new Error('GitHub Konfiguration fehlt!');
  }
  
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${AppState.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Datei nicht gefunden: ${path}`);
      } else if (response.status === 403) {
        throw new Error('Zugriff verweigert! Token möglicherweise abgelaufen.');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    // Decode base64 with proper UTF-8 handling
    const base64Content = data.content.replace(/\s/g, '');
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);
    
    // Cache the result
    if (useCache) {
      fetchCache[path] = {
        content: content,
        timestamp: Date.now()
      };
    }
    
    return content;
  } catch (error) {
    // If fetch fails but we have cached content, return that
    if (useCache && fetchCache[path]) {
      return fetchCache[path].content;
    }
    throw error;
  }
}

// Extract contact content from index.html
function extractContactContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const germanDiv = doc.querySelector('#content4 #german');
  const englishDiv = doc.querySelector('#content4 #english');
  
  // Parse structured contact data
  const contactData = {
    textDE: '',
    textEN: '',
    email: '',
    phone: '',
    addressDE: '',
    addressEN: ''
  };
  
  if (germanDiv) {
    const textP = germanDiv.querySelector('p.content');
    if (textP) contactData.textDE = textP.textContent.trim();
    
    const emailDiv = germanDiv.querySelector('.arrow-nohover');
    if (emailDiv && emailDiv.textContent.includes('Email:')) {
      const emailLink = emailDiv.querySelector('a[href^="mailto:"]');
      if (emailLink) {
        contactData.email = emailLink.getAttribute('href').replace('mailto:', '');
      }
    }
    
    const phoneDivs = germanDiv.querySelectorAll('.arrow-nohover');
    phoneDivs.forEach(div => {
      if (div.textContent.includes('Telefon:') || div.textContent.includes('Telefon')) {
        const phoneLink = div.querySelector('a[href^="tel:"]');
        if (phoneLink) {
          // Get phone from href, not from text (text may have &nbsp;)
          contactData.phone = phoneLink.getAttribute('href').replace('tel:', '');
        }
      } else if (div.textContent.includes('Adresse:') || div.textContent.includes('Adresse')) {
        // Remove "Adresse:" prefix and trim
        let addressText = div.textContent;
        addressText = addressText.replace(/^Adresse:\s*/i, '').trim();
        contactData.addressDE = addressText;
      }
    });
  }
  
  if (englishDiv) {
    const textP = englishDiv.querySelector('p.content');
    if (textP) contactData.textEN = textP.textContent.trim();
    
    const phoneDivs = englishDiv.querySelectorAll('.arrow-nohover');
    phoneDivs.forEach(div => {
      if (div.textContent.includes('Address:') || div.textContent.includes('Address')) {
        // Remove "Address:" prefix and trim
        let addressText = div.textContent;
        addressText = addressText.replace(/^Address:\s*/i, '').trim();
        contactData.addressEN = addressText;
      }
    });
  }
  
  return contactData;
}

// Generate contact HTML from structured data
function generateContactHTML(contactData) {
  const email = contactData.email || '';
  const phone = contactData.phone || '';
  const addressDE = contactData.addressDE || '';
  const addressEN = contactData.addressEN || '';
  const textDE = contactData.textDE || '';
  const textEN = contactData.textEN || '';
  
  // Format phone for display (replace spaces with &nbsp;)
  const phoneDisplay = phone.replace(/\s/g, '&nbsp;');
  
  const germanHTML = `
        <p class="content">${escapeHtml(textDE)}</p>
          <div class="arrow-nohover">Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
          <div class="arrow-nohover">Telefon: <a href="tel:${escapeHtml(phone)}">${phoneDisplay}</a></div>
          <div class="arrow-nohover">Adresse: ${escapeHtml(addressDE)}</div>
          <br>
          <hr class="z">`;
  
  const englishHTML = `
        <p class="content">${escapeHtml(textEN)}</p>
          <div class="arrow-nohover">Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
          <div class="arrow-nohover">Phone: <a href="tel:${escapeHtml(phone)}">${phoneDisplay}</a></div>
          <div class="arrow-nohover">Address: ${escapeHtml(addressEN)}</div>
          <br>
          <hr class="z">`;
  
  return {
    german: germanHTML.trim(),
    english: englishHTML.trim()
  };
}

// Extract meta content from index.html
function extractMetaContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract email from contact section
  const emailLink = doc.querySelector('#content4 a[href^="mailto:"]');
  const email = emailLink ? emailLink.textContent.trim() : '';
  
  // Extract phone from contact section
  const phoneLink = doc.querySelector('#content4 a[href^="tel:"]');
  const phone = phoneLink ? phoneLink.textContent.trim() : '';
  
  // Extract address from contact section - find the div containing "Address:"
  let address = '';
  const addressDivs = doc.querySelectorAll('#content4 .arrow-nohover');
  addressDivs.forEach(div => {
    if (div.textContent.includes('Address:') || div.textContent.includes('Adresse:')) {
      // Remove "Address:" or "Adresse:" prefix and trim
      let addressText = div.textContent.trim();
      addressText = addressText.replace(/^(Address|Adresse):\s*/i, '').trim();
      if (addressText && !address) {
        address = addressText;
      }
    }
  });
  
  return {
    title: doc.querySelector('title')?.textContent || '',
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
    email: email,
    phone: phone,
    address: address
  };
}

// Extract structured content from HTML (preserves structure, extracts text)
function extractStructuredContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const projectPages = doc.querySelectorAll('.project-page');
  
  const pages = [];
  
  projectPages.forEach((page, pageIndex) => {
    const germanDiv = page.querySelector('#german');
    const englishDiv = page.querySelector('#english');
    
    const pageData = {
      pageIndex: pageIndex,
      german: extractTextFromElement(germanDiv),
      english: extractTextFromElement(englishDiv)
    };
    
    pages.push(pageData);
  });
  
  return pages;
}

// Extract text content while preserving structure
function extractTextFromElement(element) {
  if (!element) return [];
  
  const items = [];
  const children = Array.from(element.children);
  
  children.forEach(child => {
    const tagName = child.tagName.toLowerCase();
    
    if (tagName === 'h3') {
      items.push({
        type: 'heading',
        tag: 'h3',
        text: child.textContent.trim(),
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'p') {
      const strong = child.querySelector('strong');
      let textAfterStrong = '';
      
      if (strong) {
        // Get text after </strong> and remove <br> if present
        const htmlAfterStrong = child.innerHTML.split('</strong>')[1];
        if (htmlAfterStrong) {
          textAfterStrong = htmlAfterStrong.replace(/^<br\s*\/?>/i, '').trim();
          // Remove HTML tags but keep text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = textAfterStrong;
          textAfterStrong = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
      
      items.push({
        type: 'paragraph',
        tag: 'p',
        strongText: strong ? strong.textContent.trim() : '',
        text: textAfterStrong || (strong ? '' : child.textContent.trim()),
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'ol' || tagName === 'ul') {
      const listItems = Array.from(child.querySelectorAll('li')).map(li => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = li.innerHTML;
        return tempDiv.textContent || tempDiv.innerText || '';
      });
      items.push({
        type: 'list',
        tag: tagName,
        items: listItems,
        start: child.getAttribute('start') || null,
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'blockquote') {
      const says = child.querySelector('.says');
      const allPs = child.querySelectorAll('p');
      const author = Array.from(allPs).find(p => !p.classList.contains('says'));
      
      items.push({
        type: 'blockquote',
        tag: 'blockquote',
        quote: says ? (says.textContent || says.innerText || '').trim() : '',
        author: author ? (author.textContent || author.innerText || '').trim() : '',
        originalHTML: child.outerHTML
      });
    }
  });
  
  return items;
}

// Generate HTML from structured content
function generateStructuredHTML(pages) {
  let html = '';
  
  pages.forEach((page, pageIndex) => {
    html += `<div class="project-page">
  <div id="german" class="language active">
${generatePageHTML(page.german)}
  </div>

  <div id="english" class="language">
${generatePageHTML(page.english)}
  </div>
</div>
`;
  });
  
  return html.trim();
}

// Generate HTML for one page
function generatePageHTML(items) {
  let html = '';
  
  items.forEach(item => {
    if (item.type === 'heading') {
      html += `    <h3>${escapeHtml(item.text)}</h3>\n`;
    } else if (item.type === 'paragraph') {
      if (item.strongText) {
        html += `    <p><strong>${escapeHtml(item.strongText)}</strong><br>\n    ${escapeHtml(item.text)}</p>\n`;
      } else {
        html += `    <p>${escapeHtml(item.text)}</p>\n`;
      }
    } else if (item.type === 'list') {
      const startAttr = item.start ? ` start="${item.start}"` : '';
      html += `    <${item.tag}${startAttr}>\n`;
      item.items.forEach(listItem => {
        html += `      <li>${escapeHtml(listItem)}</li>\n`;
      });
      html += `    </${item.tag}>\n`;
    } else if (item.type === 'blockquote') {
      html += `    <blockquote>\n`;
      if (item.quote) {
        html += `      <p class="says">${escapeHtml(item.quote)}</p>\n`;
      }
      if (item.author) {
        html += `      <p>${escapeHtml(item.author)}</p>\n`;
      }
      html += `    </blockquote>\n`;
    }
  });
  
  return html.trim();
}

// Render structured editor
function renderStructuredEditor(section, content) {
  let pages = [];
  
  if (typeof content === 'string') {
    pages = extractStructuredContent(content);
  } else if (Array.isArray(content)) {
    pages = content;
  }
  
  // Store in AppState
  AppState.structuredContent = pages;
  AppState.currentSection = section;
  
  const sectionNames = {
    profil: 'Profil',
    cv: 'Vita / CV',
    leistungen: 'Leistungen',
    bauenimbestand: 'Schwerpunkte',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz'
  };
  
  let pagesHTML = '';
  
  pages.forEach((page, pageIndex) => {
    pagesHTML += `
      <div class="structured-page" data-page-index="${pageIndex}">
        <h3>Seite ${pageIndex + 1}</h3>
        <div class="structured-items">
          ${renderStructuredItems(page.german, pageIndex, 'de')}
          ${renderStructuredItems(page.english, pageIndex, 'en')}
        </div>
      </div>
    `;
  });
  
  return `
    <h2>${sectionNames[section] || section}</h2>
    <div class="structured-editor">
      ${pagesHTML}
      <button class="btn btn-success" onclick="saveStructuredSection('${section}')">Speichern</button>
    </div>
  `;
}

// Render structured items
function renderStructuredItems(items, pageIndex, lang) {
  let html = `<div class="language-items ${lang}">
    <h4>${lang === 'de' ? 'Deutsch' : 'English'}</h4>
  `;
  
  items.forEach((item, itemIndex) => {
    const itemId = `item-${pageIndex}-${lang}-${itemIndex}`;
    
    if (item.type === 'heading') {
      html += `
        <div class="structured-item heading-item">
          <label>Überschrift:</label>
          <input type="text" id="${itemId}" value="${escapeHtml(item.text)}" class="structured-input">
        </div>
      `;
    } else if (item.type === 'paragraph') {
      html += `
        <div class="structured-item paragraph-item">
          <label>Fettgedruckter Text:</label>
          <input type="text" id="${itemId}-strong" value="${escapeHtml(item.strongText)}" class="structured-input">
          <label>Text:</label>
          <textarea id="${itemId}-text" rows="3" class="structured-input">${escapeHtml(item.text)}</textarea>
        </div>
      `;
    } else if (item.type === 'list') {
      html += `
        <div class="structured-item list-item">
          <label>Liste (${item.tag === 'ol' ? 'nummeriert' : 'Aufzählung'}):</label>
          <div class="list-items">
      `;
      item.items.forEach((listItem, listIndex) => {
        html += `
          <div class="list-item-row">
            <input type="text" id="${itemId}-${listIndex}" value="${escapeHtml(listItem)}" class="structured-input">
          </div>
        `;
      });
      html += `
          </div>
          <button type="button" class="btn btn-small btn-secondary" onclick="addListItem('${itemId}')">+ Eintrag hinzufügen</button>
        </div>
      `;
    } else if (item.type === 'blockquote') {
      html += `
        <div class="structured-item blockquote-item">
          <label>Zitat:</label>
          <textarea id="${itemId}-quote" rows="2" class="structured-input">${escapeHtml(item.quote)}</textarea>
          <label>Autor:</label>
          <input type="text" id="${itemId}-author" value="${escapeHtml(item.author)}" class="structured-input">
        </div>
      `;
    }
    
    // Store item metadata
    html += `<input type="hidden" id="${itemId}-type" value="${item.type}">`;
    html += `<input type="hidden" id="${itemId}-tag" value="${item.tag}">`;
  });
  
  html += `</div>`;
  return html;
}

// Initialize structured editor
function initStructuredEditor(section) {
  window.saveStructuredSection = async function(sectionName) {
    if (!AppState.githubToken) {
      showError('GitHub Token nicht konfiguriert!');
      return;
    }
    
    showLoading(true);
    
    try {
      const pages = AppState.structuredContent || [];
      
      // Update pages from form
      pages.forEach((page, pageIndex) => {
        // Update German items
        page.german.forEach((item, itemIndex) => {
          const itemId = `item-${pageIndex}-de-${itemIndex}`;
          if (item.type === 'heading') {
            item.text = document.getElementById(itemId).value;
          } else if (item.type === 'paragraph') {
            item.strongText = document.getElementById(`${itemId}-strong`).value;
            item.text = document.getElementById(`${itemId}-text`).value;
          } else if (item.type === 'list') {
            item.items = [];
            let listIndex = 0;
            while (true) {
              const input = document.getElementById(`${itemId}-${listIndex}`);
              if (!input) break;
              item.items.push(input.value);
              listIndex++;
            }
          } else if (item.type === 'blockquote') {
            item.quote = document.getElementById(`${itemId}-quote`).value;
            item.author = document.getElementById(`${itemId}-author`).value;
          }
        });
        
        // Update English items
        page.english.forEach((item, itemIndex) => {
          const itemId = `item-${pageIndex}-en-${itemIndex}`;
          if (item.type === 'heading') {
            item.text = document.getElementById(itemId).value;
          } else if (item.type === 'paragraph') {
            item.strongText = document.getElementById(`${itemId}-strong`).value;
            item.text = document.getElementById(`${itemId}-text`).value;
          } else if (item.type === 'list') {
            item.items = [];
            let listIndex = 0;
            while (true) {
              const input = document.getElementById(`${itemId}-${listIndex}`);
              if (!input) break;
              item.items.push(input.value);
              listIndex++;
            }
          } else if (item.type === 'blockquote') {
            item.quote = document.getElementById(`${itemId}-quote`).value;
            item.author = document.getElementById(`${itemId}-author`).value;
          }
        });
      });
      
      // Generate HTML
      const html = generateStructuredHTML(pages);
      
      // Save to GitHub
      const filePath = ADMIN_CONFIG.contentFiles[sectionName];
      await commitToGitHub(filePath, html, `Update ${sectionName} content`);
      
      showStatus('Erfolgreich gespeichert!', 'success');
      
    } catch (error) {
      showError('Fehler beim Speichern: ' + error.message);
    } finally {
      showLoading(false);
    }
  };
  
  window.addListItem = function(itemId) {
    // Find the list container
    const listContainer = document.querySelector(`[id^="${itemId}-"]`).closest('.list-items');
    if (listContainer) {
      const listIndex = listContainer.children.length;
      const newInput = document.createElement('div');
      newInput.className = 'list-item-row';
      newInput.innerHTML = `<input type="text" id="${itemId}-${listIndex}" value="" class="structured-input">`;
      listContainer.appendChild(newInput);
    }
  };
}

// Extract language content from HTML (legacy function for backward compatibility)
function extractLanguageContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Try to find #german and #english directly (works for impressum, cv, datenschutz)
  let germanDiv = doc.querySelector('#german');
  let englishDiv = doc.querySelector('#english');
  
  // If not found, try within .project-page
  if (!germanDiv || !englishDiv) {
    const projectPage = doc.querySelector('.project-page');
    if (projectPage) {
      germanDiv = projectPage.querySelector('#german');
      englishDiv = projectPage.querySelector('#english');
    }
  }
  
  // If still not found, search in body
  if (!germanDiv || !englishDiv) {
    germanDiv = doc.body.querySelector('#german');
    englishDiv = doc.body.querySelector('#english');
  }
  
  let germanContent = '';
  let englishContent = '';
  
  if (germanDiv) {
    germanContent = germanDiv.innerHTML.trim();
  }
  
  if (englishDiv) {
    englishContent = englishDiv.innerHTML.trim();
  }
  
  return {
    german: germanContent,
    english: englishContent
  };
}

// Extract projects from HTML tables
function extractProjectsFromHTML(html) {
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return [];
  }
  
  // Try to parse as HTML document
  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  } catch (e) {
    // If parsing fails, try wrapping in a container
    const parser = new DOMParser();
    doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  }
  
  // Try multiple selectors to find project pages
  let projectPages = doc.querySelectorAll('.project-page');
  
  // If no project pages found, try to find tables directly
  if (projectPages.length === 0) {
    // Check if HTML contains project-page structure
    if (html.includes('project-page')) {
      // Try parsing again with body
      const parser = new DOMParser();
      const wrappedHTML = `<html><body>${html}</body></html>`;
      doc = parser.parseFromString(wrappedHTML, 'text/html');
      projectPages = doc.querySelectorAll('.project-page');
    }
  }
  
  const projects = [];
  
  projectPages.forEach(page => {
    const germanTable = page.querySelector('#german table');
    const englishTable = page.querySelector('#english table');
    
    if (germanTable && englishTable) {
      const germanRows = germanTable.querySelectorAll('tr');
      const englishRows = englishTable.querySelectorAll('tr');
      
      const maxRows = Math.max(germanRows.length, englishRows.length);
      
      for (let i = 0; i < maxRows; i++) {
        const germanRow = germanRows[i];
        const englishRow = englishRows[i];
        
        if (germanRow && englishRow) {
          const yearCell = germanRow.querySelector('td:first-child');
          const contentCellDE = germanRow.querySelector('td:last-child');
          const contentCellEN = englishRow.querySelector('td:last-child');
          
          if (yearCell && contentCellDE && contentCellEN) {
            const year = yearCell.textContent.trim().replace(/\s+/g, ' ').replace(/\n/g, ' '); // Normalize whitespace
            const contentDE = contentCellDE.innerHTML;
            const contentEN = contentCellEN.innerHTML;
            
            // Parse content: <strong>NAME</strong>, ORT<br>BESCHREIBUNG, LPH X-Y
            const nameMatchDE = contentDE.match(/<strong>(.*?)<\/strong>/);
            const nameMatchEN = contentEN.match(/<strong>(.*?)<\/strong>/);
            
            const nameDE = nameMatchDE ? nameMatchDE[1] : '';
            const nameEN = nameMatchEN ? nameMatchEN[1] : '';
            
            // Extract location and description
            const afterNameDE = contentDE.replace(/<strong>.*?<\/strong>/, '').trim();
            const afterNameEN = contentEN.replace(/<strong>.*?<\/strong>/, '').trim();
            
            const partsDE = afterNameDE.split('<br>');
            const partsEN = afterNameEN.split('<br>');
            
            const locationDE = partsDE[0] ? partsDE[0].replace(/^,\s*/, '').trim() : '';
            const locationEN = partsEN[0] ? partsEN[0].replace(/^,\s*/, '').trim() : '';
            
            const descriptionDE = partsDE[1] ? partsDE[1].trim() : '';
            const descriptionEN = partsEN[1] ? partsEN[1].trim() : '';
            
            projects.push({
              year: year,
              nameDE: nameDE,
              nameEN: nameEN,
              locationDE: locationDE,
              locationEN: locationEN,
              descriptionDE: descriptionDE,
              descriptionEN: descriptionEN
            });
          }
        }
      }
    }
  });
  
  return projects;
}

// Generate HTML from projects array
function generateProjectsHTML(projects) {
  const projectsPerPage = 8;
  const pages = [];
  
  for (let i = 0; i < projects.length; i += projectsPerPage) {
    const pageProjects = projects.slice(i, i + projectsPerPage);
    
    let germanTable = '<table>\n';
    let englishTable = '<table>\n';
    
    pageProjects.forEach(project => {
      const year = project.year || '';
      const nameDE = project.nameDE || '';
      const nameEN = project.nameEN || '';
      const locationDE = project.locationDE || '';
      const locationEN = project.locationEN || '';
      const descDE = project.descriptionDE || '';
      const descEN = project.descriptionEN || '';
      
      const rowDE = `            <tr><td>${year}</td><td><strong>${escapeHtml(nameDE)}</strong>${locationDE ? ', ' + escapeHtml(locationDE) : ''}${descDE ? '<br>' + escapeHtml(descDE) : ''}</td></tr>\n`;
      const rowEN = `            <tr><td>${year}</td><td><strong>${escapeHtml(nameEN)}</strong>${locationEN ? ', ' + escapeHtml(locationEN) : ''}${descEN ? '<br>' + escapeHtml(descEN) : ''}</td></tr>\n`;
      
      germanTable += rowDE;
      englishTable += rowEN;
    });
    
    germanTable += '        </table>';
    englishTable += '        </table>';
    
    const footnoteDE = '<p><small>Die Projekte wurden jeweils zusammen mit anderen Architekten und Mitarbeitern des jeweiligen Büros bearbeitet und/oder von diesen geleitet.</small></p>';
    const footnoteEN = '<p><small>The projects were each worked on together with other architects and employees of the respective office and/or managed by them.</small></p>';
    
    pages.push({
      german: `${germanTable}\n        <br>\n        ${footnoteDE}`,
      english: `${englishTable}\n        <br>\n        ${footnoteEN}`
    });
  }
  
  // Generate full HTML
  let html = '';
  pages.forEach((page, index) => {
    html += `<div class="project-page">
    <div id="german" class="language active">
        ${page.german}
    </div>
    <div id="english" class="language">
        ${page.english}
    </div>
</div>
`;
  });
  
  return html.trim();
}

// Render projects editor
function renderProjectsEditor(content) {
  let projects = [];
  
  // First, check if AppState.projects is already populated (from loadContentForSection)
  if (AppState.projects && AppState.projects.length > 0) {
    projects = AppState.projects;
  } else if (Array.isArray(content)) {
    // If content is already an array, use it directly
    projects = content;
    AppState.projects = projects;
  } else if (typeof content === 'string' && content.trim().length > 0) {
    // Extract from content if AppState.projects is empty
    projects = extractProjectsFromHTML(content);
    if (projects && projects.length > 0) {
      AppState.projects = projects;
    } else {
      // If extraction failed, try to extract from cache
      const cachedContent = AppState.contentCache && AppState.contentCache.projekte;
      if (cachedContent && typeof cachedContent === 'string') {
        projects = extractProjectsFromHTML(cachedContent);
        if (projects && projects.length > 0) {
          AppState.projects = projects;
        }
      }
    }
  } else {
    // Final fallback: try to extract from cache
    const cachedContent = AppState.contentCache && AppState.contentCache.projekte;
    if (cachedContent && typeof cachedContent === 'string') {
      projects = extractProjectsFromHTML(cachedContent);
      if (projects && projects.length > 0) {
        AppState.projects = projects;
      }
    }
  }
  
  // If still no projects, try to extract from existing DOM elements (if already rendered)
  if (projects.length === 0) {
    const existingItems = document.querySelectorAll('.project-item');
    if (existingItems.length > 0) {
      projects = [];
      existingItems.forEach((item) => {
        const yearEl = item.querySelector('.project-year');
        const nameEl = item.querySelector('.project-name');
        if (yearEl && nameEl) {
          projects.push({
            year: yearEl.textContent.trim(),
            nameDE: nameEl.textContent.trim(),
            nameEN: '',
            locationDE: '',
            locationEN: '',
            descriptionDE: '',
            descriptionEN: ''
          });
        }
      });
      if (projects.length > 0) {
        AppState.projects = projects;
      }
    }
  }
  
  // CRITICAL: Always ensure AppState.projects is set if we have projects
  if (projects.length > 0) {
    AppState.projects = projects;
  }
  
  let projectsHTML = '<div class="projects-list">';
  
  if (projects.length === 0) {
    projectsHTML += '<p style="padding: 1rem; color: #666;">Noch keine Projekte vorhanden. Klicken Sie auf "Neues Projekt hinzufügen".</p>';
  } else {
    projects.forEach((project, index) => {
      projectsHTML += `
        <div class="project-item" data-index="${index}">
          <div class="project-item-header">
            <span class="project-year">${escapeHtml(project.year || '')}</span>
            <span class="project-name">${escapeHtml(project.nameDE || '')}</span>
            <button class="btn btn-small btn-danger" onclick="deleteProject(${index})">Löschen</button>
            <button class="btn btn-small btn-secondary" onclick="editProject(${index})">Bearbeiten</button>
          </div>
        </div>
      `;
    });
  }
  
  projectsHTML += '</div>';
  
  return `
    <h2>Projekte</h2>
    <div class="projects-editor">
      <div class="projects-controls">
        <button class="btn btn-primary" onclick="addNewProject()">+ Neues Projekt hinzufügen</button>
        <button class="btn btn-success" onclick="saveProjects()">Alle Projekte speichern</button>
      </div>
      ${projectsHTML}
    </div>
    
    <!-- Project Form Modal -->
    <div id="project-form-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="close-modal" onclick="closeProjectModal()">&times;</span>
        <h3 id="project-form-title">Neues Projekt</h3>
        <form id="project-form" onsubmit="saveProjectForm(event)">
          <div class="form-group">
            <label>Jahr:</label>
            <input type="text" id="project-year" placeholder="22 oder 21-22" required>
          </div>
          <div class="form-group">
            <label>Name (DE):</label>
            <input type="text" id="project-name-de" placeholder="Haus M" required>
          </div>
          <div class="form-group">
            <label>Name (EN):</label>
            <input type="text" id="project-name-en" placeholder="House M" required>
          </div>
          <div class="form-group">
            <label>Ort (DE):</label>
            <input type="text" id="project-location-de" placeholder="Oberaudorf">
          </div>
          <div class="form-group">
            <label>Ort (EN):</label>
            <input type="text" id="project-location-en" placeholder="Oberaudorf">
          </div>
          <div class="form-group">
            <label>Beschreibung (DE):</label>
            <textarea id="project-desc-de" placeholder="Umbau Mehrfamilienhaus, LPH 1-5"></textarea>
          </div>
          <div class="form-group">
            <label>Beschreibung (EN):</label>
            <textarea id="project-desc-en" placeholder="Conversion of multi-family house, LPH 1-5"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Speichern</button>
            <button type="button" class="btn btn-secondary" onclick="closeProjectModal()">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Initialize projects editor
function initProjectsEditor() {
  // Functions are defined globally for onclick handlers
  window.addNewProject = function() {
    AppState.editingProjectIndex = -1;
    document.getElementById('project-form-title').textContent = 'Neues Projekt';
    document.getElementById('project-form').reset();
    document.getElementById('project-form-modal').style.display = 'block';
  };
  
  window.editProject = function(index) {
    const project = AppState.projects[index];
    if (!project) return;
    
    AppState.editingProjectIndex = index;
    document.getElementById('project-form-title').textContent = 'Projekt bearbeiten';
    document.getElementById('project-year').value = project.year || '';
    document.getElementById('project-name-de').value = project.nameDE || '';
    document.getElementById('project-name-en').value = project.nameEN || '';
    document.getElementById('project-location-de').value = project.locationDE || '';
    document.getElementById('project-location-en').value = project.locationEN || '';
    document.getElementById('project-desc-de').value = project.descriptionDE || '';
    document.getElementById('project-desc-en').value = project.descriptionEN || '';
    document.getElementById('project-form-modal').style.display = 'block';
  };
  
  window.deleteProject = function(index) {
    if (confirm('Möchten Sie dieses Projekt wirklich löschen?')) {
      if (!AppState.projects || AppState.projects.length === 0) {
        // Extract projects from DOM if AppState.projects is empty
        const projectItems = document.querySelectorAll('.project-item');
        AppState.projects = Array.from(projectItems).map((item, idx) => {
          const yearEl = item.querySelector('.project-year');
          const nameEl = item.querySelector('.project-name');
          return {
            year: yearEl ? yearEl.textContent.trim() : '',
            nameDE: nameEl ? nameEl.textContent.trim() : '',
            nameEN: '',
            locationDE: '',
            locationEN: '',
            descriptionDE: '',
            descriptionEN: ''
          };
        });
      }
      AppState.projects.splice(index, 1);
      const container = document.getElementById('editor-sections');
      const sectionDiv = container.querySelector('#section-projekte');
      if (sectionDiv) {
        sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
        initProjectsEditor();
      }
    }
  };
  
  window.closeProjectModal = function() {
    document.getElementById('project-form-modal').style.display = 'none';
  };
  
  window.saveProjectForm = function(event) {
    event.preventDefault();
    
    const project = {
      year: document.getElementById('project-year').value.trim(),
      nameDE: document.getElementById('project-name-de').value.trim(),
      nameEN: document.getElementById('project-name-en').value.trim(),
      locationDE: document.getElementById('project-location-de').value.trim(),
      locationEN: document.getElementById('project-location-en').value.trim(),
      descriptionDE: document.getElementById('project-desc-de').value.trim(),
      descriptionEN: document.getElementById('project-desc-en').value.trim()
    };
    
    if (AppState.editingProjectIndex >= 0) {
      AppState.projects[AppState.editingProjectIndex] = project;
    } else {
      AppState.projects.push(project);
    }
    
    closeProjectModal();
    const container = document.getElementById('editor-sections');
    const sectionDiv = container.querySelector('#section-projekte');
    if (sectionDiv) {
      sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
      initProjectsEditor();
    }
  };
  
  window.saveProjects = async function() {
    if (!AppState.githubToken) {
      showError('GitHub Token nicht konfiguriert!');
      return;
    }
    
    showLoading(true);
    
    try {
      const html = generateProjectsHTML(AppState.projects);
      const filePath = ADMIN_CONFIG.contentFiles.projekte;
      
      await commitToGitHub(filePath, html, 'Projekte aktualisiert');
      
      showStatus('Projekte erfolgreich gespeichert!', 'success');
      
    } catch (error) {
      showError('Fehler beim Speichern: ' + error.message);
    } finally {
      showLoading(false);
    }
  };
}

// Render editor for section
function renderEditor(section, content) {
  const container = document.getElementById('editor-sections');
  if (!container) {
    console.error('Editor container not found!');
    return;
  }
  
  // Ensure container is visible
  container.style.display = 'block';
  
  // Hide ALL existing sections FIRST - be very aggressive
  const allSections = container.querySelectorAll('.editor-section');
  allSections.forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  
  // Also hide by ID just to be sure
  const allSectionIds = ['profil', 'cv', 'leistungen', 'bauenimbestand', 'projekte', 'kontakt', 'impressum', 'datenschutz', 'meta', 'password'];
  allSectionIds.forEach(secId => {
    const sec = document.getElementById(`section-${secId}`);
    if (sec) {
      sec.style.display = 'none';
      sec.classList.remove('active');
    }
  });
  
  // Find or create section div
  let sectionDiv = container.querySelector(`#section-${section}`);
  if (!sectionDiv) {
    sectionDiv = document.createElement('div');
    sectionDiv.className = 'editor-section active';
    sectionDiv.id = `section-${section}`;
    container.appendChild(sectionDiv);
  }
  
  // Clear and show this section
  sectionDiv.innerHTML = '';
  sectionDiv.style.display = 'block';
  sectionDiv.classList.add('active');
  
  if (section === 'kontakt' || section === 'meta') {
    sectionDiv.innerHTML = renderSpecialEditor(section, content);
  } else if (section === 'projekte') {
    sectionDiv.innerHTML = renderProjectsEditor(content);
  } else {
    // All other sections use normal dual-language editor (Markdown/HTML)
    sectionDiv.innerHTML = renderDualLanguageEditor(section, content);
  }
  
  // Initialize editors after a short delay to ensure DOM is ready
  setTimeout(() => {
    if (section === 'projekte') {
      // ALWAYS try to extract from DOM if AppState.projects is empty
      if (!AppState.projects || AppState.projects.length === 0) {
        // Wait a bit longer for DOM to be fully rendered
        setTimeout(() => {
          const projectItems = document.querySelectorAll('.project-item');
          if (projectItems.length > 0) {
            // Extract from DOM - read from rendered project items
            const projects = [];
            projectItems.forEach((item) => {
              const yearEl = item.querySelector('.project-year');
              const nameEl = item.querySelector('.project-name');
              if (yearEl && nameEl) {
                projects.push({
                  year: yearEl.textContent.trim(),
                  nameDE: nameEl.textContent.trim(),
                  nameEN: '',
                  locationDE: '',
                  locationEN: '',
                  descriptionDE: '',
                  descriptionEN: ''
                });
              }
            });
            if (projects.length > 0) {
              AppState.projects = projects;
              // Re-render with the extracted projects to ensure consistency
              const container = document.getElementById('editor-sections');
              const sectionDiv = container.querySelector('#section-projekte');
              if (sectionDiv) {
                sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
                // Re-initialize after re-render
                setTimeout(() => initProjectsEditor(), 50);
                return;
              }
            }
          }
          // If DOM extraction failed, try to extract from cached content
          const cachedContent = AppState.contentCache && AppState.contentCache.projekte;
          if (cachedContent && typeof cachedContent === 'string' && cachedContent.trim().length > 0) {
            const extractedProjects = extractProjectsFromHTML(cachedContent);
            if (extractedProjects && extractedProjects.length > 0) {
              AppState.projects = extractedProjects;
              // Re-render with the extracted projects
              const container = document.getElementById('editor-sections');
              const sectionDiv = container.querySelector('#section-projekte');
              if (sectionDiv) {
                sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
                // Re-initialize after re-render
                setTimeout(() => initProjectsEditor(), 50);
                return;
              }
            }
          }
          // If all else fails, initialize anyway
          initProjectsEditor();
        }, 200);
        return;
      }
      initProjectsEditor();
    } else if (section === 'kontakt' || section === 'meta') {
      initCharacterCounters();
    } else {
      // All other sections use normal editors
      initEditors(section);
    }
  }, 50);
}

// Render dual language editor (DE/EN side by side)
function renderDualLanguageEditor(section, content) {
  let germanContent = '';
  let englishContent = '';
  
  if (typeof content === 'string') {
    const extracted = extractLanguageContent(content);
    germanContent = extracted.german;
    englishContent = extracted.english;
  } else {
    germanContent = content.german || '';
    englishContent = content.english || '';
  }
  
  const sectionNames = {
    profil: 'Profil',
    cv: 'Vita / CV',
    leistungen: 'Leistungen',
    bauenimbestand: 'Schwerpunkte',
    projekte: 'Projekte',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz'
  };
  
  return `
    <h2>${sectionNames[section] || section}</h2>
    <div class="editor-dual">
      <div class="editor-panel">
        <div class="editor-header">
          <h3><span class="lang-badge de">DE</span> Deutsch</h3>
          <div class="editor-header-actions">
            <div class="editor-mode-switch">
              <button type="button" class="mode-btn active" data-mode="visual" data-editor="${section}-de" onclick="switchEditorMode('${section}-de', 'visual')">Editor</button>
              <button type="button" class="mode-btn" data-mode="markdown" data-editor="${section}-de" onclick="switchEditorMode('${section}-de', 'markdown')">Markdown</button>
            </div>
          </div>
        </div>
        <div class="editor-toolbar" id="toolbar-${section}-de">
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'bold')" title="Fett (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'italic')" title="Kursiv (Ctrl+I)"><em>I</em></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'underline')" title="Unterstrichen (Ctrl+U)"><u>U</u></button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h1')" title="Überschrift H1">H1</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h2')" title="Überschrift H2">H2</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h3')" title="Überschrift H3">H3</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'p')" title="Normaler Text (Absatz)">Normal</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'insertUnorderedList')" title="Aufzählungsliste">• Liste</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'insertOrderedList')" title="Nummerierte Liste">1. Liste</button>
          <button type="button" class="toolbar-btn" onclick="insertTable('${section}-de')" title="Tabelle einfügen">📊</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="insertBlockquote('${section}-de')" title="Zitat einfügen">💬 Zitat</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'createLink')" title="Link einfügen">🔗 Link</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="removeAllFormatting('${section}-de')" title="Alle Formatierung entfernen">🗑️ Alle</button>
        </div>
        <div id="editor-visual-${section}-de" class="editor-visual" contenteditable="true" data-lang="de" data-section="${section}" style="display: none;">${germanContent}</div>
        <textarea id="editor-${section}-de" class="content-editor" data-lang="de" data-section="${section}">${germanContent}</textarea>
        <div id="preview-${section}-de" class="preview-panel"></div>
        <div id="validation-${section}-de" class="validation-warning" style="display: none;"></div>
      </div>
      <div class="editor-panel">
        <div class="editor-header">
          <h3><span class="lang-badge en">EN</span> English</h3>
          <div class="editor-header-actions">
            <button type="button" class="btn-translate" onclick="translateFromGerman('${section}')" title="Aus Deutsch übersetzen">
              <span>🌐</span> Aus DE übersetzen
            </button>
            <div class="editor-mode-switch">
              <button type="button" class="mode-btn active" data-mode="visual" data-editor="${section}-en" onclick="switchEditorMode('${section}-en', 'visual')">Editor</button>
              <button type="button" class="mode-btn" data-mode="markdown" data-editor="${section}-en" onclick="switchEditorMode('${section}-en', 'markdown')">Markdown</button>
            </div>
          </div>
        </div>
        <div class="editor-toolbar" id="toolbar-${section}-en">
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'bold')" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'italic')" title="Italic (Ctrl+I)"><em>I</em></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'underline')" title="Underline (Ctrl+U)"><u>U</u></button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h1')" title="Heading H1">H1</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h2')" title="Heading H2">H2</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h3')" title="Heading H3">H3</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'p')" title="Normal Text (Paragraph)">Normal</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'insertUnorderedList')" title="Bullet List">• List</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'insertOrderedList')" title="Numbered List">1. List</button>
          <button type="button" class="toolbar-btn" onclick="insertTable('${section}-en')" title="Insert Table">📊</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="insertBlockquote('${section}-en')" title="Insert Quote">💬 Quote</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'createLink')" title="Insert Link">🔗 Link</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="removeAllFormatting('${section}-en')" title="Remove All Formatting">🗑️ All</button>
        </div>
        <div id="editor-visual-${section}-en" class="editor-visual" contenteditable="true" data-lang="en" data-section="${section}" style="display: none;">${englishContent}</div>
        <textarea id="editor-${section}-en" class="content-editor" data-lang="en" data-section="${section}">${englishContent}</textarea>
        <div id="preview-${section}-en" class="preview-panel"></div>
        <div id="validation-${section}-en" class="validation-warning" style="display: none;"></div>
      </div>
    </div>
    <button class="btn btn-success" onclick="saveSection('${section}')">Speichern</button>
  `;
}

// Render special editors (Kontakt, Meta)
function renderSpecialEditor(section, content) {
  if (section === 'kontakt') {
    const contactData = content || {
      textDE: '',
      textEN: '',
      email: '',
      phone: '',
      addressDE: '',
      addressEN: ''
    };
    
    return `
      <h2>Kontakt</h2>
      <div class="contact-editor">
        <div class="form-group">
          <label>Text (DE):</label>
          <textarea id="contact-text-de" rows="3" placeholder="Kontaktanfragen sind willkommen – offizieller Geschäftsstart ab Herbst 2025.">${escapeHtml(contactData.textDE || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Text (EN):</label>
          <textarea id="contact-text-en" rows="3" placeholder="Inquiries are welcome – official business launch in autumn 2025.">${escapeHtml(contactData.textEN || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="contact-email" value="${escapeHtml(contactData.email || '')}" placeholder="hello@schels.info">
        </div>
        <div class="form-group">
          <label>Telefon:</label>
          <input type="tel" id="contact-phone" value="${escapeHtml(contactData.phone || '')}" placeholder="+4984429292291">
        </div>
        <div class="form-group">
          <label>Adresse (DE):</label>
          <input type="text" id="contact-address-de" value="${escapeHtml(contactData.addressDE || '')}" placeholder="Schlachterstrasse 9, 85283 Wolnzach">
        </div>
        <div class="form-group">
          <label>Adresse (EN):</label>
          <input type="text" id="contact-address-en" value="${escapeHtml(contactData.addressEN || '')}" placeholder="Schlachterstrasse 9, 85283 Wolnzach">
        </div>
        <button class="btn btn-success" onclick="saveSection('kontakt')">Speichern</button>
      </div>
    `;
  } else if (section === 'meta') {
    return `
      <h2>Meta-Tags & SEO</h2>
      <div class="editor-panel">
        <div class="form-group">
          <label>Title:</label>
          <input type="text" id="meta-title" value="${escapeHtml(content.title || '')}">
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea id="meta-description" rows="3" maxlength="160">${escapeHtml(content.description || '')}</textarea>
          <div class="char-counter" id="meta-description-counter">0 / 160 Zeichen</div>
        </div>
        <div class="form-group">
          <label>Keywords:</label>
          <input type="text" id="meta-keywords" value="${escapeHtml(content.keywords || '')}">
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="meta-email" value="${escapeHtml(content.email || '')}">
        </div>
        <div class="form-group">
          <label>Phone:</label>
          <input type="text" id="meta-phone" value="${escapeHtml(content.phone || '')}">
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input type="text" id="meta-address" value="${escapeHtml(content.address || '')}">
        </div>
        <button class="btn btn-success" onclick="saveSection('meta')">Speichern</button>
      </div>
    `;
  }
}

// Initialize editors with preview
function initEditors(section) {
  const textEditors = document.querySelectorAll(`#section-${section} .content-editor`);
  const visualEditors = document.querySelectorAll(`#section-${section} .editor-visual`);
  
  // Initialize text editors (Markdown mode)
  textEditors.forEach(editor => {
    editor.addEventListener('input', function() {
      updatePreview(this);
      validateContent(this);
      AppState.hasChanges = true;
      updateSaveIndicator();
      // Sync to visual editor if active
      syncToVisualEditor(editor);
    });
    
    updatePreview(editor);
    validateContent(editor);
  });
  
  // Initialize visual editors
  visualEditors.forEach(editor => {
    // Save state for undo on input
    let saveTimeout;
    editor.addEventListener('input', function() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveStateForUndo(this);
      }, 500);
      
      syncToTextEditor(this);
      AppState.hasChanges = true;
      updateSaveIndicator();
    });
    
    editor.addEventListener('blur', function() {
      syncToTextEditor(this);
      saveStateForUndo(this);
    });
    
    // Handle paste events - strip formatting and paste as plain text
    editor.addEventListener('paste', function(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      
      // Get selection
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Insert as plain text
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Insert at end
        const textNode = document.createTextNode(text);
        editor.appendChild(textNode);
      }
      
      syncToTextEditor(editor);
      AppState.hasChanges = true;
      updateSaveIndicator();
    });
    
    // Prevent unwanted formatting from browser
    editor.addEventListener('keydown', function(e) {
      // Prevent Ctrl+B, Ctrl+I, Ctrl+U from browser default (we handle it)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
        // Already handled by keyboard shortcuts
      }
    });
    
    // Initial state
    saveStateForUndo(editor);
  });
  
  // Set initial mode to visual
  textEditors.forEach(editor => {
    const editorId = editor.id;
    const parts = editorId.split('-');
    const lang = parts[parts.length - 1];
    switchEditorMode(`${section}-${lang}`, 'visual');
  });
  
  // Initialize character counters
  initCharacterCounters();
}

// Switch between visual and markdown mode
window.switchEditorMode = function(editorId, mode) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  const toolbar = document.getElementById(`toolbar-${editorId}`);
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  
  const preview = document.getElementById(`preview-${editorId}`);
  
  if (mode === 'visual') {
    // Show visual editor, hide text editor and preview
    if (visualEditor && textEditor) {
      // Sync content from text to visual
      syncToVisualEditor(textEditor);
      visualEditor.style.display = 'block';
      textEditor.style.display = 'none';
      if (toolbar) toolbar.style.display = 'flex';
      if (preview) preview.style.display = 'none';
      
      // Update mode buttons
      modeButtons.forEach(btn => {
        if (btn.dataset.mode === 'visual') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  } else {
    // Show text editor and preview, hide visual editor
    if (visualEditor && textEditor) {
      // Sync content from visual to text
      syncToTextEditor(visualEditor);
      visualEditor.style.display = 'none';
      textEditor.style.display = 'block';
      if (toolbar) toolbar.style.display = 'none';
      if (preview) preview.style.display = 'block';
      
      // Update preview
      updatePreview(textEditor);
      
      // Update mode buttons
      modeButtons.forEach(btn => {
        if (btn.dataset.mode === 'markdown') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }
};

// Format text in visual editor
window.formatText = function(editorId, command, value = null) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    // Switch to visual mode first
    switchEditorMode(editorId, 'visual');
    setTimeout(() => formatText(editorId, command, value), 100);
    return;
  }
  
  visualEditor.focus();
  
  try {
    // Handle block format toggles (h1, h2, h3, p)
    if (command === 'h1' || command === 'h2' || command === 'h3' || command === 'p') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let blockElement = range.commonAncestorContainer;
        
        // Find the block element (h1-h6, p, div, etc.)
        while (blockElement && blockElement.nodeType !== 1) {
          blockElement = blockElement.parentNode;
        }
        while (blockElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'].includes(blockElement.tagName)) {
          blockElement = blockElement.parentNode;
        }
        
        // Check if current block already has the target format
        const targetTag = command.toUpperCase();
        if (blockElement && blockElement.tagName === targetTag) {
          // Toggle off: convert to paragraph
          document.execCommand('formatBlock', false, '<p>');
        } else {
          // Toggle on: apply format
          document.execCommand('formatBlock', false, `<${command}>`);
        }
      } else {
        // No selection, just apply format
        document.execCommand('formatBlock', false, `<${command}>`);
      }
    } else if (command === 'bold' || command === 'italic' || command === 'underline') {
      // Toggle inline formats
      document.execCommand(command, false, value);
    } else if (command === 'createLink') {
      const url = prompt('URL eingeben:', 'https://');
      if (url && url.trim()) {
        // Basic URL validation
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
          document.execCommand('createLink', false, url.trim());
        } else {
          showError('Ungültige URL! Muss mit http://, https://, mailto: oder tel: beginnen.');
        }
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    // Sync to text editor
    syncToTextEditor(visualEditor);
    
    // Mark as changed
    AppState.hasChanges = true;
    updateSaveIndicator();
  } catch (e) {
    showError('Formatierungsfehler: ' + e.message);
  }
};

// Remove all formatting from selected text or entire editor
window.removeAllFormatting = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    switchEditorMode(editorId, 'visual');
    setTimeout(() => removeAllFormatting(editorId), 100);
    return;
  }
  
  visualEditor.focus();
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    // Remove formatting from selection
    const range = selection.getRangeAt(0);
    const contents = range.extractContents();
    
    // Get plain text
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(contents);
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Insert plain text
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);
    
    // Select the inserted text
    range.setStartBefore(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Remove all formatting from entire editor - convert to paragraphs
    // Use innerText to preserve encoding
    const plainText = visualEditor.innerText || visualEditor.textContent || '';
    visualEditor.innerHTML = '';
    const lines = plainText.split('\n');
    lines.forEach((line, index) => {
      if (line.trim()) {
        const p = document.createElement('p');
        p.textContent = line; // textContent preserves encoding
        visualEditor.appendChild(p);
      } else if (index < lines.length - 1) {
        // Preserve line breaks
        visualEditor.appendChild(document.createElement('br'));
      }
    });
  }
  
  // Sync to text editor
  syncToTextEditor(visualEditor);
  
  AppState.hasChanges = true;
  updateSaveIndicator();
};

// Insert blockquote with proper structure
window.insertBlockquote = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    // Switch to visual mode first
    switchEditorMode(editorId, 'visual');
    setTimeout(() => insertBlockquote(editorId), 100);
    return;
  }
  
  visualEditor.focus();
  
  // Get selected text or use placeholder
  const selection = window.getSelection();
  let selectedText = '';
  if (selection.rangeCount > 0) {
    selectedText = selection.toString();
  }
  
  // Create blockquote structure
  const blockquoteHTML = `
<blockquote>
  <p class="says">${selectedText || 'Zitat hier eingeben'}</p>
  <p>Autor</p>
</blockquote>`;
  
  // Insert blockquote
  if (selection.rangeCount > 0 && !selectedText) {
    // Insert at cursor position
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blockquoteHTML;
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    range.insertNode(fragment);
  } else {
    // Replace selection or insert
    if (selectedText) {
      document.execCommand('insertHTML', false, blockquoteHTML);
    } else {
      // Insert at end
      const range = document.createRange();
      range.selectNodeContents(visualEditor);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertHTML', false, blockquoteHTML);
    }
  }
  
  // Sync to text editor
  syncToTextEditor(visualEditor);
  
  AppState.hasChanges = true;
  updateSaveIndicator();
};

// Sync visual editor content to text editor
function syncToTextEditor(visualEditor) {
  if (!visualEditor) return;
  
  const editorId = visualEditor.id.replace('editor-visual-', '');
  const textEditor = document.getElementById(`editor-${editorId}`);
  if (textEditor) {
    // Get HTML directly - don't modify encoding
    const html = visualEditor.innerHTML;
    
    // Only remove truly empty tags (no content at all)
    let cleanHTML = html.replace(/<p>\s*<\/p>/g, '');
    cleanHTML = cleanHTML.replace(/<h[1-6]>\s*<\/h[1-6]>/g, '');
    
    textEditor.value = cleanHTML;
    updatePreview(textEditor);
    validateContent(textEditor);
  }
}

// Sync text editor content to visual editor
function syncToVisualEditor(textEditor) {
  if (!textEditor) return;
  
  const editorId = textEditor.id.replace('editor-', '');
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (visualEditor && visualEditor.style.display !== 'none') {
    // Clean HTML before setting
    let cleanHTML = textEditor.value;
    // Ensure proper structure - wrap loose text in paragraphs
    if (cleanHTML && !cleanHTML.match(/^<[h1-6p]/)) {
      // If content doesn't start with a block element, wrap it
      cleanHTML = '<p>' + cleanHTML + '</p>';
    }
    visualEditor.innerHTML = cleanHTML;
  }
}

// Update preview
function updatePreview(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const previewId = `preview-${section}-${lang}`;
  const preview = document.getElementById(previewId);
  
  if (preview) {
    // Handle both textarea (value) and contenteditable div (innerHTML)
    const content = editor.value || editor.innerHTML || '';
    preview.innerHTML = content;
  }
}

// Validate content
function validateContent(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const validationId = `validation-${section}-${lang}`;
  const validation = document.getElementById(validationId);
  
  if (!validation) return;
  
  const content = editor.value.trim();
  let warnings = [];
  
  if (!content) {
    warnings.push('Inhalt ist leer!');
  }
  
  // Check for missing translations
  const otherLang = lang === 'de' ? 'en' : 'de';
  const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
  if (otherEditor && !otherEditor.value.trim() && content) {
    warnings.push(`Übersetzung (${otherLang.toUpperCase()}) fehlt!`);
  }
  
  if (warnings.length > 0) {
    validation.textContent = warnings.join(' ');
    validation.style.display = 'block';
  } else {
    validation.style.display = 'none';
  }
}

// Save section with race condition prevention
let savingInProgress = false;
async function saveSection(section) {
  if (savingInProgress) {
    showError('Speichern läuft bereits! Bitte warten...');
    return;
  }
  
  if (!AppState.githubToken) {
    showError('GitHub Token nicht konfiguriert!');
    return;
  }
  
  savingInProgress = true;
  showLoading(true);
  
  try {
    // Create backup before saving
    await createBackup(section);
    
    if (section === 'kontakt' || section === 'meta') {
      await saveSpecialSection(section);
    } else {
      await saveContentSection(section);
    }
    
    AppState.hasChanges = false;
    updateSaveIndicator();
    showStatus('Erfolgreich gespeichert!', 'success');
    
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    let errorMessage = 'Fehler beim Speichern: ' + error.message;
    
    // Provide more specific error messages
    if (error.message.includes('401') || error.message.includes('Bad credentials')) {
      errorMessage = 'Authentifizierung fehlgeschlagen! Bitte Token erneuern.';
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorMessage = 'Zugriff verweigert! Bitte überprüfen Sie den GitHub Token und dessen Berechtigungen.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Datei nicht gefunden! Bitte überprüfen Sie die Repository-Konfiguration.';
    } else if (error.message.includes('422')) {
      errorMessage = 'Validierungsfehler! Möglicherweise ist die Datei zu groß oder der Inhalt ungültig.';
    }
    
    showError(errorMessage);
  } finally {
    savingInProgress = false;
    showLoading(false);
  }
}

// Save content section
async function saveContentSection(section) {
  // Get content from active editor (visual or text)
  let germanContent = '';
  let englishContent = '';
  
  const germanVisual = document.getElementById(`editor-visual-${section}-de`);
  const germanText = document.getElementById(`editor-${section}-de`);
  const englishVisual = document.getElementById(`editor-visual-${section}-en`);
  const englishText = document.getElementById(`editor-${section}-en`);
  
  // Use visual editor if visible, otherwise text editor
  if (germanVisual && germanVisual.style.display !== 'none') {
    germanContent = germanVisual.innerHTML;
  } else if (germanText) {
    germanContent = germanText.value;
  }
  
  if (englishVisual && englishVisual.style.display !== 'none') {
    englishContent = englishVisual.innerHTML;
  } else if (englishText) {
    englishContent = englishText.value;
  }
  
  // Reconstruct HTML
  const filePath = ADMIN_CONFIG.contentFiles[section];
  const originalContent = await fetchGitHubFile(filePath);
  
  // Handle different file structures
  let finalContent = originalContent;
  
  // Check if file has project-page structure (like profil.html)
  if (originalContent.includes('<div class="project-page"')) {
    // Handle multiple project-page divs
    const projectPages = originalContent.match(/<div class="project-page">[\s\S]*?<\/div>\s*<\/div>/g);
    if (projectPages && projectPages.length > 0) {
      // Update first project-page
      let firstPage = projectPages[0];
      firstPage = firstPage.replace(
        /<div id="german"[^>]*>[\s\S]*?<\/div>/,
        `<div id="german" class="language active">${germanContent}</div>`
      );
      firstPage = firstPage.replace(
        /<div id="english"[^>]*>[\s\S]*?<\/div>/,
        `<div id="english" class="language">${englishContent}</div>`
      );
      finalContent = originalContent.replace(projectPages[0], firstPage);
    } else {
      // Simple structure
      finalContent = originalContent.replace(
        /<div id="german"[^>]*>[\s\S]*?<\/div>/,
        `<div id="german" class="language active">${germanContent}</div>`
      );
      finalContent = finalContent.replace(
        /<div id="english"[^>]*>[\s\S]*?<\/div>/,
        `<div id="english" class="language">${englishContent}</div>`
      );
    }
  } else if (originalContent.includes('<div id="german"')) {
    // Standard structure with german/english divs
    // Find positions of divs
    const germanStart = originalContent.indexOf('<div id="german"');
    const germanTagEnd = originalContent.indexOf('>', germanStart) + 1;
    const englishStart = originalContent.indexOf('<div id="english"');
    const englishTagEnd = originalContent.indexOf('>', englishStart) + 1;
    
    if (germanStart !== -1 && englishStart !== -1) {
      // Find the matching closing div for german (before english starts)
      let germanClosePos = englishStart;
      let divCount = 0;
      for (let i = germanTagEnd; i < englishStart; i++) {
        if (originalContent.substring(i, i + 4) === '<div') divCount++;
        if (originalContent.substring(i, i + 6) === '</div>') {
          divCount--;
          if (divCount === 0) {
            germanClosePos = i;
            break;
          }
        }
      }
      
      // Find the matching closing div for english (last closing div)
      let englishClosePos = originalContent.length;
      divCount = 0;
      for (let i = englishTagEnd; i < originalContent.length; i++) {
        if (originalContent.substring(i, i + 4) === '<div') divCount++;
        if (originalContent.substring(i, i + 6) === '</div>') {
          divCount--;
          if (divCount === 0) {
            englishClosePos = i;
            break;
          }
        }
      }
      
      // Reconstruct: before german + new german div + between + new english div + after
      const beforeGerman = originalContent.substring(0, germanTagEnd);
      const between = originalContent.substring(germanClosePos + 6, englishTagEnd);
      const afterEnglish = originalContent.substring(englishClosePos + 6);
      
      finalContent = beforeGerman + germanContent + '</div>' + 
                     between + englishContent + '</div>' + 
                     afterEnglish;
    } else {
      // Fallback: replace each div separately with greedy match
      finalContent = originalContent.replace(
        /<div id="german"[^>]*>[\s\S]*?<\/div>/,
        `<div id="german" class="language active">${germanContent}</div>`
      );
      finalContent = finalContent.replace(
        /<div id="english"[^>]*>[\s\S]*?<\/div>/,
        `<div id="english" class="language">${englishContent}</div>`
      );
    }
  } else {
    // New file - create structure
    finalContent = `<div id="german" class="language active">${germanContent}</div>\n<div id="english" class="language">${englishContent}</div>`;
  }
  
  try {
    await commitToGitHub(filePath, finalContent, `Update ${section} content (DE/EN)`);
    
    // Invalidate cache after successful save to ensure fresh data on next load
    if (fetchCache[filePath]) {
      delete fetchCache[filePath];
    }
    // Also clear content cache
    if (AppState.contentCache[section]) {
      delete AppState.contentCache[section];
    }
  } catch (error) {
    console.error('Fehler beim Speichern von', section, ':', error);
    throw error; // Re-throw to be caught by saveSection
  }
}

// Save special sections (Kontakt, Meta)
async function saveSpecialSection(section) {
  if (section === 'kontakt') {
    // Get form values
    const contactData = {
      textDE: document.getElementById('contact-text-de').value.trim(),
      textEN: document.getElementById('contact-text-en').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      addressDE: document.getElementById('contact-address-de').value.trim(),
      addressEN: document.getElementById('contact-address-en').value.trim()
    };
    
    // Generate HTML
    const html = generateContactHTML(contactData);
    
    // Load index.html
    const indexContent = await fetchGitHubFile('index.html');
    const parser = new DOMParser();
    const doc = parser.parseFromString(indexContent, 'text/html');
    
    // Update contact section
    const germanDiv = doc.querySelector('#content4 #german');
    const englishDiv = doc.querySelector('#content4 #english');
    
    if (germanDiv) germanDiv.innerHTML = html.german;
    if (englishDiv) englishDiv.innerHTML = html.english;
    
    const updatedContent = new XMLSerializer().serializeToString(doc);
    await commitToGitHub('index.html', updatedContent, 'Update contact information');
    
  } else if (section === 'meta') {
    const title = document.getElementById('meta-title').value;
    const description = document.getElementById('meta-description').value;
    const keywords = document.getElementById('meta-keywords').value;
    
    // Load index.html
    const indexContent = await fetchGitHubFile('index.html');
    
    // Update meta tags
    let updatedContent = indexContent;
    updatedContent = updatedContent.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    updatedContent = updatedContent.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeHtml(description)}">`
    );
    updatedContent = updatedContent.replace(
      /<meta name="keywords"[^>]*>/,
      `<meta name="keywords" content="${escapeHtml(keywords)}">`
    );
    
    await commitToGitHub('index.html', updatedContent, 'Update meta tags');
  }
}

// Commit to GitHub
async function commitToGitHub(path, content, message, isBase64 = false) {
  const config = AppState.githubConfig;
  
  // Get current file SHA
  const getFileUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
  const getResponse = await fetch(getFileUrl, {
    headers: {
      'Authorization': `token ${AppState.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  let sha = null;
  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
  }
  
  // Encode content to base64
  const encodedContent = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));
  
  // Commit
  const commitUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  const commitData = {
    message: message,
    content: encodedContent,
    branch: config.branch
  };
  
  if (sha) {
    commitData.sha = sha;
  }
  
  const commitResponse = await fetch(commitUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${AppState.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commitData)
  });
  
  if (!commitResponse.ok) {
    const error = await commitResponse.json();
    throw new Error(error.message || 'Commit fehlgeschlagen');
  }
  
  return await commitResponse.json();
}

// Save all changes
document.getElementById('save-all-btn')?.addEventListener('click', async function() {
  await saveAllSections();
});

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLogin() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('editor-screen').classList.remove('active');
}

function showEditor() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('editor-screen').classList.add('active');
  
  // Check if GitHub token is configured
  if (!AppState.githubToken) {
    const setupScreen = document.getElementById('setup-screen');
    const editorSections = document.getElementById('editor-sections');
    if (setupScreen) {
      setupScreen.style.display = 'block';
    }
    if (editorSections) {
      editorSections.style.display = 'none';
    }
    showStatus('Bitte GitHub Token konfigurieren!', 'info');
    return;
  }
  
  // Initialize dark mode toggle if not already present
  setTimeout(() => {
    const header = document.querySelector('.admin-header');
    if (header && !document.getElementById('dark-mode-toggle')) {
      const headerActions = header.querySelector('.header-actions');
      if (headerActions) {
        const toggle = document.createElement('button');
        toggle.id = 'dark-mode-toggle';
        toggle.className = 'btn btn-secondary';
        toggle.innerHTML = AppState.darkMode ? '☀️' : '🌙';
        toggle.title = AppState.darkMode ? 'Hell' : 'Dunkel';
        toggle.addEventListener('click', toggleDarkMode);
        headerActions.insertBefore(toggle, headerActions.firstChild);
      }
    }
  }, 100);
  
  // Load first section
  if (!AppState.currentSection) {
    switchSection('profil');
  }
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  // Try login error first, then status message
  let errorDiv = document.getElementById('login-error');
  if (!errorDiv) {
    errorDiv = document.getElementById('status-message');
  }
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
  } else {
    // Fallback: alert if error div not found
    alert('Fehler: ' + message);
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status-message');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Password change functionality
function renderPasswordEditor() {
  const container = document.getElementById('editor-sections');
  container.innerHTML = '';
  
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'editor-section active';
  sectionDiv.id = 'section-password';
  sectionDiv.innerHTML = `
    <h2>Passwort ändern</h2>
    <div class="editor-panel">
      <div class="form-group">
        <label for="current-password">Aktuelles Passwort:</label>
        <input type="password" id="current-password" required>
      </div>
      <div class="form-group">
        <label for="new-password">Neues Passwort:</label>
        <input type="password" id="new-password" required>
      </div>
      <div class="form-group">
        <label for="confirm-password">Passwort bestätigen:</label>
        <input type="password" id="confirm-password" required>
      </div>
      <div id="password-status" class="status-message" style="display: none;"></div>
      <button class="btn btn-success" onclick="changePassword()">Passwort ändern</button>
      <div id="password-hash-display" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 5px; display: none;">
        <p><strong>Neuer Password-Hash (für admin-config.js):</strong></p>
        <code id="new-password-hash" style="word-break: break-all;"></code>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Kopieren Sie diesen Hash und fügen Sie ihn in admin-config.js ein.</p>
      </div>
    </div>
  `;
  
  container.appendChild(sectionDiv);
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const statusDiv = document.getElementById('password-status');
  const hashDisplay = document.getElementById('password-hash-display');
  const hashCode = document.getElementById('new-password-hash');
  
  // Reset
  statusDiv.style.display = 'none';
  hashDisplay.style.display = 'none';
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    statusDiv.textContent = 'Bitte alle Felder ausfüllen!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Verify current password
  const currentHash = await sha256(currentPassword);
  if (currentHash !== ADMIN_CONFIG.passwordHash) {
    statusDiv.textContent = 'Aktuelles Passwort ist falsch!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Check if new passwords match
  if (newPassword !== confirmPassword) {
    statusDiv.textContent = 'Neue Passwörter stimmen nicht überein!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Check password strength
  if (newPassword.length < 6) {
    statusDiv.textContent = 'Passwort muss mindestens 6 Zeichen lang sein!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Generate new hash
  const newHash = await sha256(newPassword);
  
  // Show success and hash
  statusDiv.textContent = 'Passwort erfolgreich geändert! Bitte Hash in admin-config.js eintragen.';
  statusDiv.className = 'status-message success';
  statusDiv.style.display = 'block';
  
  hashCode.textContent = newHash;
  hashDisplay.style.display = 'block';
  
  // Update localStorage
  localStorage.setItem('admin_password_hash', newHash);
  
  // Clear form
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

// ========== Auto-Save Warning ==========
let changeIndicatorTimeout = null;
function initAutoSaveWarning() {
  // Warn before leaving page if there are unsaved changes
  window.addEventListener('beforeunload', function(e) {
    if (AppState.hasChanges) {
      e.preventDefault();
      e.returnValue = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
      return e.returnValue;
    }
  });
  
  // Track changes with debouncing
  document.addEventListener('input', function(e) {
    if (e.target.matches('.content-editor, .editor-visual, .structured-input, textarea, input[type="text"], input[type="email"], input[type="tel"]')) {
      AppState.hasChanges = true;
      // Debounce indicator update
      clearTimeout(changeIndicatorTimeout);
      changeIndicatorTimeout = setTimeout(() => {
        updateSaveIndicator();
      }, 300);
    }
  });
}

function updateSaveIndicator() {
  const saveBtn = document.querySelector('.btn-success');
  if (saveBtn && AppState.hasChanges) {
    saveBtn.textContent = '💾 Speichern (ungespeichert)';
    saveBtn.style.opacity = '0.8';
  } else if (saveBtn) {
    saveBtn.textContent = 'Speichern';
    saveBtn.style.opacity = '1';
  }
}

// ========== Keyboard Shortcuts ==========
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Only handle shortcuts when in editor screen
    if (!AppState.isAuthenticated) return;
    
    // Ctrl+S or Cmd+S - Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (AppState.currentSection) {
        saveSection(AppState.currentSection);
      }
      return;
    }
    
    // Ctrl+B or Cmd+B - Bold (only in visual editor)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      const activeEditor = document.activeElement;
      if (activeEditor && activeEditor.classList.contains('editor-visual')) {
        e.preventDefault();
        const editorId = activeEditor.id.replace('editor-visual-', '');
        formatText(editorId, 'bold');
      }
      return;
    }
    
    // Ctrl+I or Cmd+I - Italic (only in visual editor)
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      const activeEditor = document.activeElement;
      if (activeEditor && activeEditor.classList.contains('editor-visual')) {
        e.preventDefault();
        const editorId = activeEditor.id.replace('editor-visual-', '');
        formatText(editorId, 'italic');
      }
      return;
    }
    
    // Ctrl+Z or Cmd+Z - Undo (only in visual editor)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const activeEditor = document.activeElement;
      if (activeEditor && activeEditor.classList.contains('editor-visual')) {
        e.preventDefault();
        undoEdit(activeEditor);
      }
      return;
    }
    
    // Ctrl+Shift+Z or Cmd+Shift+Z - Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      const activeEditor = document.activeElement;
      if (activeEditor && activeEditor.classList.contains('editor-visual')) {
        e.preventDefault();
        redoEdit(activeEditor);
      }
      return;
    }
    
    // Ctrl+Y or Cmd+Y - Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      const activeEditor = document.activeElement;
      if (activeEditor && activeEditor.classList.contains('editor-visual')) {
        e.preventDefault();
        redoEdit(activeEditor);
      }
      return;
    }
  });
}

// ========== Undo/Redo ==========
function saveStateForUndo(editor) {
  const editorId = editor.id;
  if (!AppState.undoStack[editorId]) {
    AppState.undoStack[editorId] = [];
  }
  if (!AppState.redoStack[editorId]) {
    AppState.redoStack[editorId] = [];
  }
  
  const currentState = editor.innerHTML;
  const lastState = AppState.undoStack[editorId][AppState.undoStack[editorId].length - 1];
  
  // Only save if different from last state
  if (currentState !== lastState) {
    AppState.undoStack[editorId].push(currentState);
    // Limit undo stack to 50 items
    if (AppState.undoStack[editorId].length > 50) {
      AppState.undoStack[editorId].shift();
    }
    // Clear redo stack when new edit is made
    AppState.redoStack[editorId] = [];
  }
}

function undoEdit(editor) {
  const editorId = editor.id;
  if (!AppState.undoStack[editorId] || AppState.undoStack[editorId].length === 0) {
    return;
  }
  
  // Save current state to redo stack
  if (!AppState.redoStack[editorId]) {
    AppState.redoStack[editorId] = [];
  }
  AppState.redoStack[editorId].push(editor.innerHTML);
  
  // Restore previous state
  const previousState = AppState.undoStack[editorId].pop();
  editor.innerHTML = previousState;
  
  // Sync to text editor
  syncToTextEditor(editor);
}

function redoEdit(editor) {
  const editorId = editor.id;
  if (!AppState.redoStack[editorId] || AppState.redoStack[editorId].length === 0) {
    return;
  }
  
  // Save current state to undo stack
  if (!AppState.undoStack[editorId]) {
    AppState.undoStack[editorId] = [];
  }
  AppState.undoStack[editorId].push(editor.innerHTML);
  
  // Restore next state
  const nextState = AppState.redoStack[editorId].pop();
  editor.innerHTML = nextState;
  
  // Sync to text editor
  syncToTextEditor(editor);
}

// ========== Backup before changes ==========
async function createBackup(section) {
  try {
    const filePath = ADMIN_CONFIG.contentFiles[section];
    if (filePath) {
      const content = await fetchGitHubFile(filePath);
      if (!AppState.backups[section]) {
        AppState.backups[section] = {
          history: []
        };
      }
      AppState.backups[section].content = content;
      AppState.backups[section].timestamp = new Date().toISOString();
      AppState.backups[section].filePath = filePath;
      
      // Keep only last 5 backups per section
      AppState.backups[section].history.push({
        content: content,
        timestamp: new Date().toISOString()
      });
      if (AppState.backups[section].history.length > 5) {
        AppState.backups[section].history.shift();
      }
    }
  } catch (error) {
    // Silent fail for backup - don't block save operation
    // Backup is optional
  }
}

// ========== Character Counter ==========
function initCharacterCounters() {
  // Add character counter to meta description
  const metaDesc = document.getElementById('meta-description');
  if (metaDesc) {
    let counter = document.getElementById('meta-description-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'char-counter';
      counter.id = 'meta-description-counter';
      metaDesc.parentNode.insertBefore(counter, metaDesc.nextSibling);
    }
    updateCharacterCounter(metaDesc, counter, 160);
    
    metaDesc.addEventListener('input', function() {
      updateCharacterCounter(metaDesc, counter, 160);
    });
  }
  
  // Add character counter to contact text fields
  const contactTexts = ['contact-text-de', 'contact-text-en'];
  contactTexts.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      let counter = document.getElementById(`${id}-counter`);
      if (!counter) {
        counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.id = `${id}-counter`;
        field.parentNode.insertBefore(counter, field.nextSibling);
      }
      updateCharacterCounter(field, counter, 500);
      
      field.addEventListener('input', function() {
        updateCharacterCounter(field, counter, 500);
      });
    }
  });
}

function updateCharacterCounter(field, counter, maxLength) {
  const length = field.value.length;
  counter.textContent = `${length} / ${maxLength} Zeichen`;
  counter.className = 'char-counter';
  if (length > maxLength) {
    counter.classList.add('warning');
  } else if (length > maxLength * 0.9) {
    counter.classList.add('caution');
  }
}

// ========== Dark Mode ==========
function initDarkMode() {
  if (AppState.darkMode) {
    document.body.classList.add('dark-mode');
  }
  
  // Create dark mode toggle button when editor is shown
  setTimeout(() => {
    const header = document.querySelector('.admin-header');
    if (header && !document.getElementById('dark-mode-toggle')) {
      const headerActions = header.querySelector('.header-actions');
      if (headerActions) {
        const toggle = document.createElement('button');
        toggle.id = 'dark-mode-toggle';
        toggle.className = 'btn btn-secondary';
        toggle.innerHTML = AppState.darkMode ? '☀️' : '🌙';
        toggle.title = AppState.darkMode ? 'Hell' : 'Dunkel';
        toggle.addEventListener('click', toggleDarkMode);
        headerActions.insertBefore(toggle, headerActions.firstChild);
      }
    }
  }, 100);
}

function toggleDarkMode() {
  AppState.darkMode = !AppState.darkMode;
  document.body.classList.toggle('dark-mode', AppState.darkMode);
  localStorage.setItem('admin_dark_mode', AppState.darkMode.toString());
  
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) {
    toggle.innerHTML = AppState.darkMode ? '☀️' : '🌙';
    toggle.title = AppState.darkMode ? 'Hell' : 'Dunkel';
  }
}

// ========== Better Validation ==========
function validateContent(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const validationId = `validation-${section}-${lang}`;
  const validationDiv = document.getElementById(validationId);
  
  if (!validationDiv) return;
  
  const content = editor.value || editor.innerHTML || '';
  const issues = [];
  
  // Check for missing translations
  if (section !== 'meta' && section !== 'kontakt') {
    const otherLang = lang === 'de' ? 'en' : 'de';
    const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
    const otherContent = otherEditor ? (otherEditor.value || '') : '';
    
    if (content.trim() && !otherContent.trim()) {
      issues.push('Fehlende Übersetzung');
    }
  }
  
  // Check for HTML issues
  if (content.includes('<script')) {
    issues.push('⚠️ Script-Tags sind nicht erlaubt');
  }
  
  // Check for unclosed tags (ignore self-closing tags)
  // For CV and other dual-language sections, check both languages together
  let contentToCheck = content;
  if (section === 'cv' || section === 'profil' || section === 'leistungen' || section === 'bauenimbestand') {
    // Get content from both language editors
    const otherLang = lang === 'de' ? 'en' : 'de';
    const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
    const otherContent = otherEditor ? (otherEditor.value || otherEditor.innerHTML || '') : '';
    // Combine both contents for validation
    contentToCheck = content + '\n' + otherContent;
  }
  
  // Self-closing tags: br, hr, img, input, meta, link, area, base, col, embed, source, track, wbr
  const selfClosingTags = /<(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)[^>]*>/gi;
  const allOpenTags = contentToCheck.match(/<[^/][^>]*>/g) || [];
  const selfClosingCount = (contentToCheck.match(selfClosingTags) || []).length;
  const openTags = allOpenTags.length - selfClosingCount;
  const closeTags = (contentToCheck.match(/<\/[^>]+>/g) || []).length;
  
  // Only warn if difference is significant (more than 3, to account for nested structures)
  if (Math.abs(openTags - closeTags) > 3) {
    issues.push('⚠️ Mögliche ungeschlossene HTML-Tags');
  }
  
  // Display validation
  if (issues.length > 0) {
    validationDiv.textContent = issues.join(' • ');
    validationDiv.style.display = 'block';
    validationDiv.className = 'validation-warning';
  } else {
    validationDiv.style.display = 'none';
  }
}

// ========== Search & Replace ==========
window.showSearchReplace = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'search-replace-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal" onclick="closeSearchReplace()">&times;</span>
      <h3>Suchen & Ersetzen</h3>
      <div class="form-group">
        <label>Suchen:</label>
        <input type="text" id="search-term" placeholder="Text suchen...">
      </div>
      <div class="form-group">
        <label>Ersetzen mit:</label>
        <input type="text" id="replace-term" placeholder="Neuer Text...">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="search-case-sensitive"> Groß-/Kleinschreibung beachten
        </label>
        <label>
          <input type="checkbox" id="search-all-sections"> In allen Bereichen suchen
        </label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="performSearch()">Suchen</button>
        <button class="btn btn-success" onclick="performReplace()">Ersetzen</button>
        <button class="btn btn-secondary" onclick="closeSearchReplace()">Abbrechen</button>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('search-term').focus();
};

window.closeSearchReplace = function() {
  const modal = document.getElementById('search-replace-modal');
  if (modal) {
    modal.remove();
  }
};

window.performSearch = function() {
  const searchTerm = document.getElementById('search-term').value;
  const caseSensitive = document.getElementById('search-case-sensitive').checked;
  const allSections = document.getElementById('search-all-sections').checked;
  const resultsDiv = document.getElementById('search-results');
  
  if (!searchTerm) {
    resultsDiv.innerHTML = '<p class="error">Bitte Suchbegriff eingeben!</p>';
    return;
  }
  
  const results = [];
  const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  
  if (allSections) {
    // Search in all sections
    Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
      const editors = document.querySelectorAll(`#section-${section} .content-editor, #section-${section} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        const matches = content.match(regex);
        if (matches) {
          results.push({
            section: section,
            editor: editor.id,
            count: matches.length
          });
        }
      });
    });
  } else {
    // Search in current section
    const currentSection = AppState.currentSection;
    if (currentSection) {
      const editors = document.querySelectorAll(`#section-${currentSection} .content-editor, #section-${currentSection} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        const matches = content.match(regex);
        if (matches) {
          results.push({
            section: currentSection,
            editor: editor.id,
            count: matches.length
          });
        }
      });
    }
  }
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
  } else {
    resultsDiv.innerHTML = `<p><strong>${results.length} Ergebnis(se) gefunden:</strong></p><ul>${results.map(r => `<li>${r.section} (${r.editor}): ${r.count} Treffer</li>`).join('')}</ul>`;
  }
};

window.performReplace = function() {
  const searchTerm = document.getElementById('search-term').value;
  const replaceTerm = document.getElementById('replace-term').value;
  const caseSensitive = document.getElementById('search-case-sensitive').checked;
  const allSections = document.getElementById('search-all-sections').checked;
  
  if (!searchTerm) {
    showError('Bitte Suchbegriff eingeben!');
    return;
  }
  
  const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  let replaced = 0;
  
  if (allSections) {
    Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
      const editors = document.querySelectorAll(`#section-${section} .content-editor, #section-${section} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        if (content.match(regex)) {
          const newContent = content.replace(regex, replaceTerm);
          if (editor.classList.contains('content-editor')) {
            editor.value = newContent;
          } else {
            editor.innerHTML = newContent;
          }
          syncToTextEditor(editor);
          replaced++;
        }
      });
    });
  } else {
    const currentSection = AppState.currentSection;
    if (currentSection) {
      const editors = document.querySelectorAll(`#section-${currentSection} .content-editor, #section-${currentSection} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        if (content.match(regex)) {
          const newContent = content.replace(regex, replaceTerm);
          if (editor.classList.contains('content-editor')) {
            editor.value = newContent;
          } else {
            editor.innerHTML = newContent;
          }
          syncToTextEditor(editor);
          replaced++;
        }
      });
    }
  }
  
  showStatus(`${replaced} Ersetzung(en) durchgeführt!`, 'success');
  closeSearchReplace();
};

// ========== Table Editor ==========
window.insertTable = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    switchEditorMode(editorId, 'visual');
    setTimeout(() => insertTable(editorId), 100);
    return;
  }
  
  const rowsInput = prompt('Anzahl Zeilen (1-20):', '3');
  const colsInput = prompt('Anzahl Spalten (1-10):', '2');
  
  if (!rowsInput || !colsInput) return;
  
  const rows = parseInt(rowsInput);
  const cols = parseInt(colsInput);
  
  // Validate input
  if (isNaN(rows) || isNaN(cols) || rows < 1 || rows > 20 || cols < 1 || cols > 10) {
    showError('Ungültige Eingabe! Zeilen: 1-20, Spalten: 1-10');
    return;
  }
  
  let tableHTML = '<table>\n';
  for (let i = 0; i < rows; i++) {
    tableHTML += '  <tr>\n';
    for (let j = 0; j < cols; j++) {
      tableHTML += '    <td></td>\n';
    }
    tableHTML += '  </tr>\n';
  }
  tableHTML += '</table>';
  
  try {
    visualEditor.focus();
    document.execCommand('insertHTML', false, tableHTML);
    
    syncToTextEditor(visualEditor);
    
    AppState.hasChanges = true;
    updateSaveIndicator();
  } catch (e) {
    showError('Fehler beim Einfügen der Tabelle: ' + e.message);
  }
};

// ========== Image Upload (deactivated - not working) ==========
// Image upload functionality deactivated as requested
window.uploadImage = async function(editorId) {
  showError('Bild-Upload ist derzeit nicht verfügbar.');
  return;
};

// ========== Preview Mode ==========
window.togglePreviewMode = function() {
  const previewMode = localStorage.getItem('admin_preview_mode') === 'true';
  localStorage.setItem('admin_preview_mode', (!previewMode).toString());
  
  const editors = document.querySelectorAll('.editor-panel');
  editors.forEach(panel => {
    if (!previewMode) {
      // Show preview
      const preview = panel.querySelector('.preview-panel');
      if (preview) {
        preview.style.display = 'block';
        const editor = panel.querySelector('.content-editor, .editor-visual');
        if (editor) {
          const content = editor.value || editor.innerHTML || '';
          preview.innerHTML = content;
        }
      }
    } else {
      // Hide preview
      const preview = panel.querySelector('.preview-panel');
      if (preview) {
        preview.style.display = 'none';
      }
    }
  });
};

// ========== Last Changes ==========
async function loadLastChanges() {
  if (!AppState.githubToken) return;
  
  try {
    const config = AppState.githubConfig;
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/commits?per_page=10`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${AppState.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const commits = await response.json();
      return commits.map(c => ({
        message: c.commit.message,
        author: c.commit.author.name,
        date: new Date(c.commit.author.date).toLocaleString('de-DE'),
        sha: c.sha.substring(0, 7)
      }));
    }
  } catch (error) {
    // Silent fail for commit history - not critical
  }
  return [];
}

// ========== Export/Import ==========
window.exportContent = function() {
  const exportData = {
    timestamp: new Date().toISOString(),
    sections: {}
  };
  
  Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
    const germanEditor = document.getElementById(`editor-${section}-de`);
    const englishEditor = document.getElementById(`editor-${section}-en`);
    const germanVisual = document.getElementById(`editor-visual-${section}-de`);
    const englishVisual = document.getElementById(`editor-visual-${section}-en`);
    
    exportData.sections[section] = {
      german: germanEditor ? germanEditor.value : (germanVisual ? germanVisual.innerHTML : ''),
      english: englishEditor ? englishEditor.value : (englishVisual ? englishVisual.innerHTML : '')
    };
  });
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `website-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Export erfolgreich!', 'success');
};

window.importContent = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm('Möchten Sie wirklich alle Inhalte importieren? Dies überschreibt aktuelle Inhalte!')) {
          Object.keys(data.sections).forEach(section => {
            const germanEditor = document.getElementById(`editor-${section}-de`);
            const englishEditor = document.getElementById(`editor-${section}-en`);
            const germanVisual = document.getElementById(`editor-visual-${section}-de`);
            const englishVisual = document.getElementById(`editor-visual-${section}-en`);
            
            if (germanEditor) germanEditor.value = data.sections[section].german || '';
            if (englishEditor) englishEditor.value = data.sections[section].english || '';
            if (germanVisual) germanVisual.innerHTML = data.sections[section].german || '';
            if (englishVisual) englishVisual.innerHTML = data.sections[section].english || '';
          });
          
          showStatus('Import erfolgreich! Bitte speichern.', 'success');
        }
      } catch (error) {
        showError('Fehler beim Import: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

// ========== Bulk Save ==========
async function saveAllSections() {
  if (savingInProgress) {
    showError('Speichern läuft bereits! Bitte warten...');
    return;
  }
  
  if (!AppState.githubToken) {
    showError('GitHub Token nicht konfiguriert!');
    return;
  }
  
  if (!confirm('Möchten Sie wirklich alle Bereiche speichern?')) {
    return;
  }
  
  savingInProgress = true;
  showLoading(true);
  const sections = Object.keys(ADMIN_CONFIG.contentFiles);
  let saved = 0;
  let errors = 0;
  
  try {
    for (const section of sections) {
      try {
        // Create backup for each section
        await createBackup(section);
        
        if (section === 'kontakt' || section === 'meta') {
          await saveSpecialSection(section);
        } else if (section === 'projekte') {
          await saveProjects();
        } else {
          await saveContentSection(section);
        }
        saved++;
      } catch (error) {
        errors++;
        showError(`Fehler beim Speichern von ${section}: ${error.message}`);
      }
    }
    
    if (errors === 0) {
      showStatus(`Alle ${saved} Bereiche erfolgreich gespeichert!`, 'success');
      AppState.hasChanges = false;
      updateSaveIndicator();
    } else {
      showError(`${saved} gespeichert, ${errors} Fehler`);
    }
  } finally {
    savingInProgress = false;
    showLoading(false);
  }
}

// ========== DeepL Translation ==========
// Helper function to get editor content (works for both visual and markdown mode)
function getEditorContent(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  
  if (!visualEditor && !textEditor) {
    return '';
  }
  
  // Check which mode is active
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  let isVisualMode = false;
  modeButtons.forEach(btn => {
    if (btn.classList.contains('active') && btn.getAttribute('data-mode') === 'visual') {
      isVisualMode = true;
    }
  });
  
  if (isVisualMode && visualEditor) {
    return visualEditor.innerHTML || '';
  } else if (textEditor) {
    return textEditor.value || '';
  }
  
  return '';
}

// Helper function to set editor content
function setEditorContent(editorId, content) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  
  if (!visualEditor && !textEditor) {
    return;
  }
  
  // Check which mode is active
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  let isVisualMode = false;
  modeButtons.forEach(btn => {
    if (btn.classList.contains('active') && btn.getAttribute('data-mode') === 'visual') {
      isVisualMode = true;
    }
  });
  
  if (isVisualMode && visualEditor) {
    visualEditor.innerHTML = content;
    // Trigger input event to mark as changed
    visualEditor.dispatchEvent(new Event('input', { bubbles: true }));
    // Update preview
    updatePreview(visualEditor);
  } else if (textEditor) {
    textEditor.value = content;
    // Trigger input event to mark as changed
    textEditor.dispatchEvent(new Event('input', { bubbles: true }));
    // Update preview
    updatePreview(textEditor);
  }
}

// Convert HTML to plain text (preserving structure for translation)
function htmlToPlainText(html) {
  if (!html) return '';
  
  // Create temporary element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove script and style elements
  const scripts = temp.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());
  
  // Get text content
  return temp.textContent || temp.innerText || '';
}

// Convert plain text back to HTML (simple paragraph structure)
function plainTextToHtml(text) {
  if (!text) return '';
  
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    
    // Split by single newlines and wrap in <br>
    const lines = trimmed.split('\n');
    if (lines.length === 1) {
      return `<p>${escapeHtml(lines[0])}</p>`;
    } else {
      return `<p>${lines.map(line => escapeHtml(line)).join('<br>')}</p>`;
    }
  }).filter(p => p).join('\n');
}

// Translate from German to English using MyMemory Translation API (kostenlos, keine Kreditkarte nötig)
async function translateFromGerman(section) {
  // Get German content
  const germanContent = getEditorContent(`${section}-de`);
  if (!germanContent || germanContent.trim() === '') {
    showError('Kein deutscher Text zum Übersetzen gefunden!');
    return;
  }
  
  // Convert HTML to plain text
  const plainText = htmlToPlainText(germanContent);
  if (!plainText || plainText.trim() === '') {
    showError('Kein Text zum Übersetzen gefunden!');
    return;
  }
  
  // MyMemory API limit: 10.000 Zeichen pro Request
  if (plainText.length > 10000) {
    showError('Text zu lang! Bitte maximal 10.000 Zeichen auf einmal übersetzen.');
    return;
  }
  
  // Show loading
  showLoading(true);
  const translateBtn = document.querySelector(`[onclick="translateFromGerman('${section}')"]`);
  if (translateBtn) {
    translateBtn.disabled = true;
    translateBtn.innerHTML = '<span>🌐</span> Übersetze...';
  }
  
  try {
    // MyMemory Translation API - kostenlos, keine Registrierung nötig
    // Limit: 10.000 Zeichen pro Request, 100 Requests/Tag
    // WICHTIG: langpair=de|en bedeutet Deutsch (de) zu Englisch (en)
    // Explizit: source=deutsch, target=english
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainText)}&langpair=de|en&de=deutsch&en=english`;
    
    console.log('Translating from DE to EN:', plainText.substring(0, 100) + '...');
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.responseStatus !== 200) {
      throw new Error(data.responseData || 'Übersetzungsfehler');
    }
    
    let translatedText = data.responseData.translatedText;
    
    if (!translatedText) {
      throw new Error('Keine Übersetzung erhalten');
    }
    
    console.log('Translated text (first 100 chars):', translatedText.substring(0, 100));
    
    // Check if translation seems wrong (contains Dutch words)
    // If it looks like Dutch, try alternative API
    const dutchIndicators = ['het', 'de', 'een', 'van', 'is', 'voor', 'op', 'te', 'met'];
    const translatedLower = translatedText.toLowerCase();
    const hasDutchWords = dutchIndicators.some(word => translatedLower.includes(' ' + word + ' '));
    
    if (hasDutchWords && translatedText.length > 20) {
      console.warn('Translation might be Dutch, trying alternative method...');
      // Try with explicit language codes using different format
      const altUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(plainText)}&langpair=de|en-US`;
      const altResponse = await fetch(altUrl);
      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData.responseStatus === 200 && altData.responseData.translatedText) {
          const altTranslated = altData.responseData.translatedText;
          console.log('Alternative translation:', altTranslated.substring(0, 100));
          // Use alternative if it's different and doesn't look like Dutch
          const altHasDutch = dutchIndicators.some(word => altTranslated.toLowerCase().includes(' ' + word + ' '));
          if (!altHasDutch) {
            translatedText = altTranslated;
            console.log('Using alternative translation (English)');
          }
        }
      }
    }
    
    // Convert back to HTML
    const translatedHtml = plainTextToHtml(translatedText);
    
    // Set English content
    setEditorContent(`${section}-en`, translatedHtml);
    
    showStatus('Übersetzung erfolgreich!', 'success');
    AppState.hasChanges = true;
    updateSaveIndicator();
    
  } catch (error) {
    console.error('Translation error:', error);
    showError('Übersetzungsfehler: ' + error.message);
  } finally {
    showLoading(false);
    if (translateBtn) {
      translateBtn.disabled = false;
      translateBtn.innerHTML = '<span>🌐</span> Aus DE übersetzen';
    }
  }
}

// Make functions available globally
window.saveSection = saveSection;
window.changePassword = changePassword;
window.saveAllSections = saveAllSections;
window.translateFromGerman = translateFromGerman;

// Extract contact content from index.html
function extractContactContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const germanDiv = doc.querySelector('#content4 #german');
  const englishDiv = doc.querySelector('#content4 #english');
  
  // Parse structured contact data
  const contactData = {
    textDE: '',
    textEN: '',
    email: '',
    phone: '',
    addressDE: '',
    addressEN: ''
  };
  
  if (germanDiv) {
    const textP = germanDiv.querySelector('p.content');
    if (textP) contactData.textDE = textP.textContent.trim();
    
    const emailDiv = germanDiv.querySelector('.arrow-nohover');
    if (emailDiv && emailDiv.textContent.includes('Email:')) {
      const emailLink = emailDiv.querySelector('a[href^="mailto:"]');
      if (emailLink) {
        contactData.email = emailLink.getAttribute('href').replace('mailto:', '');
      }
    }
    
    const phoneDivs = germanDiv.querySelectorAll('.arrow-nohover');
    phoneDivs.forEach(div => {
      if (div.textContent.includes('Telefon:') || div.textContent.includes('Telefon')) {
        const phoneLink = div.querySelector('a[href^="tel:"]');
        if (phoneLink) {
          // Get phone from href, not from text (text may have &nbsp;)
          contactData.phone = phoneLink.getAttribute('href').replace('tel:', '');
        }
      } else if (div.textContent.includes('Adresse:') || div.textContent.includes('Adresse')) {
        // Remove "Adresse:" prefix and trim
        let addressText = div.textContent;
        addressText = addressText.replace(/^Adresse:\s*/i, '').trim();
        contactData.addressDE = addressText;
      }
    });
  }
  
  if (englishDiv) {
    const textP = englishDiv.querySelector('p.content');
    if (textP) contactData.textEN = textP.textContent.trim();
    
    const phoneDivs = englishDiv.querySelectorAll('.arrow-nohover');
    phoneDivs.forEach(div => {
      if (div.textContent.includes('Address:') || div.textContent.includes('Address')) {
        // Remove "Address:" prefix and trim
        let addressText = div.textContent;
        addressText = addressText.replace(/^Address:\s*/i, '').trim();
        contactData.addressEN = addressText;
      }
    });
  }
  
  return contactData;
}

// Generate contact HTML from structured data
function generateContactHTML(contactData) {
  const email = contactData.email || '';
  const phone = contactData.phone || '';
  const addressDE = contactData.addressDE || '';
  const addressEN = contactData.addressEN || '';
  const textDE = contactData.textDE || '';
  const textEN = contactData.textEN || '';
  
  // Format phone for display (replace spaces with &nbsp;)
  const phoneDisplay = phone.replace(/\s/g, '&nbsp;');
  
  const germanHTML = `
        <p class="content">${escapeHtml(textDE)}</p>
          <div class="arrow-nohover">Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
          <div class="arrow-nohover">Telefon: <a href="tel:${escapeHtml(phone)}">${phoneDisplay}</a></div>
          <div class="arrow-nohover">Adresse: ${escapeHtml(addressDE)}</div>
          <br>
          <hr class="z">`;
  
  const englishHTML = `
        <p class="content">${escapeHtml(textEN)}</p>
          <div class="arrow-nohover">Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
          <div class="arrow-nohover">Phone: <a href="tel:${escapeHtml(phone)}">${phoneDisplay}</a></div>
          <div class="arrow-nohover">Address: ${escapeHtml(addressEN)}</div>
          <br>
          <hr class="z">`;
  
  return {
    german: germanHTML.trim(),
    english: englishHTML.trim()
  };
}

// Extract meta content from index.html
function extractMetaContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract email from contact section
  const emailLink = doc.querySelector('#content4 a[href^="mailto:"]');
  const email = emailLink ? emailLink.textContent.trim() : '';
  
  // Extract phone from contact section
  const phoneLink = doc.querySelector('#content4 a[href^="tel:"]');
  const phone = phoneLink ? phoneLink.textContent.trim() : '';
  
  // Extract address from contact section - find the div containing "Address:"
  let address = '';
  const addressDivs = doc.querySelectorAll('#content4 .arrow-nohover');
  addressDivs.forEach(div => {
    if (div.textContent.includes('Address:') || div.textContent.includes('Adresse:')) {
      // Remove "Address:" or "Adresse:" prefix and trim
      let addressText = div.textContent.trim();
      addressText = addressText.replace(/^(Address|Adresse):\s*/i, '').trim();
      if (addressText && !address) {
        address = addressText;
      }
    }
  });
  
  return {
    title: doc.querySelector('title')?.textContent || '',
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
    email: email,
    phone: phone,
    address: address
  };
}

// Extract structured content from HTML (preserves structure, extracts text)
function extractStructuredContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const projectPages = doc.querySelectorAll('.project-page');
  
  const pages = [];
  
  projectPages.forEach((page, pageIndex) => {
    const germanDiv = page.querySelector('#german');
    const englishDiv = page.querySelector('#english');
    
    const pageData = {
      pageIndex: pageIndex,
      german: extractTextFromElement(germanDiv),
      english: extractTextFromElement(englishDiv)
    };
    
    pages.push(pageData);
  });
  
  return pages;
}

// Extract text content while preserving structure
function extractTextFromElement(element) {
  if (!element) return [];
  
  const items = [];
  const children = Array.from(element.children);
  
  children.forEach(child => {
    const tagName = child.tagName.toLowerCase();
    
    if (tagName === 'h3') {
      items.push({
        type: 'heading',
        tag: 'h3',
        text: child.textContent.trim(),
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'p') {
      const strong = child.querySelector('strong');
      let textAfterStrong = '';
      
      if (strong) {
        // Get text after </strong> and remove <br> if present
        const htmlAfterStrong = child.innerHTML.split('</strong>')[1];
        if (htmlAfterStrong) {
          textAfterStrong = htmlAfterStrong.replace(/^<br\s*\/?>/i, '').trim();
          // Remove HTML tags but keep text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = textAfterStrong;
          textAfterStrong = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
      
      items.push({
        type: 'paragraph',
        tag: 'p',
        strongText: strong ? strong.textContent.trim() : '',
        text: textAfterStrong || (strong ? '' : child.textContent.trim()),
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'ol' || tagName === 'ul') {
      const listItems = Array.from(child.querySelectorAll('li')).map(li => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = li.innerHTML;
        return tempDiv.textContent || tempDiv.innerText || '';
      });
      items.push({
        type: 'list',
        tag: tagName,
        items: listItems,
        start: child.getAttribute('start') || null,
        originalHTML: child.outerHTML
      });
    } else if (tagName === 'blockquote') {
      const says = child.querySelector('.says');
      const allPs = child.querySelectorAll('p');
      const author = Array.from(allPs).find(p => !p.classList.contains('says'));
      
      items.push({
        type: 'blockquote',
        tag: 'blockquote',
        quote: says ? (says.textContent || says.innerText || '').trim() : '',
        author: author ? (author.textContent || author.innerText || '').trim() : '',
        originalHTML: child.outerHTML
      });
    }
  });
  
  return items;
}

// Generate HTML from structured content
function generateStructuredHTML(pages) {
  let html = '';
  
  pages.forEach((page, pageIndex) => {
    html += `<div class="project-page">
  <div id="german" class="language active">
${generatePageHTML(page.german)}
  </div>

  <div id="english" class="language">
${generatePageHTML(page.english)}
  </div>
</div>
`;
  });
  
  return html.trim();
}

// Generate HTML for one page
function generatePageHTML(items) {
  let html = '';
  
  items.forEach(item => {
    if (item.type === 'heading') {
      html += `    <h3>${escapeHtml(item.text)}</h3>\n`;
    } else if (item.type === 'paragraph') {
      if (item.strongText) {
        html += `    <p><strong>${escapeHtml(item.strongText)}</strong><br>\n    ${escapeHtml(item.text)}</p>\n`;
      } else {
        html += `    <p>${escapeHtml(item.text)}</p>\n`;
      }
    } else if (item.type === 'list') {
      const startAttr = item.start ? ` start="${item.start}"` : '';
      html += `    <${item.tag}${startAttr}>\n`;
      item.items.forEach(listItem => {
        html += `      <li>${escapeHtml(listItem)}</li>\n`;
      });
      html += `    </${item.tag}>\n`;
    } else if (item.type === 'blockquote') {
      html += `    <blockquote>\n`;
      if (item.quote) {
        html += `      <p class="says">${escapeHtml(item.quote)}</p>\n`;
      }
      if (item.author) {
        html += `      <p>${escapeHtml(item.author)}</p>\n`;
      }
      html += `    </blockquote>\n`;
    }
  });
  
  return html.trim();
}

// Render structured editor
function renderStructuredEditor(section, content) {
  let pages = [];
  
  if (typeof content === 'string') {
    pages = extractStructuredContent(content);
  } else if (Array.isArray(content)) {
    pages = content;
  }
  
  // Store in AppState
  AppState.structuredContent = pages;
  AppState.currentSection = section;
  
  const sectionNames = {
    profil: 'Profil',
    cv: 'Vita / CV',
    leistungen: 'Leistungen',
    bauenimbestand: 'Schwerpunkte',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz'
  };
  
  let pagesHTML = '';
  
  pages.forEach((page, pageIndex) => {
    pagesHTML += `
      <div class="structured-page" data-page-index="${pageIndex}">
        <h3>Seite ${pageIndex + 1}</h3>
        <div class="structured-items">
          ${renderStructuredItems(page.german, pageIndex, 'de')}
          ${renderStructuredItems(page.english, pageIndex, 'en')}
        </div>
      </div>
    `;
  });
  
  return `
    <h2>${sectionNames[section] || section}</h2>
    <div class="structured-editor">
      ${pagesHTML}
      <button class="btn btn-success" onclick="saveStructuredSection('${section}')">Speichern</button>
    </div>
  `;
}

// Render structured items
function renderStructuredItems(items, pageIndex, lang) {
  let html = `<div class="language-items ${lang}">
    <h4>${lang === 'de' ? 'Deutsch' : 'English'}</h4>
  `;
  
  items.forEach((item, itemIndex) => {
    const itemId = `item-${pageIndex}-${lang}-${itemIndex}`;
    
    if (item.type === 'heading') {
      html += `
        <div class="structured-item heading-item">
          <label>Überschrift:</label>
          <input type="text" id="${itemId}" value="${escapeHtml(item.text)}" class="structured-input">
        </div>
      `;
    } else if (item.type === 'paragraph') {
      html += `
        <div class="structured-item paragraph-item">
          <label>Fettgedruckter Text:</label>
          <input type="text" id="${itemId}-strong" value="${escapeHtml(item.strongText)}" class="structured-input">
          <label>Text:</label>
          <textarea id="${itemId}-text" rows="3" class="structured-input">${escapeHtml(item.text)}</textarea>
        </div>
      `;
    } else if (item.type === 'list') {
      html += `
        <div class="structured-item list-item">
          <label>Liste (${item.tag === 'ol' ? 'nummeriert' : 'Aufzählung'}):</label>
          <div class="list-items">
      `;
      item.items.forEach((listItem, listIndex) => {
        html += `
          <div class="list-item-row">
            <input type="text" id="${itemId}-${listIndex}" value="${escapeHtml(listItem)}" class="structured-input">
          </div>
        `;
      });
      html += `
          </div>
          <button type="button" class="btn btn-small btn-secondary" onclick="addListItem('${itemId}')">+ Eintrag hinzufügen</button>
        </div>
      `;
    } else if (item.type === 'blockquote') {
      html += `
        <div class="structured-item blockquote-item">
          <label>Zitat:</label>
          <textarea id="${itemId}-quote" rows="2" class="structured-input">${escapeHtml(item.quote)}</textarea>
          <label>Autor:</label>
          <input type="text" id="${itemId}-author" value="${escapeHtml(item.author)}" class="structured-input">
        </div>
      `;
    }
    
    // Store item metadata
    html += `<input type="hidden" id="${itemId}-type" value="${item.type}">`;
    html += `<input type="hidden" id="${itemId}-tag" value="${item.tag}">`;
  });
  
  html += `</div>`;
  return html;
}

// Initialize structured editor
function initStructuredEditor(section) {
  window.saveStructuredSection = async function(sectionName) {
    if (!AppState.githubToken) {
      showError('GitHub Token nicht konfiguriert!');
      return;
    }
    
    showLoading(true);
    
    try {
      const pages = AppState.structuredContent || [];
      
      // Update pages from form
      pages.forEach((page, pageIndex) => {
        // Update German items
        page.german.forEach((item, itemIndex) => {
          const itemId = `item-${pageIndex}-de-${itemIndex}`;
          if (item.type === 'heading') {
            item.text = document.getElementById(itemId).value;
          } else if (item.type === 'paragraph') {
            item.strongText = document.getElementById(`${itemId}-strong`).value;
            item.text = document.getElementById(`${itemId}-text`).value;
          } else if (item.type === 'list') {
            item.items = [];
            let listIndex = 0;
            while (true) {
              const input = document.getElementById(`${itemId}-${listIndex}`);
              if (!input) break;
              item.items.push(input.value);
              listIndex++;
            }
          } else if (item.type === 'blockquote') {
            item.quote = document.getElementById(`${itemId}-quote`).value;
            item.author = document.getElementById(`${itemId}-author`).value;
          }
        });
        
        // Update English items
        page.english.forEach((item, itemIndex) => {
          const itemId = `item-${pageIndex}-en-${itemIndex}`;
          if (item.type === 'heading') {
            item.text = document.getElementById(itemId).value;
          } else if (item.type === 'paragraph') {
            item.strongText = document.getElementById(`${itemId}-strong`).value;
            item.text = document.getElementById(`${itemId}-text`).value;
          } else if (item.type === 'list') {
            item.items = [];
            let listIndex = 0;
            while (true) {
              const input = document.getElementById(`${itemId}-${listIndex}`);
              if (!input) break;
              item.items.push(input.value);
              listIndex++;
            }
          } else if (item.type === 'blockquote') {
            item.quote = document.getElementById(`${itemId}-quote`).value;
            item.author = document.getElementById(`${itemId}-author`).value;
          }
        });
      });
      
      // Generate HTML
      const html = generateStructuredHTML(pages);
      
      // Save to GitHub
      const filePath = ADMIN_CONFIG.contentFiles[sectionName];
      await commitToGitHub(filePath, html, `Update ${sectionName} content`);
      
      showStatus('Erfolgreich gespeichert!', 'success');
      
    } catch (error) {
      showError('Fehler beim Speichern: ' + error.message);
    } finally {
      showLoading(false);
    }
  };
  
  window.addListItem = function(itemId) {
    // Find the list container
    const listContainer = document.querySelector(`[id^="${itemId}-"]`).closest('.list-items');
    if (listContainer) {
      const listIndex = listContainer.children.length;
      const newInput = document.createElement('div');
      newInput.className = 'list-item-row';
      newInput.innerHTML = `<input type="text" id="${itemId}-${listIndex}" value="" class="structured-input">`;
      listContainer.appendChild(newInput);
    }
  };
}

// Extract language content from HTML (legacy function for backward compatibility)
function extractLanguageContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Try to find #german and #english directly (works for impressum, cv, datenschutz)
  let germanDiv = doc.querySelector('#german');
  let englishDiv = doc.querySelector('#english');
  
  // If not found, try within .project-page
  if (!germanDiv || !englishDiv) {
    const projectPage = doc.querySelector('.project-page');
    if (projectPage) {
      germanDiv = projectPage.querySelector('#german');
      englishDiv = projectPage.querySelector('#english');
    }
  }
  
  // If still not found, search in body
  if (!germanDiv || !englishDiv) {
    germanDiv = doc.body.querySelector('#german');
    englishDiv = doc.body.querySelector('#english');
  }
  
  let germanContent = '';
  let englishContent = '';
  
  if (germanDiv) {
    germanContent = germanDiv.innerHTML.trim();
  }
  
  if (englishDiv) {
    englishContent = englishDiv.innerHTML.trim();
  }
  
  return {
    german: germanContent,
    english: englishContent
  };
}


// Render editor for section
function renderEditor(section, content) {
  const container = document.getElementById('editor-sections');
  if (!container) {
    console.error('Editor container not found!');
    return;
  }
  
  // Ensure container is visible
  container.style.display = 'block';
  
  // Hide ALL existing sections FIRST - be very aggressive
  const allSections = container.querySelectorAll('.editor-section');
  allSections.forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  
  // Also hide by ID just to be sure
  const allSectionIds = ['profil', 'cv', 'leistungen', 'bauenimbestand', 'projekte', 'kontakt', 'impressum', 'datenschutz', 'meta', 'password'];
  allSectionIds.forEach(secId => {
    const sec = document.getElementById(`section-${secId}`);
    if (sec) {
      sec.style.display = 'none';
      sec.classList.remove('active');
    }
  });
  
  // Find or create section div
  let sectionDiv = container.querySelector(`#section-${section}`);
  if (!sectionDiv) {
    sectionDiv = document.createElement('div');
    sectionDiv.className = 'editor-section active';
    sectionDiv.id = `section-${section}`;
    container.appendChild(sectionDiv);
  }
  
  // Clear and show this section
  sectionDiv.innerHTML = '';
  sectionDiv.style.display = 'block';
  sectionDiv.classList.add('active');
  
  if (section === 'kontakt' || section === 'meta') {
    sectionDiv.innerHTML = renderSpecialEditor(section, content);
  } else if (section === 'projekte') {
    sectionDiv.innerHTML = renderProjectsEditor(content);
  } else {
    // All other sections use normal dual-language editor (Markdown/HTML)
    sectionDiv.innerHTML = renderDualLanguageEditor(section, content);
  }
  
  // Initialize editors after a short delay to ensure DOM is ready
  setTimeout(() => {
    if (section === 'projekte') {
      // If AppState.projects is empty, try to extract from DOM
      if (!AppState.projects || AppState.projects.length === 0) {
        const projectItems = document.querySelectorAll('.project-item');
        if (projectItems.length > 0) {
          // Extract from DOM as fallback - read from rendered project items
          const projects = [];
          projectItems.forEach((item, index) => {
            const yearEl = item.querySelector('.project-year');
            const nameEl = item.querySelector('.project-name');
            if (yearEl && nameEl) {
              projects.push({
                year: yearEl.textContent.trim(),
                nameDE: nameEl.textContent.trim(),
                nameEN: '',
                locationDE: '',
                locationEN: '',
                descriptionDE: '',
                descriptionEN: ''
              });
            }
          });
          if (projects.length > 0) {
            AppState.projects = projects;
            // Re-render with the extracted projects to ensure consistency
            const container = document.getElementById('editor-sections');
            const sectionDiv = container.querySelector('#section-projekte');
            if (sectionDiv) {
              sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
              // Re-initialize after re-render
              setTimeout(() => initProjectsEditor(), 50);
              return;
            }
          } else {
            // Try to extract from cached content
            const cachedContent = AppState.contentCache && AppState.contentCache.projekte;
            if (cachedContent && typeof cachedContent === 'string') {
              const extractedProjects = extractProjectsFromHTML(cachedContent);
              if (extractedProjects && extractedProjects.length > 0) {
                AppState.projects = extractedProjects;
                // Re-render with the extracted projects
                const container = document.getElementById('editor-sections');
                const sectionDiv = container.querySelector('#section-projekte');
                if (sectionDiv) {
                  sectionDiv.innerHTML = renderProjectsEditor(AppState.projects);
                  // Re-initialize after re-render
                  setTimeout(() => initProjectsEditor(), 50);
                  return;
                }
              }
            }
          }
        }
      }
      initProjectsEditor();
    } else if (section === 'kontakt' || section === 'meta') {
      initCharacterCounters();
    } else {
      // All other sections use normal editors
      initEditors(section);
    }
  }, 50);
}

// Render dual language editor (DE/EN side by side)
function renderDualLanguageEditor(section, content) {
  let germanContent = '';
  let englishContent = '';
  
  if (typeof content === 'string') {
    const extracted = extractLanguageContent(content);
    germanContent = extracted.german;
    englishContent = extracted.english;
  } else {
    germanContent = content.german || '';
    englishContent = content.english || '';
  }
  
  const sectionNames = {
    profil: 'Profil',
    cv: 'Vita / CV',
    leistungen: 'Leistungen',
    bauenimbestand: 'Schwerpunkte',
    projekte: 'Projekte',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz'
  };
  
  return `
    <h2>${sectionNames[section] || section}</h2>
    <div class="editor-dual">
      <div class="editor-panel">
        <div class="editor-header">
          <h3><span class="lang-badge de">DE</span> Deutsch</h3>
          <div class="editor-header-actions">
            <div class="editor-mode-switch">
              <button type="button" class="mode-btn active" data-mode="visual" data-editor="${section}-de" onclick="switchEditorMode('${section}-de', 'visual')">Editor</button>
              <button type="button" class="mode-btn" data-mode="markdown" data-editor="${section}-de" onclick="switchEditorMode('${section}-de', 'markdown')">Markdown</button>
            </div>
          </div>
        </div>
        <div class="editor-toolbar" id="toolbar-${section}-de">
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'bold')" title="Fett (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'italic')" title="Kursiv (Ctrl+I)"><em>I</em></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'underline')" title="Unterstrichen (Ctrl+U)"><u>U</u></button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h1')" title="Überschrift H1">H1</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h2')" title="Überschrift H2">H2</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'h3')" title="Überschrift H3">H3</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'p')" title="Normaler Text (Absatz)">Normal</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'insertUnorderedList')" title="Aufzählungsliste">• Liste</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'insertOrderedList')" title="Nummerierte Liste">1. Liste</button>
          <button type="button" class="toolbar-btn" onclick="insertTable('${section}-de')" title="Tabelle einfügen">📊</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="insertBlockquote('${section}-de')" title="Zitat einfügen">💬 Zitat</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-de', 'createLink')" title="Link einfügen">🔗 Link</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="removeAllFormatting('${section}-de')" title="Alle Formatierung entfernen">🗑️ Alle</button>
        </div>
        <div id="editor-visual-${section}-de" class="editor-visual" contenteditable="true" data-lang="de" data-section="${section}" style="display: none;">${germanContent}</div>
        <textarea id="editor-${section}-de" class="content-editor" data-lang="de" data-section="${section}">${germanContent}</textarea>
        <div id="preview-${section}-de" class="preview-panel"></div>
        <div id="validation-${section}-de" class="validation-warning" style="display: none;"></div>
      </div>
      <div class="editor-panel">
        <div class="editor-header">
          <h3><span class="lang-badge en">EN</span> English</h3>
          <div class="editor-header-actions">
            <button type="button" class="btn-translate" onclick="translateFromGerman('${section}')" title="Aus Deutsch übersetzen">
              <span>🌐</span> Aus DE übersetzen
            </button>
            <div class="editor-mode-switch">
              <button type="button" class="mode-btn active" data-mode="visual" data-editor="${section}-en" onclick="switchEditorMode('${section}-en', 'visual')">Editor</button>
              <button type="button" class="mode-btn" data-mode="markdown" data-editor="${section}-en" onclick="switchEditorMode('${section}-en', 'markdown')">Markdown</button>
            </div>
          </div>
        </div>
        <div class="editor-toolbar" id="toolbar-${section}-en">
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'bold')" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'italic')" title="Italic (Ctrl+I)"><em>I</em></button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'underline')" title="Underline (Ctrl+U)"><u>U</u></button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h1')" title="Heading H1">H1</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h2')" title="Heading H2">H2</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'h3')" title="Heading H3">H3</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'p')" title="Normal Text (Paragraph)">Normal</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'insertUnorderedList')" title="Bullet List">• List</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'insertOrderedList')" title="Numbered List">1. List</button>
          <button type="button" class="toolbar-btn" onclick="insertTable('${section}-en')" title="Insert Table">📊</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="insertBlockquote('${section}-en')" title="Insert Quote">💬 Quote</button>
          <button type="button" class="toolbar-btn" onclick="formatText('${section}-en', 'createLink')" title="Insert Link">🔗 Link</button>
          <span class="toolbar-separator"></span>
          <button type="button" class="toolbar-btn" onclick="removeAllFormatting('${section}-en')" title="Remove All Formatting">🗑️ All</button>
        </div>
        <div id="editor-visual-${section}-en" class="editor-visual" contenteditable="true" data-lang="en" data-section="${section}" style="display: none;">${englishContent}</div>
        <textarea id="editor-${section}-en" class="content-editor" data-lang="en" data-section="${section}">${englishContent}</textarea>
        <div id="preview-${section}-en" class="preview-panel"></div>
        <div id="validation-${section}-en" class="validation-warning" style="display: none;"></div>
      </div>
    </div>
    <button class="btn btn-success" onclick="saveSection('${section}')">Speichern</button>
  `;
}

// Render special editors (Kontakt, Meta)
function renderSpecialEditor(section, content) {
  if (section === 'kontakt') {
    const contactData = content || {
      textDE: '',
      textEN: '',
      email: '',
      phone: '',
      addressDE: '',
      addressEN: ''
    };
    
    return `
      <h2>Kontakt</h2>
      <div class="contact-editor">
        <div class="form-group">
          <label>Text (DE):</label>
          <textarea id="contact-text-de" rows="3" placeholder="Kontaktanfragen sind willkommen – offizieller Geschäftsstart ab Herbst 2025.">${escapeHtml(contactData.textDE || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Text (EN):</label>
          <textarea id="contact-text-en" rows="3" placeholder="Inquiries are welcome – official business launch in autumn 2025.">${escapeHtml(contactData.textEN || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="contact-email" value="${escapeHtml(contactData.email || '')}" placeholder="hello@schels.info">
        </div>
        <div class="form-group">
          <label>Telefon:</label>
          <input type="tel" id="contact-phone" value="${escapeHtml(contactData.phone || '')}" placeholder="+4984429292291">
        </div>
        <div class="form-group">
          <label>Adresse (DE):</label>
          <input type="text" id="contact-address-de" value="${escapeHtml(contactData.addressDE || '')}" placeholder="Schlachterstrasse 9, 85283 Wolnzach">
        </div>
        <div class="form-group">
          <label>Adresse (EN):</label>
          <input type="text" id="contact-address-en" value="${escapeHtml(contactData.addressEN || '')}" placeholder="Schlachterstrasse 9, 85283 Wolnzach">
        </div>
        <button class="btn btn-success" onclick="saveSection('kontakt')">Speichern</button>
      </div>
    `;
  } else if (section === 'meta') {
    return `
      <h2>Meta-Tags & SEO</h2>
      <div class="editor-panel">
        <div class="form-group">
          <label>Title:</label>
          <input type="text" id="meta-title" value="${escapeHtml(content.title || '')}">
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea id="meta-description" rows="3" maxlength="160">${escapeHtml(content.description || '')}</textarea>
          <div class="char-counter" id="meta-description-counter">0 / 160 Zeichen</div>
        </div>
        <div class="form-group">
          <label>Keywords:</label>
          <input type="text" id="meta-keywords" value="${escapeHtml(content.keywords || '')}">
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="meta-email" value="${escapeHtml(content.email || '')}">
        </div>
        <div class="form-group">
          <label>Phone:</label>
          <input type="text" id="meta-phone" value="${escapeHtml(content.phone || '')}">
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input type="text" id="meta-address" value="${escapeHtml(content.address || '')}">
        </div>
        <button class="btn btn-success" onclick="saveSection('meta')">Speichern</button>
      </div>
    `;
  }
}

// Initialize editors with preview
function initEditors(section) {
  const textEditors = document.querySelectorAll(`#section-${section} .content-editor`);
  const visualEditors = document.querySelectorAll(`#section-${section} .editor-visual`);
  
  // Initialize text editors (Markdown mode)
  textEditors.forEach(editor => {
    editor.addEventListener('input', function() {
      updatePreview(this);
      validateContent(this);
      AppState.hasChanges = true;
      updateSaveIndicator();
      // Sync to visual editor if active
      syncToVisualEditor(editor);
    });
    
    updatePreview(editor);
    validateContent(editor);
  });
  
  // Initialize visual editors
  visualEditors.forEach(editor => {
    // Save state for undo on input
    let saveTimeout;
    editor.addEventListener('input', function() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveStateForUndo(this);
      }, 500);
      
      syncToTextEditor(this);
      AppState.hasChanges = true;
      updateSaveIndicator();
    });
    
    editor.addEventListener('blur', function() {
      syncToTextEditor(this);
      saveStateForUndo(this);
    });
    
    // Handle paste events - strip formatting and paste as plain text
    editor.addEventListener('paste', function(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      
      // Get selection
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Insert as plain text
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Insert at end
        const textNode = document.createTextNode(text);
        editor.appendChild(textNode);
      }
      
      syncToTextEditor(editor);
      AppState.hasChanges = true;
      updateSaveIndicator();
    });
    
    // Prevent unwanted formatting from browser
    editor.addEventListener('keydown', function(e) {
      // Prevent Ctrl+B, Ctrl+I, Ctrl+U from browser default (we handle it)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
        // Already handled by keyboard shortcuts
      }
    });
    
    // Initial state
    saveStateForUndo(editor);
  });
  
  // Set initial mode to visual
  textEditors.forEach(editor => {
    const editorId = editor.id;
    const parts = editorId.split('-');
    const lang = parts[parts.length - 1];
    switchEditorMode(`${section}-${lang}`, 'visual');
  });
  
  // Initialize character counters
  initCharacterCounters();
}

// Switch between visual and markdown mode
window.switchEditorMode = function(editorId, mode) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  const toolbar = document.getElementById(`toolbar-${editorId}`);
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  
  const preview = document.getElementById(`preview-${editorId}`);
  
  if (mode === 'visual') {
    // Show visual editor, hide text editor and preview
    if (visualEditor && textEditor) {
      // Sync content from text to visual
      syncToVisualEditor(textEditor);
      visualEditor.style.display = 'block';
      textEditor.style.display = 'none';
      if (toolbar) toolbar.style.display = 'flex';
      if (preview) preview.style.display = 'none';
      
      // Update mode buttons
      modeButtons.forEach(btn => {
        if (btn.dataset.mode === 'visual') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  } else {
    // Show text editor and preview, hide visual editor
    if (visualEditor && textEditor) {
      // Sync content from visual to text
      syncToTextEditor(visualEditor);
      visualEditor.style.display = 'none';
      textEditor.style.display = 'block';
      if (toolbar) toolbar.style.display = 'none';
      if (preview) preview.style.display = 'block';
      
      // Update preview
      updatePreview(textEditor);
      
      // Update mode buttons
      modeButtons.forEach(btn => {
        if (btn.dataset.mode === 'markdown') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }
};

// Format text in visual editor
window.formatText = function(editorId, command, value = null) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    // Switch to visual mode first
    switchEditorMode(editorId, 'visual');
    setTimeout(() => formatText(editorId, command, value), 100);
    return;
  }
  
  visualEditor.focus();
  
  try {
    // Handle block format toggles (h1, h2, h3, p)
    if (command === 'h1' || command === 'h2' || command === 'h3' || command === 'p') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let blockElement = range.commonAncestorContainer;
        
        // Find the block element (h1-h6, p, div, etc.)
        while (blockElement && blockElement.nodeType !== 1) {
          blockElement = blockElement.parentNode;
        }
        while (blockElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'].includes(blockElement.tagName)) {
          blockElement = blockElement.parentNode;
        }
        
        // Check if current block already has the target format
        const targetTag = command.toUpperCase();
        if (blockElement && blockElement.tagName === targetTag) {
          // Toggle off: convert to paragraph
          document.execCommand('formatBlock', false, '<p>');
        } else {
          // Toggle on: apply format
          document.execCommand('formatBlock', false, `<${command}>`);
        }
      } else {
        // No selection, just apply format
        document.execCommand('formatBlock', false, `<${command}>`);
      }
    } else if (command === 'bold' || command === 'italic' || command === 'underline') {
      // Toggle inline formats
      document.execCommand(command, false, value);
    } else if (command === 'createLink') {
      const url = prompt('URL eingeben:', 'https://');
      if (url && url.trim()) {
        // Basic URL validation
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
          document.execCommand('createLink', false, url.trim());
        } else {
          showError('Ungültige URL! Muss mit http://, https://, mailto: oder tel: beginnen.');
        }
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    // Sync to text editor
    syncToTextEditor(visualEditor);
    
    // Mark as changed
    AppState.hasChanges = true;
    updateSaveIndicator();
  } catch (e) {
    showError('Formatierungsfehler: ' + e.message);
  }
};

// Remove all formatting from selected text or entire editor
window.removeAllFormatting = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    switchEditorMode(editorId, 'visual');
    setTimeout(() => removeAllFormatting(editorId), 100);
    return;
  }
  
  visualEditor.focus();
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    // Remove formatting from selection
    const range = selection.getRangeAt(0);
    const contents = range.extractContents();
    
    // Get plain text
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(contents);
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Insert plain text
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);
    
    // Select the inserted text
    range.setStartBefore(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Remove all formatting from entire editor - convert to paragraphs
    // Use innerText to preserve encoding
    const plainText = visualEditor.innerText || visualEditor.textContent || '';
    visualEditor.innerHTML = '';
    const lines = plainText.split('\n');
    lines.forEach((line, index) => {
      if (line.trim()) {
        const p = document.createElement('p');
        p.textContent = line; // textContent preserves encoding
        visualEditor.appendChild(p);
      } else if (index < lines.length - 1) {
        // Preserve line breaks
        visualEditor.appendChild(document.createElement('br'));
      }
    });
  }
  
  // Sync to text editor
  syncToTextEditor(visualEditor);
  
  AppState.hasChanges = true;
  updateSaveIndicator();
};

// Insert blockquote with proper structure
window.insertBlockquote = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    // Switch to visual mode first
    switchEditorMode(editorId, 'visual');
    setTimeout(() => insertBlockquote(editorId), 100);
    return;
  }
  
  visualEditor.focus();
  
  // Get selected text or use placeholder
  const selection = window.getSelection();
  let selectedText = '';
  if (selection.rangeCount > 0) {
    selectedText = selection.toString();
  }
  
  // Create blockquote structure
  const blockquoteHTML = `
<blockquote>
  <p class="says">${selectedText || 'Zitat hier eingeben'}</p>
  <p>Autor</p>
</blockquote>`;
  
  // Insert blockquote
  if (selection.rangeCount > 0 && !selectedText) {
    // Insert at cursor position
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blockquoteHTML;
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    range.insertNode(fragment);
  } else {
    // Replace selection or insert
    if (selectedText) {
      document.execCommand('insertHTML', false, blockquoteHTML);
    } else {
      // Insert at end
      const range = document.createRange();
      range.selectNodeContents(visualEditor);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertHTML', false, blockquoteHTML);
    }
  }
  
  // Sync to text editor
  syncToTextEditor(visualEditor);
  
  AppState.hasChanges = true;
  updateSaveIndicator();
};

// Sync visual editor content to text editor
function syncToTextEditor(visualEditor) {
  if (!visualEditor) return;
  
  const editorId = visualEditor.id.replace('editor-visual-', '');
  const textEditor = document.getElementById(`editor-${editorId}`);
  if (textEditor) {
    // Get HTML directly - don't modify encoding
    const html = visualEditor.innerHTML;
    
    // Only remove truly empty tags (no content at all)
    let cleanHTML = html.replace(/<p>\s*<\/p>/g, '');
    cleanHTML = cleanHTML.replace(/<h[1-6]>\s*<\/h[1-6]>/g, '');
    
    textEditor.value = cleanHTML;
    updatePreview(textEditor);
    validateContent(textEditor);
  }
}

// Sync text editor content to visual editor
function syncToVisualEditor(textEditor) {
  if (!textEditor) return;
  
  const editorId = textEditor.id.replace('editor-', '');
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (visualEditor && visualEditor.style.display !== 'none') {
    // Clean HTML before setting
    let cleanHTML = textEditor.value;
    // Ensure proper structure - wrap loose text in paragraphs
    if (cleanHTML && !cleanHTML.match(/^<[h1-6p]/)) {
      // If content doesn't start with a block element, wrap it
      cleanHTML = '<p>' + cleanHTML + '</p>';
    }
    visualEditor.innerHTML = cleanHTML;
  }
}

// Update preview
function updatePreview(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const previewId = `preview-${section}-${lang}`;
  const preview = document.getElementById(previewId);
  
  if (preview) {
    // Handle both textarea (value) and contenteditable div (innerHTML)
    const content = editor.value || editor.innerHTML || '';
    preview.innerHTML = content;
  }
}

// Validate content
function validateContent(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const validationId = `validation-${section}-${lang}`;
  const validation = document.getElementById(validationId);
  
  if (!validation) return;
  
  const content = editor.value.trim();
  let warnings = [];
  
  if (!content) {
    warnings.push('Inhalt ist leer!');
  }
  
  // Check for missing translations
  const otherLang = lang === 'de' ? 'en' : 'de';
  const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
  if (otherEditor && !otherEditor.value.trim() && content) {
    warnings.push(`Übersetzung (${otherLang.toUpperCase()}) fehlt!`);
  }
  
  if (warnings.length > 0) {
    validation.textContent = warnings.join(' ');
    validation.style.display = 'block';
  } else {
    validation.style.display = 'none';
  }
}


// Save all changes
document.getElementById('save-all-btn')?.addEventListener('click', async function() {
  await saveAllSections();
});

// Utility functions

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  // Try login error first, then status message
  let errorDiv = document.getElementById('login-error');
  if (!errorDiv) {
    errorDiv = document.getElementById('status-message');
  }
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
  } else {
    // Fallback: alert if error div not found
    alert('Fehler: ' + message);
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status-message');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Password change functionality
function renderPasswordEditor() {
  const container = document.getElementById('editor-sections');
  container.innerHTML = '';
  
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'editor-section active';
  sectionDiv.id = 'section-password';
  sectionDiv.innerHTML = `
    <h2>Passwort ändern</h2>
    <div class="editor-panel">
      <div class="form-group">
        <label for="current-password">Aktuelles Passwort:</label>
        <input type="password" id="current-password" required>
      </div>
      <div class="form-group">
        <label for="new-password">Neues Passwort:</label>
        <input type="password" id="new-password" required>
      </div>
      <div class="form-group">
        <label for="confirm-password">Passwort bestätigen:</label>
        <input type="password" id="confirm-password" required>
      </div>
      <div id="password-status" class="status-message" style="display: none;"></div>
      <button class="btn btn-success" onclick="changePassword()">Passwort ändern</button>
      <div id="password-hash-display" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 5px; display: none;">
        <p><strong>Neuer Password-Hash (für admin-config.js):</strong></p>
        <code id="new-password-hash" style="word-break: break-all;"></code>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Kopieren Sie diesen Hash und fügen Sie ihn in admin-config.js ein.</p>
      </div>
    </div>
  `;
  
  container.appendChild(sectionDiv);
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const statusDiv = document.getElementById('password-status');
  const hashDisplay = document.getElementById('password-hash-display');
  const hashCode = document.getElementById('new-password-hash');
  
  // Reset
  statusDiv.style.display = 'none';
  hashDisplay.style.display = 'none';
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    statusDiv.textContent = 'Bitte alle Felder ausfüllen!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Verify current password
  const currentHash = await sha256(currentPassword);
  if (currentHash !== ADMIN_CONFIG.passwordHash) {
    statusDiv.textContent = 'Aktuelles Passwort ist falsch!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Check if new passwords match
  if (newPassword !== confirmPassword) {
    statusDiv.textContent = 'Neue Passwörter stimmen nicht überein!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Check password strength
  if (newPassword.length < 6) {
    statusDiv.textContent = 'Passwort muss mindestens 6 Zeichen lang sein!';
    statusDiv.className = 'status-message error';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Generate new hash
  const newHash = await sha256(newPassword);
  
  // Show success and hash
  statusDiv.textContent = 'Passwort erfolgreich geändert! Bitte Hash in admin-config.js eintragen.';
  statusDiv.className = 'status-message success';
  statusDiv.style.display = 'block';
  
  hashCode.textContent = newHash;
  hashDisplay.style.display = 'block';
  
  // Update localStorage
  localStorage.setItem('admin_password_hash', newHash);
  
  // Clear form
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

// ========== Auto-Save Warning ==========
// ========== Undo/Redo ==========
function saveStateForUndo(editor) {
  const editorId = editor.id;
  if (!AppState.undoStack[editorId]) {
    AppState.undoStack[editorId] = [];
  }
  if (!AppState.redoStack[editorId]) {
    AppState.redoStack[editorId] = [];
  }
  
  const currentState = editor.innerHTML;
  const lastState = AppState.undoStack[editorId][AppState.undoStack[editorId].length - 1];
  
  // Only save if different from last state
  if (currentState !== lastState) {
    AppState.undoStack[editorId].push(currentState);
    // Limit undo stack to 50 items
    if (AppState.undoStack[editorId].length > 50) {
      AppState.undoStack[editorId].shift();
    }
    // Clear redo stack when new edit is made
    AppState.redoStack[editorId] = [];
  }
}

function undoEdit(editor) {
  const editorId = editor.id;
  if (!AppState.undoStack[editorId] || AppState.undoStack[editorId].length === 0) {
    return;
  }
  
  // Save current state to redo stack
  if (!AppState.redoStack[editorId]) {
    AppState.redoStack[editorId] = [];
  }
  AppState.redoStack[editorId].push(editor.innerHTML);
  
  // Restore previous state
  const previousState = AppState.undoStack[editorId].pop();
  editor.innerHTML = previousState;
  
  // Sync to text editor
  syncToTextEditor(editor);
}

function redoEdit(editor) {
  const editorId = editor.id;
  if (!AppState.redoStack[editorId] || AppState.redoStack[editorId].length === 0) {
    return;
  }
  
  // Save current state to undo stack
  if (!AppState.undoStack[editorId]) {
    AppState.undoStack[editorId] = [];
  }
  AppState.undoStack[editorId].push(editor.innerHTML);
  
  // Restore next state
  const nextState = AppState.redoStack[editorId].pop();
  editor.innerHTML = nextState;
  
  // Sync to text editor
  syncToTextEditor(editor);
}

// ========== Backup before changes ==========
async function createBackup(section) {
  try {
    const filePath = ADMIN_CONFIG.contentFiles[section];
    if (filePath) {
      const content = await fetchGitHubFile(filePath);
      if (!AppState.backups[section]) {
        AppState.backups[section] = {
          history: []
        };
      }
      AppState.backups[section].content = content;
      AppState.backups[section].timestamp = new Date().toISOString();
      AppState.backups[section].filePath = filePath;
      
      // Keep only last 5 backups per section
      AppState.backups[section].history.push({
        content: content,
        timestamp: new Date().toISOString()
      });
      if (AppState.backups[section].history.length > 5) {
        AppState.backups[section].history.shift();
      }
    }
  } catch (error) {
    // Silent fail for backup - don't block save operation
    // Backup is optional
  }
}

// ========== Character Counter ==========
function initCharacterCounters() {
  // Add character counter to meta description
  const metaDesc = document.getElementById('meta-description');
  if (metaDesc) {
    let counter = document.getElementById('meta-description-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'char-counter';
      counter.id = 'meta-description-counter';
      metaDesc.parentNode.insertBefore(counter, metaDesc.nextSibling);
    }
    updateCharacterCounter(metaDesc, counter, 160);
    
    metaDesc.addEventListener('input', function() {
      updateCharacterCounter(metaDesc, counter, 160);
    });
  }
  
  // Add character counter to contact text fields
  const contactTexts = ['contact-text-de', 'contact-text-en'];
  contactTexts.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      let counter = document.getElementById(`${id}-counter`);
      if (!counter) {
        counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.id = `${id}-counter`;
        field.parentNode.insertBefore(counter, field.nextSibling);
      }
      updateCharacterCounter(field, counter, 500);
      
      field.addEventListener('input', function() {
        updateCharacterCounter(field, counter, 500);
      });
    }
  });
}

function updateCharacterCounter(field, counter, maxLength) {
  const length = field.value.length;
  counter.textContent = `${length} / ${maxLength} Zeichen`;
  counter.className = 'char-counter';
  if (length > maxLength) {
    counter.classList.add('warning');
  } else if (length > maxLength * 0.9) {
    counter.classList.add('caution');
  }
}

// ========== Dark Mode ==========
function initDarkMode() {
  if (AppState.darkMode) {
    document.body.classList.add('dark-mode');
  }
  
  // Create dark mode toggle button when editor is shown
  setTimeout(() => {
    const header = document.querySelector('.admin-header');
    if (header && !document.getElementById('dark-mode-toggle')) {
      const headerActions = header.querySelector('.header-actions');
      if (headerActions) {
        const toggle = document.createElement('button');
        toggle.id = 'dark-mode-toggle';
        toggle.className = 'btn btn-secondary';
        toggle.innerHTML = AppState.darkMode ? '☀️' : '🌙';
        toggle.title = AppState.darkMode ? 'Hell' : 'Dunkel';
        toggle.addEventListener('click', toggleDarkMode);
        headerActions.insertBefore(toggle, headerActions.firstChild);
      }
    }
  }, 100);
}

function toggleDarkMode() {
  AppState.darkMode = !AppState.darkMode;
  document.body.classList.toggle('dark-mode', AppState.darkMode);
  localStorage.setItem('admin_dark_mode', AppState.darkMode.toString());
  
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) {
    toggle.innerHTML = AppState.darkMode ? '☀️' : '🌙';
    toggle.title = AppState.darkMode ? 'Hell' : 'Dunkel';
  }
}

// ========== Better Validation ==========
function validateContent(editor) {
  const lang = editor.getAttribute('data-lang');
  const section = editor.getAttribute('data-section');
  const validationId = `validation-${section}-${lang}`;
  const validationDiv = document.getElementById(validationId);
  
  if (!validationDiv) return;
  
  const content = editor.value || editor.innerHTML || '';
  const issues = [];
  
  // Check for missing translations
  if (section !== 'meta' && section !== 'kontakt') {
    const otherLang = lang === 'de' ? 'en' : 'de';
    const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
    const otherContent = otherEditor ? (otherEditor.value || '') : '';
    
    if (content.trim() && !otherContent.trim()) {
      issues.push('Fehlende Übersetzung');
    }
  }
  
  // Check for HTML issues
  if (content.includes('<script')) {
    issues.push('⚠️ Script-Tags sind nicht erlaubt');
  }
  
  // Check for unclosed tags (ignore self-closing tags)
  // For CV and other dual-language sections, check both languages together
  let contentToCheck = content;
  if (section === 'cv' || section === 'profil' || section === 'leistungen' || section === 'bauenimbestand') {
    // Get content from both language editors
    const otherLang = lang === 'de' ? 'en' : 'de';
    const otherEditor = document.getElementById(`editor-${section}-${otherLang}`);
    const otherContent = otherEditor ? (otherEditor.value || otherEditor.innerHTML || '') : '';
    // Combine both contents for validation
    contentToCheck = content + '\n' + otherContent;
  }
  
  // Self-closing tags: br, hr, img, input, meta, link, area, base, col, embed, source, track, wbr
  const selfClosingTags = /<(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)[^>]*>/gi;
  const allOpenTags = contentToCheck.match(/<[^/][^>]*>/g) || [];
  const selfClosingCount = (contentToCheck.match(selfClosingTags) || []).length;
  const openTags = allOpenTags.length - selfClosingCount;
  const closeTags = (contentToCheck.match(/<\/[^>]+>/g) || []).length;
  
  // Only warn if difference is significant (more than 3, to account for nested structures)
  if (Math.abs(openTags - closeTags) > 3) {
    issues.push('⚠️ Mögliche ungeschlossene HTML-Tags');
  }
  
  // Display validation
  if (issues.length > 0) {
    validationDiv.textContent = issues.join(' • ');
    validationDiv.style.display = 'block';
    validationDiv.className = 'validation-warning';
  } else {
    validationDiv.style.display = 'none';
  }
}

// ========== Search & Replace ==========
window.showSearchReplace = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'search-replace-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal" onclick="closeSearchReplace()">&times;</span>
      <h3>Suchen & Ersetzen</h3>
      <div class="form-group">
        <label>Suchen:</label>
        <input type="text" id="search-term" placeholder="Text suchen...">
      </div>
      <div class="form-group">
        <label>Ersetzen mit:</label>
        <input type="text" id="replace-term" placeholder="Neuer Text...">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="search-case-sensitive"> Groß-/Kleinschreibung beachten
        </label>
        <label>
          <input type="checkbox" id="search-all-sections"> In allen Bereichen suchen
        </label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="performSearch()">Suchen</button>
        <button class="btn btn-success" onclick="performReplace()">Ersetzen</button>
        <button class="btn btn-secondary" onclick="closeSearchReplace()">Abbrechen</button>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('search-term').focus();
};

window.closeSearchReplace = function() {
  const modal = document.getElementById('search-replace-modal');
  if (modal) {
    modal.remove();
  }
};

window.performSearch = function() {
  const searchTerm = document.getElementById('search-term').value;
  const caseSensitive = document.getElementById('search-case-sensitive').checked;
  const allSections = document.getElementById('search-all-sections').checked;
  const resultsDiv = document.getElementById('search-results');
  
  if (!searchTerm) {
    resultsDiv.innerHTML = '<p class="error">Bitte Suchbegriff eingeben!</p>';
    return;
  }
  
  const results = [];
  const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  
  if (allSections) {
    // Search in all sections
    Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
      const editors = document.querySelectorAll(`#section-${section} .content-editor, #section-${section} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        const matches = content.match(regex);
        if (matches) {
          results.push({
            section: section,
            editor: editor.id,
            count: matches.length
          });
        }
      });
    });
  } else {
    // Search in current section
    const currentSection = AppState.currentSection;
    if (currentSection) {
      const editors = document.querySelectorAll(`#section-${currentSection} .content-editor, #section-${currentSection} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        const matches = content.match(regex);
        if (matches) {
          results.push({
            section: currentSection,
            editor: editor.id,
            count: matches.length
          });
        }
      });
    }
  }
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
  } else {
    resultsDiv.innerHTML = `<p><strong>${results.length} Ergebnis(se) gefunden:</strong></p><ul>${results.map(r => `<li>${r.section} (${r.editor}): ${r.count} Treffer</li>`).join('')}</ul>`;
  }
};

window.performReplace = function() {
  const searchTerm = document.getElementById('search-term').value;
  const replaceTerm = document.getElementById('replace-term').value;
  const caseSensitive = document.getElementById('search-case-sensitive').checked;
  const allSections = document.getElementById('search-all-sections').checked;
  
  if (!searchTerm) {
    showError('Bitte Suchbegriff eingeben!');
    return;
  }
  
  const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
  let replaced = 0;
  
  if (allSections) {
    Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
      const editors = document.querySelectorAll(`#section-${section} .content-editor, #section-${section} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        if (content.match(regex)) {
          const newContent = content.replace(regex, replaceTerm);
          if (editor.classList.contains('content-editor')) {
            editor.value = newContent;
          } else {
            editor.innerHTML = newContent;
          }
          syncToTextEditor(editor);
          replaced++;
        }
      });
    });
  } else {
    const currentSection = AppState.currentSection;
    if (currentSection) {
      const editors = document.querySelectorAll(`#section-${currentSection} .content-editor, #section-${currentSection} .editor-visual`);
      editors.forEach(editor => {
        const content = editor.value || editor.innerHTML || '';
        if (content.match(regex)) {
          const newContent = content.replace(regex, replaceTerm);
          if (editor.classList.contains('content-editor')) {
            editor.value = newContent;
          } else {
            editor.innerHTML = newContent;
          }
          syncToTextEditor(editor);
          replaced++;
        }
      });
    }
  }
  
  showStatus(`${replaced} Ersetzung(en) durchgeführt!`, 'success');
  closeSearchReplace();
};

// ========== Table Editor ==========
window.insertTable = function(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  if (!visualEditor || visualEditor.style.display === 'none') {
    switchEditorMode(editorId, 'visual');
    setTimeout(() => insertTable(editorId), 100);
    return;
  }
  
  const rowsInput = prompt('Anzahl Zeilen (1-20):', '3');
  const colsInput = prompt('Anzahl Spalten (1-10):', '2');
  
  if (!rowsInput || !colsInput) return;
  
  const rows = parseInt(rowsInput);
  const cols = parseInt(colsInput);
  
  // Validate input
  if (isNaN(rows) || isNaN(cols) || rows < 1 || rows > 20 || cols < 1 || cols > 10) {
    showError('Ungültige Eingabe! Zeilen: 1-20, Spalten: 1-10');
    return;
  }
  
  let tableHTML = '<table>\n';
  for (let i = 0; i < rows; i++) {
    tableHTML += '  <tr>\n';
    for (let j = 0; j < cols; j++) {
      tableHTML += '    <td></td>\n';
    }
    tableHTML += '  </tr>\n';
  }
  tableHTML += '</table>';
  
  try {
    visualEditor.focus();
    document.execCommand('insertHTML', false, tableHTML);
    
    syncToTextEditor(visualEditor);
    
    AppState.hasChanges = true;
    updateSaveIndicator();
  } catch (e) {
    showError('Fehler beim Einfügen der Tabelle: ' + e.message);
  }
};

// ========== Image Upload (deactivated - not working) ==========
// Image upload functionality deactivated as requested
window.uploadImage = async function(editorId) {
  showError('Bild-Upload ist derzeit nicht verfügbar.');
  return;
};

// ========== Preview Mode ==========
window.togglePreviewMode = function() {
  const previewMode = localStorage.getItem('admin_preview_mode') === 'true';
  localStorage.setItem('admin_preview_mode', (!previewMode).toString());
  
  const editors = document.querySelectorAll('.editor-panel');
  editors.forEach(panel => {
    if (!previewMode) {
      // Show preview
      const preview = panel.querySelector('.preview-panel');
      if (preview) {
        preview.style.display = 'block';
        const editor = panel.querySelector('.content-editor, .editor-visual');
        if (editor) {
          const content = editor.value || editor.innerHTML || '';
          preview.innerHTML = content;
        }
      }
    } else {
      // Hide preview
      const preview = panel.querySelector('.preview-panel');
      if (preview) {
        preview.style.display = 'none';
      }
    }
  });
};

// ========== Last Changes ==========
async function loadLastChanges() {
  if (!AppState.githubToken) return;
  
  try {
    const config = AppState.githubConfig;
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/commits?per_page=10`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${AppState.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const commits = await response.json();
      return commits.map(c => ({
        message: c.commit.message,
        author: c.commit.author.name,
        date: new Date(c.commit.author.date).toLocaleString('de-DE'),
        sha: c.sha.substring(0, 7)
      }));
    }
  } catch (error) {
    // Silent fail for commit history - not critical
  }
  return [];
}

// ========== Export/Import ==========
window.exportContent = function() {
  const exportData = {
    timestamp: new Date().toISOString(),
    sections: {}
  };
  
  Object.keys(ADMIN_CONFIG.contentFiles).forEach(section => {
    const germanEditor = document.getElementById(`editor-${section}-de`);
    const englishEditor = document.getElementById(`editor-${section}-en`);
    const germanVisual = document.getElementById(`editor-visual-${section}-de`);
    const englishVisual = document.getElementById(`editor-visual-${section}-en`);
    
    exportData.sections[section] = {
      german: germanEditor ? germanEditor.value : (germanVisual ? germanVisual.innerHTML : ''),
      english: englishEditor ? englishEditor.value : (englishVisual ? englishVisual.innerHTML : '')
    };
  });
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `website-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Export erfolgreich!', 'success');
};

window.importContent = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm('Möchten Sie wirklich alle Inhalte importieren? Dies überschreibt aktuelle Inhalte!')) {
          Object.keys(data.sections).forEach(section => {
            const germanEditor = document.getElementById(`editor-${section}-de`);
            const englishEditor = document.getElementById(`editor-${section}-en`);
            const germanVisual = document.getElementById(`editor-visual-${section}-de`);
            const englishVisual = document.getElementById(`editor-visual-${section}-en`);
            
            if (germanEditor) germanEditor.value = data.sections[section].german || '';
            if (englishEditor) englishEditor.value = data.sections[section].english || '';
            if (germanVisual) germanVisual.innerHTML = data.sections[section].german || '';
            if (englishVisual) englishVisual.innerHTML = data.sections[section].english || '';
          });
          
          showStatus('Import erfolgreich! Bitte speichern.', 'success');
        }
      } catch (error) {
        showError('Fehler beim Import: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

// ========== Bulk Save ==========
async function saveAllSections() {
  if (savingInProgress) {
    showError('Speichern läuft bereits! Bitte warten...');
    return;
  }
  
  if (!AppState.githubToken) {
    showError('GitHub Token nicht konfiguriert!');
    return;
  }
  
  if (!confirm('Möchten Sie wirklich alle Bereiche speichern?')) {
    return;
  }
  
  savingInProgress = true;
  showLoading(true);
  const sections = Object.keys(ADMIN_CONFIG.contentFiles);
  let saved = 0;
  let errors = 0;
  
  try {
    for (const section of sections) {
      try {
        // Create backup for each section
        await createBackup(section);
        
        if (section === 'kontakt' || section === 'meta') {
          await saveSpecialSection(section);
        } else if (section === 'projekte') {
          await saveProjects();
        } else {
          await saveContentSection(section);
        }
        saved++;
      } catch (error) {
        errors++;
        showError(`Fehler beim Speichern von ${section}: ${error.message}`);
      }
    }
    
    if (errors === 0) {
      showStatus(`Alle ${saved} Bereiche erfolgreich gespeichert!`, 'success');
      AppState.hasChanges = false;
      updateSaveIndicator();
    } else {
      showError(`${saved} gespeichert, ${errors} Fehler`);
    }
  } finally {
    savingInProgress = false;
    showLoading(false);
  }
}

// ========== DeepL Translation ==========
// Helper function to get editor content (works for both visual and markdown mode)
function getEditorContent(editorId) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  
  if (!visualEditor && !textEditor) {
    return '';
  }
  
  // Check which mode is active
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  let isVisualMode = false;
  modeButtons.forEach(btn => {
    if (btn.classList.contains('active') && btn.getAttribute('data-mode') === 'visual') {
      isVisualMode = true;
    }
  });
  
  if (isVisualMode && visualEditor) {
    return visualEditor.innerHTML || '';
  } else if (textEditor) {
    return textEditor.value || '';
  }
  
  return '';
}

// Helper function to set editor content
function setEditorContent(editorId, content) {
  const visualEditor = document.getElementById(`editor-visual-${editorId}`);
  const textEditor = document.getElementById(`editor-${editorId}`);
  
  if (!visualEditor && !textEditor) {
    return;
  }
  
  // Check which mode is active
  const modeButtons = document.querySelectorAll(`[data-editor="${editorId}"]`);
  let isVisualMode = false;
  modeButtons.forEach(btn => {
    if (btn.classList.contains('active') && btn.getAttribute('data-mode') === 'visual') {
      isVisualMode = true;
    }
  });
  
  if (isVisualMode && visualEditor) {
    visualEditor.innerHTML = content;
    // Trigger input event to mark as changed
    visualEditor.dispatchEvent(new Event('input', { bubbles: true }));
    // Update preview
    updatePreview(visualEditor);
  } else if (textEditor) {
    textEditor.value = content;
    // Trigger input event to mark as changed
    textEditor.dispatchEvent(new Event('input', { bubbles: true }));
    // Update preview
    updatePreview(textEditor);
  }
}

// Convert HTML to plain text (preserving structure for translation)
function htmlToPlainText(html) {
  if (!html) return '';
  
  // Create temporary element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove script and style elements
  const scripts = temp.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());
  
  // Get text content
  return temp.textContent || temp.innerText || '';
}

// Convert plain text back to HTML (simple paragraph structure)
function plainTextToHtml(text) {
  if (!text) return '';
  
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    
    // Split by single newlines and wrap in <br>
    const lines = trimmed.split('\n');
    if (lines.length === 1) {
      return `<p>${escapeHtml(lines[0])}</p>`;
    } else {
      return `<p>${lines.map(line => escapeHtml(line)).join('<br>')}</p>`;
    }
  }).filter(p => p).join('\n');
}

// Translate from German to English using MyMemory Translation API (kostenlos, keine Kreditkarte nötig)
async function translateFromGerman(section) {
  // Get German content
  const germanContent = getEditorContent(`${section}-de`);
  if (!germanContent || germanContent.trim() === '') {
    showError('Kein deutscher Text zum Übersetzen gefunden!');
    return;
  }
  
  // Convert HTML to plain text
  const plainText = htmlToPlainText(germanContent);
  if (!plainText || plainText.trim() === '') {
    showError('Kein Text zum Übersetzen gefunden!');
    return;
  }
  
  // MyMemory API limit: 10.000 Zeichen pro Request
  if (plainText.length > 10000) {
    showError('Text zu lang! Bitte maximal 10.000 Zeichen auf einmal übersetzen.');
    return;
  }
  
  // Show loading
  showLoading(true);
  const translateBtn = document.querySelector(`[onclick="translateFromGerman('${section}')"]`);
  if (translateBtn) {
    translateBtn.disabled = true;
    translateBtn.innerHTML = '<span>🌐</span> Übersetze...';
  }
  
  try {
    // LibreTranslate - kostenlos, open source, zuverlässig
    // Übersetzt direkt von Deutsch (de) zu Englisch (en)
    const apiUrl = 'https://libretranslate.de/translate';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: plainText,
        source: 'de',
        target: 'en',
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.translatedText) {
      throw new Error('Keine Übersetzung erhalten');
    }
    
    const translatedText = data.translatedText;
    
    // Convert back to HTML
    const translatedHtml = plainTextToHtml(translatedText);
    
    // Set English content
    setEditorContent(`${section}-en`, translatedHtml);
    
    showStatus('Übersetzung erfolgreich!', 'success');
    AppState.hasChanges = true;
    updateSaveIndicator();
    
  } catch (error) {
    console.error('Translation error:', error);
    showError('Übersetzungsfehler: ' + error.message);
  } finally {
    showLoading(false);
    if (translateBtn) {
      translateBtn.disabled = false;
      translateBtn.innerHTML = '<span>🌐</span> Aus DE übersetzen';
    }
  }
}

// Make functions available globally
window.saveSection = saveSection;
window.changePassword = changePassword;
window.saveAllSections = saveAllSections;
window.translateFromGerman = translateFromGerman;

