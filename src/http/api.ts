import axios from 'axios';

// 创建 axios 实例
const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // 允许携带 cookie（refresh token 必须依赖 cookie）
});

//请求拦截器：自动携带 access token

instance.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');

    // 如果本地有 token，则自动放到请求头中
    if (token) {
        config.headers.Authorization = token; // 形式：Bearer xxx
    }

    return config;
});

//响应拦截器：处理 401（token 过期）

instance.interceptors.response.use(
    res => res, // 正常返回直接放行

    async err => {
        const original = err.config; // 保存原始请求，用于重试
        const accessToken = localStorage.getItem('access_token');

        // 1：本地没有 access_token（未登录 或 access_token 清空）
        //    → 不需要刷新 token，直接跳转登录
        //    （否则会进入无限刷新循环）
        if (!accessToken) {
            window.location.href = '/login';
            return Promise.reject(err);
        }

        // 2：收到 401，表示 access token 过期
        //    → 尝试用 refresh token 去刷新 access token
        //    → 防止无限循环：original._retry 标记只能重试一次
        if (err.response && err.response.status === 401 && !original._retry) {
            original._retry = true; // 标记已重试，避免无限循环

            try {
                // 调用刷新 token 接口
                const res = await instance.post('/xx/refreshToken');

                // 后端返回新的 access token
                const newToken = res.data.token;

                // 存入本地
                localStorage.setItem('access_token', newToken);

                // 更新原始请求头的 token
                original.headers['Authorization'] = newToken;

                // 使用新的 token 重试原始请求（无感刷新）
                return instance(original);
            } catch (err) {
                // ❌ 刷新 token 也失败（refresh token 过期 或 无效）
                //    → 跳转登录页面

                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        // 非 401 错误，直接抛出
        return Promise.reject(err);
    }
);

export default instance;
