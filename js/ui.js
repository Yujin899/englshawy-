// Premium UI Helpers (Toast notifications and full-screen loading spinners - Light Mode)

/**
 * Toast System
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 4000) {
    this.init(); // Ensure container exists

    const toast = document.createElement('div');
    toast.className = 'glass-panel p-4 rounded-xl shadow-md flex items-center justify-between gap-3 animate-slide-in';
    
    // Set border and text color based on toast type
    let colorClass = 'border-zinc-200 bg-white text-zinc-800';
    let iconSvg = '';

    if (type === 'success') {
      colorClass = 'border-emerald-200 bg-emerald-50 text-emerald-800';
      iconSvg = `<svg class="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (type === 'error') {
      colorClass = 'border-rose-200 bg-rose-50 text-rose-800';
      iconSvg = `<svg class="w-5 h-5 flex-shrink-0 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else {
      colorClass = 'border-indigo-200 bg-indigo-50 text-indigo-800';
      iconSvg = `<svg class="w-5 h-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.classList.add(...colorClass.split(' '));

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        ${iconSvg}
        <span class="text-sm font-medium text-zinc-800">${message}</span>
      </div>
      <button class="toast-close-btn text-zinc-400 hover:text-zinc-600 focus:outline-none ml-2">
        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    `;

    // Close button event
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
      this.removeToast(toast);
    });

    this.container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  }

  removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.remove('animate-slide-in');
    toast.classList.add('animate-slide-out');
    
    let removed = false;
    const forceRemove = () => {
      if (removed) return;
      removed = true;
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    };
    
    toast.addEventListener('animationend', forceRemove);
    setTimeout(forceRemove, 400); // 400ms safety timeout fallback
  }
}

export const toast = new ToastManager();

/**
 * Loading Spinner Helper
 */
export function showLoader() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-zinc-100/80 backdrop-blur-sm transition-opacity duration-300';
    loader.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <div class="relative w-12 h-12">
          <div class="absolute inset-0 rounded-full border-4 border-zinc-200"></div>
          <div class="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
        </div>
        <span class="text-sm font-medium text-zinc-600">Loading...</span>
      </div>
    `;
    document.body.appendChild(loader);
  }
  loader.classList.remove('opacity-0', 'pointer-events-none');
  loader.classList.add('opacity-100');
}

export function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('opacity-100');
    loader.classList.add('opacity-0', 'pointer-events-none');
  }
}

/**
 * Modal Helper
 */
export function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
  const modalId = 'global-confirm-modal';
  let modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }

  modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="glass-panel max-w-md w-full rounded-2xl overflow-hidden shadow-lg p-6 border-zinc-200 bg-white">
      <h3 class="text-lg font-bold text-zinc-800 mb-2">${title}</h3>
      <p class="text-xs text-zinc-500 mb-6 leading-relaxed">${message}</p>
      <div class="flex items-center justify-end gap-3">
        <button id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors border border-transparent">
          ${cancelText}
        </button>
        <button id="modal-confirm-btn" class="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cleanup = () => {
    modal.remove();
  };

  modal.querySelector('#modal-cancel-btn').addEventListener('click', () => {
    cleanup();
  });

  modal.querySelector('#modal-confirm-btn').addEventListener('click', () => {
    onConfirm();
    cleanup();
  });
}

