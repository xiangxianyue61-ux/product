import type { Router } from 'vue-router';

const isLoggedIn = () => {
    const token = localStorage.getItem('access_token');
    return Boolean(token);
};

const setupAuthGuard = (router: Router) => {
    router.beforeEach(to => {
        if (to.path === '/login') {
            return true;
        }
        if (isLoggedIn()) {
            return true;
        }
        return { path: '/login', query: { redirect: to.fullPath } };
    });
};

export { setupAuthGuard };
