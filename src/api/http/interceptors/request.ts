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

        // 如果存在 action metadata，添加到 X-Action 请求头用于后端鉴权
        if (config.metadata?.action) {
            config.headers!['X-Action'] = config.metadata.action;
        }

        // 补充请求元数据，用于监控
        config.metadata = {
            ...config.metadata,
            requestId: generateUUID(),
            startTime: Date.now(),
            url: config.url,
            method: config.method,
            page: window.location.pathname,
        };
        return config;
    });
}
