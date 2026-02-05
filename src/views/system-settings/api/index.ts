import http from '../../../api/http';

export function getEmployeeList(params: any) {
    return http.get('/api/users', {
        params,
        meta: {
            action: 'employee_list',
        },
    });
}
export function getMenuList(params: any) {
    return http.get('/api/menus', {
        params,
        meta: {
            action: 'menu_list',
        },
    });
}
export function getMenuTree() {
    return http.get('/api/menus/tree', {
        meta: {
            action: 'menu_tree',
        },
    });
}
export function getRoleList(params: any) {
    return http.get('/api/roles', {
        params,
        meta: {
            action: 'role_list',
        },
    });
}
export function addEmployeeList(data: any) {
    return http.post('/api/users', data, {
        meta: {
            action: 'employee_list',
        },
    });
}
export function updateEmployeeList(id: string, data: any) {
    return http.put(`/api/users/${id}`, data, {
        meta: {
            action: 'employee_list',
        },
    });
}
export function addMenuList(data: any) {
    return http.post('/api/menus', data, {
        meta: {
            action: 'menu_list',
        },
    });
}
export function addRoleList(data: any) {
    return http.post('/api/roles', data, {
        meta: {
            action: 'role_list',
        },
    });
}
export function updateRoleList(id: string, data: any) {
    return http.put(`/api/roles/${id}`, data, {
        meta: {
            action: 'role_list',
        },
    });
}
export function getSystemProfile() {
    return http.get('/xx/me', {
        meta: {
            action: 'user_profile',
        },
    });
}
