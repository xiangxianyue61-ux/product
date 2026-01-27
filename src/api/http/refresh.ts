import instance from './instance';

let refreshing = false;
let queue: Array<(token: string) => void> = [];

export async function refreshToken() {
    if (refreshing) {
        return new Promise<string>(resolve => {
            queue.push(resolve);
        });
    }

    refreshing = true;

    try {
        const res = await instance.post('/xx/refreshToken');
        const token = res.data.token;

        localStorage.setItem('access_token', token);
        queue.forEach(cb => cb(token));
        queue = [];
        return token;
    } finally {
        refreshing = false;
    }
}
