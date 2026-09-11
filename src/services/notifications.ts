import type { Language } from '@/i18n/types';

export interface CountdownNotification {
  id: string;
  title: string;
  targetTime: number;
}

export interface NotificationResult {
  success: boolean;
  needsPermission: boolean;
}

const NOTIFICATION_PREFERENCE_KEY = 'timepulse_notification_preference';
const pendingNotifications: Array<Record<string, string | number>> = [];
let notificationTranslations: Record<string, unknown> | null = null;

function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-CN';
  const value = new URLSearchParams(window.location.search).get('lang');
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}

async function loadNotificationTranslations(): Promise<Record<string, unknown>> {
  if (notificationTranslations) return notificationTranslations;
  try {
    const locale = getCurrentLanguage() === 'en-US' ? 'en' : 'zh';
    const response = await fetch(`/locales/${locale}/common.json`);
    if (!response.ok) throw new Error(`Failed to load ${locale} translations`);
    const value: unknown = await response.json();
    if (typeof value !== 'object' || value === null) throw new Error('Invalid translations');
    notificationTranslations = value as Record<string, unknown>;
    return notificationTranslations;
  } catch (error) {
    console.error('Failed to load notification translations:', error);
    return {
      notification: {
        messages: {
          countdownEnded: '倒计时结束',
          countdownEndedBody: '您设置的倒计时"{title}"已经结束。',
          testNotification: '通知测试',
          testNotificationBody: '这是一个测试通知，用于验证通知功能是否正常工作。',
        },
      },
    };
  }
}

function getNestedValue(value: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) return null;
    return key in current ? (current as Record<string, unknown>)[key] : null;
  }, value);
}

async function getLocalizedNotificationMessage(key: string, replacements: Record<string, string> = {}): Promise<string> {
  const translations = await loadNotificationTranslations();
  const message = getNestedValue(translations, key);
  if (typeof message !== 'string') {
    console.warn(`Translation not found for key: ${key}`);
    return key;
  }
  return Object.entries(replacements).reduce(
    (result, [placeholder, replacement]) => result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement),
    message,
  );
}

export function clearNotificationTranslationsCache(): void {
  notificationTranslations = null;
  console.log('通知翻译缓存已清除');
}

export function getNotificationPreference(): string {
  if (typeof window === 'undefined') return 'not_set';
  return localStorage.getItem(NOTIFICATION_PREFERENCE_KEY) || 'not_set';
}

export function setNotificationPreference(preference: 'allowed' | 'denied'): void {
  if (typeof window !== 'undefined') localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, preference);
}

export function shouldShowNotificationModal(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (getNotificationPreference() === 'denied') return false;
  return Notification.permission !== 'granted' && Notification.permission !== 'denied';
}

async function checkNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('此浏览器不支持通知');
    return false;
  }
  console.log('当前通知权限状态:', Notification.permission);
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('此浏览器不支持通知');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
}

export async function scheduleCountdownNotification(
  countdown: CountdownNotification,
  skipPermissionCheck = false,
): Promise<NotificationResult> {
  console.log('scheduleCountdownNotification 被调用:', { countdown, skipPermissionCheck });
  if (!countdown?.targetTime || !countdown.title) {
    console.error('无效的倒计时数据:', countdown);
    return { success: false, needsPermission: false };
  }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('此浏览器不支持Service Worker，无法设置通知');
    return { success: false, needsPermission: false };
  }
  if (!skipPermissionCheck && shouldShowNotificationModal()) {
    console.log('需要显示权限弹窗');
    window.dispatchEvent(new CustomEvent('needNotificationPermission', { detail: { countdown } }));
    return { success: false, needsPermission: true };
  }
  if (!(await checkNotificationPermission())) {
    console.log('无法设置通知：权限未获取');
    return { success: false, needsPermission: false };
  }

  const notificationData = {
    action: 'scheduleNotification',
    title: await getLocalizedNotificationMessage('notification.messages.countdownEnded'),
    body: await getLocalizedNotificationMessage('notification.messages.countdownEndedBody', { title: countdown.title }),
    timestamp: countdown.targetTime,
    id: countdown.id,
  };
  console.log('准备发送通知数据到Service Worker:', notificationData);

  if (navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage(notificationData);
      console.log('已设置倒计时通知:', countdown.title);
      return { success: true, needsPermission: false };
    } catch (error) {
      console.error('发送消息到Service Worker失败:', error);
      return { success: false, needsPermission: false };
    }
  }

  pendingNotifications.push(notificationData);
  void navigator.serviceWorker.ready.then(() => {
    const checkController = () => {
      if (navigator.serviceWorker.controller) {
        while (pendingNotifications.length > 0) {
          const notification = pendingNotifications.shift();
          if (notification) navigator.serviceWorker.controller.postMessage(notification);
        }
      } else {
        setTimeout(checkController, 500);
      }
    };
    checkController();
  }).catch((error: unknown) => console.error('Service Worker ready 错误:', error));

  return { success: true, needsPermission: false };
}

export function cancelCountdownNotification(countdownId: string): void {
  console.log('取消通知:', countdownId);
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.controller?.postMessage({ action: 'cancelNotification', id: countdownId });
  void navigator.serviceWorker.ready.then((registration) => {
    void registration.getNotifications({ tag: countdownId }).then((notifications) => {
      notifications.forEach((notification) => notification.close());
    });
  });
}

export async function testNotification(): Promise<boolean> {
  console.log('开始测试通知功能...');
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted' && await Notification.requestPermission() !== 'granted') return false;
  const title = await getLocalizedNotificationMessage('notification.messages.testNotification');
  const body = await getLocalizedNotificationMessage('notification.messages.testNotificationBody');
  if (!navigator.serviceWorker.controller) return false;
  navigator.serviceWorker.controller.postMessage({
    action: 'scheduleNotification',
    title,
    body,
    timestamp: Date.now() + 1000,
    id: `test-${Date.now()}`,
  });
  return true;
}
