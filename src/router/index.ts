import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Layout from '../layouts/MainLayout.vue';
import { setupAuthGuard } from '../../Auth';
import store from '../store'; // 直接导入 store 实例，而不是 useStore hook

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: Layout,
        redirect: '/home',
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('../views/Home.vue'),
                meta: { title: '首页', module: 'home', is_menu: true },
            },
            {
                path: 'technical-process',
                name: 'TechnicalProcess',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '工艺管理', module: 'technical-process', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'material-management',
                        name: 'MaterialManagement',
                        component: () => import('../views/technical-process/MaterialManagement.vue'),
                        meta: { title: '物料管理', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'material-unit',
                        name: 'MaterialUnit',
                        component: () => import('../views/technical-process/MaterialUnit.vue'),
                        meta: { title: '物料单位', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'material-type',
                        name: 'MaterialType',
                        component: () => import('../views/technical-process/MaterialType.vue'),
                        meta: { title: '物料类型', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'manufacturing-method',
                        name: 'ManufacturingMethod',
                        component: () => import('../views/technical-process/ManufacturingMethod.vue'),
                        meta: { title: '制造方式', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'product-bom',
                        name: 'ProductBOM',
                        component: () => import('../views/technical-process/ProductBOM.vue'),
                        meta: { title: '产品BOM', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'process-workshop',
                        name: 'ProcessWorkshop',
                        component: () => import('../views/technical-process/ProcessWorkshop.vue'),
                        meta: { title: '工序车间', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'processing-process',
                        name: 'ProcessingProcess',
                        component: () => import('../views/technical-process/ProcessingProcess.vue'),
                        meta: { title: '加工工序', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'process-route',
                        name: 'ProcessRoute',
                        component: () => import('../views/technical-process/ProcessRoute.vue'),
                        meta: { title: '工艺路线', module: 'technical-process', role: ['admin', 'user'] },
                    },
                    {
                        path: 'process-flow-card',
                        name: 'ProcessFlowCard',
                        component: () => import('../views/technical-process/ProcessFlowCard.vue'),
                        meta: { title: '工艺流转卡', module: 'technical-process', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'planning-management',
                name: 'PlanningManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '计划管理', module: 'planning-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'sales-order',
                        name: 'SalesOrder',
                        component: () => import('../views/planning-management/SalesOrder.vue'),
                        meta: { title: '销售订单', module: 'planning-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-plan',
                        name: 'ProductionPlan',
                        component: () => import('../views/planning-management/ProductionPlan.vue'),
                        meta: { title: '生产计划', module: 'planning-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-schedule/:id',
                        name: 'ProductionSchedule',
                        component: () => import('../views/planning-management/ProductionSchedule.vue'),
                        meta: { title: '生产计划排程', module: 'planning-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'planning-gantt',
                        name: 'PlanningGantt',
                        component: () => import('../views/planning-management/PlanningGantt.vue'),
                        meta: { title: '计划甘特图', module: 'planning-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'production-management',
                name: 'ProductionManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '生产管理', module: 'production-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'work-order',
                        name: 'WorkOrder',
                        component: () => import('../views/production-management/WorkOrder.vue'),
                        meta: { title: '生产工单', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-gantt',
                        name: 'ProductionGantt',
                        component: () => import('../views/production-management/ProductionGantt.vue'),
                        meta: { title: '生产甘特图', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'process-gantt',
                        name: 'ProcessGantt',
                        component: () => import('../views/production-management/ProcessGantt.vue'),
                        meta: { title: '工序甘特图', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'workshop-gantt',
                        name: 'WorkshopGantt',
                        component: () => import('../views/production-management/WorkshopGantt.vue'),
                        meta: { title: '车间甘特图', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'work-order-gantt',
                        name: 'WorkOrderGantt',
                        component: () => import('../views/production-management/WorkOrderGantt.vue'),
                        meta: { title: '工单甘特图', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-reporting',
                        name: 'ProductionReporting',
                        component: () => import('../views/production-management/ProductionReporting.vue'),
                        meta: { title: '生产报工', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'reporting-records',
                        name: 'ReportingRecords',
                        component: () => import('../views/production-management/ReportingRecords.vue'),
                        meta: { title: '报工记录', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'achievement-rate',
                        name: 'AchievementRate',
                        component: () => import('../views/production-management/AchievementRate.vue'),
                        meta: { title: '生产达成率', module: 'production-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'on-time-rate',
                        name: 'OnTimeRate',
                        component: () => import('../views/production-management/OnTimeRate.vue'),
                        meta: { title: '生产准时率', module: 'production-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'quality-management',
                name: 'QualityManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '质量管理', module: 'quality-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'inspection-item',
                        name: 'QualityInspectionItem',
                        component: () => import('../views/quality-management/InspectionItem.vue'),
                        meta: { title: '检验项目', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'inspection-standard',
                        name: 'QualityInspectionStandard',
                        component: () => import('../views/quality-management/InspectionStandard.vue'),
                        meta: { title: '检验标准', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'incoming-inspection',
                        name: 'IncomingInspection',
                        component: () => import('../views/quality-management/IncomingInspection.vue'),
                        meta: { title: '来料检验', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'in-process-inspection',
                        name: 'InProcessInspection',
                        component: () => import('../views/quality-management/InProcessInspection.vue'),
                        meta: { title: '过程检验', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'final-inspection',
                        name: 'FinalInspection',
                        component: () => import('../views/quality-management/FinalInspection.vue'),
                        meta: { title: '最终检验', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'handling-method',
                        name: 'HandlingMethod',
                        component: () => import('../views/quality-management/HandlingMethod.vue'),
                        meta: { title: '处理方式', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'handling-record',
                        name: 'HandlingRecord',
                        component: () => import('../views/quality-management/HandlingRecord.vue'),
                        meta: { title: '处理记录', module: 'quality-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'product-traceability',
                        name: 'ProductTraceability',
                        component: () => import('../views/quality-management/ProductTraceability.vue'),
                        meta: { title: '产品追溯', module: 'quality-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'anomaly-management',
                name: 'AnomalyManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '异常管理', module: 'anomaly-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'category',
                        name: 'AnomalyCategory',
                        component: () => import('../views/anomaly-management/Category.vue'),
                        meta: { title: '异常分类', module: 'anomaly-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'level',
                        name: 'AnomalyLevel',
                        component: () => import('../views/anomaly-management/Level.vue'),
                        meta: { title: '异常等级', module: 'anomaly-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'anomaly-management',
                        name: 'AnomalyManagementPage',
                        component: () => import('../views/anomaly-management/AnomalyManagement.vue'),
                        meta: { title: '异常管理', module: 'anomaly-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'equipment-management',
                name: 'EquipmentManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '设备管理', module: 'equipment-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'equipment-file',
                        name: 'EquipmentFile',
                        component: () => import('../views/equipment-management/EquipmentFile.vue'),
                        meta: { title: '设备档案', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'equipment-data',
                        name: 'EquipmentData',
                        component: () => import('../views/equipment-management/EquipmentData.vue'),
                        meta: { title: '设备数据', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'equipment-scrapping',
                        name: 'EquipmentScrapping',
                        component: () => import('../views/equipment-management/EquipmentScrapping.vue'),
                        meta: { title: '设备报废', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'equipment-repair',
                        name: 'EquipmentRepair',
                        component: () => import('../views/equipment-management/EquipmentRepair.vue'),
                        meta: { title: '设备维修', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'equipment-maintenance',
                        name: 'EquipmentMaintenance',
                        component: () => import('../views/equipment-management/EquipmentMaintenance.vue'),
                        meta: { title: '设备保养', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'equipment-inspection',
                        name: 'EquipmentInspection',
                        component: () => import('../views/equipment-management/EquipmentInspection.vue'),
                        meta: { title: '设备巡检点检', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'spare-parts-file',
                        name: 'SparePartsFile',
                        component: () => import('../views/equipment-management/SparePartsFile.vue'),
                        meta: { title: '备品备件档案', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'spare-parts-issue',
                        name: 'SparePartsIssue',
                        component: () => import('../views/equipment-management/SparePartsIssue.vue'),
                        meta: { title: '备品备件领用归还', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'spare-parts-scrapping',
                        name: 'SparePartsScrapping',
                        component: () => import('../views/equipment-management/SparePartsScrapping.vue'),
                        meta: { title: '备品备件报废', module: 'equipment-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'warehouse-management',
                name: 'WarehouseManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '仓库管理', module: 'warehouse-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'warehouse-building',
                        name: 'WarehouseBuilding',
                        component: () => import('../views/warehouse-management/WarehouseBuilding.vue'),
                        meta: { title: '仓库建模', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'warehouse-area',
                        name: 'WarehouseArea',
                        component: () => import('../views/warehouse-management/WarehouseArea.vue'),
                        meta: { title: '库区建模', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'warehouse-location',
                        name: 'WarehouseLocation',
                        component: () => import('../views/warehouse-management/WarehouseLocation.vue'),
                        meta: { title: '库位建模', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'current-inventory',
                        name: 'CurrentInventory',
                        component: () => import('../views/warehouse-management/CurrentInventory.vue'),
                        meta: { title: '库存现有量', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'purchase-inbound',
                        name: 'PurchaseInbound',
                        component: () => import('../views/warehouse-management/PurchaseInbound.vue'),
                        meta: { title: '采购入库', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-requisition',
                        name: 'ProductionRequisition',
                        component: () => import('../views/warehouse-management/ProductionRequisition.vue'),
                        meta: { title: '生产领料', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'production-return',
                        name: 'ProductionReturn',
                        component: () => import('../views/warehouse-management/ProductionReturn.vue'),
                        meta: { title: '生产退料', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'product-outbound',
                        name: 'ProductOutbound',
                        component: () => import('../views/warehouse-management/ProductOutbound.vue'),
                        meta: { title: '产品出库', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'transfer-allocation',
                        name: 'TransferAllocation',
                        component: () => import('../views/warehouse-management/TransferAllocation.vue'),
                        meta: { title: '转移调拨', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'coding-management',
                        name: 'CodingManagement',
                        component: () => import('../views/warehouse-management/CodingManagement.vue'),
                        meta: { title: '赋码管理', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'sn-code-management',
                        name: 'SNCodeManagement',
                        component: () => import('../views/warehouse-management/SNCodeManagement.vue'),
                        meta: { title: 'SN码管理', module: 'warehouse-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'task-management',
                name: 'TaskManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '任务管理', module: 'task-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'all-todo',
                        name: 'TaskAllTodo',
                        component: () => import('../views/task-management/AllTodo.vue'),
                        meta: { title: '全部待办', module: 'task-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'my-todo',
                        name: 'MyTodo',
                        component: () => import('../views/task-management/MyTodo.vue'),
                        meta: { title: '我的待办', module: 'task-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'my-initiated',
                        name: 'MyInitiated',
                        component: () => import('../views/task-management/MyInitiated.vue'),
                        meta: { title: '我发起的', module: 'task-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'my-processed',
                        name: 'MyProcessed',
                        component: () => import('../views/task-management/MyProcessed.vue'),
                        meta: { title: '我处理的', module: 'task-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'process-management',
                name: 'ProcessManagement',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '流程管理', module: 'process-management', is_menu: true, role: ['admin', 'user'] },
                children: [
                    {
                        path: 'process-model',
                        name: 'ProcessModel',
                        component: () => import('../views/process-management/ProcessModel.vue'),
                        meta: { title: '流程模型', module: 'process-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'business-form',
                        name: 'BusinessForm',
                        component: () => import('../views/process-management/BusinessForm.vue'),
                        meta: { title: '业务表单', module: 'process-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'form-config',
                        name: 'FormConfig',
                        component: () => import('../views/process-management/FormConfig.vue'),
                        meta: { title: '表单配置', module: 'process-management', role: ['admin', 'user'] },
                    },
                    {
                        path: 'route-data',
                        name: 'RouteData',
                        component: () => import('../views/process-management/RouteData.vue'),
                        meta: { title: '路由数据', module: 'process-management', role: ['admin', 'user'] },
                    },
                ],
            },
            {
                path: 'system-settings',
                name: 'SystemSettings',
                component: () => import('../layouts/RouteView.vue'),
                meta: { title: '系统设置', module: 'system-settings', is_menu: true, role: ['admin'] },
                children: [
                    {
                        path: 'department-info',
                        name: 'DepartmentInfo',
                        component: () => import('../views/system-settings/DepartmentInfo.vue'),
                        meta: { title: '部门信息', module: 'system-settings', role: ['admin', 'user'] },
                    },
                    {
                        path: 'position-info',
                        name: 'PositionInfo',
                        component: () => import('../views/system-settings/PositionInfo.vue'),
                        meta: { title: '职位信息', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'employee-info',
                        name: 'EmployeeInfo',
                        component: () => import('../views/system-settings/EmployeeInfo.vue'),
                        meta: { title: '员工信息', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'supplier-management',
                        name: 'SupplierManagement',
                        component: () => import('../views/system-settings/SupplierManagement.vue'),
                        meta: { title: '供应商管理', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'customer-management',
                        name: 'CustomerManagement',
                        component: () => import('../views/system-settings/CustomerManagement.vue'),
                        meta: { title: '客户管理', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'role-management',
                        name: 'RoleManagement',
                        component: () => import('../views/system-settings/RoleManagement.vue'),
                        meta: { title: '角色管理', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'user-management',
                        name: 'UserManagement',
                        component: () => import('../views/system-settings/UserManagement.vue'),
                        meta: { title: '用户管理', module: 'system-settings', role: ['user', 'admin'] },
                    },
                    {
                        path: 'menu-management',
                        name: 'MenuManagement',
                        component: () => import('../views/system-settings/MenuManagement.vue'),
                        meta: { title: '菜单管理', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'production-team',
                        name: 'ProductionTeam',
                        component: () => import('../views/system-settings/ProductionTeam.vue'),
                        meta: { title: '生产班组', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'work-calendar',
                        name: 'WorkCalendar',
                        component: () => import('../views/system-settings/WorkCalendar.vue'),
                        meta: { title: '工作日历', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'scheduling-plan',
                        name: 'SchedulingPlan',
                        component: () => import('../views/system-settings/SchedulingPlan.vue'),
                        meta: { title: '排班计划', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'dictionary-management',
                        name: 'DictionaryManagement',
                        component: () => import('../views/system-settings/DictionaryManagement.vue'),
                        meta: { title: '字典管理', module: 'system-settings', role: ['admin'] },
                    },
                    {
                        path: 'coding-rules',
                        name: 'CodingRules',
                        component: () => import('../views/system-settings/CodingRules.vue'),
                        meta: { title: '编码规则', module: 'system-settings', role: ['admin'] },
                    },
                ],
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/system-settings/Profile.vue'),
                meta: { title: '个人中心', module: 'system-settings', role: ['user', 'admin'] },
            },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { title: '登录', module: 'login' },
    },
    {
        path: '/data',
        name: 'Data',
        component: () => import('../views/data.vue'),
        meta: { title: '数据看板', module: 'data' },
    },
];

const router = createRouter({
    history: createWebHistory('/product/'),
    routes,
});

router.beforeEach((to, from, next) => {
    // 检查是否是首次登录
    if (store.state.isFirstLogin && to.path !== '/profile' && to.name !== 'Login') {
        next({ name: 'Profile' });
        return;
    }

    //1.当前访问的路由
    console.log(to.meta.role, '1');
    if (to.meta.role) {
        //2.获取当前vuex中自己的角色
        //3.to.meta.role就是允许的角色列表["user","admin"]
        console.log(store.state.role, '2');
        let userRole = store.state.role;
        let allowRoleList = to.meta.role as string[];
        if (allowRoleList.indexOf(userRole) === -1) {
            next({ name: 'Login' });
        } else {
            next();
        }
    } else {
        next();
    }
});

setupAuthGuard(router);

export default router;
