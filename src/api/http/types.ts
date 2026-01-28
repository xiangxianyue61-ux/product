import type { ApiMonitor } from '../../monitor/types';

// 扩展 axios 模块的类型定义
declare module 'axios' {
    export interface AxiosRequestConfig {
        // 用于 API 监控的元数据
        metadata?: Partial<ApiMonitor>;
        // 自定义元数据配置
        meta?: {
            // 操作名称，用于监控或日志
            action?: string;
        };
        // 重试标记，防止无限重试
        _retry?: boolean;
    }
}
