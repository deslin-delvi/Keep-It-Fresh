// ════════════════════════════════════════════════
//  Toast Notification System
//  Usage:
//    showToast('Item added!', 'success')
//    showToast('Something went wrong', 'error')
//    showToast('Expiring soon!', 'warning')
//    showToast('Loading...', 'info')
//
//  Confirm dialog (replaces window.confirm):
//    const yes = await showConfirm('Delete this item?')
// ════════════════════════════════════════════════

// Inject toast container once
function getToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

// Icons per type
const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️'
};

// Auto-dismiss durations (ms)
const TOAST_DURATIONS = {
  success: 3000,
  error:   4500,
  warning: 4000,
  info:    3000
};

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number|null} duration - override auto-dismiss (null = no auto-dismiss)
 */
function showToast(message, type = 'info', duration = null) {
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  // Trigger animation on next frame
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  const ms = duration !== null ? duration : TOAST_DURATIONS[type];
  if (ms) {
    setTimeout(() => dismissToast(toast), ms);
  }

  return toast;
}

function dismissToast(toast) {
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

/**
 * Custom confirm dialog — replaces window.confirm()
 * Returns a Promise<boolean>
 * @param {string} message
 * @param {string} confirmText
 * @param {string} cancelText
 */
function showConfirm(message, confirmText = 'Delete', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-icon">🗑️</div>
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
          <button class="btn btn-danger confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('confirm-show'));

    function close(result) {
      overlay.classList.remove('confirm-show');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      resolve(result);
    }

    overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true));
    overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}