import { createStore } from 'vuex';

export default createStore({
    state: {
        role: localStorage.getItem('role') || '',
        token: localStorage.getItem('access_token') || '',
        isFirstLogin: localStorage.getItem('is_first_login') === 'true',
        menus: JSON.parse(localStorage.getItem('menus') || '[]'),
        permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
    },
    getters: {},
    mutations: {
        login(state, { role, token, isFirstLogin, menus, permissions }) {
            state.role = role;
            state.token = token;
            state.isFirstLogin = !!isFirstLogin;
            state.menus = menus || [];
            state.permissions = permissions || [];
            localStorage.setItem('role', role);
            localStorage.setItem('access_token', token);
            localStorage.setItem('is_first_login', String(!!isFirstLogin));
            localStorage.setItem('menus', JSON.stringify(state.menus));
            localStorage.setItem('permissions', JSON.stringify(state.permissions));
        },
        updateFirstLogin(state, status) {
            state.isFirstLogin = status;
            localStorage.setItem('is_first_login', String(status));
        },
    },
    actions: {},
    modules: {},
});
