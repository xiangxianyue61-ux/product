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
                    <!-- <a-menu-item v-for="item in routerList" :key="item.path" :title="item.meta.title">
                        {{ item.meta.title }}
                    </a-menu-item> -->
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
                        <a-sub-menu v-if="group.children" :key="`sub-${group.key}`" :title="group.title">
                            <a-menu-item v-for="child in group.children" :key="child.key">
                                {{ child.title }}
                            </a-menu-item>
                        </a-sub-menu>
                        <a-menu-item v-else :key="`item-${group.key}`">
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
import { onMounted } from 'vue';
import { BellOutlined, MessageOutlined, FullscreenOutlined, DesktopOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();

const collapsed = ref(false);

const routerList = computed(() => {
    let totalRouterList = router.getRoutes();
    return totalRouterList.filter(item => {
        if (item.meta.is_menu) {
            return true;
        }
    });
});

type SideMenuItem = {
    key: string;
    title: string;
    route?: string;
    children?: SideMenuItem[];
};

// 顶部菜单项
const topMenuItems = [
    { key: 'home', title: '首页', route: '/home' },
    { key: 'technical-process', title: '技术工艺', route: '/technical-process/material-unit' },
    { key: 'planning-management', title: '计划管理', route: '/planning-management/sales-order' },
    { key: 'production-management', title: '生产管理', route: '/production-management/work-order' },
    { key: 'quality-management', title: '质量管理', route: '/quality-management/inspection-item' },
    { key: 'anomaly-management', title: '异常管理', route: '/anomaly-management/category' },
    { key: 'equipment-management', title: '设备管理', route: '/equipment-management/equipment-file' },
    { key: 'warehouse-management', title: '仓库管理', route: '/warehouse-management/warehouse-building' },
    { key: 'task-management', title: '任务管理', route: '/task-management/all-todo' },
    { key: 'process-management', title: '流程管理', route: '/process-management/process-model' },
    { key: 'system-settings', title: '系统设置', route: '/system-settings/department-info' },
];

// 侧边栏菜单组（技术工艺模块）
const technicalProcessMenu: SideMenuItem[] = [
    {
        key: 'material-modeling',
        title: '物料建模',
        children: [
            { key: 'material-management', title: '物料管理', route: '/technical-process/material-management' },
            { key: 'material-unit', title: '物料单位', route: '/technical-process/material-unit' },
            { key: 'material-type', title: '物料类型', route: '/technical-process/material-type' },
            { key: 'manufacturing-method', title: '制造方式', route: '/technical-process/manufacturing-method' },
        ],
    },
    {
        key: 'product-bom',
        title: '产品BOM',
        route: '/technical-process/product-bom',
    },
    {
        key: 'process-management',
        title: '工艺管理',
        children: [
            { key: 'process-workshop', title: '工序车间', route: '/technical-process/process-workshop' },
            { key: 'processing-process', title: '加工工序', route: '/technical-process/processing-process' },
            { key: 'process-route', title: '工艺路线', route: '/technical-process/process-route' },
        ],
    },
    {
        key: 'process-flow-card',
        title: '工艺流转卡',
        route: '/technical-process/process-flow-card',
    },
];

// 当前激活的顶部菜单
const activeTopMenu = computed(() => {
    const module = route.meta.module as string;
    return module || 'home';
});

// 当前模块标题
const currentModuleTitle = computed(() => {
    const item = topMenuItems.find(item => item.key === activeTopMenu.value);
    return item?.title || '首页';
});

// 计划管理菜单
const planningManagementMenu: SideMenuItem[] = [
    { key: 'sales-order', title: '销售订单', route: '/planning-management/sales-order' },
    { key: 'production-plan', title: '生产计划', route: '/planning-management/production-plan' },
    { key: 'planning-gantt', title: '计划甘特图', route: '/planning-management/planning-gantt' },
];

// 生产管理菜单
const productionManagementMenu: SideMenuItem[] = [
    { key: 'work-order', title: '生产工单', route: '/production-management/work-order' },
    {
        key: 'production-gantt',
        title: '生产甘特图',
        children: [
            { key: 'process-gantt', title: '工序甘特图', route: '/production-management/process-gantt' },
            { key: 'workshop-gantt', title: '车间甘特图', route: '/production-management/workshop-gantt' },
            { key: 'work-order-gantt', title: '工单甘特图', route: '/production-management/work-order-gantt' },
        ],
    },
    {
        key: 'production-reporting',
        title: '生产报工',
        children: [
            { key: 'production-reporting', title: '生产报工', route: '/production-management/production-reporting' },
            { key: 'reporting-records', title: '报工记录', route: '/production-management/reporting-records' },
        ],
    },
    {
        key: 'production-reports',
        title: '生产报表',
        children: [
            { key: 'achievement-rate', title: '生产达成率', route: '/production-management/achievement-rate' },
            { key: 'on-time-rate', title: '生产准时率', route: '/production-management/on-time-rate' },
        ],
    },
];

const qualityManagementMenu: SideMenuItem[] = [
    {
        key: 'quality-modeling',
        title: '质量建模',
        children: [
            { key: 'inspection-item', title: '检验项目', route: '/quality-management/inspection-item' },
            { key: 'inspection-standard', title: '检验标准', route: '/quality-management/inspection-standard' },
        ],
    },
    { key: 'incoming-inspection', title: '来料检验', route: '/quality-management/incoming-inspection' },
    { key: 'in-process-inspection', title: '过程检验', route: '/quality-management/in-process-inspection' },
    { key: 'final-inspection', title: '最终检验', route: '/quality-management/final-inspection' },
    {
        key: 'non-conforming',
        title: '不合格品处理',
        children: [
            { key: 'handling-method', title: '处理方式', route: '/quality-management/handling-method' },
            { key: 'handling-record', title: '处理记录', route: '/quality-management/handling-record' },
        ],
    },
    { key: 'product-traceability', title: '产品追溯', route: '/quality-management/product-traceability' },
];

const anomalyManagementMenu: SideMenuItem[] = [
    { key: 'category', title: '异常分类', route: '/anomaly-management/category' },
    { key: 'level', title: '异常等级', route: '/anomaly-management/level' },
    { key: 'anomaly-management', title: '异常管理', route: '/anomaly-management/anomaly-management' },
];

const equipmentManagementMenu: SideMenuItem[] = [
    {
        key: 'equipment-management',
        title: '设备管理',
        children: [
            { key: 'equipment-file', title: '设备档案', route: '/equipment-management/equipment-file' },
            { key: 'equipment-data', title: '设备数据', route: '/equipment-management/equipment-data' },
            { key: 'equipment-scrapping', title: '设备报废', route: '/equipment-management/equipment-scrapping' },
            { key: 'equipment-repair', title: '设备维修', route: '/equipment-management/equipment-repair' },
            { key: 'equipment-maintenance', title: '设备保养', route: '/equipment-management/equipment-maintenance' },
            { key: 'equipment-inspection', title: '设备巡检点检', route: '/equipment-management/equipment-inspection' },
        ],
    },
    {
        key: 'spare-parts',
        title: '备品备件管理',
        children: [
            { key: 'spare-parts-file', title: '备品备件档案', route: '/equipment-management/spare-parts-file' },
            { key: 'spare-parts-issue', title: '备品备件领用归还', route: '/equipment-management/spare-parts-issue' },
            {
                key: 'spare-parts-scrapping',
                title: '备品备件报废',
                route: '/equipment-management/spare-parts-scrapping',
            },
        ],
    },
];

const warehouseManagementMenu: SideMenuItem[] = [
    {
        key: 'warehouse-settings',
        title: '仓库设置',
        children: [
            { key: 'warehouse-building', title: '仓库建模', route: '/warehouse-management/warehouse-building' },
            { key: 'warehouse-area', title: '库区建模', route: '/warehouse-management/warehouse-area' },
            { key: 'warehouse-location', title: '库位建模', route: '/warehouse-management/warehouse-location' },
        ],
    },
    { key: 'current-inventory', title: '库存现有量', route: '/warehouse-management/current-inventory' },
    { key: 'purchase-inbound', title: '采购入库', route: '/warehouse-management/purchase-inbound' },
    { key: 'production-requisition', title: '生产领料', route: '/warehouse-management/production-requisition' },
    { key: 'production-return', title: '生产退料', route: '/warehouse-management/production-return' },
    { key: 'product-outbound', title: '产品出库', route: '/warehouse-management/product-outbound' },
    { key: 'transfer-allocation', title: '转移调拨', route: '/warehouse-management/transfer-allocation' },
    { key: 'coding-management', title: '赋码管理', route: '/warehouse-management/coding-management' },
    { key: 'sn-code-management', title: 'SN码管理', route: '/warehouse-management/sn-code-management' },
];

const taskManagementMenu: SideMenuItem[] = [
    { key: 'all-todo', title: '全部待办', route: '/task-management/all-todo' },
    { key: 'my-todo', title: '我的待办', route: '/task-management/my-todo' },
    { key: 'my-initiated', title: '我发起的', route: '/task-management/my-initiated' },
    { key: 'my-processed', title: '我处理的', route: '/task-management/my-processed' },
];

const processManagementMenu: SideMenuItem[] = [
    { key: 'process-model', title: '流程模型', route: '/process-management/process-model' },
    { key: 'business-form', title: '业务表单', route: '/process-management/business-form' },
    { key: 'form-config', title: '表单配置', route: '/process-management/form-config' },
    { key: 'route-data', title: '路由数据', route: '/process-management/route-data' },
];

const systemSettingsMenu: SideMenuItem[] = [
    {
        key: 'org-structure',
        title: '组织架构',
        children: [
            { key: 'department-info', title: '部门信息', route: '/system-settings/department-info' },
            { key: 'position-info', title: '职位信息', route: '/system-settings/position-info' },
            { key: 'employee-info', title: '员工信息', route: '/system-settings/employee-info' },
            { key: 'supplier-management', title: '供应商管理', route: '/system-settings/supplier-management' },
            { key: 'customer-management', title: '客户管理', route: '/system-settings/customer-management' },
        ],
    },
    {
        key: 'permission-management',
        title: '权限管理',
        children: [
            { key: 'role-management', title: '角色管理', route: '/system-settings/role-management' },
            { key: 'user-management', title: '用户管理', route: '/system-settings/user-management' },
            { key: 'menu-management', title: '菜单管理', route: '/system-settings/menu-management' },
        ],
    },
    {
        key: 'production-config',
        title: '生产配置',
        children: [
            { key: 'production-team', title: '生产班组', route: '/system-settings/production-team' },
            { key: 'work-calendar', title: '工作日历', route: '/system-settings/work-calendar' },
            { key: 'scheduling-plan', title: '排班计划', route: '/system-settings/scheduling-plan' },
        ],
    },
    { key: 'dictionary-management', title: '字典管理', route: '/system-settings/dictionary-management' },
    { key: 'coding-rules', title: '编码规则', route: '/system-settings/coding-rules' },
];

// 是否显示侧边栏
const showSidebar = computed(() => {
    return [
        'technical-process',
        'planning-management',
        'production-management',
        'quality-management',
        'anomaly-management',
        'equipment-management',
        'warehouse-management',
        'task-management',
        'process-management',
        'system-settings',
    ].includes(activeTopMenu.value);
});

// 侧边栏菜单组
const sideMenuGroups = computed(() => {
    if (activeTopMenu.value === 'technical-process') {
        return technicalProcessMenu;
    }
    if (activeTopMenu.value === 'planning-management') {
        return planningManagementMenu;
    }
    if (activeTopMenu.value === 'production-management') {
        return productionManagementMenu;
    }
    if (activeTopMenu.value === 'quality-management') {
        return qualityManagementMenu;
    }
    if (activeTopMenu.value === 'anomaly-management') {
        return anomalyManagementMenu;
    }
    if (activeTopMenu.value === 'equipment-management') {
        return equipmentManagementMenu;
    }
    if (activeTopMenu.value === 'warehouse-management') {
        return warehouseManagementMenu;
    }
    if (activeTopMenu.value === 'task-management') {
        return taskManagementMenu;
    }
    if (activeTopMenu.value === 'process-management') {
        return processManagementMenu;
    }
    if (activeTopMenu.value === 'system-settings') {
        return systemSettingsMenu;
    }
    return [] as SideMenuItem[];
});

// 当前激活的侧边栏菜单
const activeSideMenu = computed(() => {
    return route.name as string;
});

// 展开的菜单项
const openKeys = ref<string[]>([
    'material-modeling',
    'process-management',
    'production-gantt',
    'production-reporting',
    'production-reports',
    'quality-modeling',
    'non-conforming',
    'equipment-management',
    'spare-parts',
    'warehouse-settings',
    'org-structure',
    'permission-management',
    'production-config',
]);

// 面包屑导航
const breadcrumbItems = computed(() => {
    const items: Array<{ title: string; path?: string }> = [];
    const module = route.meta.module as string;

    if (module) {
        const moduleItem = topMenuItems.find(item => item.key === module);
        if (moduleItem) {
            items.push({ title: moduleItem.title, path: moduleItem.route });
        }
    }

    if (route.meta.title) {
        items.push({ title: route.meta.title as string });
    }

    return items;
});

// 处理顶部菜单点击
const handleTopMenuClick = (e: { key: string }) => {
    const item = topMenuItems.find(item => item.key === e.key);
    if (item) {
        router.push(item.route);
    }
};

// 处理侧边栏菜单点击（扁平项 key 为 item-xxx，子项为 child.key，需统一匹配）
const handleSideMenuClick = (e: { key: string }) => {
    const rawKey = e.key.startsWith('item-') ? e.key.slice(5) : e.key;
    const findRoute = (groups: SideMenuItem[]): string | null => {
        for (const group of groups) {
            if (group.key === rawKey && group.route) {
                return group.route;
            }
            if (group.children) {
                for (const child of group.children) {
                    if (child.key === rawKey) {
                        return child.route ?? null;
                    }
                }
            }
        }
        return null;
    };

    let targetRoute: string | null = null;
    if (activeTopMenu.value === 'technical-process') {
        targetRoute = findRoute(technicalProcessMenu);
    } else if (activeTopMenu.value === 'planning-management') {
        targetRoute = findRoute(planningManagementMenu);
    } else if (activeTopMenu.value === 'production-management') {
        targetRoute = findRoute(productionManagementMenu);
    } else if (activeTopMenu.value === 'quality-management') {
        targetRoute = findRoute(qualityManagementMenu);
    } else if (activeTopMenu.value === 'anomaly-management') {
        targetRoute = findRoute(anomalyManagementMenu);
    } else if (activeTopMenu.value === 'equipment-management') {
        targetRoute = findRoute(equipmentManagementMenu);
    } else if (activeTopMenu.value === 'warehouse-management') {
        targetRoute = findRoute(warehouseManagementMenu);
    } else if (activeTopMenu.value === 'task-management') {
        targetRoute = findRoute(taskManagementMenu);
    } else if (activeTopMenu.value === 'process-management') {
        targetRoute = findRoute(processManagementMenu);
    } else if (activeTopMenu.value === 'system-settings') {
        targetRoute = findRoute(systemSettingsMenu);
    }

    if (targetRoute) {
        router.push(targetRoute);
    }
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

watch(
    () => route.path,
    () => {
        if (route.path.includes('material-')) {
            ensureOpenKeys(['material-modeling']);
        } else if (route.path.includes('process-') && !route.path.includes('process-flow-card')) {
            ensureOpenKeys(['process-management']);
        } else if (
            route.path.includes('production-gantt') ||
            route.path.includes('process-gantt') ||
            route.path.includes('workshop-gantt') ||
            route.path.includes('work-order-gantt')
        ) {
            ensureOpenKeys(['production-gantt']);
        } else if (route.path.includes('production-reporting') || route.path.includes('reporting-records')) {
            ensureOpenKeys(['production-reporting']);
        } else if (route.path.includes('achievement-rate') || route.path.includes('on-time-rate')) {
            ensureOpenKeys(['production-reports']);
        } else if (route.path.includes('quality-management')) {
            if (route.path.includes('inspection-')) {
                ensureOpenKeys(['quality-modeling']);
            } else if (route.path.includes('handling-')) {
                ensureOpenKeys(['non-conforming']);
            }
        } else if (route.path.includes('equipment-management')) {
            if (route.path.includes('equipment-') || route.path.includes('spare-parts-')) {
                ensureOpenKeys(['equipment-management', 'spare-parts']);
            }
        } else if (route.path.includes('warehouse-management')) {
            if (route.path.includes('warehouse-')) {
                ensureOpenKeys(['warehouse-settings']);
            }
        } else if (route.path.includes('system-settings')) {
            if (
                route.path.includes('department-') ||
                route.path.includes('position-') ||
                route.path.includes('employee-') ||
                route.path.includes('supplier-') ||
                route.path.includes('customer-')
            ) {
                ensureOpenKeys(['org-structure']);
            } else if (route.path.includes('role-') || route.path.includes('user-') || route.path.includes('menu-')) {
                ensureOpenKeys(['permission-management']);
            } else if (
                route.path.includes('production-team') ||
                route.path.includes('work-calendar') ||
                route.path.includes('scheduling-plan')
            ) {
                ensureOpenKeys(['production-config']);
            }
        }
    },
    { immediate: true }
);
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
