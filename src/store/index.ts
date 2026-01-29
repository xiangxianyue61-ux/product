import { createStore } from 'vuex';

export default createStore({
    state: {
        role: localStorage.getItem('role') || '',
        token: localStorage.getItem('access_token') || '',
    },
    getters: {},
    mutations: {
        login(state, { role, token }) {
            state.role = role;
            state.token = token;
            localStorage.setItem('role', role);
            localStorage.setItem('access_token', token);
        },
    },
    actions: {},
    modules: {},
});
