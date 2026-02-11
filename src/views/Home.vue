<template>
    <div>
        <div class="bg-[#f0f2f5] min-h-screen p-4">
            <!-- KPI卡片区域 -->
            <div class="flex gap-4 mb-4">
                <template v-if="!dataLoaded">
                    <div v-for="i in 5" :key="`skeleton-${i}`" class="flex-1">
                        <a-card class="rounded-lg shadow-sm h-full" :bordered="false">
                            <a-skeleton active :paragraph="{ rows: 2 }" />
                        </a-card>
                    </div>
                </template>
                <div v-else v-for="kpi in kpiList" :key="kpi.key" class="flex-1">
                    <a-card class="rounded-lg shadow-sm h-full" :bordered="false">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-[60px] h-[60px] rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0"
                                :style="{ backgroundColor: kpi.iconBg }"
                            >
                                <component :is="markRaw(kpi.icon)" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm text-gray-500 mb-2" v-once>{{ kpi.label }}</div>
                                <div class="text-2xl font-bold text-gray-800 mb-1">
                                    {{ kpi.value }}
                                    <span v-if="kpi.unit" class="text-base ml-1" v-once>{{ kpi.unit }}</span>
                                </div>
                                <div
                                    class="text-xs flex items-center gap-1"
                                    :class="kpi.trendType === 'up' ? 'text-green-500' : 'text-red-500'"
                                >
                                    <ArrowUpOutlined v-if="kpi.trendType === 'up'" />
                                    <ArrowDownOutlined v-else />
                                    <span v-once>
                                        本月较上月{{ kpi.trendType === 'up' ? '增加' : '减少' }}
                                        {{ Math.abs(kpi.trend) }}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </a-card>
                </div>
            </div>

            <!-- 饼图和右侧边栏区域 -->
            <a-row :gutter="16" class="mb-4">
                <!-- 左侧饼图和下方内容区域 -->
                <a-col :span="18">
                    <!-- 饼图区域 -->
                    <a-row :gutter="16" class="mb-4">
                        <template v-if="!dataLoaded">
                            <a-col :span="8" v-for="i in 3" :key="`chart-skeleton-${i}`">
                                <a-card class="rounded-lg shadow-sm h-full" :bordered="false">
                                    <a-skeleton active :paragraph="{ rows: 4 }" />
                                </a-card>
                            </a-col>
                        </template>
                        <a-col v-else :span="8" v-for="chart in donutCharts" :key="chart.key">
                            <a-card :title="chart.title" class="rounded-lg shadow-sm h-full" :bordered="false">
                                <div :data-chart="chart.key" class="w-full h-[250px]"></div>
                                <div class="mt-4 flex flex-wrap gap-4">
                                    <div
                                        v-for="(item, index) in chart.data"
                                        :key="index"
                                        class="flex items-center gap-2"
                                    >
                                        <div
                                            class="w-3 h-3 rounded-full flex-shrink-0"
                                            :style="{ backgroundColor: chart.colors[index] }"
                                        ></div>
                                        <span class="text-sm text-gray-600">{{ item.name }}</span>
                                        <span class="text-sm font-medium text-gray-800">{{ item.value }}个</span>
                                    </div>
                                </div>
                            </a-card>
                        </a-col>
                    </a-row>

                    <!-- 趋势图区域 -->
                    <a-row :gutter="16" class="mb-4">
                        <a-col :span="12">
                            <a-card title="工单产出统计" class="rounded-lg shadow-sm h-full" :bordered="false">
                                <div class="text-sm text-gray-500 mb-2" v-once>近一年</div>
                                <a-skeleton v-if="!dataLoaded" active :paragraph="{ rows: 6 }" />
                                <div
                                    v-else
                                    ref="barChartRef"
                                    class="w-full"
                                    style="height: 300px; min-height: 300px"
                                ></div>
                            </a-card>
                        </a-col>
                        <a-col :span="12">
                            <a-card title="产品合格率" class="rounded-lg shadow-sm h-full" :bordered="false">
                                <div class="text-sm text-gray-500 mb-2" v-once>近一年</div>
                                <a-skeleton v-if="!dataLoaded" active :paragraph="{ rows: 6 }" />
                                <div
                                    v-else
                                    ref="lineChartRef"
                                    class="w-full"
                                    style="height: 300px; min-height: 300px"
                                ></div>
                            </a-card>
                        </a-col>
                    </a-row>

                    <!-- 生产进度表格 -->
                    <a-card class="rounded-lg shadow-sm" :bordered="false">
                        <template #title>
                            <span v-once>生产进度</span>
                        </template>
                        <template #extra>
                            <a class="text-blue-500 text-sm" v-once>全部 ></a>
                        </template>
                        <a-skeleton v-if="!dataLoaded" active :paragraph="{ rows: 5 }" />
                        <a-table
                            v-else
                            :columns="progressColumns"
                            :data-source="progressData"
                            :pagination="false"
                            size="small"
                            :row-key="getProgressRowKey"
                        >
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'progress'">
                                    <a-progress
                                        :percent="record.progress"
                                        :stroke-color="getProgressColor(record.progress)"
                                    />
                                </template>
                                <template v-else-if="column.key === 'priority'">
                                    <a-tag :color="getPriorityColor(record.priority)">{{ record.priority }}</a-tag>
                                </template>
                            </template>
                        </a-table>
                    </a-card>
                </a-col>

                <!-- 右侧日历和待办 -->
                <a-col :span="6">
                    <a-card class="rounded-lg shadow-sm mb-4" :bordered="false">
                        <Calendar v-if="dataLoaded" v-model:value="calendarValue" :fullscreen="false" />
                        <a-skeleton v-else active :paragraph="{ rows: 8 }" />
                    </a-card>

                    <a-card class="rounded-lg shadow-sm" :bordered="false">
                        <template #title>
                            <div class="flex items-center justify-between w-full">
                                <span>我的待办</span>
                                <a class="text-blue-500 text-sm">全部 ></a>
                            </div>
                        </template>
                        <a-tabs v-model:activeKey="todoActiveTab" size="small" class="mb-2">
                            <a-tab-pane key="todo" :tab="`我的待办(${todoList.length})`" />
                            <a-tab-pane key="initiated" :tab="`我发起的(${initiatedList.length})`" />
                            <a-tab-pane key="handled" :tab="`我处理的(${handledList.length})`" />
                        </a-tabs>
                        <div class="max-h-[400px] overflow-y-auto">
                            <template v-if="!dataLoaded">
                                <a-skeleton
                                    active
                                    :paragraph="{ rows: 3 }"
                                    v-for="i in 3"
                                    :key="`todo-skeleton-${i}`"
                                />
                            </template>
                            <div
                                v-else
                                v-for="(item, index) in currentTodoList"
                                :key="`${todoActiveTab}-${index}`"
                                class="py-3 border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                            >
                                <div
                                    class="w-1 h-12 rounded-full flex-shrink-0"
                                    :style="{ backgroundColor: item.color }"
                                ></div>
                                <div class="flex-1 text-sm text-gray-800 min-w-0">{{ item.content }}</div>
                                <a-button type="link" size="small" class="flex-shrink-0" :style="{ color: item.color }">
                                    去处理
                                </a-button>
                            </div>
                        </div>
                    </a-card>

                    <!-- 快捷入口 -->
                    <a-card title="快捷入口" class="rounded-lg shadow-sm mt-4" :bordered="false">
                        <template #extra>
                            <a class="text-blue-500 text-sm">修改 ></a>
                        </template>
                        <a-row :gutter="[8, 8]">
                            <a-col :span="6" v-for="entry in quickEntries" :key="entry.key">
                                <div
                                    class="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                                    role="button"
                                    tabindex="0"
                                    @click="goQuickEntry(entry)"
                                    @keydown.enter="goQuickEntry(entry)"
                                >
                                    <div
                                        class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg mb-1"
                                        :style="{ backgroundColor: entry.color }"
                                    >
                                        <component :is="markRaw(entry.icon)" />
                                    </div>
                                    <span class="text-xs text-gray-600 text-center leading-tight" v-once>
                                        {{ entry.label }}
                                    </span>
                                </div>
                            </a-col>
                        </a-row>
                    </a-card>
                </a-col>
            </a-row>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, shallowRef, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    SettingOutlined,
    FileTextOutlined,
    BarChartOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    ShoppingOutlined,
    FileAddOutlined,
    InboxOutlined,
    SafetyOutlined,
    TeamOutlined,
    ToolOutlined,
    WarningOutlined,
} from '@ant-design/icons-vue';
import { apiFetch } from '../utils/apiClient';
import { Calendar } from 'ant-design-vue';

// 懒加载 echarts（延迟到需要时再加载，减少首屏 JS 体积）
let echartsModule: typeof import('echarts') | null = null;
const loadEcharts = async () => {
    if (echartsModule) return echartsModule;
    echartsModule = await import('echarts');
    return echartsModule;
};

// 类型定义
type DonutItem = { name: string; value: number };
type DonutChart = {
    key: string;
    title: string;
    total: number;
    totalLabel: string;
    colors: string[];
    data: DonutItem[];
};

const calendarValue = ref<Dayjs>(dayjs());

// KPI数据（从后端获取）
const kpiList = ref([
    {
        key: 'in-production',
        label: '在生产数量',
        value: '0',
        unit: '个',
        trend: 0,
        trendType: 'up',
        icon: SettingOutlined,
        iconBg: '#52c41a',
    },
    {
        key: 'unproduced',
        label: '未生产数量',
        value: '0',
        unit: '个',
        trend: 0,
        trendType: 'down',
        icon: ShopOutlined,
        iconBg: '#faad14',
    },
    {
        key: 'non-conforming',
        label: '不合格数量',
        value: '0',
        unit: '个',
        trend: 0,
        trendType: 'up',
        icon: FileTextOutlined,
        iconBg: '#722ed1',
    },
    {
        key: 'achievement-rate',
        label: '生产达成率',
        value: '0%',
        unit: '',
        trend: 0,
        trendType: 'up',
        icon: BarChartOutlined,
        iconBg: '#1890ff',
    },
    {
        key: 'qualification-rate',
        label: '合格率',
        value: '0%',
        unit: '',
        trend: 0,
        trendType: 'up',
        icon: CheckCircleOutlined,
        iconBg: '#52c41a',
    },
]);

// 饼图数据（从后端获取）
const donutCharts = ref<DonutChart[]>([
    {
        key: 'work-order',
        title: '工单统计',
        total: 0,
        totalLabel: '全部工单',
        colors: ['#1890ff', '#faad14', '#13c2c2', '#ff4d4f'],
        data: [] as DonutItem[],
    },
    {
        key: 'product',
        title: '产品统计',
        total: 0,
        totalLabel: '产品总数',
        colors: ['#722ed1', '#52c41a', '#531dab', '#13c2c2'],
        data: [] as DonutItem[],
    },
    {
        key: 'defect',
        title: '缺陷统计',
        total: 0,
        totalLabel: '缺陷总数',
        colors: ['#fa8c16', '#1890ff', '#52c41a', '#722ed1'],
        data: [] as DonutItem[],
    },
]);

// 待办事项
const todoList = ref([
    { content: '工单20250002302 待审批', color: '#1890ff' },
    { content: '设备ZH023安灯异常,现已停工', color: '#ff4d4f' },
    { content: '新的生产指令单等待派工', color: '#1890ff' },
    { content: '生产工序说明更新了新版本,请及时上传...', color: '#52c41a' },
    { content: '生产工序说明更新了新版本,请及时上传...', color: '#52c41a' },
    { content: '生产工序说明更新了新版本,请及时上传...', color: '#52c41a' },
]);

const initiatedList = ref([
    { content: '我发起的任务1', color: '#1890ff' },
    { content: '我发起的任务2', color: '#52c41a' },
]);

const handledList = ref([
    { content: '我处理的任务1', color: '#1890ff' },
    { content: '我处理的任务2', color: '#52c41a' },
    { content: '我处理的任务3', color: '#faad14' },
    { content: '我处理的任务4', color: '#1890ff' },
    { content: '我处理的任务5', color: '#52c41a' },
    { content: '我处理的任务6', color: '#1890ff' },
    { content: '我处理的任务7', color: '#52c41a' },
    { content: '我处理的任务8', color: '#faad14' },
    { content: '我处理的任务9', color: '#1890ff' },
    { content: '我处理的任务10', color: '#52c41a' },
    { content: '我处理的任务11', color: '#1890ff' },
    { content: '我处理的任务12', color: '#52c41a' },
    { content: '我处理的任务13', color: '#1890ff' },
    { content: '我处理的任务14', color: '#52c41a' },
    { content: '我处理的任务15', color: '#faad14' },
    { content: '我处理的任务16', color: '#1890ff' },
]);

// 生产进度表格
const progressColumns = [
    { title: '工单编号', dataIndex: 'code', key: 'code', width: 150 },
    { title: '工单名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '工单进度', key: 'progress', width: 200 },
    { title: '产品名称', dataIndex: 'product', key: 'product', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '优先级', key: 'priority', width: 100 },
    { title: '需求日期', dataIndex: 'date', key: 'date', width: 120 },
];

type ProgressRow = {
    key: string;
    code: string;
    name: string;
    progress: number;
    product: string;
    quantity: number;
    priority: string;
    date: string;
};
const progressData = ref<ProgressRow[]>([]);
const getProgressRowKey = (record: ProgressRow) => record.key || record.code;

// 快捷入口（点击跳转对应路由）
const router = useRouter();
const quickEntries = ref([
    { key: 'order', label: '生产订单', icon: ShoppingOutlined, color: '#fa8c16', routeName: 'SalesOrder' },
    { key: 'report', label: '报工管理', icon: FileAddOutlined, color: '#1890ff', routeName: 'ProductionReporting' },
    { key: 'plan', label: '生产计划', icon: SettingOutlined, color: '#52c41a', routeName: 'ProductionPlan' },
    { key: 'warehouse', label: '入库管理', icon: InboxOutlined, color: '#722ed1', routeName: 'PurchaseInbound' },
    { key: 'quality', label: '质量管理', icon: SafetyOutlined, color: '#52c41a', routeName: 'QualityInspectionItem' },
    { key: 'team', label: '生产班组', icon: TeamOutlined, color: '#52c41a', routeName: 'ProductionTeam' },
    { key: 'process', label: '工艺管理', icon: ToolOutlined, color: '#1890ff', routeName: 'MaterialManagement' },
    { key: 'anomaly', label: '异常管理', icon: WarningOutlined, color: '#52c41a', routeName: 'AnomalyManagementPage' },
]);
const goQuickEntry = (entry: { routeName?: string }) => {
    if (entry.routeName) router.push({ name: entry.routeName });
};

const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#52c41a';
    if (progress >= 50) return '#1890ff';
    return '#faad14';
};

const getPriorityColor = (priority: string) => {
    if (priority === '一级') return 'red';
    if (priority === '二级') return 'blue';
    return 'green';
};

const todoActiveTab = ref('todo');

const currentTodoList = computed(() => {
    if (todoActiveTab.value === 'todo') {
        return todoList.value;
    } else if (todoActiveTab.value === 'initiated') {
        return initiatedList.value;
    } else {
        return handledList.value;
    }
});

const barChartRef = ref<HTMLElement>();
const lineChartRef = ref<HTMLElement>();
const donutChartInstances = shallowRef<echarts.ECharts[]>([]);
let sseEventSource: EventSource | null = null;
const dataLoaded = ref(false);

// 将后端/SSE 的看板数据应用到首页（KPI、饼图、生产进度表、工单产出/产品合格率近一年）
type DashboardPayload = {
    kpis: {
        inProduction: { value: number };
        unproduced: { value: number };
        nonConforming: { value: number };
        achievementRate: { value: number };
        qualificationRate: { value: number };
    };
    workOrderStats: { total: number; items: Array<{ name: string; value: number }> };
    productStats: { total: number; items: Array<{ name: string; value: number }> };
    defectStats: { total: number; items: Array<{ name: string; value: number }> };
    progressTable: Array<{
        key: string;
        code: string;
        name: string;
        progress: number;
        product: string;
        quantity: number;
        priority: string;
        date: string;
    }>;
    workOrderOutputMonthly?: { months: string[]; values: number[] };
    productQualificationMonthly?: { months: string[]; values: number[] };
};
const barChartData = ref<{ months: string[]; values: number[] }>({
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    values: [780, 700, 790, 820, 780, 630, 770, 830, 800, 860, 760, 800],
});
const lineChartData = ref<{ months: string[]; values: number[] }>({
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    values: [0.92, 0.94, 0.958, 0.95, 0.96, 0.97, 0.98, 0.97, 0.96, 0.98, 0.97, 0.99],
});
const barChartInstance = ref<echarts.ECharts | null>(null);
const lineChartInstance = ref<echarts.ECharts | null>(null);

// 批量更新数据，减少响应式触发次数（单次赋值）
const applyDashboardData = (data: DashboardPayload) => {
    const { kpis, workOrderStats, productStats, defectStats, progressTable } = data;

    // 批量构建新状态，单次赋值
    const newKpiList = kpiList.value.map(item => {
        if (item.key === 'in-production') return { ...item, value: String(kpis.inProduction.value) };
        if (item.key === 'unproduced') return { ...item, value: String(kpis.unproduced.value) };
        if (item.key === 'non-conforming') return { ...item, value: String(kpis.nonConforming.value) };
        if (item.key === 'achievement-rate') {
            return { ...item, value: `${kpis.achievementRate.value.toFixed(1)}%` };
        }
        if (item.key === 'qualification-rate') {
            return { ...item, value: `${kpis.qualificationRate.value.toFixed(1)}%` };
        }
        return item;
    });

    const newDonutCharts = donutCharts.value.map(chart => {
        if (chart.key === 'work-order') {
            return { ...chart, total: workOrderStats.total, data: workOrderStats.items };
        }
        if (chart.key === 'product') {
            return { ...chart, total: productStats.total, data: productStats.items };
        }
        if (chart.key === 'defect') {
            return { ...chart, total: defectStats.total, data: defectStats.items };
        }
        return chart;
    });

    // 单次赋值，减少响应式更新
    kpiList.value = newKpiList;
    donutCharts.value = newDonutCharts;
    progressData.value = progressTable;
    if (data.workOrderOutputMonthly?.months?.length) {
        barChartData.value = data.workOrderOutputMonthly;
    }
    if (data.productQualificationMonthly?.months?.length) {
        lineChartData.value = data.productQualificationMonthly;
    }
    dataLoaded.value = true;
};

// 刷新已初始化的饼图实例（SSE 更新数据后调用）
const refreshDonutChartsOption = () => {
    nextTick(() => {
        donutCharts.value.forEach((chart, index) => {
            const instance = donutChartInstances.value[index];
            if (!instance) return;
            const option = {
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '46.5%',
                        style: {
                            text: chart.total.toString(),
                            textAlign: 'center',
                            fill: '#333',
                            fontSize: 28,
                            fontWeight: 'bold',
                        },
                        z: 100,
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '61.5%',
                        style: {
                            text: chart.totalLabel,
                            textAlign: 'center',
                            fill: '#666',
                            fontSize: 14,
                        },
                        z: 100,
                    },
                ],
                series: [
                    {
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '50%'],
                        data: chart.data.map((item, i) => ({
                            ...item,
                            itemStyle: { color: chart.colors[i] },
                        })),
                    },
                ],
            };
            instance.setOption(option, { replaceMerge: ['graphic', 'series'] });
        });
    });
};

// SSE：首页全部数据按数据库实时渲染（与 overview 同源，每 10 秒推送）
const initSSE = () => {
    const raw = localStorage.getItem('access_token');
    if (!raw) return;
    // 后端 query.token 会再拼成 Bearer xxx，这里只传裸 JWT，避免变成 "Bearer Bearer xxx" 导致 401
    const token = raw.replace(/^Bearer\s+/i, '');
    if (!token) return;
    const url = `/dashboard/sse?token=${encodeURIComponent(token)}`;
    try {
        sseEventSource = new EventSource(url);
        sseEventSource.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data as string) as DashboardPayload;
                if (data.kpis && data.workOrderStats) {
                    applyDashboardData(data);
                    refreshDonutChartsOption();
                    refreshBarChartOption();
                    refreshLineChartOption();
                }
            } catch {
                // 解析失败忽略
            }
        };
        sseEventSource.onerror = () => {};
    } catch {
        // EventSource 不可用时仅用初次请求数据
    }
};

// 前端缓存：sessionStorage（页面刷新后失效，避免跨会话数据过期）
const CACHE_KEY_OVERVIEW = 'dashboard_overview_cache';
const CACHE_TTL_MS = 5000; // 5秒缓存，减少重复请求

// 从后端加载首页看板数据（与 SSE 同源，初次进入页面拉取）
const loadDashboardData = async () => {
    try {
        // 检查缓存
        const cached = sessionStorage.getItem(CACHE_KEY_OVERVIEW);
        if (cached) {
            try {
                const { data, ts } = JSON.parse(cached);
                if (Date.now() - ts < CACHE_TTL_MS) {
                    applyDashboardData(data);
                    // 延迟刷新图表，避免阻塞数据展示
                    nextTick(() => {
                        refreshDonutChartsOption();
                        refreshBarChartOption();
                        refreshLineChartOption();
                    });
                    return;
                }
            } catch {
                // 缓存解析失败，继续请求
            }
        }

        // 添加超时控制（10秒）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await apiFetch<{ success: boolean; data: DashboardPayload }>('/dashboard/overview', {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.success) {
                dataLoaded.value = true; // 即使失败也显示页面，避免一直显示骨架屏
                return;
            }
            applyDashboardData(res.data);
            // 更新缓存
            sessionStorage.setItem(CACHE_KEY_OVERVIEW, JSON.stringify({ data: res.data, ts: Date.now() }));
            // 数据到达后延迟刷新图表，优先展示数据
            nextTick(() => {
                refreshDonutChartsOption();
                refreshBarChartOption();
                refreshLineChartOption();
            });
        } catch (e) {
            clearTimeout(timeoutId);
            if (e instanceof Error && e.name === 'AbortError') {
                // 超时：使用缓存或默认数据
                dataLoaded.value = true;
            } else {
                throw e;
            }
        }
    } catch (e) {
        dataLoaded.value = true; // 失败时也显示页面
        // eslint-disable-next-line no-console
        console.error('加载首页看板数据失败', e);
    }
};

// 初始化饼图
const initDonutCharts = async () => {
    const echarts = await loadEcharts();
    nextTick(() => {
        donutChartInstances.value = [];
        donutCharts.value.forEach(chart => {
            const chartElement = document.querySelector(`[data-chart="${chart.key}"]`) as HTMLElement;
            if (chartElement) {
                const chartInstance = echarts.init(chartElement);
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}: {c} ({d}%)',
                    },
                    legend: {
                        show: false,
                    },
                    graphic: [
                        {
                            type: 'text',
                            left: 'center',
                            top: '46.5%',
                            style: {
                                text: chart.total.toString(),
                                textAlign: 'center',
                                fill: '#333',
                                fontSize: 28,
                                fontWeight: 'bold',
                            },
                            z: 100,
                        },
                        {
                            type: 'text',
                            left: 'center',
                            top: '61.5%',
                            style: {
                                text: chart.totalLabel,
                                textAlign: 'center',
                                fill: '#666',
                                fontSize: 14,
                            },
                            z: 100,
                        },
                    ],
                    series: [
                        {
                            type: 'pie',
                            radius: ['40%', '70%'],
                            center: ['50%', '50%'],
                            avoidLabelOverlap: false,
                            itemStyle: {
                                borderRadius: 10,
                                borderColor: '#fff',
                                borderWidth: 2,
                            },
                            label: {
                                show: false,
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                },
                            },
                            labelLine: {
                                show: false,
                            },
                            data: chart.data.map((item, index) => ({
                                ...item,
                                itemStyle: {
                                    color: chart.colors[index],
                                },
                            })),
                        },
                    ],
                };
                chartInstance.setOption(option);
                donutChartInstances.value.push(chartInstance);
            }
        });
    });
};

// 工单产出柱状图：用 barChartData（来自 SSE/overview）渲染，无数据时用默认
const setBarChartOption = () => {
    const instance = barChartInstance.value;
    if (!instance) return;
    const { months, values } = barChartData.value;
    const maxVal = Math.max(...values, 1);
    const percentages = values.map(v => Math.round((v / maxVal) * 100));
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params: Array<{ name: string; value: number }>) => {
                const param = params[0];
                if (!param) return '';
                const index = months.indexOf(param.name);
                return `${param.name}<br/>${param.value} / ${percentages[index] ?? 0}%`;
            },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: months,
            axisLine: { lineStyle: { color: '#e8e8e8' } },
        },
        yAxis: {
            type: 'value',
            max: Math.ceil(maxVal * 1.1) || 1000,
            axisLine: { lineStyle: { color: '#e8e8e8' } },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        series: [
            {
                type: 'bar',
                barWidth: '60%',
                data: values.map((v, index) => ({
                    value: v,
                    label: {
                        show: true,
                        position: 'top',
                        formatter: `${percentages[index]}%`,
                        color: '#333',
                    },
                })),
                itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
            },
        ],
    };
    instance.setOption(option);
};
const refreshBarChartOption = () => nextTick(setBarChartOption);

const initBarChart = async () => {
    const echarts = await loadEcharts();
    nextTick(() => {
        if (barChartRef.value) {
            barChartInstance.value = echarts.init(barChartRef.value);
            setBarChartOption();
            // 确保图表正确渲染大小
            setTimeout(() => {
                barChartInstance.value?.resize();
            }, 100);
        }
    });
};

// 产品合格率折线图：用 lineChartData（来自 SSE/overview）渲染，无数据时用默认
const setLineChartOption = () => {
    const instance = lineChartInstance.value;
    if (!instance) return;
    const { months, values } = lineChartData.value;
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params: Array<{ name: string; value: number }>) => {
                const param = params[0];
                if (!param) return '';
                return `${param.name}<br/>${((param.value as number) * 100).toFixed(1)}%`;
            },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: months,
            axisLine: { lineStyle: { color: '#e8e8e8' } },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 1,
            axisLabel: { formatter: '{value}' },
            axisLine: { lineStyle: { color: '#e8e8e8' } },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        series: [
            {
                type: 'line',
                data: values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#faad14' },
                lineStyle: { color: '#faad14', width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(250, 173, 20, 0.3)' },
                            { offset: 1, color: 'rgba(250, 173, 20, 0.1)' },
                        ],
                    },
                },
            },
        ],
    };
    instance.setOption(option);
};
const refreshLineChartOption = () => nextTick(setLineChartOption);

const initLineChart = async () => {
    const echarts = await loadEcharts();
    nextTick(() => {
        if (lineChartRef.value) {
            lineChartInstance.value = echarts.init(lineChartRef.value);
            setLineChartOption();
            // 确保图表正确渲染大小
            setTimeout(() => {
                lineChartInstance.value?.resize();
            }, 100);
        }
    });
};

// 在空闲时初始化图表，避免阻塞首屏（异步加载 echarts）
const scheduleChartsInit = () => {
    const run = async () => {
        await nextTick();
        // 并行初始化所有图表（echarts 会在内部缓存）
        await Promise.all([initDonutCharts(), initBarChart(), initLineChart()]);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
        w.requestIdleCallback(
            () => {
                run().catch(() => {
                    // 静默失败，不影响页面渲染
                });
            },
            { timeout: 300 }
        );
    } else {
        setTimeout(() => {
            run().catch(() => {
                // 静默失败，不影响页面渲染
            });
        }, 50);
    }
};

// 窗口大小变化时调整图表大小
const handleResize = () => {
    if (barChartInstance.value) {
        barChartInstance.value.resize();
    }
    if (lineChartInstance.value) {
        lineChartInstance.value.resize();
    }
    // 饼图也需要调整
    donutChartInstances.value.forEach(instance => {
        if (instance) instance.resize();
    });
};

onMounted(() => {
    // 预加载 echarts（在后台加载，不阻塞首屏）
    loadEcharts().catch(() => {
        // 静默失败
    });

    // 优先加载数据，数据到达后再初始化图表（避免空图表闪烁）
    loadDashboardData().then(() => {
        // 数据加载完成后，在空闲时初始化图表
        scheduleChartsInit();
    });

    // 延迟启动 SSE，避免与首屏请求竞争
    setTimeout(() => initSSE(), 2000);

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize);

    if (sseEventSource) {
        sseEventSource.close();
        sseEventSource = null;
    }

    // 销毁图表实例
    if (barChartInstance.value) {
        barChartInstance.value.dispose();
        barChartInstance.value = null;
    }
    if (lineChartInstance.value) {
        lineChartInstance.value.dispose();
        lineChartInstance.value = null;
    }
    donutChartInstances.value.forEach(instance => {
        if (instance) instance.dispose();
    });
    donutChartInstances.value = [];
});
</script>
