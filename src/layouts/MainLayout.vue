<template>
    <a-layout class="h-screen">
        <!-- 顶部导航栏 -->
        <a-layout-header class="!bg-white px-6 shadow-sm z-10 flex items-center justify-between">
            <div class="flex items-center gap-10">
                <div class="flex items-center gap-2 text-lg font-bold text-blue-500">
                    <span class="text-2xl">★</span>
                    <span>生产制造执行平台</span>
                </div>
                <a-menu
                    mode="horizontal"
                    :selected-keys="[activeTopMenu]"
                    class="!border-b-0 !leading-[64px] top-menu-no-collapse"
                    :overflowedIndicator="null"
                    @click="handleTopMenuClick"
                >
                    <!-- <a-menu-item v-for="item in topMenuItems" :key="item.key" :title="item.title">
                        {{ item.title }}
                    </a-menu-item> -->
                    <a-menu-item v-for="item in routerList" :key="item.meta.module" :title="item.meta.title">
                        {{ item.meta.title }}
                    </a-menu-item>
                </a-menu>
            </div>
            <div class="flex items-center">
                <a-space size="middle" align="center">
                    <a-button type="text" :icon="h(DesktopOutlined)" title="数据看板" @click="router.push('/data')" />
                    <a-button type="text" :icon="h(BellOutlined)" />
                    <a-button type="text" :icon="h(MessageOutlined)" />
                    <a-button type="text" :icon="h(FullscreenOutlined)" />
                    <a-dropdown>
                        <a-avatar :size="32" class="cursor-pointer">用</a-avatar>
                        <template #overlay>
                            <a-menu>
                                <a-menu-item @click="router.push('/profile')">个人中心</a-menu-item>
                                <a-menu-item @click="handleLogout">退出登录</a-menu-item>
                            </a-menu>
                        </template>
                    </a-dropdown>
                </a-space>
            </div>
        </a-layout-header>

        <a-layout>
            <!-- 左侧边栏 -->
            <a-layout-sider v-if="showSidebar" class="!bg-white shadow-sm" :width="240" :collapsed="collapsed">
                <div class="h-16 leading-[64px] px-6 text-base font-semibold border-b border-gray-200">
                    {{ currentModuleTitle }}
                </div>
                <a-menu
                    mode="inline"
                    :selected-keys="[activeSideMenu]"
                    :open-keys="openKeys"
                    class="!border-r-0"
                    @click="handleSideMenuClick"
                    @openChange="handleOpenChange"
                >
                    <template v-for="group in sideMenuGroups">
                        <a-sub-menu v-if="group.children" :key="group.key" :title="group.title">
                            <a-menu-item v-for="child in group.children" :key="child.key">
                                {{ child.title }}
                            </a-menu-item>
                        </a-sub-menu>
                        <a-menu-item v-else :key="group.key">
                            {{ group.title }}
                        </a-menu-item>
                    </template>
                </a-menu>
            </a-layout-sider>

            <!-- 主内容区 -->
            <a-layout-content class="bg-[#f0f2f5] overflow-auto">
                <div class="p-6 min-h-[calc(100vh-64px)]">
                    <!-- 面包屑导航 -->
                    <a-breadcrumb class="mb-4" v-if="breadcrumbItems.length > 0">
                        <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path">
                            <router-link v-if="item.path" :to="item.path">
                                {{ item.title }}
                            </router-link>
                            <span v-else>{{ item.title }}</span>
                        </a-breadcrumb-item>
                    </a-breadcrumb>

                    <!-- 路由视图 -->
                    <router-view />
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { BellOutlined, MessageOutlined, FullscreenOutlined, DesktopOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

const collapsed = ref(false);

const routerList = computed(() => {
    const rootRoute = router.options.routes.find(r => r.path === '/');
    if (rootRoute && rootRoute.children) {
        return rootRoute.children.filter(item => {
            if (item.meta?.is_menu) {
                const roles = item.meta.role as string[] | undefined;
                if (!roles || roles.length === 0) return true;
                return roles.includes(store.state.role);
            }
            return false;
        });
    }
});

type SideMenuItem = {
    key: string;
    title: string;
    route?: string;
    children?: SideMenuItem[];
};

// 当前激活的顶部菜单
const activeTopMenu = computed(() => {
    const module = route.meta.module as string;
    return module || 'home';
});

// 当前模块标题
const currentModuleTitle = computed(() => {
    if (!routerList.value) return '首页';
    const item = routerList.value.find(item => item.meta?.module === activeTopMenu.value);
    return (item?.meta?.title as string) || '首页';
});

// 是否显示侧边栏
const showSidebar = computed(() => {
    if (!routerList.value) return false;
    const currentTopMenu = routerList.value.find(item => item.meta?.module === activeTopMenu.value);
    // 如果当前顶部菜单有 children，则显示侧边栏
    return currentTopMenu && currentTopMenu.children && currentTopMenu.children.length > 0;
});

// 侧边栏菜单组
const sideMenuGroups = computed(() => {
    if (!routerList.value) return [] as SideMenuItem[];
    const currentTopMenu = routerList.value.find(item => item.meta?.module === activeTopMenu.value);
    if (!currentTopMenu || !currentTopMenu.children) {
        return [] as SideMenuItem[];
    }

    // 将路由 children 转换为 SideMenuItem 格式
    const mapRoutesToMenu = (routes: any[]): SideMenuItem[] => {
        return routes
            .filter(route => {
                const roles = route.meta?.role as string[] | undefined;
                if (!roles || roles.length === 0) return true;
                return roles.includes(store.state.role);
            })
            .map(route => {
                const hasChildren = route.children && route.children.length > 0;
                return {
                    key: route.name as string, // 使用 name 作为 key
                    title: (route.meta?.title as string) || (route.name as string),
                    route: route.path, // 这里路径可能需要根据实际情况处理，但在 name 跳转模式下不关键
                    children: hasChildren ? mapRoutesToMenu(route.children) : undefined,
                };
            });
    };

    return mapRoutesToMenu(currentTopMenu.children);
});

// 当前激活的侧边栏菜单
const activeSideMenu = computed(() => {
    return route.name as string;
});

// 展开的菜单项
const openKeys = ref<string[]>([]);

// 监听路由变化，自动展开对应菜单
watch(
    () => route.path,
    () => {
        const module = route.meta.module as string;
        if (module) {
            // 简单的自动展开逻辑：展开所有父级菜单
            // 由于这里是扁平化路由转树形，或者直接是树形
            // 我们需要找到当前路由的父级 name
            // 这里的实现可能需要根据具体路由结构优化
            // 暂时保持之前的 ensureOpenKeys 逻辑或者根据 currentTopMenu 遍历查找

            // 重新实现的自动展开逻辑
            const findParentKeys = (routes: any[], targetName: string, parents: string[] = []): string[] | null => {
                for (const r of routes) {
                    if (r.name === targetName) {
                        return parents;
                    }
                    if (r.children && r.children.length > 0) {
                        const result = findParentKeys(r.children, targetName, [...parents, r.name]);
                        if (result) return result;
                    }
                }
                return null;
            };

            if (routerList.value) {
                const currentTopMenu = routerList.value.find(item => item.meta?.module === activeTopMenu.value);
                if (currentTopMenu && currentTopMenu.children) {
                    const parents = findParentKeys(currentTopMenu.children, route.name as string);
                    if (parents && parents.length > 0) {
                        openKeys.value = [...new Set([...openKeys.value, ...parents])];
                    }
                }
            }
        }
    },
    { immediate: true }
);

// 面包屑导航
const breadcrumbItems = computed(() => {
    const items: Array<{ title: string; path?: string }> = [];
    const module = route.meta.module as string;

    if (module && routerList.value) {
        const moduleItem = routerList.value.find(item => item.meta?.module === module);
        if (moduleItem) {
            items.push({ title: moduleItem.meta?.title as string });
        }
    }

    if (route.meta.title) {
        items.push({ title: route.meta.title as string });
    }

    return items;
});

// 处理顶部菜单点击
const handleTopMenuClick = (e: { key: string }) => {
    // key is module name
    if (!routerList.value) return;
    const item = routerList.value.find(item => item.meta?.module === e.key);
    if (item) {
        if (item.children && item.children.length > 0) {
            // Find first leaf child
            const findFirstLeaf = (routes: any[]): any => {
                for (const route of routes) {
                    // 权限检查
                    const roles = route.meta?.role as string[] | undefined;
                    if (roles && roles.length > 0 && !roles.includes(store.state.role)) {
                        continue;
                    }

                    if (!route.children || route.children.length === 0) {
                        return route;
                    }
                    const child = findFirstLeaf(route.children);
                    if (child) return child;
                }
                return null;
            };
            const firstChild = findFirstLeaf(item.children);
            if (firstChild && firstChild.name) {
                router.push({ name: firstChild.name });
            } else {
                // Fallback
                router.push(item.path);
            }
        } else {
            router.push(item.path);
        }
    }
};

// 处理侧边栏菜单点击
const handleSideMenuClick = (e: { key: string }) => {
    // 如果 key 是 undefined 或空字符串，直接返回，避免报错
    if (!e.key) return;

    // 这里的 key 是 route name
    router.push({ name: e.key }).catch(err => {
        // Ignore redundant navigation errors
        if (err.name !== 'NavigationDuplicated') {
            console.error(err);
        }
    });
};

// 处理菜单展开/收起
const handleOpenChange = (keys: string[]) => {
    openKeys.value = keys;
};

const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
};

const ensureOpenKeys = (keys: string[]) => {
    openKeys.value = Array.from(new Set([...openKeys.value, ...keys]));
};

// watch(
//     () => route.path,
//     () => {
//         if (route.path.includes('material-')) {
//             ensureOpenKeys(['material-modeling']);
//         } else if (route.path.includes('process-') && !route.path.includes('process-flow-card')) {
//             ensureOpenKeys(['process-management']);
//         } else if (
//             route.path.includes('production-gantt') ||
//             route.path.includes('process-gantt') ||
//             route.path.includes('workshop-gantt') ||
//             route.path.includes('work-order-gantt')
//         ) {
//             ensureOpenKeys(['production-gantt']);
//         } else if (route.path.includes('production-reporting') || route.path.includes('reporting-records')) {
//             ensureOpenKeys(['production-reporting']);
//         } else if (route.path.includes('achievement-rate') || route.path.includes('on-time-rate')) {
//             ensureOpenKeys(['production-reports']);
//         } else if (route.path.includes('quality-management')) {
//             if (route.path.includes('inspection-')) {
//                 ensureOpenKeys(['quality-modeling']);
//             } else if (route.path.includes('handling-')) {
//                 ensureOpenKeys(['non-conforming']);
//             }
//         } else if (route.path.includes('equipment-management')) {
//             if (route.path.includes('equipment-') || route.path.includes('spare-parts-')) {
//                 ensureOpenKeys(['equipment-management', 'spare-parts']);
//             }
//         } else if (route.path.includes('warehouse-management')) {
//             if (route.path.includes('warehouse-')) {
//                 ensureOpenKeys(['warehouse-settings']);
//             }
//         } else if (route.path.includes('system-settings')) {
//             if (
//                 route.path.includes('department-') ||
//                 route.path.includes('position-') ||
//                 route.path.includes('employee-') ||
//                 route.path.includes('supplier-') ||
//                 route.path.includes('customer-')
//             ) {
//                 ensureOpenKeys(['org-structure']);
//             } else if (route.path.includes('role-') || route.path.includes('user-') || route.path.includes('menu-')) {
//                 ensureOpenKeys(['permission-management']);
//             } else if (
//                 route.path.includes('production-team') ||
//                 route.path.includes('work-calendar') ||
//                 route.path.includes('scheduling-plan')
//             ) {
//                 ensureOpenKeys(['production-config']);
//             }
//         }
//     },
//     { immediate: true }
// );
</script>

<style scoped>
/* 取消顶部菜单折叠功能 */
:deep(.top-menu-no-collapse .ant-menu-overflow-item-rest) {
    display: none !important;
}

:deep(.top-menu-no-collapse .ant-menu-item) {
    display: inline-block !important;
}

:deep(.top-menu-no-collapse) {
    white-space: nowrap;
    overflow: visible !important;
}
</style>
