import { ref, onMounted, onBeforeUnmount } from 'vue';
import { apiFetch } from '../utils/apiClient';

interface WindowWithMessage extends Window {
    $message?: { info: (opts: { content: string; duration?: number }) => void };
}

export interface NotificationMeta {
    resource?: string;
    id?: number | string;
    code?: string;
    workOrderNumber?: string;
    // 允许扩展其他字段
    [key: string]: unknown;
}

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    meta?: NotificationMeta | null;
}

export function useNotifications(options?: { showPopup?: boolean; onNew?: (item: NotificationItem) => void }) {
    const list = ref<NotificationItem[]>([]);
    const unreadCount = ref(0);
    const loading = ref(false);
    const showPopup = options?.showPopup ?? true;
    const onNew = options?.onNew;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isConnecting = false; // 防止重复连接
    let shouldReconnect = true; // 控制是否应该重连

    // 登录/刷新时用于“补播”最近未读消息的时间戳
    const LAST_SEEN_KEY = 'notification_last_seen_at';
    const REPLAY_WINDOW_MS = 30 * 60 * 1000; // 30 分钟内的未读消息会在首次进入时弹出一次

    function getLastSeenTs() {
        const v = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_SEEN_KEY) : null;
        const n = v ? Number(v) : 0;
        return Number.isFinite(n) ? n : 0;
    }

    function setLastSeenTs(ts: number) {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(LAST_SEEN_KEY, String(ts));
    }

    function getWsUrl() {
        const token = localStorage.getItem('access_token')?.replace(/^Bearer\s+/i, '') || '';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // 优先使用环境变量配置的后端 WS 地址（推荐在 .env 中设置 VITE_WS_BASE_URL，例如 ws://localhost:3000）
        const envBase = (import.meta.env.VITE_WS_BASE_URL as string | undefined) || '';
        let base: string;

        if (envBase) {
            // 如果已经是 ws / wss 前缀，直接使用；如果是 http / https，则替换为对应 ws 协议
            if (/^ws(s)?:\/\//i.test(envBase)) {
                base = envBase;
            } else if (/^http(s)?:\/\//i.test(envBase)) {
                base = envBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
            } else {
                // 只给出 host:port 之类的，补全协议
                base = `${protocol}//${envBase.replace(/^\/+/, '')}`;
            }
        } else if (window.location.hostname === 'localhost' && window.location.port === '5173') {
            // 开发环境下，前端跑在 5173，后端在 3000 时，直接连到 3000 端口
            base = `${protocol}//localhost:3000`;
        } else {
            // 其它情况使用当前站点 origin，由反向代理处理转发
            base = `${protocol}//${window.location.host}`;
        }

        const path = '/notify-ws';
        // 确保不会出现重复的斜杠
        const urlBase = base.replace(/\/+$/, '');
        return `${urlBase}${path}?token=${encodeURIComponent(token)}`;
    }

    async function fetchList() {
        try {
            loading.value = true;
            const res = await apiFetch<{ success: boolean; data: NotificationItem[]; unreadCount: number }>(
                '/notifications'
            );
            if (res.success && res.data) {
                const now = Date.now();
                const lastSeen = getLastSeenTs();

                list.value = res.data;
                unreadCount.value =
                    typeof res.unreadCount === 'number' ? res.unreadCount : res.data.filter(n => !n.read).length;

                // 登录/刷新时，对“最近 REPLAY_WINDOW_MS 内的未读消息”补播一次弹窗提示
                if (showPopup && typeof window !== 'undefined') {
                    const recent = res.data.filter(n => {
                        if (n.read) return false;
                        if (!n.createdAt) return false;
                        const t = new Date(n.createdAt).getTime();
                        if (!Number.isFinite(t)) return false;
                        return t > lastSeen && now - t <= REPLAY_WINDOW_MS;
                    });

                    if (recent.length) {
                        for (const n of recent) {
                            // 优先走外部传入的 onNew（例如 MainLayout 中的右上角系统通知）
                            if (onNew) {
                                onNew(n);
                            } else if ((window as WindowWithMessage).$message?.info) {
                                (window as WindowWithMessage).$message!.info({
                                    content: `${n.title}: ${n.message}`,
                                    duration: 4,
                                });
                            }
                        }
                    }
                }

                setLastSeenTs(now);
            }
        } catch {
            list.value = [];
            unreadCount.value = 0;
        } finally {
            loading.value = false;
        }
    }

    async function markRead(id: string) {
        try {
            await apiFetch<{ success: boolean }>(`/notifications/${id}/read`, {
                method: 'PATCH',
            });
            const item = list.value.find(n => n.id === id);
            if (item) item.read = true;
            if (unreadCount.value > 0) unreadCount.value -= 1;
        } catch {
            // ignore
        }
    }

    async function markAllRead() {
        try {
            await apiFetch<{ success: boolean; data?: { updated: number } }>('/notifications/read-all', {
                method: 'PATCH',
            });
            list.value.forEach(n => (n.read = true));
            unreadCount.value = 0;
        } catch {
            // ignore
        }
    }

    function connectWs() {
        if (typeof WebSocket === 'undefined') return;
        // 是否禁用 WebSocket
        // - 默认在开发环境下关闭，避免本地代理/端口冲突导致控制台持续报错
        // - 如需在开发环境启用 WebSocket，可在 .env 中设置 VITE_ENABLE_WS_DEV=true
        // - 生产环境默认开启
        const disableWsFlag = import.meta.env.VITE_DISABLE_WS === 'true';
        const isDev = import.meta.env.DEV;
        const enableWsInDev = import.meta.env.VITE_ENABLE_WS_DEV === 'true';
        if (disableWsFlag) return;
        if (isDev && !enableWsInDev) return;

        // 在扩展页面环境中也不启用 WS，避免无意义的错误
        if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') return;
        if (isConnecting) return; // 防止重复连接
        if (!shouldReconnect) return; // 如果不需要重连，直接返回

        // 如果已有连接且状态正常，不需要重连
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        isConnecting = true;
        try {
            const wsUrl = getWsUrl();
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                isConnecting = false;
                // WebSocket 连接成功
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.log('[WebSocket] 通知连接已建立:', wsUrl);
                }
            };

            ws.onmessage = (event: MessageEvent) => {
                try {
                    const payload = JSON.parse(event.data as string);
                    // 处理连接确认消息
                    if (payload.type === 'connected') {
                        if (import.meta.env.DEV) {
                            // eslint-disable-next-line no-console
                            console.log('[WebSocket] 收到连接确认:', payload.message);
                        }
                        return;
                    }
                    // 处理通知消息
                    if (payload.type === 'notification') {
                        const item: NotificationItem = {
                            id: payload.id || '',
                            type: payload.typeCategory || 'system',
                            title: payload.title || '系统通知',
                            message: payload.message || '',
                            read: false,
                            createdAt: payload.createdAt || new Date().toISOString(),
                            meta: payload.meta || null,
                        };
                        list.value = [item, ...list.value];
                        unreadCount.value += 1;
                        if (onNew) onNew(item);
                        else if (
                            showPopup &&
                            typeof window !== 'undefined' &&
                            typeof (window as WindowWithMessage).$message?.info === 'function'
                        ) {
                            (window as WindowWithMessage).$message!.info({
                                content: `${item.title}: ${item.message}`,
                                duration: 4,
                            });
                        }
                    }
                } catch (e) {
                    // 解析错误，忽略
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.warn('[WebSocket] 消息解析失败:', e);
                    }
                }
            };

            ws.onclose = (event: CloseEvent) => {
                isConnecting = false;
                ws = null;

                // 1000 = 正常关闭，不需要重连
                // 1001 = 端点离开（如页面关闭），不需要重连
                // 1006 = 异常关闭，需要重连
                if (event.code === 1000 || event.code === 1001) {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.log('[WebSocket] 连接正常关闭:', event.code);
                    }
                    return;
                }

                // 其他情况，延迟重连（避免频繁重连）
                if (shouldReconnect) {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.warn('[WebSocket] 连接异常关闭，5秒后重连:', event.code, event.reason);
                    }
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => {
                        if (shouldReconnect) {
                            connectWs();
                        }
                    }, 5000);
                }
            };

            ws.onerror = (event: Event) => {
                isConnecting = false;
                // 不在这里调用 close()，让浏览器自然处理错误
                // 错误会触发 onclose 事件，在那里处理重连
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.error('[WebSocket] 连接错误:', event);
                }
            };
        } catch (e) {
            isConnecting = false;
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.error('[WebSocket] 创建连接失败:', e);
            }
            // 创建失败也延迟重连
            if (shouldReconnect) {
                if (reconnectTimer) clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(() => {
                    if (shouldReconnect) {
                        connectWs();
                    }
                }, 5000);
            }
        }
    }

    // 供其他页面在新增成功后主动刷新通知列表（避免依赖 WebSocket 才看到新通知）
    const onNotificationListRefresh = () => fetchList();

    onMounted(() => {
        fetchList();
        connectWs();
        window.addEventListener('notification-list-refresh', onNotificationListRefresh);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('notification-list-refresh', onNotificationListRefresh);
        shouldReconnect = false; // 停止重连
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (ws) {
            ws.close(1000, 'Component unmounted'); // 正常关闭
            ws = null;
        }
    });

    return {
        list,
        unreadCount,
        loading,
        fetchList,
        markRead,
        markAllRead,
    };
}
