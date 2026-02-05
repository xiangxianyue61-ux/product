import { createStore } from 'vuex';

export default createStore({
    state: {
        role: localStorage.getItem('role') || '',
        token: localStorage.getItem('access_token') || '',
        isFirstLogin: localStorage.getItem('is_first_login') === 'true',
    },
    getters: {},
    mutations: {
        login(state, { role, token, isFirstLogin }) {
            state.role = role;
            state.token = token;
            state.isFirstLogin = !!isFirstLogin;
            localStorage.setItem('role', role);
            localStorage.setItem('access_token', token);
            localStorage.setItem('is_first_login', String(!!isFirstLogin));
        },
        updateFirstLogin(state, status) {
            state.isFirstLogin = status;
            localStorage.setItem('is_first_login', String(status));
        },
    },
    actions: {},
    modules: {},
});
