import instance from './instance';

// 是否正在刷新 token 的标记
let refreshing = false;
// 等待刷新完成的请求队列
let queue: Array<(token: string) => void> = [];

// 刷新 token 的函数
export async function refreshToken() {
    // 如果正在刷新，将当前请求加入队列等待
    if (refreshing) {
        return new Promise<string>(resolve => {
            queue.push(resolve);
        });
    }

    refreshing = true;

    try {
        // 发送刷新 token 请求
        const res = await instance.post('/xx/refreshToken');
        const token = res.data.token;

        // 保存新 token
        localStorage.setItem('access_token', token);

        // 执行队列中的回调
        queue.forEach(cb => cb(token));
        queue = [];
        return token;
    } finally {
        refreshing = false;
    }
}
