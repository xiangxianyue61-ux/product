import { createStore } from 'vuex';

export default createStore({
    state: {
        role: localStorage.getItem('role') || '',
        token: localStorage.getItem('access_token') || '',
        isFirstLogin: localStorage.getItem('is_first_login') === 'true',
        menus: JSON.parse(localStorage.getItem('menus') || '[]'),
    },
    getters: {},
    mutations: {
        login(state, { role, token, isFirstLogin, menus }) {
            state.role = role;
            state.token = token;
            state.isFirstLogin = !!isFirstLogin;
            state.menus = menus || [];
            localStorage.setItem('role', role);
            localStorage.setItem('access_token', token);
            localStorage.setItem('is_first_login', String(!!isFirstLogin));
            localStorage.setItem('menus', JSON.stringify(state.menus));
        },
        updateFirstLogin(state, status) {
            state.isFirstLogin = status;
            localStorage.setItem('is_first_login', String(status));
        },
    },
    actions: {},
    modules: {},
});
