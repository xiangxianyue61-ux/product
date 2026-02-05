import http from '../../../api/http/index';

export function getEmployeeList(params: any) {
    return http.get('/api/users', {
        params,
        metadata: {
            action: 'employee_list',
        },
    });
}
export function getMenuList(params: any) {
    return http.get('/api/menus', {
        params,
        metadata: {
            action: 'menu_list',
        },
    });
}
export function getMenuTree() {
    return http.get('/api/menus/tree', {
        metadata: {
            action: 'menu_tree',
        },
    });
}
export function getRoleList(params: any) {
    return http.get('/api/roles', {
        params,
        metadata: {
            action: 'role_list',
        },
    });
}
export function addEmployeeList(data: any) {
    return http.post('/api/users', data, {
        metadata: {
            action: 'employee_list',
        },
    });
}
export function updateEmployeeList(id: string, data: any) {
    return http.put(`/api/users/${id}`, data, {
        metadata: {
            action: 'employee_list',
        },
    });
}
export function addMenuList(data: any) {
    return http.post('/api/menus', data, {
        metadata: {
            action: 'menu_list',
        },
    });
}
export function updateMenuList(id: string, data: any) {
    return http.put(`/api/menus/${id}`, data, {
        metadata: {
            action: 'menu_list',
        },
    });
}
export function deleteMenuList(id: string) {
    return http.delete(`/api/menus/${id}`, {
        metadata: {
            action: 'menu_list',
        },
    });
}
export function addRoleList(data: any) {
    return http.post('/api/roles', data, {
        metadata: {
            action: 'role_list',
        },
    });
}
export function updateRoleList(id: string, data: any) {
    return http.put(`/api/roles/${id}`, data, {
        metadata: {
            action: 'role_list',
        },
    });
}
export function getSystemProfile() {
    return http.get('/xx/me', {
        metadata: {
            action: 'user_profile',
        },
    });
}
