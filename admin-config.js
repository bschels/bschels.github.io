// Admin Panel Configuration
const ADMIN_CONFIG = {
  // Password hash (SHA-256). To generate: Use browser console: 
  // await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'))
  // Then convert to hex string
  passwordHash: '057f2c0fe9aeedebf5414a0b091eec3f746079c01a759f3da801d28b10573b58',
  
  // Repository configuration (can be set via UI)
  repository: {
    owner: 'bschels',
    repo: 'bschels.github.io',
    branch: 'main',
    path: '' // root path
  },
  
  // Content files mapping
  contentFiles: {
    profil: 'pages/profil.html',
    cv: 'pages/cv.html',
    leistungen: 'pages/leistungen.html',
    bauenimbestand: 'pages/bauenimbestand.html',
    projekte: 'pages/projekte.html',
    impressum: 'pages/impressum.html',
    datenschutz: 'pages/datenschutz.html',
    kontakt: 'index.html', // Special: embedded in index.html
    meta: 'index.html' // Special: meta tags in index.html
  },
  
  // GoatCounter Analytics Configuration
  goatCounterApiKey: 't3ctjw810luj8f11jmq8qfwy1j0wdgfc4vk9m20vhdkt2v9f9y', // Your GoatCounter API Key
  goatCounterSiteId: 'schels', // Your GoatCounter Site ID (e.g., 'schels')
  
  // Legacy format (for backwards compatibility)
  goatcounter: {
    apiKey: 't3ctjw810luj8f11jmq8qfwy1j0wdgfc4vk9m20vhdkt2v9f9y',
    site: 'schels'
  }
};

