import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import { generateUUID } from '../../../utils/uuid';

export function setupRequestInterceptor(instance: AxiosInstance) {
    instance.interceptors.request.use((config: AxiosRequestConfig) => {
        console.log('DEV?', import.meta.env.DEV);
        console.log('🔥 request interceptor hit', config.url);
        const token = localStorage.getItem('access_token');

        if (token) {
            config.headers!.Authorization = token;
        }

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
