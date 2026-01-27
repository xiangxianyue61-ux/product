import type { ApiMonitor } from './types';
//设置成功10%的采样率
const SAMPLE_RATE = 0.1;
export function reportApi(data: ApiMonitor) {
    //成功请求做采样
    if (data.success && Math.random() > SAMPLE_RATE) {
        return;
    }
    // 失败请求直接上报
    if (import.meta.env.DEV) {
        console.log('[API Monitor]', data);
        return;
    }
    // 非开发环境，使用 sendBeacon 上报数据
    navigator.sendBeacon('/monitor/api', JSON.stringify(data));
}
