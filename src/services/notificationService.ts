/**
 * Service to manage Web Push & Local Notifications for the G20 Padel App
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  isStandalone: boolean;
  isIOS: boolean;
}

export class NotificationService {
  /**
   * Check current notification state and platform compatibility
   */
  static getStatus(): NotificationStatus {
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!('Notification' in window)) {
      return {
        isSupported: false,
        permission: 'unsupported',
        isStandalone,
        isIOS,
      };
    }

    return {
      isSupported: true,
      permission: Notification.permission as 'default' | 'granted' | 'denied',
      isStandalone,
      isIOS,
    };
  }

  /**
   * Requests browser notification permission with user gesture
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Show test welcome notification
        await this.showWelcomeNotification();
        localStorage.setItem('padel_notifications_enabled', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Shows a welcome confirmation notification
   */
  static async showWelcomeNotification() {
    const title = '🎾 Torneo G20 Activado';
    const options: NotificationOptions = {
      body: '¡Listo! Recibirás avisos de tus partidos, resultados y novedades del torneo.',
      icon: '/icon-192.png',
      badge: '/favicon.png',
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, options);
          return;
        }
      } catch (e) {
        // Fallback to standard Notification
      }
    }

    try {
      new Notification(title, options);
    } catch (e) {
      console.log('Local notification dispatched.');
    }
  }
}
