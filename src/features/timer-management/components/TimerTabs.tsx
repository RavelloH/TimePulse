import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Timer } from '@/domain/timer';
import { AutoTransition } from '@/components/ui';
import { getScrollViewport } from '@/services/scrollbars';

interface TimerTabsProps {
  timers: Timer[];
  activeTimerId: string | null;
  setActiveTimerId: (id: string) => void;
}

export default function TimerTabs({
  timers,
  activeTimerId,
  setActiveTimerId,
}: TimerTabsProps) {
  const [showAllTabs, setShowAllTabs] = useState(false);

  // 添加滚动引用和悬浮延迟控制
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 处理全局鼠标移动检测
  const handleGlobalMouseMove = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }

    // 如果标签栏未展开，则展开它
    if (!showAllTabs) {
      setShowAllTabs(true);
    }

    // 清除之前的隐藏计时器
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
    }

    // 设置新的隐藏计时器（5秒后隐藏）
    mouseMoveTimerRef.current = setTimeout(() => {
      setShowAllTabs(false);
    }, 5000);
  };

  // 处理点击当前标签显示所有标签
  const handleActiveTabClick = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }

    if (!showAllTabs) {
      setShowAllTabs(true);
      // 清除其他定时器
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      // 启动鼠标移动检测
      handleGlobalMouseMove();
    }
  };

  // 处理鼠标滚轮事件
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const viewport = getScrollViewport(tabsScrollRef.current);
    if (viewport) {
      e.preventDefault();
      viewport.scrollLeft += e.deltaY;
    }
  };

  // 处理悬浮延迟展开
  const handleMouseEnter = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }

    // 清除收起定时器（如果用户重新进入）
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // 清除鼠标移动定时器
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
      mouseMoveTimerRef.current = null;
    }

    // 如果已经展开，启动鼠标移动检测
    if (showAllTabs) {
      handleGlobalMouseMove();
      return;
    }

    // 清除之前的展开定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // 设置延迟展开
    hoverTimerRef.current = setTimeout(() => {
      setShowAllTabs(true);
      // 展开后启动鼠标移动检测
      handleGlobalMouseMove();
    }, 500); // 500ms延迟
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    // 如果只有一个或没有标签页，则不执行任何操作
    if (timers.length <= 1) {
      return;
    }

    // 清除展开定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // 不再在鼠标离开时自动收起标签栏
    // 只有在全局鼠标移动停止5秒后才会收起
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    };
  }, []);

  // 添加全局鼠标移动监听器
  useEffect(() => {
    // 只有在标签数量大于1时才添加鼠标移动事件监听器
    if (timers.length > 1) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    // 清理函数
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [showAllTabs, timers.length]); // 依赖showAllTabs状态和计时器数量

  // 当标签栏状态变化或选中标签变化时调整滚动位置
  useEffect(() => {
    if (tabsScrollRef.current && activeTimerId) {
      // 添加小延时，确保DOM已经更新
      setTimeout(() => {
        if (!tabsScrollRef.current) return;
        const viewport = getScrollViewport(tabsScrollRef.current);
        if (!viewport) return;

        if (showAllTabs) {
          // 在展开状态下，查找展开模式中的激活标签
          const expandedTabElement = document.getElementById(`expanded-timer-tab-${activeTimerId}`);
          if (expandedTabElement) {
            const containerWidth = viewport.clientWidth;
            const tabBounds = expandedTabElement.getBoundingClientRect();
            const containerBounds = viewport.getBoundingClientRect();

            // 计算标签左边缘相对于容器的位置
            const tabLeft = tabBounds.left - containerBounds.left + viewport.scrollLeft;
            const tabRight = tabLeft + tabBounds.width;

            // 添加一些边距确保完全可见
            const margin = 16;
            let scrollLeftTarget = viewport.scrollLeft;

            // 如果标签左边被遮挡，或者是第一个标签，确保完全显示
            if (tabLeft < margin) {
              scrollLeftTarget = Math.max(0, tabLeft - margin);
            }
            // 如果标签右边被遮挡
            else if (tabRight > containerWidth - margin) {
              scrollLeftTarget = tabRight - containerWidth + margin;
            }
            // 否则将标签居中显示
            else {
              const tabCenter = tabLeft + (tabBounds.width / 2);
              const containerCenter = containerWidth / 2;
              scrollLeftTarget = tabCenter - containerCenter;
            }

            // 确保不会滚动出边界
            const maxScrollLeft = viewport.scrollWidth - containerWidth;
            scrollLeftTarget = Math.max(0, Math.min(scrollLeftTarget, maxScrollLeft));

            viewport.scrollTo({
              left: scrollLeftTarget,
              behavior: 'smooth'
            });
          }
        } else {
          // 收起状态下，确保当前标签可见
          const activeTabElement = document.getElementById(`timer-tab-${activeTimerId}`);
          if (activeTabElement) {
            // 将激活的标签滚动到可见区域
            activeTabElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 50);
    }
  }, [showAllTabs, activeTimerId]);

  return (
    <div
      className={`hidden md:flex absolute top-1/2 z-0 overflow-hidden ${
        showAllTabs
          ? 'w-80'
          : 'w-48'
      }`}
      style={{
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div
        ref={tabsScrollRef}
        className={`flex items-center space-x-1 py-2 px-2 w-full scrollbar-hide relative ${
          showAllTabs ? 'justify-start overflow-x-auto' : 'justify-center overflow-x-auto'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overflowX: 'auto',
          margin: '0 auto',
          cursor: showAllTabs ? 'grab' : 'default',
        }}
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          if (showAllTabs && tabsScrollRef.current) {
            const viewport = getScrollViewport(tabsScrollRef.current);
            if (!viewport) return;
            // 记录起始点击位置
            const startX = e.pageX - tabsScrollRef.current.offsetLeft;
            const scrollLeft = viewport.scrollLeft;

            const handleMouseMove = (e: MouseEvent) => {
              if (!tabsScrollRef.current || !viewport.isConnected) return;
              // 计算滚动距离
              const x = e.pageX - tabsScrollRef.current.offsetLeft;
              const walk = (x - startX) * 2; // 加快滚动速度
              viewport.scrollLeft = scrollLeft - walk;
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }
        }}
        onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
          if (tabsScrollRef.current) {
            const viewport = getScrollViewport(tabsScrollRef.current);
            if (!viewport) return;
            const startX = e.touches[0].clientX;
            const scrollLeft = viewport.scrollLeft;

            const handleTouchMove = (e: TouchEvent) => {
              if (!tabsScrollRef.current || !viewport.isConnected) return;
              // 阻止页面滚动
              e.preventDefault();
              const x = e.touches[0].clientX;
              const walk = (startX - x); // 滚动距离
              viewport.scrollLeft = scrollLeft + walk;
            };

            const handleTouchEnd = () => {
              tabsScrollRef.current!.removeEventListener('touchmove', handleTouchMove);
              tabsScrollRef.current!.removeEventListener('touchend', handleTouchEnd);
            };

            tabsScrollRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
            tabsScrollRef.current.addEventListener('touchend', handleTouchEnd);
          }
        }}
      >
        {/* 展开状态的所有标签容器 - 仅在展开时显示 */}
        <AutoTransition transitionKey={showAllTabs ? `expanded-${timers.length}` : 'expanded-hidden'} initial={false} type="crossFade">
        {showAllTabs ? (
          <motion.div
            className="flex space-x-2 py-2 px-4 min-w-max justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94], // 更柔和的缓动函数
              exit: {
                duration: 0.6,
                ease: [0.32, 0, 0.67, 0] // 收起时使用更缓慢的缓动
              }
            } as never}
          >
            {timers.map((timer, index) => (
              <motion.button
                key={`expanded-${timer.id}`}
                id={`expanded-timer-tab-${timer.id}`}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.02, // 减少错开延迟
                  ease: [0.25, 0.46, 0.45, 0.94],
                  layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                  exit: {
                    duration: 0.45,
                    delay: (timers.length - 1 - index) * 0.03, // 反向错开延迟收起
                    ease: [0.32, 0, 0.67, 0]
                  }
                } as never}
                whileHover={{
                  scale: 1.01,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
                whileTap={{
                  scale: 0.99,
                  transition: { duration: 0.2 }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out ${
                  activeTimerId === timer.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 backdrop-blur-sm'
                }`}
                style={
                  activeTimerId === timer.id
                    ? { backgroundColor: timer.color || '#0ea5e9' }
                    : {}
                }
                onClick={() => setActiveTimerId(timer.id)}
                data-insightflare-event="timer_switch"
                data-insightflare-event-from="desktop_expanded"
              >
                {timer.name}
              </motion.button>
            ))}
          </motion.div>
        ) : null}
        </AutoTransition>

        {/* 收起状态下只显示当前激活的标签 */}
        <AutoTransition transitionKey={!showAllTabs ? `collapsed-${activeTimerId ?? 'empty'}` : 'collapsed-hidden'} initial={false} type="crossFade">
          {!showAllTabs ? (
            timers.map(timer => {
              const isActive = activeTimerId === timer.id;
              return isActive ? (
                <motion.button
                  key={timer.id}
                  id={`timer-tab-${timer.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
                  }}
                  whileHover={{
                    scale: 1.005,
                    transition: { duration: 0.5, ease: "easeOut" }
                  }}
                  whileTap={{
                    scale: 0.995,
                    transition: { duration: 0.2 }
                  }}
                  className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap text-white shadow-md transition-all duration-300 ease-out hover:shadow-lg"
                  style={{ backgroundColor: timer.color || '#0ea5e9' }}
                  onClick={handleActiveTabClick}
                  data-insightflare-event="timer_switch"
                  data-insightflare-event-from="desktop_collapsed"
                >
                  {timer.name}
                </motion.button>
              ) : null;
            })
          ) : null}
        </AutoTransition>
      </div>
    </div>
  );
}
