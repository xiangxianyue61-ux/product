<template>
    <div class="bg-[#f0f2f5] min-h-screen p-4">
        <!-- KPI卡片区域 -->
        <div class="flex gap-4 mb-4">
            <div v-for="kpi in kpiList" :key="kpi.key" class="flex-1">
                <a-card class="rounded-lg shadow-sm h-full" :bordered="false">
                    <div class="flex items-center gap-4">
                        <div
                            class="w-[60px] h-[60px] rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0"
                            :style="{ backgroundColor: kpi.iconBg }"
                        >
                            <component :is="kpi.icon" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm text-gray-500 mb-2">{{ kpi.label }}</div>
                            <div class="text-2xl font-bold text-gray-800 mb-1">
                                {{ kpi.value }}
                                <span v-if="kpi.unit" class="text-base ml-1">{{ kpi.unit }}</span>
                            </div>
                            <div
                                class="text-xs flex items-center gap-1"
                                :class="kpi.trendType === 'up' ? 'text-green-500' : 'text-red-500'"
                            >
                                <ArrowUpOutlined v-if="kpi.trendType === 'up'" />
                                <ArrowDownOutlined v-else />
                                <span>
                                    本月较上月{{ kpi.trendType === 'up' ? '增加' : '减少' }} {{ Math.abs(kpi.trend) }}%
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
                    <a-col :span="8" v-for="chart in donutCharts" :key="chart.key">
                        <a-card :title="chart.title" class="rounded-lg shadow-sm h-full" :bordered="false">
                            <div :data-chart="chart.key" class="w-full h-[250px]"></div>
                            <div class="mt-4 flex flex-wrap gap-4">
                                <div v-for="(item, index) in chart.data" :key="index" class="flex items-center gap-2">
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
                            <div class="text-sm text-gray-500 mb-2">近一年</div>
                            <div ref="barChartRef" class="w-full h-[300px]"></div>
                        </a-card>
                    </a-col>
                    <a-col :span="12">
                        <a-card title="产品合格率" class="rounded-lg shadow-sm h-full" :bordered="false">
                            <div class="text-sm text-gray-500 mb-2">近一年</div>
                            <div ref="lineChartRef" class="w-full h-[300px]"></div>
                        </a-card>
                    </a-col>
                </a-row>

                <!-- 生产进度表格 -->
                <a-card class="rounded-lg shadow-sm" :bordered="false">
                    <template #title>
                        <span>生产进度</span>
                    </template>
                    <template #extra>
                        <a class="text-blue-500 text-sm">全部 ></a>
                    </template>
                    <a-table :columns="progressColumns" :data-source="progressData" :pagination="false" size="small">
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
                    <a-calendar v-model:value="calendarValue" :fullscreen="false" />
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
                        <div
                            v-for="(item, index) in currentTodoList"
                            :key="index"
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
                            >
                                <div
                                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg mb-1"
                                    :style="{ backgroundColor: entry.color }"
                                >
                                    <component :is="entry.icon" />
                                </div>
                                <span class="text-xs text-gray-600 text-center leading-tight">{{ entry.label }}</span>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
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
    CalendarOutlined,
    InboxOutlined,
    SafetyOutlined,
    TeamOutlined,
    ToolOutlined,
    WarningOutlined,
} from '@ant-design/icons-vue';
import * as echarts from 'echarts';

const calendarValue = ref<Dayjs>(dayjs('2025-01-07'));

// KPI数据
const kpiList = ref([
    {
        key: 'in-production',
        label: '在生产数量',
        value: '436',
        unit: '个',
        trend: 23,
        trendType: 'up',
        icon: SettingOutlined,
        iconBg: '#52c41a',
    },
    {
        key: 'unproduced',
        label: '未生产数量',
        value: '13',
        unit: '个',
        trend: 4,
        trendType: 'down',
        icon: ShopOutlined,
        iconBg: '#faad14',
    },
    {
        key: 'non-conforming',
        label: '不合格数量',
        value: '04',
        unit: '个',
        trend: 2,
        trendType: 'up',
        icon: FileTextOutlined,
        iconBg: '#722ed1',
    },
    {
        key: 'achievement-rate',
        label: '生产达成率',
        value: '92%',
        unit: '',
        trend: 17,
        trendType: 'up',
        icon: BarChartOutlined,
        iconBg: '#1890ff',
    },
    {
        key: 'qualification-rate',
        label: '合格率',
        value: '97%',
        unit: '',
        trend: 23,
        trendType: 'up',
        icon: CheckCircleOutlined,
        iconBg: '#52c41a',
    },
]);

// 饼图数据
const donutCharts = ref([
    {
        key: 'work-order',
        title: '工单统计',
        total: 198,
        totalLabel: '全部工单',
        colors: ['#1890ff', '#faad14', '#13c2c2', '#ff4d4f'],
        data: [
            { name: '已完成', value: 129 },
            { name: '未排产', value: 25 },
            { name: '未生产', value: 22 },
            { name: '未完成', value: 12 },
        ],
    },
    {
        key: 'product',
        title: '产品统计',
        total: 6543,
        totalLabel: '产品总数',
        colors: ['#722ed1', '#52c41a', '#531dab', '#13c2c2'],
        data: [
            { name: 'AA产品', value: 2229 },
            { name: 'BB产品', value: 2588 },
            { name: 'CC产品', value: 798 },
            { name: 'DD产品', value: 1081 },
        ],
    },
    {
        key: 'defect',
        title: '缺陷统计',
        total: 57,
        totalLabel: '缺陷总数',
        colors: ['#fa8c16', '#1890ff', '#52c41a', '#722ed1'],
        data: [
            { name: '外观缺陷', value: 18 },
            { name: '破损裂痕', value: 19 },
            { name: '生产瑕疵', value: 11 },
            { name: '其他缺陷', value: 9 },
        ],
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

const progressData = ref([
    {
        key: '1',
        code: 'GD74321-003',
        name: '市场工单1',
        progress: 59,
        product: 'AA产品',
        quantity: 80,
        priority: '一级',
        date: '2025-08-30',
    },
    {
        key: '2',
        code: 'GD74321-393',
        name: '市场工单2',
        progress: 88,
        product: 'BB产品',
        quantity: 59,
        priority: '三级',
        date: '2025-08-30',
    },
    {
        key: '3',
        code: 'GD74321-341',
        name: '市场工单3',
        progress: 58,
        product: 'CC产品',
        quantity: 80,
        priority: '二级',
        date: '2025-08-30',
    },
    {
        key: '4',
        code: 'GD74321-987',
        name: '市场工单4',
        progress: 100,
        product: 'DD产品',
        quantity: 50,
        priority: '三级',
        date: '2025-08-30',
    },
]);

// 快捷入口
const quickEntries = ref([
    { key: 'order', label: '生产订单', icon: ShoppingOutlined, color: '#fa8c16' },
    { key: 'report', label: '报工管理', icon: FileAddOutlined, color: '#1890ff' },
    { key: 'plan', label: '生产计划', icon: SettingOutlined, color: '#52c41a' },
    { key: 'warehouse', label: '入库管理', icon: InboxOutlined, color: '#722ed1' },
    { key: 'quality', label: '质量管理', icon: SafetyOutlined, color: '#52c41a' },
    { key: 'team', label: '生产班组', icon: TeamOutlined, color: '#52c41a' },
    { key: 'process', label: '工艺管理', icon: ToolOutlined, color: '#1890ff' },
    { key: 'anomaly', label: '异常管理', icon: WarningOutlined, color: '#52c41a' },
]);

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
const donutChartInstances = ref<echarts.ECharts[]>([]);

// 初始化饼图
const initDonutCharts = () => {
    nextTick(() => {
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
                            left: '50%',
                            top: '45%',
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
                            left: '50%',
                            top: '58%',
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

// 初始化柱状图
const initBarChart = () => {
    nextTick(() => {
        if (barChartRef.value) {
            const chartInstance = echarts.init(barChartRef.value);
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            const percentages = [78, 70, 79, 82, 78, 63, 77, 83, 80, 86, 76, 80];
            const values = percentages.map(p => p * 10);
            const option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: (params: Array<{ name: string; value: number }>) => {
                        const param = params[0];
                        if (!param) {
                            return '';
                        }
                        const index = months.indexOf(param.name);
                        return `${param.name}<br/>${percentages[index]}%`;
                    },
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                },
                xAxis: {
                    type: 'category',
                    data: months,
                    axisLine: {
                        lineStyle: {
                            color: '#e8e8e8',
                        },
                    },
                },
                yAxis: {
                    type: 'value',
                    max: 1000,
                    axisLine: {
                        lineStyle: {
                            color: '#e8e8e8',
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f0f0f0',
                        },
                    },
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
                        itemStyle: {
                            color: '#52c41a',
                            borderRadius: [4, 4, 0, 0],
                        },
                    },
                ],
            };
            chartInstance.setOption(option);
        }
    });
};

// 初始化折线图
const initLineChart = () => {
    nextTick(() => {
        if (lineChartRef.value) {
            const chartInstance = echarts.init(lineChartRef.value);
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            const values = [0.92, 0.94, 0.958, 0.95, 0.96, 0.97, 0.98, 0.97, 0.96, 0.98, 0.97, 0.99];
            const option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: (params: Array<{ name: string; value: number }>) => {
                        const param = params[0];
                        if (!param) {
                            return '';
                        }
                        return `${param.name}<br/>${(param.value * 100).toFixed(1)}%`;
                    },
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                },
                xAxis: {
                    type: 'category',
                    data: months,
                    axisLine: {
                        lineStyle: {
                            color: '#e8e8e8',
                        },
                    },
                },
                yAxis: {
                    type: 'value',
                    min: 0.0,
                    max: 1.0,
                    axisLabel: {
                        formatter: '{value}',
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#e8e8e8',
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f0f0f0',
                        },
                    },
                },
                series: [
                    {
                        type: 'line',
                        data: values,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 6,
                        itemStyle: {
                            color: '#faad14',
                        },
                        lineStyle: {
                            color: '#faad14',
                            width: 2,
                        },
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
            chartInstance.setOption(option);
        }
    });
};

onMounted(() => {
    initDonutCharts();
    initBarChart();
    initLineChart();
});
</script>
