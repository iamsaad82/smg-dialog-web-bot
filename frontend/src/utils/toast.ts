/**
 * Eine einheitliche Toast-Schnittstelle, die mit Sonner arbeitet und einen verbesserten Fallback bietet
 */

// Typen für die Toast-Funktionen
type ToastFn = (message: string, options?: any) => void;

interface ToastInterface {
  success: ToastFn;
  error: ToastFn;
  info: ToastFn;
  warning?: ToastFn;
}

// Toast-Implementierung
let toast: ToastInterface;

try {
  // Versuche, Sonner zu importieren
  const sonner = require('sonner');
  toast = sonner.toast;
  console.log('Sonner erfolgreich geladen');
} catch (e) {
  console.warn('Sonner konnte nicht geladen werden, verwende Fallback-Toast-System');
  
  // Verbesserte Fallback-Implementierung
  const createToastElement = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Erstelle Toast-Container, falls er noch nicht existiert
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.position = 'fixed';
      toastContainer.style.top = '20px';
      toastContainer.style.right = '20px';
      toastContainer.style.zIndex = '9999';
      toastContainer.style.display = 'flex';
      toastContainer.style.flexDirection = 'column';
      toastContainer.style.gap = '10px';
      document.body.appendChild(toastContainer);
    }

    // Erstelle Toast-Element
    const toast = document.createElement('div');
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '6px';
    toast.style.maxWidth = '350px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 3.7s';
    toast.style.pointerEvents = 'auto';
    toast.style.fontFamily = 'sans-serif';
    toast.style.fontSize = '14px';
    toast.style.transition = 'all 0.3s ease';

    // Styling basierend auf dem Typ
    switch (type) {
      case 'success':
        toast.style.backgroundColor = '#10B981';
        toast.style.color = 'white';
        break;
      case 'error':
        toast.style.backgroundColor = '#EF4444';
        toast.style.color = 'white';
        break;
      case 'warning':
        toast.style.backgroundColor = '#F59E0B';
        toast.style.color = 'white';
        break;
      case 'info':
      default:
        toast.style.backgroundColor = '#3B82F6';
        toast.style.color = 'white';
        break;
    }

    // Füge Text hinzu
    toast.textContent = message;

    // Füge Schließen-Button hinzu
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = 'auto';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'inherit';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '10px';
    closeBtn.onclick = () => {
      // Sicherstellen, dass toast.remove() sicher ist
      if (toast && toast.parentNode) {
        toast.remove();
      }
    };
    toast.appendChild(closeBtn);

    // Füge das Toast dem Container hinzu
    if (toastContainer) {
      toastContainer.appendChild(toast);
    }

    // Entferne das Toast nach 4 Sekunden
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode === toastContainer && toastContainer !== null) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

  // Füge CSS-Animation zum Dokument hinzu
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Erstelle Fallback-Toast-Funktionen
  toast = {
    success: (message: string) => {
      console.log(`[SUCCESS] ${message}`);
      if (typeof document !== 'undefined') {
        createToastElement(message, 'success');
      } else {
        // Server-Side oder nicht-Browser-Umgebung
        console.log(`[SUCCESS] ${message}`);
      }
    },
    error: (message: string, options?: { description?: string }) => {
      const fullMessage = options?.description ? `${message}\n${options.description}` : message;
      console.error(`[ERROR] ${fullMessage}`);
      if (typeof document !== 'undefined') {
        createToastElement(fullMessage, 'error');
      } else {
        console.error(`[ERROR] ${fullMessage}`);
      }
    },
    info: (message: string) => {
      console.log(`[INFO] ${message}`);
      if (typeof document !== 'undefined') {
        createToastElement(message, 'info');
      } else {
        console.log(`[INFO] ${message}`);
      }
    },
    warning: (message: string) => {
      console.warn(`[WARNING] ${message}`);
      if (typeof document !== 'undefined') {
        createToastElement(message, 'warning');
      } else {
        console.warn(`[WARNING] ${message}`);
      }
    }
  };
}

export { toast }; 