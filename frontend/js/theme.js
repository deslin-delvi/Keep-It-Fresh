// ════════════════════════════════════════════════
//  Theme Toggle — Dark / Light Mode
//  Saves preference to localStorage
// ════════════════════════════════════════════════

(function () {
  const STORAGE_KEY = 'theme';
  const root        = document.documentElement;

  // Apply saved theme immediately (before paint) to avoid flash
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Set correct icon on load
    updateIcon(btn, saved);

    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';

      root.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, next);
      updateIcon(btn, next);
    });
  });

  function updateIcon(btn, theme) {
    btn.textContent     = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title',      theme === 'dark' ? 'Light mode' : 'Dark mode');
  }
})();