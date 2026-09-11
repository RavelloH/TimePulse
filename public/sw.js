// 使用时间戳作为缓存版本，确保每次部署都会更新
const CACHE_VERSION = "v1.4"; // Vite 切换版本：清理旧 Next 静态资源
const CACHE_NAME = `timepulse-${CACHE_VERSION}`;
const RUNTIME_CACHE = `timepulse-runtime-${CACHE_VERSION}`;

// 修改缓存资源列表，只包含确定存在的文件
const urlsToCache = ["/", "/favicon.ico", "/site.webmanifest"];

// 安装Service Worker
self.addEventListener("install", (event) => {
  console.log(`[SW] 安装新版本: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] 缓存已打开");

      // 使用Promise.allSettled代替cache.addAll，这样即使某些资源请求失败，也不会导致整个缓存过程失败
      return Promise.allSettled(
        urlsToCache.map((url) =>
          fetch(url, { cache: "no-cache" }) // 强制从网络获取最新版本
            .then((response) => {
              if (!response || !response.ok) {
                console.log(`[SW] 无法缓存资源: ${url}`);
                return;
              }
              return cache.put(url, response);
            })
            .catch((err) =>
              console.log(`[SW] 缓存资源失败: ${url}, 错误: ${err}`),
            ),
        ),
      );
    }),
  );

  // 立即激活新版本的Service Worker
  self.skipWaiting();
});

// 激活Service Worker
self.addEventListener("activate", (event) => {
  console.log(`[SW] 激活新版本: ${CACHE_VERSION}`);
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        console.log("[SW] 检查缓存，当前版本:", CACHE_VERSION);
        console.log("[SW] 现有缓存:", cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("[SW] 删除旧缓存:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // 立即接管页面，不等待刷新
      clients.claim(),
    ]),
  );
});

// 处理fetch请求 - 使用网络优先(Network First)策略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 对于同源请求，使用网络优先策略，强制绕过浏览器缓存
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request, { cache: "no-cache" }) // 强制绕过浏览器缓存
        .then((response) => {
          // 检查响应是否有效
          if (!response || response.status !== 200) {
            console.log(`[SW] 网络请求失败，尝试使用缓存: ${request.url}`);
            // 如果网络请求失败，尝试从缓存获取
            return caches.match(request).then((cachedResponse) => {
              return cachedResponse || response;
            });
          }

          // 克隆响应以便缓存
          const responseToCache = response.clone();

          // 将资源缓存到运行时缓存中
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            })
            .catch((err) =>
              console.log(`[SW] 缓存请求失败: ${request.url}`, err),
            );

          return response;
        })
        .catch((error) => {
          console.log("[SW] 网络请求失败，尝试使用缓存:", request.url, error);

          // 网络请求失败，尝试从缓存获取
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // 检查是否为API请求
            if (url.pathname.includes("/api/")) {
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: "您当前处于离线模式，此操作需要网络连接",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }

            // 尝试返回离线页面
            return caches.match("/offline.html").then((offlineResponse) => {
              return (
                offlineResponse ||
                new Response("网络错误，您当前处于离线模式", {
                  status: 503,
                  statusText: "Service Unavailable",
                  headers: { "Content-Type": "text/html" },
                })
              );
            });
          });
        }),
    );
  } else {
    // 对于跨域请求（如CDN），也使用网络优先策略
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 检查响应是否有效
          if (!response || response.status !== 200) {
            console.log(`[SW] 跨域请求失败，尝试使用缓存: ${request.url}`);
            return caches.match(request).then((cached) => cached || response);
          }

          // 克隆响应以便缓存
          const responseToCache = response.clone();

          caches
            .open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            })
            .catch((err) =>
              console.log(`[SW] 缓存跨域请求失败: ${request.url}`, err),
            );

          return response;
        })
        .catch((error) => {
          console.log("[SW] 跨域请求失败，尝试使用缓存:", request.url);

          // 网络请求失败，尝试从缓存获取
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // 检查是否为API请求
            if (url.pathname.includes("/api/")) {
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: "您当前处于离线模式，此操作需要网络连接",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }

            // 返回错误响应
            return new Response("网络错误，无法加载资源", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain" },
            });
          });
        }),
    );
  }
});

// 处理消息 - 接收倒计时信息并设置通知
self.addEventListener("message", (event) => {
  const data = event.data;

  if (data.action === "scheduleNotification") {
    const { title, timestamp, body, id } = data;

    console.log("[SW] 收到通知调度请求:", { title, timestamp, id });

    // 计算倒计时剩余时间
    const timeUntilNotification = timestamp - Date.now();

    console.log("[SW] 距离通知时间还有:", timeUntilNotification, "ms");

    if (timeUntilNotification <= 0) {
      // 如果时间已过，立即发送通知
      console.log("[SW] 立即发送通知:", title);
      showNotification(title, body, id);
    } else {
      // 设置定时器，到时间时发送通知
      console.log(
        "[SW] 设置定时器，将在",
        timeUntilNotification,
        "ms后发送通知",
      );

      // 为了提高可靠性，我们同时使用多种方式来确保通知能够发送
      const timerId = setTimeout(() => {
        console.log("[SW] 定时器触发，发送通知:", title);
        showNotification(title, body, id);
      }, timeUntilNotification);

      // 存储定时器ID，以便后续可能的取消操作
      if (!self.activeTimers) {
        self.activeTimers = new Map();
      }
      self.activeTimers.set(id, timerId);
    }
  } else if (data.action === "cancelNotification") {
    // 处理取消通知请求
    const { id } = data;
    console.log("[SW] 收到取消通知请求:", id);

    if (self.activeTimers && self.activeTimers.has(id)) {
      const timerId = self.activeTimers.get(id);
      clearTimeout(timerId);
      self.activeTimers.delete(id);
      console.log("[SW] 已取消通知定时器:", id);
    }

    // 同时取消已显示的通知
    self.registration.getNotifications({ tag: id }).then((notifications) => {
      notifications.forEach((notification) => {
        notification.close();
        console.log("[SW] 已关闭通知:", id);
      });
    });
  } else if (data.action === "updateCache") {
    // 处理缓存更新请求 - 清除所有运行时缓存
    console.log("[SW] 收到更新缓存请求，清除运行时缓存");
    event.waitUntil(
      caches
        .delete(RUNTIME_CACHE)
        .then(() => {
          console.log("[SW] 运行时缓存已清除");
          // 通知客户端缓存已更新
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              action: "cacheUpdated",
              timestamp: Date.now(),
              hasUpdates: true,
            });
          });
          console.log("[SW] 缓存更新完成");
        })
        .catch((err) => {
          console.error("[SW] 清除缓存失败:", err);
        }),
    );
  }
});

// 显示通知的函数
function showNotification(title, body, id) {
  console.log("显示通知:", { title, body, id });

  try {
    self.registration.showNotification(title, {
      body: body || "倒计时已结束！",
      icon: "/android-chrome-192x192.png",
      badge: "/favicon.ico",
      tag: id,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: {
        countdownId: id,
      },
      // 添加额外的选项以提高兼容性
      silent: false,
      renotify: true,
      timestamp: Date.now(),
    });
    console.log("通知显示成功:", title);
  } catch (error) {
    console.error("显示通知失败:", error);
  }
}

// 处理通知点击事件
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // 点击通知时打开应用并导航到相应倒计时
  const countdownId = event.notification.data.countdownId;
  const urlToOpen = new URL("/", self.location.origin);

  if (countdownId) {
    urlToOpen.searchParams.set("id", countdownId);
  }

  // 打开应用或将应用置于前台
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // 检查应用是否已经打开
        for (let client of windowClients) {
          if (client.url === urlToOpen.href && "focus" in client) {
            return client.focus();
          }
        }
        // 如果应用没有打开，则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.href);
        }
      }),
  );
});
