import { useState, useEffect } from 'react';

export default function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // 检查初始网络状态
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    
    // 监听网络状态变化
    const handleOnline = () => {
      setIsOffline(false);
      console.log('网络已连接 - 切换到在线模式');
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      console.log('网络已断开 - 切换到离线模式');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // 离线状态数据传递给Footer处理，这个组件不显示任何内容
  return null;
}
