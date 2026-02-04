import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import { generateUUID } from '../../../utils/uuid';

// 配置请求拦截器
export function setupRequestInterceptor(instance: AxiosInstance) {
    instance.interceptors.request.use((config: AxiosRequestConfig) => {
        // if (import.meta.env.DEV) {
        //     // eslint-disable-next-line no-console
        //     console.log('🔥 request interceptor hit', config.url);
        // }
        const token = localStorage.getItem('access_token');

        // 如果存在 token，添加到请求头
        if (token) {
            config.headers!.Authorization = token;
        }

        // 初始化请求元数据，用于监控
        config.metadata = {
            requestId: generateUUID(),
            startTime: Date.now(),
            url: config.url,
            method: config.method,
            page: window.location.pathname,
            action: config.meta?.action,
        };
        return config;
    });
}
