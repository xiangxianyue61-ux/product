import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { reportApi } from '../../../monitor/report';
import { refreshToken } from '../refresh';

export function setupResponseInterceptor(instance: AxiosInstance) {
    instance.interceptors.response.use(
        (res: AxiosResponse) => {
            const m = res.config.metadata;
            // 如果有元数据，上报 API 成功状态
            if (m) {
                const end = Date.now();
                reportApi({
                    ...m,
                    endTime: end,
                    duration: end - m.startTime!,
                    status: res.status,
                    success: true,
                });
            }
            return res;
        },
        async (err: AxiosError) => {
            const config = err.config;
            const m = config?.metadata;
            // 如果有元数据，上报 API 失败状态
            if (m) {
                const end = Date.now();
                reportApi({
                    ...m,
                    endTime: end,
                    duration: end - m.startTime!,
                    status: err.response?.status,
                    success: false,
                    errorMsg: err.message,
                });
            }
            // 处理 401 未授权错误，尝试刷新 token
            if (err.response?.status === 401 && !config._isRetry) {
                config._isRetry = true;

                try {
                    // 获取新 token
                    const token = await refreshToken();
                    // 更新请求头
                    config.headers.Authorization = token;
                    // 重试请求
                    return instance(config);
                } catch {
                    // 刷新失败，跳转登录页
                    window.location.href = '/login';
                }
            }
            return Promise.reject(err);
        }
    );
}
