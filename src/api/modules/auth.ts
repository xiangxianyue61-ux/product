import http from '../http';
export interface LoginParams {
    username: string;
    password: string;
    remember: boolean;
}

export function login(params: LoginParams) {
    return http.post('/xx/login', params, {
        meta: {
            action: 'user_login',
        },
    });
}
//个人中心重命名
export function profile() {
    return http.get('/xx/me', {
        meta: {
            action: 'user_profile',
        },
    });
}
//修改个人中心信息
export function updateProfile(params: Record<string, unknown>) {
    return http.post('/xx/completesetup', params, {
        meta: {
            action: 'user_update_profile',
        },
    });
}
