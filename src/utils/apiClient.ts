export type ApiResult<T> = { success: boolean; data: T };

export type ListResult<T> = {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
};

function getBearerToken() {
    const raw = localStorage.getItem('access_token');
    if (!raw) return null;
    // 兼容旧逻辑：有些代码可能直接存了 token 或存了 Bearer token
    if (raw.startsWith('Bearer ')) return raw;
    return `Bearer ${raw}`;
}

/** 清除登录态并跳转登录页（401 时调用，base 为 /product/） */
function clearAuthAndRedirectToLogin() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_token_expires_at');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token_expires_at');
    const base = import.meta.env.BASE_URL || '/product/';
    const loginPath = base.replace(/\/$/, '') + '/login';
    window.location.href = loginPath;
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers || {});
    const method = (init?.method || 'GET').toUpperCase();
    // 仅在需要时设置 Content-Type，避免触发不必要的预检请求（CORS preflight）
    if (method !== 'GET' && method !== 'HEAD') {
        headers.set('Content-Type', 'application/json');
    }
    const token = getBearerToken();
    if (token) headers.set('Authorization', token);

    // 避免浏览器/代理缓存导致“操作后不立即更新”
    const res = await fetch(input, { cache: 'no-store', ...init, headers });

    if (res.status === 401) {
        clearAuthAndRedirectToLogin();
        throw new Error('未登录或登录已过期，请重新登录');
    }

    const text = await res.text();
    let data: unknown = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // 非 JSON 响应忽略
    }

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && 'message' in data && String((data as { message?: string }).message)) ||
            (data && typeof data === 'object' && 'error' in data && String((data as { error?: string }).error)) ||
            `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return (data ?? {}) as T;
}
