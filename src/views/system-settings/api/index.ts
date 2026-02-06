import http from '../../../api/http/index';

// 查询参数类型
interface ListQueryParams {
    page?: number;
    pageSize?: number;
    username?: string;
    realName?: string;
    code?: string;
    name?: string;
    [key: string]: unknown;
}

// 员工/用户数据类型
interface EmployeeData {
    realName: string;
    username: string;
    phone: string;
    password?: string;
    role?: string;
    status?: 'active' | 'inactive';
    [key: string]: unknown;
}

// 菜单数据类型
interface MenuData {
    title?: string;
    name?: string;
    path?: string;
    component?: string;
    icon?: string;
    order?: number;
    parentId?: string;
    type?: 'menu' | 'button';
    [key: string]: unknown;
}

// 角色数据类型
interface RoleData {
    name?: string;
    displayName?: string;
    description?: string;
    menus?: string[];
    [key: string]: unknown;
}

export function getEmployeeList(params: ListQueryParams) {
    return http.get('/api/users', {
        params,
        metadata: {
            action: 'employee_list',
        },
    });
}
export function getMenuList(params: ListQueryParams) {
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
export function getRoleList(params: ListQueryParams) {
    return http.get('/api/roles', {
        params,
        metadata: {
            action: 'role_list',
        },
    });
}
export function addEmployeeList(data: EmployeeData) {
    return http.post('/api/users', data, {
        metadata: {
            action: 'employee_list',
        },
    });
}
export function updateEmployeeList(id: string, data: EmployeeData) {
    return http.put(`/api/users/${id}`, data, {
        metadata: {
            action: 'employee_list',
        },
    });
}
export function addMenuList(data: MenuData) {
    return http.post('/api/menus', data, {
        metadata: {
            action: 'menu_list',
        },
    });
}
export function updateMenuList(id: string, data: MenuData) {
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
export function addRoleList(data: RoleData) {
    return http.post('/api/roles', data, {
        metadata: {
            action: 'role_list',
        },
    });
}
export function updateRoleList(id: string, data: RoleData) {
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
