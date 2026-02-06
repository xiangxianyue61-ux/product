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
                    <a-menu-item v-for="item in topMenuItems" :key="item.key" :title="item.title">
                        {{ item.title }}
                    </a-menu-item>
                </a-menu>
            </div>
            <div class="flex items-center">
                <a-space size="middle" align="center">
                    <a-button type="text" :icon="h(DesktopOutlined)" title="数据看板" @click="router.push('/data')" />
                    <a-button type="text" :icon="h(BellOutlined)" title="初始化菜单" @click="handleInitAllMenus" />
                    <a-button type="text" :icon="h(MessageOutlined)" />
                    <a-button type="text" :icon="h(FullscreenOutlined)" />
                    <a-dropdown>
                        <a-avatar :size="32" class="cursor-pointer">用</a-avatar>
                        <template #overlay>
                            <a-menu>
                                <a-menu-item @click="router.push({ name: 'Profile' })">个人中心</a-menu-item>
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
                        <a-sub-menu v-if="group.children" :key="`${group.key}-sub`" :title="group.title">
                            <a-menu-item v-for="child in group.children" :key="child.key">
                                {{ child.title }}
                            </a-menu-item>
                        </a-sub-menu>
                        <a-menu-item v-else :key="`${group.key}-item`">
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
                    <router-view :key="$route.fullPath" />
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { BellOutlined, MessageOutlined, FullscreenOutlined, DesktopOutlined } from '@ant-design/icons-vue';

import { addMenuList } from '../views/system-settings/api/index';
import { message } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();
const store = useStore<{ role: string; menus?: string[] }>();

const collapsed = ref(false);

// 模拟初始化所有菜单
const handleInitAllMenus = async () => {
    if (!confirm('确定要初始化所有菜单数据吗？这将向数据库添加大量数据。')) return;

    // 扁平化 staticMenus
    interface MenuItem {
        title: string;
        name: string;
        path: string;
        component: string;
        icon: string;
        type: 'menu' | 'button';
        isRoute: boolean;
        sort: number;
        [key: string]: unknown;
    }
    const allMenus: MenuItem[] = [];

    // 1. 处理静态定义菜单
    for (const [, groups] of Object.entries(staticMenus)) {
        for (const group of groups) {
            // 添加一级/二级菜单（分组）
            // 这里简化处理：我们只关心叶子节点对应的路由，以及它们的层级结构
            // 但为了完整性，我们应该尽量还原结构

            if (group.children) {
                // 这是一个分组（二级菜单）
                // 构造分组数据（虽然它可能不是一个真实路由，但在菜单表中需要存在以构建树）
                // 注意：这里我们主要关注"路由菜单"。如果分组只是纯UI分组，可能不需要存入数据库
                // 除非前端侧边栏是完全动态生成的。
                // 根据用户需求，他是想"添加一个所有路由页面的menu"，目的是让权限系统能选到这些页面

                for (const child of group.children) {
                    // 查找路由定义
                    const routeDef = router.getRoutes().find(r => r.name === child.key);
                    if (routeDef) {
                        allMenus.push({
                            title: child.title,
                            name: child.key,
                            path: routeDef.path,
                            component: 'layouts/RouteView', // 简化
                            icon: 'AppstoreOutlined',
                            type: 'menu',
                            isRoute: true,
                            sort: 0,
                        });
                    }
                }
            } else {
                // 这是一个直接的菜单项
                const routeDef = router.getRoutes().find(r => r.name === group.key);
                if (routeDef) {
                    allMenus.push({
                        title: group.title,
                        name: group.key,
                        path: routeDef.path,
                        component: 'layouts/RouteView',
                        icon: 'AppstoreOutlined',
                        type: 'menu',
                        isRoute: true,
                        sort: 0,
                    });
                }
            }
        }
    }

    // 2. 补充其他未在 staticMenus 中的路由（如 SystemSettings 下的）
    // 简单起见，我们遍历 router.getRoutes()
    const routes = router.getRoutes();

    for (const r of routes) {
        // 只处理有 title 的路由，且排除一些基础路由
        if (r.meta?.title && !['Login', 'Home', 'Data'].includes(r.name as string)) {
            // 检查是否已添加
            if (!allMenus.find(m => m.name === r.name)) {
                allMenus.push({
                    title: r.meta.title as string,
                    name: r.name as string,
                    path: r.path,
                    component: 'layouts/RouteView',
                    icon: 'AppstoreOutlined',
                    type: 'menu',
                    isRoute: true,
                    sort: 0,
                });
            }
        }
    }

    try {
        let successCount = 0;
        for (const menu of allMenus) {
            // 尝试添加，如果已存在（name重复）后端可能会报错，忽略错误继续
            try {
                const res = await addMenuList(menu);
                if (res.data.success) successCount++;
            } catch (e) {
                console.log(`Skip ${menu.name}`);
            }
        }
        message.success(`操作完成，成功添加 ${successCount} 个菜单`);
    } catch (error) {
        console.error(error);
        message.error('初始化失败');
    }
};

const routerList = computed(() => {
    const rootRoute = router.options.routes.find(r => r.path === '/');
    const children = rootRoute && 'children' in rootRoute ? rootRoute.children : undefined;
    return (children ?? []).filter(item => {
        if (item.meta?.is_menu) {
            const roles = item.meta.role as string[] | undefined;
            if (!roles || roles.length === 0) return true;
            return roles.includes(store.state.role);
        }
        return false;
    });
});

type TopMenuItem = { key: string; title: string };

// 顶部菜单（只取 routerList 里有 module 的项；用于模板渲染，避免 meta 为空导致 TS 报错）
const topMenuItems = computed<TopMenuItem[]>(() => {
    return routerList.value
        .filter(r => typeof r.meta?.module === 'string')
        .map(r => ({
            key: String(r.meta?.module),
            title: String(r.meta?.title ?? r.name ?? r.meta?.module),
        }));
});

type SideMenuItem = {
    key: string;
    title: string;
    route?: string;
    children?: SideMenuItem[];
};

// 静态菜单定义 (使用 Route Name 作为 key)
const staticMenus: Record<string, SideMenuItem[]> = {
    'technical-process': [
        {
            key: 'material-modeling',
            title: '物料建模',
            children: [
                { key: 'MaterialManagement', title: '物料管理' },
                { key: 'MaterialUnit', title: '物料单位' },
                { key: 'MaterialType', title: '物料类型' },
                { key: 'ManufacturingMethod', title: '制造方式' },
            ],
        },
        { key: 'ProductBOM', title: '产品BOM' },
        {
            key: 'process-management-group',
            title: '工艺管理',
            children: [
                { key: 'ProcessWorkshop', title: '工序车间' },
                { key: 'ProcessingProcess', title: '加工工序' },
                { key: 'ProcessRoute', title: '工艺路线' },
            ],
        },
        { key: 'ProcessFlowCard', title: '工艺流转卡' },
    ],
    'planning-management': [
        { key: 'SalesOrder', title: '销售订单' },
        { key: 'ProductionPlan', title: '生产计划' },
        { key: 'PlanningGantt', title: '计划甘特图' },
    ],
    'production-management': [
        { key: 'WorkOrder', title: '生产工单' },
        {
            key: 'production-gantt',
            title: '生产甘特图',
            children: [
                { key: 'ProcessGantt', title: '工序甘特图' },
                { key: 'WorkshopGantt', title: '车间甘特图' },
                { key: 'WorkOrderGantt', title: '工单甘特图' },
            ],
        },
        {
            key: 'production-reporting',
            title: '生产报工',
            children: [
                { key: 'ProductionReporting', title: '生产报工' },
                { key: 'ReportingRecords', title: '报工记录' },
            ],
        },
        {
            key: 'production-reports',
            title: '生产报表',
            children: [
                { key: 'AchievementRate', title: '生产达成率' },
                { key: 'OnTimeRate', title: '生产准时率' },
            ],
        },
    ],
    'quality-management': [
        {
            key: 'quality-modeling',
            title: '质量建模',
            children: [
                { key: 'QualityInspectionItem', title: '检验项目' },
                { key: 'QualityInspectionStandard', title: '检验标准' },
            ],
        },
        { key: 'IncomingInspection', title: '来料检验' },
        { key: 'InProcessInspection', title: '过程检验' },
        { key: 'FinalInspection', title: '最终检验' },
        {
            key: 'non-conforming',
            title: '不合格品处理',
            children: [
                { key: 'HandlingMethod', title: '处理方式' },
                { key: 'HandlingRecord', title: '处理记录' },
            ],
        },
        { key: 'ProductTraceability', title: '产品追溯' },
    ],
    'anomaly-management': [
        { key: 'AnomalyCategory', title: '异常分类' },
        { key: 'AnomalyLevel', title: '异常等级' },
        { key: 'AnomalyManagementPage', title: '异常管理' },
    ],
    'equipment-management': [
        {
            key: 'equipment-management-group',
            title: '设备管理',
            children: [
                { key: 'EquipmentFile', title: '设备档案' },
                { key: 'EquipmentData', title: '设备数据' },
                { key: 'EquipmentScrapping', title: '设备报废' },
                { key: 'EquipmentRepair', title: '设备维修' },
                { key: 'EquipmentMaintenance', title: '设备保养' },
                { key: 'EquipmentInspection', title: '设备巡检点检' },
            ],
        },
        {
            key: 'spare-parts',
            title: '备品备件管理',
            children: [
                { key: 'SparePartsFile', title: '备品备件档案' },
                { key: 'SparePartsIssue', title: '备品备件领用归还' },
                { key: 'SparePartsScrapping', title: '备品备件报废' },
            ],
        },
    ],
    'warehouse-management': [
        {
            key: 'warehouse-settings',
            title: '仓库设置',
            children: [
                { key: 'WarehouseBuilding', title: '仓库建模' },
                { key: 'WarehouseArea', title: '库区建模' },
                { key: 'WarehouseLocation', title: '库位建模' },
            ],
        },
        { key: 'CurrentInventory', title: '库存现有量' },
        { key: 'PurchaseInbound', title: '采购入库' },
        { key: 'ProductionRequisition', title: '生产领料' },
        { key: 'ProductionReturn', title: '生产退料' },
        { key: 'ProductOutbound', title: '产品出库' },
        { key: 'TransferAllocation', title: '转移调拨' },
        { key: 'CodingManagement', title: '赋码管理' },
        { key: 'SNCodeManagement', title: 'SN码管理' },
    ],
    'task-management': [
        { key: 'TaskAllTodo', title: '全部待办' },
        { key: 'MyTodo', title: '我的待办' },
        { key: 'MyInitiated', title: '我发起的' },
        { key: 'MyProcessed', title: '我处理的' },
    ],
    'process-management': [
        { key: 'ProcessModel', title: '流程模型' },
        { key: 'BusinessForm', title: '业务表单' },
        { key: 'FormConfig', title: '表单配置' },
        { key: 'RouteData', title: '路由数据' },
    ],
    'system-settings': [
        {
            title: '组织架构',
            key: 'org-structure',
            children: [
                { key: 'DepartmentInfo', title: '部门信息' },
                { key: 'PositionInfo', title: '职位信息' },
                { key: 'EmployeeInfo', title: '员工信息' },
                { key: 'SupplierManagement', title: '供应商管理' },
                { key: 'CustomerManagement', title: '客户管理' },
            ],
        },
        {
            title: '权限管理',
            key: 'permission-management',
            children: [
                { key: 'RoleManagement', title: '角色管理' },
                { key: 'UserManagement', title: '用户管理' },
                { key: 'MenuManagement', title: '菜单管理' },
            ],
        },
        {
            title: '生产配置',
            key: 'production-config',
            children: [
                { key: 'ProductionTeam', title: '生产班组' },
                { key: 'WorkCalendar', title: '工作日历' },
                { key: 'SchedulingPlan', title: '排班计划' },
            ],
        },
        {
            title: '字典管理',
            key: 'dictionary-management-group',
            children: [{ key: 'DictionaryManagement', title: '字典管理' }],
        },
        {
            title: '编码规则',
            key: 'coding-rules-group',
            children: [{ key: 'CodingRules', title: '编码规则' }],
        },
        {
            title: '个人中心',
            key: 'profile-group',
            children: [{ key: 'Profile', title: '个人中心' }],
        },
    ],
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
    const currentModule = activeTopMenu.value;
    const staticMenu = staticMenus[currentModule];

    // 递归过滤菜单，检查权限
    const filterMenu = (items: SideMenuItem[]): SideMenuItem[] => {
        return items
            .map(item => {
                // 如果是组，递归过滤子项
                if (item.children && item.children.length > 0) {
                    const filteredChildren = filterMenu(item.children);
                    if (filteredChildren.length > 0) {
                        // 如果只有一个子菜单，且该子菜单是叶子节点（没有子菜单），则直接展示该子菜单，不展示父级分组
                        if (filteredChildren.length === 1) {
                            const only = filteredChildren[0];
                            if (only && (!only.children || only.children.length === 0)) return only;
                        }
                        return { ...item, children: filteredChildren };
                    }
                    // 如果子项都被过滤了，组也不显示
                    return null;
                }

                // 如果是叶子节点，检查路由权限
                // item.key 是 Route Name
                const allRoutes = router.getRoutes();
                const targetRoute = allRoutes.find(r => r.name === item.key);

                // 1. 超级管理员拥有所有权限
                if (store.state.role === 'admin') {
                    return item;
                }

                // 2. 检查动态菜单权限 (menus 包含允许的路由 name)
                const allowedMenus = store.state.menus || [];
                if (allowedMenus.includes(item.key)) {
                    return item;
                }

                // 3. 兼容旧的 meta.role 权限配置
                if (targetRoute) {
                    const roles = targetRoute.meta?.role as string[] | undefined;
                    if (!roles || roles.length === 0 || roles.includes(store.state.role)) {
                        // 如果只配置了 role 而没有配置动态菜单（可能是旧数据），暂时允许
                        // 但为了严格控制，建议以 allowedMenus 为准。
                        // 这里保留兼容性，但如果 allowedMenus 有值且不包含该项，理论上应该隐藏？
                        // 策略：如果 allowedMenus 为空（未启用动态权限），则走 meta.role。
                        // 如果 allowedMenus 不为空，则必须匹配 allowedMenus。
                        if (allowedMenus.length === 0) return item;
                        return null;
                    }
                } else {
                    // 如果找不到路由定义（可能是纯分组标题，但上面已经处理了 children），或者是无效链接
                    // 这里假设叶子节点必须对应路由
                    // 如果 key 只是一个普通字符串不是路由名，且没有 children，则隐藏
                    // 除非是 'group-' 开头的纯展示项？不，静态定义里叶子都是路由
                    // 允许没有路由定义的项显示吗？暂时不允许，以免点击报错
                    return null;
                }

                return null;
            })
            .filter(Boolean) as SideMenuItem[];
    };

    if (staticMenu) {
        return filterMenu(staticMenu);
    }

    // Fallback: 如果没有静态定义，使用之前的动态生成逻辑
    if (!routerList.value) return [] as SideMenuItem[];
    const currentTopMenu = routerList.value.find(item => item.meta?.module === activeTopMenu.value);
    if (!currentTopMenu || !currentTopMenu.children) {
        return [] as SideMenuItem[];
    }

    // 将路由 children 转换为 SideMenuItem 格式
    interface RouteItem {
        name?: string | symbol;
        path: string;
        meta?: { title?: string; role?: string[] };
        children?: RouteItem[];
    }
    const mapRoutesToMenu = (routes: RouteItem[]): SideMenuItem[] => {
        return routes
            .filter(route => {
                const roles = route.meta?.role as string[] | undefined;
                if (!roles || roles.length === 0) return true;
                return roles.includes(store.state.role);
            })
            .map(route => {
                const hasChildren = route.children && route.children.length > 0;
                // 对子路由进行递归处理和过滤
                const processedChildren = hasChildren ? mapRoutesToMenu(route.children ?? []) : undefined;
                // 如果有子路由但经过过滤后没有有效的子菜单，则视为无子菜单（或根据需求决定是否显示父级）
                const finalChildren = processedChildren && processedChildren.length > 0 ? processedChildren : undefined;
                const name = String(route.name ?? route.path);

                return {
                    key: name, // 使用 name 作为 key（缺省则用 path）
                    title: (route.meta?.title as string) || name,
                    route: route.path, // 这里路径可能需要根据实际情况处理，但在 name 跳转模式下不关键
                    children: finalChildren,
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
            interface RouteItem {
                name?: string | symbol;
                children?: RouteItem[];
            }
            const findParentKeys = (
                routes: RouteItem[],
                targetName: string,
                parents: string[] = []
            ): string[] | null => {
                for (const r of routes) {
                    if (r.name === targetName) {
                        return parents;
                    }
                    if (r.children && r.children.length > 0) {
                        const nextParents = r.name ? [...parents, String(r.name)] : parents;
                        const result = findParentKeys(r.children, targetName, nextParents);
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
            interface RouteItem {
                name?: string | symbol;
                meta?: { role?: string[] };
                children?: RouteItem[];
                path?: string;
            }
            const findFirstLeaf = (routes: RouteItem[]): RouteItem | null => {
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
                if (item.name) {
                    router.push({ name: item.name });
                } else {
                    router.push(item.path);
                }
            }
        } else {
            if (item.name) {
                router.push({ name: item.name });
            } else {
                router.push(item.path);
            }
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
