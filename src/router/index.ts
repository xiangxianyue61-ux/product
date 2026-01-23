import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Layout from '../layouts/MainLayout.vue';

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
                meta: { title: '首页', module: 'home' },
            },
            {
                path: 'technical-process/material-management',
                name: 'MaterialManagement',
                component: () => import('../views/technical-process/MaterialManagement.vue'),
                meta: { title: '物料管理', module: 'technical-process' },
            },
            {
                path: 'technical-process/material-unit',
                name: 'MaterialUnit',
                component: () => import('../views/technical-process/MaterialUnit.vue'),
                meta: { title: '物料单位', module: 'technical-process' },
            },
            {
                path: 'technical-process/material-type',
                name: 'MaterialType',
                component: () => import('../views/technical-process/MaterialType.vue'),
                meta: { title: '物料类型', module: 'technical-process' },
            },
            {
                path: 'technical-process/manufacturing-method',
                name: 'ManufacturingMethod',
                component: () => import('../views/technical-process/ManufacturingMethod.vue'),
                meta: { title: '制造方式', module: 'technical-process' },
            },
            {
                path: 'technical-process/product-bom',
                name: 'ProductBOM',
                component: () => import('../views/technical-process/ProductBOM.vue'),
                meta: { title: '产品BOM', module: 'technical-process' },
            },
            {
                path: 'technical-process/process-workshop',
                name: 'ProcessWorkshop',
                component: () => import('../views/technical-process/ProcessWorkshop.vue'),
                meta: { title: '工序车间', module: 'technical-process' },
            },
            {
                path: 'technical-process/processing-process',
                name: 'ProcessingProcess',
                component: () => import('../views/technical-process/ProcessingProcess.vue'),
                meta: { title: '加工工序', module: 'technical-process' },
            },
            {
                path: 'technical-process/process-route',
                name: 'ProcessRoute',
                component: () => import('../views/technical-process/ProcessRoute.vue'),
                meta: { title: '工艺路线', module: 'technical-process' },
            },
            {
                path: 'technical-process/process-flow-card',
                name: 'ProcessFlowCard',
                component: () => import('../views/technical-process/ProcessFlowCard.vue'),
                meta: { title: '工艺流转卡', module: 'technical-process' },
            },
            {
                path: 'planning-management/sales-order',
                name: 'SalesOrder',
                component: () => import('../views/planning-management/SalesOrder.vue'),
                meta: { title: '销售订单', module: 'planning-management' },
            },
            {
                path: 'planning-management/production-plan',
                name: 'ProductionPlan',
                component: () => import('../views/planning-management/ProductionPlan.vue'),
                meta: { title: '生产计划', module: 'planning-management' },
            },
            {
                path: 'planning-management/planning-gantt',
                name: 'PlanningGantt',
                component: () => import('../views/planning-management/PlanningGantt.vue'),
                meta: { title: '计划甘特图', module: 'planning-management' },
            },
            {
                path: 'production-management/work-order',
                name: 'WorkOrder',
                component: () => import('../views/production-management/WorkOrder.vue'),
                meta: { title: '生产工单', module: 'production-management' },
            },
            {
                path: 'production-management/production-gantt',
                name: 'ProductionGantt',
                component: () => import('../views/production-management/ProductionGantt.vue'),
                meta: { title: '生产甘特图', module: 'production-management' },
            },
            {
                path: 'production-management/process-gantt',
                name: 'ProcessGantt',
                component: () => import('../views/production-management/ProcessGantt.vue'),
                meta: { title: '工序甘特图', module: 'production-management' },
            },
            {
                path: 'production-management/workshop-gantt',
                name: 'WorkshopGantt',
                component: () => import('../views/production-management/WorkshopGantt.vue'),
                meta: { title: '车间甘特图', module: 'production-management' },
            },
            {
                path: 'production-management/work-order-gantt',
                name: 'WorkOrderGantt',
                component: () => import('../views/production-management/WorkOrderGantt.vue'),
                meta: { title: '工单甘特图', module: 'production-management' },
            },
            {
                path: 'production-management/production-reporting',
                name: 'ProductionReporting',
                component: () => import('../views/production-management/ProductionReporting.vue'),
                meta: { title: '生产报工', module: 'production-management' },
            },
            {
                path: 'production-management/reporting-records',
                name: 'ReportingRecords',
                component: () => import('../views/production-management/ReportingRecords.vue'),
                meta: { title: '报工记录', module: 'production-management' },
            },
            {
                path: 'production-management/achievement-rate',
                name: 'AchievementRate',
                component: () => import('../views/production-management/AchievementRate.vue'),
                meta: { title: '生产达成率', module: 'production-management' },
            },
            {
                path: 'production-management/on-time-rate',
                name: 'OnTimeRate',
                component: () => import('../views/production-management/OnTimeRate.vue'),
                meta: { title: '生产准时率', module: 'production-management' },
            },
            {
                path: 'quality-management/inspection-item',
                name: 'QualityInspectionItem',
                component: () => import('../views/quality-management/InspectionItem.vue'),
                meta: { title: '检验项目', module: 'quality-management' },
            },
            {
                path: 'quality-management/inspection-standard',
                name: 'QualityInspectionStandard',
                component: () => import('../views/quality-management/InspectionStandard.vue'),
                meta: { title: '检验标准', module: 'quality-management' },
            },
            {
                path: 'anomaly-management/category',
                name: 'AnomalyCategory',
                component: () => import('../views/anomaly-management/Category.vue'),
                meta: { title: '异常分类', module: 'anomaly-management' },
            },
            {
                path: 'equipment-management/equipment-file',
                name: 'EquipmentFile',
                component: () => import('../views/equipment-management/EquipmentFile.vue'),
                meta: { title: '设备档案', module: 'equipment-management' },
            },
            {
                path: 'warehouse-management/warehouse-building',
                name: 'WarehouseBuilding',
                component: () => import('../views/warehouse-management/WarehouseBuilding.vue'),
                meta: { title: '仓库建模', module: 'warehouse-management' },
            },
            {
                path: 'task-management/all-todo',
                name: 'TaskAllTodo',
                component: () => import('../views/task-management/AllTodo.vue'),
                meta: { title: '全部待办', module: 'task-management' },
            },
            {
                path: 'process-management/process-model',
                name: 'ProcessModel',
                component: () => import('../views/process-management/ProcessModel.vue'),
                meta: { title: '流程模型', module: 'process-management' },
            },
            {
                path: 'system-settings/department-info',
                name: 'DepartmentInfo',
                component: () => import('../views/system-settings/DepartmentInfo.vue'),
                meta: { title: '部门信息', module: 'system-settings' },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory('/product/'),
    routes,
});

export default router;
