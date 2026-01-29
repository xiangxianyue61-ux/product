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

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers || {});
    headers.set('Content-Type', 'application/json');
    const token = getBearerToken();
    if (token) headers.set('Authorization', token);

    const res = await fetch(input, { ...init, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
}
