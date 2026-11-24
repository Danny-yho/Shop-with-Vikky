// Replaced at Vercel build time when VITE_API_URL or REACT_APP_API_URL is set.
// Empty means the storefront is served by Express and should call the same origin.
window.VITE_API_URL = window.VITE_API_URL || '';
window.REACT_APP_API_URL = window.REACT_APP_API_URL || window.VITE_API_URL;

(function () {
  var configured = window.VITE_API_URL || window.REACT_APP_API_URL || '';
  if (!configured) {
    var host = location.hostname;
    var local = host === 'localhost' || host === '127.0.0.1';
    var servedByBackend = local && (location.port === '5000' || location.port === '3000' || location.port === '');
    configured = local && !servedByBackend ? 'http://localhost:5000' : '';
  }
  window.API_BASE = String(configured).replace(/\/$/, '');
})();
