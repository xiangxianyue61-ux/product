import { reportApi } from '../../../monitor/report';
import { refreshToken } from '../refresh';

export function setupResponseInterceptor(instance: any) {
    instance.interceptors.response.use(
        (res: any) => {
            const m = res.config.metadata;
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
        async (err: any) => {
            const config = err.config;
            const m = config?.metadata;
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
            if (err.response?.status === 401 && !config._isRetry) {
                config._isRetry = true;

                try {
                    const token = await refreshToken();
                    config.headers.Authorization = token;
                    return instance(config);
                } catch {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(err);
        }
    );
}
