import {
  cancelCountdownNotification,
  clearNotificationTranslationsCache,
  scheduleCountdownNotification,
  type CountdownNotification,
  type NotificationResult,
} from './notifications';

class NotificationManager {
  private activeNotifications = new Map<string, CountdownNotification>();
  private currentLanguage: string | null = null;

  constructor() {
    this.currentLanguage = this.getCurrentLanguage();
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
        originalPushState.call(history, data, unused, url);
        this.handleStateChange();
      };
      history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
        originalReplaceState.call(history, data, unused, url);
        this.handleStateChange();
      };
      window.addEventListener('popstate', this.handleStateChange);
    }
  }

  private getCurrentLanguage(): string {
    if (typeof window === 'undefined') return 'zh-CN';
    const language = new URLSearchParams(window.location.search).get('lang');
    return language === 'en-US' ? 'en-US' : 'zh-CN';
  }

  private handleStateChange = (): void => {
    const language = this.getCurrentLanguage();
    if (language === this.currentLanguage) return;
    clearNotificationTranslationsCache();
    void this.updateActiveNotifications();
    this.currentLanguage = language;
  };

  private async updateActiveNotifications(): Promise<void> {
    for (const notification of this.activeNotifications.values()) {
      cancelCountdownNotification(notification.id);
      await scheduleCountdownNotification(notification, true);
    }
  }

  async addNotification(countdown: CountdownNotification, skipPermissionCheck = false): Promise<NotificationResult> {
    try {
      const result = await scheduleCountdownNotification(countdown, skipPermissionCheck);
      if (result.success) this.activeNotifications.set(countdown.id, countdown);
      return result;
    } catch (error) {
      console.error('Failed to add notification:', error);
      return { success: false, needsPermission: false };
    }
  }

  removeNotification(countdownId: string): void {
    cancelCountdownNotification(countdownId);
    this.activeNotifications.delete(countdownId);
  }

  clearAllNotifications(): void {
    for (const notificationId of this.activeNotifications.keys()) cancelCountdownNotification(notificationId);
    this.activeNotifications.clear();
  }

  getActiveNotifications(): CountdownNotification[] {
    return Array.from(this.activeNotifications.values());
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
export const addNotification = (countdown: CountdownNotification, skipPermissionCheck?: boolean) => notificationManager.addNotification(countdown, skipPermissionCheck);
export const removeNotification = (countdownId: string) => notificationManager.removeNotification(countdownId);
export const clearAllNotifications = () => notificationManager.clearAllNotifications();
export const getActiveNotifications = () => notificationManager.getActiveNotifications();
