<template>
    <div class="space-y-4">
        <!-- KPI卡片区域 -->
        <a-row :gutter="16" class="mb-4">
            <a-col :span="24 / 5" v-for="kpi in kpiList" :key="kpi.key">
                <a-card class="rounded-lg">
                    <div class="flex items-center gap-4">
                        <div
                            class="w-[60px] h-[60px] rounded-lg flex items-center justify-center text-white text-2xl"
                            :style="{ backgroundColor: kpi.iconBg }"
                        >
                            <component :is="kpi.icon" />
                        </div>
                        <div class="flex-1">
                            <div class="text-sm text-gray-500 mb-2">{{ kpi.label }}</div>
                            <div class="text-2xl font-bold text-gray-800 mb-1">{{ kpi.value }}</div>
                            <div
                                class="text-xs flex items-center gap-1"
                                :class="kpi.trend > 0 ? 'text-green-500' : 'text-red-500'"
                            >
                                <ArrowUpOutlined v-if="kpi.trend > 0" />
                                <ArrowDownOutlined v-else />
                                <span>{{ Math.abs(kpi.trend) }}%</span>
                                <span class="text-gray-400">较上月</span>
                            </div>
                        </div>
                    </div>
                </a-card>
            </a-col>
        </a-row>

        <!-- 图表和侧边栏区域 -->
        <a-row :gutter="16" class="mt-4">
            <!-- 左侧图表区域 -->
            <a-col :span="18">
                <!-- 饼图区域 -->
                <a-row :gutter="16" class="mb-4">
                    <a-col :span="8" v-for="chart in donutCharts" :key="chart.key">
                        <a-card :title="chart.title" class="rounded-lg">
                            <div class="mb-4 text-sm text-gray-500">总计: {{ chart.total }} {{ chart.totalLabel }}</div>
                            <div :data-chart="chart.key" class="w-full h-[250px]"></div>
                        </a-card>
                    </a-col>
                </a-row>

                <!-- 趋势图区域 -->
                <a-row :gutter="16" class="mb-4">
                    <a-col :span="12">
                        <a-card title="工单产出统计" class="rounded-lg">
                            <div ref="barChartRef" class="w-full h-[300px]"></div>
                        </a-card>
                    </a-col>
                    <a-col :span="12">
                        <a-card title="产品合格率" class="rounded-lg">
                            <div ref="lineChartRef" class="w-full h-[300px]"></div>
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>

            <!-- 右侧边栏 -->
            <a-col :span="6">
                <a-card title="日历" class="rounded-lg">
                    <a-calendar v-model:value="calendarValue" :fullscreen="false" />
                </a-card>

                <a-card class="rounded-lg mt-4">
                    <template #title>
                        <a-tabs v-model:activeKey="todoActiveTab" size="small">
                            <a-tab-pane key="todo" :tab="`我的待办(${todoList.length})`" />
                            <a-tab-pane key="initiated" :tab="`我发起的(${initiatedList.length})`" />
                            <a-tab-pane key="handled" :tab="`我处理的(${handledList.length})`" />
                        </a-tabs>
                    </template>
                    <div class="max-h-[400px] overflow-y-auto">
                        <div
                            v-for="(item, index) in currentTodoList"
                            :key="index"
                            class="py-3 border-b border-gray-200 last:border-b-0 flex items-center justify-between"
                        >
                            <div class="flex-1 text-sm text-gray-800">{{ item.content }}</div>
                            <a-button type="link" size="small">去处理</a-button>
                        </div>
                    </div>
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
} from '@ant-design/icons-vue';
import * as echarts from 'echarts';

const calendarValue = ref<Dayjs>(dayjs('2025-01-07'));

// KPI数据
const kpiList = ref([
    {
        key: 'in-production',
        label: '在生产数量',
        value: '436',
        trend: 23,
        icon: SettingOutlined,
        iconBg: '#52c41a',
    },
    {
        key: 'unproduced',
        label: '未生产数量',
        value: '13',
        trend: 4,
        icon: ShopOutlined,
        iconBg: '#faad14',
    },
    {
        key: 'non-conforming',
        label: '不合格数量',
        value: '04',
        trend: 2,
        icon: FileTextOutlined,
        iconBg: '#ff4d4f',
    },
    {
        key: 'achievement-rate',
        label: '生产达成率',
        value: '92%',
        trend: 17,
        icon: BarChartOutlined,
        iconBg: '#1890ff',
    },
    {
        key: 'qualification-rate',
        label: '合格率',
        value: '97%',
        trend: 23,
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
    { content: '工单20250002302 待审批' },
    { content: '设备ZH023安灯异常,现已停工' },
    { content: '新的生产指令单等待派工' },
    { content: '生产工序说明更新了新版本,请及时上传...' },
    { content: '生产工序说明更新了新版本,请及时上传...' },
    { content: '生产工序说明更新了新版本,请及时上传...' },
]);

const initiatedList = ref([{ content: '我发起的任务1' }, { content: '我发起的任务2' }]);

const handledList = ref([
    { content: '我处理的任务1' },
    { content: '我处理的任务2' },
    { content: '我处理的任务3' },
    { content: '我处理的任务4' },
    { content: '我处理的任务5' },
    { content: '我处理的任务6' },
    { content: '我处理的任务7' },
    { content: '我处理的任务8' },
    { content: '我处理的任务9' },
    { content: '我处理的任务10' },
    { content: '我处理的任务11' },
    { content: '我处理的任务12' },
    { content: '我处理的任务13' },
    { content: '我处理的任务14' },
    { content: '我处理的任务15' },
    { content: '我处理的任务16' },
]);

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
                    },
                    series: [
                        {
                            type: 'pie',
                            radius: ['40%', '70%'],
                            avoidLabelOverlap: false,
                            itemStyle: {
                                borderRadius: 10,
                                borderColor: '#fff',
                                borderWidth: 2,
                            },
                            label: {
                                show: true,
                                formatter: '{b}: {c}',
                            },
                            data: chart.data,
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
            const values = [78, 70, 85, 90, 88, 92, 95, 89, 91, 86, 93, 87];
            const option = {
                tooltip: {
                    trigger: 'axis',
                },
                xAxis: {
                    type: 'category',
                    data: months,
                },
                yAxis: {
                    type: 'value',
                    max: 1000,
                },
                series: [
                    {
                        type: 'bar',
                        data: values.map(v => ({
                            value: v * 10,
                            label: {
                                show: true,
                                position: 'top',
                                formatter: `${v}%`,
                            },
                        })),
                        itemStyle: {
                            color: '#1890ff',
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
                xAxis: {
                    type: 'category',
                    data: months,
                },
                yAxis: {
                    type: 'value',
                    min: 0.0,
                    max: 1.0,
                    axisLabel: {
                        formatter: '{value}',
                    },
                },
                series: [
                    {
                        type: 'line',
                        data: values,
                        smooth: true,
                        itemStyle: {
                            color: '#52c41a',
                        },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                                    { offset: 1, color: 'rgba(82, 196, 26, 0.1)' },
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
