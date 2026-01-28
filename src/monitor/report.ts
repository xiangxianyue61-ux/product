import type { ApiMonitor } from './types';
//设置成功10%的采样率
const SAMPLE_RATE = 0.1;

export function reportApi(data: ApiMonitor) {
    // 开发环境全量上报，生产环境采样
    if (!import.meta.env.DEV && data.success && Math.random() > SAMPLE_RATE) {
        return;
    }

    // 打印日志方便调试
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[API Monitor]', data);
        return;
    }

    // 上报数据
    navigator.sendBeacon('/monitor/api', JSON.stringify(data));
}
