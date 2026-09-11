import { useState, useEffect } from 'react';
import NotificationPermissionModal from './NotificationPermissionModal';
import { scheduleCountdownNotification, setNotificationPreference, requestNotificationPermission, type CountdownNotification } from '@/services/notifications';

export default function GlobalNotificationManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [pendingNotification, setPendingNotification] = useState<CountdownNotification | null>(null);

  useEffect(() => {
    // 监听需要权限的事件
    const handleNeedPermission = (event: Event) => {
      const { countdown } = (event as CustomEvent<{ countdown: CountdownNotification }>).detail;
      setPendingNotification(countdown);
      setShowNotificationModal(true);
    };

    window.addEventListener('needNotificationPermission', handleNeedPermission);

    return () => {
      window.removeEventListener('needNotificationPermission', handleNeedPermission);
    };
  }, []);

  // 处理用户允许通知权限
  const handleAllowNotification = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      // 权限获取成功，保存用户偏好并设置通知
      setNotificationPreference('allowed');
      
      if (pendingNotification) {
        await scheduleCountdownNotification(pendingNotification, true);
        setPendingNotification(null);
      }
    }
    // 注意：失败的情况由弹窗组件内部处理
  };

  // 处理用户拒绝通知权限
  const handleDenyNotification = () => {
    setNotificationPreference('denied');
    setPendingNotification(null);
  };

  // 处理关闭权限弹窗
  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setPendingNotification(null);
  };

  return (
    <NotificationPermissionModal
      isOpen={showNotificationModal}
      onClose={handleCloseNotificationModal}
      onAllow={handleAllowNotification}
      onDeny={handleDenyNotification}
    />
  );
}
