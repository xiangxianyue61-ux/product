import type { ApiMonitor } from '../../monitor/types';

declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: Partial<ApiMonitor>;
        meta?: {
            action?: string;
        };
        _retry?: boolean;
    }
}
