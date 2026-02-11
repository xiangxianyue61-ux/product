import type { App } from 'vue';
import store from '../store';
import router from '../router';

/**
 * 权限指令 v-action
 * 使用方式：
 * 1. 默认检查当前路由：<a-button v-action="'POST'">新增</a-button>
 * 2. 指定资源检查：<a-button v-action:user-manage="'POST'">新增用户</a-button>
 *
 * 逻辑：
 * 1. 如果是超级管理员 (admin)，永远显示。
 * 2. 获取当前资源标识（Resource Key）：
 *    - 如果指令有参数 (arg)，则使用参数作为 Resource Key。
 *    - 如果没有参数，尝试获取当前路由的 Name 作为 Resource Key。
 * 3. 在 store.permissions 中查找该 Resource Key 的配置。
 * 4. 如果没找到配置 -> 默认有权限 (显示)。
 * 5. 如果找到配置 -> 检查 value (方法名, 如 'POST') 是否在 methods 列表中。
 *    - 在 -> 显示
 *    - 不在 -> 移除元素/隐藏
 */
export const action = {
    mounted(el: HTMLElement, binding: any) {
        const { value, arg } = binding;
        const method = value ? value.toUpperCase() : 'GET';

        // 1. Admin bypass
        const role = store.state.role;
        if (role === 'admin') return;

        // 2. Determine Resource Key
        let resourceKey = arg;
        if (!resourceKey) {
            const currentRoute = router.currentRoute.value;
            resourceKey = currentRoute.name as string;
        }

        if (!resourceKey) {
            // console.warn('v-action: No resource key determined.');
            return;
        }

        // 3. Find Permission Config
        const permissions = (store.state as any).permissions || [];
        const config = permissions.find((p: any) => p.resource === resourceKey);

        // 4. Check logic
        // "如果查询不到就是正常方法都可以使用"
        if (!config) {
            return;
        }

        // 5. If config exists, strict check
        const allowedMethods = config.methods || [];
        if (!allowedMethods.includes(method)) {
            // No permission
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            } else {
                el.style.display = 'none';
            }
        }
    },
};

export default {
    install(app: App) {
        app.directive('action', action);
    },
};
